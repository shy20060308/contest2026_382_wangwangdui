var freedom = require('../freedom')
var assisted = require('../assisted')

function contentWidth(profile) { return assisted.contentWidth(profile) }

function resolve(profile, scene, safe) {
  var plan = assisted.createPlan(profile, safe, {
    circle: 'goal-progress-stream',
    pill: 'vertical-goal-progress',
    rect: 'goal-progress-dashboard'
  })
  var tall = safe.height > 250
  var compact = safe.height < 190
  var historyHeight = compact ? 30 : (tall ? 42 : 34)
  var historyTop = safe.top + (compact ? 24 : 30)
  var streamTop = historyTop + historyHeight + (compact ? 5 : 8)
  var metricPadding = compact ? 8 : (tall ? 10 : 9)

  plan.title = assisted.region(safe.left, safe.top, safe.width, 22)
  plan.history = assisted.region(safe.left, historyTop, safe.width, historyHeight)
  plan.stream = assisted.region(safe.left, streamTop, safe.width, Math.max(40, safe.bottom - streamTop))
  plan.titleSize = compact ? 13 : (tall ? 17 : 15)
  plan.historyRadius = Math.round(historyHeight / 2)
  plan.historyTitleSize = compact ? 8 : (tall ? 11 : 9)
  plan.historySubSize = compact ? 6 : (tall ? 9 : 7)
  plan.metricHeight = compact ? 86 : (tall ? 94 : 91)
  plan.metricGap = compact ? 6 : (tall ? 8 : 7)
  plan.metricRadius = compact ? 15 : (tall ? 18 : 16)
  plan.metricPadding = metricPadding
  plan.labelSize = compact ? 8 : (tall ? 10 : 9)
  plan.valueSize = compact ? 22 : (tall ? 28 : 24)
  plan.unitSize = compact ? 6 : (tall ? 8 : 7)
  plan.progressTextSize = compact ? 7 : (tall ? 10 : 8)
  plan.progressTrackWidth = Math.max(24, safe.width - metricPadding * 2)
  plan.progressTrackHeight = compact ? 6 : (tall ? 8 : 7)
  plan.progressTrackRadius = Math.ceil(plan.progressTrackHeight / 2)
  plan.footerSize = compact ? 6 : (tall ? 8 : 7)
  plan.progressGap = compact ? 5 : 7
  return plan
}

module.exports = { freedomLevel: freedom.ASSISTED, contentWidth: contentWidth, resolve: resolve }
