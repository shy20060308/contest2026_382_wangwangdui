var freedom = require('../freedom')
var adapter = require('../adapter')

function contentWidth(profile) { return adapter.contentWidth(profile, { circle: 136 }) }

function resolve(profile, scene, safe) {
  var plan = adapter.createPlan(profile, scene, safe, freedom.ASSISTED, 'trend-stream')
  var preferred = contentWidth(profile)
  var heightScale = adapter.heightScale(safe, 170, 0.96, 1.18)
  var widthRatio = adapter.clamp(preferred / 168, 0.80, 1)
  var compactness = Math.sqrt(widthRatio)
  var fontScale = adapter.clamp(Math.min(heightScale, 1.12) * compactness, 0.90, 1.12)

  plan.titleSize = Math.round(14 * fontScale)
  plan.subtitleSize = Math.max(6, Math.round(7 * fontScale))
  plan.goalSize = Math.round(15 * fontScale)
  plan.summaryLabelSize = Math.max(6, Math.round(7 * fontScale))
  plan.summaryValueSize = Math.round(15 * fontScale)
  plan.insightLabelSize = Math.max(5, Math.round(6 * fontScale))
  plan.insightValueSize = Math.max(7, Math.round(9 * fontScale))
  plan.trendTitleSize = Math.max(8, Math.round(9 * fontScale))
  plan.trendCaptionSize = Math.max(5, Math.round(6 * fontScale))

  plan.titleLineHeight = Math.max(18, Math.round(plan.titleSize * 1.28))
  plan.subtitleLineHeight = Math.max(9, Math.round(plan.subtitleSize * 1.38))
  plan.goalLineHeight = Math.max(plan.titleLineHeight, Math.round(plan.goalSize * 1.25))
  plan.headerHeight = plan.titleLineHeight + plan.subtitleLineHeight + 1
  plan.header = adapter.fitBand(profile, scene, safe, {
    top: safe.top,
    height: plan.headerHeight,
    preferredWidth: Math.min(132, preferred),
    minWidth: Math.min(126, preferred),
    edgePadding: 3,
    fit: 'edges',
    reposition: true
  })

  plan.stream = adapter.fitBand(profile, scene, safe, {
    top: plan.header.top,
    height: Math.max(40, safe.bottom - plan.header.top),
    preferredWidth: preferred,
    minWidth: Math.min(132, preferred),
    fit: 'center'
  })

  plan.headerWidth = plan.header.width
  plan.headerGap = 6
  plan.goalWidth = Math.max(36, Math.min(44, Math.round(plan.header.width * 0.30)))
  plan.titleWidth = Math.max(60, plan.header.width - plan.goalWidth - plan.headerGap)

  plan.trendMode = plan.shape === 'pill' ? 'comparative-row' : 'compact-column'
  plan.cardGap = Math.max(4, Math.round(5 * widthRatio))
  plan.cardRadius = Math.max(14, Math.round(17 * compactness))
  plan.summaryHeight = Math.max(36, Math.round(42 * widthRatio))
  plan.insightHeight = Math.max(38, Math.round(42 * widthRatio))
  plan.summaryGap = plan.cardGap
  plan.summaryWidth = adapter.grid(plan.stream, 2, plan.summaryGap).itemWidth
  plan.insightGap = Math.max(4, Math.round(plan.cardGap * 0.8))
  plan.insightWidth = adapter.grid(plan.stream, 3, plan.insightGap).itemWidth

  plan.trendHeadHeight = Math.max(12, Math.round(14 * fontScale))
  if (plan.trendMode === 'comparative-row') {
    plan.trendWidth = plan.stream.width
    plan.trendPadding = 9
    plan.chartHeight = 10
    plan.trendHeight = Math.round(182 * Math.min(heightScale, 1.12))
    plan.pillTrendMinWidth = 14
    plan.pillTrendMaxWidth = Math.min(70, Math.round(plan.stream.width * 0.44))
    plan.columnCellWidth = 0
    plan.columnBarWidth = 0
    plan.columnLabelSize = 0
    plan.columnLabelLineHeight = 0
  } else {
    plan.trendWidth = Math.max(124, Math.round(plan.stream.width * 0.91))
    plan.trendPadding = 8
    plan.chartHeight = Math.max(30, Math.round(36 * widthRatio * Math.min(heightScale, 1.08)))
    plan.columnLabelSize = Math.max(5, Math.round(6 * fontScale))
    plan.columnLabelLineHeight = Math.max(8, Math.round(plan.columnLabelSize * 1.35))
    plan.trendHeight = plan.trendPadding * 2 + plan.trendHeadHeight + 4 + plan.chartHeight + plan.columnLabelLineHeight
    plan.pillTrendMinWidth = 0
    plan.pillTrendMaxWidth = 0
    var chartInnerWidth = Math.max(1, plan.trendWidth - plan.trendPadding * 2)
    var columnGrid = adapter.grid({ width: chartInnerWidth }, 7, 0)
    plan.columnCellWidth = columnGrid.itemWidth
    plan.columnBarWidth = Math.max(7, Math.min(9, Math.floor(plan.columnCellWidth * 0.48)))
  }
  return plan
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  resolve: resolve
}
