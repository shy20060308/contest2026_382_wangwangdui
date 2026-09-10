import { createActivityController } from './features/activity/controller'

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

function create(id, onChange) {
  if (id === 'activity') return activity(onChange)
  if (id === null || id === undefined || id === '') return { start: noop, stop: noop, destroy: noop, action: noop }
  throw new Error('Unknown V3 surface controller: ' + id)
}

export default { create: create }
