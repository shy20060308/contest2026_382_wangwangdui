function createRuntime(options) {
  if (!options || typeof options.vibrate !== 'function') throw new Error('Haptics Runtime requires vibrate dependency')
  var vibrate = options.vibrate
  var setTimer = typeof options.setTimeout === 'function' ? options.setTimeout : setTimeout
  var clearTimer = typeof options.clearTimeout === 'function' ? options.clearTimeout : clearTimeout
  var timers = []
  var activeOwner = null
  var generation = 0

  function clearScheduled() {
    for (var i = 0; i < timers.length; i++) clearTimer(timers[i])
    timers = []
  }

  function play(spec, owner) {
    if (!owner) return false

    generation++
    var run = generation
    clearScheduled()
    activeOwner = owner

    var firstPlayed = !!vibrate(spec.mode)
    if (!firstPlayed) {
      activeOwner = null
      return false
    }

    for (var i = 1; i < spec.count; i++) {
      ;(function (delay, mode, expectedOwner, expectedRun) {
        timers.push(setTimer(function () {
          if (generation !== expectedRun || activeOwner !== expectedOwner) return
          vibrate(mode)
        }, delay))
      })(i * (spec.duration + spec.interval), spec.mode, owner, run)
    }
    return true
  }

  function stop(owner) {
    if (!owner || activeOwner !== owner) return false
    generation++
    clearScheduled()
    activeOwner = null
    return true
  }

  return {
    play: play,
    stop: stop,
    getActiveOwner: function () { return activeOwner }
  }
}

module.exports = { createRuntime: createRuntime }
