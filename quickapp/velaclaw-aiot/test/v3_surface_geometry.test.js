const assert = require('assert')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const experienceRuntime = require('../src/product/frontend/runtime/experience_runtime')

const pill = { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } }
const host = scene.resolve(pill)
const safe = scene.safe(pill, host)

function load(name) { return require('../src/product/frontend/surfaces/' + name + '.json') }
function resolve(name, state) {
  const value = load(name)
  const model = state || {}
  const plan = surfaceRuntime.resolve(value, pill, host, safe, model)
  return experienceRuntime.decorate(plan, value, pill, host, safe, model)
}
function fit(items, width, label) {
  items.forEach(function (item) {
    assert.ok(item.frame.left >= 0, label + ' must not start outside the stream')
    assert.ok(item.frame.width >= 0, label + ' width must be non-negative')
    assert.ok(item.frame.left + item.frame.width <= width, label + ' must fit stream width')
  })
}
function fitScene(frame, label) {
  assert.ok(frame.left >= 0 && frame.top >= 0, label + ' must start inside the Host Scene')
  assert.ok(frame.width >= 0 && frame.height >= 0, label + ' dimensions must be non-negative')
  assert.ok(frame.left + frame.width <= host.width, label + ' must fit Host Scene width')
  assert.ok(frame.top + frame.height <= host.height, label + ' must fit Host Scene height')
}

const appList = resolve('applist', {})
assert.ok(appList.collection, 'L3 AppList must resolve a collection experience')
assert.strictEqual(appList.collection.mode, 'paged-list', 'Pill AppList must preserve its L3 paged-list surface')
fitScene(appList.collection.frame, 'AppList collection')
const appTokens = appList.collection.tokens
assert.ok(appTokens.contentLeft + appTokens.contentWidth <= appList.collection.frame.width, 'AppList content must fit its independent collection frame')
assert.ok(appTokens.contentTop + appTokens.contentHeight <= appList.collection.frame.height, 'AppList content height must fit its independent collection frame')
assert.ok(appTokens.pagerLeft + appTokens.pagerWidth <= appList.collection.frame.width, 'AppList pager must fit its independent collection frame')
assert.ok(appTokens.pagerTop + appTokens.pagerHeight <= appList.collection.frame.height, 'AppList pager must fit its independent collection frame')
assert.ok(appTokens.itemRadius <= 14, 'Pill AppList rows must remain rectangular')

const watchface = resolve('watchface', { selectedId: 'sport', selectedIndex: 0 })
assert.ok(watchface.collection, 'L3 Watchface must resolve a visual collection experience')
assert.strictEqual(watchface.collection.mode, 'cards-pager', 'Pill Watchface must preserve its L3 cards-pager surface')
fitScene(watchface.collection.frame, 'Watchface collection')
const faceTokens = watchface.collection.tokens
assert.ok(faceTokens.headerLeft + faceTokens.headerWidth <= watchface.collection.frame.width, 'Watchface header must fit its independent collection frame')
assert.ok(faceTokens.contentLeft + faceTokens.contentWidth <= watchface.collection.frame.width, 'Watchface cards must fit its independent collection frame')
assert.ok(faceTokens.contentTop + faceTokens.contentHeight <= watchface.collection.frame.height, 'Watchface cards must fit vertically')
assert.ok(faceTokens.pagerLeft + faceTokens.pagerWidth <= watchface.collection.frame.width, 'Watchface pager must fit its independent collection frame')
assert.ok(faceTokens.pagerTop + faceTokens.pagerHeight <= watchface.collection.frame.height, 'Watchface pager must fit vertically')
assert.ok(faceTokens.cardRadius <= 14, 'Pill watchface cards must remain information cards rather than capsules')

const diagnostics = resolve('settings__diagnostics', {
  device: { model: 'demo', formFactor: 'pill', screenWidth: 212, screenHeight: 520, platformVersionCode: 1000 },
  host: { width: host.width, height: host.height },
  capabilities: [
    { id: 'motion', name: '加速度计', api: 'motion.subscribe', available: true },
    { id: 'health', name: '健康服务', api: 'heartRate.subscribe', available: false },
    { id: 'battery', name: '电池状态', api: 'battery.get', available: true },
    { id: 'storage', name: '本地存储', api: 'storage.get / set', available: true }
  ]
})
fit(diagnostics.flowMetricItems, diagnostics.stream.width, 'Diagnostics metric')

const autoState = { brightnessValue: 128, autoBrightness: true, raiseWakeEnabled: true, lowPowerEnabled: true }
const brightness = resolve('settings__brightness', autoState)
fit(brightness.flowButtons, brightness.stream.width, 'Brightness action')
brightness.flowButtons.forEach(item => assert.strictEqual(typeof item.tokens.radius, 'number', 'Brightness action radius must be JSON-owned'))
assert.strictEqual(brightness.sliders.length, 1, 'Brightness must expose one shared L1 slider')
fitScene(brightness.sliders[0].frame, 'Brightness slider')
assert.strictEqual(brightness.sliders[0].value, 128, 'Brightness slider must project semantic state without changing its meaning')

const notification = resolve('notification_demo', { homeVisible: true, appVisible: false, callVisible: false, hangupVisible: false })
fit(notification.flowButtons, notification.stream.width, 'Notification action')

const clock = resolve('clock', {
  clockVisible: true, sleepVisible: false,
  faceSport: false, faceSimple: false, faceDashboard: true, faceMechanical: false, faceAlpine: false,
  notificationAppVisible: false, notificationCallVisible: false,
  faceId: 'dashboard', powerMode: 'ACTIVE', timestamp: Date.now(), steps: 5200, currentHeartRate: 76, goalPercent: 52, batteryPercent: 88
})
fit(clock.flowMetricItems, clock.stream.width, 'Clock metric')
fit(clock.flowButtons, clock.stream.width, 'Clock action')
assert.strictEqual(clock.gestures.up, '/pages/applist', 'Clock L3 gesture surface must survive geometry resolution')

const cells = []
for (let i = 0; i < 42; i++) cells.push({ key: 'c' + i, day: (i % 31) + 1, inMonth: i >= 3 && i < 34, isToday: i === 10 })
const today = resolve('today', { summaryOpen: false, calendarOpen: true, calendarYear: 2026, calendarMonth: 8, calendarCells: cells })
const calendar = today.flowMetricItems.filter(item => item.id.indexOf('calendarGrid-') === 0)
assert.strictEqual(calendar.length, 42)
fit(calendar, today.stream.width, 'Today calendar cell')
assert.strictEqual(calendar[10].tokens.itemBackground, '#0A84FF', 'Today highlight geometry/style must remain JSON-owned')

const workout = resolve('workout', { confirming: false, type: 'run', status: 'running', durationMs: 65000, steps: 420, calories: 31, distanceMeters: 720, currentHeartRate: 136, gpsStatus: 'active' })
fit(workout.flowMetricItems, workout.stream.width, 'Workout metric')
fit(workout.flowButtons, workout.stream.width, 'Workout action')

console.log('V3 surface geometry verified: L1/L2 shared streams and L3 independent collection frames stay inside authored geometry')
