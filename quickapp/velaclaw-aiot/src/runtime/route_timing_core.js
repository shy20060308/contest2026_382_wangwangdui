var DEFAULT_MAX_PENDING_MS = 15000

function normalizeRoute(route) {
  var value = String(route || '')
  return value.charAt(0) === '/' ? value.slice(1) : value
}

function create(options) {
  var config = options || {}
  var now = typeof config.now === 'function' ? config.now : Date.now
  var onReady = typeof config.onReady === 'function' ? config.onReady : function () {}
  var maxPendingMs = Number(config.maxPendingMs)
  if (!isFinite(maxPendingMs) || maxPendingMs <= 0) maxPendingMs = DEFAULT_MAX_PENDING_MS
  var sequence = 0
  var pending = {}

  function prune(current) {
    for (var route in pending) if (current - pending[route].startedAt > maxPendingMs) delete pending[route]
  }

  function begin(route, kind) {
    var current = now()
    prune(current)
    var key = normalizeRoute(route)
    if (!key) throw new Error('Route timing requires a target route')
    var token = { id: ++sequence, route: key }
    pending[key] = { id: token.id, kind: kind || 'push', startedAt: current, confirmed: false, readyAt: null }
    return token
  }

  function settle(entry, route) {
    if (!entry || !entry.confirmed || entry.readyAt === null) return false
    var duration = Math.max(0, entry.readyAt - entry.startedAt)
    delete pending[route]
    onReady(duration, entry.kind, route)
    return true
  }

  function confirm(token) {
    if (!token) return false
    var route = normalizeRoute(token.route)
    var entry = pending[route]
    if (!entry || entry.id !== token.id) return false
    entry.confirmed = true
    return settle(entry, route)
  }

  function complete(route) {
    var current = now()
    prune(current)
    var key = normalizeRoute(route)
    var entry = pending[key]
    if (!entry) return false
    entry.readyAt = current
    return settle(entry, key)
  }

  function reset() { pending = {}; sequence = 0 }

  return { begin: begin, confirm: confirm, complete: complete, reset: reset }
}

module.exports = { create: create, normalizeRoute: normalizeRoute, DEFAULT_MAX_PENDING_MS: DEFAULT_MAX_PENDING_MS }
