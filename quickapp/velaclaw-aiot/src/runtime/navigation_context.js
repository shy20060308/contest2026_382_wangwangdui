var currentOwner = ''

function set(owner) { currentOwner = owner ? String(owner) : '' }
function clear(owner) { if (!owner || currentOwner === String(owner)) currentOwner = '' }
function get() { return currentOwner }

module.exports = { set: set, clear: clear, get: get }
