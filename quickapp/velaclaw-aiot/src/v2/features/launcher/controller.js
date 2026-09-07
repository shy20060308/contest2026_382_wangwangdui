function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

function pageCapacity(value) {
  var size = Math.round(Number(value))
  if (!isFinite(size) || size < 1) throw new Error('Launcher requires resolved pageSize')
  return size
}

export function createLauncherController(onChange) {
  var all = []
  var pageIndex = 0
  var pageSize = 0

  function snapshot() {
    var size = pageCapacity(pageSize)
    var count = Math.max(1, Math.ceil(all.length / size))
    pageIndex = clamp(pageIndex, 0, count - 1)
    var start = pageIndex * size
    return {
      all: all.slice(),
      items: all.slice(start, start + size),
      pageIndex: pageIndex,
      pageNumber: pageIndex + 1,
      pageCount: count,
      hasPrevious: pageIndex > 0,
      hasNext: pageIndex < count - 1
    }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  return {
    configure: function (ids, size) {
      all = Array.isArray(ids) ? ids.slice() : []
      pageSize = pageCapacity(size)
      pageIndex = 0
      return emit()
    },
    next: function () { pageIndex++; return emit() },
    previous: function () { pageIndex--; return emit() },
    goToPage: function (index) { pageIndex = Math.round(Number(index) || 0); return emit() },
    refresh: emit
  }
}
