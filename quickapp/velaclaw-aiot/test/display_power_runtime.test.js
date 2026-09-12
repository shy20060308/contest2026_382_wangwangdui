const assert = require('assert')
const fs = require('fs')
const path = require('path')
const displayCore = require('../src/capabilities/internal/display_power_core')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const calls = { setValue: [], setMode: [], keep: [], getValue: [], getMode: [] }
const native = {
  setValue: function (options) { calls.setValue.push(options) },
  setMode: function (options) { calls.setMode.push(options) },
  setKeepScreenOn: function (options) { calls.keep.push(options) },
  getValue: function (options) { calls.getValue.push(options) },
  getMode: function (options) { calls.getMode.push(options) }
}
const display = displayCore.createDisplayPower(native)

let valueResult = null
assert.strictEqual(display.setBrightness(120, function (result) { valueResult = result }), true, 'request acceptance is not native success')
assert.strictEqual(valueResult, null, 'setter must wait for native callback before reporting outcome')
calls.setValue[0].fail(null, 31)
assert.strictEqual(valueResult.ok, false, 'R20: async native fail must not be reported as success')
assert.strictEqual(valueResult.error.code, 31)

let modeResult = null
assert.strictEqual(display.setMode(true, function (result) { modeResult = result }), true)
calls.setMode[0].success()
assert.strictEqual(modeResult.ok, true)

let keepResult = null
display.setKeepScreenOn(false, function (result) { keepResult = result })
calls.keep[0].success()
assert.strictEqual(keepResult.ok, true)

let readBrightness = null
display.getBrightness(function (result) { readBrightness = result })
calls.getValue[0].success({ value: 88 })
assert.deepStrictEqual(readBrightness, { ok: true, value: 88, error: null })

let readMode = null
display.getMode(function (result) { readMode = result })
calls.getMode[0].success({ mode: 0 })
assert.deepStrictEqual(readMode, { ok: true, value: false, error: null })

let invalidResult = null
assert.strictEqual(display.setBrightness(300, function (result) { invalidResult = result }), false)
assert.strictEqual(invalidResult.ok, false)

let unavailableResult = null
const unavailable = displayCore.createDisplayPower({})
assert.strictEqual(unavailable.setBrightness(100, function (result) { unavailableResult = result }), false)
assert.strictEqual(unavailableResult.ok, false)

const controller = read('src/product/features/settings/brightness_controller.js')
const surface = JSON.parse(read('src/product/frontend/surfaces/settings__brightness.json'))
assert.ok(controller.includes('displayPower.getBrightness') && controller.includes('displayPower.getMode'), 'Brightness controller must read applied native state')
assert.ok(controller.includes("displayApplyState = 'applying'") && controller.includes("displayApplyState = 'error'"), 'Brightness controller must distinguish desired/applying/error state')
assert.ok(controller.includes('if (!result || !result.ok)'), 'Brightness controller must consume native callback outcomes')
assert.strictEqual(surface.initialState.displayApplyState, 'loading')
const head = surface.modules.filter(module => module.id === 'head')[0]
assert.strictEqual(head.bind.subtitleTrailing, 'displayApplyState')
assert.strictEqual(head.props.subtitleTrailingMap.applied.text, '已应用')
assert.strictEqual(head.props.subtitleTrailingMap.error.text, '应用失败')

console.log('Display power runtime verified: native callbacks determine applied/error state instead of synchronous invocation')
