import location from '../../../capabilities/location'
import workoutState from '../../../domain/workout/state_machine'
import workoutRepository from '../../../domain/workout/repository'
import activityStore from '../../../domain/activity/store'
import historyRepository from '../../../domain/history/repository'
var distance = require('../../../domain/workout/distance')

function emitValue(onChange, session) {
  if (typeof onChange === 'function') onChange(session)
  return session
}

export function createWorkoutController(onChange) {
  var timer = null
  var fallbackTimer = null
  var lastPoint = null
  var gpsDistance = 0
  var persistTicks = 0
  var runtimeActive = false

  function emit(session) { return emitValue(onChange, session) }
  function persist() { var active = workoutState.getActive(); if (active) workoutRepository.saveActive(active) }

  function stopLocation() {
    clearTimeout(fallbackTimer)
    fallbackTimer = null
    location.unsubscribe(onLocation)
    lastPoint = null
  }

  function onLocation(point) {
    clearTimeout(fallbackTimer)
    fallbackTimer = null
    if (!point) return
    if (lastPoint) gpsDistance += distance.acceptedSegment(lastPoint, point)
    lastPoint = point
    emit(workoutState.updateGps({ status: 'active', point: point, distanceMeters: Math.round(gpsDistance) }))
  }

  function startLocation() {
    stopLocation()
    var active = workoutState.getActive()
    gpsDistance = active && active.gpsDistanceMeters ? active.gpsDistanceMeters : 0
    var subscribed = location.subscribe(onLocation)
    if (!subscribed) emit(workoutState.updateGps({ status: 'fallback' }))
    fallbackTimer = setTimeout(function () {
      if (!lastPoint && workoutState.getActive()) emit(workoutState.updateGps({ status: 'fallback' }))
    }, 6000)
  }

  function stopTimer() {
    clearInterval(timer)
    timer = null
  }

  function ensureTimer() {
    if (timer) return
    timer = setInterval(function () {
      var session = workoutState.tick()
      if (!session) { stopTimer(); return }
      emit(session)
      persistTicks++
      if (persistTicks >= 10) { persistTicks = 0; persist() }
    }, 1000)
  }

  function startRuntime() {
    if (runtimeActive) return
    runtimeActive = true
    ensureTimer()
    var active = workoutState.getActive()
    if (active && active.status === 'running') startLocation()
  }

  function stopRuntime() {
    runtimeActive = false
    stopTimer()
    stopLocation()
    persist()
  }

  return {
    start: function (type, callback) {
      var session = workoutState.start(type)
      workoutRepository.saveActive(session, function () {
        startRuntime()
        emit(session)
        if (callback) callback(session)
      })
    },
    loadActive: function (callback) {
      var current = workoutState.getActive()
      if (current) {
        current = workoutState.tick()
        startRuntime()
        emit(current)
        if (callback) callback(current)
        return
      }
      workoutRepository.loadActive(function (stored) {
        if (!stored) { if (callback) callback(null); return }
        var restored = workoutState.restore(stored)
        startRuntime()
        persist()
        emit(restored)
        if (callback) callback(restored)
      })
    },
    pause: function () {
      var session = workoutState.pause()
      stopLocation()
      persist()
      return emit(session)
    },
    resume: function () {
      var session = workoutState.resume()
      startLocation()
      persist()
      return emit(session)
    },
    finish: function (callback) {
      stopRuntime()
      var record = workoutState.finish()
      workoutRepository.clearActive()
      if (!record) { if (callback) callback(null); return }
      activityStore.addAndPersist(record.steps, record.calories, function (activitySnapshot) {
        var pending = 2
        var savedRecord = record
        function done() { pending--; if (pending === 0 && callback) callback(savedRecord) }
        historyRepository.saveToday(activitySnapshot, done)
        workoutRepository.saveRecord(record, function (saved) { savedRecord = saved || record; done() })
      })
    },
    cancel: function () { stopRuntime(); workoutState.cancel(); workoutRepository.clearActive() },
    stop: stopRuntime,
    refresh: function () { var active = workoutState.getActive(); if (active) emit(workoutState.tick()) },
    getRecords: function (callback) { workoutRepository.getRecords(function (records) { if (callback) callback(Array.isArray(records) ? records : []) }) },
    markAllSynced: function (callback) { workoutRepository.markAllSynced(function (records, result) { if (callback) callback(Array.isArray(records) ? records : [], result) }) }
  }
}
