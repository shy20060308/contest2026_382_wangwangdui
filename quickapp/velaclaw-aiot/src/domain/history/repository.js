import storage from '../../capabilities/storage'
import activityStore from '../activity/store'

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

function todayRecord(activitySnapshot) {
  var activity = activitySnapshot || activityStore.getSnapshot()
  return {
    date: dateKey(new Date()),
    steps: Math.max(0, Math.round(finiteNumber(activity.steps, 0))),
    calories: Math.max(0, Math.round(finiteNumber(activity.calories, 0))),
    standHours: Math.max(0, Math.round(finiteNumber(activity.standHours, 0))),
    avgHeartRate: null,
    minHeartRate: null,
    maxHeartRate: null,
    goalPercent: Math.max(0, Math.min(100, Math.round(finiteNumber(activity.goalPercent, 0))))
  }
}

function upsertToday(history, activitySnapshot, restorePersistedTotals) {
  var source = normalizeHistory(history)
  var key = dateKey(new Date())
  if (restorePersistedTotals) {
    for (var i = 0; i < source.length; i++) {
      if (source[i].date === key) {
        activityStore.restoreTotals(source[i])
        break
      }
    }
  }

  var merged = []
  for (var j = 0; j < source.length; j++) if (source[j].date !== key) merged.push(source[j])
  merged.push(todayRecord(activitySnapshot))
  merged.sort(function (a, b) { return a.date > b.date ? 1 : (a.date < b.date ? -1 : 0) })
  while (merged.length > HISTORY_DAYS) merged.shift()
  return merged
}

function loadHistory(callback) {
  storage.getJSON(HISTORY_KEY, function (stored) {
    var history = upsertToday(stored, null, true)
    storage.set(HISTORY_KEY, history, function () {
      if (callback) callback(clone(history))
    })
  }, [])
}

function saveToday(activitySnapshot, callback) {
  var snapshot = activitySnapshot || activityStore.getSnapshot()
  storage.getJSON(HISTORY_KEY, function (stored) {
    var history = upsertToday(stored, snapshot, false)
    storage.set(HISTORY_KEY, history, function (result) {
      if (callback) callback(clone(history), result)
    })
  }, [])
}

export default {
  ensure: function () { loadHistory(function () {}) },
  saveToday: saveToday,
  getHistory: loadHistory
}
