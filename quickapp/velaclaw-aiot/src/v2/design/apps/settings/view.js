var pager = require('../../pager')
var catalog = require('../../catalogs/settings')

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
  var state = pager.resolve(designPlan.itemIds, pageIndex, designPlan.pageSize)
  return {
    pageIndex: state.pageIndex,
    pageText: state.pageText,
    pageItems: decorate(state.items, designPlan.itemGap),
    dots: dots(state.pageCount, state.pageIndex)
  }
}

module.exports = { project: project }
