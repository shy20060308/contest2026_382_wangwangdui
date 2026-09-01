const assert = require('assert')
const fs = require('fs')
const path = require('path')

const applistPath = path.join(__dirname, '..', 'src', 'pages', 'applist', 'applist.ux')
const source = fs.readFileSync(applistPath, 'utf8')

assert.ok(source.includes("import honeycombLayout from '../../common/honeycomb_layout'"), 'applist must depend on the shared honeycomb engine')
assert.ok(source.includes('honeycombLayout.buildSlots'), 'slot construction must be delegated to honeycomb_layout')
assert.ok(source.includes('honeycombLayout.layoutSlots'), 'per-frame geometry must be delegated to honeycomb_layout')
assert.ok(source.includes('honeycombLayout.pickSlotByDirection'), 'direction picking must be delegated to honeycomb_layout')
assert.ok(source.includes('honeycombLayout.nextDragOffset'), 'drag projection must be delegated to honeycomb_layout')
assert.ok(source.includes('honeycombLayout.backOut'), 'snap easing must be delegated to honeycomb_layout')

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

console.log('applist honeycomb boundary verified')
