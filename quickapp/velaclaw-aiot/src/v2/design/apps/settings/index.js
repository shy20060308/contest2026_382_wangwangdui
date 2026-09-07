var freedom = require('../../freedom')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, config.surface)
  plan.itemIds = config.itemIds.slice()
  plan.header = adapter.placeBand(profile, scene, safe, config.header)
  plan.list = adapter.placeBand(profile, scene, safe, config.list)
  plan.footer = adapter.placeBand(profile, scene, safe, config.footer)
  plan.pageSize = config.pageSize
  plan.itemHeight = config.itemHeight
  plan.itemGap = config.itemGap
  plan.chrome = config.chrome
  return plan
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve, layout: layout }
