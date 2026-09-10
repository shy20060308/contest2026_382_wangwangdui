const assert = require('assert')
const scene = require('../src/v2/design/scene')

const health = require('../src/v2/design/apps/heart')
const history = require('../src/v2/design/apps/history')
const workoutHistory = require('../src/v2/design/apps/workout/history')

const stepsLayout = require('../src/v2/design/apps/steps/layout')
const healthLayout = require('../src/v2/design/apps/heart/layout')
const historyLayout = require('../src/v2/design/apps/history/layout')
const workoutLayout = require('../src/v2/design/apps/workout/layout')
const workoutSelectionLayout = require('../src/v2/design/apps/workout/selection_layout')
const workoutHistoryLayout = require('../src/v2/design/apps/workout/history_layout')
const settingsLayout = require('../src/v2/design/apps/settings/layout')
const launcherLayout = require('../src/v2/design/apps/launcher/layout')
const facesLayout = require('../src/v2/design/apps/faces/layout')
const todayLayout = require('../src/v2/design/apps/today/layout')
const brightnessLayout = require('../src/v2/design/apps/brightness/layout')
const vibrationLayout = require('../src/v2/design/apps/vibration/layout')
const motionLayout = require('../src/v2/design/apps/motion/layout')
const diagnosticsLayout = require('../src/v2/design/apps/diagnostics/layout')
const syncLayout = require('../src/v2/design/apps/sync/layout')

const pillProfile = {
  formFactor: 'pill',
  screenWidth: 212,
  screenHeight: 520,
  safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 }
}
const host = scene.resolve(pillProfile)
const safe = scene.safe(pillProfile, host)

function assertGridFits(total, item, count, gap, label) {
  const used = item * count + gap * (count - 1)
  assert.ok(used <= total, label + ' must not overflow its container')
  assert.ok(total - used < count, label + ' must not create a synthetic center void')
}

const healthPlan = health.resolve(pillProfile, host, safe)
assert.strictEqual(healthPlan.cardWidth, healthPlan.stream.width, 'health full-width cards must use the stream outer width')
assert.strictEqual(healthPlan.heroHeight, healthLayout.pill.heroOuterHeight, 'health hero must keep its Recipe outer height')
assert.strictEqual(healthPlan.miniHeight, healthLayout.pill.miniOuterHeight, 'health mini cards must keep their Recipe outer height')
assert.strictEqual(healthPlan.detailHeight, healthLayout.pill.detailOuterHeight, 'health detail cards must keep their Recipe outer height')
assertGridFits(healthPlan.stream.width, healthPlan.miniWidth, 2, healthPlan.cardGap, 'health two-column cards')

const historyPlan = history.resolve(pillProfile, host, safe)
assertGridFits(historyPlan.stream.width, historyPlan.summaryWidth, 2, historyPlan.summaryGap, 'history summary cards')
assertGridFits(historyPlan.stream.width, historyPlan.insightWidth, 3, historyPlan.insightGap, 'history insight cards')
assert.strictEqual(historyPlan.trendWidth, historyLayout.pill.trend.outerWidth, 'history trend card must keep its Recipe outer width')

const workoutHistoryPlan = workoutHistory.resolve(pillProfile, host, safe)
assertGridFits(workoutHistoryPlan.summary.width, workoutHistoryPlan.summaryCardWidth, 2, workoutHistoryPlan.summaryGap, 'workout history summary cards')
assert.strictEqual(workoutHistoryPlan.recordWidth, workoutHistoryPlan.stream.width, 'workout record cards must use the stream outer width')
assert.strictEqual(workoutHistoryPlan.recordHeight, workoutHistoryLayout.pill.itemHeight, 'workout record cards must keep their Recipe outer height')

const informationRadii = [
  ['steps history', stepsLayout.pill.historyRadius],
  ['steps metric', stepsLayout.pill.metricRadius],
  ['health', healthLayout.pill.cardRadius],
  ['history', historyLayout.pill.cardRadius],
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

console.log('V3 surface geometry verified: card outer boxes fill their grids and pill information surfaces remain rectangular')
