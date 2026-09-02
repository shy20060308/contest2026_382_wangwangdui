var stateMachine = require('../../domain/power/state_machine')
var powerPolicy = require('../../domain/power/policy')
var displayPower = require('../../capabilities/display_power')
var motion = require('../../capabilities/motion')
var heartRate = require('../../capabilities/heart_rate')
var battery = require('../../capabilities/battery')

function noop() {}

function create(options) {
  var config = options || {}
  var machine = stateMachine.create()
  var started = false
  var idleTimer = null
  var mainTimer = null
  var heartTimer = null
  var healthActive = false
  var raiseWakeRegistered = false
  var latestHeartSample = null
  var currentMode = stateMachine.MODE_ACTIVE
  var lowPowerEnabled = config.lowPowerEnabled !== false
  var raiseWakeEnabled = config.raiseWakeEnabled !== false
  var activeBrightnessValue = typeof config.activeBrightnessValue === 'number' ? config.activeBrightnessValue : 140

  var onMode = typeof config.onMode === 'function' ? config.onMode : noop
  var onTime = typeof config.onTime === 'function' ? config.onTime : noop
  var onHeartRate = typeof config.onHeartRate === 'function' ? config.onHeartRate : noop
  var onBattery = typeof config.onBattery === 'function' ? config.onBattery : noop
  var onWake = typeof config.onWake === 'function' ? config.onWake : noop

  function clearTimer(timer) {
    if (timer) clearInterval(timer)
    return null
  }

  function applyDisplay(mode) {
    var policy = powerPolicy.get(mode)
    var brightness = policy.brightness
    if (mode === stateMachine.MODE_ACTIVE && typeof activeBrightnessValue === 'number') {
      brightness = activeBrightnessValue
    }
    displayPower.setBrightness(brightness)
    displayPower.setKeepScreenOn(policy.keepScreenOn)
  }

  function handleHeartSample(sample) {
    latestHeartSample = sample
    // Golden behavior: ACTIVE applies live HR immediately. DIM only buffers the
    // raw sample; the lower-frequency heart timer publishes it later.
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
    var policy = powerPolicy.get(mode)
    if (policy.healthEnabled) startHealth()
    else stopHealth()
  }

  function readBattery() {
    battery.get(function (percent) {
      onBattery(percent)
    })
  }

  function restartCadence(mode) {
    mainTimer = clearTimer(mainTimer)
    heartTimer = clearTimer(heartTimer)
    var policy = powerPolicy.get(mode)
    var lastBatteryAt = Date.now()

    if (policy.timeInterval > 0) {
      mainTimer = setInterval(function () {
        var now = Date.now()
        onTime(now)
        if (policy.batteryInterval > 0 && now - lastBatteryAt >= policy.batteryInterval) {
          readBattery()
          lastBatteryAt = now
        }
      }, policy.timeInterval)
    }

    if (policy.heartInterval > 0) {
      heartTimer = setInterval(function () {
        if (latestHeartSample) onHeartRate(latestHeartSample, 'cadence')
      }, policy.heartInterval)
    }
  }

  function applyMode(mode, reason) {
    if (!started) return currentMode
    if (mode !== stateMachine.MODE_ACTIVE && mode !== stateMachine.MODE_DIM && mode !== stateMachine.MODE_SLEEP) {
      mode = stateMachine.MODE_ACTIVE
    }
    var changed = mode !== currentMode
    currentMode = mode
    applyDisplay(mode)
    refreshHealthPolicy(mode)
    if (changed || !mainTimer) restartCadence(mode)
    onMode(mode, powerPolicy.get(mode), reason || 'transition')
    return currentMode
  }

  function evaluateIdle() {
    if (!started || !lowPowerEnabled) return
    var snapshot = machine.evaluate(Date.now())
    if (snapshot.mode !== currentMode) applyMode(snapshot.mode, snapshot.reason)
  }

  function reconcileIdleTimer() {
    if (!started || !lowPowerEnabled) {
      idleTimer = clearTimer(idleTimer)
      return
    }
    if (!idleTimer) idleTimer = setInterval(evaluateIdle, 1000)
  }

  function handleRaiseWake() {
    if (!started) return
    markActive('raise-wake')
    onWake('raise-wake')
  }

  function reconcileRaiseWake() {
    var shouldRegister = started && raiseWakeEnabled && lowPowerEnabled
    if (!shouldRegister) {
      if (raiseWakeRegistered) motion.unsubscribe(handleRaiseWake)
      raiseWakeRegistered = false
      return
    }
    if (!raiseWakeRegistered) {
      motion.subscribe(handleRaiseWake, { interval: 'normal' })
      raiseWakeRegistered = true
    }
  }

  function markActive(reason) {
    if (!started) return currentMode
    var snapshot = machine.markActive(reason || 'activity', Date.now())
    if (snapshot.mode !== currentMode) applyMode(snapshot.mode, reason || 'activity')
    return currentMode
  }

  function start() {
    if (started) return
    started = true
    machine = stateMachine.create(Date.now())
    currentMode = stateMachine.MODE_ACTIVE
    latestHeartSample = heartRate.getSnapshot()
    applyMode(stateMachine.MODE_ACTIVE, 'start')
    onTime(Date.now())
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
    if (raiseWakeRegistered) motion.unsubscribe(handleRaiseWake)
    raiseWakeRegistered = false
    stopHealth()
    // Leaving the watchface restores the user-selected active brightness and
    // releases keep-screen-on exactly like the previous clock behavior.
    displayPower.setBrightness(activeBrightnessValue)
    displayPower.setKeepScreenOn(true)
    currentMode = stateMachine.MODE_ACTIVE
  }

  function configure(next) {
    var value = next || {}
    var brightnessChanged = false
    if (value.lowPowerEnabled !== undefined) lowPowerEnabled = value.lowPowerEnabled !== false
    if (value.raiseWakeEnabled !== undefined) raiseWakeEnabled = value.raiseWakeEnabled !== false
    if (typeof value.activeBrightnessValue === 'number' && value.activeBrightnessValue !== activeBrightnessValue) {
      activeBrightnessValue = value.activeBrightnessValue
      brightnessChanged = true
    }

    if (!started) return
    reconcileRaiseWake()
    reconcileIdleTimer()
    if (!lowPowerEnabled) {
      machine.markActive('low-power-disabled', Date.now())
      applyMode(stateMachine.MODE_ACTIVE, 'low-power-disabled')
    } else {
      evaluateIdle()
      if (brightnessChanged && currentMode === stateMachine.MODE_ACTIVE) applyDisplay(stateMachine.MODE_ACTIVE)
    }
  }

  return {
    start: start,
    stop: stop,
    configure: configure,
    markActive: markActive,
    forceMode: function (mode, reason) {
      machine.force(mode, reason || 'force', Date.now())
      return applyMode(mode, reason || 'force')
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
        raiseWakeActive: raiseWakeRegistered && motion.isActive()
      }
    }
  }
}

module.exports = {
  create: create
}
