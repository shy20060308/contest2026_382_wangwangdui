import settingsStore from '../../../domain/settings/store'
import vibration from '../../../capabilities/vibration'
import haptics from '../../../runtime/haptics'

var HAPTIC_OWNER = 'settings-vibration'

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
    if (!state.vibrationEnabled) {
      haptics.stop(HAPTIC_OWNER)
      feedbackCode = 'disabled'
      return emit()
    }
    feedbackCode = haptics.play(name, state.vibrationLevel, HAPTIC_OWNER) ? 'played' : 'unavailable'
    return emit()
  }

  return {
    load: function () { settingsStore.load(function (value) { state = value; feedbackCode = 'loaded'; emit() }) },
    stop: function () { haptics.stop(HAPTIC_OWNER) },
    toggle: function () {
      var enabled = !state.vibrationEnabled
      state = settingsStore.update('vibrationEnabled', enabled)
      if (!enabled) {
        haptics.stop(HAPTIC_OWNER)
        feedbackCode = 'disabled'
      } else {
        feedbackCode = 'idle'
      }
      return emit()
    },
    setLevel: function (level) { return commit('vibrationLevel', level) },
    selectPattern: function (name) {
      state = settingsStore.update('vibrationPattern', name)
      return play(state.vibrationPattern)
    },
    playCurrent: function () { return play(state.vibrationPattern) }
  }
}
