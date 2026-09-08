const assert = require('assert')
const fs = require('fs')
const path = require('path')
const healthView = require('../src/v2/design/apps/heart/view')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const exists = name => fs.existsSync(path.join(root, name))

const plan = {
  chartHeight: 24,
  trendMinHeight: 6,
  trendVisual: {
    heartSpread: 20,
    spo2Spread: 4,
    stressSpread: 20,
    heartInactive: '#5A1E2A',
    heartActive: '#FF375F',
    spo2Inactive: '#153B4A',
    spo2Active: '#64D2FF',
    stressInactive: '#3B2245',
    stressActive: '#BF5AF2'
  }
}

const live = healthView.project({
  heartRate: 76,
  spo2: 98,
  stress: 22,
  heartZone: 'normal',
  spo2Zone: 'good',
  stressZone: 'relaxed',
  dailyMin: 72,
  dailyMax: 79,
  stressMin: 18,
  stressAvg: 21,
  stressMax: 25,
  heartSource: { live: true, errorCode: 0, mode: 'live' },
  spo2Source: { live: true, errorCode: 0, mode: 'live' },
  stressSource: { live: true, errorCode: 0, mode: 'live' },
  anyLive: true,
  serviceAvailable: true,
  updatedAt: new Date(2026, 8, 4, 15, 30).getTime(),
  heartValues: [72, 74, 76, 79, 76],
  spo2Values: [97, 98, 97, 99, 98],
  stressValues: [18, 22, 25, 20, 22]
}, plan)

assert.strictEqual(live.heartSource, '系统')
assert.strictEqual(live.sourceText, '系统健康数据')
assert.strictEqual(live.heartRate, 76)
assert.ok(live.heartBars.length === 5)
assert.ok(Math.max.apply(null, live.heartBars.map(item => item.height)) <= plan.chartHeight)
assert.ok(Math.min.apply(null, live.heartBars.map(item => item.height)) >= plan.trendMinHeight)

const waiting = healthView.project({
  heartRate: null,
  spo2: null,
  stress: null,
  heartZone: 'waiting',
  spo2Zone: 'waiting',
  stressZone: 'waiting',
  dailyMin: 0,
  dailyMax: 0,
  stressMin: 0,
  stressAvg: 0,
  stressMax: 0,
  heartSource: { live: false, errorCode: 0, mode: 'unavailable' },
  spo2Source: { live: false, errorCode: 0, mode: 'unavailable' },
  stressSource: { live: false, errorCode: 0, mode: 'unavailable' },
  anyLive: false,
  serviceAvailable: false,
  updatedAt: 0,
  heartValues: [], spo2Values: [], stressValues: []
}, plan)

assert.strictEqual(waiting.heartRate, '--')
assert.strictEqual(waiting.spo2, '--')
assert.strictEqual(waiting.stress, '--')
assert.strictEqual(waiting.heartSource, '等待')
assert.strictEqual(waiting.sourceText, '等待健康服务')
assert.strictEqual(waiting.heartBars.length, 0)

const controller = read('src/v2/features/health/controller.js')
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
assert.ok(!controller.includes('Number(data.heartRate)') && !controller.includes('Number(data.spo2)') && !controller.includes('Number(data.stress)'), 'Health Feature must consume canonical Capability values without repeated numeric validation')
assert.ok(!controller.includes('var heartValues = [72'), 'Health controller must not seed a fabricated trend')
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
assert.strictEqual((page.match(/class="health-stream"/g) || []).length, 1, 'Health must have one canonical stream')
assert.ok(!page.includes('isCircle') && !page.includes('isPill') && !page.includes('isRect'), 'Health presentation must not fork by form factor')
assert.ok(page.includes('width: {{ heartValueWidth }}px'), 'Health value width must come from the resolved recipe')
assert.ok(page.includes('line-height: {{ metaLineHeight }}px'), 'Health metadata must use explicit recipe line boxes')
assert.ok(page.includes('padding-bottom: {{ scrollPaddingBottom }}px'), 'Health stream tail space must come from the recipe')
assert.ok(page.includes('if="{{ ready }}"'), 'Health must not render product geometry before the recipe resolves')

console.log('Health official-data contracts verified: one canonical null/provenance path and no synthetic or datatype fallbacks')
