const fs = require('fs')
const path = require('path')
const assert = require('assert')

const root = path.resolve(__dirname, '..')
const read = function (name) { return fs.readFileSync(path.join(root, name), 'utf8') }

const clock = read('src/pages/clock/clock.ux')
const runtime = read('src/runtime/power/controller.js')
const powerMapper = read('src/presentation/mappers/power.js')
const batteryMapper = read('src/presentation/mappers/battery.js')

assert.ok(clock.includes("../../runtime/power/controller"), 'clock must consume Power Runtime')
assert.ok(clock.includes("../../presentation/mappers/power"), 'clock power display must come from presentation mapper')
assert.ok(clock.includes("../../presentation/mappers/battery"), 'clock battery display must come from presentation mapper')
assert.ok(clock.includes('this.powerRuntime = powerRuntimeFactory.create'), 'clock must create one page-scoped Power Runtime')
assert.ok(clock.includes('this.powerRuntime.configure({'), 'device settings must configure runtime rather than restart page timers')
assert.ok(clock.includes('if (this.powerRuntime) this.powerRuntime.start()'), 'clock show/runtime start must activate Power Runtime')
assert.ok(clock.includes('if (this.powerRuntime) this.powerRuntime.stop()'), 'clock hide/destroy must stop Power Runtime')
assert.ok(clock.includes('this.powerRuntime.markActive(reason)'), 'user activity must be forwarded to runtime')
assert.ok(clock.includes('applyRuntimeHeartRate(sample)'), 'clock must consume semantic HR samples from runtime')
assert.ok(clock.includes('batteryMapper.map(percent)'), 'clock must map battery percent through presentation')

;[
  "from '@system.battery'",
  'health_sample_service',
  'power_manager',
  'startPowerControl',
  'stopPowerControl',
  'checkPowerIdle',
  'applyPowerMode',
  'startActiveTimers',
  'stopActiveTimers',
  'startWatchFaceHealth',
  'stopWatchFaceHealth',
  'setInterval('
].forEach(function (token) {
  assert.ok(!clock.includes(token), 'clock page must not regain runtime responsibility: ' + token)
})

assert.ok(runtime.includes("../../domain/power/state_machine"), 'runtime must orchestrate the Power state machine')
assert.ok(runtime.includes("../../domain/power/policy"), 'runtime must consume power cadence policy')
assert.ok(runtime.includes("../../capabilities/heart_rate"), 'runtime must own heart-rate capability lifecycle')
assert.ok(runtime.includes("../../capabilities/battery"), 'runtime must own battery reads')
assert.ok(runtime.includes("../../capabilities/motion"), 'runtime must own raise-wake lifecycle')
assert.ok(runtime.includes("../../capabilities/display_power"), 'runtime must own display effects')
assert.ok(runtime.includes('reconcileIdleTimer()'), 'runtime must stop idle polling when low power is disabled')
assert.ok(runtime.includes('brightnessChanged && currentMode === stateMachine.MODE_ACTIVE'), 'loaded active brightness must apply immediately')
assert.ok(!runtime.includes('@system.'), 'runtime must not access raw system APIs')
assert.ok(!runtime.includes('@service.'), 'runtime must not access raw services')

assert.ok(powerMapper.includes("label: '暗屏'"), 'power labels belong to presentation')
assert.ok(batteryMapper.includes("color = '#FF375F'"), 'battery thresholds/colors belong to presentation')

console.log('Clock runtime boundary verified: page renders events while Power Runtime owns device cadence')
