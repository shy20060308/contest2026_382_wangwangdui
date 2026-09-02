import activityRepository from './repository'

var DEFAULT_STATE = {
  steps: 4567,
  stepsGoal: 6000,
  calories: 180,
  caloriesGoal: 300,
  standHours: 8,
  standGoal: 12
}

var state = copyState(DEFAULT_STATE)
var hydrated = false

function copyState(source) {
  var value = source || DEFAULT_STATE
  return {
    steps: Math.max(0, Math.round(Number(value.steps) || 0)),
    stepsGoal: Math.max(1, Math.round(Number(value.stepsGoal) || DEFAULT_STATE.stepsGoal)),
    calories: Math.max(0, Math.round(Number(value.calories) || 0)),
    caloriesGoal: Math.max(1, Math.round(Number(value.caloriesGoal) || DEFAULT_STATE.caloriesGoal)),
    standHours: Math.max(0, Math.round(Number(value.standHours) || 0)),
    standGoal: Math.max(1, Math.round(Number(value.standGoal) || DEFAULT_STATE.standGoal))
  }
}

function clampPercent(value, goal) {
  if (!goal || goal <= 0) return 0
  var percent = Math.round((value / goal) * 100)
  if (percent < 0) return 0
  if (percent > 100) return 100
  return percent
}

function goalPercent() {
  return Math.round((
    clampPercent(state.steps, state.stepsGoal) +
    clampPercent(state.calories, state.caloriesGoal) +
    clampPercent(state.standHours, state.standGoal)
  ) / 3)
}

function snapshot() {
  return {
    steps: state.steps,
    stepsGoal: state.stepsGoal,
    calories: state.calories,
    caloriesGoal: state.caloriesGoal,
    standHours: state.standHours,
    standGoal: state.standGoal,
    stepsPercent: clampPercent(state.steps, state.stepsGoal),
    goalPercent: goalPercent()
  }
}

function mergePersisted(persisted) {
  if (!persisted) return snapshot()
  // The demo defaults are the initial baseline. Persisted activity may only move today's
  // totals forward; an older stored snapshot must never roll visible data backwards.
  state.steps = Math.max(state.steps, persisted.steps || 0)
  state.calories = Math.max(state.calories, persisted.calories || 0)
  state.standHours = Math.max(state.standHours, persisted.standHours || 0)
  state.stepsGoal = persisted.stepsGoal || state.stepsGoal
  state.caloriesGoal = persisted.caloriesGoal || state.caloriesGoal
  state.standGoal = persisted.standGoal || state.standGoal
  hydrated = true
  return snapshot()
}

export default {
  getSnapshot: snapshot,

  hydrate: function (callback) {
    if (!hydrated) {
      var syncValue = activityRepository.loadSync()
      if (syncValue) mergePersisted(syncValue)
    }
    activityRepository.load(function (persisted) {
      var next = mergePersisted(persisted)
      if (callback) callback(next)
    })
  },

  add: function (steps, calories) {
    state.steps += Math.max(0, Math.round(Number(steps) || 0))
    state.calories += Math.max(0, Math.round(Number(calories) || 0))
    return snapshot()
  },

  addAndPersist: function (steps, calories, callback) {
    this.hydrate(function () {
      var next = state
      next.steps += Math.max(0, Math.round(Number(steps) || 0))
      next.calories += Math.max(0, Math.round(Number(calories) || 0))
      var committed = snapshot()
      activityRepository.save(committed, function (saved, result) {
        if (callback) callback(saved, result)
      })
    })
  },

  persist: function (callback) {
    activityRepository.save(snapshot(), callback)
  },

  restoreTotals: function (record) {
    return mergePersisted(record)
  }
}
