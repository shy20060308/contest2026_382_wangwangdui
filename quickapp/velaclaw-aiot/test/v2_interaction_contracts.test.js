const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const manifest = JSON.parse(read('src/manifest.json'))

function pagePath(route, value) {
  return path.join('src', route, value.component + '.ux')
}

function count(source, token) {
  return source.split(token).length - 1
}

Object.keys(manifest.router.pages || {}).forEach(route => {
  const relative = pagePath(route, manifest.router.pages[route])
  const source = read(relative)
  const ownsScroll = /<(scroll|list)\b/.test(source)
  const ownsRawTouch = /@touch(start|move|end)=/.test(source)
  const ownsSwipe = /@swipe=/.test(source)

  // A scroll/list owns its axis. A page must not add a competing recognizer on
  // top of that same surface; fixed surfaces may use one page-level fallback.
  if (ownsScroll) {
    assert.ok(!ownsRawTouch, relative + ' must not combine scroll/list with raw touch gesture recognition')
    assert.ok(!ownsSwipe, relative + ' must not combine scroll/list with a page swipe recognizer')
  }
})

const today = read('src/pages/today/today.ux')
assert.ok(!/<(scroll|list)\b/.test(today), 'Today summary/calendar are fixed surfaces and must never become scroll containers')
assert.ok(!/@touch(start|move|end)=/.test(today) && !/@swipe=/.test(today), 'Today month navigation must remain explicit click interaction')

const clock = read('src/pages/clock/clock.ux')
assert.strictEqual(count(clock, '@swipe='), 1, 'Clock must have exactly one native swipe owner')
assert.strictEqual(count(clock, '@longpress='), 1, 'Clock must have exactly one long-press owner')
assert.strictEqual(count(clock, '@touchstart='), 1, 'Clock must have exactly one raw-touch fallback owner')
assert.strictEqual(count(clock, '@touchmove='), 1, 'Clock must have exactly one raw-touch fallback owner')
assert.strictEqual(count(clock, '@touchend='), 1, 'Clock must have exactly one raw-touch fallback owner')
assert.ok(clock.includes('consumeGestureEvent(event)'), 'Clock vertical fallback must consume the gesture before the host can scroll it')
assert.ok(clock.includes('this.notificationVisible) return'), 'Clock navigation gestures must be blocked while notification overlay owns interaction')

const watchfaceDir = path.join(root, 'src/components/watchfaces')
fs.readdirSync(watchfaceDir).filter(name => name.endsWith('.ux')).forEach(name => {
  const source = fs.readFileSync(path.join(watchfaceDir, name), 'utf8')
  assert.ok(!source.includes('@system.router'), name + ' must emit semantic events instead of navigating directly')
  assert.ok(!/@swipe=|@longpress=|@touch(start|move|end)=/.test(source), name + ' must not compete with the Clock page gesture owner')
  if (/@click=/.test(source)) assert.ok(source.includes('$emit('), name + ' clickable complications must communicate upward with $emit')
})

assert.ok(clock.includes('onopen-health="openHealth"'), 'Clock must bind semantic health events from watchfaces')
assert.ok(clock.includes('onopen-steps="openSteps"'), 'Clock must bind semantic activity events from watchfaces')
assert.ok(clock.includes('onopen-today="openToday"'), 'Clock must bind semantic calendar events from watchfaces')

const launcher = read('src/pages/applist/applist.ux')
assert.strictEqual(count(launcher, '@swipe="handleListSwipe"'), 2, 'Pill and Rect launcher surfaces must each restore swipe navigation without touching Honeycomb')
assert.ok(launcher.includes("event.direction === 'down') navigation.back()"), 'Pill launcher down-swipe must return to Clock')
assert.ok(launcher.includes('event.preventDefault') && launcher.includes('event.stopPropagation'), 'Launcher swipe must not degrade into host scrolling')
assert.ok(launcher.includes('class="list-surface"') && launcher.includes('style="width: {{ sceneWidth }}px; height: {{ sceneHeight }}px;"'), 'Pill launcher swipe owner must have a real full-scene hitbox instead of a zero-height wrapper')
assert.ok(launcher.includes('.list-surface, .grid-surface { position: absolute; left: 0px; top: 0px;'), 'Launcher rendered surfaces must be anchored to the Host Scene')

assert.ok(launcher.includes('for="{{ circleVisibleSlots }}"'), 'Circle launcher must render only currently visible honeycomb slots')
assert.ok(launcher.includes('scheduleHoneycombLayout()'), 'Circle drag input must be frame-throttled instead of relayout on every touchmove')
assert.ok(launcher.includes('startHoneyInertia(') && launcher.includes('settleHoneycomb()'), 'Circle launcher release must use bounded inertia and soft settling')
assert.ok(launcher.includes('this.openApp(item)') && !launcher.includes("if (!item.isCenter)"), 'any visible Circle app must open with one tap instead of requiring center-then-tap')
assert.ok(launcher.includes('this.touchStartX < 26'), 'two-dimensional Honeycomb must keep an explicit edge-back gesture instead of stealing vertical drag')
assert.ok(!launcher.includes('circleDragX') && !launcher.includes('circleDragY'), 'Circle pan must be persistent instead of temporary drag offsets that force a snap')

const healthPage = read('src/pages/heartrate/heartrate.ux')
assert.ok(healthPage.includes('class="circle-health"') && healthPage.includes('style="width: {{ sceneWidth }}px; height: {{ sceneHeight }}px;"'), 'Circle Health scroll viewport must use the full round scene, not the rectangular safe band')
assert.ok(healthPage.includes('.circle-hero { width: 144px; height: 98px;'), 'Circle Health heart card must have enough height for value, chart and footer without internal clipping')

console.log('V2 interaction contracts verified: one gesture owner per rendered surface with full hitboxes and fixed-surface touch fallback where Vela needs it')
