import storage from '../../capabilities/storage'

var HISTORY_KEY = 'activity_history_v3'
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

function finiteNumber(value, fallback) {
  var number = Number(value)
  return isFinite(number) ? number : fallback
}

function normalizeRecord(record) {
  if (!record || !record.date) return null
  return {
    date: String(record.date),
    steps: Math.max(0, Math.round(finiteNumber(record.steps, 0))),
    calories: Math.max(0, Math.round(finiteNumber(record.calories, 0))),
    standHours: Math.max(0, Math.round(finiteNumber(record.standHours, 0))),
    avgHeartRate: finiteNumber(record.avgHeartRate, null),
    minHeartRate: finiteNumber(record.minHeartRate, null),
    maxHeartRate: finiteNumber(record.maxHeartRate, null),
    goalPercent: Math.max(0, Math.min(100, Math.round(finiteNumber(record.goalPercent, 0))))
  }
}

function normalizeHistory(stored) {
  var source = Array.isArray(stored) ? stored : []
  var result = []
  for (var i = 0; i < source.length; i++) {
    var record = normalizeRecord(source[i])
    if (record) result.push(record)
  }
  result.sort(function (a, b) { return a.date > b.date ? 1 : (a.date < b.date ? -1 : 0) })
  while (result.length > HISTORY_DAYS) result.shift()
  return result
}

function todayRecord(activity) {
  if (!activity) throw new Error('History saveToday requires canonical Activity snapshot')
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
  var source = normalizeHistory(history)
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
    if (callback) callback(clone(normalizeHistory(stored)))
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
