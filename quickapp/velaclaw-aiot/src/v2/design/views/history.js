function formatNumber(value) {
  return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDay(text) {
  return String(text || '').slice(5).replace('-', '/')
}

function compactSteps(value) {
  var steps = Math.max(0, Number(value) || 0)
  if (steps < 1000) return Math.round(steps).toString()
  var result = (steps / 1000).toFixed(1)
  if (result.slice(-2) === '.0') result = result.slice(0, -2)
  return result + 'k'
}

function project(model, plan) {
  var source = model || {}
  var records = Array.isArray(source.records) ? source.records : []
  var chartHeight = Math.max(24, Math.round(Number(plan && plan.chartHeight) || 52))
  var maxSteps = 1
  var bars = []
  var i

  for (i = 0; i < records.length; i++) {
    if ((Number(records[i].steps) || 0) > maxSteps) maxSteps = Number(records[i].steps) || 0
  }

  for (i = 0; i < records.length; i++) {
    var item = records[i]
    var steps = Math.max(0, Number(item.steps) || 0)
    bars.push({
      label: formatDay(item.date),
      shortSteps: compactSteps(steps),
      height: Math.max(5, Math.round((steps / maxSteps) * chartHeight)),
      color: i === records.length - 1 ? '#FFD60A' : '#3A7DFF'
    })
  }

  return {
    todayStepsText: formatNumber(source.todaySteps),
    avgStepsText: formatNumber(source.avgSteps),
    bestStepsText: formatNumber(source.bestSteps),
    bestDayText: source.bestDate ? formatDay(source.bestDate) : '--',
    avgHeartText: source.avgHeartRate ? Math.round(source.avgHeartRate) + ' bpm' : '--',
    goalText: (Number(source.goalPercent) || 0) + '%',
    bars: bars
  }
}

module.exports = { project: project }
