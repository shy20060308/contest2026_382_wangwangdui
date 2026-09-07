var freedom = require('../../freedom')
var adapter = require('../../adapter')
var layout = require('./layout')

function px(value) { return Number(value) + 'px' }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, freedom.FREE, config.surface)
  plan.faceIds = config.faceIds.slice()
  plan.notificationOverlay = !!config.notificationOverlay
  plan.faces = config.faces
  plan.alpineDataGlassTop = px(config.alpine.dataGlassTop)
  plan.alpineDataRowTop = px(config.alpine.dataRowTop)
  plan.alpineBatteryRowTop = px(config.alpine.batteryTop)
  return plan
}

module.exports = { freedomLevel: freedom.FREE, resolve: resolve, layout: layout }
