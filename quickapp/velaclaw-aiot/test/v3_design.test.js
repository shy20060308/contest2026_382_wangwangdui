const assert = require('assert')
const adapter = require('../src/product/design/adapter')
const difference = require('../src/product/design/difference')
const scene = require('../src/product/design/scene')
const watchfaceChart = require('../src/product/design/watchface_chart')
const launcherView = require('../src/product/design/apps/launcher/view')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const stepsSurface = require('../src/product/frontend/surfaces/steps.json')
const historySurface = require('../src/product/frontend/surfaces/history.json')
const healthSurface = require('../src/product/frontend/surfaces/heartrate.json')
const workoutSelectSurface = require('../src/product/frontend/surfaces/workout_select.json')
const workoutSurface = require('../src/product/frontend/surfaces/workout.json')
const workoutHistorySurface = require('../src/product/frontend/surfaces/workout_history.json')
const todaySurface = require('../src/product/frontend/surfaces/today.json')

const pendingDesigns = [
  require('../src/product/design/apps/launcher'),
  require('../src/product/design/apps/clock'),
  require('../src/product/design/apps/faces'),
  require('../src/product/design/apps/settings'),
  require('../src/product/design/apps/notification'),
  require('../src/product/design/apps/brightness'),
  require('../src/product/design/apps/vibration'),
  require('../src/product/design/apps/motion'),
  require('../src/product/design/apps/diagnostics'),
  require('../src/product/design/apps/sync')
]

