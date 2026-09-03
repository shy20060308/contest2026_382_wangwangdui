import settingsStore from '../../../domain/settings/store'
import vibration from '../../../capabilities/vibration'
import haptics from '../../system/haptics'
var patterns = require('../../../domain/haptics/patterns')

export function createVibrationController(onChange) {
  var state = settingsStore.getSnapshot()
  var feedbackCode = 'idle'

  function snapshot() {
    return {
      enabled: state.vibrationEnabled,
      level: state.vibrationLevel,
      pattern: state.vibrationPattern,
      feedbackCode: feedbackCode,
      systemMode: vibration.getSystemMode(),
      capabilityAvailable: vibration.available()
    }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  function commit(key, value) {
    state = settingsStore.update(key, value)
    return emit()
  }

  function play(name) {
    if (!state.vibrationEnabled) { feedbackCode = 'disabled'; return emit() }
    var normalized = patterns.normalize(name)
    haptics.play(normalized, state.vibrationLevel)
    feedbackCode = vibration.available() ? 'played' : 'unavailable'
    return emit()
  }

  return {
    load: function () { settingsStore.load(function (value) { state = value; feedbackCode = 'loaded'; emit() }) },
    stop: function () { haptics.stop() },
    toggle: function () { return commit('vibrationEnabled', !state.vibrationEnabled) },
    setLevel: function (level) { return commit('vibrationLevel', level) },
    selectPattern: function (name) { state = settingsStore.update('vibrationPattern', patterns.normalize(name)); emit(); return play(name) },
    playCurrent: function () { return play(state.vibrationPattern) },
    refresh: emit
  }
}
