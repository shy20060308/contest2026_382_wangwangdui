const assert = require('assert')
const adapter = require('../src/v2/design/adapter')
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
  require('../src/v2/design/apps/brightness')
]

const profiles = [
  { formFactor: 'circle', screenWidth: 466, screenHeight: 466, safeInsets: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 } },
  { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
  { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
]

assert.strictEqual(adapter.SYSTEM_ID, 'recipe-translator-v3.0')
assert.strictEqual(adapter.VERSION, '3.0')
assert.strictEqual(typeof adapter.clamp, 'undefined')

const circleHost = scene.resolve(profiles[0])
const circleSafe = scene.safe(profiles[0], circleHost)
assert.deepStrictEqual(circleSafe, { left: 0, top: 10, right: 192, bottom: 182, width: 192, height: 172, gestureBar: 0 })
const translated = adapter.placeBand(profiles[0], circleHost, circleSafe, { top: 14, width: 120, height: 22 })
assert.deepStrictEqual(translated, { left: 36, top: 24, width: 120, height: 22 })
assert.deepStrictEqual(adapter.contentBox(82, 58, 7, 6), { width: 68, height: 46 })

profiles.forEach(function (profile) {
  const host = scene.resolve(profile)
  const safe = scene.safe(profile, host)
  assert.ok(safe.width > 0 && safe.height > 0, profile.formFactor + ' profile must declare usable content space')
  designs.forEach(function (design) {
    const plan = design.resolve(profile, host, safe)
    assert.ok(plan && plan.designSystemVersion === '3.0', 'app design must resolve through V3 for ' + profile.formFactor)
  })
})

console.log('V3 design runtime verified: explicit insets, direct recipe translation, all product designs resolve')
