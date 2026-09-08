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
    if (typeof value !== 'number' || !isFinite(value) || value < 0) throw new Error('Invalid setting value: ' + key)
    return Math.round(value)
  }
  if (key === 'brightnessValue') {
    if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > 255) throw new Error('Invalid setting value: ' + key)
    return Math.round(value)
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
  if (typeof stored !== 'object' || Array.isArray(stored)) throw new Error('Invalid stored Settings state')
  for (var key in stored) next[requireKey(key)] = canonicalValue(key, stored[key])
  return next
}

function validatedPatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Settings updateMany requires a patch object')
  var next = {}
  for (var key in patch) {
    var setting = requireKey(key)
    next[setting] = canonicalValue(setting, patch[key])
  }
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
      var next = validatedPatch(patch)
      for (var key in next) {
        cached[key] = next[key]
        rememberPending(key, next[key])
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
