import healthTransport from './health_transport'
import watchData from './watch_data'

/**
 * 健康领域协调层
 *
 * 职责：
 * 1. 作为页面唯一的系统健康消费入口，按消费者数量启停底层健康流；
 * 2. 在领域层统一判断 heartRate / spo2 / stress 是否为新 sample；
 * 3. 默认把新心率同步到 watch_data，但允许低功耗消费者只观察 sample，按自己的
 *    刷新节奏显式调用 syncHeartRate()。这样 clock 的 DIM 模式不会因为底层仍以
 *    1Hz 到样而偷偷恢复 1Hz 的业务写入。
 *
 * 不生成 UI 文案、不计算卡片布局，也不感知 circle/pill/rect。
 */
var listeners = []
var active = false
var latestState = null
var lastObservedAt = {
  heartRate: 0,
  spo2: 0,
  stress: 0
}
var lastSyncedHeartRateAt = 0

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

function didMetricChange(name, updatedAt) {
  var next = Number(updatedAt) || 0
  if (next <= 0 || next === lastObservedAt[name]) return false
  lastObservedAt[name] = next
  return true
}

function hasAutoSyncConsumer() {
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i].syncWatchData !== false) return true
  }
  return false
}

function buildState(sample, changes) {
  var state = copySample(sample)
  var dirty = changes || {}
  state.heartRateChanged = dirty.heartRate === true
  state.spo2Changed = dirty.spo2 === true
  state.stressChanged = dirty.stress === true
  state.watchSnapshot = watchData.getSnapshot()
  return state
}

function syncHeartRate(sample) {
  var source = sample || latestState || healthTransport.getSnapshot()
  var updatedAt = Number(source && source.heartRateUpdatedAt) || 0
  if (updatedAt <= 0 || updatedAt === lastSyncedHeartRateAt) {
    return watchData.getSnapshot()
  }
  lastSyncedHeartRateAt = updatedAt
  var snapshot = watchData.applyHeartRate(source.heartRate)
  if (latestState) latestState.watchSnapshot = snapshot
  return snapshot
}

function emit(state) {
  latestState = state
  var snapshot = listeners.slice()
  for (var i = 0; i < snapshot.length; i++) {
    snapshot[i].listener(state)
  }
}

function handleSample(sample) {
  var changes = {
    heartRate: didMetricChange('heartRate', sample && sample.heartRateUpdatedAt),
    spo2: didMetricChange('spo2', sample && sample.spo2UpdatedAt),
    stress: didMetricChange('stress', sample && sample.stressUpdatedAt)
  }

  if (hasAutoSyncConsumer()) syncHeartRate(sample)
  emit(buildState(sample, changes))
}

function startService() {
  if (active) return
  active = true
  healthTransport.start(handleSample)
}

function stopService() {
  if (!active) return
  healthTransport.stop(handleSample)
  active = false
}

function findListener(listener) {
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i].listener === listener) return listeners[i]
  }
  return null
}

function addListener(listener, options) {
  if (typeof listener !== 'function') return
  if (findListener(listener)) return
  var entry = {
    listener: listener,
    syncWatchData: !(options && options.syncWatchData === false)
  }
  listeners.push(entry)

  if (active) {
    var source = latestState || healthTransport.getSnapshot()
    if (entry.syncWatchData) syncHeartRate(source)
    listener(buildState(source))
    return
  }
  startService()
}

function removeListener(listener) {
  var next = []
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i].listener !== listener) next.push(listeners[i])
  }
  listeners = next
  if (listeners.length === 0) stopService()
}

export default {
  start: addListener,
  stop: removeListener,
  syncHeartRate: syncHeartRate,

  getSnapshot: function () {
    return latestState || buildState(healthTransport.getSnapshot())
  }
}
