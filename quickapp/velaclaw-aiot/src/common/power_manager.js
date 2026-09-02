import displayPower from '../capabilities/display_power'
import motion from '../capabilities/motion'

var MODE_ACTIVE = 'ACTIVE'
var MODE_DIM = 'DIM'
var MODE_SLEEP = 'SLEEP'

var MODE_CONFIG = {
  ACTIVE: {
    label: '亮屏',
    hint: '1秒刷新',
    color: '#30D158',
    brightness: 210,
    keepScreenOn: true,
    timeInterval: 1000,
    heartInterval: 3000,
    batteryInterval: 60000
  },
  DIM: {
    label: '暗屏',
    hint: '5秒刷新',
    color: '#FFD60A',
    brightness: 60,
    keepScreenOn: true,
    timeInterval: 5000,
    heartInterval: 30000,
    batteryInterval: 120000
  },
  SLEEP: {
    label: '息屏',
    hint: '低频保活',
    color: '#8E8E93',
    brightness: 8,
    keepScreenOn: false,
    timeInterval: 60000,
    heartInterval: 0,
    batteryInterval: 0
  }
}

var DIM_AFTER_MS = 8000
var SLEEP_AFTER_MS = 15000
var raiseWakeCallback = null
var lastAcceleration = null
var lastWakeAt = 0
var lastHandleTime = 0

function getConfig(mode) {
  return MODE_CONFIG[mode] || MODE_CONFIG.ACTIVE
}

function handleAcceleration(data) {
  if (!raiseWakeCallback || !data) return

  var now = Date.now()
  if (now - lastHandleTime < 100) return
  lastHandleTime = now

  var current = {
    x: data.x || 0,
    y: data.y || 0,
    z: data.z || 0
  }

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
  MODE_ACTIVE: MODE_ACTIVE,
  MODE_DIM: MODE_DIM,
  MODE_SLEEP: MODE_SLEEP,

  getModeByIdle: function (idleMs) {
    if (idleMs >= SLEEP_AFTER_MS) return MODE_SLEEP
    if (idleMs >= DIM_AFTER_MS) return MODE_DIM
    return MODE_ACTIVE
  },

  getRefreshConfig: function (mode) {
    return getConfig(mode)
  },

  getUiState: function (mode) {
    var config = getConfig(mode)
    return {
      label: config.label,
      hint: config.hint,
      color: config.color,
      sleepVisible: mode === MODE_SLEEP,
      dimVisible: mode === MODE_DIM
    }
  },

  applyMode: function (mode, activeBrightnessValue) {
    var config = getConfig(mode)
    var brightnessValue = config.brightness
    if (mode === MODE_ACTIVE && typeof activeBrightnessValue === 'number') brightnessValue = activeBrightnessValue
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
