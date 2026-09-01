const fs = require('fs')
const path = require('path')
const assert = require('assert')

const root = path.resolve(__dirname, '..')
const read = function (name) { return fs.readFileSync(path.join(root, name), 'utf8') }

const manager = read('src/common/workout_manager.js')
const state = read('src/domain/workout/state_machine.js')
const repository = read('src/domain/workout/repository.js')
const mapper = read('src/presentation/mappers/workout.js')

assert.ok(manager.includes("../domain/workout/state_machine"), 'manager must delegate workout state')
assert.ok(manager.includes("../domain/workout/repository"), 'manager must delegate workout persistence')
assert.ok(manager.includes("../domain/activity/store"), 'finish must update activity directly')
assert.ok(manager.includes("../domain/history/repository"), 'finish must persist today history directly')
assert.ok(!manager.includes("./watch_data"), 'workout must no longer depend on watch_data')
assert.ok(!manager.includes('MODE_CONFIG'), 'manager must not own workout rules')

assert.ok(state.includes("status: 'running'"), 'state machine must own running state')
assert.ok(state.includes("activeSession.status = 'paused'"), 'state machine must own pause transition')
assert.ok(state.includes("activeSession.status = 'running'"), 'state machine must own resume transition')
assert.ok(!state.includes('#30D158'), 'domain state must not own colors')
assert.ok(!state.includes('durationText'), 'domain state must not own formatted duration')
assert.ok(!state.includes('distanceText'), 'domain state must not own formatted distance')
assert.ok(!state.includes('typeName'), 'domain state must not own display names')

assert.ok(repository.includes("../../platform/vela/storage"), 'workout repository must use platform storage')
assert.ok(mapper.includes("name: '步行'"), 'presentation mapper must own walk label')
assert.ok(mapper.includes("color: '#30D158'"), 'presentation mapper must own workout color')
assert.ok(mapper.includes('formatDuration'), 'presentation mapper must own duration formatting')
assert.ok(mapper.includes('formatDistance'), 'presentation mapper must own distance formatting')

console.log('Workout architecture verified: state, persistence and presentation are separated')
