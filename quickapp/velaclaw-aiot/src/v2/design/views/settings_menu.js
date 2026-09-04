var pager = require('../pager')
var pagedStack = require('../paged_stack')
var catalog = require('../catalogs/settings')

function decorate(items, gap) {
  var source = catalog.list(items)
  var result = []
  for (var i = 0; i < source.length; i++) {
    var item = source[i]
    result.push({ id: item.id, name: item.name, description: item.description, icon: item.icon, marginBottom: i < source.length - 1 ? gap : 0 })
  }
  return result
}

function dots(pageCount, pageIndex) {
  var result = []
  for (var i = 0; i < pageCount; i++) result.push({ color: i === pageIndex ? '#0A84FF' : '#3A3A3C' })
  return result
}

function project(designPlan, pageIndex) {
  var state = pager.resolve(designPlan.itemIds, pageIndex, designPlan.capacity.pageSize)
  var plan = designPlan.capacity.fixedFrame ? designPlan.capacity : pagedStack.reflow(designPlan.capacity, state.items.length)
  var scale = plan.visualScale || 1
  var iconSize = Math.round(30 * Math.min(1.35, scale))
  return {
    pageIndex: state.pageIndex,
    pageText: state.pageText,
    pageItems: decorate(state.items, plan.itemGap),
    dots: dots(state.pageCount, state.pageIndex),
    plan: plan,
    itemRadius: Math.round(18 * Math.min(1.4, scale)),
    itemPadding: Math.round(7 * Math.min(1.3, scale)),
    iconSize: iconSize,
    iconRadius: Math.round(iconSize / 2),
    titleSize: Math.round(12 * Math.min(1.4, scale)),
    itemNameSize: Math.round(10 * Math.min(1.35, scale)),
    itemDescSize: Math.max(6, Math.round(6 * Math.min(1.35, scale))),
    arrowSize: Math.round(13 * Math.min(1.35, scale))
  }
}

module.exports = { project: project }
