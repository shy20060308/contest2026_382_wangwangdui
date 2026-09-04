var freedom = require('../freedom')

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var tall = safe.height > 250
  var compact = safe.height < 170
  var historyHeight = compact ? 30 : (tall ? 42 : 34)
  var historyTop = safe.top + (compact ? 24 : 30)
  var streamTop = historyTop + historyHeight + (compact ? 5 : 8)
  var metricHeight = compact ? 100 : (tall ? 142 : 118)
  var barColumnWidth = Math.round((safe.width / 8) * 100) / 100

  return {
    freedom: freedom.describe(freedom.ASSISTED),
    freedomLevel: freedom.ASSISTED,
    strategy: 'assisted',
    shape: shape,
    surface: shape === 'circle' ? 'compact-activity-stream' : (shape === 'pill' ? 'vertical-activity-stream' : 'activity-dashboard-stream'),
    title: { left: safe.left, top: safe.top, width: safe.width, height: 22 },
    history: { left: safe.left, top: historyTop, width: safe.width, height: historyHeight },
    stream: { left: safe.left, top: streamTop, width: safe.width, height: Math.max(40, safe.bottom - streamTop) },
    titleSize: compact ? 13 : (tall ? 17 : 15),
    historyRadius: Math.round(historyHeight / 2),
    historyTitleSize: compact ? 8 : (tall ? 11 : 9),
    historySubSize: compact ? 6 : (tall ? 9 : 7),
    metricHeight: metricHeight,
    metricGap: compact ? 6 : 10,
    metricRadius: compact ? 15 : 20,
    labelSize: compact ? 8 : (tall ? 11 : 9),
    goalSize: compact ? 6 : (tall ? 9 : 7),
    valueSize: compact ? 20 : (tall ? 30 : 24),
    chartHeight: clamp(Math.round(metricHeight * 0.42), 40, 62),
    barColumnWidth: barColumnWidth,
    barWidth: clamp(Math.round(barColumnWidth * 0.55), 9, 13),
    tickSize: compact ? 5 : 7
  }
}

module.exports = { freedomLevel: freedom.ASSISTED, contentWidth: contentWidth, resolve: resolve }
