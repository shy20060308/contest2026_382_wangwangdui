import systemEvent from '../../../capabilities/system_event'
import interconnect from '../../../capabilities/interconnect'
import settingsStore from '../../../domain/settings/store'
import haptics from '../../../runtime/haptics'
var notificationFactory = require('../../../domain/notification/factory')

var EVENT_NAME = 'band.demo.notification'
var AUTO_DISMISS_MS = 10000
var HANGUP_DELAY_MS = 400
var HAPTIC_OWNER = 'notification'

function externalPayload(value) {
  var source = value
  if (value && value.params) source = value.params
  else if (value && value.options && value.options.params) source = value.options.params
  else if (value && value.data !== undefined) source = value.data
  if (typeof source === 'string') {
    try { source = JSON.parse(source) } catch (error) { source = { content: source } }
  }
  return source || {}
}

function initialState() {
  var value = notificationFactory.normalize({})
  value.visible = false
  return value
}

export function createNotificationController(onChange) {
  var state = initialState()
  var started = false
  var settingsReady = false
  var lifecycleGeneration = 0
  var dismissTimer = null
  var hangTimer = null

  function snapshot() {
    var copy = {}
    for (var key in state) copy[key] = state[key]
    return copy
  }

  function emit() {
    if (typeof onChange === 'function') onChange(snapshot())
  }

  function clearTimers() {
    clearTimeout(dismissTimer)
    clearTimeout(hangTimer)
    dismissTimer = null
    hangTimer = null
  }

  function registerExternal() {
    systemEvent.subscribe(EVENT_NAME, onExternal)
    interconnect.subscribe(onExternal)
  }

  function unregisterExternal() {
    systemEvent.unsubscribe(EVENT_NAME, onExternal)
    interconnect.unsubscribe(onExternal)
  }

  function vibrate() {
    if (!settingsReady) return false
    var settings = settingsStore.getSnapshot()
    if (!settings.vibrationEnabled) return false
    return haptics.play(settings.vibrationPattern, settings.vibrationLevel, HAPTIC_OWNER)
  }

  function dismiss() {
    clearTimers()
    haptics.stop(HAPTIC_OWNER)
    state.visible = false
    state.hangUp = false
    emit()
  }

  function show(payload) {
    clearTimers()
    state = notificationFactory.normalize(payload)
    state.visible = true
    vibrate()
    emit()
    dismissTimer = setTimeout(dismiss, AUTO_DISMISS_MS)
  }

  function onExternal(value) { show(externalPayload(value)) }

  return {
    start: function () {
      if (started) return
      started = true
      settingsReady = false
      var generation = ++lifecycleGeneration
      settingsStore.load(function () {
        if (!started || generation !== lifecycleGeneration) return
        settingsReady = true
        registerExternal()
      })
    },
    stop: function () {
      if (!started) return
      started = false
      settingsReady = false
      lifecycleGeneration++
      unregisterExternal()
      dismiss()
    },
    show: show,
    showDemo: function (type) { show(notificationFactory.demo(type)) },
    dismiss: dismiss,
    hangUp: function () {
      if (!state.visible || state.type !== 'call') return
      clearTimeout(dismissTimer)
      clearTimeout(hangTimer)
      state.hangUp = true
      emit()
      hangTimer = setTimeout(dismiss, HANGUP_DELAY_MS)
    }
  }
}
