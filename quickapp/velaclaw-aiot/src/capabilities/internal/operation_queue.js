function createQueue() {
  var queues = {}

  function finish(key) {
    var queue = queues[key]
    if (!queue) return
    queue.shift()
    if (queue.length === 0) {
      delete queues[key]
      return
    }
    queue[0]()
  }

  function enqueue(key, operation) {
    if (!queues[key]) queues[key] = []
    queues[key].push(operation)
    if (queues[key].length === 1) operation()
  }

  function complete(key, callback, args) {
    try {
      if (callback) callback.apply(null, args || [])
    } finally {
      finish(key)
    }
  }

  function length(key) {
    return queues[key] ? queues[key].length : 0
  }

  return {
    enqueue: enqueue,
    complete: complete,
    length: length
  }
}

module.exports = { createQueue: createQueue }
