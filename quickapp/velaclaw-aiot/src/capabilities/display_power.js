import brightness from '@system.brightness'

function call(api, params) {
  try {
    if (api) {
      api(params || {})
      return true
    }
  } catch (error) {}
  return false
}

export default {
  setBrightness: function (value) {
    var level = Math.max(0, Math.min(255, Math.round(Number(value) || 0)))
    return call(brightness && brightness.setValue, { value: level })
  },
  setKeepScreenOn: function (keepScreenOn) {
    return call(brightness && brightness.setKeepScreenOn, { keepScreenOn: !!keepScreenOn })
  }
}
