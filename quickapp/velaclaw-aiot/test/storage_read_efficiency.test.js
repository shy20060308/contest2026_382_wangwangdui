const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const storage = read('src/capabilities/storage.js')
const storageReadResult = read('src/capabilities/internal/storage_read_result.js')
const history = read('src/domain/history/repository.js')
const workout = read('src/domain/workout/repository.js')

assert.ok(storage.includes('memoryCache[key] = stringValue'), 'Storage writes must cache serialized text')
assert.ok(storageReadResult.includes('JSON.parse(value)'), 'structured JSON reads must create a fresh parsed object from cached/persisted text')
assert.ok(storage.includes('readStructured(key, fallback, classifyJson, callback)'), 'getJSONResult must route cached text through the structured JSON parser')
const cacheAssignments = Array.from(storage.matchAll(/memoryCache\[key\]\s*=\s*([a-zA-Z0-9_]+)/g)).map(function (match) { return match[1] })
assert.deepStrictEqual(cacheAssignments.sort(), ['stringValue', 'value'], 'Storage cache assignments must stay limited to serialized writes and native string reads')
assert.ok(!storage.includes('memoryCache[key] = current') && !storage.includes('memoryCache[key] = nextValue'), 'Parsed mutable objects must never enter the storage cache')

assert.ok(history.includes('callback(requireHistory(stored, today))'), 'History reads must return the validated/calendar-window result directly')
assert.ok(!history.includes('callback(clone(requireHistory('), 'History reads must not JSON-clone an already rebuilt read result')
assert.ok(history.includes('callback(clone(history), result)'), 'History write callback isolation must stay explicit')

assert.ok(workout.includes('if (callback) callback(session)'), 'Active workout reads must use the fresh getJSON parse directly')
assert.ok(workout.includes('if (callback) callback(requireRecords(records))'), 'Workout record reads must validate the fresh parsed array without a second JSON clone')
assert.ok(!workout.includes('callback(clone(session))'), 'Active workout reads must not duplicate a fresh parsed session')
assert.ok(!workout.includes('callback(clone(requireRecords(records)))'), 'Workout record reads must not duplicate a fresh parsed record array')
assert.ok(workout.includes('callback(clone(savedRecord), result)'), 'Workout save callback isolation must remain explicit')
assert.ok(workout.includes('callback(clone(records), result)'), 'Workout mark-synced callback isolation must remain explicit when a consumer requests it')

console.log('Storage read efficiency verified: serialized cache text is freshly parsed by the structured read boundary while write callbacks retain explicit isolation')
