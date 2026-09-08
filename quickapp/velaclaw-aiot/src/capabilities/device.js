import device from '@system.device'

function get(callback) {
  if (typeof callback !== 'function') return
  try {
    if (device && device.getInfo) {
      device.getInfo({
        success: function (info) { callback(info || null) },
        fail: function () { callback(null) }
      })
      return
    }
  } catch (error) {}
  callback(null)
}

export default { get: get }
