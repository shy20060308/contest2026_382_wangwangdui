var freedom = require('../../freedom')
var adapter = require('../../adapter')
var layout = require('./selection_layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, config.surface)
  plan.header = adapter.placeBand(profile, scene, safe, config.header)
  var streamSpec = adapter.merge({}, config.stream)
  streamSpec.height = safe.bottom - (safe.top + Number(streamSpec.top))
  plan.stream = adapter.placeBand(profile, scene, safe, streamSpec)
  plan.titleSize = config.titleSize
  plan.cardHeight = config.cardHeight
  plan.cardRadius = config.cardRadius
  plan.actionHeight = config.actionHeight
  plan.actionRadius = config.actionRadius
  plan.modeNameSize = config.modeNameSize
  plan.modeDescSize = config.modeDescSize
  plan.chrome = adapter.merge({}, config.chrome)
  return plan
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve, layout: layout }
