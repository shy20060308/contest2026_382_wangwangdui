import battery from '@system.battery'

function levelToPercent(level) {
  if (typeof level !== 'number' || !isFinite(level) || level < 0 || level > 1) return null
  return Math.round(level * 100)
}

export default {
  get: function (callback) {
    if (typeof callback !== 'function') return
    try {
      if (battery && battery.getStatus) {
        battery.getStatus({
          success: function (data) { callback(levelToPercent(data.level)) },
          fail: function () { callback(null) }
        })
        return
      }
    } catch (error) {}
    callback(null)
  },
  isAvailable: function () { return !!(battery && battery.getStatus) }
}
