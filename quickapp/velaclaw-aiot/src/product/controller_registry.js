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
function copyState(source) { var result = {}; for (var key in (source || {})) result[key] = source[key]; return result }
function interactionOwner(context) { return context && context.interactionOwner ? context.interactionOwner : null }
function ownerToken(owner) { return owner ? owner.capture() : null }
function ownerCurrent(owner, token) { return !owner || owner.isCurrent(token) }
function ownerKey(owner) { return owner ? owner.key() : '' }

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
  var controller = createActivityController(function (metrics) { if (typeof onChange === 'function') onChange({ metrics: metrics }) })
  return { start: function () { controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() }, action: noop }
}

function history(onChange) {
  var controller = createHistoryController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return { start: function () { controller.load() }, stop: noop, destroy: noop, action: noop }
}

function health(onChange) {
  var controller = createHealthController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return { start: function () { controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() }, action: noop }
}

function workoutSelection(onChange, context) {
  var owner = interactionOwner(context)
  var state = { modeTypes: workoutSelectionFeature.getModeTypes(), hasActive: false }
  function emit() { if (typeof onChange === 'function') onChange({ modeTypes: state.modeTypes.slice(), hasActive: state.hasActive }) }
  function refresh() { workoutSelectionFeature.hasActive(function (active) { state.hasActive = active; emit() }) }
  return {
    start: function () { emit(); refresh() }, stop: noop, destroy: noop,
    action: function (name) {
      if (name === 'workout-continue') { navigation.push('/pages/workout', null, ownerKey(owner)); return }
      if (String(name).indexOf('workout-select:') === 0) {
        var type = String(name).slice('workout-select:'.length)
        if (state.modeTypes.indexOf(type) < 0) throw new Error('Unsupported workout selection action: ' + type)
        var token = ownerToken(owner)
        workoutSelectionFeature.create(type, function () {
          if (ownerCurrent(owner, token)) navigation.push('/pages/workout', null, ownerKey(owner))
        })
        return
      }
      throw new Error('Unknown workout selection action: ' + name)
    }
  }
}

function workoutState(session, confirming) {
  if (!session) return { hasSession: false, confirming: !!confirming }
  return {
    hasSession: true, confirming: !!confirming, type: session.type, status: session.status,
    durationMs: session.durationMs, steps: session.steps, calories: session.calories,
    distanceMeters: session.distanceMeters, currentHeartRate: session.currentHeartRate,
    gpsStatus: session.gpsStatus, gpsDistanceMeters: session.gpsDistanceMeters
  }
}

function workout(onChange, context) {
  var owner = interactionOwner(context)
  var current = null
  var confirming = false
  function emit() { if (typeof onChange === 'function') onChange(workoutState(current, confirming)) }
  var controller = createWorkoutController(function (session) { current = session; emit() })
  return {
    start: function () {
      var token = ownerToken(owner)
      controller.loadActive(function (session) {
        if (!ownerCurrent(owner, token)) return
        if (!session) { navigation.back(ownerKey(owner)); return }
        current = session
        emit()
      })
    },
    stop: function () { controller.stop() }, destroy: function () { controller.stop() },
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
        var token = ownerToken(owner)
        controller.finish(function () {
          if (ownerCurrent(owner, token)) navigation.replace('/pages/workout_history', null, ownerKey(owner))
        })
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
    if (typeof onChange === 'function') onChange({ totalSteps: source.totalSteps, recordCount: records.length, empty: records.length === 0, hasRecords: records.length > 0, records: records })
  })
  return { start: function () { controller.refresh() }, stop: noop, destroy: noop, action: noop }
}

