const assert = require('assert')
const fs = require('fs')
const path = require('path')

const protocol = require('../src/product/features/sync/protocol')
const root = path.resolve(__dirname, '..')

const payload = {
  version: protocol.VERSION,
  syncedAt: 123456,
  health: { steps: 12345, calories: 456, standHours: 8, heartRate: 72 },
  history: [
    { date: '2026-09-10', steps: 9999, calories: 320, standHours: 7, avgHeartRate: null, minHeartRate: null, maxHeartRate: null, goalPercent: 83 },
    { date: '2026-09-11', steps: 12345, calories: 456, standHours: 8, avgHeartRate: null, minHeartRate: null, maxHeartRate: null, goalPercent: 100 }
  ],
  workouts: Array.from({ length: 30 }, function (_, index) {
    return {
      id: 'workout-' + index,
      type: index % 2 ? 'run' : 'walk',
      startTime: 1000 + index,
      endTime: 2000 + index,
      durationSec: 60 + index,
      steps: null,
      calories: null,
      distanceMeters: null,
      distanceSource: 'unavailable',
      gpsDistanceMeters: 0,
      gpsPoint: null,
      avgHeartRate: null,
      heartSource: 'none',
      synced: false
    }
  })
}

const chunkSize = 96
const transfer = protocol.createTransfer(payload, chunkSize)
assert.ok(transfer.packetTotal > 1, 'fixture must span multiple packets')
assert.strictEqual(Object.prototype.hasOwnProperty.call(transfer, 'packets'), false, 'transfer must not eagerly retain a packets array')
assert.strictEqual(Object.prototype.hasOwnProperty.call(transfer, 'pieces'), false, 'transfer must not eagerly retain split payload pieces')
assert.strictEqual(typeof transfer.packetAt, 'function')
assert.strictEqual(transfer.bytesText, JSON.stringify(payload).length)

let reconstructed = ''
for (let index = 0; index < transfer.packetTotal; index++) {
  const packet = transfer.packetAt(index)
  assert.strictEqual(packet.version, protocol.VERSION)
  assert.strictEqual(packet.transferId, transfer.transferId)
  assert.strictEqual(packet.sequence, index + 1)
  assert.strictEqual(packet.total, transfer.packetTotal)
  assert.ok(packet.payload.length <= chunkSize)
  reconstructed += packet.payload
}
assert.deepStrictEqual(JSON.parse(reconstructed), payload, 'lazy packets must reconstruct the exact serialized payload')
assert.throws(function () { transfer.packetAt(-1) }, /out of range/)
assert.throws(function () { transfer.packetAt(transfer.packetTotal) }, /out of range/)
assert.throws(function () { protocol.createTransfer(payload, 0) }, /positive chunk size/)
assert.throws(function () { protocol.createTransfer(undefined, 96) }, /serializable payload/)

const controllerSource = fs.readFileSync(path.join(root, 'src/product/features/sync/controller.js'), 'utf8')
assert.ok(controllerSource.includes('protocol.createTransfer(payload, 96)'), 'Sync controller must use lazy transfer creation')
assert.ok(controllerSource.includes('transfer.packetAt(index)'), 'Sync controller must materialize only the packet being sent')
assert.ok(controllerSource.includes('workoutRepository.markAllSynced()'), 'Completion must persist synced flags without a second collection pass')
assert.ok(!controllerSource.includes('markAllSynced(function'), 'Sync completion must not re-read Activity/History/Workout solely to refresh unchanged counts')

console.log('Sync protocol verified: packets are materialized on demand and completion avoids redundant full recollection')
