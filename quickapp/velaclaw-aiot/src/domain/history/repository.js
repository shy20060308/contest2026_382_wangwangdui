import storage from '../../capabilities/storage'

var HISTORY_KEY = 'activity_history_v4'
var HISTORY_DAYS = 7

function pad2(value) {
  return value < 10 ? '0' + value : '' + value
}

function dateKey(date) {
  var d = date || new Date()
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

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
  if (typeof record.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) throw new Error('Invalid V4 history field: date')
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

function requireHistory(stored) {
  if (!Array.isArray(stored)) throw new Error('V4 history persistence must be an array')
  var result = []
  for (var i = 0; i < stored.length; i++) result.push(requireRecord(stored[i]))
  result.sort(function (a, b) { return a.date > b.date ? 1 : (a.date < b.date ? -1 : 0) })
  while (result.length > HISTORY_DAYS) result.shift()
  return result
}

function todayRecord(activity) {
  return {
    date: dateKey(new Date()),
    steps: activity.steps,
    calories: activity.calories,
    standHours: activity.standHours,
    avgHeartRate: null,
    minHeartRate: null,
    maxHeartRate: null,
    goalPercent: activity.goalPercent
  }
}

function upsertToday(history, activitySnapshot) {
  var source = requireHistory(history)
  var key = dateKey(new Date())
  var merged = []
  for (var i = 0; i < source.length; i++) if (source[i].date !== key) merged.push(source[i])
  merged.push(todayRecord(activitySnapshot))
  merged.sort(function (a, b) { return a.date > b.date ? 1 : (a.date < b.date ? -1 : 0) })
  while (merged.length > HISTORY_DAYS) merged.shift()
  return merged
}

function loadHistory(callback) {
  storage.getJSON(HISTORY_KEY, function (stored) {
    if (callback) callback(requireHistory(stored))
  }, [])
}

function saveToday(activitySnapshot, callback) {
  if (!activitySnapshot) throw new Error('History saveToday requires canonical Activity snapshot')
  storage.getJSON(HISTORY_KEY, function (stored) {
    var history = upsertToday(stored, activitySnapshot)
    storage.set(HISTORY_KEY, history, function (result) {
      if (callback) callback(clone(history), result)
    })
  }, [])
}

export default {
  saveToday: saveToday,
  getHistory: loadHistory
}
