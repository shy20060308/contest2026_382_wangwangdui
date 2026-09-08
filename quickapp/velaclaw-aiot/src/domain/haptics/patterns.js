var PATTERNS = {
  tap: { id: 'tap', duration: 80, interval: 0, count: 1, mode: 'short' },
  goal: { id: 'goal', duration: 120, interval: 100, count: 2, mode: 'short' },
  countdown: { id: 'countdown', duration: 100, interval: 250, count: 3, mode: 'short' },
  alert: { id: 'alert', duration: 450, interval: 160, count: 2, mode: 'long' }
}

var LEVEL_SCALE = { light: 0.72, medium: 1, strong: 1.3 }

function get(id, level) {
  var source = PATTERNS[id]
  if (!source) throw new Error('Unknown haptic pattern: ' + id)
  var scale = LEVEL_SCALE[level]
  if (!scale) throw new Error('Unknown haptic level: ' + level)
  return { id: source.id, duration: Math.round(source.duration * scale), interval: source.interval, count: source.count, mode: source.mode }
}

function list() {
  return [get('tap', 'medium'), get('goal', 'medium'), get('countdown', 'medium'), get('alert', 'medium')]
}

module.exports = { get: get, list: list }
