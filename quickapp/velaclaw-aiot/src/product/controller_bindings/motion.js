import { createMotionController } from '../features/settings/motion_controller'
import { copyState } from './shared'

function create(onChange) {
  var page = 'diagnostics'
  var latest = {}
  function emit(model) {
    if (model) latest = model
    var state = copyState(latest)
    state.diagnosticsOpen = page === 'diagnostics'
    state.measureOpen = page === 'measure'
    state.pageCode = page
    if (typeof onChange === 'function') onChange(state)
  }
  var controller = createMotionController(emit)
  return {
    start: function () { controller.refresh() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'motion-page:diagnostics') { page = 'diagnostics'; emit(); return }
      if (name === 'motion-page:measure') { page = 'measure'; emit(); return }
      if (name === 'motion-toggle') { controller.toggleSensor(); return }
      if (name === 'motion-reset') { controller.reset(); return }
      if (name === 'motion-measure') { controller.startMeasure(); return }
      throw new Error('Unknown motion action: ' + name)
    }
  }
}

export default { id: 'motion', create: create }
