import { createNotificationController } from '../features/notification/controller'
import { copyState } from './shared'

function create(onChange) {
  var controller = createNotificationController(function (model) {
    var state = model || {}
    var visible = !!state.visible
    var type = state.type || ''
    var projected = copyState(state)
    projected.homeVisible = !visible
    projected.appVisible = visible && type !== 'call'
    projected.callVisible = visible && type === 'call'
    projected.hangupVisible = visible && type === 'call'
    if (typeof onChange === 'function') onChange(projected)
  })
  return {
    start: function () { controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() },
    action: function (name) {
      if (String(name).indexOf('notification-demo:') === 0) { controller.showDemo(String(name).slice(18)); return }
      if (name === 'notification-dismiss') { controller.dismiss(); return }
      if (name === 'notification-hangup') { controller.hangUp(); return }
      throw new Error('Unknown notification action: ' + name)
    }
  }
}

export default { id: 'notification', create: create }
