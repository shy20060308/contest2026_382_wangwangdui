var MODE_ACTIVE = 'ACTIVE'
var MODE_DIM = 'DIM'
var MODE_SLEEP = 'SLEEP'
var DIM_AFTER_MS = 8000
var SLEEP_AFTER_MS = 15000

function requireMode(mode) {
  if (mode !== MODE_ACTIVE && mode !== MODE_DIM && mode !== MODE_SLEEP) throw new Error('Unknown power mode: ' + mode)
  return mode
}

function requireTime(value) {
  if (typeof value !== 'number' || !isFinite(value)) throw new Error('Power state machine requires numeric time')
  return value
}

function modeForIdle(idleMs) {
  if (typeof idleMs !== 'number' || !isFinite(idleMs)) throw new Error('Power state machine requires numeric idle duration')
  if (idleMs >= SLEEP_AFTER_MS) return MODE_SLEEP
  if (idleMs >= DIM_AFTER_MS) return MODE_DIM
  return MODE_ACTIVE
}

function create(initialNow) {
  var initialTime = requireTime(initialNow)
  var state = {
    mode: MODE_ACTIVE,
    lastActiveAt: initialTime,
    changedAt: initialTime,
    reason: 'init'
  }

  function snapshot() {
    return {
      mode: state.mode,
      lastActiveAt: state.lastActiveAt,
      changedAt: state.changedAt,
      reason: state.reason
    }
  }

  function transition(nextMode, reason, now) {
    var next = requireMode(nextMode)
    if (state.mode !== next) {
      state.mode = next
      state.changedAt = now
      state.reason = reason
    }
    return snapshot()
  }

  return {
    markActive: function (reason, now) {
      var time = requireTime(now)
      state.lastActiveAt = time
      return transition(MODE_ACTIVE, reason, time)
    },
    evaluate: function (now) {
      var time = requireTime(now)
      return transition(modeForIdle(time - state.lastActiveAt), 'idle', time)
    },
    force: function (mode, reason, now) {
      return transition(mode, reason, requireTime(now))
    },
    getSnapshot: snapshot
  }
}

module.exports = {
  MODE_ACTIVE: MODE_ACTIVE,
  MODE_DIM: MODE_DIM,
  MODE_SLEEP: MODE_SLEEP,
  DIM_AFTER_MS: DIM_AFTER_MS,
  SLEEP_AFTER_MS: SLEEP_AFTER_MS,
  requireMode: requireMode,
  modeForIdle: modeForIdle,
  create: create
}
