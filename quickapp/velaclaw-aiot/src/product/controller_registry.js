import navigation from '../runtime/navigation'
import { createActivityController } from './features/activity/controller'
import { createHistoryController } from './features/history/controller'
import { createHealthController } from './features/health/controller'
import workoutSelectionFeature from './features/workout/selection'
import { createWorkoutController } from './features/workout/controller'
import { createWorkoutHistoryController } from './features/workout/history_controller'
import { createTodayController } from './features/today/controller'
import { createBrightnessController } from './features/settings/brightness_controller'
import { createVibrationController } from './features/settings/vibration_controller'
import { createMotionController } from './features/settings/motion_controller'
import { createDiagnosticsController } from './features/settings/diagnostics_controller'
import { createSyncController } from './features/sync/controller'
import { createNotificationController } from './features/notification/controller'
import { createWatchfaceController } from './features/watchface/controller'
import { createClockController } from './features/clock/controller'

function noop() {}

function configuredFaceIds(config, label) {
  var source = config && Array.isArray(config.faceIds) ? config.faceIds : []
  if (!source.length) throw new Error(label + ' requires JSON controllerConfig.faceIds')
  var seen = {}
  var result = []
  for (var i = 0; i < source.length; i++) {
    var id = String(source[i] || '')
    if (!id) throw new Error(label + ' controllerConfig.faceIds may not contain empty ids')
    if (seen[id]) throw new Error(label + ' controllerConfig.faceIds may not contain duplicates: ' + id)
    seen[id] = true
    result.push(id)
  }
  return result
}

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

function brightness(onChange) {
  var controller = createBrightnessController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return {
    start: function () { controller.load() }, stop: noop, destroy: noop,
    action: function (name, payload) {
      if (name === 'brightness-set') {
        var value = payload && payload.value
        controller.setBrightness(value)
        return
      }
      if (name === 'brightness-toggle-auto') { controller.toggleAuto(); return }
      if (name === 'brightness-toggle-raise') { controller.toggleRaiseWake(); return }
      if (name === 'brightness-toggle-low-power') { controller.toggleLowPower(); return }
      throw new Error('Unknown brightness action: ' + name)
    }
  }
}

function vibrationSettings(onChange) {
  var controller = createVibrationController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return {
    start: function () { controller.load() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'vibration-toggle') { controller.toggle(); return }
      if (name === 'vibration-test') { controller.playCurrent(); return }
      if (String(name).indexOf('vibration-level:') === 0) { controller.setLevel(String(name).slice(16)); return }
      if (String(name).indexOf('vibration-pattern:') === 0) { controller.selectPattern(String(name).slice(18)); return }
      throw new Error('Unknown vibration action: ' + name)
    }
  }
}

function motionSettings(onChange) {
  var controller = createMotionController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return {
    start: function () { controller.refresh() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'motion-toggle') { controller.toggleSensor(); return }
      if (name === 'motion-reset') { controller.reset(); return }
      if (name === 'motion-measure') { controller.startMeasure(); return }
      throw new Error('Unknown motion action: ' + name)
    }
  }
}

function diagnostics(onChange) {
  var configured = false
  var controller = createDiagnosticsController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return {
    configure: function (profile, scene) { configured = true; controller.configureScene(profile, scene) },
    start: function () { if (configured) controller.refresh() },
    stop: noop, destroy: noop, action: noop
  }
}

function sync(onChange) {
  var controller = createSyncController(function (model) {
    if (typeof onChange === 'function') onChange(model || {})
  })
  return {
    start: function () { controller.load() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'sync-refresh') { controller.refreshConnection(); return }
      if (name === 'sync-start') { controller.sync(); return }
      throw new Error('Unknown sync action: ' + name)
    }
  }
}

