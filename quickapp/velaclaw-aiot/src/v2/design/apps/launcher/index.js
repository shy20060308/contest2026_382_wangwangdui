var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolveBand(profile, scene, safe, spec) {
  if (!spec) return null
  var copy = adapter.merge({}, spec)
  if (copy.bottomInset !== undefined) {
    if (copy.height === undefined) copy.height = safe.height - Number(copy.top) - Number(copy.bottomInset)
    copy.absoluteTop = true
    copy.top = safe.bottom - Number(copy.bottomInset) - Number(copy.height)
  }
  return adapter.placeBand(profile, scene, safe, copy)
}

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L3, config.surface)
  plan.appIds = (config.appIds || []).slice()
  plan.pageSize = config.pageSize
  if (config.frame === 'scene') plan.frame = adapter.region(0, 0, scene.width, scene.height)
  if (config.header) plan.header = resolveBand(profile, scene, safe, config.header)
  if (config.content) plan.content = resolveBand(profile, scene, safe, config.content)
  if (config.pager) {
    var pagerSpec = adapter.merge({}, config.pager)
    pagerSpec.absoluteTop = true
    pagerSpec.top = safe.bottom - Number(pagerSpec.bottomInset)
    plan.pager = adapter.placeBand(profile, scene, safe, pagerSpec)
  }
  plan.columns = config.columns
  plan.gap = config.gap
  plan.itemWidth = config.columns && plan.content ? adapter.grid(plan.content, config.columns, config.gap).itemWidth : config.itemWidth
  plan.itemHeight = config.itemHeight
  plan.itemGap = config.itemGap
  plan.titleSize = config.titleSize
  plan.pageTextSize = config.pageTextSize
  plan.nameSize = config.nameSize
  plan.arrowSize = config.arrowSize
  plan.iconSize = config.iconSize
  plan.iconRadius = Math.round(Number(config.iconSize) / 2)
  plan.itemRadius = config.itemRadius
  plan.listChrome = adapter.merge({}, config.listChrome)
  plan.gridChrome = adapter.merge({}, config.gridChrome)
  plan.pagerChrome = adapter.merge({}, config.pagerChrome)
  plan.honeycomb = adapter.merge({}, config.honeycomb)
  return plan
}

module.exports = { differenceLevel: difference.L3, contentWidth: contentWidth, resolve: resolve, layout: layout }
