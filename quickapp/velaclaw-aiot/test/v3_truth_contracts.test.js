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
const notificationFactory = require('../src/domain/notification/factory')
const notificationView = require('../src/v2/design/apps/notification/view')
const launcherLayout = require('../src/v2/design/apps/launcher/layout')
const appRoutes = require('../src/runtime/app_routes')
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
launcherLayout.base.appIds.forEach(function (id) {
  assert.ok(appRoutes.routeFor(id), 'Launcher Recipe app must resolve a runtime route: ' + id)
})

const canonicalNotification = notificationFactory.normalize({ type: 'app', title: '消息', content: '内容' })
assert.strictEqual(canonicalNotification.appName, '消息')
assert.strictEqual(canonicalNotification.content, '内容')
assert.throws(function () { notificationFactory.normalize({ content: 123 }) }, /Notification field must be a string/)
const blankCallView = notificationView.project({ visible: true, type: 'call', appName: '', appIcon: '', content: '', contact: '', phone: '', hangUp: false })
assert.strictEqual(blankCallView.appName, '', 'Notification View must not invent an app label')
assert.strictEqual(blankCallView.contact, '', 'Notification View must not invent a caller identity')

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
const storageSource = read('src/capabilities/storage.js')
const powerControllerSource = read('src/runtime/power/controller.js')
const navigationSource = read('src/runtime/navigation.js')
const deviceProfileSource = read('src/runtime/device_profile.js')
const clockControllerSource = read('src/v2/features/clock/controller.js')
const clockPageSource = read('src/pages/clock/clock.ux')
const launcherControllerSource = read('src/v2/features/launcher/controller.js')
const watchfaceStoreSource = read('src/domain/watchface/store.js')
const watchfaceControllerSource = read('src/v2/features/watchface/controller.js')
const watchfacePageSource = read('src/pages/watchface/index.ux')
const diagnosticsViewSource = read('src/v2/design/apps/diagnostics/view.js')

assert.ok(!batterySource.includes('cachedPercent = 75'), 'Battery Capability must not seed fabricated battery data')
assert.ok(storageSource.includes('Invalid persisted JSON for '), 'Malformed persisted JSON must fail visibly instead of becoming an empty fallback')
assert.ok(!storageSource.includes('safeJsonParse'), 'Storage must not retain the legacy malformed-JSON fallback parser')

assert.ok(!navigationSource.includes('catch (error)') && !navigationSource.includes('return false'), 'Navigation must not silently swallow router failures')
assert.ok(!deviceProfileSource.includes('deviceFamily'), 'Device Profile must not invent device identity from geometry')
assert.ok(!deviceProfileSource.includes("'_generic'"), 'Device Profile must not fabricate generic device-family labels')

assert.ok(!powerControllerSource.includes('return core.create('), 'Product Power controller must not expose the entire testable Core')
assert.ok(!powerControllerSource.includes('evaluateIdle') && !powerControllerSource.includes('forceMode') && !powerControllerSource.includes('getMode') && !powerControllerSource.includes('getSnapshot'), 'Power test hooks must stay inside Core')

assert.ok(!clockControllerSource.includes('batteryPercent: 75'), 'Clock controller must not seed fabricated battery data')
assert.ok(!clockControllerSource.includes('currentHeartRate: 88'), 'Clock controller must not seed fabricated heart-rate data')
assert.ok(!/batteryPercent:\s*\d+/.test(clockPageSource), 'Clock page must not seed fabricated battery data')
assert.ok(!/currentHeartRate:\s*\d+/.test(clockPageSource), 'Clock page must not seed fabricated heart-rate data')
assert.ok(!clockPageSource.includes("faceId: 'sport'"), 'Clock page must not seed a watchface outside Recipe/controller ownership')
assert.ok(clockControllerSource.includes('Clock requires resolved faceIds'), 'Clock must require Recipe-owned face IDs')
assert.ok(!clockControllerSource.includes('getSnapshot: snapshot'), 'Clock must not expose a second snapshot access path outside its change callback')
assert.ok(!clockControllerSource.includes('historyRepository'), 'Clock must not own History persistence; only real Activity mutation may write history')
assert.ok(clockControllerSource.includes('activityStore.hydrate'), 'Clock must consume hydrated canonical Activity state before starting live runtime')
assert.ok(clockControllerSource.includes('lifecycleGeneration'), 'Clock async startup must be guarded against late callbacks after stop')

assert.ok(launcherControllerSource.includes('requirePageSize'), 'Launcher must validate pageSize at configuration boundary')
assert.strictEqual((launcherControllerSource.match(/pageSize = requirePageSize/g) || []).length, 1, 'Launcher must not repeatedly validate canonical pageSize during snapshot')
assert.ok(!launcherControllerSource.includes('goToPage'), 'Launcher must not expose unused arbitrary page-index navigation')
assert.ok(!launcherControllerSource.includes('refresh: emit'), 'Launcher must not expose an unused refresh facade')
assert.ok(!launcherControllerSource.includes('Number(value)'), 'Launcher must consume numeric Recipe pageSize without coercion')

assert.ok(watchfaceStoreSource.includes("selected_face_id_v3"), 'Watchface selection must use the clean V3 persistence namespace')
assert.ok(!watchfaceStoreSource.includes("selectedFaceId = 'sport'"), 'Watchface persistence must not own a default face')
assert.ok(!watchfaceStoreSource.includes("id || 'sport'"), 'Watchface persistence must not silently replace invalid IDs with sport')
assert.ok(!watchfaceStoreSource.includes('right_face_transition_v3'), 'Retired right-face transition persistence must stay removed')
assert.ok(!watchfaceStoreSource.includes('markRightFaceTransition') && !watchfaceStoreSource.includes('consumeRightFaceTransition') && !watchfaceStoreSource.includes('clearRightFaceTransition'), 'Watchface Store must expose only current selection persistence')
assert.ok(!watchfaceStoreSource.includes('getSelectedFaceId'), 'Watchface Store must not expose a second synchronous selection read path')
assert.ok(!watchfaceControllerSource.includes("selectedId = 'sport'"), 'Watchface Feature must not own a hardcoded face default')
assert.ok(watchfaceControllerSource.includes('requires Recipe faceIds'), 'Watchface Feature must require Recipe-owned face IDs')
assert.ok(watchfaceControllerSource.includes('Watchface is not allowed by Recipe'), 'Watchface Feature must reject non-empty invalid selections instead of normalizing them')
assert.ok(!watchfaceControllerSource.includes('refresh: emit'), 'Watchface Feature must not expose an unused refresh facade')
assert.ok(!watchfacePageSource.includes("selectedName: '活力数字'"), 'Watchface page must not seed selected-face content before controller state')

assert.ok(!diagnosticsViewSource.includes('isBetaPillViewport'), 'Diagnostics must not retain retired beta viewport compatibility state')
assert.ok(!diagnosticsViewSource.includes("formFactor || 'rect'"), 'Diagnostics must consume canonical Device Profile formFactor without fallback')
assert.ok(!diagnosticsViewSource.includes('deviceFamily'), 'Diagnostics must display the native device model instead of an inferred family')
assert.ok(diagnosticsViewSource.includes("value === null ? '--'"), 'Diagnostics View must render unavailable optional device facts explicitly')

console.log('V3 truth contracts verified: canonical state has one owner, product APIs are narrow and invalid inputs are not silently repaired')