function notification(onChange) {
  var controller = createNotificationController(function (model) {
    var state = model || {}
    var visible = !!state.visible
    var type = state.type || ''
    var projected = {}
    for (var key in state) projected[key] = state[key]
    projected.homeVisible = !visible
    projected.appVisible = visible && type !== 'call'
    projected.callVisible = visible && type === 'call'
    projected.hangupVisible = visible && type === 'call'
    if (typeof onChange === 'function') onChange(projected)
  })
  return {
    start: function () { controller.start() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: function (name) {
      if (String(name).indexOf('notification-demo:') === 0) { controller.showDemo(String(name).slice(18)); return }
      if (name === 'notification-dismiss') { controller.dismiss(); return }
      if (name === 'notification-hangup') { controller.hangUp(); return }
      throw new Error('Unknown notification action: ' + name)
    }
  }
}

function watchface(onChange) {
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
    configure: function (profile, scene, safe, config) {
      faceIds = configuredFaceIds(config, 'Watchface')
      configured = false
    },
    start: function () { ensureConfigured(); controller.load() },
    stop: noop,
    destroy: noop,
    action: function (name) {
      if (String(name).indexOf('watchface-select:') === 0) {
        ensureConfigured()
        controller.select(String(name).slice(17), function () { navigation.back() })
        return
      }
      throw new Error('Unknown watchface action: ' + name)
    }
  }
}

function clock(onChange) {
  var configured = false
  var faceIds = []
  var clockState = {}
  var notificationState = { visible: false }

  function emit() {
    var state = {}
    var key
    for (key in clockState) state[key] = clockState[key]
    for (key in notificationState) {
      if (key !== 'visible' && key !== 'type') state[key] = notificationState[key]
    }
    var visible = !!notificationState.visible
    var type = notificationState.type || ''
    state.faceSport = state.faceId === 'sport' && !visible && state.powerMode !== 'SLEEP'
    state.faceSimple = state.faceId === 'simple' && !visible && state.powerMode !== 'SLEEP'
    state.faceDashboard = state.faceId === 'dashboard' && !visible && state.powerMode !== 'SLEEP'
    state.faceMechanical = state.faceId === 'mechanical' && !visible && state.powerMode !== 'SLEEP'
    state.faceAlpine = state.faceId === 'alpine' && !visible && state.powerMode !== 'SLEEP'
    state.clockVisible = !visible && state.powerMode !== 'SLEEP'
    state.sleepVisible = !visible && state.powerMode === 'SLEEP'
    state.notificationAppVisible = visible && type !== 'call'
    state.notificationCallVisible = visible && type === 'call'
    if (typeof onChange === 'function') onChange(state)
  }

  var controller = createClockController(function (model) {
    clockState = model || {}
    emit()
  }, function (model) {
    notificationState = model || { visible: false }
    emit()
  })

  function ensureConfigured() {
    if (configured) return
    if (!faceIds.length) throw new Error('Clock surface controller has not received controllerConfig.faceIds')
    configured = true
    controller.configureFaces(faceIds)
  }

  return {
    configure: function (profile, scene, safe, config) {
      faceIds = configuredFaceIds(config, 'Clock')
      configured = false
    },
    start: function () { ensureConfigured(); controller.start() },
    stop: function () { controller.stop() },
    destroy: function () { controller.stop() },
    action: function (name) {
      ensureConfigured()
      controller.markActive('surface-action')
      if (name === 'clock-prev-face') { controller.switchFace(-1); return }
      if (name === 'clock-next-face') { controller.switchFace(1); return }
      if (name === 'clock-wake') { controller.wake('surface-wake'); return }
      if (name === 'clock-dismiss-notification') { controller.dismissNotification(); return }
      if (name === 'clock-hangup-notification') { controller.hangUpNotification(); return }
      throw new Error('Unknown clock action: ' + name)
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
  if (id === 'brightness') return brightness(onChange)
  if (id === 'vibration') return vibrationSettings(onChange)
  if (id === 'motion') return motionSettings(onChange)
  if (id === 'diagnostics') return diagnostics(onChange)
  if (id === 'sync') return sync(onChange)
  if (id === 'notification') return notification(onChange)
  if (id === 'watchface') return watchface(onChange)
  if (id === 'clock') return clock(onChange)
  if (id === null || id === undefined || id === '') return { start: noop, stop: noop, destroy: noop, action: noop }
  throw new Error('Unknown V3 surface controller: ' + id)
}

export default { create: create }
