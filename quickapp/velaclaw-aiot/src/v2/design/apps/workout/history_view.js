var catalog = require('../../workout_catalog')
var workoutView = require('./view')

function pad2(value) { return value < 10 ? '0' + value : '' + value }
function formatNumber(value) { return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
function formatDateTime(timestamp) {
  var date = new Date(timestamp)
  return pad2(date.getMonth() + 1) + '/' + pad2(date.getDate()) + ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes())
}

function distanceSourceText(source) {
  if (source === 'gps') return 'GPS 距离'
  if (source === 'steps') return '步幅估算'
  throw new Error('Unknown workout distance source: ' + source)
}

function project(model) {
  var records = []
  for (var i = 0; i < model.records.length; i++) {
    var record = model.records[i]
    var mode = catalog.get(record.type)
    records.push({
      id: record.id,
      typeName: mode.name,
      startText: formatDateTime(record.startTime),
      durationText: workoutView.formatDurationMs(record.durationSec * 1000),
      stepsText: formatNumber(record.steps),
      caloriesText: formatNumber(record.calories),
      distanceText: workoutView.formatDistance(record.distanceMeters),
      heartText: record.avgHeartRate === null ? '--' : record.avgHeartRate + ' bpm',
      syncText: record.synced ? '已同步' : '待同步',
      distanceSourceText: distanceSourceText(record.distanceSource)
    })
  }
  return {
    totalCount: String(records.length),
    totalSteps: formatNumber(model.totalSteps),
    empty: records.length === 0,
    records: records
  }
}

module.exports = { project: project }
