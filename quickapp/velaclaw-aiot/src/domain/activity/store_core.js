var dayWindow = require('../calendar/day_window')

var DEFAULT_STATE = {
  steps: 0,
  stepsGoal: 6000,
  calories: 0,
  caloriesGoal: 300,
  standHours: 0,
  standGoal: 12
}

function copyState(source) {
  return {
    steps: source.steps,
    stepsGoal: source.stepsGoal,
    calories: source.calories,
    caloriesGoal: source.caloriesGoal,
    standHours: source.standHours,
    standGoal: source.standGoal
  }
}

function resetForNextDay(source, base) {
  var previous = source || base
  return {
    steps: 0,
    stepsGoal: previous.stepsGoal || base.stepsGoal,
    calories: 0,
    caloriesGoal: previous.caloriesGoal || base.caloriesGoal,
    standHours: 0,
    standGoal: previous.standGoal || base.standGoal
  }
}

function clampPercent(value, goal) {
  var percent = Math.round((value / goal) * 100)
  if (percent < 0) return 0
  if (percent > 100) return 100
  return percent
}

function healthyReadResult(value) {
  return { ok: true, status: value === null || value === undefined ? 'missing' : 'ok', error: null }
}

function blockedResult(status, error) {
  var reason = error || new Error('Activity persistence is blocked: ' + status)
  reason.code = reason.code || 'ESTORAGE_RECOVERY_REQUIRED'
  return { persisted: false, memoryOnly: true, error: reason }
}

