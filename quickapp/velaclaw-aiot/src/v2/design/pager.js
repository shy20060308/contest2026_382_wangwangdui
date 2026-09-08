function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

function requireInteger(name, value, positive) {
  if (typeof value !== 'number' || !isFinite(value) || Math.round(value) !== value || (positive && value <= 0)) throw new Error('pager requires explicit ' + name)
  return value
}

function resolve(items, pageIndex, pageSize) {
  if (!Array.isArray(items)) throw new Error('pager requires an item array')
  var size = requireInteger('pageSize', pageSize, true)
  var pageCount = Math.max(1, Math.ceil(items.length / size))
  var index = clamp(requireInteger('pageIndex', pageIndex, false), 0, pageCount - 1)
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
