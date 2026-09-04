const assert = require('assert')
const fs = require('fs')
const path = require('path')
const scene = require('../src/v2/design/scene')

const root = path.resolve(__dirname, '..')
const specsDir = path.join(root, 'src/v2/design/specs')

const profiles = [
  { name: 'circle-192', formFactor: 'circle', logicalHeight: 192, screenWidth: 466, screenHeight: 466, viewportTop: '0px', viewportHeight: '100%', width: 148 },
  { name: 'rect-228', formFactor: 'rect', logicalHeight: 228, screenWidth: 432, screenHeight: 514, viewportTop: '0px', viewportHeight: '100%', width: 164 },
  { name: 'band9-pill', formFactor: 'pill', logicalHeight: 490, screenWidth: 192, screenHeight: 490, viewportTop: '24px', viewportHeight: '466px', width: 168 },
  { name: 'band10-pill', formFactor: 'pill', logicalHeight: 471, screenWidth: 212, screenHeight: 520, viewportTop: '24px', viewportHeight: '447px', width: 168 }
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
  assert.strictEqual(host.width, 192, profile.name + ' must use the 192 logical design width')
  assert.ok(host.height >= profile.logicalHeight, profile.name + ' Host Scene must cover the full logical display')
  assert.strictEqual(host.hostTop, 0, profile.name + ' Host Scene must start at the physical top edge')
  assert.ok(safe.left >= 0 && safe.left + safe.width <= host.width, profile.name + ' safe width must stay inside Host Scene')
  assert.ok(safe.top >= 0 && safe.bottom <= host.height, profile.name + ' safe vertical band must stay inside Host Scene')
  assert.ok(safe.height > 0, profile.name + ' must retain a usable safe region')
  if (profile.formFactor === 'circle') assert.ok(safe.top > 0 && safe.bottom < host.height, 'circle content must respect curved caps')
  if (profile.formFactor === 'pill') {
    assert.strictEqual(safe.gestureBar, 36, profile.name + ' must reserve the Pill gesture area')
    assert.ok(safe.top > 0 && safe.bottom < host.height, profile.name + ' safe content must stay away from both capsule caps')
  }
})

fs.readdirSync(specsDir).filter(name => name.endsWith('.js')).forEach(name => {
  const spec = require(path.join(specsDir, name))
  if (!spec || typeof spec.resolve !== 'function') return
  assert.ok(spec.freedomLevel === 1 || spec.freedomLevel === 2 || spec.freedomLevel === 3, name + ' must export an explicit Design Freedom level')
  profiles.forEach(profile => {
    const host = scene.resolve(profile)
    const safe = scene.safeForWidth(profile, profile.width)
    const plan = spec.resolve(profile, host, safe)
    assert.ok(plan && typeof plan === 'object', name + ' must resolve a plan for ' + profile.name)
    assert.ok(plan.freedomLevel === 1 || plan.freedomLevel === 2 || plan.freedomLevel === 3, name + ' must put freedomLevel on every resolved plan for ' + profile.name)
    assert.strictEqual(plan.freedomLevel, spec.freedomLevel, name + ' resolved level must match exported level')
    const expected = plan.freedomLevel === 1 ? 'auto' : plan.freedomLevel === 2 ? 'assisted' : 'free'
    assert.strictEqual(plan.strategy, expected, name + ' strategy must explicitly match its Design Freedom level')
    assert.strictEqual(plan.shape, profile.formFactor, name + ' must explicitly identify the resolved shape')
    assert.ok(typeof plan.surface === 'string' && plan.surface.length > 0, name + ' must explicitly identify its composition surface')
    if (name === 'today.js') {
      assert.strictEqual(plan.interaction, 'explicit-buttons', 'Today must use explicit month controls on ' + profile.name)
      assert.strictEqual(plan.overflow, 'fixed', 'Today must remain a fixed non-scroll surface on ' + profile.name)
      assert.ok(!plan.needsOverride, 'Today fixed composition must fit the safe band on ' + profile.name)
      Object.keys(plan.requiredHeights || {}).forEach(surface => {
        assert.ok(plan.requiredHeights[surface] <= safe.height, 'Today ' + surface + ' must fit safe height on ' + profile.name)
      })
    }
    if (name === 'clock.js' && profile.formFactor === 'pill') {
      const batteryTop = parseInt(plan.alpineBatteryRowTop, 10)
      assert.ok(batteryTop + 16 <= safe.bottom, 'Alpine battery row must remain above the Pill gesture-safe bottom on ' + profile.name)
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
assert.ok(pageRuntime.includes('applyHostViewport(page, profile)'), 'pages must share one V2 viewport policy')
assert.ok(pageRuntime.includes("page.viewportTop = '0px'"), 'V2 pages must render from the physical top edge instead of inheriting a cropped beta inset')
assert.ok(pageRuntime.includes("page.viewportHeight = betaPill ? hostScene.height + 'px' : '100%'"), 'beta Pill pages must expand to the full logical canvas while normal devices retain full viewport height')

const sceneSource = fs.readFileSync(path.join(root, 'src/v2/design/scene.js'), 'utf8')
assert.ok(sceneSource.includes('Math.ceil(screenHeight * geometry.DESIGN_WIDTH / screenWidth)'), 'Host Scene coverage must round upward to prevent one-pixel bottom seams')
assert.ok(!sceneSource.includes("parseFloat(String(value || ''))"), 'Host Scene must never parse percentage CSS dimensions as logical pixels')

const clock = fs.readFileSync(path.join(root, 'src/pages/clock/clock.ux'), 'utf8')
;['sport_rect.ux', 'simple_rect.ux', 'dashboard_rect.ux'].forEach(name => {
  assert.ok(fs.existsSync(path.join(root, 'src/components/watchfaces', name)), 'Rect Clock requires dedicated composition ' + name)
})
assert.ok(clock.includes('<div class="pill-stage" if="{{ isPill }}">'), 'Pill Clock must have its own composition stage')
assert.ok(clock.includes('<div class="rect-stage" if="{{ isRect }}">'), 'Rect Clock must have its own composition stage')
assert.ok(clock.includes('<div class="circle-stage" if="{{ isCircle }}">'), 'Circle Clock must have its own composition stage')
assert.ok(clock.includes('<sportrect') && clock.includes('<simplerect') && clock.includes('<dashboardrect'), 'Rect Clock must render dedicated Rect watchfaces')
assert.ok(!clock.includes('rectangular-stage" if="{{ !isCircle }}'), 'Rect must never fall back to a shared Pill/Rect composition')
assert.ok(clock.includes('background-color: {{ faceBackground }};'), 'Clock root must paint a face-matched fallback behind the full scene')

const today = fs.readFileSync(path.join(root, 'src/pages/today/today.ux'), 'utf8')
assert.ok(today.includes('.circle-calendar-grid { height: 78px; }') && today.includes('.circle-cell { width: 19px; height: 13px;'), 'Circle calendar grid must stay within its 130px safe band')

console.log('V2 visual contracts verified: full-bleed Host Scene coverage with safe content bounds on every composition')