function createStore(repository, defaults, options) {
  var base = defaults ? copyState(defaults) : copyState(DEFAULT_STATE)
  var state = copyState(base)
  var dayKey = options && typeof options.dayKey === 'function' ? options.dayKey : function () { return dayWindow.dateKey(new Date()) }
  var activeDay = dayKey()
  var hydrated = false
  var loading = false
  var hydrateWaiters = []
  var pendingMutations = []
  var saveQueue = []
  var saveInFlight = false
  var listeners = []
  var persistenceStatus = 'loading'
  var persistenceError = null

  function rawSnapshot() {
    var stepsPercent = clampPercent(state.steps, state.stepsGoal)
    var goalPercent = Math.round((
      stepsPercent +
      clampPercent(state.calories, state.caloriesGoal) +
      clampPercent(state.standHours, state.standGoal)
    ) / 3)
    return {
      steps: state.steps,
      stepsGoal: state.stepsGoal,
      calories: state.calories,
      caloriesGoal: state.caloriesGoal,
      standHours: state.standHours,
      standGoal: state.standGoal,
      stepsPercent: stepsPercent,
      goalPercent: goalPercent
    }
  }

  function persistenceSnapshot() {
    return {
      status: persistenceStatus,
      blocked: persistenceStatus === 'corrupt' || persistenceStatus === 'io-error' || persistenceStatus === 'recovering',
      recoverable: persistenceStatus === 'corrupt',
      errorCode: persistenceError && persistenceError.code !== undefined ? String(persistenceError.code) : '',
      errorMessage: persistenceError && persistenceError.message ? persistenceError.message : ''
    }
  }

  function markPersistence(result) {
    var next = result || healthyReadResult(null)
    persistenceStatus = next.status || (next.ok ? 'ok' : 'io-error')
    persistenceError = next.error || null
  }

  function persistenceBlocked() {
    return persistenceSnapshot().blocked
  }

  function rolloverIfNeeded() {
    if (!hydrated) return false
    var currentDay = dayKey()
    if (currentDay === activeDay) return false
    state = resetForNextDay(state, base)
    activeDay = currentDay
    return true
  }

  function snapshot() {
    rolloverIfNeeded()
    return rawSnapshot()
  }

  function publish() {
    var value = rawSnapshot()
    var current = listeners.slice()
    for (var i = 0; i < current.length; i++) current[i](value)
    return value
  }

  function applyPersisted(persisted) {
    state = persisted ? copyState(persisted) : copyState(base)
  }

  function applyAdd(steps, calories) {
    state.steps += steps
    state.calories += calories
    return rawSnapshot()
  }

  function flushSaveQueue() {
    if (saveInFlight || !saveQueue.length) return
    saveInFlight = true
    var entry = saveQueue.shift()
    repository.save(entry.snapshot, function (saved, result) {
      saveInFlight = false
      if (entry.callback) entry.callback(saved, result)
      flushSaveQueue()
    }, entry.day)
  }

  function enqueueSave(value, callback, day) {
    if (persistenceBlocked()) {
      if (callback) callback(value, blockedResult(persistenceStatus, persistenceError))
      return
    }
    saveQueue.push({ snapshot: value, callback: callback, day: day || activeDay })
    flushSaveQueue()
  }

  function applyPendingForDay(day) {
    var remaining = []
    for (var i = 0; i < pendingMutations.length; i++) {
      var mutation = pendingMutations[i]
      if (mutation.day === day) enqueueSave(applyAdd(mutation.steps, mutation.calories), mutation.callback, day)
      else remaining.push(mutation)
    }
    pendingMutations = remaining
  }

  function finishHydrate(persisted, loadDay, readState) {
    markPersistence(readState || healthyReadResult(persisted))
    applyPersisted(readState && !readState.ok ? null : persisted)
    activeDay = loadDay
    hydrated = true
    loading = false
    applyPendingForDay(loadDay)

    var currentDay = dayKey()
    if (currentDay !== activeDay) {
      state = resetForNextDay(state, base)
      activeDay = currentDay
      applyPendingForDay(currentDay)
    }

    var value = publish()
    var waiters = hydrateWaiters
    hydrateWaiters = []
    for (var i = 0; i < waiters.length; i++) waiters[i](value, persistenceSnapshot())
  }

  function startHydrate() {
    if (hydrated || loading) return
    loading = true
    var loadDay = activeDay
    if (repository && typeof repository.loadResult === 'function') {
      repository.loadResult(function (persisted, result) { finishHydrate(persisted, loadDay, result) }, loadDay)
      return
    }
    repository.load(function (persisted) { finishHydrate(persisted, loadDay, healthyReadResult(persisted)) }, loadDay)
  }

  function saveRecoveredDefaults(quarantineResult, callback) {
    state = copyState(base)
    activeDay = dayKey()
    publish()
    repository.save(rawSnapshot(), function (saved, result) {
      var persisted = result === true || !!(result && result.persisted)
      if (persisted) {
        markPersistence({ ok: true, status: 'ok', error: null })
        if (callback) callback({ ok: true, status: 'recovered', backupKey: quarantineResult.backupKey || '', error: null })
        return
      }
      var error = result && result.error ? result.error : new Error('Activity recovery reset write failed')
      markPersistence({ ok: false, status: 'io-error', error: error })
      if (callback) callback({ ok: false, status: 'io-error', backupKey: quarantineResult.backupKey || '', error: error })
    }, activeDay)
  }

  return {
    getSnapshot: snapshot,
    getPersistenceState: persistenceSnapshot,
    subscribe: function (listener) {
      if (typeof listener !== 'function' || listeners.indexOf(listener) >= 0) return
      listeners.push(listener)
    },
    unsubscribe: function (listener) {
      var index = listeners.indexOf(listener)
      if (index >= 0) listeners.splice(index, 1)
    },
    hydrate: function (callback) {
      if (hydrated) {
        rolloverIfNeeded()
        if (callback) callback(rawSnapshot(), persistenceSnapshot())
        return
      }
      if (callback) hydrateWaiters.push(callback)
      startHydrate()
    },
    addAndPersist: function (steps, calories, callback) {
      var mutationDay = dayKey()
      if (!hydrated) {
        pendingMutations.push({ steps: steps, calories: calories, callback: callback, day: mutationDay })
        startHydrate()
        return
      }
      rolloverIfNeeded()
      var value = applyAdd(steps, calories)
      publish()
      enqueueSave(value, callback, activeDay)
    },
    recoverPersistence: function (callback) {
      if (persistenceStatus !== 'corrupt') {
        if (callback) callback({ ok: false, status: 'not-recoverable', backupKey: '', error: persistenceError })
        return
      }
      if (!repository || typeof repository.quarantine !== 'function') {
        if (callback) callback({ ok: false, status: 'unavailable', backupKey: '', error: new Error('Activity quarantine unavailable') })
        return
      }
      persistenceStatus = 'recovering'
      repository.quarantine(function (result) {
        if (!result || !result.ok) {
          var error = result && result.error ? result.error : new Error('Activity quarantine failed')
          markPersistence({ ok: false, status: 'corrupt', error: error })
          if (callback) callback({ ok: false, status: result && result.status ? result.status : 'io-error', backupKey: result && result.backupKey ? result.backupKey : '', error: error })
          return
        }
        saveRecoveredDefaults(result, callback)
      })
    }
  }
}

module.exports = {
  DEFAULT_STATE: DEFAULT_STATE,
  createStore: createStore
}
