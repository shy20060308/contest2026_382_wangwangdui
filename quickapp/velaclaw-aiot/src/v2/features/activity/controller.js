import activityStore from '../../../domain/activity/store'

function semanticMetrics(snapshot) {
  var source = snapshot || {}
  return [
    { id: 'steps', current: Number(source.steps) || 0, goal: Number(source.stepsGoal) || 0 },
    { id: 'calories', current: Number(source.calories) || 0, goal: Number(source.caloriesGoal) || 0 },
    { id: 'stand', current: Number(source.standHours) || 0, goal: Number(source.standGoal) || 0 }
  ]
}

export function createActivityController(onChange) {
  function emit(snapshot) {
    var value = semanticMetrics(snapshot || activityStore.getSnapshot())
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  return {
    start: function () {
      emit(activityStore.getSnapshot())
      activityStore.hydrate(emit)
    },
    refresh: function () { return emit(activityStore.getSnapshot()) },
    getSnapshot: function () { return semanticMetrics(activityStore.getSnapshot()) }
  }
}
