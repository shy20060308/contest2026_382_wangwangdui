import activityStore from '../../../domain/activity/store'

var RATIOS = [0.05, 0.11, 0.18, 0.26, 0.22, 0.14, 0.09, 0.04]

function trendValues(total) {
  var value = Math.max(0, Number(total) || 0)
  var result = []
  for (var i = 0; i < RATIOS.length; i++) result.push(Math.max(1, Math.round(value * RATIOS[i])))
  return result
}

function semanticMetrics(snapshot) {
  var source = snapshot || {}
  return [
    { id: 'steps', name: '步数', current: Number(source.steps) || 0, goal: Number(source.stepsGoal) || 0, unit: '步', trend: trendValues(source.steps) },
    { id: 'calories', name: '卡路里', current: Number(source.calories) || 0, goal: Number(source.caloriesGoal) || 0, unit: 'kcal', trend: trendValues(source.calories) },
    { id: 'stand', name: '站立', current: Number(source.standHours) || 0, goal: Number(source.standGoal) || 0, unit: 'h', trend: trendValues(source.standHours) }
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
