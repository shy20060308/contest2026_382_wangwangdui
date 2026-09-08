import healthStore from '../../../domain/health/store'
var healthMetrics = require('../../../domain/health/metrics')

export function createHealthController(onChange) {
  var heartValues = []
  var spo2Values = []
  var stressValues = []
  var latest = null
  var started = false
  var lifecycleGeneration = 0
  var activeGeneration = 0

  function official(data, prefix) {
    return data[prefix + 'Live'] && data[prefix + 'Source'] === 'live'
  }

  function valid(data, prefix) {
    if (!official(data, prefix)) return false
    if (prefix === 'heartRate') return healthMetrics.isHeartRate(data.heartRate)
    if (prefix === 'spo2') return healthMetrics.isSpo2(data.spo2)
    return healthMetrics.isStress(data.stress)
  }

  function updateWindow(values, changed, value, allowed) {
    if (!changed || !allowed) return values
    return healthMetrics.pushWindow(values, value, 10)
  }

  function seedCurrent(data) {
    if (!heartValues.length && valid(data, 'heartRate')) heartValues = [data.heartRate]
    if (!spo2Values.length && valid(data, 'spo2')) spo2Values = [data.spo2]
    if (!stressValues.length && valid(data, 'stress')) stressValues = [data.stress]
  }

  function emit() {
    var data = latest || healthStore.getSnapshot()
    var heartAvailable = valid(data, 'heartRate')
    var spo2Available = valid(data, 'spo2')
    var stressAvailable = valid(data, 'stress')
    var heart = heartAvailable ? data.heartRate : null
    var spo2 = spo2Available ? data.spo2 : null
    var stress = stressAvailable ? data.stress : null
    var heartStats = healthMetrics.stats(heartValues)
    var stressStats = healthMetrics.stats(stressValues)
    var model = {
      heartRate: heart,
      spo2: spo2,
      stress: stress,
      heartZone: heartAvailable ? healthMetrics.classifyHeartRate(heart) : 'waiting',
      spo2Zone: spo2Available ? (spo2 < 95 ? 'attention' : 'good') : 'waiting',
      stressZone: stressAvailable ? healthMetrics.classifyStress(stress) : 'waiting',
      dailyMin: heartStats.min,
      dailyMax: heartStats.max,
      stressMin: stressStats.min,
      stressAvg: stressStats.avg,
      stressMax: stressStats.max,
      heartSource: { live: heartAvailable, errorCode: data.heartRateErrorCode, mode: data.heartRateSource },
      spo2Source: { live: spo2Available, errorCode: data.spo2ErrorCode, mode: data.spo2Source },
      stressSource: { live: stressAvailable, errorCode: data.stressErrorCode, mode: data.stressSource },
      anyLive: heartAvailable || spo2Available || stressAvailable,
      serviceAvailable: data.serviceAvailable,
      updatedAt: data.updatedAt,
      heartValues: heartValues.slice(),
      spo2Values: spo2Values.slice(),
      stressValues: stressValues.slice()
    }
    if (typeof onChange === 'function') onChange(model)
    return model
  }

  function onHealth(data) {
    var generation = activeGeneration
    if (!started || generation !== lifecycleGeneration) return
    latest = data
    seedCurrent(data)
    heartValues = updateWindow(heartValues, data.heartRateChanged, data.heartRate, valid(data, 'heartRate'))
    spo2Values = updateWindow(spo2Values, data.spo2Changed, data.spo2, valid(data, 'spo2'))
    stressValues = updateWindow(stressValues, data.stressChanged, data.stress, valid(data, 'stress'))
    emit()
  }

  return {
    start: function () {
      if (started) { emit(); return }
      started = true
      activeGeneration = ++lifecycleGeneration
      healthStore.subscribeAll(onHealth)
    },
    stop: function () {
      if (!started) return
      started = false
      lifecycleGeneration++
      healthStore.unsubscribe(onHealth)
    }
  }
}
