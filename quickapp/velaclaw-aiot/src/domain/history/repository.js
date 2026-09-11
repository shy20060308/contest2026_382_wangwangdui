import storage from '../../capabilities/storage'
var dayWindow = require('../calendar/day_window')

var HISTORY_KEY = 'activity_history_v4'
var HISTORY_DAYS = 7

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

function loadHistory(callback) {
  var today = dayWindow.dateKey(new Date())
  storage.getJSON(HISTORY_KEY, function (stored) {
    if (callback) callback(requireHistory(stored, today))
  }, [])
}

function saveToday(activitySnapshot, callback) {
  if (!activitySnapshot) throw new Error('History saveToday requires canonical Activity snapshot')
  var today = dayWindow.dateKey(new Date())
  storage.getJSON(HISTORY_KEY, function (stored) {
    var history = upsertToday(stored, activitySnapshot, today)
    storage.set(HISTORY_KEY, history, function (result) {
      if (callback) callback(clone(history), result)
    })
  }, [])
}

export default {
  saveToday: saveToday,
  getHistory: loadHistory
}
