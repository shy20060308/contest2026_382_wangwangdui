const assert = require('assert')
const fs = require('fs')
const path = require('path')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const healthSurface = require('../src/product/frontend/surfaces/heartrate.json')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const exists = name => fs.existsSync(path.join(root, name))

const profile = { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } }
const host = scene.resolve(profile)
const safe = scene.safe(profile, host)

const live = surfaceRuntime.resolve(healthSurface, profile, host, safe, {
  heartRate: 76,
  spo2: 98,
  stress: 22,
  heartZone: 'normal',
  spo2Zone: 'good',
  stressZone: 'relaxed',
  summaryState: 'stable',
  sourceState: 'live',
  updatedAt: new Date(2026, 8, 4, 15, 30).getTime(),
  heartValues: [72, 74, 76, 79, 76],
  spo2Values: [97, 98, 97, 99, 98],
  stressValues: [18, 22, 25, 20, 22]
})

const heartCard = live.flowChartCards.filter(function (card) { return card.id === 'heart' })[0]
const heartBars = live.flowColumnBars.filter(function (bar) { return bar.id.indexOf('heart-column-') === 0 })
assert.strictEqual(live.flowHeaders[0].subtitleTrailing, '系统健康数据')
assert.strictEqual(live.flowHeaders[0].trailing, '状态平稳')
assert.strictEqual(heartCard.value, '76')
assert.strictEqual(heartCard.status, '正常')
assert.strictEqual(heartCard.statusColor, '#30D158')
assert.strictEqual(heartBars.length, 5)
assert.ok(Math.max.apply(null, heartBars.map(function (item) { return item.barHeight })) <= heartCard.tokens.chartHeight)
assert.ok(Math.min.apply(null, heartBars.map(function (item) { return item.barHeight })) >= heartCard.tokens.barMinHeight)

const waiting = surfaceRuntime.resolve(healthSurface, profile, host, safe, {
  heartRate: null,
  spo2: null,
  stress: null,
  heartZone: 'waiting',
  spo2Zone: 'waiting',
  stressZone: 'waiting',
  summaryState: 'waiting-service',
  sourceState: 'waiting-service',
  updatedAt: 0,
  heartValues: [], spo2Values: [], stressValues: []
})
const waitingHeart = waiting.flowChartCards.filter(function (card) { return card.id === 'heart' })[0]
assert.strictEqual(waitingHeart.value, '--')
assert.strictEqual(waiting.flowMetricItems[0].value, '--')
assert.strictEqual(waiting.flowMetricItems[1].value, '--')
assert.strictEqual(waiting.flowHeaders[0].subtitleTrailing, '等待健康服务')
assert.strictEqual(waiting.flowHeaders[0].trailing, '等待健康服务')
assert.strictEqual(waiting.flowColumnBars.length, 0)

const controller = read('src/product/features/health/controller.js')
const store = read('src/domain/health/store.js')
const page = read('src/pages/heartrate/heartrate.ux')
const healthChannel = read('src/capabilities/internal/health_channel.js')
const heartCapability = read('src/capabilities/heart_rate.js')
const spo2Capability = read('src/capabilities/blood_oxygen.js')
const stressCapability = read('src/capabilities/stress.js')
assert.strictEqual(exists('src/domain/health/recent.js'), false, 'Official Health must not retain seeded compatibility samples')
assert.ok(controller.includes("data[prefix + 'Source'] === 'live'"), 'Health controller must only promote official system samples into visible metric state')
assert.ok(controller.includes('healthMetrics.isHeartRate') && controller.includes('healthMetrics.isSpo2') && controller.includes('healthMetrics.isStress'), 'Health Feature must use the Domain as the single semantic validator')
assert.ok(controller.includes('heartAvailable ? data.heartRate : null'), 'Unavailable heart rate must remain null through the Feature layer')
assert.ok(controller.includes('spo2Available ? data.spo2 : null'), 'Unavailable SpO2 must remain null through the Feature layer')
assert.ok(controller.includes('semanticSummaryState'), 'Health Feature may expose semantic state keys but not display copy or colors')
assert.ok(!controller.includes('#FF') && !controller.includes('#30D158') && !controller.includes('状态平稳') && !controller.includes('有指标需关注'), 'Health Feature must not own presentation tokens or user-facing status copy')
assert.ok(!controller.includes('Number(data.heartRate)') && !controller.includes('Number(data.spo2)') && !controller.includes('Number(data.stress)'), 'Health Feature must consume canonical Capability values without repeated numeric validation')
assert.ok(!controller.includes('var heartValues = [72'), 'Health controller must not seed a fabricated trend')
assert.ok(!controller.includes('seedCurrent'), 'Health controller must not seed and append the same initial live sample through two paths')
assert.ok(controller.includes('healthMetrics.pushObservedWindow'), 'Health windows must use the de-duplicating observed-sample rule')
assert.ok(!controller.includes('dailyMin') && !controller.includes('dailyMax'), 'Recent in-memory samples must not be labeled as daily statistics')
assert.ok(controller.includes('recentHeartMin') && controller.includes('recentHeartMax'), 'Recent in-memory statistics must be named honestly')
assert.ok(!controller.includes('historyRepository.loadHourlyHeartRate'), 'Health must not pull demo-backed hourly history into the official data surface')
assert.ok(store.includes('heartRateSource: heart.source'), 'Health store must preserve capability source provenance')
assert.ok(!store.includes("metrics : ['heartRate']"), 'Health Store must not silently default an unspecified subscription to heart rate')
assert.ok(!healthChannel.includes('fallbackTimer') && !healthChannel.includes('fallbackValue'), 'Health capability runtime must not synthesize fallback measurements')
assert.ok(!healthChannel.includes('fallbackDataType'), 'Health capability runtime must not guess numeric data type IDs')
assert.ok(!healthChannel.includes('getLatest:') && !healthChannel.includes('consumerCount:') && !healthChannel.includes('isActive:'), 'Health capability runtime must expose only APIs with real consumers')
;[heartCapability, spo2Capability, stressCapability].forEach(function (source) {
  assert.ok(!source.includes('initialValue'), 'Health metric capabilities must not seed fabricated values')
  assert.ok(!source.includes('fallbackValue'), 'Health metric capabilities must not generate fabricated values')
  assert.ok(!source.includes('fallbackInterval'), 'Health metric capabilities must not run synthetic measurement timers')
  assert.ok(!source.includes('fallbackDataType'), 'Health metric capabilities must not retain numeric enum compatibility fallbacks')
})
assert.ok(page.includes("var surface = require('../../product/frontend/surfaces/heartrate.json')"), 'Health page must load its page-local declarative surface')
assert.ok(page.includes('surfacePage.bind(this, surface)'), 'Health page must bind the page-local Surface object exactly once through the generic runtime')
assert.strictEqual((page.match(/surfacePage\.bind\(/g) || []).length, 1, 'Health page must bind exactly one declarative surface')
assert.ok(!page.includes('healthView') && !page.includes('healthDesign'), 'Health page must not retain a parallel visual projection')
assert.strictEqual(exists('src/product/design/apps/heart/view.js'), false, 'Health must not retain a second editable presentation view')
assert.strictEqual(exists('src/product/design/apps/heart/layout.js'), false, 'Health must not retain a second editable layout recipe')
assert.strictEqual(healthSurface.modules[1].props.statusMap.normal.text, '正常', 'health status copy must be JSON-owned')
assert.strictEqual(healthSurface.modules[1].props.statusMap.normal.color, '#30D158', 'health status color must be JSON-owned')

console.log('Health official-data contracts verified: canonical semantic state feeds one page-local JSON presentation authority')
