var LABELS = ['0', '3', '6', '9', '12', '15', '18', '21']
var COLORS = { steps: '#FFD60A', calories: '#FF9F0A', stand: '#0A84FF' }

function formatNumber(value) {
  return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function bars(values, color, chartHeight) {
  var source = values || []
  var height = Math.max(24, Math.round(Number(chartHeight) || 54))
  var max = 1
  for (var i = 0; i < source.length; i++) if (source[i] > max) max = source[i]
  var result = []
  for (var index = 0; index < LABELS.length; index++) {
    var current = Number(source[index]) || 0
    result.push({
      t: LABELS[index],
      h: Math.max(3, Math.round((current / max) * height)),
      color: color
    })
  }
  return result
}

function present(metrics, chartHeight) {
  var source = metrics || []
  var result = []
  for (var i = 0; i < source.length; i++) {
    var item = source[i]
    var color = COLORS[item.id] || '#FFFFFF'
    result.push({
      id: item.id,
      name: item.name,
      current: formatNumber(item.current),
      goal: formatNumber(item.goal),
      unit: item.unit,
      color: color,
      bars: bars(item.trend, color, chartHeight)
    })
  }
  return result
}

module.exports = { present: present }
