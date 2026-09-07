var freedom = require('../../freedom')
var adapter = require('../../adapter')

function create(layout) {
  function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

  function resolve(profile, scene, safe) {
    var config = adapter.select(layout, profile)
    var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, config.surface)
    plan.header = adapter.placeBand(profile, scene, safe, {
      top: config.headerTop,
      width: config.headerWidth,
      height: config.headerHeight
    })
    var streamTop = plan.header.top + plan.header.height + config.headerGap
    plan.stream = adapter.placeBand(profile, scene, safe, {
      absoluteTop: true,
      top: streamTop,
      width: config.streamWidth,
      height: safe.bottom - streamTop
    })
    plan.compact = !!config.compact
    plan.tall = !!config.tall
    plan.titleSize = config.titleSize
    plan.cardRadius = config.cardRadius
    plan.cardGap = config.cardGap
    plan.bodySize = config.bodySize
    plan.valueSize = config.valueSize
    plan.testTitleSize = config.testTitleSize
    plan.controls = adapter.merge({}, config.controls)
    plan.controls.levelButtonWidth = adapter.grid(plan.stream, 3, plan.cardGap).itemWidth
    plan.chrome = adapter.merge({}, config.chrome)
    return plan
  }

  return { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve, layout: layout }
}

module.exports = { create: create }
