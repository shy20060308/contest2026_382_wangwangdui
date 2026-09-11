import storage from '@system.storage'

var STORAGE_OPERATION_TIMEOUT_MS = 8000
var queue = require('./internal/operation_queue').createQueue({ timeoutMs: STORAGE_OPERATION_TIMEOUT_MS })
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

function storageTimeout(action, key) {
  var error = new Error('storage.' + action + ' timed out for ' + key)
  error.code = 'ETIMEDOUT'
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
    var memoryWritten = false
    queue.enqueue(key, function (token) {
      var stringValue
      try {
        stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      } catch (error) {
        queue.complete(key, token, callback, [makeResult(false, false, error)])
        return
      }
      memoryWritten = true
      persistString(key, stringValue, function (result) {
        queue.complete(key, token, callback, [result])
      })
    }, function () {
      if (callback) callback(makeResult(false, memoryWritten, storageTimeout('set', key)))
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
    var memoryDeleted = false
    queue.enqueue(key, function (token) {
      delete memoryCache[key]
      memoryDeleted = true
      try {
        if (storage && storage.delete) {
          storage.delete({
            key: key,
            success: function () {
              queue.complete(key, token, callback, [makeResult(true, false)])
            },
            fail: function (data, code) {
              queue.complete(key, token, callback, [makeResult(false, true, storageFailure('delete', key, data, code))])
            }
          })
          return
        }
      } catch (error) {
        queue.complete(key, token, callback, [makeResult(false, true, error)])
        return
      }
      queue.complete(key, token, callback, [makeResult(false, true, new Error('storage.delete unavailable'))])
    }, function () {
      if (callback) callback(makeResult(false, memoryDeleted, storageTimeout('delete', key)))
    })
  },

  updateJSON: function (key, fallback, updater, callback) {
    var timeoutValue = null
    var memoryUpdated = false
    queue.enqueue(key, function (token) {
      readJSON(key, fallback, function (current) {
        if (!queue.isActive(key, token)) return
        var nextValue
        var stringValue
        try {
          nextValue = updater(current)
          stringValue = JSON.stringify(nextValue)
        } catch (error) {
          queue.complete(key, token, callback, [current, makeResult(false, false, error)])
          return
        }
        timeoutValue = nextValue
        memoryUpdated = true
        persistString(key, stringValue, function (result) {
          queue.complete(key, token, callback, [nextValue, result])
        })
      }, function (error) {
        if (!queue.isActive(key, token)) return
        queue.complete(key, token, callback, [null, makeResult(false, false, error)])
      })
    }, function () {
      if (callback) callback(timeoutValue, makeResult(false, memoryUpdated, storageTimeout('update', key)))
    })
  }
}

export default adapter