const profiles = [
  { formFactor: 'circle', screenWidth: 466, screenHeight: 466, safeInsets: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 } },
  { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
  { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
]

assert.strictEqual(adapter.SYSTEM_ID, 'recipe-translator-v3.0')
assert.strictEqual(adapter.VERSION, '3.0')
assert.strictEqual(typeof adapter.clamp, 'undefined')
assert.strictEqual(typeof adapter.shapeOf, 'undefined', 'Adapter must not duplicate Device Profile shape validation')
assert.deepStrictEqual(difference.describe(difference.L1), { level: 1, id: 'L1', kind: 'shared-expression' })
assert.deepStrictEqual(difference.describe(difference.L2), { level: 2, id: 'L2', kind: 'local-expression' })
assert.deepStrictEqual(difference.describe(difference.L3), { level: 3, id: 'L3', kind: 'independent-surface' })
assert.throws(function () { difference.describe(99) }, /Unknown V3 difference level/)

const circleHost = scene.resolve(profiles[0])
const circleSafe = scene.safe(profiles[0], circleHost)
assert.deepStrictEqual(circleSafe, { left: 0, top: 10, right: 192, bottom: 182, width: 192, height: 172, gestureBar: 0 })
const translated = adapter.placeBand(profiles[0], circleHost, circleSafe, { top: 14, width: 120, height: 22 })
assert.deepStrictEqual(translated, { left: 36, top: 24, width: 120, height: 22 })
assert.deepStrictEqual(adapter.contentBox(82, 58, 7, 6), { width: 68, height: 46 })
assert.strictEqual(watchfaceChart.sampleBarHeight([80, 90, 100], 1, 2, 10, 20), 6)

assert.throws(function () { adapter.contentWidth(profiles[0], { base: {} }) }, /recipe\.contentWidth/)
assert.throws(function () { adapter.grid({ width: 100 }, undefined, 0) }, /grid\.columns/)
assert.throws(function () { adapter.region('1', 0, 10, 10) }, /region\.left/)
assert.throws(function () { adapter.createPlan(profiles[0], circleHost, circleSafe, undefined, 'test') }, /Unknown V3 difference level/)
assert.throws(function () { adapter.createPlan(profiles[0], circleHost, circleSafe, difference.L1, '') }, /recipe\.surface/)

const launcherState = {
  all: ['workout','history','heart','clock','steps'],
  items: ['workout','history','heart','clock','steps'],
  pageNumber: 1,
  pageCount: 1,
  hasPrevious: false,
  hasNext: false
}
const launcherProjection = launcherView.project(launcherState, { columns: 3, gap: 6 })
assert.deepStrictEqual(launcherProjection.gridApps.map(function (item) { return item.marginRight }), [6, 6, 0, 6, 6], 'Launcher grid columns must come from the resolved Recipe')
assert.deepStrictEqual(launcherProjection.gridApps.map(function (item) { return item.marginBottom }), [6, 6, 6, 0, 0], 'Launcher grid row spacing must derive from the resolved column count')

profiles.forEach(function (profile) {
  const host = scene.resolve(profile)
  const safe = scene.safe(profile, host)
  assert.ok(safe.width > 0 && safe.height > 0, profile.formFactor + ' profile must declare usable content space')

  pendingDesigns.forEach(function (design) {
    assert.ok([difference.L1, difference.L2, difference.L3].includes(design.differenceLevel), 'pending Recipe must declare an L1/L2/L3 difference level')
    const plan = design.resolve(profile, host, safe)
    assert.ok(plan && plan.designSystemVersion === '3.0', 'pending Recipe must resolve through V3 for ' + profile.formFactor)
    assert.strictEqual(plan.differenceLevel, design.differenceLevel)
    assert.deepStrictEqual(plan.difference, difference.describe(design.differenceLevel))
    assert.strictEqual(plan.shape, profile.formFactor)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(plan, 'freedom'), false)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(plan, 'freedomLevel'), false)
  })

  const stepsPlan = surfaceRuntime.resolve(stepsSurface, profile, host, safe, {
    metrics: [
      { id: 'stand', current: 6, goal: 12 },
      { id: 'steps', current: 5000, goal: 10000 },
      { id: 'calories', current: 300, goal: 600 }
    ]
  })
  assert.strictEqual(stepsPlan.id, 'steps')
  assert.strictEqual(stepsPlan.shape, profile.formFactor)
  assert.deepStrictEqual(stepsPlan.metricList.items.map(function (item) { return item.id }), ['steps', 'calories', 'stand'], 'JSON item declaration must own metric order')
  assert.strictEqual(stepsPlan.metricList.items[0].progressText, '50%', 'JSON copy template must own progress presentation')

  const historyPlan = surfaceRuntime.resolve(historySurface, profile, host, safe, {
    todaySteps: 5200,
    avgSteps: 4800,
    bestSteps: 7200,
    bestDate: '2026-09-08',
    avgHeartRate: 76,
    goalPercent: 86,
    records: [
      { date: '2026-09-08', steps: 7200 },
      { date: '2026-09-09', steps: 4200 },
      { date: '2026-09-10', steps: 5200 }
    ]
  })
  assert.strictEqual(historyPlan.id, 'history')
  assert.deepStrictEqual(historyPlan.modules.map(function (module) { return module.id }), ['head', 'summary', 'trend', 'insights'])
  assert.strictEqual(historyPlan.flowMetricItems[0].label, '今日步数')
  assert.strictEqual(historyPlan.flowMetricItems[0].value, '5,200')
  assert.strictEqual(historyPlan.flowMetricItems[3].value, '76 bpm')
  assert.strictEqual(historyPlan.flowChartCards.length, 1)

  const healthPlan = surfaceRuntime.resolve(healthSurface, profile, host, safe, {
    heartRate: 76,
    spo2: 98,
    stress: 22,
    heartZone: 'normal',
    spo2Zone: 'good',
    stressZone: 'relaxed',
    summaryState: 'stable',
    sourceState: 'live',
    updatedAt: new Date(2026, 8, 10, 15, 30).getTime(),
    heartValues: [72, 74, 76],
    spo2Values: [97, 99, 98],
    stressValues: [18, 25, 22]
  })
  assert.strictEqual(healthPlan.id, 'heartrate')
  assert.deepStrictEqual(healthPlan.modules.map(function (module) { return module.id }), ['head', 'heart', 'mini', 'spo2Trend', 'stressTrend', 'updated'])
  assert.strictEqual(healthPlan.flowHeaders[0].trailing, '状态平稳')
  assert.strictEqual(healthPlan.flowHeaders[0].trailingColor, '#30D158')
  assert.strictEqual(healthPlan.flowMetricItems[0].value, '98%')
  assert.strictEqual(healthPlan.flowMetricItems[0].detail, '良好')
  assert.strictEqual(healthPlan.flowChartCards.length, 3)

  const selectionPlan = surfaceRuntime.resolve(workoutSelectSurface, profile, host, safe, { modeTypes: ['walk', 'run'], hasActive: true })
  assert.strictEqual(selectionPlan.id, 'workout-select')
  assert.deepStrictEqual(selectionPlan.flowMenuItems.map(function (item) { return item.title }), ['步行', '跑步'])
  assert.deepStrictEqual(selectionPlan.flowMenuItems.map(function (item) { return item.action }), ['workout-select:walk', 'workout-select:run'])
  assert.ok(selectionPlan.flowButtons.some(function (item) { return item.id === 'continue' }), 'active workout must expose the JSON continue action')

  const workoutPlan = surfaceRuntime.resolve(workoutSurface, profile, host, safe, {
    confirming: false,
    type: 'run',
    status: 'running',
    durationMs: 65000,
    steps: 420,
    calories: 31,
    distanceMeters: 720,
    currentHeartRate: 136,
    gpsStatus: 'active'
  })
  assert.strictEqual(workoutPlan.id, 'workout')
  assert.strictEqual(workoutPlan.flowHeaders[0].trailing, '跑步')
  assert.strictEqual(workoutPlan.flowHeaders[0].subtitleTrailing, '运动中')
  assert.strictEqual(workoutPlan.flowTexts[0].text, '01:05')
  assert.deepStrictEqual(workoutPlan.flowMetricItems.map(function (item) { return item.value }), ['420', '31', '720 m', '136'])
  assert.strictEqual(workoutPlan.flowButtons.filter(function (item) { return item.id === 'pause' })[0].copy.title, '暂停')

  const confirmPlan = surfaceRuntime.resolve(workoutSurface, profile, host, safe, { confirming: true })
  assert.deepStrictEqual(confirmPlan.modules.map(function (module) { return module.id }), ['confirmCard', 'confirmCancel', 'confirmSave'])

  const workoutHistoryPlan = surfaceRuntime.resolve(workoutHistorySurface, profile, host, safe, {
    totalSteps: 420,
    recordCount: 1,
    empty: false,
    hasRecords: true,
    records: [{ id: 'r1', type: 'run', synced: false, startTime: new Date(2026, 8, 10, 9, 30).getTime(), durationSec: 65, steps: 420, distanceMeters: 720, calories: 31, avgHeartRate: 136 }]
  })
  assert.strictEqual(workoutHistoryPlan.id, 'workout-history')
  assert.strictEqual(workoutHistoryPlan.flowMetricItems[0].value, '1')
  assert.strictEqual(workoutHistoryPlan.flowMetricItems[1].value, '420')
  assert.strictEqual(workoutHistoryPlan.flowRecordItems[0].title, '跑步')
  assert.strictEqual(workoutHistoryPlan.flowRecordItems[0].trailing, '待同步')
  assert.strictEqual(workoutHistoryPlan.flowRecordItems[0].metric1, '420 步')

  const todaySummary = surfaceRuntime.resolve(todaySurface, profile, host, safe, {
    summaryOpen: true, calendarOpen: false,
    currentDay: 10, currentWeekday: 4, currentMonth: 8,
    lunarText: '农历七月廿九', steps: 5200, calories: 230, heartRate: 76, standHours: 6, goalPercent: 52
  })
  assert.strictEqual(todaySummary.id, 'today')
  assert.deepStrictEqual(todaySummary.modules.map(function (module) { return module.id }), ['summaryHead', 'day', 'lunar', 'goal', 'summaryMetrics', 'openCalendar'])
  assert.strictEqual(todaySummary.flowHeaders[0].trailing, '周四')
  assert.strictEqual(todaySummary.flowMetricItems[0].value, '5,200')

  const calendarCells = []
  for (let index = 0; index < 42; index++) calendarCells.push({ key: 'd' + index, day: index + 1, inMonth: index > 1 && index < 33, isToday: index === 9 })
  const todayCalendar = surfaceRuntime.resolve(todaySurface, profile, host, safe, {
    summaryOpen: false, calendarOpen: true, calendarYear: 2026, calendarMonth: 8, calendarCells: calendarCells
  })
  assert.deepStrictEqual(todayCalendar.modules.map(function (module) { return module.id }), ['calendarHead', 'calendarGrid', 'previousMonth', 'nextMonth', 'closeCalendar'])
  const calendarGrid = todayCalendar.flowMetricItems.filter(function (item) { return item.id.indexOf('calendarGrid-') === 0 })
  assert.strictEqual(calendarGrid.length, 42, 'Today calendar must render the controller month through the generic data grid')
  assert.strictEqual(calendarGrid[0].accent, '#5A5A60', 'outside-month visual role must be JSON-owned')
  assert.strictEqual(calendarGrid[9].tokens.itemBackground, '#0A84FF', 'today highlight must be JSON-owned')
})

console.log('V3 design runtime verified across pending Recipes and migrated JSON surfaces')
