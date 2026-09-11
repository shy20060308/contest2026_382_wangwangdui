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

  function finishHydrate(persisted, loadDay) {
    applyPersisted(persisted)
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
    for (var i = 0; i < waiters.length; i++) waiters[i](value)
  }

  function startHydrate() {
    if (hydrated || loading) return
    loading = true
    var loadDay = activeDay
    repository.load(function (persisted) { finishHydrate(persisted, loadDay) }, loadDay)
  }

  return {
    getSnapshot: snapshot,
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
        if (callback) callback(rawSnapshot())
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
    }
  }
}

module.exports = {
  DEFAULT_STATE: DEFAULT_STATE,
  createStore: createStore
}
