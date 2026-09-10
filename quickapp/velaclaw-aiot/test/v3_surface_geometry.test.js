const assert = require('assert')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')

const stepsSurface = require('../src/product/frontend/surfaces/steps.json')
const healthSurface = require('../src/product/frontend/surfaces/heartrate.json')
const historySurface = require('../src/product/frontend/surfaces/history.json')
const workoutHistory = require('../src/product/design/apps/workout/history')
const workoutLayout = require('../src/product/design/apps/workout/layout')
const workoutSelectionLayout = require('../src/product/design/apps/workout/selection_layout')
const workoutHistoryLayout = require('../src/product/design/apps/workout/history_layout')
const settingsLayout = require('../src/product/design/apps/settings/layout')
const launcherLayout = require('../src/product/design/apps/launcher/layout')
const facesLayout = require('../src/product/design/apps/faces/layout')
const todayLayout = require('../src/product/design/apps/today/layout')
const brightnessLayout = require('../src/product/design/apps/brightness/layout')
const vibrationLayout = require('../src/product/design/apps/vibration/layout')
const motionLayout = require('../src/product/design/apps/motion/layout')
const diagnosticsLayout = require('../src/product/design/apps/diagnostics/layout')
const syncLayout = require('../src/product/design/apps/sync/layout')

const pillProfile = {
  formFactor: 'pill',
  screenWidth: 212,
  screenHeight: 520,
  safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 }
}
const host = scene.resolve(pillProfile)
const safe = scene.safe(pillProfile, host)

function assertGridFramesFit(total, items, label) {
  const right = Math.max.apply(null, items.map(function (item) { return item.frame.left + item.frame.width }))
  const left = Math.min.apply(null, items.map(function (item) { return item.frame.left }))
  assert.ok(left >= 0, label + ' must stay inside the stream')
  assert.ok(right <= total, label + ' must not overflow its stream')
}

const healthPlan = surfaceRuntime.resolve(healthSurface, pillProfile, host, safe, {
  heartRate: 76, spo2: 98, stress: 22,
  heartZone: 'normal', spo2Zone: 'good', stressZone: 'normal',
  summaryState: 'stable', sourceState: 'live', updatedAt: Date.now(),
  heartValues: [72, 74, 76], spo2Values: [97, 98, 98], stressValues: [18, 21, 22]
})
const heartCard = healthPlan.flowChartCards.filter(function (card) { return card.id === 'heart' })[0]
assert.strictEqual(heartCard.frame.width, healthPlan.stream.width, 'health hero must use the full stream outer width')
assert.strictEqual(heartCard.frame.height, healthSurface.variants.pill.modules.heart.height, 'health hero outer height must be JSON-owned')
assert.strictEqual(heartCard.tokens.radius, 11, 'pill health card radius must remain rectangular')
assertGridFramesFit(healthPlan.stream.width, healthPlan.flowMetricItems, 'health mini cards')
assert.strictEqual(healthPlan.flowMetricItems[1].frame.left - (healthPlan.flowMetricItems[0].frame.left + healthPlan.flowMetricItems[0].frame.width), 9, 'health mini gap must be exactly the JSON grid gap')

const historyPlan = surfaceRuntime.resolve(historySurface, pillProfile, host, safe, {
  todaySteps: 5200, avgSteps: 4800, bestSteps: 7200, bestDate: '2026-09-08', avgHeartRate: 76, goalPercent: 86,
  records: [{ date: '2026-09-08', steps: 7200 }, { date: '2026-09-09', steps: 4200 }, { date: '2026-09-10', steps: 5200 }]
})
const summaries = historyPlan.flowMetricItems.filter(function (item) { return item.id.indexOf('summary-') === 0 })
const insights = historyPlan.flowMetricItems.filter(function (item) { return item.id.indexOf('insights-') === 0 })
assertGridFramesFit(historyPlan.stream.width, summaries, 'history summary cards')
assertGridFramesFit(historyPlan.stream.width, insights, 'history insight cards')
assert.strictEqual(summaries[1].frame.left - (summaries[0].frame.left + summaries[0].frame.width), 9, 'history summary gap must come from JSON')
assert.strictEqual(historyPlan.flowChartCards[0].frame.width, 168, 'pill history trend must preserve its declared outer width')
assert.strictEqual(historyPlan.flowChartCards[0].tokens.radius, 9)
assert.ok(historyPlan.flowChartCards[0].frame.height < 190, 'row history height must shrink to actual record count instead of leaving a fixed empty card')

const workoutHistoryPlan = workoutHistory.resolve(pillProfile, host, safe)
assert.strictEqual(workoutHistoryPlan.recordWidth, workoutHistoryPlan.stream.width, 'workout record cards must use the stream outer width')
assert.strictEqual(workoutHistoryPlan.recordHeight, workoutHistoryLayout.pill.itemHeight, 'workout record cards must keep their Recipe outer height')

const stepsPill = stepsSurface.variants.pill.modules
const informationRadii = [
  ['steps history', stepsPill.history.radius],
  ['steps metric', stepsPill.metrics.itemRadius],
  ['health', healthSurface.variants.pill.modules.heart.radius],
  ['history', historySurface.variants.pill.modules.trend.radius],
  ['workout', workoutLayout.pill.radius],
  ['workout selector', workoutSelectionLayout.pill.cardRadius],
  ['workout selector action', workoutSelectionLayout.pill.actionRadius],
  ['workout history', workoutHistoryLayout.pill.radius],
  ['settings row', settingsLayout.pill.chrome.itemRadius],
  ['launcher row', launcherLayout.pill.itemRadius],
  ['watchface card', facesLayout.pill.chrome.pill.cardRadius],
  ['today date hero', todayLayout.pill.summary.dateHero.radius],
  ['today metric card', todayLayout.pill.summary.card.radius],
  ['today calendar card', todayLayout.pill.calendar.card.radius],
  ['brightness', brightnessLayout.pill.cardRadius],
  ['vibration', vibrationLayout.pill.cardRadius],
  ['motion', motionLayout.pill.cardRadius],
  ['diagnostics', diagnosticsLayout.pill.cardRadius],
  ['sync', syncLayout.pill.cardRadius]
]

informationRadii.forEach(function (entry) {
  assert.ok(entry[1] <= 14, entry[0] + ' is an information surface and must not become a capsule')
})

console.log('V3 surface geometry verified: migrated JSON grids fill their streams and pill information surfaces remain rectangular')
