import vibration from '../../capabilities/vibration'

var timers = []

function clearTimers() {
  for (var i = 0; i < timers.length; i++) clearTimeout(timers[i])
  timers = []
}

function pulsesFor(pattern, level) {
  var strong = level === 'strong'
  if (pattern === 'alert') return { count: strong ? 4 : 3, gap: 180 }
  if (pattern === 'countdown') return { count: 3, gap: 260 }
  if (pattern === 'tap') return { count: 1, gap: 0 }
  return { count: strong ? 3 : 2, gap: 220 }
}

function play(pattern, level) {
  clearTimers()
  var spec = pulsesFor(pattern, level)
  var mode = vibration.getSystemMode()
  if (mode === undefined || mode === null || mode < 0) mode = 0
  vibration.vibrate(mode)
  for (var i = 1; i < spec.count; i++) {
    ;(function (delay) {
      timers.push(setTimeout(function () { vibration.vibrate(mode) }, delay))
    })(i * spec.gap)
  }
}

export default {
  play: play,
  stop: function () { clearTimers() }
}
