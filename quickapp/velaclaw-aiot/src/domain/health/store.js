import heartRateCapability from '../../capabilities/heart_rate'
import bloodOxygenCapability from '../../capabilities/blood_oxygen'
import stressCapability from '../../capabilities/stress'

var listeners = []
var active = { heartRate: false, spo2: false, stress: false }
var lastObservedAt = { heartRate: 0, spo2: 0, stress: 0 }
var latestState = null

function requireMetrics(metrics) {
  if (!Array.isArray(metrics) || !metrics.length) throw new Error('Health Store requires explicit metrics')
  var result = []
  for (var i = 0; i < metrics.length; i++) {
    var name = metrics[i]
    if (name !== 'heartRate' && name !== 'spo2' && name !== 'stress') throw new Error('Unknown health metric: ' + name)
    if (result.indexOf(name) < 0) result.push(name)
  }
  return result
}

function needsMetric(name) {
  for (var i = 0; i < listeners.length; i++) if (listeners[i].metrics.indexOf(name) >= 0) return true
  return false
}

function didChange(name, updatedAt) {
  if (updatedAt <= 0 || updatedAt === lastObservedAt[name]) return false
  lastObservedAt[name] = updatedAt
  return true
}

function buildState(changedMetric) {
  var heart = heartRateCapability.getSnapshot()
  var spo2 = bloodOxygenCapability.getSnapshot()
  var stress = stressCapability.getSnapshot()
  var state = {
    heartRate: heart.value,
    spo2: spo2.value,
    stress: stress.value,
    heartRateLive: heart.live,
    spo2Live: spo2.live,
    stressLive: stress.live,
    heartRateSource: heart.source,
    spo2Source: spo2.source,
    stressSource: stress.source,
    heartRateErrorCode: heart.errorCode,
    spo2ErrorCode: spo2.errorCode,
    stressErrorCode: stress.errorCode,
    anyLive: heart.live || spo2.live || stress.live,
    serviceAvailable: heart.available || spo2.available || stress.available,
    heartRateUpdatedAt: heart.updatedAt,
    spo2UpdatedAt: spo2.updatedAt,
    stressUpdatedAt: stress.updatedAt,
    updatedAt: Math.max(heart.updatedAt, spo2.updatedAt, stress.updatedAt),
    heartRateChanged: false,
    spo2Changed: false,
    stressChanged: false
  }
  if (changedMetric) state[changedMetric + 'Changed'] = didChange(changedMetric, state[changedMetric + 'UpdatedAt'])
  latestState = state
  return state
}

function emit(changedMetric) {
  var state = buildState(changedMetric)
  var current = listeners.slice()
  for (var i = 0; i < current.length; i++) if (!changedMetric || current[i].metrics.indexOf(changedMetric) >= 0) current[i].listener(state)
}

function onHeartRate() { emit('heartRate') }
function onSpo2() { emit('spo2') }
function onStress() { emit('stress') }

function reconcileMetric(name, capability, handler) {
  var needed = needsMetric(name)
  if (needed && !active[name]) { active[name] = true; capability.subscribe(handler) }
  else if (!needed && active[name]) { capability.unsubscribe(handler); active[name] = false }
}

function reconcile() {
  reconcileMetric('heartRate', heartRateCapability, onHeartRate)
  reconcileMetric('spo2', bloodOxygenCapability, onSpo2)
  reconcileMetric('stress', stressCapability, onStress)
}

function subscribe(listener, metrics) {
  if (typeof listener !== 'function') throw new Error('Health Store requires a listener')
  for (var i = 0; i < listeners.length; i++) if (listeners[i].listener === listener) return
  listeners.push({ listener: listener, metrics: requireMetrics(metrics) })
  reconcile()
  listener(latestState || buildState())
}

function unsubscribe(listener) {
  var next = []
  for (var i = 0; i < listeners.length; i++) if (listeners[i].listener !== listener) next.push(listeners[i])
  listeners = next
  reconcile()
}

export default {
  subscribeHeartRate: function (listener) { subscribe(listener, ['heartRate']) },
  subscribeBloodOxygen: function (listener) { subscribe(listener, ['spo2']) },
  subscribeStress: function (listener) { subscribe(listener, ['stress']) },
  subscribeAll: function (listener) { subscribe(listener, ['heartRate', 'spo2', 'stress']) },
  unsubscribe: unsubscribe,
  getSnapshot: function () { return latestState || buildState() }
}
