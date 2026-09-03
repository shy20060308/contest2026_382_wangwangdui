var catalog = require('../workout_catalog')

function pad2(value) { return value < 10 ? '0' + value : '' + value }

function formatDurationMs(durationMs) {
  var safe = Math.max(0, Math.floor((Number(durationMs) || 0) / 1000))
  var hours = Math.floor(safe / 3600)
  var minutes = Math.floor((safe % 3600) / 60)
  var seconds = safe % 60
  return hours > 0 ? pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds) : pad2(minutes) + ':' + pad2(seconds)
}

function formatDistance(meters) {
  var value = Math.max(0, Math.round(Number(meters) || 0))
  return value >= 1000 ? (value / 1000).toFixed(2) + ' km' : value + ' m'
}

function gpsView(session) {
  var source = session || {}
  if ((Number(source.gpsDistanceMeters) || 0) > 0) return { text: 'GPS 距离', color: '#30D158' }
  if (source.gpsStatus === 'fallback') return { text: 'GPS 不可用 · 步幅估算', color: '#FF9F0A' }
  if (source.gpsStatus === 'paused') return { text: 'GPS 已暂停', color: '#8E8E93' }
  if (source.gpsStatus === 'active') return { text: 'GPS 已定位', color: '#8E8E93' }
  return { text: '正在定位', color: '#8E8E93' }
}

function project(session) {
  if (!session) return null
  var mode = catalog.get(session.type)
  var gps = gpsView(session)
  return {
    modeName: mode.name,
    accentColor: mode.color,
    statusText: session.status === 'running' ? '运动中' : '已暂停',
    durationText: formatDurationMs(session.durationMs),
    stepsText: String(Number(session.steps) || 0),
    caloriesText: String(Number(session.calories) || 0),
    distanceText: formatDistance(session.distanceMeters),
    heartRateText: session.currentHeartRate === undefined || session.currentHeartRate === null ? '--' : String(session.currentHeartRate),
    gpsText: gps.text,
    gpsColor: gps.color,
    pauseButtonText: session.status === 'running' ? '暂停' : '继续'
  }
}

module.exports = { project: project, formatDistance: formatDistance, formatDurationMs: formatDurationMs }
