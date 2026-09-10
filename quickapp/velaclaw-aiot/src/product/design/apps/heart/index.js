var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function centeredBox(stream, top, width, height) {
  return adapter.region(stream.left + (stream.width - width) / 2, top, width, height)
}

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L1, config.surface)
  var streamTop = safe.top + config.streamTop
  var bottomInset = scene.height - safe.bottom
  plan.stream = adapter.placeBand(profile, scene, safe, {
    bounds: 'scene',
    absoluteTop: true,
    top: streamTop,
    width: config.contentWidth,
    height: scene.height - streamTop
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
  plan.trendVisual = adapter.merge({}, config.trendVisual)
  plan.scrollPaddingBottom = config.scrollPaddingBottom > bottomInset ? config.scrollPaddingBottom : bottomInset

  // Recipe dimensions describe component outer boxes. Padding belongs inside
  // those boxes; do not shrink the component itself by its own padding.
  plan.cardWidth = plan.stream.width
  plan.heroHeight = config.heroOuterHeight

  var miniGrid = adapter.grid(plan.stream, 2, config.cardGap)
  plan.miniOuterWidth = miniGrid.itemWidth
  plan.miniWidth = miniGrid.itemWidth
  plan.miniRowHeight = config.miniOuterHeight
  plan.miniHeight = config.miniOuterHeight

  plan.detailHeight = config.detailOuterHeight

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
  differenceLevel: difference.L1,
  contentWidth: contentWidth,
  resolve: resolve,
  layout: layout
}
