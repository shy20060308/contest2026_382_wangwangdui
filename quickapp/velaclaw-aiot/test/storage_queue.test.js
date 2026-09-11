const assert = require('assert')
const queueCore = require('../src/capabilities/internal/operation_queue')

const queue = queueCore.createQueue()
let finishFirst = null
let secondStarted = false

queue.enqueue('same-key', function () {
  finishFirst = function () {
    queue.complete('same-key', function () {
      throw new Error('consumer callback failed')
    })
  }
})
queue.enqueue('same-key', function () {
  secondStarted = true
  queue.complete('same-key')
})

assert.strictEqual(secondStarted, false, 'second same-key operation must wait for the first')
assert.throws(function () { finishFirst() }, /consumer callback failed/)
assert.strictEqual(secondStarted, true, 'R04: callback failure must not block the queued operation')
assert.strictEqual(queue.length('same-key'), 0)

const parallel = queueCore.createQueue()
let aStarted = false
let bStarted = false
parallel.enqueue('a', function () { aStarted = true })
parallel.enqueue('b', function () { bStarted = true })
assert.ok(aStarted && bStarted, 'different storage keys must not block one another')
parallel.complete('a')
parallel.complete('b')

console.log('Storage keyed-operation queue verified: consumer exceptions cannot stall following writes')
