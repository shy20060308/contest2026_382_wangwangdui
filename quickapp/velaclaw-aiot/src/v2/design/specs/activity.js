var freedom = require('../freedom')
var assisted = require('../assisted')

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }
function contentWidth(profile) { return assisted.contentWidth(profile) }

function resolve(profile, scene, safe) {
  var plan = assisted.createPlan(profile, safe, {
    circle: 'compact-activity-stream',
    pill: 'vertical-activity-stream',
    rect: 'activity-dashboard-stream'
  })
  var tall = safe.height > 250
  var compact = safe.height < 170
  var historyHeight = compact ? 30 : (tall ? 42 : 34)
  var historyTop = safe.top + (compact ? 24 : 30)
  var streamTop = historyTop + historyHeight + (compact ? 5 : 8)
  var metricHeight = compact ? 100 : (tall ? 142 : 118)
  var barColumnWidth = Math.round((safe.width / 8) * 100) / 100

  plan.title = assisted.region(safe.left, safe.top, safe.width, 22)
  plan.history = assisted.region(safe.left, historyTop, safe.width, historyHeight)
  plan.stream = assisted.region(safe.left, streamTop, safe.width, Math.max(40, safe.bottom - streamTop))
  plan.titleSize = compact ? 13 : (tall ? 17 : 15)
  plan.historyRadius = Math.round(historyHeight / 2)
  plan.historyTitleSize = compact ? 8 : (tall ? 11 : 9)
  plan.historySubSize = compact ? 6 : (tall ? 9 : 7)
  plan.metricHeight = metricHeight
  plan.metricGap = compact ? 6 : 10
  plan.metricRadius = compact ? 15 : 20
  plan.labelSize = compact ? 8 : (tall ? 11 : 9)
  plan.goalSize = compact ? 6 : (tall ? 9 : 7)
  plan.valueSize = compact ? 20 : (tall ? 30 : 24)
  plan.chartHeight = clamp(Math.round(metricHeight * 0.42), 40, 62)
  plan.barColumnWidth = barColumnWidth
  plan.barWidth = clamp(Math.round(barColumnWidth * 0.55), 9, 13)
  plan.tickSize = compact ? 5 : 7
  return plan
}

module.exports = { freedomLevel: freedom.ASSISTED, contentWidth: contentWidth, resolve: resolve }
