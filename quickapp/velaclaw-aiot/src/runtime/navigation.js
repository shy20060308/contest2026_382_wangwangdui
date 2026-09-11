import router from '@system.router'

var performanceMetrics = require('./performance_metrics')
var DUPLICATE_NAV_WINDOW_MS = 300
var lastTransitionKey = ''
var lastTransitionAt = 0

function paramsKey(params) {
  return JSON.stringify(params || {})
}

function shouldSuppress(kind, path, params) {
  var now = Date.now()
  var key = kind + '|' + String(path || '') + '|' + paramsKey(params)
  var duplicate = key === lastTransitionKey && now - lastTransitionAt < DUPLICATE_NAV_WINDOW_MS
  if (duplicate) {
    performanceMetrics.recordNavigationSuppressed()
    return true
  }
  lastTransitionKey = key
  lastTransitionAt = now
  return duplicate
}

function push(path, params) {
  if (!path) throw new Error('Navigation requires a target path')
  if (shouldSuppress('push', path, params)) return
  router.push({ uri: path, params: params || {} })
}

function replace(path, params) {
  if (!path) throw new Error('Navigation requires a target path')
  if (shouldSuppress('replace', path, params)) return
  router.replace({ uri: path, params: params || {} })
}

function back() {
  if (shouldSuppress('back', '', null)) return
  router.back()
}

export default {
  push: push,
  replace: replace,
  back: back
}
