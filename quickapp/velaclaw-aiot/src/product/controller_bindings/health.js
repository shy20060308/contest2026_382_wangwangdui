import { noop } from './shared'

function healthControllerFactory() {
  var feature = require('../features/health/controller')
  if (!feature || typeof feature.createHealthController !== 'function') throw new Error('Health feature controller module unavailable')
  return feature.createHealthController
}

function create(onChange) {
  var createHealthController = healthControllerFactory()
  var controller = createHealthController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return { start: function () { controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() }, action: noop }
}

export default { id: 'health', create: create }
