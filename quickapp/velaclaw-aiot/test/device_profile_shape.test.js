const assert = require('assert')
const fs = require('fs')
const path = require('path')
const core = require('../src/runtime/device_profile_core')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

const local = { screenWidth: 400, screenHeight: 400 }
const provisional = core.make({}, local)
assert.strictEqual(provisional.formFactor, 'circle', 'square viewport without metadata may be provisionally inferred as circle')

const corrected = core.make({ screenShape: 'rect', model: 'explicit-rect' }, local)
assert.strictEqual(corrected.formFactor, 'rect', 'explicit native shape must correct ratio-based provisional inference')
assert.strictEqual(corrected.screenWidth, 400, 'host viewport width remains authoritative for layout geometry')
assert.strictEqual(corrected.screenHeight, 400, 'host viewport height remains authoritative for layout geometry')
assert.strictEqual(corrected.model, 'explicit-rect')
assert.deepStrictEqual(corrected.safeInsets, { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 })

const explicitLocal = core.make({ screenShape: 'circle' }, { screenWidth: 400, screenHeight: 400, screenShape: 'rect' })
assert.strictEqual(explicitLocal.formFactor, 'rect', 'explicit Host shape must outrank later capability metadata')

const wrapper = read('src/runtime/device_profile.js')
assert.ok(wrapper.includes('metadataWaiters.push(callback)'), 'pages using a provisional viewport profile may wait for a real layout correction')
assert.ok(wrapper.includes('function sameLayout(a, b)'), 'device profile wrapper must distinguish metadata enrichment from layout correction')
assert.ok(wrapper.includes('if (sameLayout(previous, corrected))'), 'unchanged layout metadata must not re-enter page initialization')
assert.ok(wrapper.includes('metadataWaiters.length = 0'), 'same-layout metadata waiters must be discarded without a second callback')
assert.ok(wrapper.includes('flush(metadataWaiters, corrected)'), 'a real form-factor/geometry correction must still reach live pages')

const surfacePage = read('src/runtime/surface_page.js')
assert.ok(surfacePage.includes('var reconfigure = !!page._surfaceController'), 'Surface Page must detect a repeated device-profile callback')
assert.ok(surfacePage.includes('if (!reconfigure) {'), 'Surface Page must create its controller only on the first profile resolution')
assert.ok(surfacePage.includes("controllerCall(page, 'controller-profile-stop', 'stop')"), 'live profile correction must stop the existing controller before reconfiguration')
assert.ok(surfacePage.includes("'controller-reconfigure'"), 'profile correction must reconfigure the existing controller instead of constructing a second instance')

console.log('Device profile shape correction verified: metadata enrichment does not duplicate page/controller initialization while real layout corrections reconfigure in place')
