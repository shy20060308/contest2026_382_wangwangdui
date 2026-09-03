import appCatalog from '../../../domain/apps/catalog'

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

export function createLauncherController(onChange) {
  var all = []
  var pageIndex = 0
  var pageSize = 4

  function snapshot() {
    var count = Math.max(1, Math.ceil(all.length / pageSize))
    pageIndex = clamp(pageIndex, 0, count - 1)
    var start = pageIndex * pageSize
    return {
      all: all.slice(),
      items: all.slice(start, start + pageSize),
      pageIndex: pageIndex,
      pageNumber: pageIndex + 1,
      pageCount: count,
      pageText: pageIndex + 1 + ' / ' + count,
      progress: Math.round(((pageIndex + 1) / count) * 100) + '%',
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
      all = appCatalog.list(ids)
      pageSize = Math.max(1, Math.round(Number(size) || 4))
      pageIndex = 0
      return emit()
    },
    next: function () { pageIndex++; return emit() },
    previous: function () { pageIndex--; return emit() },
    goToPage: function (index) { pageIndex = Math.round(Number(index) || 0); return emit() },
    refresh: emit,
    getApp: function (id) { return appCatalog.get(id) }
  }
}
