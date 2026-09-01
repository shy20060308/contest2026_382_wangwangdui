import healthSampleService from './health_sample_service'
import watchData from './watch_data'

/**
 * 健康领域协调层
 *
 * 职责：
 * 1. 作为页面唯一的 health_sample_service 消费入口，按页面订阅数量启停底层健康流；
 * 2. 每个新的心率 sample 只同步一次 watch_data；
 * 3. 在领域层统一判断 heartRate / spo2 / stress 是否为新 sample，页面不再各自维护
 *    lastXxxUpdatedAt。
 *
 * 不生成 UI 文案、不计算卡片布局，也不感知 circle/pill/rect。
 */
var listeners = []
var active = false
var latestState = null
var lastUpdatedAt = {
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

function didMetricChange(name, updatedAt) {
  var next = Number(updatedAt) || 0
  if (next <= 0 || next === lastUpdatedAt[name]) return false
  lastUpdatedAt[name] = next
  return true
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

function emit(state) {
  latestState = state
  var snapshot = listeners.slice()
  for (var i = 0; i < snapshot.length; i++) {
    snapshot[i](state)
  }
}

function handleSample(sample) {
  var changes = {
    heartRate: didMetricChange('heartRate', sample && sample.heartRateUpdatedAt),
    spo2: didMetricChange('spo2', sample && sample.spo2UpdatedAt),
    stress: didMetricChange('stress', sample && sample.stressUpdatedAt)
  }

  if (changes.heartRate) watchData.applyHeartRate(sample.heartRate)
  emit(buildState(sample, changes))
}

function startService() {
  if (active) return
  active = true
  healthSampleService.start(handleSample)
}

function stopService() {
  if (!active) return
  healthSampleService.stop(handleSample)
  active = false
}

function addListener(listener) {
  if (typeof listener !== 'function') return
  if (listeners.indexOf(listener) >= 0) return
  listeners.push(listener)

  // 后加入的页面先收到当前快照；首次 listener 则由 health_sample_service.start()
  // 的同步 emit 初始化，避免同一页面 onShow 时收到两份完全相同的数据。
  if (active) {
    listener(latestState || buildState(healthSampleService.getSnapshot()))
    return
  }
  startService()
}

function removeListener(listener) {
  var next = []
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i] !== listener) next.push(listeners[i])
  }
  listeners = next
  if (listeners.length === 0) stopService()
}

export default {
  start: addListener,
  stop: removeListener,

  getSnapshot: function () {
    return latestState || buildState(healthSampleService.getSnapshot())
  }
}
