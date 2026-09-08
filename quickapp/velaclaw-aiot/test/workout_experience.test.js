const assert = require('assert')
const fs = require('fs')
const path = require('path')
const workoutView = require('../src/v2/design/apps/workout/view')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

const running = workoutView.project({
  type: 'run',
  status: 'running',
  durationMs: 65000,
  steps: 420,
  calories: 31,
  distanceMeters: 720,
  gpsDistanceMeters: 720,
  gpsStatus: 'active',
  currentHeartRate: 136
})
assert.strictEqual(running.statusText, '运动中')
assert.strictEqual(running.durationText, '01:05')
assert.strictEqual(running.heartRateText, '136')
assert.strictEqual(running.pauseButtonText, '暂停')
assert.strictEqual(running.metricOpacity, 1)

const paused = workoutView.project({
  type: 'walk',
  status: 'paused',
  durationMs: 125000,
  steps: 300,
  calories: 12,
  distanceMeters: 210,
  gpsDistanceMeters: 0,
  gpsStatus: 'paused',
  currentHeartRate: null
})
assert.strictEqual(paused.statusText, '已暂停')
assert.strictEqual(paused.heartRateText, '--')
assert.strictEqual(paused.pauseButtonText, '继续')
assert.ok(paused.metricOpacity < 1)
assert.strictEqual(paused.gpsText, 'GPS 已暂停')

const state = read('src/domain/workout/state_machine.js')
const controller = read('src/v2/features/workout/controller.js')
const selection = read('src/v2/features/workout/selection.js')
const page = read('src/pages/workout/workout.ux')

assert.ok(!state.includes('initialHeartRate'), 'Workout state must not fabricate a mode-based heart rate')
assert.ok(!state.includes('heartRateSpan'), 'Workout state must not fabricate a changing heart-rate waveform')
assert.ok(state.includes('updateHeartRate: function (value)'), 'Workout state must accept semantic heart-rate updates')
assert.ok(state.includes('currentHeartRate: null'), 'A new workout must wait for an official heart-rate sample')
assert.ok(state.includes("activeSession.heartSource = 'official'"), 'Official heart-rate provenance must survive persistence')
assert.ok(state.includes('getSupportedTypes: function ()'), 'Workout Domain must be the canonical source of supported modes')
assert.ok(state.includes("throw new Error('Unknown workout mode: ' + type)"), 'Unknown workout modes must fail visibly')
assert.ok(!state.includes('MODE_RULES[type] || MODE_RULES.walk'), 'Workout Domain must not silently run unknown modes as walk')
assert.ok(!/MODE_RULES\[type\]\s*\?\s*type\s*:\s*['"]walk['"]/.test(state), 'Workout Domain must not normalize unknown modes to walk')
assert.ok(!selection.includes('MODE_TYPES'), 'Workout Feature must not duplicate the Domain supported-mode list')
assert.ok(selection.includes('workoutState.getSupportedTypes()'), 'Workout selection must consume the Domain supported-mode list')
assert.ok(controller.includes("import heartRate from '../../../capabilities/heart_rate'"), 'Workout must consume the heart-rate capability')
assert.ok(controller.includes("!snapshot.live || snapshot.source !== 'live'"), 'Workout must reject non-live health samples')
assert.ok(controller.includes('heartRate.subscribe(onHeartRate)'), 'Workout must subscribe while active')
assert.ok(controller.includes('heartRate.unsubscribe(onHeartRate)'), 'Workout must release the subscription when inactive')
assert.ok(controller.includes('if (!restored)'), 'Invalid persisted workout modes must be discarded instead of silently converted')
assert.ok(page.includes('class="status-chip"'), 'Workout status must remain visible')
assert.ok(page.includes('background-color: {{ heroBackground }}'), 'Running and paused states must remain visually distinct')
assert.ok(page.includes('{{ heartRateLabel }}'), 'Workout must explain when official heart rate is unavailable')

console.log('Workout experience verified: explicit modes, official heart rate and visible running/paused feedback')
