var analog = require('../../analog')
var faceVisuals = require('../../watchface_catalog')

var MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
var WEEKS = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function pad2(value) { return value < 10 ? '0' + value : '' + value }
function formatNumber(value) { return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }

function batteryView(percent) {
  if (percent === null) return { percent: '--', width: '0%', color: '#8E8E93' }
  return { percent: percent, width: percent + '%', color: percent <= 20 ? '#FF453A' : percent <= 50 ? '#FFD60A' : '#30D158' }
}

function powerView(mode) {
  if (mode === 'ACTIVE') return { label: '亮屏', hint: '实时刷新', dimVisible: false, sleepVisible: false }
  if (mode === 'DIM') return { label: '暗屏', hint: '低频刷新', dimVisible: true, sleepVisible: false }
  if (mode === 'SLEEP') return { label: '息屏', hint: '已暂停刷新', dimVisible: false, sleepVisible: true }
  throw new Error('Unknown Clock power mode: ' + mode)
}

function project(model) {
  var now = new Date(model.timestamp)
  var battery = batteryView(model.batteryPercent)
  var power = powerView(model.powerMode)
  var visual = faceVisuals.get(model.faceId)
  var angles = analog.angles(now.getHours(), now.getMinutes(), now.getSeconds())

  return {
    faceId: model.faceId,
    faceIndex: model.faceIndex,
    faceBackground: visual.background,
    faceAccent: visual.accent,
    displayMonth: MONTHS[now.getMonth()],
    displayDate: String(now.getDate()),
    displayWeek: WEEKS[now.getDay()],
    displayHours: pad2(now.getHours()),
    displayMinutes: pad2(now.getMinutes()),
    analogTicks: analog.ticks(),
    hourHandTransform: analog.transform(angles.hour),
    minuteHandTransform: analog.transform(angles.minute),
    secondHandTransform: analog.transform(angles.second),
    batteryPercent: battery.percent,
    batteryWidth: battery.width,
    batteryColor: battery.color,
    currentHeartRate: model.currentHeartRate === null ? '--' : model.currentHeartRate,
    heartRateData: model.heartRateValues.slice(),
    stepsText: formatNumber(model.steps),
    stepsGoalText: formatNumber(model.stepsGoal),
    goalPercent: model.goalPercent,
    stepsProgressWidth: model.stepsPercent + '%',
    powerModeText: power.label,
    powerRefreshText: power.hint,
    powerDimVisible: power.dimVisible,
    powerSleepVisible: power.sleepVisible
  }
}

module.exports = { project: project }
