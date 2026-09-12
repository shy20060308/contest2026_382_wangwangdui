const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const exists = file => fs.existsSync(path.join(root, file))

const notificationFactory = require('../src/domain/notification/factory')
const manifest = require('../src/manifest.json')

const canonicalNotification = notificationFactory.normalize({ type: 'app', title: '消息', content: '内容' })
assert.strictEqual(canonicalNotification.appName, '消息')
assert.strictEqual(canonicalNotification.content, '内容')
assert.throws(function () { notificationFactory.normalize({ content: 123 }) }, /Notification field must be a string/)

const batterySource = read('src/capabilities/battery.js')
const storageSource = read('src/capabilities/storage.js')
const storageReadResultSource = read('src/capabilities/internal/storage_read_result.js')
const powerControllerSource = read('src/runtime/power/controller.js')
const navigationSource = read('src/runtime/navigation.js')
const deviceProfileSource = read('src/runtime/device_profile.js')
const clockControllerSource = read('src/product/features/clock/controller.js')
const watchfaceStoreSource = read('src/domain/watchface/store.js')
const watchfaceControllerSource = read('src/product/features/watchface/controller.js')
const registrySource = read('src/product/controller_registry.js')
const clockPageSource = read('src/pages/clock/clock.ux')
const watchfacePageSource = read('src/pages/watchface/index.ux')

assert.ok(!batterySource.includes('cachedPercent = 75'), 'Battery Capability must not seed fabricated battery data')
assert.ok(storageSource.includes('if (!result.ok) throw result.error'), 'Legacy storage get/getJSON must keep fail-fast behavior until callers explicitly adopt structured recovery')
assert.ok(storageSource.includes('getJSONResult: function'), 'Recoverable callers must have an explicit structured JSON read API')
assert.ok(storageReadResultSource.includes("make('corrupt', error)"), 'Malformed persisted JSON must be classified as corrupt rather than silently accepted as fallback')
assert.ok(!storageSource.includes('safeJsonParse'), 'Storage must not retain the legacy malformed-JSON fallback parser')
assert.ok(!navigationSource.includes('catch (error)'), 'Navigation must not catch and silently convert router failures')
assert.ok(navigationSource.includes('router.push({') && navigationSource.includes('router.replace({') && navigationSource.includes('router.back()'), 'Navigation must call the framework router directly inside transition invokes so failures remain observable')
assert.ok(!deviceProfileSource.includes('deviceFamily'), 'Device Profile must not invent device identity from geometry')
assert.ok(!deviceProfileSource.includes("'_generic'"), 'Device Profile must not fabricate generic device-family labels')

assert.ok(!powerControllerSource.includes('return core.create('), 'Product Power controller must not expose the entire testable Core')
assert.ok(!powerControllerSource.includes('evaluateIdle') && !powerControllerSource.includes('forceMode') && !powerControllerSource.includes('getMode') && !powerControllerSource.includes('getSnapshot'), 'Power test hooks must stay inside Core')

assert.ok(!clockControllerSource.includes('batteryPercent: 75'), 'Clock controller must not seed fabricated battery data')
assert.ok(!clockControllerSource.includes('currentHeartRate: 88'), 'Clock controller must not seed fabricated heart-rate data')
assert.ok(!clockControllerSource.includes('heartRateValues'), 'Clock controller must not copy an unconsumed heart-rate history window into every Surface state')
assert.ok(!clockControllerSource.includes('faceIndex'), 'Clock controller must not emit an unconsumed face index when faceId is the authored Stage selector')
assert.ok(!/batteryPercent:\s*\d+/.test(clockPageSource), 'Clock page must not seed fabricated battery data')
assert.ok(!/currentHeartRate:\s*\d+/.test(clockPageSource), 'Clock page must not seed fabricated heart-rate data')
assert.ok(clockControllerSource.includes('function requireFaceIds(ids)') && clockControllerSource.includes('faceIds = requireFaceIds(allowedFaceIds)'), 'Clock must validate allowed face IDs at configuration boundary')
assert.ok(!clockControllerSource.includes('getSnapshot: snapshot'), 'Clock must not expose a second snapshot access path outside its change callback')
assert.ok(!clockControllerSource.includes('historyRepository'), 'Clock must not own History persistence')
assert.ok(clockControllerSource.includes('activityStore.hydrate'), 'Clock must consume hydrated canonical Activity state before live runtime')
assert.ok(clockControllerSource.includes('lifecycleGeneration'), 'Clock async startup must be guarded against late callbacks after stop')

