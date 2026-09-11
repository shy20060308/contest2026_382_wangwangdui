const fs = require('fs')
const path = require('path')
const assert = require('assert')
const core = require('../src/domain/activity/store_core')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

let passed = 0
function test(name, callback) { callback(); passed++; console.log('通过 - ' + name) }
function healthy(value) { return { ok: true, status: value === null || value === undefined ? 'missing' : 'ok', error: null } }

function fakeRepository() {
  const loads = []
  const saves = []
  const quarantines = []
  return {
    loads: loads,
    saves: saves,
    quarantines: quarantines,
    loadResult: function (callback, day) { loads.push({ callback: callback, day: day }) },
    save: function (snapshot, callback, day) { saves.push({ snapshot: JSON.parse(JSON.stringify(snapshot)), callback: callback, day: day, resolved: false }) },
    quarantine: function (callback) { quarantines.push(callback) },
    resolveLoad: function (value, result) {
      const entry = loads.shift()
      assert.ok(entry, 'expected pending activity load')
      entry.callback(value, result || healthy(value))
    },
    resolveSave: function (result) {
      const entry = saves.find(function (item) { return !item.resolved })
      assert.ok(entry, 'expected pending activity save')
      entry.resolved = true
      entry.callback(JSON.parse(JSON.stringify(entry.snapshot)), result === undefined ? { persisted: true, memoryOnly: false, error: null } : result)
    },
    resolveQuarantine: function (result) {
      const callback = quarantines.shift()
      assert.ok(callback, 'expected pending activity quarantine')
      callback(result || { ok: true, status: 'quarantined', backupKey: 'activity_today_v4__corrupt_backup', error: null })
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

test('corrupt Activity 必须结算 hydrate、进入内存模式且禁止覆盖原 key', function () {
  const repo = fakeRepository()
  const store = core.createStore(repo)
  let hydrated = null
  let persistence = null
  store.hydrate(function (value, state) { hydrated = value; persistence = state })
  repo.resolveLoad(null, { ok: false, status: 'corrupt', error: new Error('bad activity') })
  assert.strictEqual(hydrated.steps, 0)
  assert.strictEqual(persistence.status, 'corrupt')
  assert.strictEqual(persistence.recoverable, true)

  let commitResult = null
  store.addAndPersist(25, 3, function (value, result) { commitResult = result })
  assert.strictEqual(store.getSnapshot().steps, 25, 'degraded mode may retain new activity in memory')
  assert.strictEqual(repo.saves.length, 0, 'corrupt Activity key must not be overwritten before explicit recovery')
  assert.ok(commitResult && commitResult.memoryOnly)
})

test('I/O Activity 读取失败可启动，但不得执行删除式恢复', function () {
  const repo = fakeRepository()
  const store = core.createStore(repo)
  store.hydrate(function () {})
  repo.resolveLoad(null, { ok: false, status: 'io-error', error: new Error('device unavailable') })
  assert.strictEqual(store.getPersistenceState().status, 'io-error')
  assert.strictEqual(store.getPersistenceState().recoverable, false)
  let result = null
  store.recoverPersistence(function (value) { result = value })
  assert.strictEqual(result.status, 'not-recoverable')
  assert.strictEqual(repo.quarantines.length, 0)
})

test('显式 Activity 恢复先 quarantine，再写当天默认值并解除保护', function () {
  const repo = fakeRepository()
  const store = core.createStore(repo, null, { dayKey: function () { return '2026-09-12' } })
  store.hydrate(function () {})
  repo.resolveLoad(null, { ok: false, status: 'corrupt', error: new Error('bad activity') })
  let recovery = null
  store.recoverPersistence(function (result) { recovery = result })
  assert.strictEqual(repo.quarantines.length, 1)
  assert.strictEqual(repo.saves.length, 0)
  repo.resolveQuarantine()
  assert.strictEqual(repo.saves.length, 1, 'clean reset write starts only after raw corrupt content is backed up')
  assert.strictEqual(repo.saves[0].day, '2026-09-12')
  assert.strictEqual(repo.saves[0].snapshot.steps, 0)
  repo.resolveSave()
  assert.ok(recovery && recovery.ok)
  assert.strictEqual(store.getPersistenceState().status, 'ok')

  store.addAndPersist(10, 1, function () {})
  assert.strictEqual(repo.saves.length, 2, 'normal Activity persistence resumes after explicit recovery')
})

const repository = read('src/domain/activity/repository.js')
const storeCore = read('src/domain/activity/store_core.js')
const storeWrapper = read('src/domain/activity/store.js')
const storage = read('src/capabilities/storage.js')
const workout = read('src/product/features/workout/controller.js')
const activityFeature = read('src/product/features/activity/controller.js')
const todayFeature = read('src/product/features/today/controller.js')
const steps = read('src/pages/steps/steps.ux')
const stepsSurface = JSON.parse(read('src/product/frontend/surfaces/steps.json'))
const today = read('src/pages/today/today.ux')
const todaySurface = JSON.parse(read('src/product/frontend/surfaces/today.json'))

assert.ok(repository.includes("ACTIVITY_KEY = 'activity_today_v4'"), 'Truthful Activity must use the V4 persistence namespace')
assert.ok(!repository.includes("'activity_today_v3'"), 'Truthful Activity must not reopen totals contaminated by synthetic workout metrics')
assert.ok(repository.includes("../../capabilities/storage"), 'Activity Repository must persist through the storage gateway')
assert.ok(repository.includes('storage.getJSONResult'), 'Activity Repository must classify recoverable storage reads instead of relying only on async throw')
assert.ok(repository.includes("status: 'corrupt'"), 'Activity semantic validation failures must become explicit corrupt persistence state')
assert.ok(!repository.includes('loadSync') && !storage.includes('getSync:'), 'Activity hydration must have one asynchronous persistence read owner')
assert.ok(storeWrapper.includes("require('./store_core')"), 'Activity Store must delegate concurrency to the executable core')
assert.ok(storeCore.includes('subscribe: function') && storeCore.includes('unsubscribe: function'), 'Activity Store must publish canonical state changes')
assert.ok(storeCore.includes('getPersistenceState: persistenceSnapshot') && storeCore.includes('recoverPersistence: function'), 'Activity Store must expose explicit degraded state and user-driven recovery')
assert.ok(!storeCore.includes('repository.loadSync'), 'Activity Store must have one persistence read owner')
assert.ok(!storeCore.includes('restoreTotals') && !storeCore.includes('persist: function') && !storeCore.includes('add: function'), 'Activity Store must not restore retired alternate mutation paths')
assert.ok(!storeCore.includes('steps: 4567') && !storeCore.includes('calories: 180') && !storeCore.includes('standHours: 8'), 'Activity Domain must not seed fabricated current totals')
assert.ok(!workout.includes('activityStore.addAndPersist'), 'Workout must not add unavailable synthetic metrics into canonical Activity')
assert.ok(!workout.includes('historyRepository.saveToday'), 'Workout must not project unavailable synthetic metrics into History')
assert.ok(activityFeature.includes("../../../domain/activity/store"), 'Activity Feature must own page-facing Activity access')
assert.ok(activityFeature.includes('activityStore.subscribe(onActivity)') && activityFeature.includes('activityStore.unsubscribe(onActivity)'), 'Activity Feature must follow the canonical Store while visible')
assert.ok(!activityFeature.includes("name: '步数'") && !activityFeature.includes('RATIOS') && !activityFeature.includes("unit: '步'"), 'Activity Feature must remain presentation-free')
assert.ok(todayFeature.includes("../../../domain/activity/store"), 'Today Feature must consume canonical Activity through product orchestration')

assert.ok(steps.includes('surface_host.ux') && steps.includes("var surface = require('../../product/frontend/surfaces/steps.json')") && steps.includes('surfacePage.bind(this, surface)'), 'Steps Page must be a thin page-local declarative Surface host')
assert.strictEqual((steps.match(/surfacePage\.bind\(/g) || []).length, 1, 'Steps Page must bind exactly one declarative surface')
assert.ok(!steps.includes('/v2/') && !steps.includes('design/apps/steps') && !steps.includes('createActivityController'), 'Steps Page must not retain a second implementation path')
assert.strictEqual(stepsSurface.controller, 'activity', 'Steps JSON must bind semantic Activity through the controller registry')
assert.deepStrictEqual(stepsSurface.modules.map(function (module) { return module.id }), ['title', 'history', 'metrics'], 'Steps JSON must own visible module order')
assert.deepStrictEqual(stepsSurface.modules[2].props.items.map(function (item) { return item.id }), ['steps', 'calories', 'stand'], 'Steps JSON must own metric order')
assert.ok(!steps.includes("../../domain/activity/store") && !steps.includes('profile.formFactor'), 'Steps Page must not bypass the generic Surface runtime')
assert.ok(today.includes('surface_host.ux') && today.includes("var surface = require('../../product/frontend/surfaces/today.json')") && today.includes('surfacePage.bind(this, surface)'), 'Today Page must be a thin page-local declarative Surface host')
assert.strictEqual((today.match(/surfacePage\.bind\(/g) || []).length, 1, 'Today Page must bind exactly one declarative surface')
assert.ok(!today.includes('/v2/') && !today.includes("../../domain/activity/store"), 'Today Page must delegate semantic state to its registered controller')
assert.strictEqual(todaySurface.controller, 'today', 'Today JSON must bind the Today semantic controller')

console.log('Activity persistence verified: truthful namespace, recoverable hydration, live subscriptions and page-local JSON-owned Steps/Today presentation (' + passed + ' runtime tests)')
