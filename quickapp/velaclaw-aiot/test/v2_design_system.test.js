const assert = require('assert')
const assisted = require('../src/v2/design/assisted')
const scene = require('../src/v2/design/scene')
const activity = require('../src/v2/design/specs/activity')
const health = require('../src/v2/design/specs/health')
const history = require('../src/v2/design/specs/history')
const today = require('../src/v2/design/specs/today')
const workout = require('../src/v2/design/specs/workout')

const profiles = [
  { name: 'circle-192', formFactor: 'circle', logicalHeight: 192, screenWidth: 466, screenHeight: 466 },
  { name: 'rect-228', formFactor: 'rect', logicalHeight: 228, screenWidth: 432, screenHeight: 514 },
  { name: 'band9-pill', formFactor: 'pill', logicalHeight: 490, screenWidth: 192, screenHeight: 490 },
  { name: 'band10-pill', formFactor: 'pill', logicalHeight: 471, screenWidth: 212, screenHeight: 520 }
]
const specs = [activity, health, history, today, workout]

let passed = 0
function test(name, callback) { callback(); passed++; console.log('通过 - ' + name) }

function resolved(spec, profile) {
  const host = scene.resolve(profile)
  const safe = scene.safeForWidth(profile, spec.contentWidth(profile))
  return { host, safe, plan: spec.resolve(profile, host, safe) }
}

test('L2 v2.1 为三种形态提供稳定的基础 token', function () {
  assert.strictEqual(assisted.contentWidth({ formFactor: 'circle' }), 148)
  assert.strictEqual(assisted.contentWidth({ formFactor: 'pill' }), 168)
  assert.strictEqual(assisted.contentWidth({ formFactor: 'rect' }), 164)
  assert.strictEqual(assisted.tokens({ formFactor: 'circle' }).density, 'compact')
  assert.strictEqual(assisted.tokens({ formFactor: 'pill' }).density, 'vertical')
  assert.strictEqual(assisted.tokens({ formFactor: 'rect' }).density, 'balanced')
})

test('所有迁移后的 L2 Spec 共享版本化 plan contract', function () {
  specs.forEach(function (spec) {
    profiles.forEach(function (profile) {
      const result = resolved(spec, profile)
      assert.strictEqual(result.plan.designSystem, 'l2-v2.1')
      assert.strictEqual(result.plan.designSystemVersion, '2.1')
      assert.strictEqual(result.plan.freedomLevel, 2)
      assert.strictEqual(result.plan.strategy, 'assisted')
      assert.strictEqual(result.plan.shape, profile.formFactor)
      assert.ok(result.plan.surface)
      assert.ok(result.plan.tokens && result.plan.tokens.contentWidth > 0)
      assert.deepStrictEqual(result.plan.content, {
        left: result.safe.left,
        top: result.safe.top,
        width: result.safe.width,
        height: result.safe.height
      })
    })
  })
})

test('Today 可以在 shared L2 width 上声明 circle 专用窄内容带', function () {
  assert.strictEqual(today.contentWidth({ formFactor: 'circle' }), 136)
  assert.strictEqual(today.contentWidth({ formFactor: 'pill' }), 168)
  assert.strictEqual(today.contentWidth({ formFactor: 'rect' }), 164)
})

test('现有 L2 surface 迁移后保持形态语义', function () {
  assert.strictEqual(resolved(health, profiles[0]).plan.surface, 'compact-vitals-stream')
  assert.strictEqual(resolved(history, profiles[2]).plan.surface, 'vertical-comparative-trend')
  assert.strictEqual(resolved(activity, profiles[1]).plan.surface, 'activity-dashboard-stream')
  assert.strictEqual(resolved(workout, profiles[3]).plan.surface, 'pill-session')
})

test('迁移不改变 History 与 Workout 的稳定关键几何', function () {
  const historyPlan = resolved(history, profiles[3]).plan
  assert.strictEqual(historyPlan.chartHeight, 10)
  assert.strictEqual(historyPlan.pillTrendMinWidth, 14)
  assert.strictEqual(historyPlan.pillTrendMaxWidth, 70)

  const workoutPlan = resolved(workout, profiles[0]).plan
  assert.strictEqual(workoutPlan.metricColumns, 2)
  assert.strictEqual(workoutPlan.durationSize, 27)
  assert.strictEqual(workoutPlan.actionSize, 8)
})

test('fixed composition guard 与当前 Today 安全高度一致', function () {
  profiles.forEach(function (profile) {
    assert.strictEqual(resolved(today, profile).plan.needsOverride, false, profile.name + ' Today must fit')
  })
  assert.strictEqual(assisted.needsOverride(181, { height: 168 }), true)
})

console.log('L2 Design System v2.1 contracts verified: ' + passed + ' 项')
