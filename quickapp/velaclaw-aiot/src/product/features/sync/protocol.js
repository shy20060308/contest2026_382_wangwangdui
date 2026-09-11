var VERSION = 1

function normalizeChunkSize(value) {
  var size = Math.floor(Number(value))
  if (!isFinite(size) || size < 1) throw new Error('Sync protocol requires a positive chunk size')
  return size
}

function createTransfer(payload, chunkSize) {
  var size = normalizeChunkSize(chunkSize)
  var text = JSON.stringify(payload)
  if (typeof text !== 'string') throw new Error('Sync protocol requires a serializable payload')
  var transferId = 'sync_' + Date.now()
  var packetTotal = Math.max(1, Math.ceil(text.length / size))

  function packetAt(index) {
    if (typeof index !== 'number' || !isFinite(index) || Math.floor(index) !== index || index < 0 || index >= packetTotal) {
      throw new Error('Sync packet index out of range: ' + index)
    }
    return {
      version: VERSION,
      transferId: transferId,
      sequence: index + 1,
      total: packetTotal,
      payload: text.slice(index * size, Math.min(text.length, (index + 1) * size))
    }
  }

  return {
    transferId: transferId,
    bytesText: text.length,
    packetTotal: packetTotal,
    packetAt: packetAt
  }
}

module.exports = { VERSION: VERSION, createTransfer: createTransfer }
