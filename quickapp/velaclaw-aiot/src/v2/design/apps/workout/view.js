var catalog = require('../../workout_catalog')

function pad2(value) { return value < 10 ? '0' + value : '' + value }

function formatDurationMs(durationMs) {
  var secondsTotal = Math.floor(durationMs / 1000)
  var hours = Math.floor(secondsTotal / 3600)
  var minutes = Math.floor((secondsTotal % 3600) / 60)
  var seconds = secondsTotal % 60
  return hours > 0 ? pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds) : pad2(minutes) + ':' + pad2(seconds)
}

function formatDistance(meters) {
  var value = Math.round(meters)
  return value >= 1000 ? (value / 1000).toFixed(2) + ' km' : value + ' m'
}

function gpsView(session) {
  if (session.gpsDistanceMeters > 0) return { text: 'GPS 距离', color: '#30D158' }
  if (session.gpsStatus === 'locating') return { text: '正在定位', color: '#8E8E93' }
  if (session.gpsStatus === 'unavailable') return { text: 'GPS 不可用 · 步幅估算', color: '#FF9F0A' }
  if (session.gpsStatus === 'paused') return { text: 'GPS 已暂停', color: '#8E8E93' }
  if (session.gpsStatus === 'active') return { text: 'GPS 已定位', color: '#64D2FF' }
  throw new Error('Unknown workout GPS status: ' + session.gpsStatus)
}

function stateView(session) {
  if (session.status === 'paused') return {
    statusText: '已暂停',
    statusColor: '#FFD60A',
    statusSurface: '#2B230D',
    heroBackground: '#19170F',
    metricOpacity: 0.68,
    pauseButtonText: '继续',
    pauseButtonBackground: '#30D158',
    pauseButtonColor: '#061008',
    durationLabelText: '已记录时长'
  }
  if (session.status === 'running') return {
    statusText: '运动中',
    statusColor: '#30D158',
    statusSurface: '#102018',
    heroBackground: '#10151A',
    metricOpacity: 1,
    pauseButtonText: '暂停',
    pauseButtonBackground: '#2C2C2E',
    pauseButtonColor: '#FFFFFF',
    durationLabelText: '运动时长'
  }
  throw new Error('Unknown workout status: ' + session.status)
}

function project(session) {
  if (!session) return null
  var mode = catalog.get(session.type)
  var gps = gpsView(session)
  var state = stateView(session)
  var hasHeartRate = session.currentHeartRate !== null
  return {
    modeName: mode.name,
    accentColor: mode.color,
    statusText: state.statusText,
    statusColor: state.statusColor,
    statusSurface: state.statusSurface,
    heroBackground: state.heroBackground,
    metricOpacity: state.metricOpacity,
    durationText: formatDurationMs(session.durationMs),
    durationLabelText: state.durationLabelText,
    stepsText: String(session.steps),
    caloriesText: String(session.calories),
    distanceText: formatDistance(session.distanceMeters),
    heartRateText: hasHeartRate ? String(session.currentHeartRate) : '--',
    heartRateLabel: hasHeartRate ? '心率 bpm' : '等待心率',
    gpsText: gps.text,
    gpsColor: gps.color,
    pauseButtonText: state.pauseButtonText,
    pauseButtonBackground: state.pauseButtonBackground,
    pauseButtonColor: state.pauseButtonColor
  }
}

module.exports = { project: project, formatDistance: formatDistance, formatDurationMs: formatDurationMs }
