import vibration from '../../capabilities/vibration'
var patterns = require('../../domain/haptics/patterns')

var timers = []

function clearTimers() {
  for (var i = 0; i < timers.length; i++) clearTimeout(timers[i])
  timers = []
}

function play(pattern, level) {
  clearTimers()
  var spec = patterns.get(pattern, level)
  vibration.vibrate(spec.mode)
  for (var i = 1; i < spec.count; i++) {
    ;(function (delay, mode) {
      timers.push(setTimeout(function () { vibration.vibrate(mode) }, delay))
    })(i * (spec.duration + spec.interval), spec.mode)
  }
}

export default {
  play: play,
  stop: clearTimers
}
