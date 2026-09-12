function clone(snapshot) {
  return {
    value: snapshot.value,
    live: snapshot.live,
    updatedAt: snapshot.updatedAt,
    receivedAt: snapshot.receivedAt,
    errorCode: snapshot.errorCode,
    available: snapshot.available,
    source: snapshot.source
  }
}

function createHealthChannel(health, options) {
  if (!options || typeof options.dataTypeName !== 'string' || !options.dataTypeName) throw new Error('Health channel requires dataTypeName')

  var listeners = []
  var subscribed = false
  var generation = 0
  var lastAcceptedTimestamp = 0
  var now = typeof options.now === 'function' ? options.now : Date.now
  var state = {
    value: null,
    live: false,
    updatedAt: 0,
    receivedAt: 0,
    errorCode: 0,
    available: false,
    source: 'unavailable'
  }

  function dataType() {
    if (!health || !health.DATA_TYPES) return null
    var value = health.DATA_TYPES[options.dataTypeName]
    return typeof value === 'number' ? value : null
  }

  function serviceAvailable() {
    return !!(health && health.getRecentSamples && health.subscribeSample && health.unsubscribeSample && dataType() !== null)
  }

  function emit() {
    var snapshot = clone(state)
    var current = listeners.slice()
    for (var i = 0; i < current.length; i++) current[i](snapshot)
  }

  function setUnavailable() {
    state.live = false
    state.available = false
    state.errorCode = 0
    state.source = 'unavailable'
    emit()
  }

  function setFailure(code) {
    state.live = false
    state.available = serviceAvailable()
    state.errorCode = typeof code === 'number' ? code : 200
    state.source = state.available ? 'error' : 'unavailable'
    emit()
  }

  function sampleTimestamp(sample) {
    if (!sample || typeof sample.timeStamp !== 'number' || !isFinite(sample.timeStamp) || sample.timeStamp <= 0) return 0
    return Math.round(sample.timeStamp)
  }

  function applySample(sample, owner) {
    if (owner !== generation || !subscribed || listeners.length === 0) return false
    if (!sample || typeof sample.value !== 'number' || !isFinite(sample.value)) return false
    var measuredAt = sampleTimestamp(sample)
    if (!measuredAt || measuredAt <= lastAcceptedTimestamp) return false
    lastAcceptedTimestamp = measuredAt
    state.value = sample.value
    state.live = true
    state.available = true
    state.errorCode = 0
    state.updatedAt = measuredAt
    state.receivedAt = now()
    state.source = 'live'
    emit()
    return true
  }

  function newestRecent(list) {
    if (!Array.isArray(list)) return null
    var best = null
    var bestTimestamp = lastAcceptedTimestamp
    for (var i = 0; i < list.length; i++) {
      var sample = list[i] && list[i].data
      var timestamp = sampleTimestamp(sample)
      if (sample && typeof sample.value === 'number' && isFinite(sample.value) && timestamp > bestTimestamp) {
        best = sample
        bestTimestamp = timestamp
      }
    }
    return best
  }

  function loadRecent(owner) {
    if (!serviceAvailable()) return
    try {
      health.getRecentSamples({
        dataTypes: [dataType()],
        success: function (list) {
          if (owner !== generation || !subscribed || listeners.length === 0) return
          var sample = newestRecent(list)
          if (sample) applySample(sample, owner)
        },
        fail: function (data, code) {
          if (owner !== generation || !subscribed || listeners.length === 0 || state.live) return
          setFailure(code)
        }
      })
    } catch (error) {
      if (owner === generation && subscribed && listeners.length > 0 && !state.live) setFailure(200)
    }
  }

  function startNative() {
    if (subscribed || listeners.length === 0) return
    state.available = serviceAvailable()
    if (!state.available) {
      setUnavailable()
      return
    }
    state.live = false
    state.errorCode = 0
    state.source = state.value === null ? 'waiting' : 'cached'
    emit()
    var owner = ++generation
    try {
      subscribed = true
      health.subscribeSample({
        dataType: dataType(),
        callback: function (sample) { applySample(sample, owner) },
        fail: function (data, code) {
          if (owner !== generation || !subscribed) return
          subscribed = false
          generation++
          setFailure(code)
        }
      })
      loadRecent(owner)
    } catch (error) {
      if (owner !== generation) return
      subscribed = false
      generation++
      setFailure(200)
    }
  }

  function stopNative() {
    generation++
    var shouldUnsubscribe = subscribed
    subscribed = false
    if (shouldUnsubscribe && health && health.unsubscribeSample) {
      try {
        health.unsubscribeSample({ dataType: dataType() })
      } catch (error) {}
    }
    state.live = false
    state.source = state.value === null ? (serviceAvailable() ? 'waiting' : 'unavailable') : 'cached'
  }

  function subscribe(listener) {
    if (typeof listener !== 'function' || listeners.indexOf(listener) >= 0) return
    listeners.push(listener)
    if (listeners.length === 1) startNative()
    else listener(clone(state))
  }

  function unsubscribe(listener) {
    var next = []
    for (var i = 0; i < listeners.length; i++) if (listeners[i] !== listener) next.push(listeners[i])
    listeners = next
    if (listeners.length === 0) stopNative()
  }

  return {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    getSnapshot: function () { return clone(state) },
    isAvailable: serviceAvailable
  }
}

module.exports = { createHealthChannel: createHealthChannel }
