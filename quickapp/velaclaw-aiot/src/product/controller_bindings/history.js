import { noop } from './shared'

function historyControllerFactory() {
  var feature = require('../features/history/controller')
  if (!feature || typeof feature.createHistoryController !== 'function') throw new Error('History feature controller module unavailable')
  return feature.createHistoryController
}

function create(onChange) {
  var createHistoryController = historyControllerFactory()
  var controller = createHistoryController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return { start: function () { controller.load() }, stop: noop, destroy: noop, action: noop }
}

export default { id: 'history', create: create }
