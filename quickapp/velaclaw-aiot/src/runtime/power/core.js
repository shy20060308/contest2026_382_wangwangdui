var stateMachine = require('../../domain/power/state_machine')
var powerPolicy = require('../../domain/power/policy')
var raiseWake = require('../../domain/power/raise_wake')

function noop() {}

function create(dependencies, options) {
  var deps = dependencies
  var config = options || {}
  var displayPower = deps.displayPower
  var motion = deps.motion
  var heartRate = deps.heartRate
  var battery = deps.battery
  var now = typeof deps.now === 'function' ? deps.now : Date.now
  var schedule = typeof deps.setInterval === 'function' ? deps.setInterval : setInterval
  var cancel = typeof deps.clearInterval === 'function' ? deps.clearInterval : clearInterval

  var machine = stateMachine.create(now())
  var raiseDetector = raiseWake.create()
  var started = false
  var configured = false
  var idleTimer = null
  var mainTimer = null
  var heartTimer = null
  var healthActive = false
  var raiseWakeRegistered = false
  var latestHeartSample = null
  var currentMode = stateMachine.MODE_ACTIVE
  var lowPowerEnabled
  var raiseWakeEnabled
  var activeBrightnessValue

  var onMode = typeof config.onMode === 'function' ? config.onMode : noop
  var onTime = typeof config.onTime === 'function' ? config.onTime : noop
  var onHeartRate = typeof config.onHeartRate === 'function' ? config.onHeartRate : noop
  var onBattery = typeof config.onBattery === 'function' ? config.onBattery : noop
  var onWake = typeof config.onWake === 'function' ? config.onWake : noop

  function clearTimer(timer) {
    if (timer !== null) cancel(timer)
    return null
  }

  function applyDisplay(mode) {
    var policy = powerPolicy.get(mode)
    var brightness = mode === stateMachine.MODE_ACTIVE ? activeBrightnessValue : policy.brightness
    displayPower.setBrightness(brightness)
    displayPower.setKeepScreenOn(policy.keepScreenOn)
  }

  function isOfficialHeartSample(sample) {
    return !!(sample && sample.live === true && sample.source === 'live' && sample.value > 0)
  }

  function handleHeartSample(sample) {
    if (!isOfficialHeartSample(sample)) return
    latestHeartSample = sample
    // ACTIVE publishes official raw samples immediately. DIM buffers samples
    // and only publishes through the lower-frequency business cadence.
    if (currentMode === stateMachine.MODE_ACTIVE) onHeartRate(sample, 'live')
  }

  function startHealth() {
    if (healthActive) return
    healthActive = true
    heartRate.subscribe(handleHeartSample)
  }

  function stopHealth() {
    if (!healthActive) return
    heartRate.unsubscribe(handleHeartSample)
    healthActive = false
  }

  function refreshHealthPolicy(mode) {
    if (powerPolicy.get(mode).healthEnabled) startHealth()
    else stopHealth()
  }

  function readBattery() {
    battery.get(function (percent) { onBattery(percent) })
  }

  function restartCadence(mode) {
    mainTimer = clearTimer(mainTimer)
    heartTimer = clearTimer(heartTimer)
    var policy = powerPolicy.get(mode)
    var lastBatteryAt = 0

    if (policy.timeInterval > 0) {
      mainTimer = schedule(function () {
        var time = now()
        onTime(time)
        if (policy.batteryInterval > 0 && time - lastBatteryAt >= policy.batteryInterval) {
          readBattery()
          lastBatteryAt = time
        }
      }, policy.timeInterval)
    }

    if (policy.heartInterval > 0) {
      heartTimer = schedule(function () {
        if (latestHeartSample) onHeartRate(latestHeartSample, 'cadence')
      }, policy.heartInterval)
    }
  }

  function applyMode(mode, reason) {
    if (!started) return currentMode
    var changed = mode !== currentMode
    currentMode = mode
    applyDisplay(mode)
    refreshHealthPolicy(mode)
    if (changed || mainTimer === null) restartCadence(mode)
    onMode(mode, powerPolicy.get(mode), reason)
    return currentMode
  }

  function evaluateIdle() {
    if (!started || !lowPowerEnabled) return
    var snapshot = machine.evaluate(now())
    if (snapshot.mode !== currentMode) applyMode(snapshot.mode, snapshot.reason)
  }

  function markActive(reason) {
    if (!started) return currentMode
    var nextReason = reason || 'activity'
    var snapshot = machine.markActive(nextReason, now())
    if (snapshot.mode !== currentMode) applyMode(snapshot.mode, nextReason)
    return currentMode
  }

  function handleMotionSample(sample) {
    if (!started || !raiseWakeEnabled || !lowPowerEnabled) return
    if (!raiseDetector.push(sample, now())) return
    markActive('raise-wake')
    onWake('raise-wake')
  }

  function reconcileRaiseWake() {
    var shouldRegister = started && lowPowerEnabled && raiseWakeEnabled
    if (!shouldRegister) {
      if (raiseWakeRegistered) motion.unsubscribe(handleMotionSample)
      raiseWakeRegistered = false
      raiseDetector.reset()
      return
    }
    if (!raiseWakeRegistered) {
      // Motion capability emits canonical acceleration. The semantic detector
      // decides whether a sequence is actually a raise-to-wake gesture.
      raiseWakeRegistered = motion.subscribe(handleMotionSample, { interval: 'normal' }) === true
      raiseDetector.reset()
    }
  }

  function reconcileIdleTimer() {
    idleTimer = clearTimer(idleTimer)
    if (started && lowPowerEnabled) idleTimer = schedule(evaluateIdle, 1000)
  }

  function requireConfiguration(value) {
    if (!value || typeof value.lowPowerEnabled !== 'boolean' || typeof value.raiseWakeEnabled !== 'boolean' || typeof value.activeBrightnessValue !== 'number') {
      throw new Error('Power Runtime requires canonical Settings before start')
    }
  }

  function configure(next) {
    requireConfiguration(next)
    var brightnessChanged = configured && next.activeBrightnessValue !== activeBrightnessValue
    lowPowerEnabled = next.lowPowerEnabled
    raiseWakeEnabled = next.raiseWakeEnabled
    activeBrightnessValue = next.activeBrightnessValue
    configured = true

    if (!started) return
    reconcileRaiseWake()
    reconcileIdleTimer()
    if (!lowPowerEnabled) {
      machine.markActive('low-power-disabled', now())
      applyMode(stateMachine.MODE_ACTIVE, 'low-power-disabled')
    } else {
      evaluateIdle()
    }
    if (brightnessChanged && currentMode === stateMachine.MODE_ACTIVE) applyDisplay(currentMode)
  }

  function start() {
    if (started) return
    if (!configured) throw new Error('Power Runtime must be configured before start')
    started = true
    machine = stateMachine.create(now())
    raiseDetector.reset()
    currentMode = stateMachine.MODE_ACTIVE
    var initialHeartSample = heartRate.getSnapshot()
    latestHeartSample = isOfficialHeartSample(initialHeartSample) ? initialHeartSample : null
    applyMode(stateMachine.MODE_ACTIVE, 'start')
    onTime(now())
    readBattery()
    reconcileRaiseWake()
    reconcileIdleTimer()
  }

  function stop() {
    if (!started) return
    started = false
    idleTimer = clearTimer(idleTimer)
    mainTimer = clearTimer(mainTimer)
    heartTimer = clearTimer(heartTimer)
    if (raiseWakeRegistered) motion.unsubscribe(handleMotionSample)
    raiseWakeRegistered = false
    raiseDetector.reset()
    stopHealth()
    displayPower.setBrightness(activeBrightnessValue)
    displayPower.setKeepScreenOn(true)
    currentMode = stateMachine.MODE_ACTIVE
  }

  return {
    start: start,
    stop: stop,
    configure: configure,
    markActive: markActive,
    evaluateIdle: evaluateIdle,
    forceMode: function (mode, reason) {
      var nextReason = reason || 'force'
      machine.force(mode, nextReason, now())
      return applyMode(mode, nextReason)
    },
    getMode: function () { return currentMode },
    getSnapshot: function () {
      return {
        started: started,
        mode: currentMode,
        policy: powerPolicy.get(currentMode),
        lowPowerEnabled: lowPowerEnabled,
        raiseWakeEnabled: raiseWakeEnabled,
        healthActive: healthActive,
        raiseWakeActive: raiseWakeRegistered,
        idleTimerActive: idleTimer !== null,
        mainTimerActive: mainTimer !== null,
        heartTimerActive: heartTimer !== null
      }
    }
  }
}

module.exports = { create: create }