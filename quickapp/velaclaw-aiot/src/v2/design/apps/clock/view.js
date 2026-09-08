var analog = require('../../analog')
var faceVisuals = require('../../watchface_catalog')

var MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
var WEEKS = ['SUN','MON','TUE','WED','THU','FRI','SAT']

function pad2(value) { return value < 10 ? '0' + value : '' + value }
function formatNumber(value) { return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }

function batteryView(percent) {
  if (percent === null || percent === undefined) return { percent: '--', width: '0%', color: '#8E8E93' }
  var numeric = Number(percent)
  if (!isFinite(numeric)) return { percent: '--', width: '0%', color: '#8E8E93' }
  var value = Math.max(0, Math.min(100, Math.round(numeric)))
  return { percent: value, width: value + '%', color: value <= 20 ? '#FF453A' : value <= 50 ? '#FFD60A' : '#30D158' }
}

function powerView(mode) {
  if (mode === 'SLEEP') return { label: '息屏', hint: '已暂停刷新', dimVisible: false, sleepVisible: true }
  if (mode === 'DIM') return { label: '暗屏', hint: '低频刷新', dimVisible: true, sleepVisible: false }
  return { label: '亮屏', hint: '实时刷新', dimVisible: false, sleepVisible: false }
}

function project(model) {
  var source = model || {}
  if (!source.faceId) throw new Error('Clock view requires resolved faceId')
  var timestamp = Number(source.timestamp) || Date.now()
  var now = new Date(timestamp)
  var battery = batteryView(source.batteryPercent)
  var power = powerView(source.powerMode)
  var visual = faceVisuals.get(source.faceId)
  var angles = analog.angles(now.getHours(), now.getMinutes(), now.getSeconds())
  var goalPercent = Math.max(0, Math.min(100, Number(source.goalPercent) || 0))
  var stepsPercent = Math.max(0, Math.min(100, Number(source.stepsPercent) || 0))
  var heartRate = Number(source.currentHeartRate)
  var heartRateText = source.currentHeartRate !== null && source.currentHeartRate !== undefined && isFinite(heartRate) && heartRate > 0 ? Math.round(heartRate) : '--'

  return {
    faceId: source.faceId,
    faceIndex: Number(source.faceIndex) || 0,
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
    currentHeartRate: heartRateText,
    heartRateData: Array.isArray(source.heartRateValues) ? source.heartRateValues.slice() : [],
    stepsText: formatNumber(source.steps),
    stepsGoalText: formatNumber(source.stepsGoal),
    goalPercent: goalPercent,
    stepsProgressWidth: stepsPercent + '%',
    powerModeText: power.label,
    powerRefreshText: power.hint,
    powerDimVisible: power.dimVisible,
    powerSleepVisible: power.sleepVisible
  }
}

module.exports = { project: project }
