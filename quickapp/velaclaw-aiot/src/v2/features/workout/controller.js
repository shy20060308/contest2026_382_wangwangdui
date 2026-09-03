import location from '../../../capabilities/location'
import workoutState from '../../../domain/workout/state_machine'
import workoutRepository from '../../../domain/workout/repository'
import activityStore from '../../../domain/activity/store'
import historyRepository from '../../../domain/history/repository'

var MODES = {
  walk: { name: '步行', desc: '轻量有氧与日常健走', color: '#30D158' },
  run: { name: '跑步', desc: '更高步频与热量消耗', color: '#FF9F0A' }
}

function pad2(value) { return value < 10 ? '0' + value : '' + value }
function formatDuration(seconds) {
  var safe = Math.max(0, Math.floor(seconds || 0)); var hours = Math.floor(safe / 3600); var minutes = Math.floor((safe % 3600) / 60); var secs = safe % 60
  return hours > 0 ? pad2(hours) + ':' + pad2(minutes) + ':' + pad2(secs) : pad2(minutes) + ':' + pad2(secs)
}
function formatDistance(meters) { var value = Math.max(0, Math.round(Number(meters) || 0)); return value >= 1000 ? (value / 1000).toFixed(2) + ' km' : value + ' m' }
function formatDateTime(timestamp) { var d = new Date(timestamp); return pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) }
function mapSession(session) {
  if (!session) return null
  var mode = MODES[session.type] || MODES.walk
  return { id: session.id, type: session.type, typeName: mode.name, color: mode.color, status: session.status, statusText: session.status === 'running' ? '运动中' : '已暂停', durationText: formatDuration(session.durationMs / 1000), stepsText: String(session.steps), caloriesText: String(session.calories), distanceText: formatDistance(session.distanceMeters), distanceSource: session.gpsDistanceMeters > 0 ? 'gps' : 'steps', gpsStatus: session.gpsStatus === 'active' ? 'GPS 已定位' : (session.gpsStatus === 'paused' ? 'GPS 已暂停' : (session.gpsStatus === 'fallback' ? 'GPS 不可用 · 步幅估算' : '正在定位')), currentHeartRate: session.currentHeartRate }
}
function mapRecord(record) {
  if (!record) return null
  var mode = MODES[record.type] || MODES.walk
  return { id: record.id, type: record.type, typeName: mode.name, color: mode.color, startText: formatDateTime(record.startTime), durationText: formatDuration(record.durationSec), steps: record.steps, stepsText: String(record.steps), calories: record.calories, caloriesText: String(record.calories), distanceText: formatDistance(record.distanceMeters), distanceSource: record.distanceSource, avgHeartRate: record.avgHeartRate, synced: !!record.synced }
}
function radians(value) { return value * Math.PI / 180 }
function distanceBetween(first, second) {
  var earthRadius = 6371000; var latDelta = radians(second.latitude - first.latitude); var lonDelta = radians(second.longitude - first.longitude); var firstLat = radians(first.latitude); var secondLat = radians(second.latitude)
  var a = Math.sin(latDelta / 2) * Math.sin(latDelta / 2) + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2)
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getWorkoutModes() { return [{ type: 'walk', name: MODES.walk.name, desc: MODES.walk.desc, color: MODES.walk.color }, { type: 'run', name: MODES.run.name, desc: MODES.run.desc, color: MODES.run.color }] }

export function createWorkoutController(onChange) {
  var timer = null, fallbackTimer = null, lastPoint = null, gpsDistance = 0, persistTicks = 0, runtimeActive = false
  function emit(session) { if (typeof onChange === 'function') onChange(mapSession(session)) }
  function persist() { var active = workoutState.getActive(); if (active) workoutRepository.saveActive(active) }
  function stopLocation() { clearTimeout(fallbackTimer); fallbackTimer = null; location.unsubscribe(onLocation); lastPoint = null }
  function onLocation(point) {
    clearTimeout(fallbackTimer); fallbackTimer = null
    if (!point) return
    if (lastPoint) { var segment = distanceBetween(lastPoint, point); if (segment >= 2 && segment <= 200) gpsDistance += segment }
    lastPoint = point
    emit(workoutState.updateGps({ status: 'active', point: point, distanceMeters: Math.round(gpsDistance) }))
  }
  function startLocation() {
    stopLocation(); var active = workoutState.getActive(); gpsDistance = active && active.gpsDistanceMeters ? active.gpsDistanceMeters : 0
    var subscribed = location.subscribe(onLocation)
    if (!subscribed) emit(workoutState.updateGps({ status: 'fallback' }))
    fallbackTimer = setTimeout(function () { if (!lastPoint && workoutState.getActive()) emit(workoutState.updateGps({ status: 'fallback' })) }, 6000)
  }
  function stopTimer() { clearInterval(timer); timer = null }
  function ensureTimer() {
    if (timer) return
    timer = setInterval(function () {
      var session = workoutState.tick(); if (!session) { stopTimer(); return }
      emit(session); persistTicks++; if (persistTicks >= 10) { persistTicks = 0; persist() }
    }, 1000)
  }
  function startRuntime() { if (runtimeActive) return; runtimeActive = true; ensureTimer(); var active = workoutState.getActive(); if (active && active.status === 'running') startLocation() }
  function stopRuntime() { runtimeActive = false; stopTimer(); stopLocation(); persist() }

  return {
    start: function (type, callback) { var session = workoutState.start(type); workoutRepository.saveActive(session, function () { startRuntime(); emit(session); if (callback) callback(mapSession(session)) }) },
    loadActive: function (callback) {
      var current = workoutState.getActive()
      if (current) { current = workoutState.tick(); startRuntime(); emit(current); if (callback) callback(mapSession(current)); return }
      workoutRepository.loadActive(function (stored) { if (!stored) { if (callback) callback(null); return } var restored = workoutState.restore(stored); startRuntime(); persist(); emit(restored); if (callback) callback(mapSession(restored)) })
    },
    pause: function () { var session = workoutState.pause(); stopLocation(); persist(); emit(session); return mapSession(session) },
    resume: function () { var session = workoutState.resume(); startLocation(); persist(); emit(session); return mapSession(session) },
    finish: function (callback) {
      stopRuntime(); var record = workoutState.finish(); workoutRepository.clearActive()
      if (!record) { if (callback) callback(null); return }
      activityStore.addAndPersist(record.steps, record.calories, function (activitySnapshot) {
        var pending = 2, savedRecord = record
        function done() { pending--; if (pending === 0 && callback) callback(mapRecord(savedRecord)) }
        historyRepository.saveToday(activitySnapshot, function () { done() })
        workoutRepository.saveRecord(record, function (saved) { savedRecord = saved || record; done() })
      })
    },
    cancel: function () { stopRuntime(); workoutState.cancel(); workoutRepository.clearActive() },
    stop: stopRuntime,
    refresh: function () { var active = workoutState.getActive(); if (active) emit(workoutState.tick()) },
    getRecords: function (callback) { workoutRepository.getRecords(function (records) { var result = []; for (var i = 0; i < records.length; i++) result.push(mapRecord(records[i])); if (callback) callback(result) }) },
    markAllSynced: function (callback) { workoutRepository.markAllSynced(function (records, result) { var mapped = []; for (var i = 0; i < records.length; i++) mapped.push(mapRecord(records[i])); if (callback) callback(mapped, result) }) }
  }
}
