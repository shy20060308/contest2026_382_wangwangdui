import healthPlatform from '../../platform/vela/health'

var listeners = []
var active = false
var latestState = null
var lastObservedAt = {
  heartRate: 0,
  spo2: 0,
  stress: 0
}

function copySample(sample) {
  var source = sample || {}
  return {
    heartRate: source.heartRate,
    spo2: source.spo2,
    stress: source.stress,
    heartRateLive: source.heartRateLive,
    spo2Live: source.spo2Live,
    stressLive: source.stressLive,
    heartRateErrorCode: source.heartRateErrorCode,
    spo2ErrorCode: source.spo2ErrorCode,
    stressErrorCode: source.stressErrorCode,
    anyLive: source.anyLive,
    serviceAvailable: source.serviceAvailable,
    sourceText: source.sourceText,
    heartRateUpdatedAt: source.heartRateUpdatedAt || 0,
    spo2UpdatedAt: source.spo2UpdatedAt || 0,
    stressUpdatedAt: source.stressUpdatedAt || 0,
    updatedAt: source.updatedAt || 0,
    updatedAtText: source.updatedAtText || '--:--'
  }
}

function didChange(name, updatedAt) {
  var next = Number(updatedAt) || 0
  if (next <= 0 || next === lastObservedAt[name]) return false
  lastObservedAt[name] = next
  return true
}

function buildState(sample) {
  var state = copySample(sample)
  state.heartRateChanged = didChange('heartRate', state.heartRateUpdatedAt)
  state.spo2Changed = didChange('spo2', state.spo2UpdatedAt)
  state.stressChanged = didChange('stress', state.stressUpdatedAt)
  return state
}

function emit(state) {
  latestState = state
  var current = listeners.slice()
  for (var i = 0; i < current.length; i++) current[i](state)
}

function handlePlatformSample(sample) {
  emit(buildState(sample))
}

function startPlatform() {
  if (active) return
  active = true
  healthPlatform.start(handlePlatformSample)
}

function stopPlatform() {
  if (!active) return
  healthPlatform.stop(handlePlatformSample)
  active = false
}

function subscribe(listener) {
  if (typeof listener !== 'function' || listeners.indexOf(listener) >= 0) return
  listeners.push(listener)
  if (active) {
    listener(latestState || buildState(healthPlatform.getSnapshot()))
    return
  }
  startPlatform()
}

function unsubscribe(listener) {
  var next = []
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i] !== listener) next.push(listeners[i])
  }
  listeners = next
  if (listeners.length === 0) stopPlatform()
}

export default {
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  start: subscribe,
  stop: unsubscribe,
  getSnapshot: function () {
    return latestState || buildState(healthPlatform.getSnapshot())
  }
}
