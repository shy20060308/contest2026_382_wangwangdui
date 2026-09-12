import motion from '../../../capabilities/motion'
import haptics from '../../../runtime/haptics'
var metrics = require('../../../domain/motion/metrics')
var performanceMetrics = require('../../../runtime/performance_metrics')

var HAPTIC_OWNER = 'motion-diagnostics'
var MEASURE_DURATION_MS = 3000
var UI_SAMPLE_INTERVAL_MS = 100
var MEASURE_RENDER_INTERVAL_MS = 250

export function createMotionController(onChange) {
  var state = metrics.createState()
  var sensorActive = false
  var sensorStatus = 'idle'
  var measureActive = false
  var measureStartSamples = 0
  var measureEndsAt = 0
  var measurePeak = 0
  var measurePhase = 'idle'
  var measureIntensityKey = 'stable'
  var remainingMs = MEASURE_DURATION_MS
  var timer = null
  var sampleEmitTimer = null
  var lastSampleEmitAt = 0

  function snapshot() {
    return {
      sensorActive: sensorActive,
      sensorStatus: sensorStatus,
      x: state.x,
      y: state.y,
      z: state.z,
      magnitude: state.magnitude,
      score: state.score,
      sampleCount: state.sampleCount,
      intensityKey: state.intensityKey,
      measureActive: measureActive,
      measurePhase: measurePhase,
      measureIntensityKey: measureIntensityKey,
      measurePeak: measurePeak,
      remainingMs: remainingMs
    }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  function stopTimer() {
    if (timer !== null) clearInterval(timer)
    timer = null
  }

  function stopSampleEmitTimer() {
    if (sampleEmitTimer !== null) clearTimeout(sampleEmitTimer)
    sampleEmitTimer = null
  }

  function emitSampleUi() {
    sampleEmitTimer = null
    lastSampleEmitAt = Date.now()
    performanceMetrics.recordMotionUiEmit()
    emit()
  }

  function scheduleSampleUi() {
    var now = Date.now()
    var remaining = UI_SAMPLE_INTERVAL_MS - (now - lastSampleEmitAt)
    if (remaining <= 0) {
      stopSampleEmitTimer()
      emitSampleUi()
      return
    }
    if (sampleEmitTimer !== null) return
    sampleEmitTimer = setTimeout(emitSampleUi, remaining)
  }

  function resetMeasureState() {
    measureActive = false
    measureStartSamples = state.sampleCount
    measureEndsAt = 0
    measurePeak = 0
    measurePhase = 'idle'
    measureIntensityKey = 'stable'
    remainingMs = MEASURE_DURATION_MS
  }

  function cancelMeasure() {
    stopTimer()
    haptics.stop(HAPTIC_OWNER)
    resetMeasureState()
  }

  function onSensorFailure() {
    stopSampleEmitTimer()
    sensorActive = false
    sensorStatus = 'unavailable'
    if (measureActive) {
      stopTimer()
      haptics.stop(HAPTIC_OWNER)
      measureActive = false
      measureEndsAt = 0
      remainingMs = 0
      measurePhase = 'unavailable'
    }
    emit()
  }

  function onSample(sample) {
    performanceMetrics.recordMotionSample()
    state = metrics.applySample(state, sample)
    sensorStatus = 'streaming'
    if (measureActive && state.score > measurePeak) measurePeak = state.score
    scheduleSampleUi()
  }

  function startSensor(emitChange) {
    if (sensorActive) return true
    sensorActive = motion.subscribe(onSample, { interval: 'game', fail: onSensorFailure }) === true
    sensorStatus = sensorActive ? 'waiting' : 'unavailable'
    if (emitChange !== false) emit()
    return sensorActive
  }

  function stopSensor() {
    if (measureActive) cancelMeasure()
    stopSampleEmitTimer()
    motion.unsubscribe(onSample)
    sensorActive = false
    sensorStatus = 'stopped'
    emit()
  }

  function finishMeasure() {
    if (!measureActive) return
    stopTimer()
    measureActive = false
    measureEndsAt = 0
    remainingMs = 0
    var received = state.sampleCount > measureStartSamples
    measureIntensityKey = metrics.classify(measurePeak)
    measurePhase = received ? 'complete' : 'no-samples'
    haptics.play(received ? 'tap' : 'alert', 'medium', HAPTIC_OWNER)
    emit()
  }

  return {
    refresh: emit,
    toggleSensor: function () { if (sensorActive) stopSensor(); else startSensor(true) },
    reset: function () {
      stopSampleEmitTimer()
      cancelMeasure()
      state = metrics.createState()
      measureStartSamples = 0
      if (sensorActive) sensorStatus = 'recalibrating'
      return emit()
    },
    startMeasure: function () {
      if (measureActive) return emit()
      if (!startSensor(false)) return emit()
      measureActive = true
      measurePeak = 0
      measureStartSamples = state.sampleCount
      measureEndsAt = Date.now() + MEASURE_DURATION_MS
      remainingMs = MEASURE_DURATION_MS
      measurePhase = 'measuring'
      measureIntensityKey = 'stable'
      haptics.play('tap', 'medium', HAPTIC_OWNER)
      stopTimer()
      timer = setInterval(function () {
        remainingMs = Math.max(0, measureEndsAt - Date.now())
        emit()
        if (remainingMs <= 0) finishMeasure()
      }, MEASURE_RENDER_INTERVAL_MS)
      return emit()
    },
    stop: function () {
      stopSampleEmitTimer()
      cancelMeasure()
      motion.unsubscribe(onSample)
      sensorActive = false
      sensorStatus = 'stopped'
    }
  }
}
