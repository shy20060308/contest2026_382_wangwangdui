import storage from '@system.storage'

var queue = require('./internal/operation_queue').createQueue()
var memoryCache = {}

function parseJson(key, value) {
  try {
    return JSON.parse(value)
  } catch (error) {
    throw new Error('Invalid persisted JSON for ' + key)
  }
}

function storageFailure(action, key, data, code) {
  var error = data instanceof Error ? data : new Error('storage.' + action + ' failed for ' + key)
  if (code !== undefined) error.code = code
  return error
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

function readString(key, success, fail) {
  if (memoryCache[key] !== undefined) {
    success(memoryCache[key])
    return
  }
  try {
    if (!storage || !storage.get) {
      fail(new Error('storage.get unavailable for ' + key))
      return
    }
    storage.get({
      key: key,
      success: function (value) {
        if (value !== '' && value !== undefined) memoryCache[key] = value
        success(value)
      },
      fail: function (data, code) {
        fail(storageFailure('get', key, data, code))
      }
    })
  } catch (error) {
    fail(error)
  }
}

function readJSON(key, fallback, success, fail) {
  readString(key, function (value) {
    if (value === '' || value === undefined || value === null) {
      success(fallback !== undefined ? fallback : null)
      return
    }
    try {
      success(parseJson(key, value))
    } catch (error) {
      fail(error)
    }
  }, fail)
}

var adapter = {
  isAvailable: function () {
    return !!(storage && storage.get && storage.set)
  },

  set: function (key, value, callback) {
    queue.enqueue(key, function () {
      var stringValue
      try {
        stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      } catch (error) {
        queue.complete(key, callback, [makeResult(false, false, error)])
        return
      }
      persistString(key, stringValue, function (result) {
        queue.complete(key, callback, [result])
      })
    })
  },

  get: function (key, callback) {
    if (!callback) return
    readString(key, callback, function (error) { throw error })
  },

  getJSON: function (key, callback, fallback) {
    readJSON(key, fallback, callback, function (error) { throw error })
  },

  delete: function (key, callback) {
    queue.enqueue(key, function () {
      delete memoryCache[key]
      try {
        if (storage && storage.delete) {
          storage.delete({
            key: key,
            success: function () {
              queue.complete(key, callback, [makeResult(true, false)])
            },
            fail: function (data, code) {
              queue.complete(key, callback, [makeResult(false, true, storageFailure('delete', key, data, code))])
            }
          })
          return
        }
      } catch (error) {
        queue.complete(key, callback, [makeResult(false, true, error)])
        return
      }
      queue.complete(key, callback, [makeResult(false, true, new Error('storage.delete unavailable'))])
    })
  },

  updateJSON: function (key, fallback, updater, callback) {
    queue.enqueue(key, function () {
      readJSON(key, fallback, function (current) {
        var nextValue
        var stringValue
        try {
          nextValue = updater(current)
          stringValue = JSON.stringify(nextValue)
        } catch (error) {
          queue.complete(key, callback, [current, makeResult(false, false, error)])
          return
        }
        persistString(key, stringValue, function (result) {
          queue.complete(key, callback, [nextValue, result])
        })
      }, function (error) {
        queue.complete(key, callback, [null, makeResult(false, false, error)])
      })
    })
  }
}

export default adapter
