import storage from '../../capabilities/storage'
var dayWindow = require('../calendar/day_window')

var HISTORY_KEY = 'activity_history_v4'
var HISTORY_DAYS = 7
var persistenceStatus = 'loading'
var persistenceError = null

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function requireInteger(name, value, min, max) {
  if (typeof value !== 'number' || !isFinite(value) || Math.round(value) !== value || value < min || (max !== undefined && value > max)) {
    throw new Error('Invalid V4 history field: ' + name)
  }
  return value
}

function requireHeartRate(name, value) {
  if (value === null) return null
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) throw new Error('Invalid V4 history field: ' + name)
  return value
}

function requireRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid V4 history record')
  if (!dayWindow.parseDateKey(record.date)) throw new Error('Invalid V4 history field: date')
  return {
    date: record.date,
    steps: requireInteger('steps', record.steps, 0),
    calories: requireInteger('calories', record.calories, 0),
    standHours: requireInteger('standHours', record.standHours, 0),
    avgHeartRate: requireHeartRate('avgHeartRate', record.avgHeartRate),
    minHeartRate: requireHeartRate('minHeartRate', record.minHeartRate),
    maxHeartRate: requireHeartRate('maxHeartRate', record.maxHeartRate),
    goalPercent: requireInteger('goalPercent', record.goalPercent, 0, 100)
  }
}

function requireHistory(stored, today) {
  if (!Array.isArray(stored)) throw new Error('V4 history persistence must be an array')
  var validated = []
  var seen = {}
  for (var i = 0; i < stored.length; i++) {
    var record = requireRecord(stored[i])
    if (seen[record.date]) throw new Error('Duplicate V4 history date: ' + record.date)
    seen[record.date] = true
    validated.push(record)
  }
  return dayWindow.filterRecent(validated, today || dayWindow.dateKey(new Date()), HISTORY_DAYS)
}

function todayRecord(activity, date) {
  return {
    date: date,
    steps: activity.steps,
    calories: activity.calories,
    standHours: activity.standHours,
    avgHeartRate: null,
    minHeartRate: null,
    maxHeartRate: null,
    goalPercent: activity.goalPercent
  }
}

function upsertToday(history, activitySnapshot, today) {
  var key = today || dayWindow.dateKey(new Date())
  var source = requireHistory(history, key)
  var merged = []
  for (var i = 0; i < source.length; i++) if (source[i].date !== key) merged.push(source[i])
  merged.push(todayRecord(activitySnapshot, key))
  return requireHistory(merged, key)
}

function persistenceSnapshot() {
  return {
    status: persistenceStatus,
    blocked: persistenceStatus === 'corrupt' || persistenceStatus === 'io-error' || persistenceStatus === 'recovering',
    recoverable: persistenceStatus === 'corrupt',
    errorCode: persistenceError && persistenceError.code !== undefined ? String(persistenceError.code) : '',
    errorMessage: persistenceError && persistenceError.message ? persistenceError.message : ''
  }
}

function markPersistence(status, error) {
  persistenceStatus = status
  persistenceError = error || null
}

function corrupt(error) {
  markPersistence('corrupt', error)
  return persistenceSnapshot()
}

function blockedResult() {
  var error = persistenceError || new Error('History persistence is blocked: ' + persistenceStatus)
  error.code = error.code || 'ESTORAGE_RECOVERY_REQUIRED'
  return { persisted: false, memoryOnly: true, error: error }
}

function loadHistoryResult(callback) {
  var today = dayWindow.dateKey(new Date())
  storage.getJSONResult(HISTORY_KEY, function (stored, result) {
    if (!result || !result.ok) {
      markPersistence(result && result.status ? result.status : 'io-error', result && result.error ? result.error : new Error('History persistence read failed'))
      if (callback) callback([], persistenceSnapshot())
      return
    }
    try {
      var history = requireHistory(stored, today)
      markPersistence(result.status || 'ok', null)
      if (callback) callback(history, persistenceSnapshot())
    } catch (error) {
      if (callback) callback([], corrupt(error))
    }
  }, [])
}

function loadHistory(callback) {
  loadHistoryResult(function (history, state) {
    if (callback) callback(history, state)
  })
}

function saveToday(activitySnapshot, callback) {
  if (!activitySnapshot) throw new Error('History saveToday requires canonical Activity snapshot')
  var today = dayWindow.dateKey(new Date())
  loadHistoryResult(function (stored) {
    if (persistenceSnapshot().blocked) {
      if (callback) callback([], blockedResult())
      return
    }
    var history
    try {
      history = upsertToday(stored, activitySnapshot, today)
    } catch (error) {
      corrupt(error)
      if (callback) callback([], blockedResult())
      return
    }
    storage.set(HISTORY_KEY, history, function (result) {
      if (result && result.persisted) markPersistence('ok', null)
      else if (result && result.error) markPersistence('io-error', result.error)
      if (callback) callback(clone(history), result)
    })
  })
}

function recoverPersistence(callback) {
  if (persistenceStatus !== 'corrupt') {
    if (callback) callback({ ok: false, status: 'not-recoverable', backupKey: '', error: persistenceError })
    return
  }
  persistenceStatus = 'recovering'
  storage.quarantine(HISTORY_KEY, function (result) {
    if (!result || !result.ok) {
      var error = result && result.error ? result.error : new Error('History quarantine failed')
      markPersistence('corrupt', error)
      if (callback) callback({ ok: false, status: result && result.status ? result.status : 'io-error', backupKey: result && result.backupKey ? result.backupKey : '', error: error })
      return
    }
    storage.set(HISTORY_KEY, [], function (writeResult) {
      if (writeResult && writeResult.persisted) {
        markPersistence('ok', null)
        if (callback) callback({ ok: true, status: 'recovered', backupKey: result.backupKey || '', error: null })
        return
      }
      var error = writeResult && writeResult.error ? writeResult.error : new Error('History recovery reset write failed')
      markPersistence('io-error', error)
      if (callback) callback({ ok: false, status: 'io-error', backupKey: result.backupKey || '', error: error })
    })
  })
}

export default {
  saveToday: saveToday,
  getHistory: loadHistory,
  getHistoryResult: loadHistoryResult,
  getPersistenceState: persistenceSnapshot,
  recoverPersistence: recoverPersistence
}
