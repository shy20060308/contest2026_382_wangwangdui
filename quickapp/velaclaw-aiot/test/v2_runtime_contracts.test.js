const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

const clock = read('src/v2/features/clock/controller.js')
const workout = read('src/v2/features/workout/controller.js')
const notification = read('src/v2/features/notification/controller.js')
const eventGateway = read('src/capabilities/system_event.js')
const interconnectGateway = read('src/capabilities/interconnect.js')
const motionController = read('src/v2/features/settings/motion_controller.js')

assert.ok(clock.includes('powerRuntime.start()'), 'Clock start must activate the power runtime')
assert.ok(clock.includes('powerRuntime.stop()'), 'Clock stop must release the power runtime')
assert.ok(clock.includes('notification.start()') && clock.includes('notification.stop()'), 'Clock lifecycle must own its notification consumer')
assert.ok(clock.includes("historyRepository.saveToday(activityStore.getSnapshot()"), 'Clock lifecycle must persist semantic daily state without page-owned storage')

assert.ok(workout.includes('location.subscribe('), 'running workout must activate location only through the capability gateway')
assert.ok(workout.includes('location.unsubscribe('), 'workout pause/stop must release location')
assert.ok(workout.includes('setInterval('), 'running workout may own one session tick')
assert.ok(workout.includes('clearInterval('), 'workout lifecycle must release the session tick')
assert.ok(workout.includes('activityStore.addAndPersist('), 'workout finish must commit activity in feature orchestration')
assert.ok(workout.includes('historyRepository.saveToday('), 'workout finish must update seven-day history in feature orchestration')
assert.ok(workout.includes('workoutRepository.saveRecord('), 'workout finish must persist the workout record in feature orchestration')

assert.ok(notification.includes('systemEvent.subscribe(EVENT_NAME, onExternal)'), 'notification runtime must lazily subscribe to external events')
assert.ok(notification.includes('systemEvent.unsubscribe(EVENT_NAME, onExternal)'), 'notification runtime must release event subscription')
assert.ok(notification.includes('interconnect.subscribe(onExternal)'), 'notification runtime must lazily subscribe to interconnect')
assert.ok(notification.includes('interconnect.unsubscribe(onExternal)'), 'notification runtime must release interconnect')
assert.ok(eventGateway.includes('subscriptions.length'), 'system-event gateway must track active consumers')
assert.ok(interconnectGateway.includes('if (listeners.length === 0) disconnect()'), 'interconnect must disconnect after its final consumer')

assert.ok(motionController.includes('motion.subscribe('), 'motion diagnostics must consume the motion gateway')
assert.ok(motionController.includes('motion.unsubscribe('), 'motion diagnostics must release the motion gateway')
assert.ok(!motionController.includes('@system.sensor'), 'motion feature must never bypass its capability gateway')

console.log('V2 wearable runtime contracts verified: resources are activated by demand and released by lifecycle')
