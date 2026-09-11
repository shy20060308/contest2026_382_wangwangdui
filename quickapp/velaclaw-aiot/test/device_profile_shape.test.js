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
assert.ok(wrapper.includes('metadataWaiters.push(callback)'), 'pages using a provisional viewport profile must wait for metadata correction')
assert.ok(wrapper.includes('cached = core.make(info, local || {})'), 'native metadata must rebuild the cached profile instead of only enriching labels')
assert.ok(wrapper.includes('flush(metadataWaiters, cached)'), 'corrected profile must be re-emitted to currently alive pages')

console.log('Device profile shape correction verified: explicit shape overrides provisional ratio inference while Host geometry remains authoritative')
