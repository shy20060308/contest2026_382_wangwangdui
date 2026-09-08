var hapticPatterns = require('../haptics/patterns')

var KEY = 'device_settings_v3'

var DEFAULTS = {
  lastSyncAt: 0,
  vibrationEnabled: true,
  vibrationLevel: 'medium',
  vibrationPattern: 'goal',
  brightnessValue: 140,
  autoBrightness: false,
  raiseWakeEnabled: true,
  lowPowerEnabled: true
}

function copy(source) {
  var result = {}
  for (var key in source) result[key] = source[key]
  return result
}

function requireKey(key) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) throw new Error('Unknown setting: ' + key)
  return key
}

function canonicalValue(key, value) {
  requireKey(key)
  if (key === 'lastSyncAt') {
    var timestamp = Number(value)
    if (!isFinite(timestamp) || timestamp < 0) throw new Error('Invalid setting value: ' + key)
    return Math.round(timestamp)
  }
  if (key === 'brightnessValue') {
    var brightness = Number(value)
    if (!isFinite(brightness)) throw new Error('Invalid setting value: ' + key)
    return Math.max(0, Math.min(255, Math.round(brightness)))
  }
  if (key === 'vibrationLevel') {
    if (value !== 'light' && value !== 'medium' && value !== 'strong') throw new Error('Invalid setting value: ' + key)
    return value
  }
  if (key === 'vibrationPattern') {
    hapticPatterns.get(value, 'medium')
    return value
  }
  if (typeof value !== 'boolean') throw new Error('Invalid setting value: ' + key)
  return value
}

function mergeStored(stored) {
  var next = copy(DEFAULTS)
  if (!stored) return next
  for (var key in stored) next[requireKey(key)] = canonicalValue(key, stored[key])
  return next
}

function createStore(storage) {
  var cached = copy(DEFAULTS)
  var loaded = false
  var loading = false
  var pending = {}
  var loadWaiters = []
  var writeInFlight = false
  var writeQueued = false
  var persistWaiters = []

  function clone() { return copy(cached) }

  function flushPersist() {
    if (!loaded || loading || writeInFlight || !writeQueued) return
    writeQueued = false
    writeInFlight = true
    var snapshot = clone()
    storage.set(KEY, snapshot, function (result) {
      writeInFlight = false
      if (writeQueued) {
        flushPersist()
        return
      }
      var waiters = persistWaiters
      persistWaiters = []
      var value = clone()
      for (var i = 0; i < waiters.length; i++) waiters[i](value, result)
    })
  }

  function finishLoad(stored) {
    cached = mergeStored(stored)
    for (var key in pending) cached[key] = pending[key]
    pending = {}
    loaded = true
    loading = false

    var waiters = loadWaiters
    loadWaiters = []
    var value = clone()
    for (var i = 0; i < waiters.length; i++) waiters[i](value)
    flushPersist()
  }

  function startLoad() {
    if (loading || loaded) return
    loading = true
    storage.getJSON(KEY, finishLoad, null)
  }

  function persist(callback) {
    if (typeof callback === 'function') persistWaiters.push(callback)
    writeQueued = true
    if (!loaded) startLoad()
    flushPersist()
  }

  function rememberPending(key, value) {
    if (!loaded) pending[key] = value
  }

  return {
    load: function (callback) {
      if (loaded && !loading) {
        if (callback) callback(clone())
        return
      }
      if (callback) loadWaiters.push(callback)
      startLoad()
    },
    getSnapshot: clone,
    update: function (key, value, callback) {
      var setting = requireKey(key)
      cached[setting] = canonicalValue(setting, value)
      rememberPending(setting, cached[setting])
      persist(callback)
      return clone()
    },
    updateMany: function (patch, callback) {
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Settings updateMany requires a patch object')
      for (var key in patch) {
        var setting = requireKey(key)
        cached[setting] = canonicalValue(setting, patch[key])
        rememberPending(setting, cached[setting])
      }
      persist(callback)
      return clone()
    }
  }
}

module.exports = {
  KEY: KEY,
  DEFAULTS: DEFAULTS,
  createStore: createStore
}
