import motion from '../../../capabilities/motion'
import vibration from '../../../capabilities/vibration'
var metrics = require('../../domain/motion/metrics')

function format(value) { return Number(value || 0).toFixed(2) }

export function createMotionController(onChange) {
  var state = metrics.createState()
  var sensorActive = false
  var measureActive = false
  var measureStartSamples = 0
  var measureEndsAt = 0
  var measurePeak = 0
  var timer = null
  var sensorStatus = '未启动'
  var measurement = { countdown: '3.0', result: '待测量', color: '#8E8E93', button: '开始测量' }

  function emit() {
    var view = {
      sensorActive: sensorActive,
      sensorStatus: sensorStatus,
      sensorColor: sensorActive ? '#30D158' : '#8E8E93',
      sensorButtonText: sensorActive ? '停止诊断' : '开始诊断',
      xText: format(state.x), yText: format(state.y), zText: format(state.z), magnitudeText: format(state.magnitude), scoreText: format(state.score), intensityLabel: state.intensity.label, intensityColor: state.intensity.color,
      sampleText: sensorActive ? '已收到 ' + state.sampleCount + ' 个样本 · 当前' + state.intensity.label : '启动后显示真实样本与采样数量',
      countdownText: measurement.countdown, actionResult: measurement.result, actionColor: measurement.color, actionPeakText: format(measurePeak), measureButtonText: measurement.button,
      measureActive: measureActive
    }
    if (typeof onChange === 'function') onChange(view)
    return view
  }

  function onSample(sample) {
    state = metrics.applySample(state, sample)
    sensorStatus = '正在出数'
    if (measureActive && state.score > measurePeak) measurePeak = state.score
    emit()
  }

  function startSensor() {
    if (sensorActive) return true
    var ok = motion.subscribe(onSample, { interval: 'game' })
    sensorActive = !!ok
    sensorStatus = ok ? '等待样本' : '接口不可用'
    emit()
    return sensorActive
  }

  function stopSensor() {
    motion.unsubscribe(onSample)
    sensorActive = false
    sensorStatus = '已停止'
    emit()
  }

  function finishMeasure() {
    if (!measureActive) return
    clearInterval(timer); timer = null; measureActive = false
    var received = state.sampleCount > measureStartSamples
    var intensity = metrics.classify(measurePeak)
    measurement = { countdown: '完成', result: received ? intensity.label : '无样本', color: received ? intensity.color : '#FF453A', button: '再次测量' }
    vibration.vibrate(received ? 'short' : 'long')
    emit()
  }

  return {
    refresh: emit,
    toggleSensor: function () { if (sensorActive) stopSensor(); else startSensor() },
    reset: function () { state = metrics.createState(); measurePeak = 0; sensorStatus = sensorActive ? '重新校准中' : sensorStatus; return emit() },
    startMeasure: function () {
      if (measureActive || !startSensor()) return emit()
      measureActive = true; measurePeak = 0; measureStartSamples = state.sampleCount; measureEndsAt = Date.now() + 3000
      measurement = { countdown: '3.0', result: '测量中', color: '#64D2FF', button: '请完成动作' }
      vibration.vibrate('short')
      clearInterval(timer)
      timer = setInterval(function () { var remaining = Math.max(0, measureEndsAt - Date.now()); measurement.countdown = (remaining / 1000).toFixed(1); emit(); if (remaining <= 0) finishMeasure() }, 100)
      return emit()
    },
    stop: function () { clearInterval(timer); timer = null; measureActive = false; motion.unsubscribe(onSample); sensorActive = false },
    refreshSensor: startSensor
  }
}
