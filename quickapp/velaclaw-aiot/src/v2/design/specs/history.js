var freedom = require('../freedom')
var adapter = require('../adapter')

function contentWidth(profile) { return adapter.contentWidth(profile) }

function resolve(profile, scene, safe) {
  var plan = adapter.createPlan(profile, scene, safe, freedom.ASSISTED, 'trend-stream')
  var preferred = adapter.contentWidth(profile)
  var scale = adapter.heightScale(safe, 170, 1, 1.22)
  var fontScale = adapter.heightScale(safe, 170, 1, 1.12)

  plan.headerHeight = Math.round(34 * fontScale)
  plan.header = adapter.fitBand(profile, scene, safe, {
    top: safe.top,
    height: plan.headerHeight,
    preferredWidth: preferred,
    minWidth: Math.min(116, preferred),
    edgePadding: 3,
    fit: 'edges',
    reposition: true
  })

  plan.stream = adapter.fitBand(profile, scene, safe, {
    top: plan.header.top,
    height: Math.max(40, safe.bottom - plan.header.top),
    preferredWidth: preferred,
    minWidth: Math.min(140, preferred),
    fit: 'center'
  })

  plan.headerWidth = plan.header.width
  plan.trendMode = plan.shape === 'pill' ? 'comparative-row' : 'compact-column'
  plan.chartHeight = plan.trendMode === 'comparative-row' ? 10 : Math.round(50 * Math.min(scale, 1.3))
  plan.pillTrendMinWidth = plan.trendMode === 'comparative-row' ? 14 : 0
  plan.pillTrendMaxWidth = plan.trendMode === 'comparative-row' ? Math.min(70, Math.round(plan.stream.width * 0.44)) : 0
  plan.cardGap = Math.max(6, Math.round(6 * scale))
  plan.cardRadius = Math.round(18 * Math.min(scale, 1.18))
  plan.summaryHeight = Math.round(48 * scale)
  plan.trendHeight = plan.trendMode === 'comparative-row' ? Math.round(182 * Math.min(scale, 1.12)) : Math.round(116 * Math.min(scale, 1.16))
  plan.insightHeight = Math.round(42 * scale)
  plan.summaryGap = plan.cardGap
  plan.summaryWidth = adapter.grid(plan.stream, 2, plan.summaryGap).itemWidth
  plan.insightGap = Math.max(4, Math.round(plan.cardGap * 0.7))
  plan.insightWidth = adapter.grid(plan.stream, 3, plan.insightGap).itemWidth
  plan.titleSize = Math.round(14 * fontScale)
  plan.subtitleSize = Math.max(6, Math.round(7 * fontScale))
  plan.summaryLabelSize = Math.max(6, Math.round(7 * fontScale))
  plan.summaryValueSize = Math.round(15 * fontScale)
  plan.insightLabelSize = Math.max(5, Math.round(6 * fontScale))
  plan.insightValueSize = Math.max(7, Math.round(9 * fontScale))

  plan.trendPadding = plan.trendMode === 'comparative-row' ? 9 : 4
  var chartInnerWidth = Math.max(1, plan.stream.width - plan.trendPadding * 2)
  var columnGrid = adapter.grid({ width: chartInnerWidth }, 7, 0)
  plan.columnCellWidth = columnGrid.itemWidth
  plan.columnBarWidth = Math.max(7, Math.min(10, Math.floor(plan.columnCellWidth * 0.48)))
  plan.columnValueSize = Math.max(5, Math.round(6 * fontScale))
  plan.columnWeekdaySize = Math.max(5, Math.round(6 * fontScale))
  plan.columnDateSize = Math.max(4, Math.round(5 * fontScale))
  plan.columnValueLineHeight = Math.max(8, Math.round(plan.columnValueSize * 1.35))
  plan.columnWeekdayLineHeight = Math.max(8, Math.round(plan.columnWeekdaySize * 1.35))
  plan.columnDateLineHeight = Math.max(7, Math.round(plan.columnDateSize * 1.4))
  return plan
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  resolve: resolve
}
