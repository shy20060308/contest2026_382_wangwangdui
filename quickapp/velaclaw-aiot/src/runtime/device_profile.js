import device from '../capabilities/device'

var core = require('./device_profile_core')

var cached = null
var pending = []
var metadataWaiters = []
var loading = false
var metadataRequested = false
var metadataReady = false

function contextDevice(context) { return context && context.$device ? context.$device : {} }
function hasHostViewport(local) {
  var width = Number(local && local.screenWidth)
  var height = Number(local && local.screenHeight)
  return isFinite(width) && width > 0 && isFinite(height) && height > 0
}
function flush(list, profile) {
  var current = list.slice()
  list.length = 0
  for (var i = 0; i < current.length; i++) current[i](profile)
}
function requestMetadata(local) {
  if (metadataRequested) return
  metadataRequested = true
  loading = true
  device.get(function (info) {
    loading = false
    metadataReady = true
    if (!info) {
      metadataWaiters.length = 0
      return
    }
    cached = core.make(info, local || {})
    flush(metadataWaiters, cached)
  })
}
function resolve(context, callback) {
  if (typeof callback !== 'function') return
  var local = contextDevice(context)

  if (cached) {
    callback(cached)
    if (!metadataReady && loading) metadataWaiters.push(callback)
    return
  }

  if (hasHostViewport(local)) {
    cached = core.make({}, local)
    callback(cached)
    metadataWaiters.push(callback)
    requestMetadata(local)
    return
  }

  pending.push(callback)
  if (loading) return
  loading = true
  metadataRequested = true
  device.get(function (info) {
    loading = false
    metadataReady = true
    try { cached = core.make(info || {}, local) } catch (error) { pending = []; throw error }
    flush(pending, cached)
  })
}

export default { resolve: resolve, makeProfile: function (info, context) { return core.make(info || {}, contextDevice(context)) } }
