import activityStore from '../../../domain/activity/store'

function semanticMetrics(snapshot) {
  return [
    { id: 'steps', current: snapshot.steps, goal: snapshot.stepsGoal },
    { id: 'calories', current: snapshot.calories, goal: snapshot.caloriesGoal },
    { id: 'stand', current: snapshot.standHours, goal: snapshot.standGoal }
  ]
}

export function createActivityController(onChange) {
  var active = false
  var lifecycleEpoch = 0

  function emit(snapshot) {
    var value = semanticMetrics(snapshot || activityStore.getSnapshot())
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  return {
    start: function () {
      if (active) return emit(activityStore.getSnapshot())
      active = true
      lifecycleEpoch++
      var epoch = lifecycleEpoch
      emit(activityStore.getSnapshot())
      activityStore.hydrate(function (snapshot) {
        if (!active || epoch !== lifecycleEpoch) return
        emit(snapshot)
      })
    },
    stop: function () {
      if (!active) return
      active = false
      lifecycleEpoch++
    },
    refresh: function () { return emit(activityStore.getSnapshot()) },
    getSnapshot: function () { return semanticMetrics(activityStore.getSnapshot()) }
  }
}
