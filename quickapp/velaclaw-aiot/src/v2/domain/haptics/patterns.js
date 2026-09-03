var PATTERNS = {
  tap: { id: 'tap', label: '轻触', duration: 80, interval: 0, count: 1, mode: 'short' },
  goal: { id: 'goal', label: '达标', duration: 120, interval: 100, count: 2, mode: 'short' },
  countdown: { id: 'countdown', label: '倒计时', duration: 100, interval: 250, count: 3, mode: 'short' },
  alert: { id: 'alert', label: '警报', duration: 450, interval: 160, count: 2, mode: 'long' }
}

function normalize(id) { return PATTERNS[id] ? id : 'goal' }
function get(id, level) {
  var source = PATTERNS[normalize(id)]
  var scale = level === 'light' ? 0.72 : level === 'strong' ? 1.3 : 1
  return { id: source.id, label: source.label, duration: Math.max(50, Math.round(source.duration * scale)), interval: source.interval, count: source.count, mode: source.mode }
}
function list() { return [get('tap'), get('goal'), get('countdown'), get('alert')] }

module.exports = { normalize: normalize, get: get, list: list }
