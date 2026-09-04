var freedom = require('../freedom')
var adapter = require('../adapter')

function contentWidth(profile) { return adapter.contentWidth(profile) }

function resolve(profile, scene, safe) {
  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, 'vitals-stream')
  var preferred = adapter.contentWidth(profile)
  var scale = adapter.heightScale(safe, 170, 1, 1.24)
  var fontScale = adapter.heightScale(safe, 170, 1, 1.12)

  plan.header = adapter.fitBand(profile, scene, safe, {
    top: safe.top,
    height: Math.round(30 * fontScale),
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
  plan.headerHeight = plan.header.height
  plan.cardGap = Math.max(6, Math.round(6 * scale))
  plan.cardRadius = Math.round(18 * Math.min(scale, 1.2))
  plan.heroHeight = Math.round(94 * scale)
  plan.miniHeight = Math.round(54 * scale)
  plan.detailHeight = Math.round(64 * scale)
  plan.chartHeight = Math.round(24 * Math.min(scale, 1.75))
  plan.trendMinHeight = Math.max(6, Math.round(6 * fontScale))
  plan.titleSize = Math.round(13 * fontScale)
  plan.subtitleSize = Math.max(6, Math.round(7 * fontScale))
  plan.valueSize = Math.round(25 * fontScale)
  plan.miniValueSize = Math.round(16 * fontScale)
  plan.labelSize = Math.max(7, Math.round(8 * fontScale))
  plan.metaSize = Math.max(5, Math.round(6 * fontScale))
  plan.miniGap = plan.cardGap
  plan.miniWidth = adapter.grid(plan.stream, 2, plan.miniGap).itemWidth
  return plan
}

module.exports = {
  freedomLevel: freedom.AUTO,
  contentWidth: contentWidth,
  resolve: resolve
}
