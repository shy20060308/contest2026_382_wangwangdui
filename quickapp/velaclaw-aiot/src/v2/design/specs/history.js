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
  plan.summaryValueSize = Math.round(14 * fontScale)
  plan.insightLabelSize = Math.max(5, Math.round(6 * fontScale))
  plan.insightValueSize = Math.max(7, Math.round(9 * fontScale))
  plan.trendTitleSize = Math.max(8, Math.round(9 * fontScale))
  plan.trendCaptionSize = Math.max(5, Math.round(6 * fontScale))

  plan.titleLineHeight = Math.max(17, Math.round(plan.titleSize * 1.28))
  plan.subtitleLineHeight = Math.max(8, Math.round(plan.subtitleSize * 1.35))
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

  plan.summaryPaddingX = Math.max(6, Math.round(7 * widthRatio))
  plan.summaryPaddingY = Math.max(5, Math.round(6 * widthRatio))
  plan.summaryOuterHeight = Math.max(34, Math.round(38 * widthRatio))
  plan.summaryHeight = adapter.contentBoxSize(1, plan.summaryOuterHeight, 0, plan.summaryPaddingY).height
  plan.summaryRowWidth = plan.stream.width
  plan.summaryGap = plan.cardGap
  var summaryGrid = adapter.grid({ width: plan.summaryRowWidth }, 2, plan.summaryGap)
  plan.summaryOuterWidth = summaryGrid.itemWidth
  plan.summaryWidth = adapter.contentBoxSize(plan.summaryOuterWidth, 1, plan.summaryPaddingX, 0).width

  plan.insightPaddingX = Math.max(5, Math.round(6 * widthRatio))
  plan.insightPaddingY = Math.max(5, Math.round(5 * widthRatio))
  plan.insightOuterHeight = Math.max(36, Math.round(40 * widthRatio))
  plan.insightHeight = adapter.contentBoxSize(1, plan.insightOuterHeight, 0, plan.insightPaddingY).height
  plan.insightGap = Math.max(4, Math.round(plan.cardGap * 0.8))
  var insightGrid = adapter.grid(plan.stream, 3, plan.insightGap)
  plan.insightOuterWidth = insightGrid.itemWidth
  plan.insightWidth = adapter.contentBoxSize(plan.insightOuterWidth, 1, plan.insightPaddingX, 0).width

  plan.trendHeadHeight = Math.max(12, Math.round(14 * fontScale))
  if (plan.trendMode === 'comparative-row') {
    plan.trendPadding = 9
    plan.trendOuterWidth = plan.stream.width
    plan.trendWidth = adapter.contentBoxSize(plan.trendOuterWidth, 1, plan.trendPadding, 0).width
    plan.trendOuterHeight = Math.round(182 * Math.min(heightScale, 1.12))
    plan.trendHeight = adapter.contentBoxSize(1, plan.trendOuterHeight, 0, plan.trendPadding).height
    plan.chartHeight = 10
    plan.pillTrendMinWidth = 14
    plan.pillTrendMaxWidth = Math.min(70, Math.round(plan.trendWidth * 0.50))
    plan.columnCellWidth = 0
    plan.columnBarWidth = 0
    plan.columnLabelSize = 0
    plan.columnLabelLineHeight = 0
  } else {
    plan.trendPadding = Math.max(6, Math.round(7 * widthRatio))
    plan.columnLabelSize = Math.max(5, Math.round(6 * fontScale))
    plan.columnLabelLineHeight = Math.max(8, Math.round(plan.columnLabelSize * 1.35))
    plan.trendOuterHeight = Math.max(62, Math.round(68 * widthRatio))

    var summaryTop = plan.header.top + plan.headerHeight + plan.cardGap
    var trendTop = summaryTop + plan.summaryOuterHeight + plan.cardGap
    var available = adapter.availableBandWidth(profile, scene, trendTop, plan.trendOuterHeight, { edgePadding: 4, fit: 'edges' })
    var wantedOuterWidth = Math.min(plan.stream.width, Math.max(128, Math.round(plan.stream.width * 0.94)))
    plan.trendOuterWidth = Math.max(112, Math.min(wantedOuterWidth, Math.floor(available || wantedOuterWidth)))
    plan.trendWidth = adapter.contentBoxSize(plan.trendOuterWidth, 1, plan.trendPadding, 0).width
    plan.trendHeight = adapter.contentBoxSize(1, plan.trendOuterHeight, 0, plan.trendPadding).height
    plan.chartHeight = Math.max(24, plan.trendHeight - plan.trendHeadHeight - plan.columnLabelLineHeight - 4)
    plan.pillTrendMinWidth = 0
    plan.pillTrendMaxWidth = 0
    var columnGrid = adapter.grid({ width: plan.trendWidth }, 7, 0)
    plan.columnCellWidth = columnGrid.itemWidth
    plan.columnBarWidth = Math.max(6, Math.min(8, Math.floor(plan.columnCellWidth * 0.46)))
  }
  return plan
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  resolve: resolve
}
