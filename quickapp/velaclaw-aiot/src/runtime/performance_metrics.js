var MAX_ROUTE_SAMPLES = 64
var routeSurfaceReadySamples = []
var lastRouteSurfaceReady = { route: '', kind: '', durationMs: 0 }
var metrics = {
  surfaceRebuilds: 0,
  surfaceRebuildTotalMs: 0,
  surfaceRebuildMaxMs: 0,
  surfaceSerializeSamples: 0,
  surfaceSerializeTotalMs: 0,
  surfaceSerializeMaxMs: 0,
  surfaceResolveTotalMs: 0,
  surfaceResolveMaxMs: 0,
  surfaceDecorateTotalMs: 0,
  surfaceDecorateMaxMs: 0,
  surfaceContextTotalMs: 0,
  surfaceContextMaxMs: 0,
  surfaceJsTotalMs: 0,
  surfaceJsMaxMs: 0,
  surfaceSkippedEqual: 0,
  surfaceDeferredHidden: 0,
  navigationSuppressed: 0,
  motionSamples: 0,
  motionUiEmits: 0
}

function finiteDuration(value) {
  var next = Number(value)
  return isFinite(next) && next >= 0 ? next : 0
}

function recordSurfaceSerialize(durationMs) {
  var duration = finiteDuration(durationMs)
  metrics.surfaceSerializeSamples++
  metrics.surfaceSerializeTotalMs += duration
  if (duration > metrics.surfaceSerializeMaxMs) metrics.surfaceSerializeMaxMs = duration
}

function recordSurfaceRebuild(durationMs, phases) {
  var duration = finiteDuration(durationMs)
  var parts = phases || {}
  var resolveMs = finiteDuration(parts.resolveMs)
  var decorateMs = finiteDuration(parts.decorateMs)
  var contextMs = finiteDuration(parts.contextMs)
  var serializeMs = finiteDuration(parts.serializeMs)
  var jsMs = serializeMs + resolveMs + decorateMs + contextMs

  metrics.surfaceRebuilds++
  metrics.surfaceRebuildTotalMs += duration
  if (duration > metrics.surfaceRebuildMaxMs) metrics.surfaceRebuildMaxMs = duration

  metrics.surfaceResolveTotalMs += resolveMs
  if (resolveMs > metrics.surfaceResolveMaxMs) metrics.surfaceResolveMaxMs = resolveMs
  metrics.surfaceDecorateTotalMs += decorateMs
  if (decorateMs > metrics.surfaceDecorateMaxMs) metrics.surfaceDecorateMaxMs = decorateMs
  metrics.surfaceContextTotalMs += contextMs
  if (contextMs > metrics.surfaceContextMaxMs) metrics.surfaceContextMaxMs = contextMs
  metrics.surfaceJsTotalMs += jsMs
  if (jsMs > metrics.surfaceJsMaxMs) metrics.surfaceJsMaxMs = jsMs
}

function recordRouteSurfaceReady(durationMs, kind, route) {
  var duration = finiteDuration(durationMs)
  routeSurfaceReadySamples.push(duration)
  if (routeSurfaceReadySamples.length > MAX_ROUTE_SAMPLES) routeSurfaceReadySamples.shift()
  lastRouteSurfaceReady = { route: String(route || ''), kind: String(kind || ''), durationMs: duration }
}

function recordSurfaceSkippedEqual() { metrics.surfaceSkippedEqual++ }
function recordSurfaceDeferredHidden() { metrics.surfaceDeferredHidden++ }
function recordNavigationSuppressed() { metrics.navigationSuppressed++ }
function recordMotionSample() { metrics.motionSamples++ }
function recordMotionUiEmit() { metrics.motionUiEmits++ }

