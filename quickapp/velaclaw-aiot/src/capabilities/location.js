import geolocation from '@system.geolocation'
var locationCore = require('./internal/location_core')
var runtime = locationCore.createLocation(geolocation)

export default {
  subscribe: function (listener) { return runtime.subscribe(listener) },
  unsubscribe: function (listener) { runtime.unsubscribe(listener) }
}
