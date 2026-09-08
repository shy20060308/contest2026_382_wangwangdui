const assert = require('assert')
const adapter = require('../src/v2/design/adapter')
const difference = require('../src/v2/design/difference')
const scene = require('../src/v2/design/scene')
const watchfaceChart = require('../src/v2/design/watchface_chart')
const launcherView = require('../src/v2/design/apps/launcher/view')

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

// These are already-resolved Device Profiles. Device Profile owns physical
// validation; Scene and Adapter must not re-validate the same device facts.
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
  designs.forEach(function (design) {
    assert.ok([difference.L1, difference.L2, difference.L3].includes(design.differenceLevel), 'every app design must declare an L1/L2/L3 difference level')
    const plan = design.resolve(profile, host, safe)
    assert.ok(plan && plan.designSystemVersion === '3.0', 'app design must resolve through V3 for ' + profile.formFactor)
    assert.strictEqual(plan.differenceLevel, design.differenceLevel, 'resolved plan must preserve the app design difference level')
    assert.deepStrictEqual(plan.difference, difference.describe(design.differenceLevel), 'resolved plan must expose canonical difference metadata')
    assert.strictEqual(plan.shape, profile.formFactor, 'Adapter must consume the resolved profile shape without reclassifying it')
    assert.strictEqual(Object.prototype.hasOwnProperty.call(plan, 'freedom'), false, 'V3 plans must not expose retired freedom metadata')
    assert.strictEqual(Object.prototype.hasOwnProperty.call(plan, 'freedomLevel'), false, 'V3 plans must not expose retired freedom level metadata')
  })
})

console.log('V3 design runtime verified: one validation owner per layer and direct recipe translation')
