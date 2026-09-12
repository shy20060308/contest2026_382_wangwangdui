function createLocation(geolocation, options) {
  var listeners = []
  var active = false
  var generation = 0
  var now = options && typeof options.now === 'function' ? options.now : Date.now

  function optionalNumber(value) {
    return typeof value === 'number' && isFinite(value) ? value : null
  }

  function normalize(data) {
    if (!data || typeof data.latitude !== 'number' || !isFinite(data.latitude) || typeof data.longitude !== 'number' || !isFinite(data.longitude)) return null
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: optionalNumber(data.altitude),
      accuracy: optionalNumber(data.accuracy),
      speed: optionalNumber(data.speed),
      timestamp: now()
    }
  }

  function emit(point, owner) {
    if (owner !== generation || !active || listeners.length === 0) return
    var current = listeners.slice()
    for (var i = 0; i < current.length; i++) current[i](point)
  }

  function stopNative() {
    generation++
    var shouldStop = active
    active = false
    if (!shouldStop) return
    try {
      if (geolocation && geolocation.unsubscribe) geolocation.unsubscribe()
    } catch (error) {}
  }

  function startNative() {
    if (active || listeners.length === 0 || !geolocation || !geolocation.subscribe) return active
    var owner = ++generation
    try {
      active = true
      geolocation.subscribe({
        interval: 'normal',
        callback: function (data) {
          if (owner !== generation || !active) return
          var point = normalize(data)
          if (point) emit(point, owner)
        },
        fail: function () {
          if (owner !== generation || !active) return
          active = false
          generation++
        }
      })
      return true
    } catch (error) {
      if (owner === generation) {
        active = false
        generation++
      }
      return false
    }
  }

  function remove(listener) {
    var next = []
    for (var i = 0; i < listeners.length; i++) if (listeners[i] !== listener) next.push(listeners[i])
    listeners = next
  }

  return {
    subscribe: function (listener) {
      if (typeof listener !== 'function' || listeners.indexOf(listener) >= 0) return false
      listeners.push(listener)
      return startNative()
    },
    unsubscribe: function (listener) {
      remove(listener)
      if (listeners.length === 0) stopNative()
    }
  }
}

module.exports = { createLocation: createLocation }
