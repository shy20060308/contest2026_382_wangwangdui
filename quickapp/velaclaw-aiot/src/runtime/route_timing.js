var routeTimingCore = require('./route_timing_core')
var performanceMetrics = require('./performance_metrics')

var core = routeTimingCore.create({
  onReady: function (durationMs, kind, route) {
    performanceMetrics.recordRouteSurfaceReady(durationMs, kind, route)
  }
})

module.exports = {
  begin: core.begin,
  confirm: core.confirm,
  complete: core.complete,
  reset: core.reset
}
