import { createBrightnessController } from '../features/settings/brightness_controller'
import { noop } from './shared'

function create(onChange) {
  var controller = createBrightnessController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return {
    start: function () { controller.load() }, stop: noop, destroy: noop,
    action: function (name, payload) {
      if (name === 'brightness-set') { controller.setBrightness(payload && payload.value); return }
      if (name === 'brightness-toggle-auto') { controller.toggleAuto(); return }
      if (name === 'brightness-toggle-raise') { controller.toggleRaiseWake(); return }
      if (name === 'brightness-toggle-low-power') { controller.toggleLowPower(); return }
      throw new Error('Unknown brightness action: ' + name)
    }
  }
}

export default { id: 'brightness', create: create }
