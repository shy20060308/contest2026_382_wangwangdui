import healthStore from '../../../domain/health/store'
import historyRepository from '../../../domain/history/repository'
var healthMetrics = require('../../../domain/health/metrics')

export function createHealthController(onChange) {
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
    var stressStats = healthMetrics.stats(stressValues)
    var model = {
      heartRate: heart,
      spo2: spo2,
      stress: stress,
      heartZone: healthMetrics.classifyHeartRate(heart),
      spo2Zone: spo2 < 95 ? 'attention' : 'good',
      stressZone: healthMetrics.classifyStress(stress),
      dailyMin: dailyMin,
      dailyMax: dailyMax,
      stressMin: stressStats.min,
      stressAvg: stressStats.avg,
      stressMax: stressStats.max,
      heartSource: { live: !!data.heartRateLive, errorCode: Number(data.heartRateErrorCode) || 0 },
      spo2Source: { live: !!data.spo2Live, errorCode: Number(data.spo2ErrorCode) || 0 },
      stressSource: { live: !!data.stressLive, errorCode: Number(data.stressErrorCode) || 0 },
      anyLive: !!data.anyLive,
      updatedAt: Number(data.updatedAt) || 0,
      heartValues: heartValues.slice(),
      spo2Values: spo2Values.slice(),
      stressValues: stressValues.slice()
    }
    if (typeof onChange === 'function') onChange(model)
    return model
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
    start: function () {
      if (started) { emit(); return }
      started = true
      historyRepository.loadHourlyHeartRate(function (hourly) {
        if (hourly && hourly.length) {
          heartValues = []
          dailyMin = hourly[0].min
          dailyMax = hourly[0].max
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
    stop: function () {
      if (!started) return
      started = false
      healthStore.unsubscribe(onHealth)
    },
    refresh: emit
  }
}
