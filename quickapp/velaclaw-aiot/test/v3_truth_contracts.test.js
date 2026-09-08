const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const appCatalog = require('../src/v2/design/catalogs/apps')
const settingsCatalog = require('../src/v2/design/catalogs/settings')
const workoutCatalog = require('../src/v2/design/workout_catalog')
const watchfaceCatalog = require('../src/v2/design/watchface_catalog')
const clockView = require('../src/v2/design/apps/clock/view')

assert.throws(function () { appCatalog.get('missing') }, /Unknown V3 launcher app/)
assert.throws(function () { appCatalog.list([]) }, /explicit appIds/)
assert.throws(function () { settingsCatalog.get('missing') }, /Unknown V3 settings item/)
assert.throws(function () { settingsCatalog.list([]) }, /explicit itemIds/)
assert.throws(function () { workoutCatalog.get('missing') }, /Unknown V3 workout mode/)
assert.throws(function () { workoutCatalog.list([]) }, /explicit mode types/)
assert.throws(function () { watchfaceCatalog.get('missing') }, /Unknown V3 watchface visual/)

const telemetry = clockView.project({
  faceId: 'sport',
  timestamp: new Date(2026, 8, 8, 12, 0).getTime(),
  batteryPercent: null,
  currentHeartRate: null,
  heartRateValues: [],
  steps: 0,
  stepsGoal: 0,
  goalPercent: 0,
  stepsPercent: 0,
  powerMode: 'ACTIVE'
})
assert.strictEqual(telemetry.batteryPercent, '--')
assert.strictEqual(telemetry.batteryWidth, '0%')
assert.strictEqual(telemetry.currentHeartRate, '--')

const batterySource = read('src/capabilities/battery.js')
const clockControllerSource = read('src/v2/features/clock/controller.js')
assert.ok(!batterySource.includes('cachedPercent = 75'), 'Battery Capability must not seed fabricated battery data')
assert.ok(!clockControllerSource.includes('batteryPercent: 75'), 'Clock must not seed fabricated battery data')
assert.ok(!clockControllerSource.includes('currentHeartRate: 88'), 'Clock must not seed fabricated heart-rate data')
assert.ok(clockControllerSource.includes('Clock requires resolved faceIds'), 'Clock must require Recipe-owned face IDs')

console.log('V3 truth contracts verified: no fabricated telemetry or silent catalog placeholders')
