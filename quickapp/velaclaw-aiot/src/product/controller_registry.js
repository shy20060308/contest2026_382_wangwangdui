import { createActivityController } from './features/activity/controller'
import { createHistoryController } from './features/history/controller'
import { createHealthController } from './features/health/controller'

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
  return {
    start: function () { controller.load() },
    stop: noop,
    destroy: noop,
    action: noop
  }
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

function create(id, onChange) {
  if (id === 'activity') return activity(onChange)
  if (id === 'history') return history(onChange)
  if (id === 'health') return health(onChange)
  if (id === null || id === undefined || id === '') return { start: noop, stop: noop, destroy: noop, action: noop }
  throw new Error('Unknown V3 surface controller: ' + id)
}

export default { create: create }