function today(onChange) {
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

function brightness(onChange) {
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

function vibrationSettings(onChange) {
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

function motionSettings(onChange) {
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

function diagnostics(onChange) {
  var configured = false
  var latest = {}
  var pageIndex = 0
  var pageSize = 4

  function emit(model) {
    if (model) latest = model
    var capabilities = Array.isArray(latest.capabilities) ? latest.capabilities : []
    var pageCount = 1 + Math.max(1, Math.ceil(capabilities.length / pageSize))
    pageIndex = Math.max(0, Math.min(pageCount - 1, pageIndex))
    var state = copyState(latest)
    state.ready = configured && !!latest.device && !!latest.host
    state.deviceOpen = state.ready && pageIndex === 0
    state.capabilitiesOpen = state.ready && pageIndex > 0
    state.pageText = state.ready ? ((pageIndex + 1) + ' / ' + pageCount) : ''
    var capabilityPageIndex = Math.max(0, pageIndex - 1)
    state.capabilityPage = capabilities.slice(capabilityPageIndex * pageSize, capabilityPageIndex * pageSize + pageSize)
    if (typeof onChange === 'function') onChange(state)
  }

  var controller = createDiagnosticsController(emit)
  return {
    configure: function (profile, scene, safe, config) {
      var configuredPageSize = Number(config && config.capabilityPageSize)
      if (!isFinite(configuredPageSize) || configuredPageSize < 1) throw new Error('Diagnostics requires JSON controllerConfig.capabilityPageSize')
      pageSize = Math.floor(configuredPageSize)
      pageIndex = 0
      configured = true
      controller.configureScene(profile, scene)
    },
    start: function () { if (configured) controller.refresh() }, stop: noop, destroy: noop,
    action: function (name) {
      if (name === 'diagnostics-page:previous') { pageIndex -= 1; emit(); return }
      if (name === 'diagnostics-page:next') { pageIndex += 1; emit(); return }
      throw new Error('Unknown diagnostics action: ' + name)
    }
  }
}

function sync(onChange) {
  var controller = createSyncController(function (model) { if (typeof onChange === 'function') onChange(model || {}) })
  return {
    start: function () { controller.load() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() },
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

function watchface(onChange, context) {
  var owner = interactionOwner(context)
  var configured = false
  var faceIds = []
  var controller = createWatchfaceController(function (model) { var state = model || {}; if (typeof onChange === 'function') onChange({ selectedId: state.selectedId || '', selectedIndex: state.selectedIndex || 0 }) })
  function ensureConfigured() { if (configured) return; if (!faceIds.length) throw new Error('Watchface surface controller has not received controllerConfig.faceIds'); configured = true; controller.configure(faceIds) }
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

function clock(onChange) {
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
  function ensureConfigured() { if (configured) return; if (!faceIds.length) throw new Error('Clock surface controller has not received controllerConfig.faceIds'); configured = true; controller.configureFaces(faceIds) }
  return {
    configure: function (profile, scene, safe, config) { faceIds = configuredFaceIds(config, 'Clock'); configured = false },
    start: function () { ensureConfigured(); controller.start() }, stop: function () { controller.stop() }, destroy: function () { controller.stop() },
    action: function (name) {
      ensureConfigured(); controller.markActive('surface-action')
      if (name === 'clock-prev-face') { if (notificationState.visible || clockState.powerMode === 'SLEEP') return; controller.switchFace(-1); return }
      if (name === 'clock-next-face') { if (notificationState.visible || clockState.powerMode === 'SLEEP') return; controller.switchFace(1); return }
      if (name === 'clock-wake') { controller.wake('surface-wake'); return }
      if (name === 'clock-dismiss-notification') { controller.dismissNotification(); return }
      if (name === 'clock-hangup-notification') { controller.hangUpNotification(); return }
      throw new Error('Unknown clock action: ' + name)
    }
  }
}

function create(id, onChange, context) {
  if (id === 'activity') return activity(onChange)
  if (id === 'history') return history(onChange)
  if (id === 'health') return health(onChange)
  if (id === 'workout-selection') return workoutSelection(onChange, context)
  if (id === 'workout') return workout(onChange, context)
  if (id === 'workout-history') return workoutHistory(onChange)
  if (id === 'today') return today(onChange)
  if (id === 'brightness') return brightness(onChange)
  if (id === 'vibration') return vibrationSettings(onChange)
  if (id === 'motion') return motionSettings(onChange)
  if (id === 'diagnostics') return diagnostics(onChange)
  if (id === 'sync') return sync(onChange)
  if (id === 'notification') return notification(onChange)
  if (id === 'watchface') return watchface(onChange, context)
  if (id === 'clock') return clock(onChange)
  if (id === null || id === undefined || id === '') return { start: noop, stop: noop, destroy: noop, action: noop }
  throw new Error('Unknown V3 surface controller: ' + id)
}

export default { create: create }
