import settingsStore from '../../../domain/settings/store'
import displayPower from '../../../capabilities/display_power'

export function createBrightnessController(onChange) {
  var state = settingsStore.getSnapshot()

  function emit() {
    var percent = Math.round((state.brightnessValue / 255) * 100)
    var view = {
      brightnessValue: state.brightnessValue,
      brightnessText: percent + '%',
      brightnessDetail: state.brightnessValue + ' / 255',
      manualStateText: state.autoBrightness ? '自动管理' : '可调节',
      autoBrightness: state.autoBrightness,
      raiseWakeEnabled: state.raiseWakeEnabled,
      lowPowerEnabled: state.lowPowerEnabled,
      autoText: state.autoBrightness ? '开' : '关',
      raiseText: state.raiseWakeEnabled ? '开' : '关',
      lowPowerText: state.lowPowerEnabled ? '开' : '关',
      autoColor: state.autoBrightness ? '#30D158' : '#8E8E93',
      raiseColor: state.raiseWakeEnabled ? '#30D158' : '#8E8E93',
      lowPowerColor: state.lowPowerEnabled ? '#30D158' : '#8E8E93'
    }
    if (typeof onChange === 'function') onChange(view)
    return view
  }

  function commit(key, value) {
    state = settingsStore.update(key, value)
    return emit()
  }

  return {
    load: function () { settingsStore.load(function (value) { state = value; emit() }) },
    refresh: emit,
    setBrightness: function (value) {
      if (state.autoBrightness) return emit()
      var next = settingsStore.brightness(value)
      displayPower.setBrightness(next)
      return commit('brightnessValue', next)
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
