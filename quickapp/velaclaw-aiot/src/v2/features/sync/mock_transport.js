var connectTimer = null
var sendTimer = null
var cancelled = false

function clearTimers() {
  clearTimeout(connectTimer)
  clearTimeout(sendTimer)
  connectTimer = null
  sendTimer = null
}

export default {
  capability: function () { return { mode: 'mock', name: '模拟器分包链路', realBleAvailable: false } },
  connect: function (options) {
    cancelled = false
    clearTimers()
    connectTimer = setTimeout(function () {
      connectTimer = null
      if (cancelled) return
      if (options && options.success) options.success({ mode: 'mock', deviceName: 'Vela Sync Host' })
    }, 700)
  },
  send: function (packets, options) {
    cancelled = false
    clearTimeout(sendTimer)
    var source = Array.isArray(packets) ? packets : []
    var index = 0
    function next() {
      if (cancelled) return
      if (index >= source.length) {
        if (options && options.success) options.success()
        return
      }
      var packet = source[index]
      sendTimer = setTimeout(function () {
        sendTimer = null
        if (cancelled) return
        index++
        if (options && options.progress) options.progress({ sent: index, total: source.length, percent: source.length ? Math.round((index / source.length) * 100) : 100, sequence: packet.sequence })
        next()
      }, 180)
    }
    next()
  },
  disconnect: function () { cancelled = true; clearTimers() }
}
