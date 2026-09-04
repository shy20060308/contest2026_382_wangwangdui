var freedom = require('../freedom')
var adapter = require('../adapter')

function contentWidth(profile) { return adapter.contentWidth(profile) }

function resolve(profile, scene, safe) {
  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, 'settings-stream')
  var compact = safe.height < 170
  var tall = safe.height > 250
  var headerHeight = compact ? 20 : (tall ? 32 : 24)
  var gap = compact ? 5 : 8
  var preferred = adapter.contentWidth(profile)

  plan.header = adapter.fitBand(profile, scene, safe, {
    top: safe.top,
    height: headerHeight,
    preferredWidth: preferred,
    minWidth: Math.min(120, preferred),
    edgePadding: 3,
    fit: 'edges',
    reposition: true
  })

  var streamTop = plan.header.top + plan.header.height + gap
  plan.stream = adapter.fitBand(profile, scene, safe, {
    top: streamTop,
    height: Math.max(40, safe.bottom - streamTop),
    preferredWidth: preferred,
    minWidth: Math.min(140, preferred),
    edgePadding: 2,
    fit: 'center',
    reposition: false
  })

  var controlScale = adapter.heightScale(safe, 170, 1, 1.28)
  var fontScale = adapter.heightScale(safe, 170, 1, 1.12)
  var cardGap = Math.max(6, Math.round(6 * controlScale))
  var controlGrid = adapter.grid(plan.stream, 3, cardGap)

  plan.compact = compact
  plan.tall = tall
  plan.titleSize = Math.round(12 * fontScale)
  plan.cardRadius = Math.round(16 * Math.min(controlScale, 1.25))
  plan.cardGap = cardGap
  plan.bodySize = Math.max(7, Math.round(7 * fontScale))
  plan.valueSize = Math.round(18 * fontScale)
  plan.testTitleSize = Math.round(10 * fontScale)
  plan.controls = {
    statusCardHeight: Math.round(64 * controlScale),
    levelRowHeight: Math.round(34 * controlScale),
    levelButtonWidth: controlGrid.itemWidth,
    levelButtonHeight: Math.round(34 * controlScale),
    testCardHeight: Math.round(56 * controlScale),
    capabilityCardHeight: Math.round(64 * controlScale),
    patternCardHeight: Math.round(50 * controlScale),
    pagerHeight: Math.round(30 * Math.min(controlScale, 1.12))
  }
  return plan
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve }
