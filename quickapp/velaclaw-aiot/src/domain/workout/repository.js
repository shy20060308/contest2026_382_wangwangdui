import storage from '../../capabilities/storage'
var stateMachineCore = require('./state_machine_core')

var ACTIVE_KEY = 'active_workout_v4'
var RECORDS_KEY = 'workout_records_v4'
var MAX_RECORDS = 30
var activeStatus = 'loading'
var activeError = null
var recordsStatus = 'loading'
var recordsError = null

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function requireNumber(name, value, integer) {
  if (typeof value !== 'number' || !isFinite(value) || value < 0 || (integer && Math.round(value) !== value)) throw new Error('Invalid V4 workout record field: ' + name)
  return value
}

function requireNullableNumber(name, value, integer) {
  if (value === null) return null
  return requireNumber(name, value, integer)
}

function requirePoint(point) {
  if (point === null) return null
  if (!point || typeof point !== 'object' || Array.isArray(point)) throw new Error('Invalid V4 workout record field: gpsPoint')
  if (typeof point.latitude !== 'number' || !isFinite(point.latitude) || typeof point.longitude !== 'number' || !isFinite(point.longitude)) throw new Error('Invalid V4 workout record field: gpsPoint')
  return point
}

function requireRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid V4 workout record')
  if (typeof record.id !== 'string' || !record.id) throw new Error('Invalid V4 workout record field: id')
  if (record.type !== 'walk' && record.type !== 'run') throw new Error('Invalid V4 workout record field: type')
  if (record.distanceSource !== 'gps' && record.distanceSource !== 'unavailable') throw new Error('Invalid V4 workout record field: distanceSource')
  if (record.heartSource !== 'official' && record.heartSource !== 'none') throw new Error('Invalid V4 workout record field: heartSource')
  if (typeof record.synced !== 'boolean') throw new Error('Invalid V4 workout record field: synced')
  requireNumber('startTime', record.startTime, false)
  requireNumber('endTime', record.endTime, false)
  requireNumber('durationSec', record.durationSec, true)
  requireNullableNumber('steps', record.steps, true)
  requireNullableNumber('calories', record.calories, true)
  requireNullableNumber('distanceMeters', record.distanceMeters, false)
  requireNumber('gpsDistanceMeters', record.gpsDistanceMeters, false)
  requirePoint(record.gpsPoint)
  if (record.avgHeartRate !== null && (typeof record.avgHeartRate !== 'number' || !isFinite(record.avgHeartRate) || record.avgHeartRate <= 0)) throw new Error('Invalid V4 workout record field: avgHeartRate')
  return record
}

function requireRecords(value) {
  if (!Array.isArray(value)) throw new Error('V4 workout records persistence must be an array')
  for (var i = 0; i < value.length; i++) requireRecord(value[i])
  return value
}

