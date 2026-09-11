import health from '@service.health'

var core = require('./health_channel_core')

export default function createHealthChannel(options) {
  return core.createHealthChannel(health, options)
}
