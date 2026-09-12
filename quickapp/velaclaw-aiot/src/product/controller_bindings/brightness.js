import { noop } from './shared'

function brightnessControllerFactory() {
  var feature = require('../features/settings/brightness_controller')
  if (!feature || typeof feature.createBrightnessController !== 'function') throw new Error('Brightness feature controller module unavailable')
  return feature.createBrightnessController
}

function create(onChange) {
  var createBrightnessController = brightnessControllerFactory()
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
