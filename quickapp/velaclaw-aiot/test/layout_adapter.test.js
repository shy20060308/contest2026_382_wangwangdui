const assert = require('assert')
const adapter = require('../src/presentation/layout/adapter')

function circle() {
  return { formFactor: 'circle', logicalHeight: 192 }
}

function pill() {
  return { formFactor: 'pill', logicalHeight: 490 }
}

function rect() {
  return { formFactor: 'rect', logicalHeight: 228 }
}

const simple = {
  id: 'simple-stack',
  default: {
    mode: 'auto-stack',
    minScale: 0.72,
    maxScale: 1,
    gap: 4,
    regions: [
      { id: 'header', width: 110, height: 16 },
      { id: 'content', width: 136, height: 60 },
      { id: 'actions', width: 110, height: 20 }
    ]
  }
}

const circlePlan = adapter.resolve(circle(), simple)
assert.strictEqual(circlePlan.needsOverride, false, 'simple stack should auto-fit circle')
assert.ok(circlePlan.scale > 0.7, 'auto-fit should keep readable scale')
assert.strictEqual(circlePlan.regions.length, 3)
assert.ok(circlePlan.regions[0].top >= 18, 'header should stay below circle cap')
assert.ok(circlePlan.regions[2].bottom <= 174, 'actions should stay above circle bottom cap')

const pillPlan = adapter.resolve(pill(), simple)
assert.strictEqual(pillPlan.needsOverride, false, 'simple stack should auto-fit pill')
assert.strictEqual(pillPlan.scale, 1, 'pill should preserve the golden-reference scale when room exists')

const impossible = {
  id: 'too-dense',
  default: {
    mode: 'auto-stack',
    minScale: 0.82,
    maxScale: 1,
    gap: 8,
    regions: [
      { id: 'a', width: 148, height: 64 },
      { id: 'b', width: 148, height: 64 },
      { id: 'c', width: 148, height: 64 }
    ]
  }
}
const impossiblePlan = adapter.resolve(circle(), impossible)
assert.strictEqual(impossiblePlan.needsOverride, true, 'adapter must refuse unreadable auto-compression')
assert.strictEqual(impossiblePlan.reason, 'auto-stack-cannot-fit-within-min-scale')

const override = {
  id: 'history',
  default: {
    mode: 'auto-stack',
    minScale: 0.8,
    regions: [
      { id: 'summary', width: 156, height: 54 },
      { id: 'chart', width: 156, height: 146 },
      { id: 'records', width: 156, height: 144 }
    ]
  },
  compositions: {
    circle: {
      mode: 'fixed-composition',
      regions: [
        { id: 'chart', left: 22, top: 35, width: 148, height: 82, variant: 'compact' },
        { id: 'insights', left: 36, top: 121, width: 120, height: 34, variant: 'compact' }
      ]
    }
  }
}
const historyCircle = adapter.resolve(circle(), override)
assert.strictEqual(historyCircle.composition, 'circle')
assert.strictEqual(historyCircle.hasOverride, true)
assert.strictEqual(historyCircle.mode, 'fixed-composition')
assert.strictEqual(historyCircle.needsOverride, false, 'explicit safe composition should validate')
assert.strictEqual(historyCircle.regions[0].variant, 'compact')

const external = {
  id: 'honeycomb',
  default: { mode: 'external-engine', safeWidth: 136 }
}
const enginePlan = adapter.resolve(circle(), external)
assert.strictEqual(enginePlan.mode, 'external-engine')
assert.strictEqual(enginePlan.regions.length, 0)
assert.ok(enginePlan.safeBounds.height > 0)

const fixedUnsafe = {
  id: 'unsafe',
  default: {
    mode: 'fixed-composition',
    regions: [{ id: 'wide-top', left: 22, top: 10, width: 148, height: 30 }]
  }
}
const unsafePlan = adapter.resolve(circle(), fixedUnsafe)
assert.strictEqual(unsafePlan.needsOverride, true, 'fixed designer composition must still be safety-validated')
assert.ok(unsafePlan.violations.length > 0)

const rectPlan = adapter.resolve(rect(), simple)
assert.strictEqual(rectPlan.needsOverride, false)

console.log('Adaptive layout adapter verified: auto-fit, override, external-engine and refusal boundaries work')
