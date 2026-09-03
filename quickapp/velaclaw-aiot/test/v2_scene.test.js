const assert = require('assert')
const scene = require('../src/v2/design/scene')

const band10 = {
  formFactor: 'pill',
  logicalHeight: 471,
  viewportTop: '24px',
  viewportHeight: '447px'
}

const host = scene.resolve(band10)
assert.strictEqual(host.height, 447)
assert.strictEqual(host.hostTop, 24)
assert.strictEqual(host.hostBottom, 471)

const safe168 = scene.safeForWidth(band10, 168)
assert.ok(safe168.top >= 0, 'projected safe top must be local to host scene')
assert.ok(safe168.bottom <= host.height, 'projected safe bottom must never exceed host scene')
assert.ok(safe168.height > 300, 'Band10 should retain a useful safe design region')

const circle = { formFactor: 'circle', logicalHeight: 192, viewportTop: '0px', viewportHeight: '192px' }
const circleSafe = scene.safeForWidth(circle, 136)
assert.ok(circleSafe.top > 0 && circleSafe.bottom < 192)

console.log('V2 Host Scene projection verified')
