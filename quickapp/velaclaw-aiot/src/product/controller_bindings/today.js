import { copyState } from './shared'

function todayControllerFactory() {
  var feature = require('../features/today/controller')
  if (!feature || typeof feature.createTodayController !== 'function') throw new Error('Today feature controller module unavailable')
  return feature.createTodayController
}

function create(onChange) {
  var calendarOpen = false
  var latest = {}
  function emit(model) {
    if (model) latest = model
    var state = copyState(latest)
    state.calendarOpen = calendarOpen
    state.summaryOpen = !calendarOpen
    state.calendarCells = Array.isArray(latest.calendarCells) ? latest.calendarCells.slice() : []
    if (typeof onChange === 'function') onChange(state)
  }
  var createTodayController = todayControllerFactory()
  var controller = createTodayController(emit)
  return {
    start: function () { controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'today-open-calendar') { calendarOpen = true; emit(); return }
      if (name === 'today-close-calendar') { calendarOpen = false; emit(); return }
      if (name === 'today-previous-month') { controller.shiftMonth(-1); return }
      if (name === 'today-next-month') { controller.shiftMonth(1); return }
      throw new Error('Unknown today action: ' + name)
    }
  }
}

export default { id: 'today', create: create }
