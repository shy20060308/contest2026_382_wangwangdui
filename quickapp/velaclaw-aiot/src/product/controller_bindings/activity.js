import { noop } from './shared'

function activityControllerFactory() {
  var feature = require('../features/activity/controller')
  if (!feature || typeof feature.createActivityController !== 'function') throw new Error('Activity feature controller module unavailable')
  return feature.createActivityController
}

function create(onChange) {
  var createActivityController = activityControllerFactory()
  var controller = createActivityController(function (metrics) { if (typeof onChange === 'function') onChange({ metrics: metrics }) })
  return { start: function () { controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() }, action: noop }
}

export default { id: 'activity', create: create }
