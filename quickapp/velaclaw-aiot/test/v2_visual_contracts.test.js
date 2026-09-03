const assert = require('assert')
const fs = require('fs')
const path = require('path')
const scene = require('../src/v2/design/scene')

const root = path.resolve(__dirname, '..')
const specsDir = path.join(root, 'src/v2/design/specs')

const profiles = [
  { name: 'circle-192', formFactor: 'circle', logicalHeight: 192, viewportTop: '0px', viewportHeight: '192px', width: 148 },
  { name: 'rect-228', formFactor: 'rect', logicalHeight: 228, viewportTop: '0px', viewportHeight: '228px', width: 164 },
  { name: 'band9-pill', formFactor: 'pill', logicalHeight: 490, viewportTop: '24px', viewportHeight: '466px', width: 168 },
  { name: 'band10-pill', formFactor: 'pill', logicalHeight: 471, viewportTop: '24px', viewportHeight: '447px', width: 168 }
]

function validateBox(box, host, label) {
  if (!box || typeof box !== 'object') return
  if (![box.left, box.top, box.width, box.height].every(value => typeof value === 'number' && isFinite(value))) return
  assert.ok(box.left >= -0.01, label + ' left must stay inside Host Scene')
  assert.ok(box.top >= -0.01, label + ' top must stay inside Host Scene')
  assert.ok(box.width >= 0 && box.height >= 0, label + ' size must be non-negative')
  assert.ok(box.left + box.width <= host.width + 0.01, label + ' must not overflow Host Scene width')
  assert.ok(box.top + box.height <= host.height + 0.01, label + ' must not overflow Host Scene height')
}

function walkPlan(value, host, label, seen) {
  if (!value || typeof value !== 'object') return
  if (seen.indexOf(value) >= 0) return
  seen.push(value)
  validateBox(value, host, label)
  Object.keys(value).forEach(key => walkPlan(value[key], host, label + '.' + key, seen))
}

profiles.forEach(profile => {
  const host = scene.resolve(profile)
  const safe = scene.safeForWidth(profile, profile.width)
  assert.ok(host.width === 192, profile.name + ' must use the 192 logical design width')
  assert.ok(host.height > 0, profile.name + ' Host Scene must have positive height')
  assert.ok(safe.left >= 0 && safe.left + safe.width <= host.width, profile.name + ' safe width must stay inside Host Scene')
  assert.ok(safe.top >= 0 && safe.bottom <= host.height, profile.name + ' safe vertical band must stay inside Host Scene')
  assert.ok(safe.height > 0, profile.name + ' must retain a usable safe region')
  if (profile.formFactor === 'circle') assert.ok(safe.top > 0 && safe.bottom < host.height, 'circle content must respect curved caps')
  if (profile.formFactor === 'pill') {
    assert.ok(safe.gestureBar === 36, profile.name + ' must reserve the Pill gesture area')
    assert.ok(safe.bottom <= host.height - 12, profile.name + ' must keep content away from the bottom gesture edge')
  }
})

fs.readdirSync(specsDir).filter(name => name.endsWith('.js')).forEach(name => {
  const spec = require(path.join(specsDir, name))
  if (!spec || typeof spec.resolve !== 'function') return
  profiles.forEach(profile => {
    const host = scene.resolve(profile)
    const safe = scene.safeForWidth(profile, profile.width)
    const plan = spec.resolve(profile, host, safe)
    assert.ok(plan && typeof plan === 'object', name + ' must resolve a plan for ' + profile.name)
    const level = plan.freedomLevel || spec.freedomLevel || (plan.freedom && plan.freedom.level)
    assert.ok(level === 1 || level === 2 || level === 3, name + ' must explicitly resolve a Design Freedom level for ' + profile.name)
    if (plan.strategy) {
      const expected = level === 1 ? 'auto' : level === 2 ? 'assisted' : 'free'
      assert.strictEqual(plan.strategy, expected, name + ' strategy must match its Design Freedom level')
    }
    if (name === 'today.js') {
      assert.strictEqual(plan.interaction, 'explicit-buttons', 'Today must use explicit month controls on ' + profile.name)
      assert.strictEqual(plan.overflow, 'fixed', 'Today must remain a fixed non-scroll surface on ' + profile.name)
      assert.ok(!plan.needsOverride, 'Today fixed composition must fit the safe band on ' + profile.name)
      Object.keys(plan.requiredHeights || {}).forEach(surface => {
        assert.ok(plan.requiredHeights[surface] <= safe.height, 'Today ' + surface + ' must fit safe height on ' + profile.name)
      })
    }
    walkPlan(plan, host, name + ':' + profile.name, [])
  })
})

const designFiles = []
function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target)
    else if (entry.name.endsWith('.js')) designFiles.push(target)
  })
}
walk(path.join(root, 'src/v2/design'))
designFiles.forEach(full => {
  const source = fs.readFileSync(full, 'utf8')
  const relative = path.relative(root, full).replace(/\\/g, '/')
  assert.ok(!source.includes('/features/'), relative + ' Design must never depend upward on Feature')
  assert.ok(!source.includes('/capabilities/'), relative + ' Design must never access device capability APIs')
})

const pageRuntime = fs.readFileSync(path.join(root, 'src/v2/app/page_runtime.js'), 'utf8')
assert.ok(pageRuntime.includes('applyHostViewport(page, profile)'), 'pages must render inside the Host Scene supplied by Vela')
assert.ok(!pageRuntime.includes('applyDesign') && !pageRuntime.includes('viewportHeight = profile.logicalHeight'), 'Design Engine must never enlarge the host viewport to make a composition fit')

const clock = fs.readFileSync(path.join(root, 'src/pages/clock/clock.ux'), 'utf8')
;['sport_rect.ux', 'simple_rect.ux', 'dashboard_rect.ux'].forEach(name => {
  assert.ok(fs.existsSync(path.join(root, 'src/components/watchfaces', name)), 'Rect Clock requires dedicated composition ' + name)
})
assert.ok(clock.includes('<div class="pill-stage" if="{{ isPill }}">'), 'Pill Clock must have its own composition stage')
assert.ok(clock.includes('<div class="rect-stage" if="{{ isRect }}">'), 'Rect Clock must have its own composition stage')
assert.ok(clock.includes('<div class="circle-stage" if="{{ isCircle }}">'), 'Circle Clock must have its own composition stage')
assert.ok(clock.includes('<sportrect') && clock.includes('<simplerect') && clock.includes('<dashboardrect'), 'Rect Clock must render dedicated Rect watchfaces')
assert.ok(!clock.includes('rectangular-stage" if="{{ !isCircle }}'), 'Rect must never fall back to a shared Pill/Rect composition')

const today = fs.readFileSync(path.join(root, 'src/pages/today/today.ux'), 'utf8')
assert.ok(today.includes('.circle-calendar-grid { height: 78px; }') && today.includes('.circle-cell { width: 19px; height: 13px;'), 'Circle calendar grid must stay within its 130px safe band')

console.log('V2 visual contracts verified: Host Scene bounds, fixed-surface fit, Design Freedom and independent compositions')
