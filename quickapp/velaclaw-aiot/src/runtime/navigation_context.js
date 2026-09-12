var currentOwner = ''
var currentRoutesEnabled = true

function set(owner, routesEnabled) {
  currentOwner = owner ? String(owner) : ''
  currentRoutesEnabled = routesEnabled !== false
}
function clear(owner) {
  if (!owner || currentOwner === String(owner)) {
    currentOwner = ''
    currentRoutesEnabled = true
  }
}
function get() { return currentOwner }
function routesEnabled() { return currentRoutesEnabled }

module.exports = { set: set, clear: clear, get: get, routesEnabled: routesEnabled }
