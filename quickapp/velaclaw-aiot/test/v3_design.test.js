const assert = require('assert')
const adapter = require('../src/v2/design/adapter')
const difference = require('../src/v2/design/difference')
const scene = require('../src/v2/design/scene')

const designs = [
  require('../src/v2/design/apps/steps'),
  require('../src/v2/design/apps/heart'),
  require('../src/v2/design/apps/history'),
  require('../src/v2/design/apps/workout'),
  require('../src/v2/design/apps/workout/selection'),
  require('../src/v2/design/apps/workout/history'),
  require('../src/v2/design/apps/launcher'),
  require('../src/v2/design/apps/clock'),
  require('../src/v2/design/apps/faces'),
  require('../src/v2/design/apps/settings'),
  require('../src/v2/design/apps/notification'),
  require('../src/v2/design/apps/today'),
  require('../src/v2/design/apps/brightness'),
  require('../src/v2/design/apps/vibration'),
  require('../src/v2/design/apps/motion'),
  require('../src/v2/design/apps/diagnostics'),
  require('../src/v2/design/apps/sync')
]

const profiles = [
  { formFactor: 'circle', screenWidth: 466, screenHeight: 466, safeInsets: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 } },
  { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
  { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
]

assert.strictEqual(adapter.SYSTEM_ID, 'recipe-translator-v3.0')
assert.strictEqual(adapter.VERSION, '3.0')
assert.strictEqual(typeof adapter.clamp, 'undefined')
assert.deepStrictEqual(difference.describe(difference.L1), { level: 1, id: 'L1', kind: 'shared-expression' })
assert.deepStrictEqual(difference.describe(difference.L2), { level: 2, id: 'L2', kind: 'local-expression' })
assert.deepStrictEqual(difference.describe(difference.L3), { level: 3, id: 'L3', kind: 'independent-surface' })

const circleHost = scene.resolve(profiles[0])
const circleSafe = scene.safe(profiles[0], circleHost)
assert.deepStrictEqual(circleSafe, { left: 0, top: 10, right: 192, bottom: 182, width: 192, height: 172, gestureBar: 0 })
const translated = adapter.placeBand(profiles[0], circleHost, circleSafe, { top: 14, width: 120, height: 22 })
assert.deepStrictEqual(translated, { left: 36, top: 24, width: 120, height: 22 })
assert.deepStrictEqual(adapter.contentBox(82, 58, 7, 6), { width: 68, height: 46 })

assert.throws(function () { adapter.shapeOf({ formFactor: 'triangle' }) }, /Unsupported V3 form factor/)
assert.throws(function () { adapter.contentWidth(profiles[0], { base: {} }) }, /recipe\.contentWidth/)
assert.throws(function () { adapter.grid({ width: 100 }, undefined, 0) }, /grid\.columns/)
assert.throws(function () { adapter.placeBand(profiles[0], {}, circleSafe, { bounds: 'scene', width: 50, height: 20 }) }, /scene\.width/)
assert.throws(function () { adapter.createPlan(profiles[0], circleHost, circleSafe, undefined, 'test') }, /explicit L1\/L2\/L3/)
assert.throws(function () { adapter.createPlan(profiles[0], circleHost, circleSafe, difference.L1, '') }, /recipe\.surface/)

profiles.forEach(function (profile) {
  const host = scene.resolve(profile)
  const safe = scene.safe(profile, host)
  assert.ok(safe.width > 0 && safe.height > 0, profile.formFactor + ' profile must declare usable content space')
  designs.forEach(function (design) {
    assert.ok([difference.L1, difference.L2, difference.L3].includes(design.differenceLevel), 'every app design must declare an L1/L2/L3 difference level')
    const plan = design.resolve(profile, host, safe)
    assert.ok(plan && plan.designSystemVersion === '3.0', 'app design must resolve through V3 for ' + profile.formFactor)
    assert.strictEqual(plan.differenceLevel, design.differenceLevel, 'resolved plan must preserve the app design difference level')
    assert.deepStrictEqual(plan.difference, difference.describe(design.differenceLevel), 'resolved plan must expose canonical difference metadata')
    assert.strictEqual(Object.prototype.hasOwnProperty.call(plan, 'freedom'), false, 'V3 plans must not expose retired freedom metadata')
    assert.strictEqual(Object.prototype.hasOwnProperty.call(plan, 'freedomLevel'), false, 'V3 plans must not expose retired freedom level metadata')
  })
})

console.log('V3 design runtime verified: direct recipe translation, canonical L1/L2/L3 metadata, missing design inputs fail fast')
