import powerRuntimeFactory from '../../../runtime/power/controller'
import activityStore from '../../../domain/activity/store'
import historyRepository from '../../../domain/history/repository'
import watchfaceStore from '../../../domain/watchface/store'
import settingsStore from '../../../domain/settings/store'
import { createNotificationController } from '../notification/controller'
var faceCatalog = require('../../../domain/watchface/catalog')
var analog = require('../../design/analog')

var MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
var WEEKS = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function pad2(value) { return value < 10 ? '0' + value : '' + value }
function formatNumber(value) { return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
function copyIds(ids) { return Array.isArray(ids) && ids.length ? ids.slice() : ['sport','simple','dashboard'] }

function batteryView(percent) {
  var value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))
  return { percent: value, width: value + '%', color: value <= 20 ? '#FF453A' : value <= 50 ? '#FFD60A' : '#30D158' }
}

function powerView(mode) {
  if (mode === 'SLEEP') return { mode: mode, label: '息屏', hint: '已暂停刷新', dimVisible: false, sleepVisible: true }
  if (mode === 'DIM') return { mode: mode, label: '暗屏', hint: '低频刷新', dimVisible: true, sleepVisible: false }
  return { mode: 'ACTIVE', label: '亮屏', hint: '实时刷新', dimVisible: false, sleepVisible: false }
}

export function createClockController(onChange, onNotification) {
  var faceIds = ['sport','simple','dashboard']
  var selectedFaceId = faceIds[0]
  var heartValues = []
  var started = false
  var powerRuntime = null
  var notification = createNotificationController(function (state) {
    if (state.visible && powerRuntime) powerRuntime.markActive('notification')
    if (typeof onNotification === 'function') onNotification(state)
  })
  var state = {
    faceIndex: 0,
    faceId: selectedFaceId,
    faceBackground: '#000000',
    faceAccent: '#0A84FF',
    displayMonth: 'JAN', displayDate: '01', displayWeek: 'MON', displayHours: '00', displayMinutes: '00',
    analogTicks: analog.ticks(), hourHandTransform: analog.transform(0), minuteHandTransform: analog.transform(0), secondHandTransform: analog.transform(0),
    batteryPercent: 75, batteryWidth: '75%', batteryColor: '#30D158',
    currentHeartRate: 88, heartRateData: [], stepsText: '0', stepsGoalText: '0', goalPercent: 0, stepsProgressWidth: '0%',
    powerMode: 'ACTIVE', powerModeText: '亮屏', powerRefreshText: '实时刷新', powerDimVisible: false, powerSleepVisible: false
  }

  function emit() {
    if (typeof onChange === 'function') onChange(state)
  }

  function applyFace(id) {
    var nextId = faceIds.indexOf(id) >= 0 ? id : faceIds[0]
    var face = faceCatalog.get(nextId) || faceCatalog.get(faceIds[0])
    if (!face) return
    selectedFaceId = nextId
    state.faceId = nextId
    state.faceIndex = Math.max(0, faceIds.indexOf(nextId))
    state.faceBackground = face.background
    state.faceAccent = face.accent
  }

  function updateTime() {
    var now = new Date()
    state.displayMonth = MONTHS[now.getMonth()]
    state.displayDate = now.getDate().toString()
    state.displayWeek = WEEKS[now.getDay()]
    state.displayHours = pad2(now.getHours())
    state.displayMinutes = pad2(now.getMinutes())
    if (selectedFaceId === 'mechanical') {
      var value = analog.angles(now.getHours(), now.getMinutes(), now.getSeconds())
      state.hourHandTransform = analog.transform(value.hour)
      state.minuteHandTransform = analog.transform(value.minute)
      state.secondHandTransform = analog.transform(value.second)
    }
    emit()
  }

  function refreshActivity() {
    var activity = activityStore.getSnapshot()
    state.stepsText = formatNumber(activity.steps)
    state.stepsGoalText = formatNumber(activity.stepsGoal)
    state.goalPercent = activity.goalPercent
    state.stepsProgressWidth = Math.max(0, Math.min(100, activity.stepsPercent || 0)) + '%'
  }

  function onHeartRate(sample) {
    if (!sample || sample.value === undefined || sample.value === null) return
    state.currentHeartRate = Math.round(Number(sample.value) || state.currentHeartRate)
    heartValues.push(state.currentHeartRate)
    if (heartValues.length > 10) heartValues.shift()
    state.heartRateData = heartValues.slice()
    emit()
  }

  function onBattery(percent) {
    var view = batteryView(percent)
    state.batteryPercent = view.percent
    state.batteryWidth = view.width
    state.batteryColor = view.color
    emit()
  }

  function onPower(mode) {
    var view = powerView(mode)
    state.powerMode = view.mode
    state.powerModeText = view.label
    state.powerRefreshText = view.hint
    state.powerDimVisible = view.dimVisible
    state.powerSleepVisible = view.sleepVisible
    emit()
  }

  function configurePower(settings) {
    if (!powerRuntime) return
    powerRuntime.configure({
      lowPowerEnabled: settings.lowPowerEnabled !== false,
      raiseWakeEnabled: settings.raiseWakeEnabled !== false,
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
      faceIds = copyIds(allowedFaceIds)
      applyFace(selectedFaceId)
      emit()
    },
    start: function () {
      if (started) return
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
    getSnapshot: function () { return state }
  }
}
