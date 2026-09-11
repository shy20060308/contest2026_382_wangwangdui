const assert = require('assert')
const fs = require('fs')
const path = require('path')
const core = require('../src/domain/workout/state_machine_core')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const workoutSurface = require('../src/product/frontend/surfaces/workout.json')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const machine = core.createStateMachine()
let state = machine.start('walk', 1000)
assert.strictEqual(state.steps, null)
assert.strictEqual(state.calories, null)
assert.strictEqual(state.distanceMeters, null)
assert.strictEqual(state.distanceSource, 'unavailable')

state = machine.tick(61000)
assert.strictEqual(state.durationMs, 60000)
assert.strictEqual(state.steps, null, 'R01: elapsed time must not fabricate steps')
assert.strictEqual(state.calories, null, 'R01: elapsed time must not fabricate calories')
assert.strictEqual(state.distanceMeters, null, 'R01: elapsed time must not fabricate distance')

state = machine.updateGps({ status: 'active', point: { latitude: 31.1, longitude: 121.5 }, distanceMeters: 84.5 })
assert.strictEqual(state.distanceMeters, 84.5)
assert.strictEqual(state.distanceSource, 'gps')
assert.strictEqual(state.steps, null)

const record = machine.finish(61000)
assert.strictEqual(record.steps, null)
assert.strictEqual(record.calories, null)
assert.strictEqual(record.distanceMeters, 84.5)
assert.strictEqual(record.distanceSource, 'gps')
assert.ok(machine.getActive(), 'finish must freeze the session until persistence succeeds')
assert.strictEqual(machine.getActive().status, 'paused')
assert.strictEqual(machine.complete(record.id), true)
assert.strictEqual(machine.getActive(), null)

const emptyMachine = core.createStateMachine()
emptyMachine.start('run', 1000)
const emptyRecord = emptyMachine.finish(61000)
assert.strictEqual(emptyRecord.distanceMeters, null)
assert.strictEqual(emptyRecord.distanceSource, 'unavailable')

const profile = { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
const host = scene.resolve(profile)
const safe = scene.safe(profile, host)
const plan = surfaceRuntime.resolve(workoutSurface, profile, host, safe, {
  confirming: false,
  type: 'walk',
  status: 'running',
  durationMs: 60000,
  steps: null,
  calories: null,
  distanceMeters: null,
  gpsStatus: 'unavailable',
  currentHeartRate: null
})
function metric(id) { return plan.flowMetricItems.filter(item => item.id === 'metrics-' + id)[0] }
assert.strictEqual(metric('steps').value, '--')
assert.strictEqual(metric('calories').value, '--')
assert.strictEqual(metric('distance').value, '--')
assert.strictEqual(plan.flowButtons.filter(item => item.id === 'gps')[0].copy.title, 'GPS 不可用 · 距离暂无')

const stateSource = read('src/domain/workout/state_machine_core.js')
assert.ok(!stateSource.includes('stepsPerSecond') && !stateSource.includes('caloriesPerStep') && !stateSource.includes('strideMeters'), 'formal workout domain must not retain time-derived activity formulas')
const repositorySource = read('src/domain/workout/repository.js')
assert.ok(repositorySource.includes("ACTIVE_KEY = 'active_workout_v4'"))
assert.ok(repositorySource.includes("RECORDS_KEY = 'workout_records_v4'"))
assert.ok(!repositorySource.includes("'active_workout_v3'") && !repositorySource.includes("'workout_records_v3'"), 'new truthful workout persistence must not reopen synthetic v3 namespaces')
assert.ok(repositorySource.includes('Conflicting workout record id:'), 'record ids must be idempotency keys')

const controllerSource = read('src/product/features/workout/controller.js')
const saveIndex = controllerSource.indexOf('workoutRepository.saveRecord(record')
const clearIndex = controllerSource.indexOf('workoutRepository.clearActive(function')
assert.ok(saveIndex >= 0 && clearIndex > saveIndex, 'completed record must persist before active session is cleared')
assert.ok(controllerSource.includes('if (!persisted(saveResult)) return'), 'record persistence failure must keep the active recovery state')
assert.ok(controllerSource.includes('if (!persisted(clearResult)) return'), 'active clear failure must not complete the in-memory session')
assert.ok(!controllerSource.includes('activityStore.addAndPersist'), 'unmeasured workout steps must not flow into Activity totals')

console.log('Workout truthful-data contracts verified: time does not fabricate activity metrics and completion keeps a recoverable active session')
