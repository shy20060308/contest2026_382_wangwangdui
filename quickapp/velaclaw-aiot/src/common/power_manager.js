import displayPower from '../capabilities/display_power'
import motion from '../capabilities/motion'
import powerState from '../domain/power/state_machine'
import powerPolicy from '../domain/power/policy'
import powerMapper from '../presentation/mappers/power'

var raiseWakeCallback = null
var lastAcceleration = null
var lastWakeAt = 0
var lastHandleTime = 0

function handleAcceleration(data) {
  if (!raiseWakeCallback || !data) return
  var now = Date.now()
  if (now - lastHandleTime < 100) return
  lastHandleTime = now

  var current = { x: data.x || 0, y: data.y || 0, z: data.z || 0 }
  if (lastAcceleration) {
    var delta = Math.abs(current.x - lastAcceleration.x) + Math.abs(current.y - lastAcceleration.y) + Math.abs(current.z - lastAcceleration.z)
    if (delta > 5 && now - lastWakeAt > 3000) {
      lastWakeAt = now
      raiseWakeCallback()
    }
  }
  lastAcceleration = current
}

export default {
  MODE_ACTIVE: powerState.MODE_ACTIVE,
  MODE_DIM: powerState.MODE_DIM,
  MODE_SLEEP: powerState.MODE_SLEEP,

  getModeByIdle: function (idleMs) {
    return powerState.modeForIdle(idleMs)
  },

  getRefreshConfig: function (mode) {
    return powerPolicy.get(mode)
  },

  getUiState: function (mode) {
    return powerMapper.map(mode)
  },

  applyMode: function (mode, activeBrightnessValue) {
    var config = powerPolicy.get(mode)
    var brightnessValue = config.brightness
    if (mode === powerState.MODE_ACTIVE && typeof activeBrightnessValue === 'number') brightnessValue = activeBrightnessValue
    displayPower.setBrightness(brightnessValue)
    displayPower.setKeepScreenOn(config.keepScreenOn)
  },

  startRaiseWake: function (callback) {
    raiseWakeCallback = callback
    lastAcceleration = null
    return motion.subscribe(handleAcceleration)
  },

  stopRaiseWake: function () {
    raiseWakeCallback = null
    lastAcceleration = null
    motion.unsubscribe(handleAcceleration)
    return true
  }
}
