import router from '@system.router'

var performanceMetrics = require('./performance_metrics')
var navigationCore = require('./navigation_core')
var navigationContext = require('./navigation_context')
var routeTiming = require('./route_timing')
var core = navigationCore.create({
  windowMs: 300,
  onSuppressed: function () { performanceMetrics.recordNavigationSuppressed() }
})

function ownerKey(owner) { return owner || navigationContext.get() || 'global' }

function push(path, params, owner) {
  if (!path) throw new Error('Navigation requires a target path')
  if (!owner && !navigationContext.routesEnabled()) {
    performanceMetrics.recordNavigationSuppressed()
    return false
  }
  return core.transition('push', path, params, ownerKey(owner), function () {
    var timing = routeTiming.begin(path, 'push')
    router.push({ uri: path, params: params || {} })
    routeTiming.confirm(timing)
  })
}

function replace(path, params, owner) {
  if (!path) throw new Error('Navigation requires a target path')
  return core.transition('replace', path, params, ownerKey(owner), function () {
    var timing = routeTiming.begin(path, 'replace')
    router.replace({ uri: path, params: params || {} })
    routeTiming.confirm(timing)
  })
}

function back(owner) {
  return core.transition('back', '', null, ownerKey(owner), function () {
    router.back()
  })
}

export default {
  push: push,
  replace: replace,
  back: back
}
