var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L2, config.surface)
  var streamTop = safe.top + config.streamTop
  plan.stream = adapter.placeBand(profile, scene, safe, {
    bounds: 'scene',
    absoluteTop: true,
    top: streamTop,
    width: config.contentWidth,
    height: scene.height - streamTop
  })
  plan.streamPaddingBottom = Math.max(config.streamPaddingBottom, scene.height - safe.bottom)

  plan.headerWidth = config.headerWidth
  plan.headerHeight = config.headerHeight
  plan.titleWidth = config.titleWidth
  plan.goalWidth = config.goalWidth
  plan.titleSize = config.titleSize
  plan.subtitleSize = config.subtitleSize
  plan.goalSize = config.goalSize
  plan.titleLineHeight = config.titleLineHeight
  plan.subtitleLineHeight = config.subtitleLineHeight
  plan.goalLineHeight = config.goalLineHeight
  plan.cardGap = config.cardGap
  plan.cardRadius = config.cardRadius

  plan.summaryGap = config.cardGap
  plan.summaryRowHeight = config.summaryOuterHeight
  plan.summaryPaddingX = config.summaryPaddingX
  plan.summaryPaddingY = config.summaryPaddingY
  var summaryOuter = adapter.grid(plan.stream, 2, plan.summaryGap).itemWidth
  var summaryBox = adapter.contentBox(summaryOuter, config.summaryOuterHeight, plan.summaryPaddingX, plan.summaryPaddingY)
  plan.summaryOuterWidth = summaryOuter
  plan.summaryWidth = summaryBox.width
  plan.summaryHeight = summaryBox.height
  plan.summaryLabelSize = config.summaryLabelSize
  plan.summaryValueSize = config.summaryValueSize

  plan.insightGap = config.insightGap
  plan.insightRowHeight = config.insightOuterHeight
  plan.insightPadding = config.insightPadding
  var insightOuter = adapter.grid(plan.stream, 3, plan.insightGap).itemWidth
  var insightBox = adapter.contentBox(insightOuter, config.insightOuterHeight, plan.insightPadding, plan.insightPadding)
  plan.insightOuterWidth = insightOuter
  plan.insightWidth = insightBox.width
  plan.insightHeight = insightBox.height
  plan.insightLabelSize = config.insightLabelSize
  plan.insightValueSize = config.insightValueSize

  var trend = config.trend
  plan.trendMode = trend.mode
  plan.trendOuterWidth = trend.outerWidth
  plan.trendOuterHeight = trend.outerHeight
  plan.trendPaddingX = trend.paddingX
  plan.trendPaddingY = trend.paddingY
  var trendBox = adapter.contentBox(plan.trendOuterWidth, plan.trendOuterHeight, plan.trendPaddingX, plan.trendPaddingY)
  plan.trendWidth = trendBox.width
  plan.trendHeight = trendBox.height
  plan.trendHeadHeight = trend.headHeight
  plan.trendTitleSize = trend.titleSize
  plan.trendCaptionSize = trend.captionSize
  plan.chartHeight = trend.chartHeight
  plan.columnLabelSize = trend.labelSize
  plan.columnLabelLineHeight = trend.labelLineHeight
  plan.columnBarWidth = trend.barWidth
  plan.barMinHeight = trend.barMinHeight
  plan.pillTrendMinWidth = trend.rowMinWidth
  plan.pillTrendMaxWidth = trend.rowMaxWidth
  plan.columnCellWidth = plan.trendMode === 'compact-column' ? adapter.grid({ width: plan.trendWidth }, 7, 0).itemWidth : 0
  plan.chrome = adapter.merge({}, config.chrome)
  return plan
}

module.exports = {
  differenceLevel: difference.L2,
  contentWidth: contentWidth,
  resolve: resolve,
  layout: layout
}
