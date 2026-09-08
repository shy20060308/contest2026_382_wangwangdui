import battery from '@system.battery'

function normalizeLevel(level) {
  var value = Number(level)
  if (!isFinite(value)) return null
  if (value <= 1) value = value * 100
  value = Math.round(value)
  if (value < 0) value = 0
  if (value > 100) value = 100
  return value
}

export default {
  get: function (callback) {
    if (typeof callback !== 'function') return
    try {
      if (battery && battery.getStatus) {
        battery.getStatus({
          success: function (data) { callback(normalizeLevel(data && data.level)) },
          fail: function () { callback(null) }
        })
        return
      }
    } catch (error) {}
    callback(null)
  },
  isAvailable: function () { return !!(battery && battery.getStatus) }
}
