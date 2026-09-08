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
    if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > 255) return false
    return call(brightness && brightness.setValue, { value: Math.round(value) })
  },
  setMode: function (automatic) {
    return call(brightness && brightness.setMode, { mode: automatic ? 1 : 0 })
  },
  setKeepScreenOn: function (keepScreenOn) {
    return call(brightness && brightness.setKeepScreenOn, { keepScreenOn: !!keepScreenOn })
  },
  isAvailable: function () { return !!(brightness && brightness.setValue) }
}
