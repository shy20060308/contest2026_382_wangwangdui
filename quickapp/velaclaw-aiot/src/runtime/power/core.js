var stateMachine = require('../../domain/power/state_machine')
var powerPolicy = require('../../domain/power/policy')
var raiseWake = require('../../domain/power/raise_wake')
var healthMetrics = require('../../domain/health/metrics')

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
  var raiseWakeSubscribed = false
  var raiseWakeActive = false
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
    return !!(sample && sample.live === true && sample.source === 'live' && healthMetrics.isHeartRate(sample.value))
  }

  function handleHeartSample(sample) {
    if (!isOfficialHeartSample(sample)) return
    latestHeartSample = sample
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
    if (typeof reason !== 'string' || !reason) throw new Error('Power Runtime requires an activity reason')
    if (!started) return currentMode
    var snapshot = machine.markActive(reason, now())
    if (snapshot.mode !== currentMode) applyMode(snapshot.mode, reason)
    return currentMode
  }

  function handleMotionSample(sample) {
    if (!started || !raiseWakeEnabled || !lowPowerEnabled) return
    if (!raiseDetector.push(sample, now())) return
    markActive('raise-wake')
    onWake('raise-wake')
  }

  function handleMotionFailure() {
    raiseWakeActive = false
    raiseDetector.reset()
  }

  function releaseRaiseWake() {
    if (raiseWakeSubscribed) motion.unsubscribe(handleMotionSample)
    raiseWakeSubscribed = false
    raiseWakeActive = false
    raiseDetector.reset()
  }

  function reconcileRaiseWake() {
    var shouldSubscribe = started && lowPowerEnabled && raiseWakeEnabled
    if (!shouldSubscribe) {
      releaseRaiseWake()
      return
    }
    if (raiseWakeSubscribed && raiseWakeActive) return
    var wasSubscribed = raiseWakeSubscribed
    var activeNow = motion.subscribe(handleMotionSample, { interval: 'normal', fail: handleMotionFailure }) === true
    if (!wasSubscribed) raiseWakeSubscribed = activeNow
    raiseWakeActive = activeNow
    raiseDetector.reset()
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
    releaseRaiseWake()
    stopHealth()
  }

  function forceMode(mode, reason) {
    var snapshot = machine.force(mode, reason, now())
    return applyMode(snapshot.mode, snapshot.reason)
  }

  function getMode() {
    return currentMode
  }

  function getSnapshot() {
    return {
      started: started,
      configured: configured,
      mode: currentMode,
      healthActive: healthActive,
      raiseWakeSubscribed: raiseWakeSubscribed,
      raiseWakeActive: raiseWakeActive,
      idleTimerActive: idleTimer !== null,
      mainTimerActive: mainTimer !== null,
      heartTimerActive: heartTimer !== null
    }
  }

  return {
    configure: configure,
    start: start,
    stop: stop,
    markActive: markActive,
    evaluateIdle: evaluateIdle,
    forceMode: forceMode,
    getMode: getMode,
    getSnapshot: getSnapshot
  }
}

module.exports = { create: create }
