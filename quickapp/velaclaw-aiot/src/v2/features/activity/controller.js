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

  function emit(snapshot) {
    var value = semanticMetrics(snapshot)
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  function onActivity(snapshot) {
    if (active) emit(snapshot)
  }

  return {
    start: function () {
      if (active) return emit(activityStore.getSnapshot())
      active = true
      activityStore.subscribe(onActivity)
      emit(activityStore.getSnapshot())
      activityStore.hydrate(function (snapshot) {
        if (active) emit(snapshot)
      })
    },
    stop: function () {
      if (!active) return
      active = false
      activityStore.unsubscribe(onActivity)
    }
  }
}
