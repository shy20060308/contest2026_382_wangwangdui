import storage from '@system.storage'

var memoryCache = {}
var operationQueues = {}

function parseJson(key, value) {
  try {
    return JSON.parse(value)
  } catch (error) {
    throw new Error('Invalid persisted JSON for ' + key)
  }
}

function finishOperation(key) {
  var queue = operationQueues[key]
  if (!queue) return
  queue.shift()
  if (queue.length === 0) {
    delete operationQueues[key]
    return
  }
  queue[0]()
}

function enqueueOperation(key, operation) {
  if (!operationQueues[key]) operationQueues[key] = []
  operationQueues[key].push(operation)
  if (operationQueues[key].length === 1) operation()
}

function makeResult(persisted, memoryOnly, error) {
  return { persisted: persisted, memoryOnly: memoryOnly, error: error || null }
}

function persistString(key, stringValue, callback) {
  memoryCache[key] = stringValue
  try {
    if (storage && storage.set) {
      storage.set({
        key: key,
        value: stringValue,
        success: function () { callback(makeResult(true, false)) },
        fail: function (error) { callback(makeResult(false, true, error)) }
      })
      return
    }
  } catch (error) {
    callback(makeResult(false, true, error))
    return
  }
  callback(makeResult(false, true, new Error('storage.set unavailable')))
}

var adapter = {
  set: function (key, value, callback) {
    enqueueOperation(key, function () {
      var stringValue
      try {
        stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      } catch (error) {
        if (callback) callback(makeResult(false, false, error))
        finishOperation(key)
        return
      }
      persistString(key, stringValue, function (result) {
        if (callback) callback(result)
        finishOperation(key)
      })
    })
  },

  get: function (key, callback) {
    if (!callback) return
    if (memoryCache[key] !== undefined) {
      callback(memoryCache[key])
      return
    }
    try {
      if (storage && storage.get) {
        storage.get({
          key: key,
          success: function (value) {
            if (value !== '' && value !== undefined) memoryCache[key] = value
            callback(value)
          },
          fail: function () {
            callback(memoryCache[key] !== undefined ? memoryCache[key] : '')
          }
        })
        return
      }
    } catch (error) {}
    callback(memoryCache[key] !== undefined ? memoryCache[key] : '')
  },

  getJSON: function (key, callback, fallback) {
    this.get(key, function (value) {
      if (value === '' || value === undefined || value === null) {
        callback(fallback !== undefined ? fallback : null)
        return
      }
      callback(parseJson(key, value))
    })
  },

  delete: function (key, callback) {
    enqueueOperation(key, function () {
      delete memoryCache[key]
      try {
        if (storage && storage.delete) {
          storage.delete({
            key: key,
            success: function () {
              if (callback) callback(makeResult(true, false))
              finishOperation(key)
            },
            fail: function (error) {
              if (callback) callback(makeResult(false, false, error))
              finishOperation(key)
            }
          })
          return
        }
      } catch (error) {
        if (callback) callback(makeResult(false, false, error))
        finishOperation(key)
        return
      }
      if (callback) callback(makeResult(false, false, new Error('storage.delete unavailable')))
      finishOperation(key)
    })
  },

  updateJSON: function (key, fallback, updater, callback) {
    enqueueOperation(key, function () {
      adapter.getJSON(key, function (current) {
        var nextValue
        var stringValue
        try {
          nextValue = updater(current)
          stringValue = JSON.stringify(nextValue)
        } catch (error) {
          if (callback) callback(current, makeResult(false, false, error))
          finishOperation(key)
          return
        }
        persistString(key, stringValue, function (result) {
          if (callback) callback(nextValue, result)
          finishOperation(key)
        })
      }, fallback)
    })
  }
}

export default adapter