function rounded(value) { return Math.round(value * 100) / 100 }
function average(total, samples) { return samples ? rounded(total / samples) : 0 }
function sampleAverage(samples) {
  if (!samples.length) return 0
  var total = 0
  for (var i = 0; i < samples.length; i++) total += samples[i]
  return rounded(total / samples.length)
}
function percentile(samples, ratio) {
  if (!samples.length) return 0
  var ordered = samples.slice().sort(function (left, right) { return left - right })
  var index = Math.max(0, Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1))
  return ordered[index]
}
function sampleMax(samples) {
  var max = 0
  for (var i = 0; i < samples.length; i++) if (samples[i] > max) max = samples[i]
  return max
}

function snapshot() {
  return {
    surfaceRebuilds: metrics.surfaceRebuilds,
    surfaceRebuildAvgMs: average(metrics.surfaceRebuildTotalMs, metrics.surfaceRebuilds),
    surfaceRebuildMaxMs: metrics.surfaceRebuildMaxMs,
    surfaceSerializeSamples: metrics.surfaceSerializeSamples,
    surfaceSerializeAvgMs: average(metrics.surfaceSerializeTotalMs, metrics.surfaceSerializeSamples),
    surfaceSerializeMaxMs: metrics.surfaceSerializeMaxMs,
    surfaceResolveAvgMs: average(metrics.surfaceResolveTotalMs, metrics.surfaceRebuilds),
    surfaceResolveMaxMs: metrics.surfaceResolveMaxMs,
    surfaceDecorateAvgMs: average(metrics.surfaceDecorateTotalMs, metrics.surfaceRebuilds),
    surfaceDecorateMaxMs: metrics.surfaceDecorateMaxMs,
    surfaceContextAvgMs: average(metrics.surfaceContextTotalMs, metrics.surfaceRebuilds),
    surfaceContextMaxMs: metrics.surfaceContextMaxMs,
    surfaceJsAvgMs: average(metrics.surfaceJsTotalMs, metrics.surfaceRebuilds),
    surfaceJsMaxMs: metrics.surfaceJsMaxMs,
    routeSurfaceReadySamples: routeSurfaceReadySamples.length,
    routeSurfaceReadyAvgMs: sampleAverage(routeSurfaceReadySamples),
    routeSurfaceReadyP50Ms: percentile(routeSurfaceReadySamples, 0.5),
    routeSurfaceReadyP95Ms: percentile(routeSurfaceReadySamples, 0.95),
    routeSurfaceReadyMaxMs: sampleMax(routeSurfaceReadySamples),
    routeSurfaceReadyLastMs: lastRouteSurfaceReady.durationMs,
    routeSurfaceReadyLastRoute: lastRouteSurfaceReady.route,
    routeSurfaceReadyLastKind: lastRouteSurfaceReady.kind,
    surfaceSkippedEqual: metrics.surfaceSkippedEqual,
    surfaceDeferredHidden: metrics.surfaceDeferredHidden,
    navigationSuppressed: metrics.navigationSuppressed,
    motionSamples: metrics.motionSamples,
    motionUiEmits: metrics.motionUiEmits,
    motionUiPercent: metrics.motionSamples ? rounded(metrics.motionUiEmits * 100 / metrics.motionSamples) : 0
  }
}

function reset() {
  for (var key in metrics) metrics[key] = 0
  routeSurfaceReadySamples = []
  lastRouteSurfaceReady = { route: '', kind: '', durationMs: 0 }
}

module.exports = {
  MAX_ROUTE_SAMPLES: MAX_ROUTE_SAMPLES,
  recordSurfaceSerialize: recordSurfaceSerialize,
  recordSurfaceRebuild: recordSurfaceRebuild,
  recordRouteSurfaceReady: recordRouteSurfaceReady,
  recordSurfaceSkippedEqual: recordSurfaceSkippedEqual,
  recordSurfaceDeferredHidden: recordSurfaceDeferredHidden,
  recordNavigationSuppressed: recordNavigationSuppressed,
  recordMotionSample: recordMotionSample,
  recordMotionUiEmit: recordMotionUiEmit,
  snapshot: snapshot,
  reset: reset
}
