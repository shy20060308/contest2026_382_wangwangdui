import systemEvent from '@system.event'

export default {
  isAvailable: function () {
    return !!(systemEvent && systemEvent.subscribe)
  }
}
