import navigation from '../runtime/navigation'
import { createActivityController } from './features/activity/controller'
import { createHistoryController } from './features/history/controller'
import { createHealthController } from './features/health/controller'
import workoutSelectionFeature from './features/workout/selection'

function noop() {}

function activity(onChange) {
  var controller = createActivityController(function (metrics) {
    if (typeof onChange === 'function') onChange({ metrics: metrics })
  })
  return {
    start: function () { controller.start() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: noop
  }
}

function history(onChange) {
  var controller = createHistoryController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return { start: function () { controller.load() }, stop: noop, destroy: noop, action: noop }
}

function health(onChange) {
  var controller = createHealthController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return {
    start: function () { controller.start() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: noop
  }
}

function workoutSelection(onChange) {
  var state = { modeTypes: workoutSelectionFeature.getModeTypes(), hasActive: false }
  function emit() {
    if (typeof onChange === 'function') onChange({ modeTypes: state.modeTypes.slice(), hasActive: state.hasActive })
  }
  function refresh() {
    workoutSelectionFeature.hasActive(function (active) {
      state.hasActive = active
      emit()
    })
  }
  return {
    start: function () { emit(); refresh() },
    stop: noop,
    destroy: noop,
    action: function (name) {
      if (name === 'workout-continue') { navigation.push('/pages/workout'); return }
      if (String(name).indexOf('workout-select:') === 0) {
        var type = String(name).slice('workout-select:'.length)
        if (state.modeTypes.indexOf(type) < 0) throw new Error('Unsupported workout selection action: ' + type)
        workoutSelectionFeature.create(type, function () { navigation.push('/pages/workout') })
        return
      }
      throw new Error('Unknown workout selection action: ' + name)
    }
  }
}

function create(id, onChange) {
  if (id === 'activity') return activity(onChange)
  if (id === 'history') return history(onChange)
  if (id === 'health') return health(onChange)
  if (id === 'workout-selection') return workoutSelection(onChange)
  if (id === null || id === undefined || id === '') return { start: noop, stop: noop, destroy: noop, action: noop }
  throw new Error('Unknown V3 surface controller: ' + id)
}

export default { create: create }
