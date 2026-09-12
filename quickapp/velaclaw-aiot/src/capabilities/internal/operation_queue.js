function createQueue(options) {
  var config = options || {}
  var queues = {}
  var nextToken = 1
  var timeoutMs = Math.max(0, Number(config.timeoutMs) || 0)
  var schedule = typeof config.setTimeout === 'function' ? config.setTimeout : (typeof setTimeout === 'function' ? setTimeout : null)
  var cancel = typeof config.clearTimeout === 'function' ? config.clearTimeout : (typeof clearTimeout === 'function' ? clearTimeout : null)

  function clearEntryTimer(entry) {
    if (!entry || entry.timer === null || entry.timer === undefined || !cancel) return
    cancel(entry.timer)
    entry.timer = null
  }

  function start(key) {
    var queue = queues[key]
    if (!queue || !queue.length) return
    var entry = queue[0]
    if (entry.started) return
    entry.started = true
    if (timeoutMs > 0 && schedule) {
      entry.timer = schedule(function () { expire(key, entry.token) }, timeoutMs)
    }
    entry.operation(entry.token)
  }

  function removeActive(key, token) {
    var queue = queues[key]
    if (!queue || !queue.length || queue[0].token !== token) return null
    var entry = queue.shift()
    clearEntryTimer(entry)
    if (queue.length === 0) delete queues[key]
    return entry
  }

  function advance(key) {
    if (queues[key] && queues[key].length) start(key)
  }

  function expire(key, token) {
    var entry = removeActive(key, token)
    if (!entry) return false
    try {
      if (entry.onTimeout) entry.onTimeout(token)
    } finally {
      advance(key)
    }
    return true
  }

  function enqueue(key, operation, onTimeout) {
    if (typeof operation !== 'function') throw new Error('Operation queue requires a function')
    if (!queues[key]) queues[key] = []
    var entry = {
      token: nextToken++,
      operation: operation,
      onTimeout: typeof onTimeout === 'function' ? onTimeout : null,
      timer: null,
      started: false
    }
    queues[key].push(entry)
    if (queues[key].length === 1) start(key)
    return entry.token
  }

  function complete(key, token, callback, args) {
    var entry = removeActive(key, token)
    if (!entry) return false
    try {
      if (callback) callback.apply(null, args || [])
    } finally {
      advance(key)
    }
    return true
  }

  function isActive(key, token) {
    return !!(queues[key] && queues[key].length && queues[key][0].token === token && queues[key][0].started)
  }

  function length(key) {
    return queues[key] ? queues[key].length : 0
  }

  return {
    enqueue: enqueue,
    complete: complete,
    isActive: isActive,
    length: length
  }
}

module.exports = { createQueue: createQueue }
