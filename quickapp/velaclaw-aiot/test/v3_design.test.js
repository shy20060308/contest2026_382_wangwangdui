const assert = require('assert')
const fs = require('fs')
const path = require('path')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')

const root = path.resolve(__dirname, '..')
const surfacesRoot = path.join(root, 'src', 'product', 'frontend', 'surfaces')
const manifest = require('../src/manifest.json')
const allowedTypes = new Set([
  'header', 'text', 'metric-card', 'metric-pair', 'metric-grid', 'metric-list', 'chart-card',
  'progress-card', 'list', 'grid', 'calendar', 'button', 'slider', 'status', 'dialog',
  'image', 'watchface-preview', 'honeycomb', 'spacer'
])

function filename(route) { return route.replace(/^pages\//, '').replace(/\//g, '__') + '.json' }
function surface(route) { return require(path.join(surfacesRoot, filename(route))) }

const routes = Object.keys(manifest.router.pages)
assert.strictEqual(fs.readdirSync(surfacesRoot).filter(name => name.endsWith('.json')).length, routes.length, 'Surface JSON count must equal manifest route count')

routes.forEach(function (route) {
  const value = surface(route)
  assert.strictEqual(value.schemaVersion, 1)
  assert.strictEqual(value.route, route)
  assert.strictEqual(value.renderer, 'surface-v1')
  assert.ok(value.id && typeof value.id === 'string')
  assert.ok(value.controller === null || typeof value.controller === 'string')
  assert.ok(Array.isArray(value.modules))
  assert.ok(value.tokens && typeof value.tokens === 'object')
  ;['base', 'circle', 'pill', 'rect'].forEach(function (shape) {
    assert.ok(value.variants && value.variants[shape] && typeof value.variants[shape] === 'object', route + ' must explicitly declare ' + shape + ' variant')
  })
  const ids = new Set()
  value.modules.forEach(function (module) {
    assert.ok(module.id && !ids.has(module.id), route + ' module ids must be unique')
    ids.add(module.id)
    assert.ok(allowedTypes.has(module.type), route + ' uses unknown generic primitive ' + module.type)
  })
})

const profiles = {
  circle: { formFactor: 'circle', screenWidth: 466, screenHeight: 466, safeInsets: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 } },
  pill: { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
  rect: { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
}
function resolve(value, profile, state) {
  const host = scene.resolve(profile)
  const safe = scene.safe(profile, host)
  return surfaceRuntime.resolve(value, profile, host, safe, state || {})
}

Object.keys(profiles).forEach(function (shape) {
  const profile = profiles[shape]

  const appListSurface = surface('pages/applist')
  const appList = resolve(appListSurface, profile, {})
  assert.ok(appList.collection, 'AppList must resolve through the generic collection experience')
  assert.strictEqual(appList.collection.items.length, 12, 'AppList collection must preserve all accepted product entries')
  assert.strictEqual(appList.collection.items[0].action, '/pages/workout_select')
  const expectedMode = shape === 'circle' ? 'honeycomb' : (shape === 'pill' ? 'paged-list' : 'designed-grid')
  assert.strictEqual(appList.collection.mode, expectedMode, 'AppList must preserve the intended ' + shape + ' composition')

  const watchface = resolve(surface('pages/watchface'), profile, { selectedId: 'sport', selectedIndex: 0 })
  assert.strictEqual(watchface.flowHeaders[0].trailing, '活力数字')
  assert.ok(watchface.flowButtons.some(item => item.action === 'watchface-select:alpine'))

  const diagnostics = resolve(surface('pages/settings/diagnostics'), profile, {
    device: { model: 'demo', formFactor: shape, screenWidth: profile.screenWidth, screenHeight: profile.screenHeight, platformVersionCode: 1000 },
    host: { width: 192, height: shape === 'pill' ? 471 : 192 },
    capabilities: [
      { id: 'motion', name: '加速度计', api: 'motion.subscribe', available: true },
      { id: 'health', name: '健康服务', api: 'heartRate.subscribe', available: false }
    ]
  })
  assert.strictEqual(diagnostics.flowMetricItems.filter(item => item.id.indexOf('capabilities-') === 0)[0].value, '接口存在')
  assert.strictEqual(diagnostics.flowMetricItems.filter(item => item.id.indexOf('capabilities-') === 0)[1].value, '接口缺失')

  const notificationHome = resolve(surface('pages/notification_demo'), profile, { homeVisible: true, appVisible: false, callVisible: false, hangupVisible: false })
  assert.deepStrictEqual(notificationHome.flowButtons.slice(0, 3).map(item => item.action), ['notification-demo:sms', 'notification-demo:call', 'notification-demo:app'])

  const brightness = resolve(surface('pages/settings/brightness'), profile, { brightnessValue: 128, autoBrightness: false, raiseWakeEnabled: true, lowPowerEnabled: false })
  assert.strictEqual(brightness.flowHeaders[0].trailing, '手动')
  assert.ok(brightness.flowButtons.some(item => item.action === 'brightness-toggle-low-power'))
  assert.ok(brightness.sliders && brightness.sliders.length === 1, 'Brightness must resolve the declarative direct-manipulation slider')

  const clock = resolve(surface('pages/clock'), profile, {
    clockVisible: true, sleepVisible: false,
    faceSport: true, faceSimple: false, faceDashboard: false, faceMechanical: false, faceAlpine: false,
    notificationAppVisible: false, notificationCallVisible: false,
    faceId: 'sport', powerMode: 'ACTIVE', timestamp: new Date(2026, 8, 11, 8, 30).getTime(),
    steps: 5200, currentHeartRate: 76, goalPercent: 52, batteryPercent: 88
  })
  assert.strictEqual(clock.flowHeaders[0].trailing, '活力数字')
  assert.strictEqual(clock.flowTexts.filter(item => item.id === 'sportTime')[0].text, '08:30')
  assert.deepStrictEqual(clock.flowMetricItems.filter(item => item.id.indexOf('sportMetrics-') === 0).map(item => item.value), ['5,200', '76', '52%', '88%'])
  assert.strictEqual(clock.gestures.up, '/pages/applist', 'Clock must expose JSON-authored gesture navigation')
})

console.log('V3 design verified: all manifest routes are authored as Surface JSON and representative surfaces resolve on Circle/Pill/Rect')
