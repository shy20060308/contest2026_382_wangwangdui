function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

function resolve(safe, options) {
  var config = options || {}
  var minItems = Math.max(1, Math.round(config.minItems || 1))
  var maxItems = Math.max(minItems, Math.round(config.maxItems || minItems))
  var headerHeight = Math.max(0, Number(config.headerHeight) || 24)
  var footerHeight = Math.max(0, Number(config.footerHeight) || 18)
  var sectionGap = Math.max(0, Number(config.sectionGap) || 6)
  var minItemHeight = Math.max(1, Number(config.minItemHeight) || 44)
  var maxItemHeight = Math.max(minItemHeight, Number(config.maxItemHeight) || 78)
  var itemGap = Math.max(0, Number(config.itemGap) || 6)
  var available = Math.max(0, safe.height - headerHeight - footerHeight - sectionGap * 2)
  var pageSize = minItems
  var rawItemHeight = minItemHeight

  for (var count = maxItems; count >= minItems; count--) {
    var candidate = (available - itemGap * (count - 1)) / count
    if (candidate >= minItemHeight) {
      pageSize = count
      rawItemHeight = candidate
      break
    }
  }

  var itemHeight = clamp(Math.floor(rawItemHeight), minItemHeight, maxItemHeight)
  var listHeight = itemHeight * pageSize + itemGap * (pageSize - 1)
  var contentHeight = headerHeight + sectionGap + listHeight + sectionGap + footerHeight
  var spare = Math.max(0, safe.height - contentHeight)
  var startTop = safe.top + Math.floor(spare / 2)

  return {
    pageSize: pageSize,
    itemHeight: itemHeight,
    itemGap: itemGap,
    header: { left: safe.left, top: startTop, width: safe.width, height: headerHeight },
    list: { left: safe.left, top: startTop + headerHeight + sectionGap, width: safe.width, height: listHeight },
    footer: { left: safe.left, top: startTop + headerHeight + sectionGap + listHeight + sectionGap, width: safe.width, height: footerHeight },
    visualScale: clamp(itemHeight / minItemHeight, 1, 1.5),
    capacityReduced: pageSize < maxItems
  }
}

function reflow(plan, visibleCount) {
  var count = Math.max(1, Math.min(plan.pageSize, Math.round(visibleCount || 1)))
  var listHeight = plan.itemHeight * count + plan.itemGap * (count - 1)
  var groupHeight = plan.header.height + (plan.list.top - (plan.header.top + plan.header.height)) + listHeight + (plan.footer.top - (plan.list.top + plan.list.height)) + plan.footer.height
  var safeTop = plan.header.top
  var safeBottom = plan.footer.top + plan.footer.height
  var available = safeBottom - safeTop
  var offset = Math.max(0, Math.floor((available - groupHeight) / 2))
  var headerTop = safeTop + offset
  var sectionGap = plan.list.top - (plan.header.top + plan.header.height)
  var footerGap = plan.footer.top - (plan.list.top + plan.list.height)
  return {
    pageSize: plan.pageSize,
    visibleCount: count,
    itemHeight: plan.itemHeight,
    itemGap: plan.itemGap,
    visualScale: plan.visualScale,
    header: { left: plan.header.left, top: headerTop, width: plan.header.width, height: plan.header.height },
    list: { left: plan.list.left, top: headerTop + plan.header.height + sectionGap, width: plan.list.width, height: listHeight },
    footer: { left: plan.footer.left, top: headerTop + plan.header.height + sectionGap + listHeight + footerGap, width: plan.footer.width, height: plan.footer.height }
  }
}

module.exports = { resolve: resolve, reflow: reflow }
