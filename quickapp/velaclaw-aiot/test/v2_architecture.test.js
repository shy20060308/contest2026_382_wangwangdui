const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const manifest = JSON.parse(read('src/manifest.json'))

function walk(dir, files) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target, files)
    else files.push(target)
  })
}

function pageSource(route, page) {
  return path.join('src', route, page.component + '.ux')
}

// Every routed page is now part of the V2 application. No route may remain as a
// legacy exception because the rewrite treats the old app only as a functional reference.
Object.keys(manifest.router.pages || {}).forEach(route => {
  const relative = pageSource(route, manifest.router.pages[route])
  const full = path.join(root, relative)
  assert.ok(fs.existsSync(full), 'missing routed page: ' + relative)
  const source = fs.readFileSync(full, 'utf8')
  assert.ok(source.includes('/v2/'), relative + ' must enter the V2 application architecture')
  assert.ok(!source.includes('/common/'), relative + ' must not depend on legacy common modules')
  assert.ok(!source.includes('/presentation/layout/'), relative + ' must not use the legacy layout engine')
  assert.ok(!source.includes('pageViewport') && !source.includes('pageMotion') && !source.includes('watchData'), relative + ' must not regain legacy page/runtime bridges')
  assert.ok(!source.includes('@service.'), relative + ' must not access service APIs directly')
  assert.ok(!source.includes('@system.'), relative + ' must not access system APIs directly; navigation belongs in V2 app runtime')
})

const v2Files = []
walk(path.join(root, 'src', 'v2'), v2Files)
v2Files.filter(name => name.endsWith('.js')).forEach(full => {
  const relative = path.relative(root, full).replace(/\\/g, '/')
  const source = fs.readFileSync(full, 'utf8')
  assert.ok(!source.includes('/common/'), relative + ' must not depend on legacy common modules')
  assert.ok(!source.includes('/presentation/layout/'), relative + ' must not depend on the legacy Design Engine')
  assert.ok(!source.includes('@service.'), relative + ' must not access Vela services directly')
  if (relative !== 'src/v2/app/navigation.js') {
    assert.ok(!source.includes('@system.'), relative + ' must not access Vela system APIs directly')
  } else {
    assert.ok(source.includes("@system.router"), 'V2 navigation is the sole framework-router boundary')
  }
})

const pageRuntime = read('src/v2/app/page_runtime.js')
const scene = read('src/v2/design/scene.js')
const clock = read('src/pages/clock/clock.ux')
const notification = read('src/pages/notification_demo/notification_demo.ux')
const workout = read('src/pages/workout/workout.ux')
const launcher = read('src/pages/applist/applist.ux')
const selector = read('src/pages/watchface/index.ux')

assert.ok(pageRuntime.includes('../design/scene'), 'all pages must share the Host Scene contract')
assert.ok(!pageRuntime.includes('applyDesign') && !pageRuntime.includes('layoutRuntime'), 'V2 runtime must never resize the host viewport to fit design math')
assert.ok(scene.includes('globalSafe.top - scene.hostTop'), 'safe geometry must be projected into Host Scene coordinates')
assert.ok(scene.includes('globalSafe.bottom - scene.hostTop'), 'safe bottom must be projected into Host Scene coordinates')

assert.ok(clock.includes("../../v2/features/clock/controller"), 'Clock must be a thin V2 page')
assert.ok(clock.includes("../../v2/design/specs/clock"), 'Clock L3 art direction must live outside feature logic')
assert.ok(!clock.includes('notificationManager') && !clock.includes('deviceSettings') && !clock.includes('faceRegistry'), 'Clock must not regain legacy orchestration')
assert.ok(!clock.includes('@touchstart=') && !clock.includes('@touchmove=') && !clock.includes('@touchend='), 'Clock must not implement a parallel raw-touch gesture engine')

assert.ok(notification.includes("../../v2/features/notification/controller"), 'notification demo and clock must share one V2 feature runtime')
assert.ok(workout.includes("../../v2/features/workout/controller"), 'Workout page must consume only its V2 feature controller')
assert.ok(launcher.includes("../../v2/features/launcher/controller"), 'Launcher business semantics must be shared across L3 surfaces')
assert.ok(selector.includes("../../v2/features/watchface/controller"), 'Watchface selection must use one V2 feature controller')

const capabilityEvent = read('src/capabilities/system_event.js')
const capabilityInterconnect = read('src/capabilities/interconnect.js')
assert.ok(capabilityEvent.includes('subscribe: subscribe') && capabilityEvent.includes('unsubscribe: unsubscribe'), 'system-event gateway must own lazy subscription lifecycle')
assert.ok(capabilityInterconnect.includes('consumerCount'), 'interconnect gateway must release native listeners after the final consumer')

console.log('V2 application architecture verified: every routed page follows Capability → Domain → Feature → Design → Page')
