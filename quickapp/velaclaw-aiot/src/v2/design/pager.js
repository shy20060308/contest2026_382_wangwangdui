function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

function resolve(items, pageIndex, pageSize) {
  if (!Array.isArray(items)) throw new Error('pager requires an item array')
  var size = Math.round(Number(pageSize))
  if (!(size > 0)) throw new Error('pager requires explicit pageSize')
  var pageCount = Math.max(1, Math.ceil(items.length / size))
  var index = clamp(Math.round(Number(pageIndex) || 0), 0, pageCount - 1)
  var start = index * size
  return {
    pageIndex: index,
    pageNumber: index + 1,
    pageCount: pageCount,
    pageText: index + 1 + ' / ' + pageCount,
    items: items.slice(start, start + size),
    hasPrevious: index > 0,
    hasNext: index < pageCount - 1,
    progress: Math.round(((index + 1) / pageCount) * 100) + '%'
  }
}

module.exports = { resolve: resolve }
