import storage from '../../capabilities/storage'

var ACTIVITY_KEY = 'activity_today_v3'

function pad2(value) {
  return value < 10 ? '0' + value : '' + value
}

function dateKey(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate())
}

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function requireInteger(record, key, minimum) {
  var value = record[key]
  if (typeof value !== 'number' || !isFinite(value) || Math.round(value) !== value || value < minimum) throw new Error('Invalid Activity record field: ' + key)
  return value
}

function requireDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid Activity record date')
  return value
}

function normalize(record) {
  if (record === null || record === undefined) return null
  if (typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid Activity record')
  if (requireDate(record.date) !== dateKey(new Date())) return null
  return {
    steps: requireInteger(record, 'steps', 0),
    stepsGoal: requireInteger(record, 'stepsGoal', 1),
    calories: requireInteger(record, 'calories', 0),
    caloriesGoal: requireInteger(record, 'caloriesGoal', 1),
    standHours: requireInteger(record, 'standHours', 0),
    standGoal: requireInteger(record, 'standGoal', 1)
  }
}

function payload(snapshot) {
  return {
    date: dateKey(new Date()),
    steps: snapshot.steps,
    stepsGoal: snapshot.stepsGoal,
    calories: snapshot.calories,
    caloriesGoal: snapshot.caloriesGoal,
    standHours: snapshot.standHours,
    standGoal: snapshot.standGoal
  }
}

export default {
  load: function (callback) {
    storage.getJSON(ACTIVITY_KEY, function (record) {
      if (callback) callback(normalize(record))
    }, null)
  },

  save: function (snapshot, callback) {
    storage.set(ACTIVITY_KEY, payload(snapshot), function (result) {
      if (callback) callback(clone(snapshot), result)
    })
  }
}
