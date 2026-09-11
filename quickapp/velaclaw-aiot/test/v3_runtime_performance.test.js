const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
function read(relativePath) { return fs.readFileSync(path.join(root, relativePath), 'utf8') }

const surfacePage = read('src/runtime/surface_page.js')
assert.ok(surfacePage.indexOf('_surfaceRenderSignature') >= 0, 'Surface runtime must cache the last rendered state signature')
assert.ok(surfacePage.indexOf('recordSurfaceSkippedEqual') >= 0, 'Surface runtime must measure equal-state rebuild skips')
assert.ok(surfacePage.indexOf('page.surfaceReady && !page._surfaceVisible') >= 0, 'Hidden ready pages must defer presentation rebuilds')
assert.ok(surfacePage.indexOf('recordSurfaceDeferredHidden') >= 0, 'Hidden rebuild deferrals must be measurable')

const navigation = read('src/runtime/navigation.js')
const navigationWindow = Number((navigation.match(/DUPLICATE_NAV_WINDOW_MS\s*=\s*(\d+)/) || [])[1])
assert.ok(navigationWindow >= 200 && navigationWindow <= 500, 'Duplicate navigation suppression should stay within a wearable tap-burst window')
assert.ok(navigation.indexOf('recordNavigationSuppressed') >= 0, 'Suppressed navigation must be measurable')

const motion = read('src/product/features/settings/motion_controller.js')
const uiSampleInterval = Number((motion.match(/UI_SAMPLE_INTERVAL_MS\s*=\s*(\d+)/) || [])[1])
const measureRenderInterval = Number((motion.match(/MEASURE_RENDER_INTERVAL_MS\s*=\s*(\d+)/) || [])[1])
assert.ok(uiSampleInterval >= 80 && uiSampleInterval <= 200, 'Motion sampling may stay fast, but presentation should be capped near 5-12 Hz')
assert.ok(measureRenderInterval >= 200, 'Motion measurement countdown must not repaint at 10 Hz independently of sensor UI')
assert.ok(motion.indexOf("interval: 'game'") >= 0, 'Motion analysis must preserve high-frequency native sampling')
assert.ok(motion.indexOf('scheduleSampleUi()') >= 0, 'Motion samples must flow through the presentation throttle')

const diagnostics = read('src/product/features/settings/diagnostics_controller.js')
assert.ok(diagnostics.indexOf('performanceMetrics.snapshot()') >= 0, 'Diagnostics must expose runtime performance counters')

const manifest = JSON.parse(read('src/manifest.json'))
assert.strictEqual(manifest.router.entry, 'pages/clock', 'The contest runtime must enter the V3 clock page directly')
const appRoutes = read('src/runtime/app_routes.js')
const routePattern = /['"](\/pages\/[^'"]+)['"]/g
let match
while ((match = routePattern.exec(appRoutes))) {
  const declared = match[1].replace(/^\//, '')
  assert.ok(manifest.router.pages[declared], 'Application route must be declared in manifest: ' + match[1])
}

const performanceMetrics = require('../src/runtime/performance_metrics')
performanceMetrics.reset()
performanceMetrics.recordSurfaceRebuild(4)
performanceMetrics.recordSurfaceRebuild(6)
performanceMetrics.recordSurfaceSkippedEqual()
performanceMetrics.recordSurfaceDeferredHidden()
performanceMetrics.recordNavigationSuppressed()
for (let i = 0; i < 20; i++) performanceMetrics.recordMotionSample()
for (let i = 0; i < 4; i++) performanceMetrics.recordMotionUiEmit()
const snapshot = performanceMetrics.snapshot()
assert.strictEqual(snapshot.surfaceRebuilds, 2)
assert.strictEqual(snapshot.surfaceRebuildAvgMs, 5)
assert.strictEqual(snapshot.surfaceRebuildMaxMs, 6)
assert.strictEqual(snapshot.surfaceSkippedEqual, 1)
assert.strictEqual(snapshot.surfaceDeferredHidden, 1)
assert.strictEqual(snapshot.navigationSuppressed, 1)
assert.strictEqual(snapshot.motionSamples, 20)
assert.strictEqual(snapshot.motionUiEmits, 4)
assert.strictEqual(snapshot.motionUiPercent, 20)
performanceMetrics.reset()

console.log('V3 runtime performance and route contracts verified')
