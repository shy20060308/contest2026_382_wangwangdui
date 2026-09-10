import navigation from '../runtime/navigation'
import { createActivityController } from './features/activity/controller'
import { createHistoryController } from './features/history/controller'
import { createHealthController } from './features/health/controller'
import workoutSelectionFeature from './features/workout/selection'
import { createWorkoutController } from './features/workout/controller'
import { createWorkoutHistoryController } from './features/workout/history_controller'
import { createTodayController } from './features/today/controller'

function noop() {}

function activity(onChange) {
  var controller = createActivityController(function (metrics) {
    if (typeof onChange === 'function') onChange({ metrics: metrics })
  })
  return {
    start: function () { controller.start() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: noop
  }
}

function history(onChange) {
  var controller = createHistoryController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return { start: function () { controller.load() }, stop: noop, destroy: noop, action: noop }
}

function health(onChange) {
  var controller = createHealthController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return {
    start: function () { controller.start() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: noop
  }
}

function workoutSelection(onChange) {
  var state = { modeTypes: workoutSelectionFeature.getModeTypes(), hasActive: false }
  function emit() {
    if (typeof onChange === 'function') onChange({ modeTypes: state.modeTypes.slice(), hasActive: state.hasActive })
  }
  function refresh() {
    workoutSelectionFeature.hasActive(function (active) {
      state.hasActive = active
      emit()
    })
  }
  return {
    start: function () { emit(); refresh() },
    stop: noop,
    destroy: noop,
    action: function (name) {
      if (name === 'workout-continue') { navigation.push('/pages/workout'); return }
      if (String(name).indexOf('workout-select:') === 0) {
        var type = String(name).slice('workout-select:'.length)
        if (state.modeTypes.indexOf(type) < 0) throw new Error('Unsupported workout selection action: ' + type)
        workoutSelectionFeature.create(type, function () { navigation.push('/pages/workout') })
        return
      }
      throw new Error('Unknown workout selection action: ' + name)
    }
  }
}

function workoutState(session, confirming) {
  if (!session) return { hasSession: false, confirming: !!confirming }
  return {
    hasSession: true,
    confirming: !!confirming,
    type: session.type,
    status: session.status,
    durationMs: session.durationMs,
    steps: session.steps,
    calories: session.calories,
    distanceMeters: session.distanceMeters,
    currentHeartRate: session.currentHeartRate,
    gpsStatus: session.gpsStatus,
    gpsDistanceMeters: session.gpsDistanceMeters
  }
}

function workout(onChange) {
  var current = null
  var confirming = false
  function emit() {
    if (typeof onChange === 'function') onChange(workoutState(current, confirming))
  }
  var controller = createWorkoutController(function (session) {
    current = session
    emit()
  })
  return {
    start: function () {
      controller.loadActive(function (session) {
        if (!session) { navigation.back(); return }
        current = session
        emit()
      })
    },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'workout-toggle-pause') {
        if (!current) return
        if (current.status === 'running') controller.pause()
        else if (current.status === 'paused') controller.resume()
        else throw new Error('Unsupported workout state: ' + current.status)
        return
      }
      if (name === 'workout-request-finish') { confirming = true; emit(); return }
      if (name === 'workout-cancel-finish') { confirming = false; emit(); return }
      if (name === 'workout-confirm-finish') {
        confirming = false
        controller.finish(function () { navigation.replace('/pages/workout_history') })
        return
      }
      throw new Error('Unknown workout action: ' + name)
    }
  }
}

function workoutHistory(onChange) {
  var controller = createWorkoutHistoryController(function (model) {
    var source = model || { totalSteps: 0, records: [] }
    var records = Array.isArray(source.records) ? source.records : []
    if (typeof onChange === 'function') onChange({
      totalSteps: source.totalSteps,
      recordCount: records.length,
      empty: records.length === 0,
      hasRecords: records.length > 0,
      records: records
    })
  })
  return { start: function () { controller.refresh() }, stop: noop, destroy: noop, action: noop }
}

function today(onChange) {
  var calendarOpen = false
  var latest = {}
  function emit(model) {
    if (model) latest = model
    var cells = Array.isArray(latest.calendarCells) ? latest.calendarCells : []
    var state = {}
    for (var key in latest) state[key] = latest[key]
    state.calendarOpen = calendarOpen
    state.summaryOpen = !calendarOpen
    state.calendarMonthNumber = latest.calendarMonth === undefined ? null : latest.calendarMonth + 1
    state.calendarCells = cells.slice()
    if (typeof onChange === 'function') onChange(state)
  }
  var controller = createTodayController(emit)
  return {
    start: function () { controller.start() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'today-open-calendar') { calendarOpen = true; emit(); return }
      if (name === 'today-close-calendar') { calendarOpen = false; emit(); return }
      if (name === 'today-previous-month') { controller.shiftMonth(-1); return }
      if (name === 'today-next-month') { controller.shiftMonth(1); return }
      throw new Error('Unknown today action: ' + name)
    }
  }
}

function create(id, onChange) {
  if (id === 'activity') return activity(onChange)
  if (id === 'history') return history(onChange)
  if (id === 'health') return health(onChange)
  if (id === 'workout-selection') return workoutSelection(onChange)
  if (id === 'workout') return workout(onChange)
  if (id === 'workout-history') return workoutHistory(onChange)
  if (id === 'today') return today(onChange)
  if (id === null || id === undefined || id === '') return { start: noop, stop: noop, destroy: noop, action: noop }
  throw new Error('Unknown V3 surface controller: ' + id)
}

export default { create: create }
