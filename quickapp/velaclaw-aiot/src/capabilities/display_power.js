import brightness from '@system.brightness'

var core = require('./internal/display_power_core')

export default core.createDisplayPower(brightness)
