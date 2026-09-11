const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const storage = read('src/capabilities/storage.js')
const history = read('src/domain/history/repository.js')
const workout = read('src/domain/workout/repository.js')

assert.ok(storage.includes('memoryCache[key] = stringValue'), 'Storage writes must cache serialized text')
assert.ok(storage.includes('return JSON.parse(value)'), 'getJSON must create a fresh parsed object from cached/persisted text')
const cacheAssignments = Array.from(storage.matchAll(/memoryCache\[key\]\s*=\s*([a-zA-Z0-9_]+)/g)).map(function (match) { return match[1] })
assert.deepStrictEqual(cacheAssignments.sort(), ['stringValue', 'value'], 'Storage cache assignments must stay limited to serialized writes and native string reads')
assert.ok(!storage.includes('memoryCache[key] = current') && !storage.includes('memoryCache[key] = nextValue'), 'Parsed mutable objects must never enter the storage cache')

assert.ok(history.includes('callback(requireHistory(stored))'), 'History reads must return the validated/rebuilt read result directly')
assert.ok(!history.includes('callback(clone(requireHistory(stored)))'), 'History reads must not JSON-clone an already rebuilt read result')
assert.ok(history.includes('callback(clone(history), result)'), 'History write callback isolation must stay explicit')

assert.ok(workout.includes('if (callback) callback(session)'), 'Active workout reads must use the fresh getJSON parse directly')
assert.ok(workout.includes('if (callback) callback(requireRecords(records))'), 'Workout record reads must validate the fresh parsed array without a second JSON clone')
assert.ok(!workout.includes('callback(clone(session))'), 'Active workout reads must not duplicate a fresh parsed session')
assert.ok(!workout.includes('callback(clone(requireRecords(records)))'), 'Workout record reads must not duplicate a fresh parsed record array')
assert.ok(workout.includes('callback(clone(savedRecord), result)'), 'Workout save callback isolation must remain explicit')
assert.ok(workout.includes('callback(clone(records), result)'), 'Workout mark-synced callback isolation must remain explicit when a consumer requests it')

console.log('Storage read efficiency verified: reads rely on fresh parse ownership while write callbacks retain explicit isolation')
