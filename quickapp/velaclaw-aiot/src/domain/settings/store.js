import storage from '../../capabilities/storage'

var KEY = 'device_settings_v1'
var cached = {
  bluetoothConnected: false,
  lastSyncText: '未同步',
  vibrationEnabled: true,
  vibrationLevel: 'medium',
  vibrationPattern: 'goal',
  brightnessValue: 140,
  autoBrightness: false,
  raiseWakeEnabled: true,
  lowPowerEnabled: true
}
var loading = false
var pending = {}

function clampBrightness(value) {
  var number = Number(value)
  if (!isFinite(number)) number = 140
  return Math.max(0, Math.min(255, Math.round(number)))
}

function pattern(value) {
  return value === 'tap' || value === 'goal' || value === 'countdown' || value === 'alert' ? value : 'goal'
}

function normalize(source) {
  var value = source || {}
  return {
    bluetoothConnected: !!value.bluetoothConnected,
    lastSyncText: value.lastSyncText || '未同步',
    vibrationEnabled: value.vibrationEnabled !== false,
    vibrationLevel: value.vibrationLevel === 'light' || value.vibrationLevel === 'strong' ? value.vibrationLevel : 'medium',
    vibrationPattern: pattern(value.vibrationPattern),
    brightnessValue: clampBrightness(value.brightnessValue),
    autoBrightness: !!value.autoBrightness,
    raiseWakeEnabled: value.raiseWakeEnabled !== false,
    lowPowerEnabled: value.lowPowerEnabled !== false
  }
}

function clone() { return normalize(cached) }

function merge(stored) {
  var next = clone()
  var source = stored || {}
  for (var key in next) if (source[key] !== undefined) next[key] = source[key]
  return normalize(next)
}

function persist(callback) {
  storage.set(KEY, cached, function (result) { if (callback) callback(clone(), result) })
}

export default {
  load: function (callback) {
    loading = true
    storage.getJSON(KEY, function (stored) {
      cached = merge(stored)
      for (var key in pending) cached[key] = pending[key]
      cached = normalize(cached)
      pending = {}
      loading = false
      if (callback) callback(clone())
    }, null)
  },
  getSnapshot: clone,
  update: function (key, value, callback) {
    var next = clone()
    next[key] = value
    cached = normalize(next)
    if (loading) pending[key] = cached[key]
    persist(callback)
    return clone()
  },
  updateMany: function (patch, callback) {
    var next = clone()
    var source = patch || {}
    for (var key in source) next[key] = source[key]
    cached = normalize(next)
    if (loading) for (var pendingKey in source) pending[pendingKey] = cached[pendingKey]
    persist(callback)
    return clone()
  },
  brightness: clampBrightness,
  vibrationLevelText: function (level) { return level === 'light' ? '轻' : level === 'strong' ? '强' : '中' },
  vibrationPatternText: function (name) { return name === 'tap' ? '轻触' : name === 'countdown' ? '倒计时' : name === 'alert' ? '警报' : '达标' },
  syncTimeText: function () {
    var d = new Date()
    var h = d.getHours() < 10 ? '0' + d.getHours() : '' + d.getHours()
    var m = d.getMinutes() < 10 ? '0' + d.getMinutes() : '' + d.getMinutes()
    return h + ':' + m
  }
}
