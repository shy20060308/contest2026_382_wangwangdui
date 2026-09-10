var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./selection_layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L1, config.surface)
  plan.header = adapter.placeBand(profile, scene, safe, config.header)
  var streamTop = safe.top + config.stream.top
  plan.stream = adapter.placeBand(profile, scene, safe, {
    bounds: 'scene',
    absoluteTop: true,
    top: streamTop,
    width: config.stream.width,
    height: scene.height - streamTop
  })
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

module.exports = { differenceLevel: difference.L1, contentWidth: contentWidth, resolve: resolve, layout: layout }
