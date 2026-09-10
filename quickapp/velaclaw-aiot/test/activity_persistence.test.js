const fs = require('fs')
const path = require('path')
const assert = require('assert')
const core = require('../src/domain/activity/store_core')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

let passed = 0
function test(name, callback) { callback(); passed++; console.log('通过 - ' + name) }

function fakeRepository() {
  const loads = []
  const saves = []
  return {
    loads: loads,
    saves: saves,
    load: function (callback) { loads.push(callback) },
    save: function (snapshot, callback) { saves.push({ snapshot: JSON.parse(JSON.stringify(snapshot)), callback: callback, resolved: false }) },
    resolveLoad: function (value) {
      const callback = loads.shift()
      assert.ok(callback, 'expected pending activity load')
      callback(value)
    },
    resolveSave: function () {
      const entry = saves.find(function (item) { return !item.resolved })
      assert.ok(entry, 'expected pending activity save')
      entry.resolved = true
      entry.callback(JSON.parse(JSON.stringify(entry.snapshot)), true)
    }
  }
}

test('首次启动没有持久记录时当前活动值必须为零', function () {
  const repo = fakeRepository()
  const store = core.createStore(repo)
  const initial = store.getSnapshot()
  assert.strictEqual(initial.steps, 0)
  assert.strictEqual(initial.calories, 0)
  assert.strictEqual(initial.standHours, 0)
  assert.strictEqual(initial.stepsGoal, 6000)
  assert.strictEqual(initial.caloriesGoal, 300)
  assert.strictEqual(initial.standGoal, 12)
})

test('并发 hydrate 合并为一次异步持久化读取', function () {
  const repo = fakeRepository()
  const store = core.createStore(repo)
  let first = null, second = null
  store.hydrate(function (value) { first = value })
  store.hydrate(function (value) { second = value })
  assert.strictEqual(repo.loads.length, 1)
  repo.resolveLoad({ steps: 4800, calories: 200, standHours: 9, stepsGoal: 7000, caloriesGoal: 320, standGoal: 12 })
  assert.strictEqual(first.steps, 4800)
  assert.strictEqual(second.stepsGoal, 7000)
  store.hydrate(function (value) { second = value })
  assert.strictEqual(repo.loads.length, 0, 'hydrated Store must remain the in-memory truth source')
})

test('hydrate 期间的运动增量在读取完成后只应用一次', function () {
  const repo = fakeRepository()
  const store = core.createStore(repo)
  let committed = null
  store.addAndPersist(120, 30, function (value) { committed = value })
  assert.strictEqual(repo.saves.length, 0, 'must not persist against defaults before hydration completes')
  repo.resolveLoad({ steps: 5000, calories: 220, standHours: 8, stepsGoal: 6000, caloriesGoal: 300, standGoal: 12 })
  assert.strictEqual(store.getSnapshot().steps, 5120)
  assert.strictEqual(store.getSnapshot().calories, 250)
  assert.strictEqual(repo.saves.length, 1)
  assert.strictEqual(repo.saves[0].snapshot.steps, 5120)
  repo.resolveSave()
  assert.strictEqual(committed.steps, 5120)
})

test('运动提交立即发布新的 canonical Activity 快照', function () {
  const repo = fakeRepository()
  const store = core.createStore(repo)
  let observed = null
  store.hydrate(function () {})
  repo.resolveLoad({ steps: 5000, calories: 200, standHours: 8, stepsGoal: 6000, caloriesGoal: 300, standGoal: 12 })
  store.subscribe(function (value) { observed = value })
  store.addAndPersist(100, 10, function () {})
  assert.ok(observed, 'Activity subscriber must receive an update before persistence callback')
  assert.strictEqual(observed.steps, 5100)
  assert.strictEqual(observed.calories, 210)
  repo.resolveSave()
})

