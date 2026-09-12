const assert = require('assert')
const fs = require('fs')
const path = require('path')
const healthCore = require('../src/capabilities/internal/health_channel_core')
const motionCore = require('../src/capabilities/internal/motion_core')
const locationCore = require('../src/capabilities/internal/location_core')
const pageGeneration = require('../src/runtime/page_generation')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

function healthHarness() {
  const subscriptions = []
  const recent = []
  let unsubscribeCount = 0
  const service = {
    DATA_TYPES: { HEART_RATE: 1 },
    subscribeSample: function (options) { subscriptions.push(options) },
    unsubscribeSample: function () { unsubscribeCount++ },
    getRecentSamples: function (options) { recent.push(options) }
  }
  return { service: service, subscriptions: subscriptions, recent: recent, unsubscribeCount: function () { return unsubscribeCount } }
}

const health = healthHarness()
const channel = healthCore.createHealthChannel(health.service, { dataTypeName: 'HEART_RATE', now: function () { return 5000 } })
const healthEvents = []
function healthListener(value) { healthEvents.push(value) }
channel.subscribe(healthListener)
assert.strictEqual(health.subscriptions.length, 1)
assert.strictEqual(health.recent.length, 1)
const oldHealthSubscription = health.subscriptions[0]
oldHealthSubscription.callback({ value: 90, timeStamp: 2000 })
assert.strictEqual(channel.getSnapshot().value, 90)
assert.strictEqual(channel.getSnapshot().updatedAt, 2000)
assert.strictEqual(channel.getSnapshot().receivedAt, 5000)
health.recent[0].success([{ data: { value: 60, timeStamp: 1000 } }])
assert.strictEqual(channel.getSnapshot().value, 90, 'R03: an older recent sample must not overwrite newer live data')
assert.strictEqual(channel.getSnapshot().updatedAt, 2000)

channel.unsubscribe(healthListener)
assert.strictEqual(health.unsubscribeCount(), 1)
assert.strictEqual(channel.getSnapshot().live, false)
oldHealthSubscription.callback({ value: 70, timeStamp: 3000 })
assert.strictEqual(channel.getSnapshot().value, 90, 'R03: callback from a stopped subscription must be ignored')
assert.strictEqual(channel.getSnapshot().live, false)

channel.subscribe(healthListener)
assert.strictEqual(health.subscriptions.length, 2)
const newHealthSubscription = health.subscriptions[1]
oldHealthSubscription.fail(null, 44)
assert.notStrictEqual(channel.getSnapshot().source, 'error', 'old subscription failure must not poison the new owner')
newHealthSubscription.callback({ value: 95, timeStamp: 4000 })
assert.strictEqual(channel.getSnapshot().value, 95)
assert.strictEqual(channel.getSnapshot().updatedAt, 4000)
newHealthSubscription.callback({ value: 99 })
assert.strictEqual(channel.getSnapshot().value, 95, 'missing measurement time must not be replaced with receive time')
channel.unsubscribe(healthListener)
assert.strictEqual(health.unsubscribeCount(), 2)

function motionHarness() {
  const subscriptions = []
  let stopCount = 0
  const sensor = {
    subscribeAccelerometer: function (options) { subscriptions.push(options) },
    unsubscribeAccelerometer: function () { stopCount++ }
  }
  return { sensor: sensor, subscriptions: subscriptions, stopCount: function () { return stopCount } }
}

const motion = motionHarness()
const motionRuntime = motionCore.createMotion(motion.sensor)
let samples = 0
let failures = 0
function onMotion() { samples++ }
function onMotionFail() { failures++ }
assert.strictEqual(motionRuntime.subscribe(onMotion, { interval: 'game', fail: onMotionFail }), true)
const oldMotionSubscription = motion.subscriptions[0]
motionRuntime.unsubscribe(onMotion)
assert.strictEqual(motion.stopCount(), 1)
assert.strictEqual(motionRuntime.subscribe(onMotion, { interval: 'game', fail: onMotionFail }), true)
assert.strictEqual(motion.subscriptions.length, 2)
const newMotionSubscription = motion.subscriptions[1]
oldMotionSubscription.fail(null, 17)
assert.strictEqual(failures, 0, 'R13: stale native fail must not reach the current consumer')
newMotionSubscription.callback({ x: 1, y: 2, z: 3 })
assert.strictEqual(samples, 1)
motionRuntime.unsubscribe(onMotion)
assert.strictEqual(motion.stopCount(), 2, 'R13: stale fail must not clear the active flag of the new native subscription')
oldMotionSubscription.callback({ x: 4, y: 5, z: 6 })
assert.strictEqual(samples, 1, 'stale native sample must not reach consumers after stop')

