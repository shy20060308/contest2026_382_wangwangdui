var adapter = require('./adapter')

function number(value, fallback) {
  var result = Number(value)
  return isFinite(result) ? result : fallback
}

function listHeight(itemHeight, itemGap, count) {
  if (count <= 0) return 0
  return itemHeight * count + itemGap * Math.max(0, count - 1)
}

function layoutSpec(source, count) {
  var config = source || {}
  var header = config.header || {}
  var item = config.item || {}
  var footer = config.footer || {}
  var itemHeight = number(item.height, 50)
  var itemGap = number(config.itemGap, 6)

  return {
    id: config.id || 'paged-stack',
    freedomLevel: config.freedomLevel || 1,
    strategy: config.strategy || 'auto',
    default: {
      mode: 'auto-stack',
      verticalAlign: config.verticalAlign || 'start',
      minScale: number(config.minScale, 0.86),
      maxScale: number(config.maxScale, 1.14),
      scaleStep: number(config.scaleStep, 0.02),
      gap: number(config.sectionGap, 4),
      comfort: config.comfort,
      regions: [
        { id: 'header', role: 'header', width: number(header.width, 120), height: number(header.height, 20) },
        {
          id: 'list',
          role: 'list',
          width: number(item.width, 148),
          height: listHeight(itemHeight, itemGap, count)
        },
        { id: 'footer', role: 'pager', width: number(footer.width, 110), height: number(footer.height, 14) }
      ]
    }
  }
}

function resolve(profile, source) {
  var config = source || {}
  var maxItems = Math.max(1, Math.round(number(config.maxItems, 3)))
  var minItems = Math.max(1, Math.min(maxItems, Math.round(number(config.minItems, 1))))
  var lastPlan = null

  for (var count = maxItems; count >= minItems; count--) {
    var plan = adapter.resolve(profile, layoutSpec(config, count))
    lastPlan = plan
    if (!plan.needsOverride) {
      var scale = plan.scale
      plan.pageSize = count
      plan.itemWidth = number(config.item && config.item.width, 148) * scale
      plan.itemHeight = number(config.item && config.item.height, 50) * scale
      plan.itemGap = number(config.itemGap, 6) * scale
      plan.capacityReduced = count < maxItems
      return plan
    }
  }

  if (!lastPlan) lastPlan = adapter.resolve(profile, layoutSpec(config, minItems))
  lastPlan.pageSize = minItems
  lastPlan.itemWidth = number(config.item && config.item.width, 148) * lastPlan.scale
  lastPlan.itemHeight = number(config.item && config.item.height, 50) * lastPlan.scale
  lastPlan.itemGap = number(config.itemGap, 6) * lastPlan.scale
  lastPlan.capacityReduced = minItems < maxItems
  return lastPlan
}

module.exports = {
  resolve: resolve,
  listHeight: listHeight
}
