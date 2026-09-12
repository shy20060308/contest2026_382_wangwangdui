import { createActivityController } from '../features/activity/controller'
import { noop } from './shared'

function create(onChange) {
  var controller = createActivityController(function (metrics) { if (typeof onChange === 'function') onChange({ metrics: metrics }) })
  return { start: function () { controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() }, action: noop }
}

export default { id: 'activity', create: create }
