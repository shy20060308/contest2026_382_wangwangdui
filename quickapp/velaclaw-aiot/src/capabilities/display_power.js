import brightness from '@system.brightness'

function call(api, params) {
  if (typeof api !== 'function') return false
  try {
    api(params)
    return true
  } catch (error) {
    return false
  }
}

export default {
  setBrightness: function (value) {
    if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > 255 || Math.round(value) !== value) return false
    return call(brightness && brightness.setValue, { value: value })
  },
  setMode: function (automatic) {
    if (typeof automatic !== 'boolean') return false
    return call(brightness && brightness.setMode, { mode: automatic ? 1 : 0 })
  },
  setKeepScreenOn: function (keepScreenOn) {
    if (typeof keepScreenOn !== 'boolean') return false
    return call(brightness && brightness.setKeepScreenOn, { keepScreenOn: keepScreenOn })
  },
  isAvailable: function () { return !!(brightness && brightness.setValue) }
}
