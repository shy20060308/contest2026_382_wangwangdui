var SAMPLE_THROTTLE_MS = 100
var WAKE_COOLDOWN_MS = 3000
var DELTA_THRESHOLD = 5

function option(value, fallback, name) {
  if (value === undefined) return fallback
  if (typeof value !== 'number' || !isFinite(value) || value < 0) throw new Error('Invalid raise-wake ' + name)
  return value
}

function create(options) {
  var config = options || {}
  var threshold = option(config.deltaThreshold, DELTA_THRESHOLD, 'deltaThreshold')
  var throttleMs = option(config.sampleThrottleMs, SAMPLE_THROTTLE_MS, 'sampleThrottleMs')
  var cooldownMs = option(config.wakeCooldownMs, WAKE_COOLDOWN_MS, 'wakeCooldownMs')

  var lastAcceleration = null
  var lastWakeAt = 0
  var lastHandleAt = 0

  function reset() {
    lastAcceleration = null
    lastWakeAt = 0
    lastHandleAt = 0
  }

  function push(sample, now) {
    if (typeof now !== 'number' || !isFinite(now)) throw new Error('Raise-wake requires numeric time')
    if (lastHandleAt && now - lastHandleAt < throttleMs) return false
    lastHandleAt = now

    var wake = false
    if (lastAcceleration) {
      var delta = Math.abs(sample.x - lastAcceleration.x) +
        Math.abs(sample.y - lastAcceleration.y) +
        Math.abs(sample.z - lastAcceleration.z)
      if (delta > threshold && now - lastWakeAt > cooldownMs) {
        lastWakeAt = now
        wake = true
      }
    }
    lastAcceleration = sample
    return wake
  }

  return {
    push: push,
    reset: reset
  }
}

module.exports = {
  SAMPLE_THROTTLE_MS: SAMPLE_THROTTLE_MS,
  WAKE_COOLDOWN_MS: WAKE_COOLDOWN_MS,
  DELTA_THRESHOLD: DELTA_THRESHOLD,
  create: create
}
