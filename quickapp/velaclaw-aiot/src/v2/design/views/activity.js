var LABELS = ['0', '3', '6', '9', '12', '15', '18', '21']
var RATIOS = [0.05, 0.11, 0.18, 0.26, 0.22, 0.14, 0.09, 0.04]
var META = {
  steps: { name: '步数', unit: '步', color: '#FFD60A' },
  calories: { name: '卡路里', unit: 'kcal', color: '#FF9F0A' },
  stand: { name: '站立', unit: 'h', color: '#0A84FF' }
}

function formatNumber(value) {
  return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function trendValues(total) {
  var value = Math.max(0, Number(total) || 0)
  var result = []
  for (var i = 0; i < RATIOS.length; i++) result.push(Math.max(1, Math.round(value * RATIOS[i])))
  return result
}

function bars(total, color, chartHeight) {
  var source = trendValues(total)
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
    var meta = META[item.id] || { name: item.id || '', unit: '', color: '#FFFFFF' }
    result.push({
      id: item.id,
      name: meta.name,
      current: formatNumber(item.current),
      goal: formatNumber(item.goal),
      unit: meta.unit,
      color: meta.color,
      bars: bars(item.current, meta.color, chartHeight)
    })
  }
  return result
}

module.exports = { present: present }