assert.ok(watchfaceStoreSource.includes("selected_face_id_v3"), 'Watchface selection must use the clean V3 persistence namespace')
assert.ok(!watchfaceStoreSource.includes("selectedFaceId = 'sport'"), 'Watchface persistence must not own a hidden default face')
assert.ok(!watchfaceStoreSource.includes("id || 'sport'"), 'Watchface persistence must not silently repair invalid IDs')
assert.ok(!watchfaceStoreSource.includes('right_face_transition_v3'), 'Retired transition persistence must stay removed')
assert.ok(!watchfaceStoreSource.includes('getSelectedFaceId'), 'Watchface Store must not expose a second synchronous selection path')
assert.ok(!watchfaceControllerSource.includes("selectedId = 'sport'"), 'Watchface Feature must not own a hardcoded default face')
assert.ok(watchfaceControllerSource.includes('function requireFaceIds(faceIds)') && watchfaceControllerSource.includes('ids = requireFaceIds(faceIds)'), 'Watchface Feature must validate configured face IDs')
assert.ok(watchfaceControllerSource.includes('function requireAllowedFace(ids, id)') && watchfaceControllerSource.includes('selectedId = requireAllowedFace(ids, id)'), 'Watchface Feature must reject selections outside the configured set')
assert.ok(!watchfaceControllerSource.includes('faceCatalog'), 'Watchface Feature must not rebuild JSON-owned display catalog data')
assert.ok(!watchfaceControllerSource.includes('faces:'), 'Watchface Feature snapshot must stay semantic: selectedId + selectedIndex only')
assert.strictEqual(exists('src/domain/watchface/catalog.js'), false, 'Watchface display catalog must live in Surface JSON, not duplicate Domain code')
assert.ok(!watchfacePageSource.includes("selectedName: '活力数字'"), 'Watchface page must not seed visual content')

const appListSurface = require('../src/product/frontend/surfaces/applist.json')
const settingsSurface = require('../src/product/frontend/surfaces/settings__settings.json')
const notificationSurface = require('../src/product/frontend/surfaces/notification_demo.json')
const diagnosticsSurface = require('../src/product/frontend/surfaces/settings__diagnostics.json')
const clockSurface = require('../src/product/frontend/surfaces/clock.json')

assert.strictEqual(appListSurface.controller, null, 'static navigation catalog must not need a page-specific feature controller')
const appItems = appListSurface.experience.base.collection.items
assert.ok(appItems.length && appItems.every(item => item.label && item.icon && item.action), 'AppList visual/navigation catalog belongs to JSON collection items')
const settingsItems = settingsSurface.experience.base.collection.items
assert.ok(settingsItems.some(item => item.action === '/pages/settings/diagnostics'), 'Settings routes must be declared by the Surface collection')
assert.ok(notificationSurface.modules.some(module => module.actions && module.actions.tap === 'notification-demo:call'), 'Notification demo interactions must be declared by JSON')
const diagnosticsHead = diagnosticsSurface.modules.filter(module => module.id === 'head')[0]
assert.ok(diagnosticsHead && diagnosticsHead.props.trailingNullText === '读取中', 'Diagnostics loading copy must be owned by Surface JSON fallback')
assert.ok(!registrySource.includes("'读取中'") && !registrySource.includes('"读取中"'), 'Semantic controller registry must not own Diagnostics loading copy')
const capabilityModule = diagnosticsSurface.modules.filter(module => module.id === 'capabilities')[0]
assert.ok(capabilityModule.props.fields.value.map.true && capabilityModule.props.fields.value.map.false, 'Diagnostics capability status copy/color must be JSON-owned')
const circleStage = clockSurface.experience.circle.stage
const pillStage = clockSurface.experience.pill.stage
const rectStage = clockSurface.experience.rect.stage
const circleFaces = circleStage.variants
const pillFaces = pillStage.variants
const rectFaces = rectStage.variants
assert.strictEqual(circleStage.bind.variant, 'faceId', 'Circle Clock must select authored variants directly from semantic faceId')
assert.strictEqual(pillStage.bind.variant, 'faceId', 'Pill Clock must select authored variants directly from semantic faceId')
assert.strictEqual(rectStage.bind.variant, 'faceId', 'Rect Clock must select authored variants directly from semantic faceId')
assert.ok(circleFaces.sport && circleFaces.simple && circleFaces.dashboard && circleFaces.mechanical, 'Circle Clock compositions must be declared in Surface JSON')
assert.ok(pillFaces.sport && pillFaces.simple && pillFaces.dashboard && pillFaces.alpine, 'Pill Clock compositions must be declared in Surface JSON')
assert.ok(rectFaces.sport && rectFaces.simple && rectFaces.dashboard, 'Rect Clock compositions must be declared in Surface JSON')
assert.ok(!/state\.face(?:Sport|Simple|Dashboard|Mechanical|Alpine)\s*=/.test(registrySource), 'Clock registry must not duplicate faceId into unconsumed per-face booleans')
assert.ok(!registrySource.includes('#'), 'semantic controller registry must not own visual color tokens')

Object.keys(manifest.router.pages).forEach(function (route) {
  const filename = route.replace(/^pages\//, '').replace(/\//g, '__') + '.json'
  const source = read('src/product/frontend/surfaces/' + filename)
  assert.ok(/"variants"\s*:/.test(source), route + ' must keep shape differences in JSON')
})

console.log('V3 truth contracts verified: business state remains semantic while copy, color, order, interaction catalogs and shape variants belong to Surface JSON')