function sameRecord(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function state(status, error) {
  return {
    status: status,
    blocked: status === 'corrupt' || status === 'io-error' || status === 'recovering',
    recoverable: status === 'corrupt',
    errorCode: error && error.code !== undefined ? String(error.code) : '',
    errorMessage: error && error.message ? error.message : ''
  }
}

function aggregateState() {
  var status = 'ok'
  var error = null
  if (activeStatus === 'recovering' || recordsStatus === 'recovering') status = 'recovering'
  else if (activeStatus === 'corrupt' || recordsStatus === 'corrupt') status = 'corrupt'
  else if (activeStatus === 'io-error' || recordsStatus === 'io-error') status = 'io-error'
  else if (activeStatus === 'loading' || recordsStatus === 'loading') status = 'loading'
  else if (activeStatus === 'missing' && recordsStatus === 'missing') status = 'missing'
  error = activeError || recordsError
  var value = state(status, error)
  value.activeStatus = activeStatus
  value.recordsStatus = recordsStatus
  value.recoverable = activeStatus === 'corrupt' || recordsStatus === 'corrupt'
  return value
}

function markActive(status, error) { activeStatus = status; activeError = error || null }
function markRecords(status, error) { recordsStatus = status; recordsError = error || null }
function blockedResult(error, label) { var reason = error || new Error(label + ' persistence is blocked'); reason.code = reason.code || 'ESTORAGE_RECOVERY_REQUIRED'; return { persisted: false, memoryOnly: true, error: reason } }
function persisted(result) { return result === true || !!(result && result.persisted) }
function looksCorrupt(error) { var message = error && error.message ? error.message : ''; return message.indexOf('Invalid persisted JSON') >= 0 || message.indexOf('Invalid V4 workout') >= 0 || message.indexOf('Conflicting workout record id') >= 0 }

function classifyRecordsWrite(result) {
  if (persisted(result)) { markRecords('ok', null); return }
  var error = result && result.error ? result.error : new Error('Workout records persistence failed')
  if (looksCorrupt(error)) markRecords('corrupt', error)
  else markRecords('io-error', error)
}

function loadRecordsResult(callback) {
  storage.getJSONResult(RECORDS_KEY, function (records, result) {
    if (!result || !result.ok) {
      markRecords(result && result.status ? result.status : 'io-error', result && result.error ? result.error : new Error('Workout records read failed'))
      if (callback) callback([], state(recordsStatus, recordsError))
      return
    }
    try {
      var valid = requireRecords(records)
      markRecords(result.status || 'ok', null)
      if (callback) callback(valid, state(recordsStatus, null))
    } catch (error) {
      markRecords('corrupt', error)
      if (callback) callback([], state(recordsStatus, error))
    }
  }, [])
}

function recoverActive(done) {
  markActive('recovering', null)
  storage.quarantine(ACTIVE_KEY, function (result) {
    if (!result || !result.ok) {
      var error = result && result.error ? result.error : new Error('Active workout quarantine failed')
      markActive('corrupt', error)
      done(false, result && result.backupKey ? result.backupKey : '', error)
      return
    }
    markActive('missing', null)
    done(true, result.backupKey || '', null)
  })
}

function recoverRecords(done) {
  markRecords('recovering', null)
  storage.quarantine(RECORDS_KEY, function (result) {
    if (!result || !result.ok) {
      var error = result && result.error ? result.error : new Error('Workout records quarantine failed')
      markRecords('corrupt', error)
      done(false, result && result.backupKey ? result.backupKey : '', error)
      return
    }
    storage.set(RECORDS_KEY, [], function (writeResult) {
      if (persisted(writeResult)) {
        markRecords('ok', null)
        done(true, result.backupKey || '', null)
        return
      }
      var error = writeResult && writeResult.error ? writeResult.error : new Error('Workout records recovery reset write failed')
      markRecords('io-error', error)
      done(false, result.backupKey || '', error)
    })
  })
}

function recoverPersistence(callback) {
  var tasks = []
  if (activeStatus === 'corrupt') tasks.push(recoverActive)
  if (recordsStatus === 'corrupt') tasks.push(recoverRecords)
  if (!tasks.length) {
    if (callback) callback({ ok: false, status: 'not-recoverable', backupKeys: [], error: activeError || recordsError })
    return
  }
  var index = 0
  var failed = false
  var lastError = null
  var backups = []
  function next(ok, backupKey, error) {
    if (backupKey) backups.push(backupKey)
    if (ok === false) { failed = true; lastError = error || lastError }
    if (index >= tasks.length) {
      if (callback) callback({ ok: !failed, status: failed ? 'error' : 'recovered', backupKeys: backups, error: lastError })
      return
    }
    var task = tasks[index++]
    task(next)
  }
  next(true, '', null)
}

export default {
  saveActive: function (session, callback) {
    if (activeStatus === 'corrupt' || activeStatus === 'io-error' || activeStatus === 'recovering') {
      if (callback) callback(blockedResult(activeError, 'Active workout'))
      return
    }
    storage.set(ACTIVE_KEY, session, function (result) {
      if (persisted(result)) markActive('ok', null)
      else if (result && result.error) markActive('io-error', result.error)
      if (callback) callback(result)
    })
  },

  loadActive: function (callback) {
    storage.getJSONResult(ACTIVE_KEY, function (session, result) {
      if (!result || !result.ok) {
        markActive(result && result.status ? result.status : 'io-error', result && result.error ? result.error : new Error('Active workout read failed'))
        if (callback) callback(null, state(activeStatus, activeError))
        return
      }
      if (session !== null && session !== undefined && !stateMachineCore.validActiveSession(session)) {
        var error = new Error('Invalid active workout persistence')
        markActive('corrupt', error)
        if (callback) callback(null, state(activeStatus, error))
        return
      }
      markActive(result.status || 'ok', null)
      if (callback) callback(session, state(activeStatus, null))
    }, null)
  },

  markActiveCorrupt: function (error) {
    markActive('corrupt', error || new Error('Invalid active workout persistence'))
  },

  clearActive: function (callback) {
    if (activeStatus === 'corrupt' || activeStatus === 'io-error' || activeStatus === 'recovering') {
      if (callback) callback(blockedResult(activeError, 'Active workout'))
      return
    }
    storage.delete(ACTIVE_KEY, function (result) {
      if (persisted(result)) markActive('missing', null)
      else if (result && result.error) markActive('io-error', result.error)
      if (callback) callback(result)
    })
  },

  saveRecord: function (record, callback) {
    requireRecord(record)
    var savedRecord = record
    if (recordsStatus === 'corrupt' || recordsStatus === 'io-error' || recordsStatus === 'recovering') {
      if (callback) callback(clone(savedRecord), blockedResult(recordsError, 'Workout records'))
      return
    }
    storage.updateJSON(RECORDS_KEY, [], function (records) {
      var next = requireRecords(records)
      for (var i = 0; i < next.length; i++) {
        if (next[i].id !== record.id) continue
        if (!sameRecord(next[i], record)) throw new Error('Conflicting workout record id: ' + record.id)
        savedRecord = next[i]
        return next
      }
      next.unshift(record)
      return next.length > MAX_RECORDS ? next.slice(0, MAX_RECORDS) : next
    }, function (records, result) {
      classifyRecordsWrite(result)
      if (callback) callback(clone(savedRecord), result)
    })
  },

  getRecords: function (callback) {
    loadRecordsResult(function (records, persistence) {
      if (callback) callback(records, persistence)
    })
  },

  markAllSynced: function (callback) {
    if (recordsStatus === 'corrupt' || recordsStatus === 'io-error' || recordsStatus === 'recovering') {
      if (callback) callback([], blockedResult(recordsError, 'Workout records'))
      return
    }
    storage.updateJSON(RECORDS_KEY, [], function (records) {
      var next = requireRecords(records)
      for (var i = 0; i < next.length; i++) next[i].synced = true
      return next
    }, function (records, result) {
      classifyRecordsWrite(result)
      if (callback) callback(clone(records || []), result)
    })
  },

  getPersistenceState: aggregateState,
  recoverPersistence: recoverPersistence
}
