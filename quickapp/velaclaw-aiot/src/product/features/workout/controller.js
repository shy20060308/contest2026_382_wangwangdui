import location from '../../../capabilities/location'
import heartRate from '../../../capabilities/heart_rate'
import workoutState from '../../../domain/workout/state_machine'
import workoutRepository from '../../../domain/workout/repository'
var distance = require('../../../domain/workout/distance')
var healthMetrics = require('../../../domain/health/metrics')

function emitValue(onChange, session) {
  if (typeof onChange === 'function') onChange(session)
  return session
}

export function createWorkoutController(onChange) {
  var timer = null
  var locationTimeout = null
  var locationGeneration = 0
  var lastPoint = null
  var gpsDistance = 0
  var persistTicks = 0
  var runtimeActive = false
  var heartRateSubscribed = false
  var lifecycleGeneration = 0

  function emit(session) { return emitValue(onChange, session) }
  function persist() { var active = workoutState.getActive(); if (active) workoutRepository.saveActive(active) }
  function isCurrent(generation) { return generation === lifecycleGeneration }
  function persisted(result) { return !!(result && result.persisted) }

  function stopLocation() {
    locationGeneration++
    clearTimeout(locationTimeout)
    locationTimeout = null
    location.unsubscribe(onLocation)
    lastPoint = null
  }

  function onLocation(point) {
    if (!runtimeActive) return
    var active = workoutState.getActive()
    if (!active || active.status !== 'running') return
    clearTimeout(locationTimeout)
    locationTimeout = null
    if (lastPoint) gpsDistance += distance.acceptedSegment(lastPoint, point)
    lastPoint = point
    emit(workoutState.updateGps({ status: 'active', point: point, distanceMeters: gpsDistance }))
  }

  function startLocation() {
    stopLocation()
    var active = workoutState.getActive()
    if (!active || active.status !== 'running') return
    gpsDistance = active.gpsDistanceMeters
    var generation = locationGeneration
    var subscribed = location.subscribe(onLocation)
    if (!subscribed) {
      emit(workoutState.updateGps({ status: 'unavailable' }))
      return
    }
    locationTimeout = setTimeout(function () {
      if (generation !== locationGeneration || !runtimeActive) return
      var current = workoutState.getActive()
      if (current && current.status === 'running' && !lastPoint) emit(workoutState.updateGps({ status: 'unavailable' }))
    }, 6000)
  }

  function stopHeartRate() {
    if (!heartRateSubscribed) return
    heartRate.unsubscribe(onHeartRate)
    heartRateSubscribed = false
  }

  function onHeartRate(snapshot) {
    if (!runtimeActive || !snapshot || !snapshot.live || snapshot.source !== 'live' || !healthMetrics.isHeartRate(snapshot.value)) return
    var active = workoutState.getActive()
    if (!active || active.status !== 'running') return
    emit(workoutState.updateHeartRate(snapshot.value))
  }

  function startHeartRate() {
    stopHeartRate()
    var active = workoutState.getActive()
    if (!active || active.status !== 'running') return
    heartRateSubscribed = true
    heartRate.subscribe(onHeartRate)
  }

  function stopTimer() {
    clearInterval(timer)
    timer = null
  }

  function ensureTimer() {
    if (timer !== null) return
    timer = setInterval(function () {
      if (!runtimeActive) return
      var session = workoutState.tick()
      if (!session || session.status !== 'running') { stopTimer(); return }
      emit(session)
      persistTicks++
      if (persistTicks >= 10) { persistTicks = 0; persist() }
    }, 1000)
  }

  function startRuntime() {
    if (runtimeActive) return
    runtimeActive = true
    var active = workoutState.getActive()
    if (active && active.status === 'running') {
      ensureTimer()
      startLocation()
      startHeartRate()
    }
  }

  function stopRuntime(shouldPersist) {
    var wasActive = runtimeActive
    runtimeActive = false
    lifecycleGeneration++
    stopTimer()
    stopLocation()
    stopHeartRate()
    if (wasActive && shouldPersist !== false) persist()
  }

  function commitFinalized(record, callback) {
    workoutRepository.saveRecord(record, function (savedRecord, saveResult) {
      if (!persisted(saveResult)) return
      workoutRepository.clearActive(function (clearResult) {
        if (!persisted(clearResult)) return
        workoutState.complete(record.id)
        if (callback) callback(savedRecord)
      })
    })
  }

  return {
    loadActive: function (callback) {
      var generation = ++lifecycleGeneration
      var current = workoutState.getActive()
      if (current) {
        current = workoutState.tick()
        if (!isCurrent(generation)) return
        startRuntime()
        emit(current)
        if (callback) callback(current)
        return
      }
      workoutRepository.loadActive(function (stored) {
        if (!isCurrent(generation)) return
        if (stored === null) { if (callback) callback(null); return }
        var restored = workoutState.restore(stored)
        if (!restored) {
          workoutRepository.markActiveCorrupt(new Error('Invalid active workout persistence'))
          if (callback) callback(null)
          return
        }
        persistTicks = 0
        startRuntime()
        persist()
        emit(restored)
        if (callback) callback(restored)
      })
    },
    pause: function () {
      var session = workoutState.pause()
      stopTimer()
      stopLocation()
      stopHeartRate()
      persist()
      return emit(session)
    },
    resume: function () {
      var session = workoutState.resume()
      if (!session) return emit(session)
      if (!runtimeActive) startRuntime()
      else {
        ensureTimer()
        startLocation()
        startHeartRate()
      }
      persist()
      return emit(session)
    },
    finish: function (callback) {
      stopRuntime(false)
      var beforeFinish = workoutState.getActive()
      var alreadyFinalized = !!(beforeFinish && beforeFinish.finishedAt !== null && beforeFinish.finishedAt !== undefined)
      var record = workoutState.finish()
      if (!record) return
      var finalized = workoutState.getActive()
      emit(finalized)
      if (alreadyFinalized) {
        commitFinalized(record, callback)
        return
      }
      workoutRepository.saveActive(finalized, function (finalizeResult) {
        if (!persisted(finalizeResult)) return
        commitFinalized(record, callback)
      })
    },
    stop: function () { stopRuntime(true) }
  }
}
