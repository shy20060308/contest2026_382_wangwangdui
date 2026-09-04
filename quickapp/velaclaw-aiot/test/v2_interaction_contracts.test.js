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

console.log('V2 interaction contracts verified: one gesture owner per rendered surface with a fixed-surface touch fallback where Vela needs it')
