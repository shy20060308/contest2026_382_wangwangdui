import storage from '@system.storage'

var STORAGE_OPERATION_TIMEOUT_MS = 8000
var queue = require('./internal/operation_queue').createQueue({ timeoutMs: STORAGE_OPERATION_TIMEOUT_MS })
var readResult = require('./internal/storage_read_result')
var memoryCache = {}

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

function readStructured(key, fallback, classifier, callback) {
  readString(key, function (value) {
    var classified = classifier(key, value, fallback)
    callback(classified.value, classified.result)
  }, function (error) {
    var failed = readResult.io(fallback, error)
    callback(failed.value, failed.result)
  })
}

function classifyRaw(key, value, fallback) {
  return readResult.raw(value, fallback)
}

function classifyJson(key, value, fallback) {
  return readResult.json(key, value, fallback)
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

  getResult: function (key, callback, fallback) {
    if (!callback) return
    readStructured(key, fallback, classifyRaw, callback)
  },

  getJSONResult: function (key, callback, fallback) {
    if (!callback) return
    readStructured(key, fallback, classifyJson, callback)
  },

  get: function (key, callback) {
    if (!callback) return
    adapter.getResult(key, function (value, result) {
      if (!result.ok) throw result.error
      callback(value)
    })
  },

  getJSON: function (key, callback, fallback) {
    if (!callback) return
    adapter.getJSONResult(key, function (value, result) {
      if (!result.ok) throw result.error
      callback(value)
    }, fallback)
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

  quarantine: function (key, callback) {
    readString(key, function (raw) {
      if (raw === '' || raw === undefined || raw === null) {
        if (callback) callback({ ok: false, status: 'missing', backupKey: '', error: null })
        return
      }
      var backupKey = key + '__corrupt_backup'
      var envelope = { sourceKey: key, quarantinedAt: Date.now(), raw: raw }
      adapter.set(backupKey, envelope, function (backupResult) {
        if (!backupResult || !backupResult.persisted) {
          if (callback) callback({ ok: false, status: 'io-error', backupKey: backupKey, error: backupResult && backupResult.error ? backupResult.error : new Error('storage quarantine backup failed') })
          return
        }
        adapter.delete(key, function (deleteResult) {
          if (!deleteResult || !deleteResult.persisted) {
            if (callback) callback({ ok: false, status: 'io-error', backupKey: backupKey, error: deleteResult && deleteResult.error ? deleteResult.error : new Error('storage quarantine delete failed') })
            return
          }
          if (callback) callback({ ok: true, status: 'quarantined', backupKey: backupKey, error: null })
        })
      })
    }, function (error) {
      if (callback) callback({ ok: false, status: 'io-error', backupKey: '', error: error })
    })
  },

  updateJSON: function (key, fallback, updater, callback) {
    var timeoutValue = null
    var memoryUpdated = false
    queue.enqueue(key, function (token) {
      adapter.getJSONResult(key, function (current, readState) {
        if (!queue.isActive(key, token)) return
        if (!readState.ok) {
          queue.complete(key, token, callback, [null, makeResult(false, false, readState.error)])
          return
        }
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
      }, fallback)
    }, function () {
      if (callback) callback(timeoutValue, makeResult(false, memoryUpdated, storageTimeout('update', key)))
    })
  }
}

export default adapter
