import motion from '../../../capabilities/motion'
import haptics from '../../system/haptics'
var metrics = require('../../../domain/motion/metrics')

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
  var remainingMs = 3000
  var timer = null

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

  function onSample(sample) {
    state = metrics.applySample(state, sample)
    sensorStatus = 'streaming'
    if (measureActive && state.score > measurePeak) measurePeak = state.score
    emit()
  }

  function startSensor() {
    if (sensorActive) return true
    var ok = motion.subscribe(onSample, { interval: 'game' })
    sensorActive = !!ok
    sensorStatus = ok ? 'waiting' : 'unavailable'
    emit()
    return sensorActive
  }

  function stopSensor() {
    motion.unsubscribe(onSample)
    sensorActive = false
    sensorStatus = 'stopped'
    emit()
  }

  function stopTimer() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function finishMeasure() {
    if (!measureActive) return
    stopTimer()
    measureActive = false
    remainingMs = 0
    var received = state.sampleCount > measureStartSamples
    measureIntensityKey = metrics.classify(measurePeak)
    measurePhase = received ? 'complete' : 'no-samples'
    haptics.play(received ? 'tap' : 'alert', 'medium')
    emit()
  }

  return {
    refresh: emit,
    toggleSensor: function () { if (sensorActive) stopSensor(); else startSensor() },
    reset: function () {
      state = metrics.createState()
      measurePeak = 0
      if (sensorActive) sensorStatus = 'recalibrating'
      return emit()
    },
    startMeasure: function () {
      if (measureActive || !startSensor()) return emit()
      measureActive = true
      measurePeak = 0
      measureStartSamples = state.sampleCount
      measureEndsAt = Date.now() + 3000
      remainingMs = 3000
      measurePhase = 'measuring'
      measureIntensityKey = 'stable'
      haptics.play('tap', 'medium')
      stopTimer()
      timer = setInterval(function () {
        remainingMs = Math.max(0, measureEndsAt - Date.now())
        emit()
        if (remainingMs <= 0) finishMeasure()
      }, 100)
      return emit()
    },
    stop: function () {
      stopTimer()
      measureActive = false
      motion.unsubscribe(onSample)
      sensorActive = false
      haptics.stop()
    },
    refreshSensor: startSensor
  }
}
