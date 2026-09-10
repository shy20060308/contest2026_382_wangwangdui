const assert = require('assert')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const stepsSurface = require('../src/product/frontend/surfaces/steps.json')
const historySurface = require('../src/product/frontend/surfaces/history.json')
const healthSurface = require('../src/product/frontend/surfaces/heartrate.json')

const profiles = {
  circle: { formFactor: 'circle', screenWidth: 466, screenHeight: 466, safeInsets: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 } },
  pill: { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
  rect: { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
}

function resolveSurface(surface, profile, state) {
  const host = scene.resolve(profile)
  const safe = scene.safe(profile, host)
  return surfaceRuntime.resolve(surface, profile, host, safe, state)
}

const scrambledBusinessState = [
  { id: 'stand', current: 6, goal: 12, name: 'fake stand', unit: 'fake', color: '#123456' },
  { id: 'calories', current: 300, goal: 600, name: 'fake calories', unit: 'fake', color: '#123456' },
  { id: 'steps', current: 5000, goal: 10000, name: 'fake steps', unit: 'fake', color: '#123456' }
]

Object.keys(profiles).forEach(function (shape) {
  const plan = resolveSurface(stepsSurface, profiles[shape], { metrics: scrambledBusinessState })
  assert.strictEqual(plan.id, 'steps')
  assert.strictEqual(plan.shape, shape)
  assert.deepStrictEqual(plan.modules.map(function (module) { return module.id }), ['title', 'history', 'metrics'], 'JSON must own visible module order')
  assert.deepStrictEqual(plan.metricList.items.map(function (item) { return item.id }), ['steps', 'calories', 'stand'], 'JSON must own metric order instead of controller array order')

  const steps = plan.metricList.items[0]
  assert.strictEqual(steps.name, '步数', 'metric label must come from JSON, not business state')
  assert.strictEqual(steps.unit, '步', 'metric unit must come from JSON, not business state')
  assert.strictEqual(steps.accent, '#FFD60A', 'metric color must come from JSON, not business state')
  assert.strictEqual(steps.current, '5,000')
  assert.strictEqual(steps.progressText, '50%')
  assert.strictEqual(steps.goalText, '目标 10,000 步')
  assert.strictEqual(steps.statusText, '还差 5,000')
})

assert.throws(function () {
  resolveSurface(stepsSurface, profiles.rect, { metrics: [{ id: 'unknown', current: 1, goal: 2 }] })
}, /no JSON definition/, 'business state must not silently create a new visual metric')

const circle = resolveSurface(stepsSurface, profiles.circle, { metrics: scrambledBusinessState })
assert.deepStrictEqual(circle.headers[0].frame, { left: 36, top: 24, width: 120, height: 22 }, 'Circle geometry must come from the circle JSON override plus declared safe inset')
assert.strictEqual(circle.buttons[0].tokens.radius, 15)
assert.strictEqual(circle.metricList.tokens.itemRadius, 15)

const pill = resolveSurface(stepsSurface, profiles.pill, { metrics: scrambledBusinessState })
assert.strictEqual(pill.headers[0].frame.width, 168)
assert.strictEqual(pill.buttons[0].tokens.radius, 11, 'Pill information surface radius must remain explicitly declared')
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
assert.deepStrictEqual(history.flowMetricItems.map(function (item) { return item.label }), ['今日步数', '日均步数', '最佳', '平均心率', '今日达成'])
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
assert.strictEqual(health.flowChartCards[0].statusColor, '#30D158')

const alteredHealth = JSON.parse(JSON.stringify(healthSurface))
alteredHealth.modules[0].props.trailingMap.stable.text = 'JSON 状态'
alteredHealth.modules[0].props.trailingMap.stable.color = '#030405'
const alteredHealthPlan = resolveSurface(alteredHealth, profiles.pill, healthState)
assert.strictEqual(alteredHealthPlan.flowHeaders[0].trailing, 'JSON 状态')
assert.strictEqual(alteredHealthPlan.flowHeaders[0].trailingColor, '#030405', 'health copy and state color must change by editing JSON alone')

console.log('V3 frontend runtime verified: JSON exclusively owns migrated surface structure, copy, visual tokens, order and shape variants')
