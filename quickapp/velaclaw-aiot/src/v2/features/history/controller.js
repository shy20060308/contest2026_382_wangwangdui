import historyRepository from '../../../domain/history/repository'

function formatNumber(value) { return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
function formatDay(text) { return String(text || '').slice(5).replace('-', '/') }
function compactSteps(value) {
  var steps = Math.max(0, Number(value) || 0)
  if (steps < 1000) return Math.round(steps).toString()
  var result = (steps / 1000).toFixed(1)
  if (result.slice(-2) === '.0') result = result.slice(0, -2)
  return result + 'k'
}
function map(history, chartHeight) {
  var source = history || []
  if (!source.length) return { todayStepsText: '0', avgStepsText: '0', bestStepsText: '0', bestDayText: '--', avgHeartText: '--', goalText: '0%', bars: [], records: [] }
  var maxSteps = 1, totalSteps = 0, totalHeart = 0, best = source[0]
  for (var i = 0; i < source.length; i++) {
    totalSteps += Number(source[i].steps) || 0
    totalHeart += Number(source[i].avgHeartRate) || 0
    if (source[i].steps > maxSteps) maxSteps = source[i].steps
    if (source[i].steps > best.steps) best = source[i]
  }
  var bars = [], records = []
  for (var j = 0; j < source.length; j++) {
    var item = source[j]
    bars.push({ label: formatDay(item.date), shortSteps: compactSteps(item.steps), height: Math.max(5, Math.round((item.steps / maxSteps) * chartHeight)), color: j === source.length - 1 ? '#FFD60A' : '#3A7DFF' })
    records.unshift({ date: formatDay(item.date), stepsText: formatNumber(item.steps), caloriesText: formatNumber(item.calories), heartText: item.avgHeartRate + ' bpm', goalText: item.goalPercent + '%' })
  }
  var today = source[source.length - 1]
  return {
    todayStepsText: formatNumber(today.steps), avgStepsText: formatNumber(Math.round(totalSteps / source.length)), bestStepsText: formatNumber(best.steps), bestDayText: formatDay(best.date), avgHeartText: Math.round(totalHeart / source.length) + ' bpm', goalText: today.goalPercent + '%', bars: bars, records: records
  }
}

export function createHistoryController(onChange) {
  var chartHeight = 72
  return {
    load: function (height) {
      chartHeight = Math.max(24, Math.round(Number(height) || chartHeight))
      historyRepository.getHistory(function (history) { if (typeof onChange === 'function') onChange(map(history, chartHeight)) })
    },
    map: map
  }
}
