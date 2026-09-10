var VERSION = 1

function splitText(text, chunkSize) {
  var result = []
  for (var i = 0; i < text.length; i += chunkSize) result.push(text.slice(i, i + chunkSize))
  return result
}

function encode(payload, chunkSize) {
  var text = JSON.stringify(payload)
  var pieces = splitText(text, chunkSize)
  var transferId = 'sync_' + Date.now()
  var packets = []
  for (var i = 0; i < pieces.length; i++) {
    packets.push({ version: VERSION, transferId: transferId, sequence: i + 1, total: pieces.length, payload: pieces[i] })
  }
  return { transferId: transferId, bytesText: text.length, packets: packets }
}

module.exports = { VERSION: VERSION, encode: encode, splitText: splitText }
