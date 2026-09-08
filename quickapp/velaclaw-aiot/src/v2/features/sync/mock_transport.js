function createTransport() {
  var connectTimer = null
  var sendTimer = null
  var cancelled = false

  function clearTimers() {
    clearTimeout(connectTimer)
    clearTimeout(sendTimer)
    connectTimer = null
    sendTimer = null
  }

  return {
    connect: function (options) {
      cancelled = false
      clearTimers()
      connectTimer = setTimeout(function () {
        connectTimer = null
        if (cancelled) return
        options.success({ mode: 'mock', deviceName: 'Vela Sync Host' })
      }, 700)
    },
    send: function (packets, options) {
      cancelled = false
      clearTimeout(sendTimer)
      var index = 0
      function next() {
        if (cancelled) return
        if (index >= packets.length) {
          options.success()
          return
        }
        var packet = packets[index]
        sendTimer = setTimeout(function () {
          sendTimer = null
          if (cancelled) return
          index++
          options.progress({ sent: index, total: packets.length, percent: Math.round((index / packets.length) * 100), sequence: packet.sequence })
          next()
        }, 180)
      }
      next()
    },
    disconnect: function () {
      cancelled = true
      clearTimers()
    }
  }
}

export default {
  capability: function () { return { mode: 'mock', realBleAvailable: false } },
  create: createTransport
}
