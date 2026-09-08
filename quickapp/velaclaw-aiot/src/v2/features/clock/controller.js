import powerRuntimeFactory from '../../../runtime/power/controller'
import activityStore from '../../../domain/activity/store'
import historyRepository from '../../../domain/history/repository'
import watchfaceStore from '../../../domain/watchface/store'
import settingsStore from '../../../domain/settings/store'
import { createNotificationController } from '../notification/controller'

function requireFaceIds(ids) {
  if (!Array.isArray(ids) || !ids.length) throw new Error('Clock requires resolved faceIds')
  return ids.slice()
}

export function createClockController(onChange, onNotification) {
  var faceIds = []
  var selectedFaceId = ''
  var heartValues = []
  var started = false
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
    var nextId = faceIds.indexOf(id) >= 0 ? id : faceIds[0]
    selectedFaceId = nextId
    state.faceId = nextId
    state.faceIndex = faceIds.indexOf(nextId)
  }

  function updateTime() {
    state.timestamp = Date.now()
    emit()
  }

  function refreshActivity() {
    var activity = activityStore.getSnapshot()
    state.steps = activity.steps
    state.stepsGoal = activity.stepsGoal
    state.goalPercent = activity.goalPercent
    state.stepsPercent = activity.stepsPercent
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
    if (!powerRuntime) return
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
      applyFace(selectedFaceId)
      emit()
    },
    start: function () {
      if (started) return
      if (!faceIds.length) throw new Error('Clock must configure Recipe faceIds before start')
      started = true
      ensurePowerRuntime()
      refreshActivity()
      updateTime()
      settingsStore.load(function (settings) { configurePower(settings); if (powerRuntime) powerRuntime.start() })
      watchfaceStore.loadSelectedFaceId(function (id) { applyFace(id); emit() })
      historyRepository.saveToday(activityStore.getSnapshot(), function () {})
      notification.start()
    },
    stop: function () {
      if (!started) return
      started = false
      if (powerRuntime) powerRuntime.stop()
      notification.stop()
      historyRepository.saveToday(activityStore.getSnapshot(), function () {})
    },
    markActive: function (reason) { if (powerRuntime) powerRuntime.markActive(reason || 'user') },
    switchFace: function (step) {
      if (!faceIds.length) return ''
      var current = faceIds.indexOf(selectedFaceId)
      if (current < 0) current = 0
      var next = (current + step + faceIds.length) % faceIds.length
      applyFace(faceIds[next])
      watchfaceStore.setSelectedFaceId(selectedFaceId)
      emit()
      return selectedFaceId
    },
    wake: function (reason) { if (powerRuntime) powerRuntime.markActive(reason || 'wake') },
    dismissNotification: function () { notification.dismiss() },
    hangUpNotification: function () { notification.hangUp() },
    getSnapshot: snapshot
  }
}
