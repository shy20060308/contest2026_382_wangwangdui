import sensor from '@system.sensor'

var consumers = []
var active = false
var activeInterval = ''

function requireInterval(interval) {
  if (interval !== 'normal' && interval !== 'ui' && interval !== 'game') throw new Error('Unknown accelerometer interval: ' + interval)
  return interval
}

function intervalRank(interval) {
  if (interval === 'game') return 3
  if (interval === 'ui') return 2
  return 1
}

function desiredInterval() {
  var selected = 'normal'
  for (var i = 0; i < consumers.length; i++) {
    if (intervalRank(consumers[i].interval) > intervalRank(selected)) selected = consumers[i].interval
  }
  return selected
}

function emitError(code) {
  var current = consumers.slice()
  for (var i = 0; i < current.length; i++) if (typeof current[i].fail === 'function') current[i].fail(code)
}

function handle(data) {
  if (!data || typeof data.x !== 'number' || !isFinite(data.x) || typeof data.y !== 'number' || !isFinite(data.y) || typeof data.z !== 'number' || !isFinite(data.z)) return
  var sample = { x: data.x, y: data.y, z: data.z, timestamp: Date.now() }
  var current = consumers.slice()
  for (var i = 0; i < current.length; i++) current[i].listener({ x: sample.x, y: sample.y, z: sample.z, timestamp: sample.timestamp })
}

function stopNative() {
  if (!active) return
  try {
    if (sensor && sensor.unsubscribeAccelerometer) sensor.unsubscribeAccelerometer()
  } catch (error) {}
  active = false
  activeInterval = ''
}

function startNative(interval) {
  if (consumers.length === 0 || !sensor || !sensor.subscribeAccelerometer) return false
  try {
    active = true
    activeInterval = interval
    sensor.subscribeAccelerometer({
      interval: interval,
      callback: handle,
      fail: function (data, code) {
        active = false
        activeInterval = ''
        emitError(code === undefined ? 'failed' : code)
      }
    })
    return true
  } catch (error) {
    active = false
    activeInterval = ''
    return false
  }
}

function reconcile() {
  if (consumers.length === 0) {
    stopNative()
    return false
  }
  var interval = desiredInterval()
  if (active && activeInterval === interval) return true
  if (active) stopNative()
  return startNative(interval)
}

function removeConsumer(listener) {
  var next = []
  for (var i = 0; i < consumers.length; i++) if (consumers[i].listener !== listener) next.push(consumers[i])
  consumers = next
}

export default {
  subscribe: function (listener, options) {
    if (typeof listener !== 'function') return false
    var interval = requireInterval(options && options.interval ? options.interval : 'normal')
    var fail = options && options.fail
    for (var i = 0; i < consumers.length; i++) {
      if (consumers[i].listener === listener) {
        var previousInterval = consumers[i].interval
        var previousFail = consumers[i].fail
        consumers[i].interval = interval
        consumers[i].fail = fail
        if (reconcile()) return true
        consumers[i].interval = previousInterval
        consumers[i].fail = previousFail
        reconcile()
        return false
      }
    }
    consumers.push({ listener: listener, interval: interval, fail: fail })
    if (reconcile()) return true
    removeConsumer(listener)
    reconcile()
    return false
  },
  unsubscribe: function (listener) {
    removeConsumer(listener)
    reconcile()
  },
  isAvailable: function () { return !!(sensor && sensor.subscribeAccelerometer) }
}
