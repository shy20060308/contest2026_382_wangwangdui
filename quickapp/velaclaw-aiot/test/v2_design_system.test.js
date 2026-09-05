const assert = require('assert')
const fs = require('fs')
const path = require('path')
const assisted = require('../src/v2/design/assisted')
const adapter = require('../src/v2/design/adapter')
const scene = require('../src/v2/design/scene')
const freedom = require('../src/v2/design/freedom')
const activity = require('../src/v2/design/specs/activity')
const health = require('../src/v2/design/specs/health')
const history = require('../src/v2/design/specs/history')
const today = require('../src/v2/design/specs/today')
const workout = require('../src/v2/design/specs/workout')

const root = path.resolve(__dirname, '..')
const profiles = [
  { name: 'circle-192', formFactor: 'circle', logicalHeight: 192, screenWidth: 466, screenHeight: 466 },
  { name: 'rect-228', formFactor: 'rect', logicalHeight: 228, screenWidth: 432, screenHeight: 514 },
  { name: 'band9-pill', formFactor: 'pill', logicalHeight: 490, screenWidth: 192, screenHeight: 490 },
  { name: 'band10-pill', formFactor: 'pill', logicalHeight: 471, screenWidth: 212, screenHeight: 520 }
]

let passed = 0
function test(name, callback) { callback(); passed++; console.log('通过 - ' + name) }

function resolved(spec, profile) {
  const host = scene.resolve(profile)
  const safe = scene.safeForWidth(profile, spec.contentWidth(profile))
  return { host, safe, plan: spec.resolve(profile, host, safe) }
}

test('v2.2 保留统一 Adapter API，允许页面声明轻量 L1 宽度 override', function () {
  assert.strictEqual(adapter.contentWidth({ formFactor: 'circle' }), assisted.contentWidth({ formFactor: 'circle' }))
  assert.strictEqual(adapter.contentWidth({ formFactor: 'pill' }), assisted.contentWidth({ formFactor: 'pill' }))
  assert.strictEqual(adapter.contentWidth({ formFactor: 'rect' }), assisted.contentWidth({ formFactor: 'rect' }))
  assert.strictEqual(health.contentWidth({ formFactor: 'circle' }), 136)
  assert.strictEqual(health.contentWidth({ formFactor: 'pill' }), 168)
  assert.strictEqual(health.contentWidth({ formFactor: 'rect' }), 164)
  assert.strictEqual(adapter.VERSION, '2.2')
  assert.deepStrictEqual(adapter.contentBoxSize(100, 50, 8, 5), { width: 84, height: 40 })
  assert.strictEqual(freedom.describe(freedom.AUTO).adapter, 'adaptive-geometry')
  assert.strictEqual(freedom.describe(freedom.ASSISTED).adapter, 'local-expression')
  assert.strictEqual(freedom.describe(freedom.FREE).adapter, 'independent-surface')
})

test('Activity / Today / Workout 现有 L2 v2.1 contract 保持兼容', function () {
  ;[activity, today, workout].forEach(function (spec) {
    profiles.forEach(function (profile) {
      const result = resolved(spec, profile)
      assert.strictEqual(result.plan.designSystem, 'l2-v2.1')
      assert.strictEqual(result.plan.designSystemVersion, '2.1')
      assert.strictEqual(result.plan.freedomLevel, freedom.ASSISTED)
      assert.strictEqual(result.plan.strategy, 'assisted')
    })
  })
})

test('Health 已收敛为 L1，History 只在趋势局部保留 L2', function () {
  profiles.forEach(function (profile) {
    const healthPlan = resolved(health, profile).plan
    const historyPlan = resolved(history, profile).plan
    assert.strictEqual(healthPlan.designSystem, 'adapter-first-v2.2')
    assert.strictEqual(healthPlan.designSystemVersion, '2.2')
    assert.strictEqual(healthPlan.freedomLevel, freedom.AUTO)
    assert.strictEqual(healthPlan.strategy, 'auto')
    assert.strictEqual(healthPlan.surface, 'vitals-stream')
    assert.strictEqual(historyPlan.designSystem, 'adapter-first-v2.2')
    assert.strictEqual(historyPlan.freedomLevel, freedom.ASSISTED)
    assert.strictEqual(historyPlan.surface, 'trend-stream')
  })
})

