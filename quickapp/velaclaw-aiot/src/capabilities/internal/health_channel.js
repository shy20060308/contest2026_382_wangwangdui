import health from '@service.health'

function safeNumber(value, fallback) {
  var number = Number(value)
  return isFinite(number) ? Math.round(number) : fallback
}

function sampleNumber(value) {
  var number = Number(value)
  return isFinite(number) ? Math.round(number) : null
}

function safeTimestamp(value) {
  var number = Number(value)
  return isFinite(number) && number > 0 ? Math.round(number) : Date.now()
}

function clone(snapshot) {
  return {
    value: snapshot.value,
    live: snapshot.live,
    updatedAt: snapshot.updatedAt,
    errorCode: snapshot.errorCode,
    available: snapshot.available,
    source: snapshot.source
  }
}

export default function createHealthChannel(options) {
  var config = options || {}
  var listeners = []
  var subscribed = false
  var state = {
    value: null,
    live: false,
    updatedAt: 0,
    errorCode: 0,
    available: false,
    source: 'unavailable'
  }

  function dataType() {
    if (!health || !health.DATA_TYPES) return config.fallbackDataType
    var value = health.DATA_TYPES[config.dataTypeName]
    return value === undefined || value === null ? config.fallbackDataType : value
  }

  function serviceAvailable() {
    return !!(health && health.getRecentSamples && health.subscribeSample && health.unsubscribeSample)
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
    state.errorCode = safeNumber(code, 200)
    state.source = state.available ? 'error' : 'unavailable'
    emit()
  }

  function applySample(sample) {
    if (!sample || sample.value === undefined || sample.value === null) return
    var value = sampleNumber(sample.value)
    if (value === null) return
    state.value = value
    state.live = true
    state.available = true
    state.errorCode = 0
    state.updatedAt = safeTimestamp(sample.timeStamp)
    state.source = 'live'
    emit()
  }

  function loadRecent() {
    if (!serviceAvailable()) return
    try {
      health.getRecentSamples({
        dataTypes: [dataType()],
        success: function (list) {
          if (!Array.isArray(list) || !list.length) return
          for (var i = list.length - 1; i >= 0; i--) {
            if (list[i] && list[i].data) {
              applySample(list[i].data)
              return
            }
          }
        },
        fail: function (data, code) {
          if (!state.live) setFailure(code)
        }
      })
    } catch (error) {
      if (!state.live) setFailure(200)
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
    try {
      subscribed = true
      health.subscribeSample({
        dataType: dataType(),
        callback: applySample,
        fail: function (data, code) {
          subscribed = false
          setFailure(code)
        }
      })
      loadRecent()
    } catch (error) {
      subscribed = false
      setFailure(200)
    }
  }

  function stopNative() {
    if (subscribed && health && health.unsubscribeSample) {
      try {
        health.unsubscribeSample({ dataType: dataType() })
      } catch (error) {}
    }
    subscribed = false
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
    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i] !== listener) next.push(listeners[i])
    }
    listeners = next
    if (listeners.length === 0) stopNative()
  }

  return {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    getLatest: function () { return state.value },
    getSnapshot: function () { return clone(state) },
    isActive: function () { return listeners.length > 0 },
    consumerCount: function () { return listeners.length },
    isAvailable: serviceAvailable
  }
}
