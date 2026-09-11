const assert = require('assert')
const path = require('path')
const fs = require('fs')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const experienceRuntime = require('../src/product/frontend/runtime/experience_runtime')
const stepsSurface = require('../src/product/frontend/surfaces/steps.json')
const historySurface = require('../src/product/frontend/surfaces/history.json')
const healthSurface = require('../src/product/frontend/surfaces/heartrate.json')
const workoutHistorySurface = require('../src/product/frontend/surfaces/workout_history.json')
const workoutSurface = require('../src/product/frontend/surfaces/workout.json')
const todaySurface = require('../src/product/frontend/surfaces/today.json')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

const profiles = {
  circle: { formFactor: 'circle', screenWidth: 192, screenHeight: 192, safeInsets: { left: 0, top: 0, right: 0, bottom: 0, gestureBar: 0 } },
  pill: { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
  rect: { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
}

function resolveSurface(surface, profile, state) {
  const host = scene.resolve(profile)
  const safe = scene.safe(profile, host)
  const plan = surfaceRuntime.resolve(surface, profile, host, safe, state || {})
  return experienceRuntime.decorate(plan, surface, profile, host, safe, state || {})
}

const stepsState = { metrics: [
  { id: 'steps', current: 4321, goal: 10000 },
  { id: 'calories', current: 287, goal: 500 },
  { id: 'stand', current: 9, goal: 12 }
] }
const rect = resolveSurface(stepsSurface, profiles.rect, stepsState)
assert.deepStrictEqual(rect.modules.map(function (module) { return module.id }), ['title', 'history', 'metrics'])
assert.strictEqual(rect.metricList.items[0].name, '步数')
assert.strictEqual(rect.metricList.items[0].current, '4,321')
assert.strictEqual(rect.metricList.items[0].progressText, '43%')
assert.strictEqual(rect.metricList.items[0].goalText, '目标 10,000 步')
assert.strictEqual(rect.metricList.items[0].statusText, '还差 5,679 步')
assert.strictEqual(rect.metricList.items[0].accent, '#FFD60A')
assert.strictEqual(rect.metricList.tokens.itemRadius, 18)

const circle = resolveSurface(stepsSurface, profiles.circle, stepsState)
assert.strictEqual(circle.metricList.tokens.itemRadius, 20)
assert.strictEqual(circle.metricList.tokens.itemGap, 4)
const pill = resolveSurface(stepsSurface, profiles.pill, stepsState)
assert.strictEqual(pill.metricList.tokens.itemRadius, 12)

const completed = resolveSurface(stepsSurface, profiles.rect, { metrics: [
  { id: 'steps', current: 12000, goal: 10000 },
  { id: 'calories', current: 600, goal: 600 },
  { id: 'stand', current: 12, goal: 12 }
] })
assert.strictEqual(completed.metricList.items[0].statusText, '超额 2,000')
assert.strictEqual(completed.metricList.items[1].statusText, '已达成')
assert.strictEqual(completed.metricList.items[1].statusColor, '#FF9F0A', 'completed status color must use the JSON metric accent')

const alteredSteps = JSON.parse(JSON.stringify(stepsSurface))
alteredSteps.modules[2].props.items[0].copy.label = 'JSON owns this label'
alteredSteps.modules[2].props.items[0].tokens.accent = '#010203'
const alteredStepsPlan = resolveSurface(alteredSteps, profiles.rect, { metrics: [{ id: 'steps', current: 1, goal: 2 }] })
assert.strictEqual(alteredStepsPlan.metricList.items[0].name, 'JSON owns this label')
assert.strictEqual(alteredStepsPlan.metricList.items[0].accent, '#010203', 'changing JSON alone must change the rendered plan')

const historyState = {
  todaySteps: 5200, avgSteps: 4800, bestSteps: 7200, bestDate: '2026-09-08', avgHeartRate: 76, goalPercent: 86,
  records: [{ date: '2026-09-08', steps: 7200 }, { date: '2026-09-09', steps: 4200 }, { date: '2026-09-10', steps: 5200 }]
}
const history = resolveSurface(historySurface, profiles.pill, historyState)
assert.deepStrictEqual(history.modules.map(function (module) { return module.id }), ['head', 'summary', 'trend', 'insights'])
assert.strictEqual(history.flowHeaders[0].title, '7日趋势')
assert.strictEqual(history.flowHeaders[0].trailing, '86%')
assert.deepStrictEqual(history.flowMetricItems.map(function (item) { return item.label }), ['今日步数', '有记录均值', '最佳', '平均心率', '今日达成'])
assert.strictEqual(history.flowChartCards[0].mode, 'rows', 'Pill chart mode must come only from JSON variant')
assert.ok(history.flowChartCards[0].frame.height < historySurface.variants.pill.modules.trend.maxHeight, 'row chart must derive compact height from data count and JSON row geometry')

const alteredHistory = JSON.parse(JSON.stringify(historySurface))
alteredHistory.modules[1].props.items[0].copy.label = '唯一 JSON 标签'
alteredHistory.modules[1].props.items[0].tokens.accent = '#020304'
const alteredHistoryPlan = resolveSurface(alteredHistory, profiles.pill, historyState)
assert.strictEqual(alteredHistoryPlan.flowMetricItems[0].label, '唯一 JSON 标签')
assert.strictEqual(alteredHistoryPlan.flowMetricItems[0].accent, '#020304')

const healthState = {
  heartRate: 76, spo2: 98, stress: 22,
  heartZone: 'normal', spo2Zone: 'good', stressZone: 'relaxed',
  summaryState: 'stable', sourceState: 'live', updatedAt: new Date(2026, 8, 10, 15, 30).getTime(),
  heartValues: [72, 74, 76], spo2Values: [97, 99, 98], stressValues: [18, 25, 22]
}
const health = resolveSurface(healthSurface, profiles.pill, healthState)
assert.strictEqual(health.flowHeaders[0].trailing, '状态平稳')
assert.strictEqual(health.flowHeaders[0].trailingColor, '#30D158')
assert.strictEqual(health.flowMetricItems[0].label, '血氧')
assert.strictEqual(health.flowMetricItems[0].value, '98%')
assert.strictEqual(health.flowMetricItems[0].detail, '良好')
assert.strictEqual(health.flowMetricItems[0].detailColor, '#30D158')
assert.strictEqual(health.flowChartCards[0].status, '正常')

const workoutHistory = resolveSurface(workoutHistorySurface, profiles.pill, {
  totalSteps: null,
  recordCount: 2,
  empty: false,
  hasRecords: true,
  records: [
    { id: 'w1', type: 'run', endedAt: new Date(2026, 8, 10, 7, 30).getTime(), durationMs: 1800000, distanceMeters: 5200, calories: null, steps: null },
    { id: 'w2', type: 'walk', endedAt: new Date(2026, 8, 9, 18, 30).getTime(), durationMs: 2400000, distanceMeters: null, calories: null, steps: null }
  ]
})
assert.strictEqual(workoutHistory.flowListRows.length, 2)
assert.strictEqual(workoutHistory.flowListRows[0].title, '跑步')
assert.strictEqual(workoutHistory.flowListRows[0].trailing, '5.20 km')
assert.strictEqual(workoutHistory.flowListRows[1].trailing, '--')

const workout = resolveSurface(workoutSurface, profiles.pill, {
  hasSession: true,
  confirming: false,
  type: 'run',
  status: 'running',
  durationMs: 65000,
  steps: null,
  calories: null,
  distanceMeters: null,
  currentHeartRate: null,
  gpsStatus: 'unavailable',
  gpsDistanceMeters: 0
})
assert.strictEqual(workout.flowMetricItems[0].value, '--')
assert.strictEqual(workout.flowMetricItems[1].value, '--')
assert.strictEqual(workout.flowMetricItems[2].value, '--')
assert.strictEqual(workout.flowMetricItems[3].value, '01:05')

const today = resolveSurface(todaySurface, profiles.pill, {
  summaryOpen: true,
  calendarOpen: false,
  currentMonth: 8,
  currentDay: 10,
  currentWeekday: 4,
  lunarText: '农历七月廿九',
  steps: 4321,
  calories: 287,
  standHours: 9,
  heartRate: null,
  goalPercent: 57,
  calendarYear: 2026,
  calendarMonth: 8,
  calendarCells: []
})
assert.strictEqual(today.flowHeaders[0].trailing, '周四')
assert.strictEqual(today.flowHeaders[0].subtitleTrailing, '9月')
assert.strictEqual(today.flowMetricItems[0].value, '4,321')
assert.strictEqual(today.flowMetricItems[2].value, '--')

const hostSource = read('src/components/surface_host.ux')
assert.ok(hostSource.includes('surfacePlan.flowChartCards'), 'Surface Host must render chart cards from the generic plan')
assert.ok(hostSource.includes('surfacePlan.flowMetricItems'), 'Surface Host must render metric grids from the generic plan')
assert.ok(hostSource.includes('surfacePlan.flowListRows'), 'Surface Host must render generic list rows from the plan')
assert.ok(!hostSource.includes('history') && !hostSource.includes('workout_history') && !hostSource.includes('heartrate'), 'Surface Host must stay route-agnostic')

console.log('V3 frontend runtime verified: JSON exclusively owns migrated surface structure, copy, visual tokens, order and shape variants')
