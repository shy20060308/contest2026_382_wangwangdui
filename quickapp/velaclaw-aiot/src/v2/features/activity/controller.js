import activityStore from '../../../domain/activity/store'

var LABELS = ['0', '3', '6', '9', '12', '15', '18', '21']
var RATIOS = [0.05, 0.11, 0.18, 0.26, 0.22, 0.14, 0.09, 0.04]

function formatNumber(value) { return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
function trendValues(total) {
  var value = Math.max(0, Number(total) || 0)
  var result = []
  for (var i = 0; i < RATIOS.length; i++) result.push(Math.max(1, Math.round(value * RATIOS[i])))
  return result
}
function bars(values, color, chartHeight) {
  var height = Math.max(24, Math.round(Number(chartHeight) || 54))
  var maxValue = 1
  for (var i = 0; i < values.length; i++) if (values[i] > maxValue) maxValue = values[i]
  var result = []
  for (var index = 0; index < LABELS.length; index++) {
    var current = Number(values[index]) || 0
    result.push({ t: LABELS[index], h: Math.max(3, Math.round((current / maxValue) * height)), color: color })
  }
  return result
}
function build(snapshot, chartHeight) {
  var source = snapshot || {}
  return [
    { id: 'steps', name: '步数', current: formatNumber(source.steps), goal: formatNumber(source.stepsGoal), unit: '步', color: '#FFD60A', bars: bars(trendValues(source.steps), '#FFD60A', chartHeight) },
    { id: 'calories', name: '卡路里', current: formatNumber(source.calories), goal: formatNumber(source.caloriesGoal), unit: 'kcal', color: '#FF9F0A', bars: bars(trendValues(source.calories), '#FF9F0A', chartHeight) },
    { id: 'stand', name: '站立', current: formatNumber(source.standHours), goal: formatNumber(source.standGoal), unit: 'h', color: '#0A84FF', bars: bars(trendValues(source.standHours), '#0A84FF', chartHeight) }
  ]
}

export function createActivityController(onChange) {
  var chartHeight = 54
  function emit(snapshot) { if (typeof onChange === 'function') onChange(build(snapshot, chartHeight)) }
  return {
    start: function (height) {
      chartHeight = Math.max(24, Math.round(Number(height) || chartHeight))
      emit(activityStore.getSnapshot())
      activityStore.hydrate(emit)
    },
    refresh: function () { emit(activityStore.getSnapshot()) },
    build: build
  }
}
