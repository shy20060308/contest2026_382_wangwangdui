import { createClockController } from '../features/clock/controller'
import { copyState, configuredFaceIds } from './shared'

function create(onChange) {
  var configured = false
  var faceIds = []
  var clockState = {}
  var notificationState = { visible: false }
  function emit() {
    var state = copyState(clockState)
    for (var key in notificationState) if (key !== 'visible' && key !== 'type') state[key] = notificationState[key]
    var visible = !!notificationState.visible
    var type = notificationState.type || ''
    state.clockVisible = !visible && state.powerMode !== 'SLEEP'
    state.sleepVisible = !visible && state.powerMode === 'SLEEP'
    state.notificationAppVisible = visible && type !== 'call'
    state.notificationCallVisible = visible && type === 'call'
    if (typeof onChange === 'function') onChange(state)
  }
  var controller = createClockController(function (model) { clockState = model || {}; emit() }, function (model) { notificationState = model || { visible: false }; emit() })
  function ensureConfigured() {
    if (configured) return
    if (!faceIds.length) throw new Error('Clock surface controller has not received controllerConfig.faceIds')
    configured = true
    controller.configureFaces(faceIds)
  }
  return {
    configure: function (profile, scene, safe, config) { faceIds = configuredFaceIds(config, 'Clock'); configured = false },
    start: function () { ensureConfigured(); controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() },
    action: function (name) {
      ensureConfigured()
      controller.markActive('surface-action')
      if (name === 'clock-prev-face') { if (notificationState.visible || clockState.powerMode === 'SLEEP') return; controller.switchFace(-1); return }
      if (name === 'clock-next-face') { if (notificationState.visible || clockState.powerMode === 'SLEEP') return; controller.switchFace(1); return }
      if (name === 'clock-wake') { controller.wake('surface-wake'); return }
      if (name === 'clock-dismiss-notification') { controller.dismissNotification(); return }
      if (name === 'clock-hangup-notification') { controller.hangUpNotification(); return }
      throw new Error('Unknown clock action: ' + name)
    }
  }
}

export default { id: 'clock', create: create }
