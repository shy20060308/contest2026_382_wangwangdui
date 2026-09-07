var freedom = require('../../freedom')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, freedom.ASSISTED, config.surface)
  plan.interaction = config.interaction
  plan.overflow = config.overflow
  plan.frame = adapter.region(config.frame.left, config.frame.top, config.frame.width, config.frame.height)
  plan.summary = config.summary
  plan.calendar = config.calendar
  return plan
}

module.exports = { freedomLevel: freedom.ASSISTED, contentWidth: contentWidth, resolve: resolve, layout: layout }
