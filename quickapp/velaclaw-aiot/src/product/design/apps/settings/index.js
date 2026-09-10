var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L1, config.surface)
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

module.exports = { differenceLevel: difference.L1, contentWidth: contentWidth, resolve: resolve, layout: layout }
