import interconnect from '@system.interconnect'

export default {
  isAvailable: function () {
    return !!(interconnect && interconnect.instance)
  }
}
