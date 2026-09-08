import displayPower from '../../capabilities/display_power'
import motion from '../../capabilities/motion'
import heartRate from '../../capabilities/heart_rate'
import battery from '../../capabilities/battery'

var core = require('./core')

function create(options) {
  var runtime = core.create({
    displayPower: displayPower,
    motion: motion,
    heartRate: heartRate,
    battery: battery
  }, options)

  return {
    configure: runtime.configure,
    start: runtime.start,
    stop: runtime.stop,
    markActive: runtime.markActive
  }
}

export default {
  create: create
}
