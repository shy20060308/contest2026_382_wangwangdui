import settingsStore from '../../../domain/settings/store'
import displayPower from '../../../capabilities/display_power'

export function createBrightnessController(onChange) {
  var state = settingsStore.getSnapshot()

  function snapshot() {
    return {
      brightnessValue: state.brightnessValue,
      autoBrightness: state.autoBrightness,
      raiseWakeEnabled: state.raiseWakeEnabled,
      lowPowerEnabled: state.lowPowerEnabled
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

  return {
    load: function () { settingsStore.load(function (value) { state = value; emit() }) },
    setBrightness: function (value) {
      if (state.autoBrightness) return emit()
      state = settingsStore.update('brightnessValue', value)
      displayPower.setBrightness(state.brightnessValue)
      return emit()
    },
    toggleAuto: function () {
      var next = !state.autoBrightness
      displayPower.setMode(next)
      if (!next) displayPower.setBrightness(state.brightnessValue)
      return commit('autoBrightness', next)
    },
    toggleRaiseWake: function () { return commit('raiseWakeEnabled', !state.raiseWakeEnabled) },
    toggleLowPower: function () { return commit('lowPowerEnabled', !state.lowPowerEnabled) }
  }
}
