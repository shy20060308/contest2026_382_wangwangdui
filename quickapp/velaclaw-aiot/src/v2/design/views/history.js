var WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatNumber(value) {
  return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDay(text) {
  return String(text || '').slice(5).replace('-', '/')
}

function weekdayLabel(text) {
  var parts = String(text || '').split('-')
  if (parts.length >= 3) {
    var year = Number(parts[0])
    var month = Number(parts[1])
    var day = Number(parts[2])
    var date = new Date(year, month - 1, day)
    if (!isNaN(date.getTime())) return WEEKDAY_LABELS[date.getDay()]
  }
  return formatDay(text)
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
  var chartHeight = Math.max(10, Math.round(Number(plan && plan.chartHeight) || 52))
  var minPillWidth = Math.max(8, Math.round(Number(plan && plan.pillTrendMinWidth) || 14))
  var maxPillWidth = Math.max(minPillWidth, Math.round(Number(plan && plan.pillTrendMaxWidth) || 70))
  var maxSteps = 1
  var bars = []
  var i

  for (i = 0; i < records.length; i++) {
    if ((Number(records[i].steps) || 0) > maxSteps) maxSteps = Number(records[i].steps) || 0
  }

  for (i = 0; i < records.length; i++) {
    var item = records[i]
    var steps = Math.max(0, Number(item.steps) || 0)
    var ratio = Math.max(0, Math.min(1, steps / maxSteps))
    var isToday = i === records.length - 1
    bars.push({
      label: formatDay(item.date),
      pillLabel: isToday ? '今天' : weekdayLabel(item.date),
      shortSteps: compactSteps(steps),
      stepsText: formatNumber(steps),
      height: Math.max(5, Math.round(ratio * chartHeight)),
      pillWidth: Math.round(minPillWidth + ratio * (maxPillWidth - minPillWidth)),
      color: isToday ? '#FFD60A' : '#3A7DFF',
      isToday: isToday
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
