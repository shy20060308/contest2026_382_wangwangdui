var freedom = require('../freedom')
var adapter = require('../adapter')

function contentWidth(profile) { return adapter.contentWidth(profile, { circle: 136 }) }

function resolve(profile, scene, safe) {
  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, 'vitals-stream')
  var preferred = contentWidth(profile)
  var heightScale = adapter.heightScale(safe, 170, 0.96, 1.18)
  var widthRatio = adapter.clamp(preferred / 168, 0.80, 1)
  var compactness = Math.sqrt(widthRatio)
  var fontScale = adapter.clamp(Math.min(heightScale, 1.12) * compactness, 0.90, 1.12)

  plan.titleSize = Math.round(13 * fontScale)
  plan.subtitleSize = Math.max(6, Math.round(7 * fontScale))
  plan.valueSize = Math.round(25 * fontScale)
  plan.miniValueSize = Math.round(16 * fontScale)
  plan.labelSize = Math.max(7, Math.round(8 * fontScale))
  plan.metaSize = Math.max(5, Math.round(6 * fontScale))

  plan.titleLineHeight = Math.max(16, Math.round(plan.titleSize * 1.32))
  plan.subtitleLineHeight = Math.max(9, Math.round(plan.subtitleSize * 1.35))
  plan.labelLineHeight = Math.max(10, Math.round(plan.labelSize * 1.35))
  plan.metaLineHeight = Math.max(8, Math.round(plan.metaSize * 1.42))
  plan.valueLineHeight = Math.max(29, Math.round(plan.valueSize * 1.26))
  plan.miniValueLineHeight = Math.max(19, Math.round(plan.miniValueSize * 1.34))

  plan.headerHeight = plan.titleLineHeight + plan.subtitleLineHeight + 2
  plan.header = adapter.fitBand(profile, scene, safe, {
    top: safe.top,
    height: plan.headerHeight,
    preferredWidth: Math.min(128, preferred),
    minWidth: Math.min(122, preferred),
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
  plan.headGap = 4
  plan.headSummaryWidth = Math.max(54, Math.round(plan.header.width * 0.48))
  plan.headTitleWidth = Math.max(32, plan.header.width - plan.headSummaryWidth - plan.headGap)
  plan.headSourceWidth = Math.max(44, Math.round(plan.header.width * 0.38))
  plan.headSubtitleWidth = Math.max(48, plan.header.width - plan.headSourceWidth - plan.headGap)

  plan.cardGap = Math.max(4, Math.round(5 * widthRatio))
  plan.cardRadius = Math.max(14, Math.round(17 * compactness))
  plan.cardPaddingY = Math.max(6, Math.round(7 * widthRatio))
  plan.cardPaddingX = Math.max(7, Math.round(8 * widthRatio))
  plan.miniPaddingY = Math.max(6, Math.round(6 * widthRatio))
  plan.miniPaddingX = Math.max(6, Math.round(6 * widthRatio))
  plan.chartHeight = Math.max(18, Math.round(22 * widthRatio * Math.min(heightScale, 1.12)))
  plan.trendMinHeight = Math.max(5, Math.round(6 * fontScale))

  plan.cardOuterWidth = plan.stream.width
  plan.cardWidth = adapter.contentBoxSize(plan.cardOuterWidth, 1, plan.cardPaddingX, 0).width

  plan.heroHeight = plan.labelLineHeight + plan.valueLineHeight + plan.chartHeight + plan.metaLineHeight + 6
  plan.heroOuterHeight = plan.heroHeight + plan.cardPaddingY * 2
  plan.detailHeight = plan.labelLineHeight + plan.chartHeight + plan.metaLineHeight + 5
  plan.detailOuterHeight = plan.detailHeight + plan.cardPaddingY * 2

  plan.miniGap = plan.cardGap
  var miniGrid = adapter.grid(plan.stream, 2, plan.miniGap)
  plan.miniOuterWidth = miniGrid.itemWidth
  plan.miniWidth = adapter.contentBoxSize(plan.miniOuterWidth, 1, plan.miniPaddingX, 0).width
  plan.miniHeight = plan.labelLineHeight + plan.miniValueLineHeight + plan.metaLineHeight + 4
  plan.miniOuterHeight = plan.miniHeight + plan.miniPaddingY * 2

  plan.scrollPaddingBottom = Math.max(22, Math.round(22 * Math.min(heightScale, 1.15)))
  return plan
}

module.exports = {
  freedomLevel: freedom.AUTO,
  contentWidth: contentWidth,
  resolve: resolve
}
