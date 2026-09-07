const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const exists = name => fs.existsSync(path.join(root, name))

const repository = read('src/domain/history/repository.js')
const controller = read('src/v2/features/history/controller.js')
const view = read('src/v2/design/apps/history/view.js')

assert.strictEqual(exists('src/domain/health/recent.js'), false, 'History must not regain seeded health state')
assert.ok(repository.includes("HISTORY_KEY = 'activity_history_v3'"), 'History must use the clean V3 persistence namespace')
assert.ok(!repository.includes('makeDemoHistory'), 'History must not fabricate missing activity history')
assert.ok(!repository.includes('makeDemoHourly'), 'History must not fabricate hourly heart-rate history')
assert.ok(!repository.includes('hourlyHeartRate'), 'Retired demo hourly heart-rate state must stay removed')
assert.ok(!repository.includes("../health/recent"), 'History must not depend on seeded compatibility health data')
assert.ok(!repository.includes("'health_history_7d'"), 'V3 must not reopen the persistence namespace that may contain seeded legacy history')
assert.ok(repository.includes('avgHeartRate: null'), 'History must represent unavailable daily heart-rate aggregates as unavailable')
assert.ok(controller.includes('heartCount ? Math.round(totalHeart / heartCount) : 0'), 'History average heart rate must only include available truthful records')
assert.ok(view.includes("avgHeartRate ? Math.round(source.avgHeartRate) + ' bpm' : '--'"), 'History UI must show unavailable heart-rate aggregates explicitly')

console.log('History truth contracts verified: no seeded activity or heart-rate history')
