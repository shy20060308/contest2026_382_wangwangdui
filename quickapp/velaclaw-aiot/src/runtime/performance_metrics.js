var metrics = {
  surfaceRebuilds: 0,
  surfaceRebuildTotalMs: 0,
  surfaceRebuildMaxMs: 0,
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

function recordSurfaceRebuild(durationMs) {
  var duration = finiteDuration(durationMs)
  metrics.surfaceRebuilds++
  metrics.surfaceRebuildTotalMs += duration
  if (duration > metrics.surfaceRebuildMaxMs) metrics.surfaceRebuildMaxMs = duration
}

function recordSurfaceSkippedEqual() { metrics.surfaceSkippedEqual++ }
function recordSurfaceDeferredHidden() { metrics.surfaceDeferredHidden++ }
function recordNavigationSuppressed() { metrics.navigationSuppressed++ }
function recordMotionSample() { metrics.motionSamples++ }
function recordMotionUiEmit() { metrics.motionUiEmits++ }

function rounded(value) { return Math.round(value * 100) / 100 }

function snapshot() {
  return {
    surfaceRebuilds: metrics.surfaceRebuilds,
    surfaceRebuildAvgMs: metrics.surfaceRebuilds ? rounded(metrics.surfaceRebuildTotalMs / metrics.surfaceRebuilds) : 0,
    surfaceRebuildMaxMs: metrics.surfaceRebuildMaxMs,
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
  recordSurfaceRebuild: recordSurfaceRebuild,
  recordSurfaceSkippedEqual: recordSurfaceSkippedEqual,
  recordSurfaceDeferredHidden: recordSurfaceDeferredHidden,
  recordNavigationSuppressed: recordNavigationSuppressed,
  recordMotionSample: recordMotionSample,
  recordMotionUiEmit: recordMotionUiEmit,
  snapshot: snapshot,
  reset: reset
}
