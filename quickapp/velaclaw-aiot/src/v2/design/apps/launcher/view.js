var apps = require('../../catalogs/apps')

function decorateGrid(items, gap) {
  var source = apps.list(items)
  var result = []
  for (var i = 0; i < source.length; i++) {
    var item = source[i]
    result.push({ id: item.id, label: item.label, icon: item.icon, accent: item.accent, marginRight: i % 2 === 0 ? gap : 0, marginBottom: i < 4 ? gap : 0 })
  }
  return result
}

function project(state, plan) {
  return {
    allApps: apps.list(state.all),
    pageApps: apps.list(state.items),
    gridApps: decorateGrid(state.items, plan.gap),
    pageText: state.pageNumber + ' / ' + state.pageCount,
    pageProgress: Math.round((state.pageNumber / state.pageCount) * 100) + '%',
    previousColor: state.hasPrevious ? '#0A84FF' : '#3A3A3C',
    nextColor: state.hasNext ? '#0A84FF' : '#3A3A3C'
  }
}

module.exports = { project: project }
