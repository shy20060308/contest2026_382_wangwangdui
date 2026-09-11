import sensor from '@system.sensor'

var core = require('./internal/motion_core')

export default core.createMotion(sensor)
