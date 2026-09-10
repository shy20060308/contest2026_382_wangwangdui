var WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatNumber(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDay(text) {
  return text.slice(5).replace('-', '/')
}

function weekdayLabel(text) {
  var parts = text.split('-')
  var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return WEEKDAY_LABELS[date.getDay()]
}

function compactLabel(text, isToday) {
  if (isToday) return '今'
  return weekdayLabel(text).slice(1)
}

function trendHeight(plan, rowMode, recordCount) {
  if (!rowMode) return plan.trendHeight
  var chrome = plan.chrome
  var rows = Math.max(1, recordCount)
  var required = plan.trendHeadHeight + chrome.rowTrendTop + rows * chrome.rowItemHeight
  return Math.min(plan.trendHeight, required)
}

function project(model, plan) {
  var records = model.records
  var chartHeight = plan.chartHeight
  var barMinHeight = plan.barMinHeight
  var rowMode = plan.trendMode === 'comparative-row'
  var minRowWidth = rowMode ? plan.pillTrendMinWidth : 0
  var maxRowWidth = rowMode ? plan.pillTrendMaxWidth : 0
  var maxSteps = 1
  var bars = []
  var i

  for (i = 0; i < records.length; i++) if (records[i].steps > maxSteps) maxSteps = records[i].steps

  for (i = 0; i < records.length; i++) {
    var item = records[i]
    var ratio = item.steps / maxSteps
    var isToday = i === records.length - 1
    var rowLabel = isToday ? '今天' : weekdayLabel(item.date)
    var compact = compactLabel(item.date, isToday)
    var comparativeWidth = rowMode ? Math.round(minRowWidth + ratio * (maxRowWidth - minRowWidth)) : 0
    bars.push({
      date: item.date,
      label: formatDay(item.date),
      displayLabel: rowMode ? rowLabel : compact,
      stepsText: formatNumber(item.steps),
      height: Math.max(barMinHeight, Math.round(ratio * chartHeight)),
      rowWidth: comparativeWidth,
      pillWidth: comparativeWidth,
      pillLabel: rowLabel,
      color: isToday ? '#FFD60A' : '#4C7CF3',
      isToday: isToday
    })
  }

  return {
    todayStepsText: formatNumber(model.todaySteps),
    avgStepsText: formatNumber(model.avgSteps),
    bestStepsText: formatNumber(model.bestSteps),
    bestDayText: model.bestDate ? formatDay(model.bestDate) : '--',
    avgHeartText: model.avgHeartRate === null ? '--' : model.avgHeartRate + ' bpm',
    goalText: model.goalPercent + '%',
    trendHeight: trendHeight(plan, rowMode, records.length),
    bars: bars
  }
}

module.exports = { project: project }
