import navigation from '../../runtime/navigation'
import { createWatchfaceController } from '../features/watchface/controller'
import { noop, interactionOwner, ownerToken, ownerCurrent, ownerKey, configuredFaceIds } from './shared'

function create(onChange, context) {
  var owner = interactionOwner(context)
  var configured = false
  var faceIds = []
  var controller = createWatchfaceController(function (model) {
    var state = model || {}
    if (typeof onChange === 'function') onChange({ selectedId: state.selectedId || '', selectedIndex: state.selectedIndex || 0 })
  })
  function ensureConfigured() {
    if (configured) return
    if (!faceIds.length) throw new Error('Watchface surface controller has not received controllerConfig.faceIds')
    configured = true
    controller.configure(faceIds)
  }
  return {
    configure: function (profile, scene, safe, config) { faceIds = configuredFaceIds(config, 'Watchface'); configured = false },
    start: function () { ensureConfigured(); controller.load() }, stop: noop, destroy: noop,
    action: function (name) {
      if (String(name).indexOf('watchface-select:') === 0) {
        ensureConfigured()
        var token = ownerToken(owner)
        controller.select(String(name).slice(17), function () {
          if (ownerCurrent(owner, token)) navigation.back(ownerKey(owner))
        })
        return
      }
      throw new Error('Unknown watchface action: ' + name)
    }
  }
}

export default { id: 'watchface', create: create }
