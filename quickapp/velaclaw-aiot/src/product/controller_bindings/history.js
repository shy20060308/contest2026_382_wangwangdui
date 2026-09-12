import { createHistoryController } from '../features/history/controller'
import { noop } from './shared'

function create(onChange) {
  var controller = createHistoryController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return { start: function () { controller.load() }, stop: noop, destroy: noop, action: noop }
}

export default { id: 'history', create: create }
