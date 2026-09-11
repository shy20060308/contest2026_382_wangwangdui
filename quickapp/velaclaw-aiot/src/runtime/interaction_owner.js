var nextOwnerId = 0

function create(label) {
  var active = false
  var generation = 0
  var key = String(label || 'page') + ':' + (++nextOwnerId)

  return {
    activate: function () {
      active = true
      generation++
      return generation
    },
    deactivate: function () {
      active = false
      generation++
    },
    capture: function () { return generation },
    isCurrent: function (token) { return active && token === generation },
    isActive: function () { return active },
    key: function () { return key }
  }
}

module.exports = { create: create }
