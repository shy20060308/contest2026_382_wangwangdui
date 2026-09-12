function syncControllerFactory() {
  var feature = require('../features/sync/controller')
  if (!feature || typeof feature.createSyncController !== 'function') throw new Error('Sync feature controller module unavailable')
  return feature.createSyncController
}

function create(onChange) {
  var createSyncController = syncControllerFactory()
  var controller = createSyncController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return {
    start: function () { controller.load() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'sync-refresh') { controller.refreshConnection(); return }
      if (name === 'sync-start') { controller.sync(); return }
      throw new Error('Unknown sync action: ' + name)
    }
  }
}

export default { id: 'sync', create: create }
