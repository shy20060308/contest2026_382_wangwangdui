import settingsStore from '../../../domain/settings/store'
import displayPower from '../../../capabilities/display_power'

export function createBrightnessController(onChange) {
  var state = settingsStore.getSnapshot()
  var appliedBrightnessValue = null
  var appliedAutoBrightness = null
  var displayApplyState = 'loading'
  var displayApplyError = ''

  function snapshot() {
    return {
      brightnessValue: state.brightnessValue,
      autoBrightness: state.autoBrightness,
      raiseWakeEnabled: state.raiseWakeEnabled,
      lowPowerEnabled: state.lowPowerEnabled,
      appliedBrightnessValue: appliedBrightnessValue,
      appliedAutoBrightness: appliedAutoBrightness,
      displayApplyState: displayApplyState,
      displayApplyError: displayApplyError
    }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  function resultError(result) {
    if (!result || !result.error) return 'native-failure'
    if (result.error.code !== undefined) return 'native-' + result.error.code
    return result.error.message || 'native-failure'
  }

  function markApplying() {
    displayApplyState = 'applying'
    displayApplyError = ''
    emit()
  }

  function markApplied() {
    displayApplyState = 'applied'
    displayApplyError = ''
    emit()
  }

  function markError(result) {
    displayApplyState = 'error'
    displayApplyError = resultError(result)
    emit()
  }

  function commit(key, value) {
    state = settingsStore.update(key, value)
    return emit()
  }

  function readAppliedState() {
    var pending = 2
    var failed = false
    displayApplyState = 'loading'
    displayApplyError = ''
    emit()

    function done() {
      pending--
      if (pending > 0) return
      if (failed) {
        displayApplyState = 'error'
      } else {
        var modeMatches = appliedAutoBrightness === state.autoBrightness
        var brightnessMatches = state.autoBrightness || appliedBrightnessValue === state.brightnessValue
        displayApplyState = modeMatches && brightnessMatches ? 'applied' : 'pending'
      }
      emit()
    }

    displayPower.getBrightness(function (result) {
      if (result && result.ok) appliedBrightnessValue = result.value
      else { failed = true; displayApplyError = resultError(result) }
      done()
    })
    displayPower.getMode(function (result) {
      if (result && result.ok) appliedAutoBrightness = result.value
      else { failed = true; displayApplyError = resultError(result) }
      done()
    })
  }

  function applyManualBrightness(value) {
    state = settingsStore.update('brightnessValue', value)
    markApplying()
    displayPower.setBrightness(state.brightnessValue, function (result) {
      if (!result || !result.ok) { markError(result); return }
      appliedBrightnessValue = state.brightnessValue
      markApplied()
    })
  }

  return {
    load: function () {
      settingsStore.load(function (value) {
        state = value
        readAppliedState()
      })
    },
    setBrightness: function (value) {
      if (!state.autoBrightness) {
        applyManualBrightness(value)
        return snapshot()
      }
      state = settingsStore.update('autoBrightness', false)
      state = settingsStore.update('brightnessValue', value)
      markApplying()
      displayPower.setMode(false, function (modeResult) {
        if (!modeResult || !modeResult.ok) { markError(modeResult); return }
        appliedAutoBrightness = false
        displayPower.setBrightness(state.brightnessValue, function (brightnessResult) {
          if (!brightnessResult || !brightnessResult.ok) { markError(brightnessResult); return }
          appliedBrightnessValue = state.brightnessValue
          markApplied()
        })
      })
      return snapshot()
    },
    toggleAuto: function () {
      var next = !state.autoBrightness
      state = settingsStore.update('autoBrightness', next)
      markApplying()
      displayPower.setMode(next, function (modeResult) {
        if (!modeResult || !modeResult.ok) { markError(modeResult); return }
        appliedAutoBrightness = next
        if (next) { markApplied(); return }
        displayPower.setBrightness(state.brightnessValue, function (brightnessResult) {
          if (!brightnessResult || !brightnessResult.ok) { markError(brightnessResult); return }
          appliedBrightnessValue = state.brightnessValue
          markApplied()
        })
      })
      return snapshot()
    },
    toggleRaiseWake: function () { return commit('raiseWakeEnabled', !state.raiseWakeEnabled) },
    toggleLowPower: function () { return commit('lowPowerEnabled', !state.lowPowerEnabled) }
  }
}
