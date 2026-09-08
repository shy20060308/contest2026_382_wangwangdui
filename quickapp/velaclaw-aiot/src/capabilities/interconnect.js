import interconnect from '@system.interconnect'

var messageListeners = []
var stateListeners = []
var connection = null

function isAvailable() {
  return !!(interconnect && interconnect.instance)
}

function emitMessage(message) {
  var current = messageListeners.slice()
  for (var i = 0; i < current.length; i++) current[i](message)
}

function emitState(value) {
  var current = stateListeners.slice()
  for (var i = 0; i < current.length; i++) current[i](value)
}

function failure(action, data, code) {
  var error = data instanceof Error ? data : new Error('interconnect.' + action + ' failed')
  if (code !== undefined) error.code = code
  return error
}

function ensureConnection() {
  if (connection) return connection
  if (!isAvailable()) return null
  try {
    connection = interconnect.instance()
    if (!connection) return null
    connection.onmessage = emitMessage
    connection.onopen = function (data) { emitState({ connected: true, event: 'open', data: data || null }) }
    connection.onclose = function (data) { emitState({ connected: false, event: 'close', data: data || null }) }
    connection.onerror = function (data) { emitState({ connected: false, event: 'error', data: data || null }) }
  } catch (error) {
    connection = null
  }
  return connection
}

function subscribe(listener) {
  if (typeof listener !== 'function' || messageListeners.indexOf(listener) >= 0) return
  messageListeners.push(listener)
  ensureConnection()
}

function unsubscribe(listener) {
  var next = []
  for (var i = 0; i < messageListeners.length; i++) if (messageListeners[i] !== listener) next.push(messageListeners[i])
  messageListeners = next
}

function subscribeState(listener) {
  if (typeof listener !== 'function' || stateListeners.indexOf(listener) >= 0) return
  stateListeners.push(listener)
  ensureConnection()
}

function unsubscribeState(listener) {
  var next = []
  for (var i = 0; i < stateListeners.length; i++) if (stateListeners[i] !== listener) next.push(stateListeners[i])
  stateListeners = next
}

function getReadyState(options) {
  var callbacks = options || {}
  var current = ensureConnection()
  if (!current || typeof current.getReadyState !== 'function') {
    if (callbacks.fail) callbacks.fail(new Error('interconnect.getReadyState unavailable'))
    return false
  }
  try {
    current.getReadyState({
      success: function (data) {
        var connected = !!(data && data.status === 1)
        emitState({ connected: connected, event: 'ready', data: data || null })
        if (callbacks.success) callbacks.success(connected, data)
      },
      fail: function (data, code) {
        var error = failure('getReadyState', data, code)
        emitState({ connected: false, event: 'error', data: data || null, code: code })
        if (callbacks.fail) callbacks.fail(error)
      }
    })
    return true
  } catch (error) {
    if (callbacks.fail) callbacks.fail(error)
    return false
  }
}

function send(data, options) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('interconnect.send requires an object payload')
  var callbacks = options || {}
  var current = ensureConnection()
  if (!current || typeof current.send !== 'function') {
    if (callbacks.fail) callbacks.fail(new Error('interconnect.send unavailable'))
    return false
  }
  try {
    current.send({
      data: data,
      success: function () { if (callbacks.success) callbacks.success() },
      fail: function (value, code) { if (callbacks.fail) callbacks.fail(failure('send', value, code)) }
    })
    return true
  } catch (error) {
    if (callbacks.fail) callbacks.fail(error)
    return false
  }
}

export default {
  isAvailable: isAvailable,
  subscribe: subscribe,
  unsubscribe: unsubscribe,
  subscribeState: subscribeState,
  unsubscribeState: unsubscribeState,
  getReadyState: getReadyState,
  send: send
}
