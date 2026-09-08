var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L1, config.surface)
  plan.title = adapter.placeBand(profile, scene, safe, config.title)
  plan.buttons = adapter.placeBand(profile, scene, safe, config.buttons)
  plan.buttonHeight = config.buttonHeight
  plan.gap = config.gap
  plan.titleSize = config.titleSize
  plan.buttonSize = config.buttonSize
  plan.radius = config.radius
  plan.overlay = config.overlay
  return plan
}

module.exports = { differenceLevel: difference.L1, contentWidth: contentWidth, resolve: resolve, layout: layout }
