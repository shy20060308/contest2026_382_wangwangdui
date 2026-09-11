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

function recordSurfaceSkippedEqual() { metrics.surfaceSkippedEqual++ }
function recordSurfaceDeferredHidden() { metrics.surfaceDeferredHidden++ }
function recordNavigationSuppressed() { metrics.navigationSuppressed++ }
function recordMotionSample() { metrics.motionSamples++ }
function recordMotionUiEmit() { metrics.motionUiEmits++ }

function rounded(value) { return Math.round(value * 100) / 100 }
function average(total, samples) { return samples ? rounded(total / samples) : 0 }

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
}

module.exports = {
  recordSurfaceSerialize: recordSurfaceSerialize,
  recordSurfaceRebuild: recordSurfaceRebuild,
  recordSurfaceSkippedEqual: recordSurfaceSkippedEqual,
  recordSurfaceDeferredHidden: recordSurfaceDeferredHidden,
  recordNavigationSuppressed: recordNavigationSuppressed,
  recordMotionSample: recordMotionSample,
  recordMotionUiEmit: recordMotionUiEmit,
  snapshot: snapshot,
  reset: reset
}
