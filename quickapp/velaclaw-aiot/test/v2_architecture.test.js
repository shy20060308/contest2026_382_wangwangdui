const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const manifest = JSON.parse(read('src/manifest.json'))

function walk(dir, files) {
  if (!fs.existsSync(dir)) return
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target, files)
    else files.push(target)
  })
}

function pageSource(route, page) { return path.join('src', route, page.component + '.ux') }

function resolveRelative(owner, request) {
  const target = path.resolve(path.dirname(owner), request)
  return [target, target + '.js', target + '.ux', path.join(target, 'index.js')].some(fs.existsSync)
}

function validateRelativeImports(full, source) {
  const pattern = /(?:from\s+|require\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g
  let match
  while ((match = pattern.exec(source))) {
    assert.ok(resolveRelative(full, match[1]), path.relative(root, full) + ' has unresolved relative dependency ' + match[1])
  }
}

assert.ok(!fs.existsSync(path.join(root, 'src/v2/domain')), 'src/v2/domain must not exist; canonical business rules live only in src/domain')

Object.keys(manifest.router.pages || {}).forEach(route => {
  const relative = pageSource(route, manifest.router.pages[route])
  const full = path.join(root, relative)
  assert.ok(fs.existsSync(full), 'missing routed page: ' + relative)
  const source = fs.readFileSync(full, 'utf8')
  assert.ok(source.includes('/v2/'), relative + ' must enter the V2 application architecture')
  assert.ok(!source.includes('/common/'), relative + ' must not depend on legacy common modules')
  assert.ok(!source.includes('/presentation/layout/') && !source.includes('/presentation/viewport/'), relative + ' must not use legacy design/viewport engines')
  assert.ok(!source.includes('pageViewport') && !source.includes('pageMotion') && !source.includes('watchData'), relative + ' must not regain legacy page/runtime bridges')
  assert.ok(!source.includes('@service.'), relative + ' must not access service APIs directly')
  assert.ok(!source.includes('@system.'), relative + ' must not access system APIs directly; navigation belongs in V2 app runtime')
  validateRelativeImports(full, source)
})

const v2Files = []
walk(path.join(root, 'src/v2'), v2Files)
v2Files.filter(name => name.endsWith('.js')).forEach(full => {
  const relative = path.relative(root, full).replace(/\\/g, '/')
  const source = fs.readFileSync(full, 'utf8')
  assert.ok(!source.includes('/common/'), relative + ' must not depend on legacy common modules')
  assert.ok(!source.includes('/presentation/layout/') && !source.includes('/presentation/viewport/'), relative + ' must own its V2 design/viewport primitives')
  assert.ok(!source.includes('@service.'), relative + ' must not access Vela services directly')
  if (relative !== 'src/v2/app/navigation.js') assert.ok(!source.includes('@system.'), relative + ' must not access Vela system APIs directly')
  else assert.ok(source.includes("@system.router"), 'V2 navigation is the sole framework-router boundary')
  validateRelativeImports(full, source)
})

const featureFiles = []
walk(path.join(root, 'src/v2/features'), featureFiles)
featureFiles.filter(name => name.endsWith('.js')).forEach(full => {
  const relative = path.relative(root, full).replace(/\\/g, '/')
  const source = fs.readFileSync(full, 'utf8')
  assert.ok(!source.includes('/pages/') && !source.includes('/components/'), relative + ' Feature must never depend on Page or Component')
  assert.ok(!source.includes('/presentation/layout/') && !source.includes('/presentation/viewport/'), relative + ' Feature must not depend on legacy presentation infrastructure')
  const shapeBranch = /\b(isCircle|isPill|isRect)\b|\bformFactor\s*===|===\s*['"](?:circle|pill|rect)['"]|\bshape\s*===\s*['"](?:circle|pill|rect)['"]/
  assert.ok(!shapeBranch.test(source), relative + ' Feature must not branch on screen shape; screen differences belong to Design')
})

const domainFiles = []
walk(path.join(root, 'src/domain'), domainFiles)
domainFiles.filter(name => name.endsWith('.js')).forEach(full => {
  const relative = path.relative(root, full).replace(/\\/g, '/')
  const source = fs.readFileSync(full, 'utf8')
  assert.ok(!source.includes('/v2/features/') && !source.includes('/v2/design/') && !source.includes('/pages/') && !source.includes('/components/'), relative + ' Domain must not depend upward on Feature, Design or UI')
})

const watchfaceDir = path.join(root, 'src/components/watchfaces')
fs.readdirSync(watchfaceDir).filter(name => name.endsWith('.ux')).forEach(name => {
  const source = fs.readFileSync(path.join(watchfaceDir, name), 'utf8')
  assert.ok(!source.includes('@system.router'), name + ' must be a presentation component, not a navigation owner')
  assert.ok(!source.includes('/common/health_metrics'), name + ' must not depend on legacy presentation bridges')
  validateRelativeImports(path.join(watchfaceDir, name), source)
})

const pageRuntime = read('src/v2/app/page_runtime.js')
const scene = read('src/v2/design/scene.js')
const geometry = read('src/v2/design/geometry.js')
const deviceProfile = read('src/v2/system/device_profile.js')
const clock = read('src/pages/clock/clock.ux')
const clockFeature = read('src/v2/features/clock/controller.js')
const clockDesign = read('src/v2/design/specs/clock.js')
const notification = read('src/pages/notification_demo/notification_demo.ux')
const workout = read('src/pages/workout/workout.ux')
const launcher = read('src/pages/applist/applist.ux')
const selector = read('src/pages/watchface/index.ux')

assert.ok(pageRuntime.includes("../system/device_profile"), 'V2 runtime must resolve its own device profile')
assert.ok(pageRuntime.includes('../design/scene'), 'all pages must share the Host Scene contract')
assert.ok(!pageRuntime.includes('applyDesign') && !pageRuntime.includes('layoutRuntime'), 'V2 runtime must never resize the host viewport to fit design math')
assert.ok(scene.includes("require('./geometry')"), 'V2 scene must own wearable geometry')
assert.ok(scene.includes('globalSafe.top - host.hostTop'), 'safe geometry must be projected into Host Scene coordinates')
assert.ok(scene.includes('globalSafe.bottom - host.hostTop'), 'safe bottom must be projected into Host Scene coordinates')
assert.ok(geometry.includes('PILL_GESTURE_BAR = 36') && geometry.includes('capsuleInset'), 'V2 geometry must model pill caps and gesture area')
assert.ok(deviceProfile.includes("../../capabilities/device"), 'V2 device profile must consume the device capability gateway')

assert.ok(clock.includes("../../v2/features/clock/controller"), 'Clock must be a thin V2 page')
assert.ok(clock.includes("../../v2/design/specs/clock"), 'Clock L3 art direction must live outside feature logic')
assert.ok(clock.includes('configureFaces(plan.faceIds)'), 'Clock page must inject the Design-selected face set into the Feature')
assert.ok(!clockFeature.includes('presentation/watchface') && !clockFeature.includes('availability'), 'Clock Feature must not know shape-specific face availability')
assert.ok(clockDesign.includes("faceIds = ['sport', 'simple', 'dashboard', 'mechanical']") && clockDesign.includes("faceIds = ['sport', 'simple', 'dashboard', 'alpine']"), 'Clock Design must own shape-specific face availability')
assert.ok(!clock.includes('notificationManager') && !clock.includes('deviceSettings') && !clock.includes('faceRegistry'), 'Clock must not regain legacy orchestration')

assert.ok(notification.includes("../../v2/features/notification/controller"), 'notification demo and clock must share one V2 feature runtime')
assert.ok(workout.includes("../../v2/features/workout/controller"), 'Workout page must consume only its V2 feature controller')
assert.ok(launcher.includes("../../v2/features/launcher/controller"), 'Launcher business semantics must be shared across L3 surfaces')
assert.ok(selector.includes("../../v2/features/watchface/controller"), 'Watchface selection must use one V2 feature controller')

const capabilityEvent = read('src/capabilities/system_event.js')
const capabilityInterconnect = read('src/capabilities/interconnect.js')
assert.ok(capabilityEvent.includes('subscribe: subscribe') && capabilityEvent.includes('unsubscribe: unsubscribe'), 'system-event gateway must own lazy subscription lifecycle')
assert.ok(capabilityInterconnect.includes('consumerCount'), 'interconnect gateway must release native listeners after the final consumer')

console.log('V2 architecture verified: one Domain root, shape-blind Feature decisions, and downward-only UI ownership')
