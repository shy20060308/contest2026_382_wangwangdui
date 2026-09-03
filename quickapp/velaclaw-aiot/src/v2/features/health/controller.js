import healthStore from '../../../domain/health/store'
import historyRepository from '../../../domain/history/repository'
var healthMetrics = require('../../../domain/health/metrics')

function bars(values, height, inactive, active) {
  var source = values || []
  var max = 1
  for (var i = 0; i < source.length; i++) if (source[i] > max) max = source[i]
  var result = []
  for (var j = 0; j < source.length; j++) {
    result.push({ height: Math.max(3, Math.round((source[j] / max) * height)), color: j === source.length - 1 ? active : inactive, index: j })
  }
  return result
}

function sourceText(live, errorCode) {
  if (live) return '实时'
  if (errorCode === 203) return '不支持'
  if (errorCode) return '异常'
  return '演示'
}

function heartStatus(value) {
  var zone = healthMetrics.classifyHeartRate(value)
  if (zone === 'rest') return { text: '偏低', color: '#5AC8FA' }
  if (zone === 'elevated') return { text: '偏高', color: '#FF9F0A' }
  if (zone === 'peak') return { text: '峰值', color: '#FF453A' }
  return { text: '正常', color: '#30D158' }
}
function stressStatus(value) {
  var zone = healthMetrics.classifyStress(value)
  if (zone === 'relaxed') return { text: '放松', color: '#30D158' }
  if (zone === 'normal') return { text: '正常', color: '#64D2FF' }
  if (zone === 'elevated') return { text: '偏高', color: '#FFD60A' }
  return { text: '较高', color: '#FF453A' }
}

export function createHealthController(onChange) {
  var chartHeight = 32
  var dailyMin = 48
  var dailyMax = 95
  var heartValues = [72, 78, 75, 84, 81, 88, 85, 88]
  var spo2Values = [97, 98, 97, 96, 98, 99, 97, 98]
  var stressValues = [18, 22, 28, 25, 31, 27, 24, 28]
  var latest = null
  var started = false

  function emit() {
    var data = latest || healthStore.getSnapshot()
    var heart = Number(data.heartRate) || 0
    var spo2 = Number(data.spo2) || 0
    var stress = Number(data.stress) || 0
    var hs = heartStatus(heart)
    var ss = stressStatus(stress)
    var stressStats = healthMetrics.stats(stressValues)
    if (typeof onChange === 'function') onChange({
      heartRate: heart, spo2: spo2, stress: stress,
      heartStatus: hs.text, heartStatusColor: hs.color,
      spo2Status: spo2 < 95 ? '请关注' : '良好', spo2StatusColor: spo2 < 95 ? '#FF9F0A' : '#30D158',
      stressStatus: ss.text, stressStatusColor: ss.color,
      dailyMin: dailyMin, dailyMax: dailyMax,
      stressMin: stressStats.min, stressAvg: stressStats.avg, stressMax: stressStats.max,
      heartSource: sourceText(data.heartRateLive, data.heartRateErrorCode),
      spo2Source: sourceText(data.spo2Live, data.spo2ErrorCode),
      stressSource: sourceText(data.stressLive, data.stressErrorCode),
      sourceText: data.anyLive ? '设备实时数据' : '兼容演示数据',
      updatedAtText: data.updatedAtText || '--:--',
      heartBars: bars(heartValues, chartHeight, '#7A2436', '#FF375F'),
      spo2Bars: bars(spo2Values, chartHeight, '#245566', '#5AC8FA'),
      stressBars: bars(stressValues, chartHeight, '#542966', '#BF5AF2')
    })
  }
  function onHealth(data) {
    latest = data
    if (data.heartRateChanged) {
      heartValues = healthMetrics.pushWindow(heartValues, data.heartRate, 10)
      if (!dailyMin || data.heartRate < dailyMin) dailyMin = data.heartRate
      if (data.heartRate > dailyMax) dailyMax = data.heartRate
    }
    if (data.spo2Changed) spo2Values = healthMetrics.pushWindow(spo2Values, data.spo2, 10)
    if (data.stressChanged) stressValues = healthMetrics.pushWindow(stressValues, data.stress, 10)
    emit()
  }

  return {
    start: function (height) {
      chartHeight = Math.max(18, Math.round(Number(height) || chartHeight))
      if (started) { emit(); return }
      started = true
      historyRepository.loadHourlyHeartRate(function (hourly) {
        if (hourly && hourly.length) {
          heartValues = []
          dailyMin = hourly[0].min; dailyMax = hourly[0].max
          for (var i = 0; i < hourly.length; i++) {
            heartValues.push(hourly[i].avg)
            if (hourly[i].min < dailyMin) dailyMin = hourly[i].min
            if (hourly[i].max > dailyMax) dailyMax = hourly[i].max
          }
          emit()
        }
      })
      healthStore.subscribeAll(onHealth)
    },
    stop: function () { if (!started) return; started = false; healthStore.unsubscribe(onHealth) },
    refresh: emit
  }
}
