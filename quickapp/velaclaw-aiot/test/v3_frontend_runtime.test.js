const assert = require('assert')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const stepsSurface = require('../src/product/frontend/surfaces/steps.json')

const profiles = {
  circle: { formFactor: 'circle', screenWidth: 466, screenHeight: 466, safeInsets: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 } },
  pill: { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
  rect: { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
}

function resolve(profile, metrics) {
  const host = scene.resolve(profile)
  const safe = scene.safe(profile, host)
  return surfaceRuntime.resolve(stepsSurface, profile, host, safe, { metrics: metrics })
}

const scrambledBusinessState = [
  { id: 'stand', current: 6, goal: 12, name: 'fake stand', unit: 'fake', color: '#123456' },
  { id: 'calories', current: 300, goal: 600, name: 'fake calories', unit: 'fake', color: '#123456' },
  { id: 'steps', current: 5000, goal: 10000, name: 'fake steps', unit: 'fake', color: '#123456' }
]

Object.keys(profiles).forEach(function (shape) {
  const plan = resolve(profiles[shape], scrambledBusinessState)
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

const circle = resolve(profiles.circle, scrambledBusinessState)
assert.deepStrictEqual(circle.headers[0].frame, { left: 36, top: 24, width: 120, height: 22 }, 'Circle geometry must come from the circle JSON override plus declared safe inset')
assert.strictEqual(circle.buttons[0].tokens.radius, 15)
assert.strictEqual(circle.metricList.tokens.itemRadius, 15)

const pill = resolve(profiles.pill, scrambledBusinessState)
assert.strictEqual(pill.headers[0].frame.width, 168)
assert.strictEqual(pill.buttons[0].tokens.radius, 11, 'Pill information surface radius must remain explicitly declared')
assert.strictEqual(pill.metricList.tokens.itemRadius, 12)

const completed = resolve(profiles.rect, [
  { id: 'steps', current: 12000, goal: 10000 },
  { id: 'calories', current: 600, goal: 600 },
  { id: 'stand', current: 12, goal: 12 }
])
assert.strictEqual(completed.metricList.items[0].statusText, '超额 2,000')
assert.strictEqual(completed.metricList.items[1].statusText, '已达成')
assert.strictEqual(completed.metricList.items[1].statusColor, '#FF9F0A', 'completed status color must use the JSON metric accent')

const altered = JSON.parse(JSON.stringify(stepsSurface))
altered.modules[2].props.items[0].copy.label = 'JSON owns this label'
altered.modules[2].props.items[0].tokens.accent = '#010203'
const host = scene.resolve(profiles.rect)
const safe = scene.safe(profiles.rect, host)
const alteredPlan = surfaceRuntime.resolve(altered, profiles.rect, host, safe, { metrics: [{ id: 'steps', current: 1, goal: 2 }] })
assert.strictEqual(alteredPlan.metricList.items[0].name, 'JSON owns this label')
assert.strictEqual(alteredPlan.metricList.items[0].accent, '#010203', 'changing JSON alone must change the rendered plan')

console.log('V3 frontend runtime verified: JSON exclusively owns Steps structure, copy, visual tokens and shape variants')
