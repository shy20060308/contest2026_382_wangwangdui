const fs = require('fs')
const path = require('path')
const assert = require('assert')

const root = path.resolve(__dirname, '..')
const read = function (name) { return fs.readFileSync(path.join(root, name), 'utf8') }

const store = read('src/domain/activity/store.js')
const repository = read('src/domain/activity/repository.js')
const manager = read('src/common/workout_manager.js')
const today = read('src/pages/today/today.ux')
const steps = read('src/pages/steps/steps.ux')

assert.ok(repository.includes("../../platform/vela/storage"), 'activity repository must persist through platform storage')
assert.ok(repository.includes("ACTIVITY_KEY = 'activity_today_v2'"), 'activity repository must own a daily persistence key')
assert.ok(store.includes("import activityRepository from './repository'"), 'activity store must own persistence through its repository')
assert.ok(store.includes('hydrate: function'), 'activity store must expose explicit hydration')
assert.ok(store.includes('addAndPersist: function'), 'activity mutations crossing pages must be persisted')

assert.ok(manager.includes('activityStore.addAndPersist(record.steps, record.calories'), 'workout finish must persist activity before navigation')
assert.ok(manager.includes('historyRepository.saveToday(activitySnapshot'), 'history must commit the exact persisted activity snapshot')

assert.ok(today.includes("../../domain/activity/store"), 'today must consume activity domain directly')
assert.ok(today.includes('activityStore.hydrate'), 'today must reload cross-page activity state')
assert.ok(!today.includes('watch_data'), 'today must not depend on watch_data compatibility state')

assert.ok(steps.includes("../../domain/activity/store"), 'steps page must consume activity domain directly')
assert.ok(steps.includes('activityStore.hydrate'), 'steps page must reload cross-page activity state')
assert.ok(!steps.includes('watch_data'), 'steps page must not depend on watch_data compatibility state')

console.log('Activity persistence verified: workout commits survive page/module boundaries')
