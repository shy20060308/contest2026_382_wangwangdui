var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./history_layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function fill(profile, scene, safe, spec) {
  var copy = adapter.merge({}, spec)
  if (copy.height === undefined) copy.height = safe.bottom - (safe.top + copy.top)
  return adapter.placeBand(profile, scene, safe, copy)
}

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L1, config.surface)
  plan.header = fill(profile, scene, safe, config.header)
  plan.summary = fill(profile, scene, safe, config.summary)
  plan.stream = fill(profile, scene, safe, config.stream)

  plan.summaryGap = config.summaryGap
  plan.summaryCardWidth = adapter.grid(plan.summary, 2, plan.summaryGap).itemWidth

  plan.recordWidth = plan.stream.width
  plan.recordHeight = config.itemHeight
  plan.recordGap = config.itemGap

  plan.titleSize = config.titleSize
  plan.backSize = config.backSize
  plan.summaryValueSize = config.summaryValueSize
  plan.summaryLabelSize = config.summaryLabelSize
  plan.recordTitleSize = config.recordTitleSize
  plan.recordMetaSize = config.recordMetaSize
  plan.radius = config.radius
  plan.padding = config.padding
  plan.chrome = adapter.merge({}, config.chrome)
  return plan
}

module.exports = { differenceLevel: difference.L1, contentWidth: contentWidth, resolve: resolve, layout: layout }
