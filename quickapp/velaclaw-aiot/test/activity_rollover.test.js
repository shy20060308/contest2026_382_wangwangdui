const assert = require('assert')
const core = require('../src/domain/activity/store_core')

function fakeRepository() {
  const loads = []
  const saves = []
  return {
    loads: loads,
    saves: saves,
    load: function (callback, day) { loads.push({ callback: callback, day: day }) },
    save: function (snapshot, callback, day) {
      saves.push({ snapshot: JSON.parse(JSON.stringify(snapshot)), callback: callback, day: day, resolved: false })
    },
    resolveLoad: function (value) {
      const entry = loads.shift()
      assert.ok(entry, 'expected pending activity load')
      entry.callback(value)
      return entry
    },
    resolveSave: function () {
      const entry = saves.find(function (item) { return !item.resolved })
      assert.ok(entry, 'expected pending activity save')
      entry.resolved = true
      entry.callback(JSON.parse(JSON.stringify(entry.snapshot)), { persisted: true })
      return entry
    }
  }
}

let day = '2026-09-11'
const repo = fakeRepository()
const store = core.createStore(repo, null, { dayKey: function () { return day } })
store.hydrate(function () {})
assert.strictEqual(repo.loads[0].day, '2026-09-11')
repo.resolveLoad({ steps: 5000, calories: 200, standHours: 8, stepsGoal: 7000, caloriesGoal: 350, standGoal: 10 })

store.addAndPersist(100, 10, function () {})
assert.strictEqual(repo.saves.length, 1)
assert.strictEqual(repo.saves[0].day, '2026-09-11')
assert.strictEqual(repo.saves[0].snapshot.steps, 5100)

day = '2026-09-12'
const rolled = store.getSnapshot()
assert.strictEqual(rolled.steps, 0, 'F04: next calendar day must not inherit yesterday steps')
assert.strictEqual(rolled.calories, 0, 'F04: next calendar day must not inherit yesterday calories')
assert.strictEqual(rolled.standHours, 0, 'F04: next calendar day must not inherit yesterday stand hours')
assert.strictEqual(rolled.stepsGoal, 7000, 'day rollover must preserve configured goals')
assert.strictEqual(rolled.caloriesGoal, 350)
assert.strictEqual(rolled.standGoal, 10)

store.addAndPersist(25, 5, function () {})
assert.strictEqual(store.getSnapshot().steps, 25)
assert.strictEqual(repo.saves.length, 1, 'old-day save remains the only in-flight write')
repo.resolveSave()
assert.strictEqual(repo.saves.length, 2, 'new-day save must wait behind the old-day write')
assert.strictEqual(repo.saves[1].day, '2026-09-12', 'queued snapshot must retain the day captured by the Store')
assert.strictEqual(repo.saves[1].snapshot.steps, 25, 'new day persistence must contain only new-day activity')
repo.resolveSave()

let loadingDay = '2026-09-11'
const delayedRepo = fakeRepository()
const delayedStore = core.createStore(delayedRepo, null, { dayKey: function () { return loadingDay } })
delayedStore.addAndPersist(100, 10, function () {})
assert.strictEqual(delayedRepo.loads[0].day, '2026-09-11')
loadingDay = '2026-09-12'
delayedStore.addAndPersist(20, 2, function () {})
delayedRepo.resolveLoad({ steps: 900, calories: 90, standHours: 4, stepsGoal: 6000, caloriesGoal: 300, standGoal: 12 })
assert.strictEqual(delayedStore.getSnapshot().steps, 20, 'hydrate crossing midnight must expose only current-day pending mutations')
assert.strictEqual(delayedRepo.saves[0].day, '2026-09-11')
assert.strictEqual(delayedRepo.saves[0].snapshot.steps, 1000, 'pre-midnight mutation must finish against the loaded old-day total')
delayedRepo.resolveSave()
assert.strictEqual(delayedRepo.saves[1].day, '2026-09-12')
assert.strictEqual(delayedRepo.saves[1].snapshot.steps, 20, 'post-midnight mutation must be persisted as the new day')

console.log('Activity calendar rollover verified: counters reset per natural day while queued writes retain explicit day ownership')
