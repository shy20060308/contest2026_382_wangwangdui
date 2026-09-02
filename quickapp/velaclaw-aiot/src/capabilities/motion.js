import sensor from '@system.sensor'

var listeners = []
var active = false
var latest = null

function clone(sample) {
  if (!sample) return null
  return { x: sample.x, y: sample.y, z: sample.z, timestamp: sample.timestamp }
}

function handle(data) {
  latest = {
    x: Number(data && data.x) || 0,
    y: Number(data && data.y) || 0,
    z: Number(data && data.z) || 0,
    timestamp: Date.now()
  }
  var current = listeners.slice()
  for (var i = 0; i < current.length; i++) current[i](clone(latest))
}

function startNative() {
  if (active || listeners.length === 0) return
  try {
    if (!sensor || !sensor.subscribeAccelerometer) return
    active = true
    sensor.subscribeAccelerometer({
      interval: 'normal',
      callback: handle,
      fail: function () { active = false }
    })
  } catch (error) {
    active = false
  }
}

function stopNative() {
  if (!active) return
  try {
    if (sensor && sensor.unsubscribeAccelerometer) sensor.unsubscribeAccelerometer()
  } catch (error) {}
  active = false
}

export default {
  subscribe: function (listener) {
    if (typeof listener !== 'function' || listeners.indexOf(listener) >= 0) return false
    listeners.push(listener)
    if (latest) listener(clone(latest))
    if (listeners.length === 1) startNative()
    return active
  },
  unsubscribe: function (listener) {
    var next = []
    for (var i = 0; i < listeners.length; i++) if (listeners[i] !== listener) next.push(listeners[i])
    listeners = next
    if (listeners.length === 0) stopNative()
  },
  getSnapshot: function () { return clone(latest) },
  consumerCount: function () { return listeners.length },
  isActive: function () { return active }
}
