const assert = require('assert')
const fs = require('fs')
const path = require('path')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const workoutSurface = require('../src/product/frontend/surfaces/workout.json')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

const profile = { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
const host = scene.resolve(profile)
const safe = scene.safe(profile, host)

function project(state) {
  return surfaceRuntime.resolve(workoutSurface, profile, host, safe, state)
}

const running = project({
  confirming: false,
  type: 'run',
  status: 'running',
  durationMs: 65000,
  steps: null,
  calories: null,
  distanceMeters: 720,
  gpsDistanceMeters: 720,
  gpsStatus: 'active',
  currentHeartRate: 136
})
assert.strictEqual(running.flowHeaders[0].trailing, '跑步')
assert.strictEqual(running.flowHeaders[0].subtitleTrailing, '运动中')
assert.strictEqual(running.flowTexts[0].text, '01:05')
assert.strictEqual(running.flowMetricItems.filter(item => item.id === 'metrics-steps')[0].value, '--')
assert.strictEqual(running.flowMetricItems.filter(item => item.id === 'metrics-calories')[0].value, '--')
assert.strictEqual(running.flowMetricItems.filter(item => item.id === 'metrics-distance')[0].value, '720 m')
assert.strictEqual(running.flowMetricItems.filter(item => item.id === 'metrics-heart')[0].value, '136')
assert.strictEqual(running.flowButtons.filter(item => item.id === 'pause')[0].copy.title, '暂停')
assert.strictEqual(running.flowButtons.filter(item => item.id === 'gps')[0].copy.title, 'GPS 已定位')

const paused = project({
  confirming: false,
  type: 'walk',
  status: 'paused',
  durationMs: 125000,
  steps: null,
  calories: null,
  distanceMeters: null,
  gpsDistanceMeters: 0,
  gpsStatus: 'paused',
  currentHeartRate: null
})
assert.strictEqual(paused.flowHeaders[0].trailing, '步行')
assert.strictEqual(paused.flowHeaders[0].subtitleTrailing, '已暂停')
assert.strictEqual(paused.flowMetricItems.filter(item => item.id === 'metrics-heart')[0].value, '--')
assert.strictEqual(paused.flowMetricItems.filter(item => item.id === 'metrics-distance')[0].value, '--')
assert.strictEqual(paused.flowButtons.filter(item => item.id === 'pause')[0].copy.title, '继续')
assert.strictEqual(paused.flowButtons.filter(item => item.id === 'gps')[0].copy.title, 'GPS 已暂停')

const confirm = project({ confirming: true })
assert.deepStrictEqual(confirm.modules.map(item => item.id), ['confirmCard', 'confirmCancel', 'confirmSave'])
assert.strictEqual(confirm.flowButtons.filter(item => item.id === 'confirmSave')[0].action, 'workout-confirm-finish')

const state = read('src/domain/workout/state_machine_core.js')
const repository = read('src/domain/workout/repository.js')
const controller = read('src/product/features/workout/controller.js')
const selection = read('src/product/features/workout/selection.js')
const page = read('src/pages/workout/workout.ux')
const surface = read('src/product/frontend/surfaces/workout.json')

assert.ok(!state.includes('initialHeartRate'), 'Workout state must not fabricate a mode-based heart rate')
assert.ok(!state.includes('heartRateSpan'), 'Workout state must not fabricate a changing heart-rate waveform')
assert.ok(state.includes('updateHeartRate: function (value)'), 'Workout state must accept semantic heart-rate updates')
assert.ok(state.includes('currentHeartRate: null'), 'A new workout must wait for an official heart-rate sample')
assert.ok(state.includes("activeSession.heartSource = 'official'"), 'Official heart-rate provenance must survive persistence')
assert.ok(!state.includes('stepsPerSecond') && !state.includes('strideMeters') && !state.includes('caloriesPerStep'), 'Workout Domain must not fabricate activity metrics from elapsed time')
assert.ok(state.includes('getSupportedTypes: function ()'), 'Workout Domain must be the canonical source of supported modes')
assert.ok(state.includes("throw new Error('Unknown workout mode: ' + type)"), 'Unknown workout modes must fail visibly')
assert.ok(repository.includes("ACTIVE_KEY = 'active_workout_v4'"), 'Truthful active workout persistence must use the V4 namespace')
assert.ok(repository.includes("RECORDS_KEY = 'workout_records_v4'"), 'Truthful workout history must use the V4 namespace')
assert.ok(!repository.includes("'active_workout_v3'") && !repository.includes("'workout_records_v3'"), 'Truthful persistence must not reopen synthetic V3 workout data')
assert.ok(!selection.includes('MODE_TYPES'), 'Workout Feature must not duplicate the Domain supported-mode list')
assert.ok(selection.includes('workoutState.getSupportedTypes()'), 'Workout selection must consume the Domain supported-mode list')
assert.ok(controller.includes("import heartRate from '../../../capabilities/heart_rate'"), 'Workout must consume the heart-rate capability')
assert.ok(controller.includes("!snapshot.live || snapshot.source !== 'live'"), 'Workout must reject non-live health samples')
assert.ok(controller.includes('heartRate.subscribe(onHeartRate)'), 'Workout must subscribe while active')
assert.ok(controller.includes('heartRate.unsubscribe(onHeartRate)'), 'Workout must release the subscription when inactive')
assert.ok(controller.includes('if (!restored)'), 'Invalid persisted workout state must be discarded, not repaired')
assert.ok(controller.indexOf('workoutRepository.saveRecord(record') < controller.indexOf('workoutRepository.clearActive(function'), 'Workout record persistence must precede active-session deletion')
assert.ok(!controller.includes('activityStore.addAndPersist'), 'Unavailable workout steps/calories must not mutate Activity totals')
assert.ok(page.includes("var surface = require('../../product/frontend/surfaces/workout.json')"), 'Workout UX must load its page-local declarative surface')
assert.ok(page.includes('surfacePage.bind(this, surface)'), 'Workout UX must bind the page-local Surface through the generic runtime')
assert.strictEqual((page.match(/surfacePage\.bind\(/g) || []).length, 1, 'Workout UX must bind exactly one declarative surface')
assert.ok(!page.includes('status-chip') && !page.includes('heroBackground') && !page.includes('heartRateLabel'), 'Workout UX must not retain the old handcrafted presentation')
assert.ok(surface.includes('"workout-toggle-pause"') && surface.includes('"workout-confirm-finish"'), 'Workout actions must be declared by the JSON surface')
assert.ok(surface.includes('"running": { "text": "运动中"') && surface.includes('"paused": { "text": "已暂停"'), 'Workout status copy and colors must be JSON-owned')
assert.ok(surface.includes('GPS 不可用 · 距离暂无'), 'Workout UI must not promise stride-estimated distance without a measured step source')

console.log('Workout experience verified: truthful data, official heart rate, recoverable completion and page-local JSON presentation')
