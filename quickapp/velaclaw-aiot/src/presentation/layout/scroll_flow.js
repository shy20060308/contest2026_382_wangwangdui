var adapter = require('./adapter')
var composition = require('./composition')
var safeArea = require('../viewport/safe_area')

function number(value, fallback) {
  var result = Number(value)
  return isFinite(result) ? result : fallback
}

function round(value) {
  return Math.round(value * 100) / 100
}

function maxBottom(plan) {
  var regions = plan && plan.regions ? plan.regions : []
  var bottom = 0
  for (var i = 0; i < regions.length; i++) bottom = Math.max(bottom, number(regions[i].bottom, 0))
  return bottom
}

function resolve(profile, spec) {
  var selected = composition.select(spec, profile)
  var plan = adapter.resolve(profile, spec)
  var stream = selected.stream || {}
  var width = number(stream.width, 156)
  var topGap = number(stream.topGap, 8)
  var top = round(maxBottom(plan) + topGap)

  plan.heroHeight = top
  plan.stream = {
    top: top,
    left: round((safeArea.DESIGN_WIDTH - width) / 2),
    width: width,
    itemHeight: number(stream.itemHeight, 44),
    gap: number(stream.gap, 6),
    bottomPadding: number(stream.bottomPadding, 24)
  }
  plan.tokens = selected.tokens || {}
  plan.flowMode = 'composed-header-scroll'
  return plan
}

module.exports = {
  resolve: resolve,
  maxBottom: maxBottom
}
