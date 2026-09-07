var freedom = require('../../freedom')
var adapter = require('../../adapter')
var layout = require('./layout')

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, freedom.FREE, config.surface)
  plan.faceIds = config.faceIds.slice()
  plan.notificationOverlay = !!config.notificationOverlay
  plan.faces = config.faces
  plan.chrome = config.chrome
  return plan
}

module.exports = { freedomLevel: freedom.FREE, resolve: resolve, layout: layout }
