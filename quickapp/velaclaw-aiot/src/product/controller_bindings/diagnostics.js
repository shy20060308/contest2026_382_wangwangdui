import { noop, copyState } from './shared'

function diagnosticsControllerFactory() {
  var feature = require('../features/settings/diagnostics_controller')
  if (!feature || typeof feature.createDiagnosticsController !== 'function') throw new Error('Diagnostics feature controller module unavailable')
  return feature.createDiagnosticsController
}

function create(onChange) {
  var configured = false
  var latest = {}
  var pageIndex = 0
  var pageSize = 4
  function emit(model) {
    if (model) latest = model
    var capabilities = Array.isArray(latest.capabilities) ? latest.capabilities : []
    var pageCount = 2 + Math.max(1, Math.ceil(capabilities.length / pageSize))
    pageIndex = Math.max(0, Math.min(pageCount - 1, pageIndex))
    var state = copyState(latest)
    state.ready = configured && !!latest.device && !!latest.host
    state.deviceOpen = state.ready && pageIndex === 0
    state.storageOpen = state.ready && pageIndex === 1
    state.capabilitiesOpen = state.ready && pageIndex > 1
    state.pageText = state.ready ? ((pageIndex + 1) + ' / ' + pageCount) : ''
    var capabilityPageIndex = Math.max(0, pageIndex - 2)
    state.capabilityPage = capabilities.slice(capabilityPageIndex * pageSize, capabilityPageIndex * pageSize + pageSize)
    if (typeof onChange === 'function') onChange(state)
  }
  var createDiagnosticsController = diagnosticsControllerFactory()
  var controller = createDiagnosticsController(emit)
  return {
    configure: function (profile, scene, safe, config) {
      var configuredPageSize = Number(config && config.capabilityPageSize)
      if (!isFinite(configuredPageSize) || configuredPageSize < 1) throw new Error('Diagnostics requires JSON controllerConfig.capabilityPageSize')
      pageSize = Math.floor(configuredPageSize)
      pageIndex = 0
      configured = true
      controller.configureScene(profile, scene)
    },
    start: function () { if (configured) controller.refresh() }, stop: noop, destroy: noop,
    action: function (name) {
      if (name === 'diagnostics-page:previous') { pageIndex -= 1; emit(); return }
      if (name === 'diagnostics-page:next') { pageIndex += 1; emit(); return }
      if (name === 'diagnostics-storage:request') { controller.requestStorageRecovery(); return }
      if (name === 'diagnostics-storage:confirm') { controller.confirmStorageRecovery(); return }
      if (name === 'diagnostics-storage:cancel') { controller.cancelStorageRecovery(); return }
      throw new Error('Unknown diagnostics action: ' + name)
    }
  }
}

export default { id: 'diagnostics', create: create }
