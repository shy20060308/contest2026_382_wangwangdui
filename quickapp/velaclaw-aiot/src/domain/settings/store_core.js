var hapticPatterns = require('../haptics/patterns')

var KEY = 'device_settings_v4'
var DEFAULTS = {
  lastSyncAt: 0,
  vibrationEnabled: true,
  vibrationLevel: 'medium',
  vibrationPattern: 'goal',
  brightnessValue: 140,
  autoBrightness: false,
  raiseWakeEnabled: true,
  lowPowerEnabled: false
}
function copy(source) { var result = {}; for (var key in source) result[key] = source[key]; return result }
function requireKey(key) { if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) throw new Error('Unknown setting: ' + key); return key }
function canonicalValue(key, value) {
  requireKey(key)
  if (key === 'lastSyncAt') { if (typeof value !== 'number' || !isFinite(value) || value < 0) throw new Error('Invalid setting value: ' + key); return Math.round(value) }
  if (key === 'brightnessValue') { if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > 255) throw new Error('Invalid setting value: ' + key); return Math.round(value) }
  if (key === 'vibrationLevel') { if (value !== 'light' && value !== 'medium' && value !== 'strong') throw new Error('Invalid setting value: ' + key); return value }
  if (key === 'vibrationPattern') { hapticPatterns.get(value, 'medium'); return value }
  if (typeof value !== 'boolean') throw new Error('Invalid setting value: ' + key)
  return value
}
function mergeStored(stored) {
  if (stored === null || stored === undefined) return copy(DEFAULTS)
  if (typeof stored !== 'object' || Array.isArray(stored)) throw new Error('Invalid stored Settings state')
  var next = {}; for (var storedKey in stored) requireKey(storedKey)
  for (var key in DEFAULTS) { if (!Object.prototype.hasOwnProperty.call(stored, key)) throw new Error('Incomplete stored Settings state: ' + key); next[key] = canonicalValue(key, stored[key]) }
  return next
}
function validatedPatch(patch) { if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Settings updateMany requires a patch object'); var next = {}; for (var key in patch) { var setting = requireKey(key); next[setting] = canonicalValue(setting, patch[key]) } return next }
function healthyReadResult(value) { return { ok: true, status: value === null || value === undefined ? 'missing' : 'ok', error: null } }
function blockedResult(status, error) { var reason = error || new Error('Settings persistence is blocked: ' + status); reason.code = reason.code || 'ESTORAGE_RECOVERY_REQUIRED'; return { persisted: false, memoryOnly: true, error: reason } }
function createStore(storage) {
  var cached = copy(DEFAULTS), loaded = false, loading = false, pending = {}, loadWaiters = [], writeInFlight = false, writeQueued = false, persistWaiters = []
  var persistenceStatus = 'loading', persistenceError = null
  function clone() { return copy(cached) }
  function persistenceSnapshot() { return { status: persistenceStatus, blocked: persistenceStatus === 'corrupt' || persistenceStatus === 'io-error' || persistenceStatus === 'recovering', recoverable: persistenceStatus === 'corrupt', errorCode: persistenceError && persistenceError.code !== undefined ? String(persistenceError.code) : '', errorMessage: persistenceError && persistenceError.message ? persistenceError.message : '' } }
  function markPersistence(result) { var next = result || healthyReadResult(null); persistenceStatus = next.status || (next.ok ? 'ok' : 'io-error'); persistenceError = next.error || null }
  function drainPersistWaiters(result) { var waiters = persistWaiters; persistWaiters = []; var value = clone(); for (var i = 0; i < waiters.length; i++) waiters[i](value, result) }
  function flushPersist() {
    if (!loaded || loading || writeInFlight || !writeQueued) return
    if (persistenceSnapshot().blocked) { writeQueued = false; drainPersistWaiters(blockedResult(persistenceStatus, persistenceError)); return }
    writeQueued = false; writeInFlight = true; var snapshot = clone()
    storage.set(KEY, snapshot, function (result) {
      writeInFlight = false
      if (writeQueued) { flushPersist(); return }
      drainPersistWaiters(result)
    })
  }
  function finishLoad(stored, readState) {
    var state = readState || healthyReadResult(stored)
    if (!state.ok) {
      cached = copy(DEFAULTS)
      markPersistence(state)
    } else {
      try {
        cached = mergeStored(stored)
        markPersistence(state)
      } catch (error) {
        cached = copy(DEFAULTS)
        markPersistence({ ok: false, status: 'corrupt', error: error })
      }
    }
    for (var key in pending) cached[key] = pending[key]
    pending = {}; loaded = true; loading = false
    var waiters = loadWaiters; loadWaiters = []; var value = clone(); var persistence = persistenceSnapshot(); for (var i = 0; i < waiters.length; i++) waiters[i](value, persistence)
    flushPersist()
  }
  function startLoad() {
    if (loading || loaded) return
    loading = true
    if (storage && typeof storage.getJSONResult === 'function') {
      storage.getJSONResult(KEY, function (value, result) { finishLoad(value, result) }, null)
      return
    }
    storage.getJSON(KEY, function (value) { finishLoad(value, healthyReadResult(value)) }, null)
  }
  function persist(callback) { if (typeof callback === 'function') persistWaiters.push(callback); writeQueued = true; if (!loaded) startLoad(); flushPersist() }
  function rememberPending(key, value) { if (!loaded) pending[key] = value }
  function finishRecovery(quarantineResult, callback) {
    cached = copy(DEFAULTS); pending = {}; writeQueued = false; writeInFlight = false
    storage.set(KEY, clone(), function (result) {
      var persisted = result === true || !!(result && result.persisted)
      if (persisted) {
        markPersistence({ ok: true, status: 'ok', error: null })
        if (callback) callback({ ok: true, status: 'recovered', backupKey: quarantineResult.backupKey || '', error: null })
        return
      }
      var error = result && result.error ? result.error : new Error('Settings recovery reset write failed')
      markPersistence({ ok: false, status: 'io-error', error: error })
      if (callback) callback({ ok: false, status: 'io-error', backupKey: quarantineResult.backupKey || '', error: error })
    })
  }
  return {
    load: function (callback) { if (loaded && !loading) { if (callback) callback(clone(), persistenceSnapshot()); return } if (callback) loadWaiters.push(callback); startLoad() },
    getSnapshot: clone,
    getPersistenceState: persistenceSnapshot,
    update: function (key, value, callback) { var setting = requireKey(key); cached[setting] = canonicalValue(setting, value); rememberPending(setting, cached[setting]); persist(callback); return clone() },
    updateMany: function (patch, callback) { var next = validatedPatch(patch); for (var key in next) { cached[key] = next[key]; rememberPending(key, cached[key]) } persist(callback); return clone() },
    recoverPersistence: function (callback) {
      if (persistenceStatus !== 'corrupt') { if (callback) callback({ ok: false, status: 'not-recoverable', backupKey: '', error: persistenceError }); return }
      if (!storage || typeof storage.quarantine !== 'function') { if (callback) callback({ ok: false, status: 'unavailable', backupKey: '', error: new Error('Settings quarantine unavailable') }); return }
      persistenceStatus = 'recovering'
      storage.quarantine(KEY, function (result) {
        if (!result || !result.ok) {
          var error = result && result.error ? result.error : new Error('Settings quarantine failed')
          markPersistence({ ok: false, status: 'corrupt', error: error })
          if (callback) callback({ ok: false, status: result && result.status ? result.status : 'io-error', backupKey: result && result.backupKey ? result.backupKey : '', error: error })
          return
        }
        finishRecovery(result, callback)
      })
    }
  }
}
module.exports = { KEY: KEY, DEFAULTS: DEFAULTS, createStore: createStore }
