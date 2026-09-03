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
  // top of that same surface; this was the root cause of the old Pill calendar conflict.
  if (ownsScroll) {
    assert.ok(!ownsRawTouch, relative + ' must not combine scroll/list with raw touch gesture recognition')
    assert.ok(!ownsSwipe, relative + ' must not combine scroll/list with a page swipe recognizer')
  }
})

const today = read('src/pages/today/today.ux')
assert.ok(!/<(scroll|list)\b/.test(today), 'Today summary/calendar are fixed surfaces and must never become scroll containers')
assert.ok(!/@touch(start|move|end)=/.test(today) && !/@swipe=/.test(today), 'Today month navigation must remain explicit click interaction')

const clock = read('src/pages/clock/clock.ux')
assert.strictEqual(count(clock, '@swipe='), 1, 'Clock must have exactly one swipe owner')
assert.strictEqual(count(clock, '@longpress='), 1, 'Clock must have exactly one long-press owner')
assert.ok(!/@touch(start|move|end)=/.test(clock), 'Clock must not run a parallel raw-touch recognizer')
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

console.log('V2 interaction contracts verified: one gesture owner per surface and semantic child events only')
