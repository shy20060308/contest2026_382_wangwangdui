import powerRuntimeFactory from '../../../runtime/power/controller'
import activityStore from '../../../domain/activity/store'
import watchfaceStore from '../../../domain/watchface/store'
import settingsStore from '../../../domain/settings/store'
import { createNotificationController } from '../notification/controller'

function requireFaceIds(ids) {
  if (!Array.isArray(ids) || !ids.length) throw new Error('Clock requires resolved faceIds')
  return ids.slice()
}

function requireAllowedFace(faceIds, id) {
  if (faceIds.indexOf(id) < 0) throw new Error('Clock watchface is not allowed by Recipe: ' + id)
  return id
}

export function createClockController(onChange, onNotification) {
  var faceIds = []
  var selectedFaceId = ''
  var heartValues = []
  var started = false
  var lifecycleGeneration = 0
  var powerRuntime = null
  var notification = createNotificationController(function (state) {
    if (state.visible && powerRuntime) powerRuntime.markActive('notification')
    if (typeof onNotification === 'function') onNotification(state)
  })
  var state = {
    faceIndex: 0,
    faceId: '',
    timestamp: Date.now(),
    batteryPercent: null,
    currentHeartRate: null,
    heartRateValues: [],
    steps: 0,
    stepsGoal: 0,
    goalPercent: 0,
    stepsPercent: 0,
    powerMode: 'ACTIVE'
  }

  function snapshot() {
    return {
      faceIndex: state.faceIndex,
      faceId: state.faceId,
      timestamp: state.timestamp,
      batteryPercent: state.batteryPercent,
      currentHeartRate: state.currentHeartRate,
      heartRateValues: state.heartRateValues.slice(),
      steps: state.steps,
      stepsGoal: state.stepsGoal,
      goalPercent: state.goalPercent,
      stepsPercent: state.stepsPercent,
      powerMode: state.powerMode
    }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  function applyFace(id) {
    selectedFaceId = requireAllowedFace(faceIds, id)
    state.faceId = selectedFaceId
    state.faceIndex = faceIds.indexOf(selectedFaceId)
  }

  function applyActivity(activity) {
    state.steps = activity.steps
    state.stepsGoal = activity.stepsGoal
    state.goalPercent = activity.goalPercent
    state.stepsPercent = activity.stepsPercent
  }

  function updateTime() {
    state.timestamp = Date.now()
    emit()
  }

  function onHeartRate(sample) {
    state.currentHeartRate = sample.value
    heartValues.push(sample.value)
    if (heartValues.length > 10) heartValues.shift()
    state.heartRateValues = heartValues.slice()
    emit()
  }

  function onBattery(percent) {
    state.batteryPercent = percent
    emit()
  }

  function onPower(mode) {
    state.powerMode = mode
    emit()
  }

  function configurePower(settings) {
    powerRuntime.configure({
      lowPowerEnabled: settings.lowPowerEnabled,
      raiseWakeEnabled: settings.raiseWakeEnabled,
      activeBrightnessValue: settings.brightnessValue
    })
  }

  function ensurePowerRuntime() {
    if (powerRuntime) return
    powerRuntime = powerRuntimeFactory.create({
      onMode: onPower,
      onTime: updateTime,
      onHeartRate: onHeartRate,
      onBattery: onBattery,
      onWake: function () { emit() }
    })
  }

  return {
    configureFaces: function (allowedFaceIds) {
      faceIds = requireFaceIds(allowedFaceIds)
      selectedFaceId = faceIds[0]
      applyFace(selectedFaceId)
      emit()
    },
    start: function () {
      if (started) return
      if (!faceIds.length) throw new Error('Clock must configure Recipe faceIds before start')
      started = true
      var generation = ++lifecycleGeneration
      var activityReady = false
      var settingsReady = false
      var runtimeStarted = false
      var settingsValue = null
      ensurePowerRuntime()

      function isCurrent() { return started && generation === lifecycleGeneration }
      function startRuntimeWhenReady() {
        if (!isCurrent() || runtimeStarted || !activityReady || !settingsReady) return
        configurePower(settingsValue)
        powerRuntime.start()
        notification.start()
        runtimeStarted = true
      }

      activityStore.hydrate(function (activity) {
        if (!isCurrent()) return
        applyActivity(activity)
        activityReady = true
        updateTime()
        startRuntimeWhenReady()
      })
      settingsStore.load(function (settings) {
        if (!isCurrent()) return
        settingsValue = settings
        settingsReady = true
        startRuntimeWhenReady()
      })
      watchfaceStore.loadSelectedFaceId(function (id) {
        if (!isCurrent()) return
        if (id) applyFace(id)
        if (activityReady) emit()
      })
    },
    stop: function () {
      if (!started) return
      started = false
      lifecycleGeneration++
      if (powerRuntime) powerRuntime.stop()
      notification.stop()
    },
    markActive: function (reason) { if (powerRuntime) powerRuntime.markActive(reason || 'user') },
    switchFace: function (step) {
      if (!faceIds.length) throw new Error('Clock must configure Recipe faceIds before switching')
      var current = faceIds.indexOf(selectedFaceId)
      var next = (current + step + faceIds.length) % faceIds.length
      applyFace(faceIds[next])
      watchfaceStore.setSelectedFaceId(selectedFaceId)
      emit()
      return selectedFaceId
    },
    wake: function (reason) { if (powerRuntime) powerRuntime.markActive(reason || 'wake') },
    dismissNotification: function () { notification.dismiss() },
    hangUpNotification: function () { notification.hangUp() }
  }
}
