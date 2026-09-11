import storage from '../../capabilities/storage'
var dayWindow = require('../calendar/day_window')

var ACTIVITY_KEY = 'activity_today_v4'

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function requireInteger(record, key, minimum) {
  var value = record[key]
  if (typeof value !== 'number' || !isFinite(value) || Math.round(value) !== value || value < minimum) throw new Error('Invalid Activity record field: ' + key)
  return value
}

function requireDate(value) {
  if (!dayWindow.parseDateKey(value)) throw new Error('Invalid Activity record date')
  return value
}

function normalize(record, expectedDate) {
  if (record === null || record === undefined) return null
  if (typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid Activity record')
  var targetDate = expectedDate || dayWindow.dateKey(new Date())
  if (requireDate(record.date) !== targetDate) return null
  return {
    steps: requireInteger(record, 'steps', 0),
    stepsGoal: requireInteger(record, 'stepsGoal', 1),
    calories: requireInteger(record, 'calories', 0),
    caloriesGoal: requireInteger(record, 'caloriesGoal', 1),
    standHours: requireInteger(record, 'standHours', 0),
    standGoal: requireInteger(record, 'standGoal', 1)
  }
}

function payload(snapshot, date) {
  var targetDate = date || dayWindow.dateKey(new Date())
  if (!dayWindow.parseDateKey(targetDate)) throw new Error('Invalid Activity persistence date')
  return {
    date: targetDate,
    steps: snapshot.steps,
    stepsGoal: snapshot.stepsGoal,
    calories: snapshot.calories,
    caloriesGoal: snapshot.caloriesGoal,
    standHours: snapshot.standHours,
    standGoal: snapshot.standGoal
  }
}

export default {
  load: function (callback, expectedDate) {
    storage.getJSON(ACTIVITY_KEY, function (record) {
      if (callback) callback(normalize(record, expectedDate))
    }, null)
  },

  save: function (snapshot, callback, date) {
    storage.set(ACTIVITY_KEY, payload(snapshot, date), function (result) {
      if (callback) callback(clone(snapshot), result)
    })
  }
}
