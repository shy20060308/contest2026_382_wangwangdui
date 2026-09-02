const assert = require('assert')
const powerState = require('../src/domain/power/state_machine')
const powerPolicy = require('../src/domain/power/policy')

assert.strictEqual(powerState.modeForIdle(0), powerState.MODE_ACTIVE)
assert.strictEqual(powerState.modeForIdle(7999), powerState.MODE_ACTIVE)
assert.strictEqual(powerState.modeForIdle(8000), powerState.MODE_DIM)
assert.strictEqual(powerState.modeForIdle(14999), powerState.MODE_DIM)
assert.strictEqual(powerState.modeForIdle(15000), powerState.MODE_SLEEP)

const machine = powerState.create(1000)
assert.strictEqual(machine.getSnapshot().mode, powerState.MODE_ACTIVE)
assert.strictEqual(machine.evaluate(8999).mode, powerState.MODE_ACTIVE)
assert.strictEqual(machine.evaluate(9000).mode, powerState.MODE_DIM)
assert.strictEqual(machine.evaluate(16000).mode, powerState.MODE_SLEEP)
assert.strictEqual(machine.markActive('touch', 17000).mode, powerState.MODE_ACTIVE)
assert.strictEqual(machine.getSnapshot().lastActiveAt, 17000)

const active = powerPolicy.get(powerState.MODE_ACTIVE)
const dim = powerPolicy.get(powerState.MODE_DIM)
const sleep = powerPolicy.get(powerState.MODE_SLEEP)

assert.strictEqual(active.timeInterval, 1000, 'ACTIVE clock refresh must stay 1s')
assert.strictEqual(active.heartInterval, 3000, 'ACTIVE heart cadence must stay 3s')
assert.strictEqual(active.healthEnabled, true, 'ACTIVE keeps health sampling on')

assert.strictEqual(dim.timeInterval, 5000, 'DIM clock refresh must stay 5s')
assert.strictEqual(dim.heartInterval, 30000, 'DIM business heart updates must stay 30s')
assert.strictEqual(dim.healthEnabled, true, 'DIM keeps the health subscription alive')

assert.strictEqual(sleep.heartInterval, 0, 'SLEEP must stop heart business updates')
assert.strictEqual(sleep.batteryInterval, 0, 'SLEEP must stop battery polling')
assert.strictEqual(sleep.healthEnabled, false, 'SLEEP must release health sampling')
assert.strictEqual(sleep.keepScreenOn, false, 'SLEEP must let the screen turn off')

console.log('Power state machine verified: ACTIVE/DIM/SLEEP and low-power cadence are preserved')
