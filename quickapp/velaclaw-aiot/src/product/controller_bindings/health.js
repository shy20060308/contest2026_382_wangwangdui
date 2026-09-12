import { createHealthController } from '../features/health/controller'
import { noop } from './shared'

function create(onChange) {
  var controller = createHealthController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return { start: function () { controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() }, action: noop }
}

export default { id: 'health', create: create }
