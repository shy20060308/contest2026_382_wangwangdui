import storage from '../../capabilities/storage'
import activityStore from '../activity/store'
import recentHealth from '../health/recent'

var HEALTH_HISTORY_KEY = 'health_history_7d'
var HOURLY_HEART_RATE_KEY = 'hourly_heart_rate_24h'
var HISTORY_DAYS = 7
var HOURLY_LABELS = ['0', '3', '6', '9', '12', '15', '18', '21']
var hourlyHeartRate = []

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

function sortHistory(history) {
  history.sort(function (a, b) { return a.date > b.date ? 1 : -1 })
}

function todayRecord(activitySnapshot) {
  var activity = activitySnapshot || activityStore.getSnapshot()
  var heart = recentHealth.getStats()
  return {
    date: dateKey(new Date()),
    steps: activity.steps,
    calories: activity.calories,
    standHours: activity.standHours,
    avgHeartRate: heart.avg,
    minHeartRate: heart.min,
    maxHeartRate: heart.max,
    goalPercent: activity.goalPercent
  }
}

function makeDemoHistory() {
  var result = []
  var steps = [3800, 5200, 6100, 4500, 7200, 5600]
  var calories = [146, 205, 242, 178, 288, 220]
  var stand = [6, 8, 9, 7, 10, 8]
  var heart = [78, 81, 84, 79, 86, 82]
  var goals = [54, 74, 85, 64, 93, 78]
  for (var i = HISTORY_DAYS - 1; i > 0; i--) {
    var date = new Date()
    date.setDate(date.getDate() - i)
    var index = HISTORY_DAYS - 1 - i
    result.push({
      date: dateKey(date),
      steps: steps[index],
      calories: calories[index],
      standHours: stand[index],
      avgHeartRate: heart[index],
      minHeartRate: heart[index] - 12,
      maxHeartRate: heart[index] + 14,
      goalPercent: goals[index]
    })
  }
  result.push(todayRecord())
  return result
}

function normalizeHistory(stored) {
  return Array.isArray(stored) && stored.length ? stored : makeDemoHistory()
}

function upsertToday(history, activitySnapshot, restorePersistedTotals) {
  var key = dateKey(new Date())
  if (restorePersistedTotals) {
    for (var i = 0; i < history.length; i++) {
      if (history[i].date === key) {
        activityStore.restoreTotals(history[i])
        break
      }
    }
  }

  var merged = []
  for (var j = 0; j < history.length; j++) {
    if (history[j].date !== key) merged.push(history[j])
  }
  merged.push(todayRecord(activitySnapshot))
  sortHistory(merged)
  while (merged.length > HISTORY_DAYS) merged.shift()
  return merged
}

function loadHistory(callback) {
  storage.getJSON(HEALTH_HISTORY_KEY, function (stored) {
    var history = upsertToday(normalizeHistory(stored), null, true)
    storage.set(HEALTH_HISTORY_KEY, history, function () {
      if (callback) callback(clone(history))
    })
  }, [])
}

function saveToday(activitySnapshot, callback) {
  var snapshot = activitySnapshot || activityStore.getSnapshot()
  storage.getJSON(HEALTH_HISTORY_KEY, function (stored) {
    var history = upsertToday(normalizeHistory(stored), snapshot, false)
    storage.set(HEALTH_HISTORY_KEY, history, function (result) {
      if (callback) callback(clone(history), result)
    })
  }, [])
}

function makeDemoHourly() {
  var raw = [
    { min: 48, max: 72, avg: 60 },
    { min: 51, max: 70, avg: 62 },
    { min: 58, max: 88, avg: 72 },
    { min: 68, max: 95, avg: 80 },
    { min: 63, max: 88, avg: 76 },
    { min: 66, max: 93, avg: 79 },
    { min: 64, max: 91, avg: 77 },
    { min: 55, max: 80, avg: 68 }
  ]
  var result = []
  for (var i = 0; i < HOURLY_LABELS.length; i++) {
    result.push({ label: HOURLY_LABELS[i], min: raw[i].min, max: raw[i].max, avg: raw[i].avg })
  }
  return result
}

export default {
  ensure: function () { loadHistory(function () {}) },
  saveToday: saveToday,
  getHistory: loadHistory,

  getHourlyHeartRate: function () {
    return clone(hourlyHeartRate.length ? hourlyHeartRate : makeDemoHourly())
  },

  loadHourlyHeartRate: function (callback) {
    if (hourlyHeartRate.length) {
      if (callback) callback(clone(hourlyHeartRate))
      return
    }
    storage.getJSON(HOURLY_HEART_RATE_KEY, function (stored) {
      hourlyHeartRate = Array.isArray(stored) && stored.length ? stored : makeDemoHourly()
      storage.set(HOURLY_HEART_RATE_KEY, hourlyHeartRate)
      if (callback) callback(clone(hourlyHeartRate))
    }, [])
  },

  saveHourlyHeartRate: function () {
    storage.set(HOURLY_HEART_RATE_KEY, hourlyHeartRate)
  }
}
