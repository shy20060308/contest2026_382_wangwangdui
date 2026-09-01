import device from '@system.device'

export default {
  getInfo: function (success, fail) {
    try {
      if (device && device.getInfo) {
        device.getInfo({
          success: function (info) {
            if (success) success(info || {})
          },
          fail: function () {
            if (fail) fail()
          }
        })
        return
      }
    } catch (error) {
      console.log('device info unavailable')
    }
    if (fail) fail()
  }
}
