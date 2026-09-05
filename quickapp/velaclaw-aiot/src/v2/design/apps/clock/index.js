var freedom = require('../../freedom')
var adapter = require('../../adapter')
var layout = require('./layout')

function px(value) { return (Number(value) || 0) + 'px' }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, freedom.FREE, config.surface)
  plan.faceIds = (config.faceIds || []).slice()
  plan.notificationOverlay = !!config.notificationOverlay
  var alpine = config.alpine || {}
  plan.alpineDataGlassTop = px(alpine.dataGlassTop)
  plan.alpineDataRowTop = px(alpine.dataRowTop)
  plan.alpineBatteryRowTop = px(alpine.batteryTop)
  return plan
}

module.exports = { freedomLevel: freedom.FREE, resolve: resolve, layout: layout }
