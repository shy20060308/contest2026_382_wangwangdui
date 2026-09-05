var freedom = require('../../freedom')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function centeredBox(stream, top, width, height) {
  return adapter.region(stream.left + Math.round((stream.width - width) / 2), top, width, height)
}

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, config.surface)
  plan.stream = adapter.placeBand(profile, scene, safe, {
    top: config.streamTop,
    width: config.contentWidth,
    height: Math.max(1, safe.bottom - (safe.top + config.streamTop))
  })

  plan.headerWidth = config.headerWidth
  plan.headerHeight = config.headerHeight
  plan.headGap = config.headGap
  plan.headTitleWidth = config.headTitleWidth
  plan.headSummaryWidth = config.headSummaryWidth
  plan.headSubtitleWidth = config.headSubtitleWidth
  plan.headSourceWidth = config.headSourceWidth

  plan.cardGap = config.cardGap
  plan.cardRadius = config.cardRadius
  plan.cardPaddingX = config.cardPaddingX
  plan.cardPaddingY = config.cardPaddingY
  plan.chartHeight = config.chartHeight
  plan.trendMinHeight = config.trendMinHeight
  plan.scrollPaddingBottom = config.scrollPaddingBottom

  var hero = adapter.contentBox(plan.stream.width, config.heroOuterHeight, config.cardPaddingX, config.cardPaddingY)
  plan.cardWidth = hero.width
  plan.heroHeight = hero.height

  var miniGrid = adapter.grid(plan.stream, 2, config.cardGap)
  var mini = adapter.contentBox(miniGrid.itemWidth, config.miniOuterHeight, config.cardPaddingX, config.cardPaddingY)
  plan.miniOuterWidth = miniGrid.itemWidth
  plan.miniWidth = mini.width
  plan.miniRowHeight = config.miniOuterHeight
  plan.miniHeight = mini.height

  var detail = adapter.contentBox(plan.stream.width, config.detailOuterHeight, config.cardPaddingX, config.cardPaddingY)
  plan.detailHeight = detail.height

  plan.headerBox = centeredBox(plan.stream, plan.stream.top, plan.headerWidth, plan.headerHeight)
  plan.heroBox = centeredBox(plan.stream, plan.stream.top + plan.headerHeight + plan.cardGap, plan.cardWidth, plan.heroHeight)
  plan.miniBox = adapter.region(plan.stream.left, plan.heroBox.top + plan.heroBox.height + plan.cardGap, plan.stream.width, plan.miniRowHeight)

  var copyKeys = [
    'titleSize', 'subtitleSize', 'valueSize', 'miniValueSize', 'labelSize', 'metaSize',
    'titleLineHeight', 'subtitleLineHeight', 'labelLineHeight', 'metaLineHeight', 'valueLineHeight', 'miniValueLineHeight',
    'heartValueWidth', 'unitGap', 'statusGap', 'valueBottom', 'trendMarginTop', 'trendBarWidth', 'trendBarRadius',
    'footMarginTop', 'miniValueMarginTop', 'miniStatusMarginTop', 'detailTrendMarginTop', 'updatedMarginTop', 'updatedMarginBottom'
  ]
  for (var i = 0; i < copyKeys.length; i++) plan[copyKeys[i]] = config[copyKeys[i]]
  return plan
}

module.exports = {
  freedomLevel: freedom.AUTO,
  contentWidth: contentWidth,
  resolve: resolve,
  layout: layout
}
