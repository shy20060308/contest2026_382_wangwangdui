function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

function requirePageSize(value) {
  var size = Number(value)
  if (!isFinite(size) || size < 1 || Math.round(size) !== size) throw new Error('Launcher requires resolved integer pageSize')
  return size
}

function requirePageIndex(value) {
  var index = Number(value)
  if (!isFinite(index) || Math.round(index) !== index) throw new Error('Launcher requires integer page index')
  return index
}

function requireAppIds(ids) {
  if (!Array.isArray(ids) || !ids.length) throw new Error('Launcher controller requires Recipe appIds')
  return ids.slice()
}

export function createLauncherController(onChange) {
  var all = []
  var pageIndex = 0
  var pageSize = 0

  function snapshot() {
    var count = Math.ceil(all.length / pageSize)
    pageIndex = clamp(pageIndex, 0, count - 1)
    var start = pageIndex * pageSize
    return {
      all: all.slice(),
      items: all.slice(start, start + pageSize),
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
      all = requireAppIds(ids)
      pageSize = requirePageSize(size)
      pageIndex = 0
      return emit()
    },
    next: function () { pageIndex++; return emit() },
    previous: function () { pageIndex--; return emit() },
    goToPage: function (index) { pageIndex = requirePageIndex(index); return emit() },
    refresh: emit
  }
}
