const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const manifest = require('../src/manifest.json')
const policy = require('../src/product/frontend/adaptation-policy.json')
const surfacesRoot = path.join(root, 'src', 'product', 'frontend', 'surfaces')

function filename(route) { return route.replace(/^pages\//, '').replace(/\//g, '__') + '.json' }
function surface(route) { return require(path.join(surfacesRoot, filename(route))) }
function nonEmptyObject(value) { return !!value && typeof value === 'object' && Object.keys(value).length > 0 }
function stable(value) { return JSON.stringify(value === undefined ? null : value) }
function sliderSemantics(slider) {
  return {
    id: slider.id,
    bind: slider.bind || {},
    min: slider.min,
    max: slider.max,
    step: slider.step,
    action: slider.action,
    copy: slider.copy || {}
  }
}
function experienceModes(experience) {
  return ['base', 'circle', 'pill', 'rect'].map(function (shape) {
    var branch = experience[shape] || {}
    return branch.collection && branch.collection.mode ? branch.collection.mode : null
  }).filter(Boolean)
}
function faceIds(experience, shape) {
  var branch = experience && experience[shape] ? experience[shape] : {}
  var config = branch.controllerConfig || {}
  return Array.isArray(config.faceIds) ? config.faceIds : []
}

assert.strictEqual(policy.schemaVersion, 1)
assert.strictEqual(policy.levels.L1.kind, 'shared-expression')
assert.strictEqual(policy.levels.L2.kind, 'local-expression')
assert.strictEqual(policy.levels.L3.kind, 'independent-surface')

const routes = Object.keys(manifest.router.pages).sort()
const policyRoutes = Object.keys(policy.routes).sort()
assert.deepStrictEqual(policyRoutes, routes, 'Every manifest route must have exactly one adaptation-policy entry')

const expectedBaselineLevels = {
  'pages/clock': 'L3',
  'pages/clock_guard': 'L1',
  'pages/heartrate': 'L1',
  'pages/steps': 'L1',
  'pages/applist': 'L3',
  'pages/notification_demo': 'L1',
  'pages/history': 'L2',
  'pages/workout_select': 'L1',
  'pages/workout': 'L2',
  'pages/workout_history': 'L1',
  'pages/watchface': 'L3',
  'pages/settings/settings': 'L1',
  'pages/settings/bluetooth': 'L1',
  'pages/settings/vibration': 'L1',
  'pages/settings/brightness': 'L1',
  'pages/settings/diagnostics': 'L1',
  'pages/settings/motion': 'L1',
  'pages/today': 'L2'
}
assert.deepStrictEqual(Object.keys(expectedBaselineLevels).sort(), routes)

routes.forEach(function (route) {
  const entry = policy.routes[route]
  const value = surface(route)
  assert.strictEqual(entry.routeLevel, expectedBaselineLevels[route], route + ' must preserve the accepted three-level baseline')
  assert.ok(policy.levels[entry.routeLevel], route + ' must use a known adaptation level')
  assert.ok(entry.reason && entry.reason.length > 10, route + ' must document why its level is required')

  const experience = value.experience || {}
  const modes = experienceModes(experience)
  const uniqueModes = Array.from(new Set(modes))
  if (uniqueModes.length > 1) {
    assert.strictEqual(entry.routeLevel, 'L3', route + ' selects different interaction surfaces by shape and therefore must be L3')
  }

  if (entry.routeLevel !== 'L3') {
    ;['circle', 'pill', 'rect'].forEach(function (shape) {
      const branch = experience[shape] || {}
      assert.ok(!branch.collection || !branch.collection.mode, route + ' may not select a shape-specific collection engine below L3')
      assert.ok(!nonEmptyObject(branch.gestures), route + ' may not change gesture semantics by shape below L3')
      if (nonEmptyObject(branch.controllerConfig)) {
        assert.strictEqual(stable(branch.controllerConfig), stable((experience.base || {}).controllerConfig || {}), route + ' may not change product/controller availability by shape below L3')
      }
    })
  }

  if (entry.routeLevel === 'L1' && experience.base && Array.isArray(experience.base.sliders)) {
    const baseSliders = experience.base.sliders
    ;['circle', 'pill', 'rect'].forEach(function (shape) {
      const branch = experience[shape] || {}
      if (!Array.isArray(branch.sliders)) return
      assert.strictEqual(branch.sliders.length, baseSliders.length, route + ' L1 slider count must remain shared on ' + shape)
      for (let i = 0; i < baseSliders.length; i++) {
        assert.strictEqual(stable(sliderSemantics(branch.sliders[i])), stable(sliderSemantics(baseSliders[i])), route + ' L1 slider semantics must remain identical on ' + shape + '; only frame/tokens may differ')
      }
    })
  }
})

const appList = surface('pages/applist')
assert.strictEqual(policy.routes['pages/applist'].routeLevel, 'L3')
assert.ok(nonEmptyObject(appList.experience.circle) && nonEmptyObject(appList.experience.pill) && nonEmptyObject(appList.experience.rect), 'L3 AppList must explicitly author each independent form-factor experience')
assert.deepStrictEqual(experienceModes(appList.experience), ['honeycomb', 'paged-list', 'designed-grid'], 'AppList L3 must preserve its three accepted form-factor surfaces')

const watchface = surface('pages/watchface')
assert.strictEqual(policy.routes['pages/watchface'].routeLevel, 'L3')
assert.deepStrictEqual(experienceModes(watchface.experience), ['preview-swiper', 'cards-pager', 'preview-grid'], 'Watchface L3 must preserve its three accepted form-factor selectors')
assert.deepStrictEqual(faceIds(watchface.experience, 'circle'), ['sport', 'simple', 'dashboard', 'mechanical'])
assert.deepStrictEqual(faceIds(watchface.experience, 'pill'), ['sport', 'simple', 'dashboard', 'alpine'])
assert.deepStrictEqual(faceIds(watchface.experience, 'rect'), ['sport', 'simple', 'dashboard'])

const clock = surface('pages/clock')
assert.strictEqual(policy.routes['pages/clock'].routeLevel, 'L3')
assert.deepStrictEqual(faceIds(clock.experience, 'circle'), ['sport', 'simple', 'dashboard', 'mechanical'], 'Circle Clock must expose the accepted mechanical face')
assert.deepStrictEqual(faceIds(clock.experience, 'pill'), ['sport', 'simple', 'dashboard', 'alpine'], 'Pill Clock must expose the accepted alpine face')
assert.deepStrictEqual(faceIds(clock.experience, 'rect'), ['sport', 'simple', 'dashboard'], 'Rect Clock must keep the accepted three-face set')

const brightness = surface('pages/settings/brightness')
assert.strictEqual(policy.routes['pages/settings/brightness'].routeLevel, 'L1')
assert.ok(brightness.experience && brightness.experience.base && Array.isArray(brightness.experience.base.sliders), 'L1 may keep a shared direct-manipulation primitive when the expression is identical on every shape')

const engineRoot = path.join(root, 'src', 'product', 'frontend', 'engines')
if (fs.existsSync(engineRoot)) {
  fs.readdirSync(engineRoot).filter(name => name.endsWith('.js')).forEach(function (name) {
    const source = fs.readFileSync(path.join(engineRoot, name), 'utf8')
    assert.ok(!/pages\//.test(source), name + ' must remain route-agnostic')
    assert.ok(!/#[0-9a-fA-F]{6}/.test(source), name + ' must not own product colors')
  })
}

console.log('V3 three-level adaptation verified: L1 shared expression, L2 local expression, L3 independent surface')