test('L1 圆屏通过圆弦自动重选位置，并把 padding 纳入卡片外部尺寸', function () {
  const result = resolved(health, profiles[0])
  assert.ok(result.plan.header.top > result.safe.top, 'circle header should move away from the narrow cap')
  assert.ok(result.plan.header.width >= 116, 'header should retain useful semantic width')
  assert.strictEqual(result.plan.stream.width, 136)
  assert.ok(result.plan.stream.top >= result.safe.top)
  assert.ok(result.plan.metaLineHeight > result.plan.metaSize, 'metadata needs a glyph-safe line box')
  assert.strictEqual(result.plan.cardWidth + result.plan.cardPaddingX * 2, result.plan.stream.width)
  assert.strictEqual(result.plan.miniWidth + result.plan.miniPaddingX * 2, result.plan.miniOuterWidth)
  assert.ok(result.plan.miniOuterWidth * 2 + result.plan.miniGap <= result.plan.stream.width)
})

test('History 的 L2 差异只体现在 trendMode，竖柱卡片不再溢出圆弦', function () {
  const circle = resolved(history, profiles[0]).plan
  const rect = resolved(history, profiles[1]).plan
  const pill = resolved(history, profiles[3]).plan
  assert.strictEqual(circle.trendMode, 'compact-column')
  assert.strictEqual(rect.trendMode, 'compact-column')
  assert.strictEqual(pill.trendMode, 'comparative-row')
  assert.strictEqual(pill.chartHeight, 10)
  assert.strictEqual(pill.pillTrendMinWidth, 14)
  assert.ok(pill.pillTrendMaxWidth <= pill.trendWidth / 2)
  assert.ok(circle.chartHeight >= 24)
  assert.ok(circle.trendOuterHeight <= 70)
  assert.strictEqual(circle.trendWidth + circle.trendPadding * 2, circle.trendOuterWidth)
  assert.ok(circle.columnBarWidth >= 6 && circle.columnBarWidth <= 8)
  assert.ok(circle.columnCellWidth * 7 <= circle.trendWidth)
})

test('Today 现有圆屏固定组合暂不在本次 Adapter-first 迁移范围', function () {
  const result = resolved(today, profiles[0])
  assert.deepStrictEqual(result.plan.circleFrame, { left: 28, top: 30, width: 136, height: 128 })
  assert.ok(result.plan.circleFrame.top + result.plan.circleFrame.height <= 160)
  const page = fs.readFileSync(path.join(root, 'src/pages/today/today.ux'), 'utf8')
  assert.ok(page.includes('self.circleFrameTop = plan.circleFrame.top'))
})

test('Workout 当前仍是 L2 单页面，关键圆屏几何保持稳定', function () {
  const workoutPlan = resolved(workout, profiles[0]).plan
  assert.strictEqual(workoutPlan.metricColumns, 2)
  assert.strictEqual(workoutPlan.durationSize, 27)
  assert.strictEqual(workoutPlan.durationLineHeight, 31)
  assert.deepStrictEqual(workoutPlan.header, { left: 32, top: 24, width: 128, height: 18 })
  assert.deepStrictEqual(workoutPlan.metrics, { left: 30, top: 97, width: 132, height: 54 })
  assert.strictEqual(workoutPlan.metricItemWidth * 2 + workoutPlan.metricGap, workoutPlan.metrics.width)
})

test('Activity 继续使用真实目标进度，而不是伪小时趋势', function () {
  profiles.forEach(function (profile) {
    const result = resolved(activity, profile)
    assert.strictEqual(result.plan.progressTrackWidth, result.safe.width - result.plan.metricPadding * 2)
    assert.ok(!Object.prototype.hasOwnProperty.call(result.plan, 'chartHeight'))
  })
})

console.log('Design System contracts verified: adapter-first v2.2 + compatible v2.1 surfaces, ' + passed + ' 项')