test('连续运动提交按顺序落盘，旧写入不能覆盖新快照', function () {
  const repo = fakeRepository()
  const store = core.createStore(repo)
  store.hydrate(function () {})
  repo.resolveLoad({ steps: 5000, calories: 200, standHours: 8, stepsGoal: 6000, caloriesGoal: 300, standGoal: 12 })
  let first = null, second = null
  store.addAndPersist(100, 10, function (value) { first = value.steps })
  store.addAndPersist(200, 20, function (value) { second = value.steps })
  assert.strictEqual(repo.saves.length, 1, 'only one storage save may be in flight')
  assert.strictEqual(repo.saves[0].snapshot.steps, 5100)
  repo.resolveSave()
  assert.strictEqual(first, 5100)
  assert.strictEqual(repo.saves.length, 2)
  assert.strictEqual(repo.saves[1].snapshot.steps, 5300)
  repo.resolveSave()
  assert.strictEqual(second, 5300)
  assert.strictEqual(store.getSnapshot().steps, 5300)
})

const repository = read('src/domain/activity/repository.js')
const storeCore = read('src/domain/activity/store_core.js')
const storeWrapper = read('src/domain/activity/store.js')
const storage = read('src/capabilities/storage.js')
const workout = read('src/v2/features/workout/controller.js')
const activityFeature = read('src/v2/features/activity/controller.js')
const steps = read('src/pages/steps/steps.ux')
const today = read('src/pages/today/today.ux')

assert.ok(repository.includes("ACTIVITY_KEY = 'activity_today_v3'"), 'Activity must use the clean V3 persistence namespace')
assert.ok(repository.includes("../../capabilities/storage"), 'Activity Repository must persist through the storage gateway')
assert.ok(!repository.includes('loadSync') && !storage.includes('getSync:'), 'Activity hydration must have one asynchronous persistence read owner')
assert.ok(storeWrapper.includes("require('./store_core')"), 'Activity Store must delegate concurrency to the executable core')
assert.ok(storeCore.includes('subscribe: function') && storeCore.includes('unsubscribe: function'), 'Activity Store must publish canonical state changes')
assert.ok(!storeCore.includes('repository.loadSync'), 'Activity Store must have one persistence read owner')
assert.ok(!storeCore.includes('restoreTotals') && !storeCore.includes('persist: function') && !storeCore.includes('add: function'), 'Activity Store must not restore retired alternate mutation paths')
assert.ok(!storeCore.includes('steps: 4567') && !storeCore.includes('calories: 180') && !storeCore.includes('standHours: 8'), 'Activity Domain must not seed fabricated current totals')
assert.ok(workout.includes('activityStore.addAndPersist(record.steps, record.calories'), 'Workout Feature must commit activity before finishing navigation flow')
assert.ok(workout.includes('historyRepository.saveToday(activitySnapshot'), 'History must receive the exact committed Activity snapshot')
assert.ok(activityFeature.includes("../../../domain/activity/store"), 'Activity Feature must own page-facing Activity access')
assert.ok(activityFeature.includes('activityStore.subscribe(onActivity)') && activityFeature.includes('activityStore.unsubscribe(onActivity)'), 'Activity Feature must follow the canonical Store while visible')
assert.ok(!activityFeature.includes("name: '步数'") && !activityFeature.includes('RATIOS') && !activityFeature.includes("unit: '步'"), 'Activity Feature must remain presentation-free')
assert.ok(steps.includes("../../v2/features/activity/controller") && steps.includes("../../v2/design/apps/steps") && steps.includes("../../v2/design/apps/steps/view"), 'Steps Page must bind Activity Feature through the app-owned V3 Design runtime')
assert.ok(!steps.includes("../../domain/activity/store") && !steps.includes('profile.formFactor'), 'Steps Page must not bypass Feature or own shape policy')
assert.ok(today.includes("../../v2/features/today/controller") && !today.includes("../../domain/activity/store"), 'Today Page must consume Activity only through its Feature orchestration')

console.log('Activity persistence verified: truthful totals, one async hydration source, live subscriptions and ordered writes (' + passed + ' runtime tests)')
