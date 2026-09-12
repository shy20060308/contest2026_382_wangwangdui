const assert = require('assert')
const fs = require('fs')
const path = require('path')
const queueCore = require('../src/capabilities/internal/operation_queue')

function fakeScheduler() {
  let nextId = 1
  const tasks = []
  return {
    setTimeout: function (callback) {
      const task = { id: nextId++, callback: callback, cancelled: false }
      tasks.push(task)
      return task.id
    },
    clearTimeout: function (id) {
      const task = tasks.find(function (item) { return item.id === id })
      if (task) task.cancelled = true
    },
    fireNext: function () {
      const task = tasks.find(function (item) { return !item.cancelled })
      assert.ok(task, 'expected a scheduled queue watchdog')
      task.cancelled = true
      task.callback()
    }
  }
}

const queue = queueCore.createQueue()
let finishFirst = null
let secondStarted = false

queue.enqueue('same-key', function (token) {
  finishFirst = function () {
    queue.complete('same-key', token, function () {
      throw new Error('consumer callback failed')
    })
  }
})
queue.enqueue('same-key', function (token) {
  secondStarted = true
  queue.complete('same-key', token)
})

assert.strictEqual(secondStarted, false, 'second same-key operation must wait for the first')
assert.throws(function () { finishFirst() }, /consumer callback failed/)
assert.strictEqual(secondStarted, true, 'R04: callback failure must not block the queued operation')
assert.strictEqual(queue.length('same-key'), 0)

const parallel = queueCore.createQueue()
let aStarted = false
let bStarted = false
let aToken = null
let bToken = null
parallel.enqueue('a', function (token) { aStarted = true; aToken = token })
parallel.enqueue('b', function (token) { bStarted = true; bToken = token })
assert.ok(aStarted && bStarted, 'different storage keys must not block one another')
parallel.complete('a', aToken)
parallel.complete('b', bToken)

const scheduler = fakeScheduler()
const timed = queueCore.createQueue({
  timeoutMs: 100,
  setTimeout: scheduler.setTimeout,
  clearTimeout: scheduler.clearTimeout
})
let staleToken = null
let currentToken = null
let timedSecondStarted = false
let timeoutCount = 0
let staleCallbackRan = false

timed.enqueue('stalled', function (token) {
  staleToken = token
}, function () {
  timeoutCount++
})
timed.enqueue('stalled', function (token) {
  currentToken = token
  timedSecondStarted = true
})
assert.strictEqual(timedSecondStarted, false, 'watchdog must not start a later same-key operation early')
scheduler.fireNext()
assert.strictEqual(timeoutCount, 1, 'stalled active operation must report exactly one timeout')
assert.strictEqual(timedSecondStarted, true, 'F32: timeout must release the next same-key operation')
assert.strictEqual(timed.isActive('stalled', currentToken), true)
assert.strictEqual(timed.complete('stalled', staleToken, function () { staleCallbackRan = true }), false, 'late completion from timed-out owner must be rejected')
assert.strictEqual(staleCallbackRan, false, 'late native callback must not reach the old consumer after timeout')
assert.strictEqual(timed.isActive('stalled', currentToken), true, 'late old completion must not remove the current operation')
timed.complete('stalled', currentToken)
assert.strictEqual(timed.length('stalled'), 0)

const root = path.resolve(__dirname, '..')
const storage = fs.readFileSync(path.join(root, 'src/capabilities/storage.js'), 'utf8')
assert.ok(storage.includes('STORAGE_OPERATION_TIMEOUT_MS = 8000'), 'Storage must configure a bounded keyed-operation watchdog')
assert.ok(storage.includes('queue.isActive(key, token)'), 'async read completion must verify operation ownership after a timeout')
assert.ok(storage.includes("error.code = 'ETIMEDOUT'"), 'storage timeout must be observable to repository consumers')

console.log('Storage keyed-operation queue verified: consumer exceptions and missing native callbacks cannot stall following writes')
