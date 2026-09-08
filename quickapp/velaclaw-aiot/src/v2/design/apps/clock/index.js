var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./layout')

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L3, config.surface)
  plan.faceIds = config.faceIds.slice()
  plan.notificationOverlay = config.notificationOverlay
  plan.faces = config.faces
  plan.chrome = config.chrome
  return plan
}

module.exports = { differenceLevel: difference.L3, resolve: resolve, layout: layout }
