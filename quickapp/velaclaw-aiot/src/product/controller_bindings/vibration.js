import { createVibrationController } from '../features/settings/vibration_controller'
import { copyState } from './shared'

function create(onChange) {
  var page = 'controls'
  var latest = {}
  function emit(model) {
    if (model) latest = model
    var state = copyState(latest)
    state.controlsOpen = page === 'controls'
    state.patternsOpen = page === 'patterns'
    state.pageCode = page
    if (typeof onChange === 'function') onChange(state)
  }
  var controller = createVibrationController(emit)
  return {
    start: function () { controller.load() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'vibration-page:controls') { page = 'controls'; emit(); return }
      if (name === 'vibration-page:patterns') { page = 'patterns'; emit(); return }
      if (name === 'vibration-toggle') { controller.toggle(); return }
      if (name === 'vibration-test') { controller.playCurrent(); return }
      if (String(name).indexOf('vibration-level:') === 0) { controller.setLevel(String(name).slice(16)); return }
      if (String(name).indexOf('vibration-pattern:') === 0) { controller.selectPattern(String(name).slice(18)); return }
      throw new Error('Unknown vibration action: ' + name)
    }
  }
}

export default { id: 'vibration', create: create }
