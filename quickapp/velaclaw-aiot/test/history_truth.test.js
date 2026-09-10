const assert = require('assert')
const fs = require('fs')
const path = require('path')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const historySurface = require('../src/product/frontend/surfaces/history.json')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const exists = name => fs.existsSync(path.join(root, name))

const repository = read('src/domain/history/repository.js')
const controller = read('src/product/features/history/controller.js')
const page = read('src/pages/history/history.ux')

assert.strictEqual(exists('src/domain/health/recent.js'), false, 'History must not regain seeded health state')
assert.ok(repository.includes("HISTORY_KEY = 'activity_history_v3'"), 'History must use the clean V3 persistence namespace')
assert.ok(!repository.includes('makeDemoHistory'), 'History must not fabricate missing activity history')
assert.ok(!repository.includes('makeDemoHourly'), 'History must not fabricate hourly heart-rate history')
assert.ok(!repository.includes('hourlyHeartRate'), 'Retired demo hourly heart-rate state must stay removed')
assert.ok(!repository.includes("../health/recent"), 'History must not depend on seeded compatibility health data')
assert.ok(!repository.includes("'health_history_7d'"), 'V3 must not reopen the persistence namespace that may contain seeded legacy history')
assert.ok(!repository.includes("../activity/store"), 'History Repository must not act as a second Activity persistence owner')
assert.ok(!repository.includes('restoreTotals'), 'Reading History must never restore or repair current Activity totals')
assert.ok(!repository.includes('ensure:'), 'History must not retain a read-and-rewrite compatibility initializer')
assert.ok(repository.includes('History saveToday requires canonical Activity snapshot'), 'History writes must require an explicit canonical Activity snapshot')
assert.ok(repository.includes('V3 history persistence must be an array'), 'Malformed V3 history containers must fail visibly')
assert.ok(repository.includes('Invalid V3 history field:'), 'Malformed V3 history fields must fail visibly')
assert.ok(!repository.includes('finiteNumber') && !repository.includes('Number(record.'), 'History persistence must not coerce malformed record fields')
assert.ok(!/Math\.(?:min|max)\s*\(/.test(repository), 'History persistence must not clamp malformed record fields')
assert.ok(repository.includes('avgHeartRate: null'), 'History Repository must preserve unavailable heart rate as null')
assert.ok(controller.includes('heartCount ? Math.round(totalHeart / heartCount) : null'), 'History Feature must preserve unavailable aggregate heart rate as null')
assert.ok(!controller.includes('Number(item.steps)') && !controller.includes('Number(item.avgHeartRate)'), 'History Feature must trust Repository records')
assert.ok(!controller.includes('summarize: summarize'), 'History Feature must not expose its internal reducer as product API')
assert.ok(page.includes("surfacePage.bind(this, 'history')"), 'History page must bind exactly one declarative surface')
assert.ok(!page.includes('historyView') && !page.includes('historyDesign'), 'History page must not retain a parallel presentation path')
assert.strictEqual(exists('src/product/design/apps/history/view.js'), false, 'History must not retain a second editable presentation view')
assert.strictEqual(exists('src/product/design/apps/history/layout.js'), false, 'History must not retain a second editable layout recipe')

const profile = { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } }
const host = scene.resolve(profile)
const safe = scene.safe(profile, host)
const plan = surfaceRuntime.resolve(historySurface, profile, host, safe, {
  todaySteps: 5200,
  avgSteps: 4800,
  bestSteps: 7200,
  bestDate: '2026-09-08',
  avgHeartRate: null,
  goalPercent: 86,
  records: [{ date: '2026-09-08', steps: 7200 }, { date: '2026-09-10', steps: 5200 }]
})
const heartInsight = plan.flowMetricItems.filter(function (item) { return item.id === 'insights-heart' })[0]
assert.strictEqual(heartInsight.value, '--', 'null heart-rate state must become display fallback only inside JSON-driven presentation runtime')
assert.strictEqual(plan.flowMetricItems[0].value, '5,200')
assert.strictEqual(plan.flowHeaders[0].trailing, '86%')

console.log('History truth contracts verified: strict persistence, one semantic owner and one JSON presentation authority')
