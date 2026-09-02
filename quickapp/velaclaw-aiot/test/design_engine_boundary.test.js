const fs = require('fs')
const path = require('path')
const assert = require('assert')

const root = path.resolve(__dirname, '..')
const read = function (name) { return fs.readFileSync(path.join(root, name), 'utf8') }

const detail = read('src/pages/detail/detail.ux')
const settings = read('src/pages/settings/settings/settings.ux')
const workout = read('src/pages/workout/workout.ux')
const detailSpec = read('src/presentation/layout/specs/detail.js')
const settingsSpec = read('src/presentation/layout/specs/settings.js')
const workoutSpec = read('src/presentation/layout/specs/workout.js')
const pagedStack = read('src/presentation/layout/paged_stack.js')

assert.ok(detail.includes("../../presentation/layout/runtime"), 'L1 detail must enter through Design Engine runtime')
assert.ok(detail.includes("../../presentation/layout/specs/detail"), 'L1 detail must keep layout intent outside the page')
assert.ok(!detail.includes('@media (shape:'), 'L1 detail must not regain shape-specific CSS')
assert.ok(detailSpec.includes('freedomLevel: 1'), 'detail spec must declare L1')

assert.ok(settings.includes("../../../presentation/layout/runtime"), 'L1 settings must enter through Design Engine runtime')
assert.ok(settings.includes("../../../presentation/layout/paged_stack"), 'L1 settings must use automatic paged capacity')
assert.ok(settings.includes("../../../presentation/layout/specs/settings"), 'L1 settings layout intent must live in a spec')
assert.ok(!settings.includes('profile.isCircle'), 'L1 settings must not hardcode circle page capacity')
assert.ok(!settings.includes('@media (shape:'), 'L1 settings must not regain shape-specific geometry CSS')
assert.ok(settingsSpec.includes('freedomLevel: 1'), 'settings spec must declare L1')
assert.ok(pagedStack.includes('for (var count = maxItems; count >= minItems; count--)'), 'paged stack must derive the largest safe page capacity')
assert.ok(pagedStack.includes('capacityReduced'), 'paged stack must expose automatic capacity decisions')

assert.ok(workout.includes("../../presentation/layout/runtime"), 'L2 workout must use Design Engine runtime')
assert.ok(workout.includes("../../presentation/layout/specs/workout"), 'L2 workout must keep composition in a layout spec')
assert.ok(workoutSpec.includes('freedomLevel: 2'), 'workout spec must declare L2')
assert.ok(workoutSpec.includes("strategy: 'assisted'"), 'workout must remain an assisted design')
assert.ok(workoutSpec.includes('fixed-composition'), 'L2 workout may art-direct a shape-specific composition')

console.log('Design freedom boundary verified: L1 automates shape boilerplate while L2 preserves art direction')
