const assert = require('assert')
const viewportPolicy = require('../src/presentation/viewport/policy')

const band10Beta = {
  viewportClass: 'beta-pill-viewport-212',
  viewportPosition: 'absolute',
  viewportLeft: '0px',
  viewportTop: '24px',
  viewportWidth: '192px',
  viewportHeight: '447px',
  logicalHeight: 471,
  isBetaPillViewport: true
}

const legacy = viewportPolicy.legacy(band10Beta)
assert.strictEqual(legacy.viewportTop, '24px', 'legacy pages must retain the beta host compatibility inset')
assert.strictEqual(legacy.viewportHeight, '447px', 'legacy pages must retain the reduced beta canvas')

const design = viewportPolicy.design(band10Beta)
assert.strictEqual(design.viewportPosition, 'absolute')
assert.strictEqual(design.viewportTop, '0px', 'Design Engine coordinates must start at the full design-canvas origin')
assert.strictEqual(design.viewportWidth, '192px')
assert.strictEqual(design.viewportHeight, '471px', 'Design Engine render height must match profile.logicalHeight')

const normal = {
  viewportClass: '',
  viewportPosition: 'relative',
  viewportLeft: '0px',
  viewportTop: '0px',
  viewportWidth: '100%',
  viewportHeight: '100%',
  logicalHeight: 192,
  isBetaPillViewport: false
}
assert.deepStrictEqual(viewportPolicy.design(normal), viewportPolicy.legacy(normal), 'non-beta devices must not gain a second viewport policy')

console.log('Design viewport policy verified: beta compatibility and Design Engine coordinates are separated')
