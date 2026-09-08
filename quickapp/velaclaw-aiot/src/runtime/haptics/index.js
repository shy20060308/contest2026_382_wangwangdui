import vibration from '../../capabilities/vibration'
var patterns = require('../../domain/haptics/patterns')
var core = require('./core')

var runtime = core.createRuntime({
  vibrate: function (mode) { return vibration.vibrate(mode) }
})

function play(pattern, level, owner) {
  return runtime.play(patterns.get(pattern, level), owner)
}

function stop(owner) {
  return runtime.stop(owner)
}

export default {
  play: play,
  stop: stop
}
