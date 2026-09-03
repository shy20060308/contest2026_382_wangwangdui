const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const today = read('src/pages/today/today.ux')
const pageRuntime = read('src/v2/app/page_runtime.js')
const scene = read('src/v2/design/scene.js')
const system = read('src/v2/system/index.js')
const calendarBridge = read('src/common/calendar_utils.js')

assert.ok(today.includes('../../v2/app/page_runtime'), 'rewritten pages must enter through V2 page runtime')
assert.ok(today.includes('../../v2/features/today/controller'), 'rewritten pages must bind feature controllers')
assert.ok(!today.includes('../../common/'), 'rewritten pages must not depend on legacy common modules')
assert.ok(!today.includes('../../presentation/layout/'), 'rewritten pages must not depend on legacy layout engine')
assert.ok(!today.includes('@service.') && !today.includes('@system.'), 'device/framework imports must stay outside rewritten feature pages')
assert.ok(!today.includes('@swipe=') && !today.includes('@touch'), 'Today V2 must use explicit controls, not scroll-competing gestures')

assert.ok(pageRuntime.includes("../../presentation/viewport/profile"), 'V2 runtime may consume the shared device profile during migration')
assert.ok(pageRuntime.includes("../design/scene"), 'V2 runtime must project host scene geometry')
assert.ok(!pageRuntime.includes('applyDesign') && !pageRuntime.includes('layoutRuntime'), 'V2 runtime must not mutate host viewport through legacy design policy')
assert.ok(scene.includes('globalSafe.top - scene.hostTop'), 'safe geometry must be projected from device space into host scene space')
assert.ok(scene.includes('globalSafe.bottom - scene.hostTop'), 'safe bottom must be projected into host scene coordinates')

;['battery','blood_oxygen','device','display_power','heart_rate','location','motion','storage','stress','vibration'].forEach(name => {
  assert.ok(system.includes("../../capabilities/" + name), 'V2 system facade missing capability: ' + name)
})
assert.strictEqual(calendarBridge.trim(), "module.exports = require('../v2/domain/calendar')", 'legacy calendar path must forward into V2 domain')

console.log('V2 rewrite architecture verified')
