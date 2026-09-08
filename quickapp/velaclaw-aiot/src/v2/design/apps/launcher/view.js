var apps = require('../../catalogs/apps')

function decorateGrid(items, columns, gap) {
  var source = apps.list(items)
  if (typeof columns !== 'number' || !isFinite(columns) || columns < 1 || Math.floor(columns) !== columns) throw new Error('Launcher grid requires integer plan.columns')
  var result = []
  var rowCount = Math.ceil(source.length / columns)
  for (var i = 0; i < source.length; i++) {
    var item = source[i]
    var column = i % columns
    var row = Math.floor(i / columns)
    result.push({
      id: item.id,
      label: item.label,
      icon: item.icon,
      accent: item.accent,
      marginRight: column < columns - 1 ? gap : 0,
      marginBottom: row < rowCount - 1 ? gap : 0
    })
  }
  return result
}

function project(state, plan) {
  return {
    allApps: apps.list(state.all),
    pageApps: apps.list(state.items),
    gridApps: decorateGrid(state.items, plan.columns, plan.gap),
    pageText: state.pageNumber + ' / ' + state.pageCount,
    pageProgress: Math.round((state.pageNumber / state.pageCount) * 100) + '%',
    previousColor: state.hasPrevious ? '#0A84FF' : '#3A3A3C',
    nextColor: state.hasNext ? '#0A84FF' : '#3A3A3C'
  }
}

module.exports = { project: project }
