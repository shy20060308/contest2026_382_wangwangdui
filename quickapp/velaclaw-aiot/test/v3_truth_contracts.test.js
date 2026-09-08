const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const appCatalog = require('../src/v2/design/catalogs/apps')
const settingsCatalog = require('../src/v2/design/catalogs/settings')
const workoutCatalog = require('../src/v2/design/workout_catalog')
const watchfaceCatalog = require('../src/v2/design/watchface_catalog')
const domainWatchfaceCatalog = require('../src/domain/watchface/catalog')
const clockView = require('../src/v2/design/apps/clock/view')

assert.throws(function () { appCatalog.get('missing') }, /Unknown V3 launcher app/)
assert.throws(function () { appCatalog.list([]) }, /explicit appIds/)
assert.throws(function () { settingsCatalog.get('missing') }, /Unknown V3 settings item/)
assert.throws(function () { settingsCatalog.list([]) }, /explicit itemIds/)
assert.throws(function () { workoutCatalog.get('missing') }, /Unknown V3 workout mode/)
assert.throws(function () { workoutCatalog.list([]) }, /explicit mode types/)
assert.throws(function () { watchfaceCatalog.get('missing') }, /Unknown V3 watchface visual/)
assert.throws(function () { domainWatchfaceCatalog.get('missing') }, /Unknown watchface/)
assert.throws(function () { domainWatchfaceCatalog.list([]) }, /explicit faceIds/)
assert.throws(function () { domainWatchfaceCatalog.indexOf(['sport'], 'simple') }, /not allowed by Recipe/)

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
const clockPageSource = read('src/pages/clock/clock.ux')
const launcherControllerSource = read('src/v2/features/launcher/controller.js')
const watchfaceStoreSource = read('src/domain/watchface/store.js')
const watchfaceControllerSource = read('src/v2/features/watchface/controller.js')
const watchfacePageSource = read('src/pages/watchface/index.ux')
const diagnosticsViewSource = read('src/v2/design/apps/diagnostics/view.js')

assert.ok(!batterySource.includes('cachedPercent = 75'), 'Battery Capability must not seed fabricated battery data')
assert.ok(!clockControllerSource.includes('batteryPercent: 75'), 'Clock controller must not seed fabricated battery data')
assert.ok(!clockControllerSource.includes('currentHeartRate: 88'), 'Clock controller must not seed fabricated heart-rate data')
assert.ok(!/batteryPercent:\s*\d+/.test(clockPageSource), 'Clock page must not seed fabricated battery data')
assert.ok(!/currentHeartRate:\s*\d+/.test(clockPageSource), 'Clock page must not seed fabricated heart-rate data')
assert.ok(!clockPageSource.includes("faceId: 'sport'"), 'Clock page must not seed a watchface outside Recipe/controller ownership')
assert.ok(clockControllerSource.includes('Clock requires resolved faceIds'), 'Clock must require Recipe-owned face IDs')

assert.ok(launcherControllerSource.includes('requirePageSize'), 'Launcher must validate pageSize at configuration boundary')
assert.strictEqual((launcherControllerSource.match(/pageSize = requirePageSize/g) || []).length, 1, 'Launcher must not repeatedly validate canonical pageSize during snapshot')
assert.ok(launcherControllerSource.includes('requirePageIndex'), 'Launcher must reject invalid explicit page indexes')
assert.ok(!launcherControllerSource.includes('Number(index) || 0'), 'Launcher must not silently map invalid page indexes to page zero')

assert.ok(watchfaceStoreSource.includes("selected_face_id_v3"), 'Watchface selection must use the clean V3 persistence namespace')
assert.ok(!watchfaceStoreSource.includes("selectedFaceId = 'sport'"), 'Watchface persistence must not own a default face')
assert.ok(!watchfaceStoreSource.includes("id || 'sport'"), 'Watchface persistence must not silently replace invalid IDs with sport')
assert.ok(!watchfaceControllerSource.includes("selectedId = 'sport'"), 'Watchface Feature must not own a hardcoded face default')
assert.ok(watchfaceControllerSource.includes('requires Recipe faceIds'), 'Watchface Feature must require Recipe-owned face IDs')
assert.ok(watchfaceControllerSource.includes('Watchface is not allowed by Recipe'), 'Watchface Feature must reject non-empty invalid selections instead of normalizing them')
assert.ok(!watchfacePageSource.includes("selectedName: '活力数字'"), 'Watchface page must not seed selected-face content before controller state')

assert.ok(!diagnosticsViewSource.includes('isBetaPillViewport'), 'Diagnostics must not retain retired beta viewport compatibility state')
assert.ok(!diagnosticsViewSource.includes("formFactor || 'rect'"), 'Diagnostics must consume canonical Device Profile formFactor without fallback')

console.log('V3 truth contracts verified: canonical state has one owner and invalid inputs are not silently repaired')
