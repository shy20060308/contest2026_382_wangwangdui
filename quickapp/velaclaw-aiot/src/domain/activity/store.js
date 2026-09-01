var state = {
  steps: 4567,
  stepsGoal: 6000,
  calories: 180,
  caloriesGoal: 300,
  standHours: 8,
  standGoal: 12
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

export default {
  getSnapshot: snapshot,

  add: function (steps, calories) {
    state.steps += Math.max(0, Math.round(Number(steps) || 0))
    state.calories += Math.max(0, Math.round(Number(calories) || 0))
    return snapshot()
  },

  restoreTotals: function (record) {
    if (!record) return snapshot()
    state.steps = Math.max(state.steps, Number(record.steps) || 0)
    state.calories = Math.max(state.calories, Number(record.calories) || 0)
    state.standHours = Math.max(state.standHours, Number(record.standHours) || 0)
    return snapshot()
  }
}