function locationHarness() {
  const subscriptions = []
  let stopCount = 0
  const geolocation = {
    subscribe: function (options) { subscriptions.push(options) },
    unsubscribe: function () { stopCount++ }
  }
  return { geolocation: geolocation, subscriptions: subscriptions, stopCount: function () { return stopCount } }
}

const location = locationHarness()
const locationRuntime = locationCore.createLocation(location.geolocation, { now: function () { return 9000 } })
const locationSamples = []
function onLocation(point) { locationSamples.push(point) }
assert.strictEqual(locationRuntime.subscribe(onLocation), true)
assert.strictEqual(location.subscriptions.length, 1)
const oldLocationSubscription = location.subscriptions[0]
oldLocationSubscription.callback({ latitude: 31.1, longitude: 121.5, accuracy: 8 })
assert.strictEqual(locationSamples.length, 1)
assert.strictEqual(locationSamples[0].timestamp, 9000)
locationRuntime.unsubscribe(onLocation)
assert.strictEqual(location.stopCount(), 1)
assert.strictEqual(locationRuntime.subscribe(onLocation), true)
assert.strictEqual(location.subscriptions.length, 2)
const newLocationSubscription = location.subscriptions[1]
oldLocationSubscription.fail()
oldLocationSubscription.callback({ latitude: 31.2, longitude: 121.6 })
assert.strictEqual(locationSamples.length, 1, 'R10: stale location callback must not reach a new subscription owner')
newLocationSubscription.callback({ latitude: 31.3, longitude: 121.7, speed: 2.5 })
assert.strictEqual(locationSamples.length, 2)
locationRuntime.unsubscribe(onLocation)
assert.strictEqual(location.stopCount(), 2, 'R10: stale location fail must not clear the active flag of the new owner')
newLocationSubscription.callback({ latitude: 31.4, longitude: 121.8 })
assert.strictEqual(locationSamples.length, 2, 'R10: stopped location subscription must ignore late callbacks')

const page = {}
const firstGeneration = pageGeneration.begin(page)
assert.strictEqual(pageGeneration.isCurrent(page, firstGeneration), true)
pageGeneration.destroy(page)
assert.strictEqual(pageGeneration.isCurrent(page, firstGeneration), false, 'R06: destroyed page generation must reject late callbacks')
const secondGeneration = pageGeneration.begin(page)
assert.strictEqual(pageGeneration.isCurrent(page, firstGeneration), false)
assert.strictEqual(pageGeneration.isCurrent(page, secondGeneration), true)

const surfacePage = read('src/runtime/surface_page.js')
const pageRuntime = read('src/runtime/page_runtime.js')
const workoutController = read('src/product/features/workout/controller.js')
assert.ok(surfacePage.includes('if (!current()) return'), 'Surface controller/device callbacks must check the captured page generation')
assert.ok(surfacePage.indexOf('pageGeneration.destroy(page)') < surfacePage.indexOf('page._surfaceController.destroy()'), 'Page generation must be invalidated before controller destroy can emit')
assert.ok(pageRuntime.includes("typeof isCurrent === 'function' && !isCurrent()"), 'Device profile completion must be guarded before viewport mutation')
assert.ok(workoutController.includes('var locationGeneration = 0'), 'Workout GPS timeout ownership must be generation-scoped')
assert.ok(workoutController.includes('if (generation !== locationGeneration || !runtimeActive) return'), 'Stale GPS timeout must not mark a newer location attempt unavailable')

console.log('Async ownership verified: stale health/motion/location callbacks and destroyed-page callbacks cannot mutate current state')
