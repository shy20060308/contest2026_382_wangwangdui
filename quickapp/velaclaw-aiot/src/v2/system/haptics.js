import vibration from '../../capabilities/vibration'

var timers = []

function clearTimers() {
  for (var i = 0; i < timers.length; i++) clearTimeout(timers[i])
  timers = []
}

function pulsesFor(pattern, level) {
  var strong = level === 'strong'
  var light = level === 'light'
  if (pattern === 'alert') return { count: strong ? 3 : 2, gap: light ? 240 : 180, mode: 'long' }
  if (pattern === 'countdown') return { count: 3, gap: light ? 320 : 260, mode: 'short' }
  if (pattern === 'tap') return { count: 1, gap: 0, mode: 'short' }
  return { count: strong ? 3 : 2, gap: light ? 280 : 220, mode: 'short' }
}

function play(pattern, level) {
  clearTimers()
  var spec = pulsesFor(pattern, level)
  vibration.vibrate(spec.mode)
  for (var i = 1; i < spec.count; i++) {
    ;(function (delay, mode) {
      timers.push(setTimeout(function () { vibration.vibrate(mode) }, delay))
    })(i * spec.gap, spec.mode)
  }
}

export default {
  play: play,
  stop: function () { clearTimers() }
}
