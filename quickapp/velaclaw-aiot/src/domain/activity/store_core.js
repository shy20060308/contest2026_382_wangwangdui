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

function clampPercent(value, goal) {
  var percent = Math.round((value / goal) * 100)
  if (percent < 0) return 0
  if (percent > 100) return 100
  return percent
}

function createStore(repository, defaults) {
  var base = defaults ? copyState(defaults) : copyState(DEFAULT_STATE)
  var state = copyState(base)
  var hydrated = false
  var loading = false
  var hydrateWaiters = []
  var pendingMutations = []
  var saveQueue = []
  var saveInFlight = false

  function snapshot() {
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

  function applyPersisted(persisted) {
    state = persisted ? copyState(persisted) : copyState(base)
  }

  function applyAdd(steps, calories) {
    state.steps += steps
    state.calories += calories
    return snapshot()
  }

  function flushSaveQueue() {
    if (saveInFlight || !saveQueue.length) return
    saveInFlight = true
    var entry = saveQueue.shift()
    repository.save(entry.snapshot, function (saved, result) {
      saveInFlight = false
      if (entry.callback) entry.callback(saved, result)
      flushSaveQueue()
    })
  }

  function enqueueSave(value, callback) {
    saveQueue.push({ snapshot: value, callback: callback })
    flushSaveQueue()
  }

  function applyPendingMutations() {
    var mutations = pendingMutations
    pendingMutations = []
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i]
      enqueueSave(applyAdd(mutation.steps, mutation.calories), mutation.callback)
    }
  }

  function finishHydrate(persisted) {
    applyPersisted(persisted)
    hydrated = true
    loading = false
    applyPendingMutations()
    var waiters = hydrateWaiters
    hydrateWaiters = []
    var value = snapshot()
    for (var i = 0; i < waiters.length; i++) waiters[i](value)
  }

  function startHydrate() {
    if (hydrated || loading) return
    loading = true
    repository.load(finishHydrate)
  }

  return {
    getSnapshot: snapshot,
    hydrate: function (callback) {
      if (hydrated) {
        if (callback) callback(snapshot())
        return
      }
      if (callback) hydrateWaiters.push(callback)
      startHydrate()
    },
    addAndPersist: function (steps, calories, callback) {
      if (!hydrated) {
        pendingMutations.push({ steps: steps, calories: calories, callback: callback })
        startHydrate()
        return
      }
      enqueueSave(applyAdd(steps, calories), callback)
    }
  }
}

module.exports = {
  DEFAULT_STATE: DEFAULT_STATE,
  createStore: createStore
}
