import storage from '../../capabilities/storage'

var ACTIVITY_KEY = 'activity_today_v3'

function pad2(value) {
  return value < 10 ? '0' + value : '' + value
}

function dateKey(date) {
  var value = date || new Date()
  return value.getFullYear() + '-' + pad2(value.getMonth() + 1) + '-' + pad2(value.getDate())
}

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function normalize(record) {
  if (!record || record.date !== dateKey(new Date())) return null
  return {
    steps: Math.max(0, Math.round(Number(record.steps) || 0)),
    stepsGoal: Math.max(1, Math.round(Number(record.stepsGoal) || 6000)),
    calories: Math.max(0, Math.round(Number(record.calories) || 0)),
    caloriesGoal: Math.max(1, Math.round(Number(record.caloriesGoal) || 300)),
    standHours: Math.max(0, Math.round(Number(record.standHours) || 0)),
    standGoal: Math.max(1, Math.round(Number(record.standGoal) || 12))
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
