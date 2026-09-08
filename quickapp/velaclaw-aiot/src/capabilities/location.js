import geolocation from '@system.geolocation'

var listeners = []
var active = false

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
    timestamp: Date.now()
  }
}

function emit(point) {
  var current = listeners.slice()
  for (var i = 0; i < current.length; i++) current[i](point)
}

function startNative() {
  if (active || listeners.length === 0) return
  try {
    if (!geolocation || !geolocation.subscribe) return
    active = true
    geolocation.subscribe({
      interval: 'normal',
      callback: function (data) {
        var point = normalize(data)
        if (point) emit(point)
      },
      fail: function () { active = false }
    })
  } catch (error) {
    active = false
  }
}

function stopNative() {
  if (!active) return
  try {
    if (geolocation && geolocation.unsubscribe) geolocation.unsubscribe()
  } catch (error) {}
  active = false
}

export default {
  subscribe: function (listener) {
    if (typeof listener !== 'function' || listeners.indexOf(listener) >= 0) return false
    listeners.push(listener)
    if (listeners.length === 1) startNative()
    return active
  },
  unsubscribe: function (listener) {
    var next = []
    for (var i = 0; i < listeners.length; i++) if (listeners[i] !== listener) next.push(listeners[i])
    listeners = next
    if (listeners.length === 0) stopNative()
  }
}
