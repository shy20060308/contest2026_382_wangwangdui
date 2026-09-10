function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

function requirePageSize(value) {
  if (typeof value !== 'number' || !isFinite(value) || value < 1 || Math.round(value) !== value) throw new Error('Launcher requires resolved integer pageSize')
  return value
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
    previous: function () { pageIndex--; return emit() }
  }
}
