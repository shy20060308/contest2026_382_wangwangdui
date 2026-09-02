const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const applistPath = path.join(root, 'src', 'pages', 'applist', 'applist.ux')
const source = fs.readFileSync(applistPath, 'utf8')
const bridge = fs.readFileSync(path.join(root, 'src', 'common', 'honeycomb_layout.js'), 'utf8')
const engine = fs.readFileSync(path.join(root, 'src', 'presentation', 'engines', 'honeycomb.js'), 'utf8')

assert.ok(source.includes("import honeycombLayout from '../../common/honeycomb_layout'"), 'applist compatibility import must still resolve the shared L3 engine')
assert.ok(source.includes('honeycombLayout.buildSlots'), 'slot construction must be delegated to honeycomb engine')
assert.ok(source.includes('honeycombLayout.layoutSlots'), 'per-frame geometry must be delegated to honeycomb engine')
assert.ok(source.includes('honeycombLayout.pickSlotByDirection'), 'direction picking must be delegated to honeycomb engine')
assert.ok(source.includes('honeycombLayout.nextDragOffset'), 'drag projection must be delegated to honeycomb engine')
assert.ok(source.includes('honeycombLayout.backOut'), 'snap easing must be delegated to honeycomb engine')

;[
  'CIRCLE_SPACING',
  'CIRCLE_ROW_HEIGHT',
  'CIRCLE_HALF_STEP',
  'CIRCLE_EMPHASIS_FALLOFF',
  'CIRCLE_ELASTIC_BASE',
  'CIRCLE_ELASTIC_RANGE',
  'CIRCLE_GRID_COORDS'
].forEach(function (token) {
  assert.ok(!source.includes(token), 'applist leaked honeycomb geometry constant: ' + token)
})

assert.ok(!source.includes('Math.sqrt(CIRCLE_SPACING'), 'applist must not regenerate honeycomb lattice geometry')
assert.ok(!source.includes('distance / alignment'), 'applist must not duplicate directional geometry scoring')
assert.ok(bridge.includes("../presentation/engines/honeycomb"), 'common path must be a compatibility bridge to the L3 engine')
assert.ok(bridge.split(/\r?\n/).filter(Boolean).length <= 2, 'compatibility bridge must not regain honeycomb implementation')
assert.ok(engine.includes('SPACING = 46'), 'presentation engine must own lattice spacing')
assert.ok(engine.includes('FOCUS_Y = 90'), 'presentation engine must own focus geometry')
assert.ok(engine.includes('ICON_BASE = 34'), 'presentation engine must own icon geometry')

console.log('applist L3 honeycomb boundary verified')
