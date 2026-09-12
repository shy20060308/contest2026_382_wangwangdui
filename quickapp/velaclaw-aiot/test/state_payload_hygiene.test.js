const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const clock = read('src/product/features/clock/controller.js')
const today = read('src/product/features/today/controller.js')
const sync = read('src/product/features/sync/controller.js')
const registry = read('src/product/controller_registry.js')
const todaySurface = read('src/product/frontend/surfaces/today.json')
const clockSurface = require('../src/product/frontend/surfaces/clock.json')

assert.ok(!clock.includes('heartRateValues'), 'Clock high-frequency state must not retain an unconsumed heart-rate window')
assert.ok(!clock.includes('faceIndex'), 'Clock high-frequency state must use faceId as the only authored face selector')
assert.ok(!/state\.face(?:Sport|Simple|Dashboard|Mechanical|Alpine)\s*=/.test(registry), 'Clock registry must not expand faceId into duplicate per-face booleans')
;['circle', 'pill', 'rect'].forEach(function (shape) {
  assert.strictEqual(clockSurface.experience[shape].stage.bind.variant, 'faceId', shape + ' Clock stage must select directly from faceId')
})

assert.ok(!today.includes('currentYear'), 'Today state must not emit unused currentYear alongside calendarYear')
assert.ok(!registry.includes('calendarMonthNumber'), 'Today registry must not derive an unconsumed duplicate calendar month number')
assert.ok(!todaySurface.includes('currentYear') && !todaySurface.includes('calendarMonthNumber'), 'Today Surface must stay independent of removed duplicate date fields')

assert.ok(!sync.includes('packetCount'), 'Lazy sync state must not duplicate packetTotal as an eager-packet count')

console.log('State payload hygiene verified: high-frequency Surface state excludes known unconsumed duplicate fields')
