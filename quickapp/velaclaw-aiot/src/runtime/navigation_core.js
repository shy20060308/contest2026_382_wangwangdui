function paramsKey(params) {
  return JSON.stringify(params || {})
}

function create(options) {
  var config = options || {}
  var now = typeof config.now === 'function' ? config.now : Date.now
  var windowMs = Number(config.windowMs)
  if (!isFinite(windowMs) || windowMs <= 0) windowMs = 300
  var onSuppressed = typeof config.onSuppressed === 'function' ? config.onSuppressed : function () {}
  var recent = {}

  function prune(current) {
    for (var key in recent) if (current - recent[key] >= windowMs) delete recent[key]
  }

  function transition(kind, path, params, owner, invoke) {
    if (typeof invoke !== 'function') throw new Error('Navigation transition requires an invoke function')
    var current = now()
    prune(current)
    var ownerKey = owner ? String(owner) : 'global'
    var key = ownerKey + '|' + kind + '|' + String(path || '') + '|' + paramsKey(params)
    if (recent[key] !== undefined && current - recent[key] < windowMs) {
      onSuppressed(kind, path, ownerKey)
      return false
    }
    invoke()
    recent[key] = current
    return true
  }

  function reset() { recent = {} }

  return { transition: transition, reset: reset }
}

module.exports = { create: create }
