var freedom = require('../freedom')
var adapter = require('../adapter')

function contentWidth(profile) { return adapter.contentWidth(profile, { circle: 136 }) }

function resolve(profile, scene, safe) {
  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, 'vitals-stream')
  var preferred = contentWidth(profile)
  var scale = adapter.heightScale(safe, 170, 1, 1.24)
  var fontScale = adapter.heightScale(safe, 170, 1, 1.12)

  plan.titleSize = Math.round(13 * fontScale)
  plan.subtitleSize = Math.max(6, Math.round(7 * fontScale))
  plan.valueSize = Math.round(25 * fontScale)
  plan.miniValueSize = Math.round(16 * fontScale)
  plan.labelSize = Math.max(7, Math.round(8 * fontScale))
  plan.metaSize = Math.max(5, Math.round(6 * fontScale))

  plan.titleLineHeight = Math.max(17, Math.round(plan.titleSize * 1.35))
  plan.subtitleLineHeight = Math.max(9, Math.round(plan.subtitleSize * 1.35))
  plan.labelLineHeight = Math.max(10, Math.round(plan.labelSize * 1.35))
  plan.metaLineHeight = Math.max(8, Math.round(plan.metaSize * 1.45))
  plan.valueLineHeight = Math.max(33, Math.round(plan.valueSize * 1.3))
  plan.miniValueLineHeight = Math.max(21, Math.round(plan.miniValueSize * 1.35))

  plan.headerHeight = plan.titleLineHeight + plan.subtitleLineHeight + 2
  plan.header = adapter.fitBand(profile, scene, safe, {
    top: safe.top,
    height: plan.headerHeight,
    preferredWidth: Math.min(120, preferred),
    minWidth: Math.min(116, preferred),
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
  plan.headCopyWidth = Math.min(plan.header.width - 42, Math.max(76, Math.round(plan.header.width * 0.58)))
  plan.headStateWidth = Math.max(40, plan.header.width - plan.headCopyWidth)
  plan.cardGap = Math.max(6, Math.round(6 * scale))
  plan.cardRadius = Math.round(18 * Math.min(scale, 1.2))
  plan.cardPaddingY = Math.max(9, Math.round(9 * Math.min(scale, 1.15)))
  plan.cardPaddingX = Math.max(9, Math.round(10 * Math.min(scale, 1.12)))
  plan.chartHeight = Math.round(24 * Math.min(scale, 1.75))
  plan.trendMinHeight = Math.max(6, Math.round(6 * fontScale))

  plan.heroHeight = plan.cardPaddingY * 2 + plan.labelLineHeight + plan.valueLineHeight + plan.chartHeight + plan.metaLineHeight + 11
  plan.miniHeight = plan.cardPaddingY * 2 + plan.labelLineHeight + plan.miniValueLineHeight + plan.metaLineHeight + 7
  plan.detailHeight = plan.cardPaddingY * 2 + plan.labelLineHeight + plan.chartHeight + plan.metaLineHeight + 8
  plan.scrollPaddingBottom = Math.max(24, Math.round(24 * scale))

  plan.miniGap = plan.cardGap
  plan.miniWidth = adapter.grid(plan.stream, 2, plan.miniGap).itemWidth
  return plan
}

module.exports = {
  freedomLevel: freedom.AUTO,
  contentWidth: contentWidth,
  resolve: resolve
}
