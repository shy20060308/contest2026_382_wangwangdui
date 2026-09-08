const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const exists = file => fs.existsSync(path.join(root, file))

function filesUnder(relative, result) {
  const target = path.join(root, relative)
  if (!fs.existsSync(target)) return result
  fs.readdirSync(target).forEach(function (name) {
    const full = path.join(target, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) filesUnder(path.relative(root, full), result)
    else if (/\.(js|ux)$/.test(name)) result.push(path.relative(root, full))
  })
  return result
}

function relativeDependencies(source) {
  const dependencies = []
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /<import\b[^>]*\bsrc=['"]([^'"]+)['"]/g
  ]
  patterns.forEach(function (pattern) {
    let match
    while ((match = pattern.exec(source)) !== null) {
      if (match[1] && match[1][0] === '.') dependencies.push(match[1])
    }
  })
  return dependencies
}

function dependencyExists(file, dependency) {
  const base = path.resolve(path.dirname(path.join(root, file)), dependency)
  return [base, base + '.js', base + '.ux', path.join(base, 'index.js'), path.join(base, 'index.ux')].some(fs.existsSync)
}

function styleBlock(source) {
  const match = source.match(/<style>([\s\S]*?)<\/style>/)
  return match ? match[1] : ''
}

filesUnder('src', []).forEach(function (file) {
  const source = read(file)
  relativeDependencies(source).forEach(function (dependency) {
    assert.ok(dependencyExists(file, dependency), file + ' has unresolved dependency ' + dependency)
  })
})

filesUnder('src/pages', []).forEach(function (file) {
  const source = read(file)
  assert.ok(!/pageRuntime\.bind\(this,\s*\{/.test(source), file + ' must use the V3 bind(page, callback) contract')
})

const strictRecipePages = [
  'src/pages/applist/applist.ux',
  'src/pages/heartrate/heartrate.ux',
  'src/pages/history/history.ux',
  'src/pages/notification_demo/notification_demo.ux',
  'src/pages/settings/settings/settings.ux',
  'src/pages/settings/bluetooth/bluetooth.ux',
  'src/pages/settings/brightness/brightness.ux',
  'src/pages/settings/diagnostics/diagnostics.ux',
  'src/pages/settings/motion/motion.ux',
  'src/pages/settings/vibration/vibration.ux',
  'src/pages/steps/steps.ux',
  'src/pages/today/today.ux',
  'src/pages/watchface/index.ux',
  'src/pages/workout/workout.ux',
  'src/pages/workout_history/workout_history.ux',
  'src/pages/workout_select/workout_select.ux'
]
strictRecipePages.forEach(function (file) {
  const source = read(file)
  const style = styleBlock(source)
  assert.ok(/if="\{\{\s*ready(?:\s*&&|\s*\}\})/.test(source), file + ' must not render product geometry before its V3 plan resolves')
  assert.ok(!source.includes('|| this.'), file + ' must not fall back to UX-owned geometry')
  assert.ok(!/:\s*-?(?:[1-9]\d*|0\.\d*[1-9]\d*)px\b/.test(style), file + ' CSS must not own non-zero geometry after strict V3 migration')
})

const clockHost = read('src/pages/clock/clock.ux')
assert.ok(clockHost.includes('if="{{ profileReady }}"'), 'Clock must wait for its V3 plan')
assert.ok(clockHost.includes('face-layout="{{ faceLayouts.'), 'Clock must pass resolved face recipes into watchface components')
assert.ok(!/:\s*-?(?:[1-9]\d*|0\.\d*[1-9]\d*)px\b/.test(styleBlock(clockHost)), 'Clock CSS must not own non-zero product geometry')

const strictWatchfaceComponents = [
  'src/components/watchfaces/sport.ux',
  'src/components/watchfaces/simple.ux',
  'src/components/watchfaces/dashboard.ux',
  'src/components/watchfaces/alpine.ux',
  'src/components/watchfaces/sport_circle.ux',
  'src/components/watchfaces/simple_circle.ux',
  'src/components/watchfaces/dashboard_circle.ux',
  'src/components/watchfaces/mechanical_circle.ux',
  'src/components/watchfaces/sport_rect.ux',
  'src/components/watchfaces/simple_rect.ux',
  'src/components/watchfaces/dashboard_rect.ux'
]
strictWatchfaceComponents.forEach(function (file) {
  const source = read(file)
  const style = styleBlock(source)
  assert.ok(source.includes('faceLayout'), file + ' must render the resolved Clock Recipe')
  assert.ok(!/:\s*-?(?:[1-9]\d*|0\.\d*[1-9]\d*)px\b/.test(style), file + ' CSS must not own non-zero geometry')
})

const strictRecipeResolvers = [
  'src/v2/design/apps/_shared/detail.js',
  'src/v2/design/apps/steps/index.js',
  'src/v2/design/apps/launcher/index.js',
  'src/v2/design/apps/heart/index.js',
  'src/v2/design/apps/history/index.js',
  'src/v2/design/apps/clock/index.js',
  'src/v2/design/apps/today/index.js',
  'src/v2/design/apps/faces/index.js',
  'src/v2/design/apps/notification/index.js',
  'src/v2/design/apps/settings/index.js',
  'src/v2/design/apps/brightness/index.js',
  'src/v2/design/apps/vibration/index.js',
  'src/v2/design/apps/motion/index.js',
  'src/v2/design/apps/diagnostics/index.js',
  'src/v2/design/apps/sync/index.js',
  'src/v2/design/apps/workout/index.js',
  'src/v2/design/apps/workout/selection.js',
  'src/v2/design/apps/workout/history.js'
]
strictRecipeResolvers.forEach(function (file) {
  const source = read(file)
  assert.ok(!/Math\.(?:min|max)\s*\(/.test(source), file + ' must compose declared recipe geometry instead of repairing it')
})

const strictPlanViews = [
  'src/v2/design/apps/launcher/view.js',
  'src/v2/design/apps/heart/view.js',
  'src/v2/design/apps/history/view.js',
  'src/v2/design/apps/settings/view.js'
]
strictPlanViews.forEach(function (file) {
  const source = read(file)
  assert.ok(!/plan\s*&&/.test(source), file + ' must require the resolved V3 plan')
  assert.ok(!/Number\(\s*plan[^)]*\)\s*\|\|/.test(source), file + ' must not invent visual geometry')
})

const diagnosticsView = read('src/v2/design/apps/diagnostics/view.js')
assert.ok(!diagnosticsView.includes('|| 3'), 'Diagnostics paging must require recipe capacity')
assert.ok(diagnosticsView.includes('requires resolved capabilityPageSize'), 'Diagnostics paging must fail visibly when recipe capacity is missing')

const watchfaceChart = read('src/v2/design/watchface_chart.js')
assert.ok(watchfaceChart.includes("visualNumber(minHeight, 'minHeight')"), 'Watchface chart min height must come from Recipe')
assert.ok(watchfaceChart.includes("visualNumber(maxHeight, 'maxHeight')"), 'Watchface chart max height must come from Recipe')
assert.ok(watchfaceChart.includes("visualNumber(minSpan, 'minSpan')"), 'Watchface chart data span must come from Recipe')

const adapter = read('src/v2/design/adapter.js')
assert.ok(!adapter.includes('function clamp('), 'Adapter must not repair recipe geometry at runtime')
assert.ok(!adapter.includes('circleChord') && !adapter.includes('circleBand'), 'Adapter must not contain round-screen fitting algorithms')
assert.ok(!adapter.includes('safeForWidth'), 'Safe area must not depend on component width')

const profile = read('src/runtime/device_profile.js')
assert.ok(profile.includes('safeInsets: declaredInsets(factor)'), 'Device Profile must own explicit safe insets')

const pkg = JSON.parse(read('package.json'))
assert.strictEqual(pkg.version, '3.0.0')
assert.ok(pkg.scripts['v3:architecture'] && pkg.scripts['v3:design'])
assert.strictEqual(Object.keys(pkg.scripts).some(name => name.startsWith('v2:') || name === 'check:legacy'), false, 'V3 must not expose old validation entry points')

const manifest = JSON.parse(read('src/manifest.json'))
assert.strictEqual(manifest.versionName, '3.0.0')
assert.strictEqual(manifest.versionCode, 30)
assert.ok(manifest.router.pages[manifest.router.entry], 'manifest entry must point to a registered page')
const strictRecipeSet = new Set(strictRecipePages)
Object.keys(manifest.router.pages).forEach(function (route) {
  const component = manifest.router.pages[route].component
  const file = 'src/' + route + '/' + component + '.ux'
  assert.ok(exists(file), route + ' must point to an existing UX component')
  if (route !== 'pages/clock' && route !== 'pages/clock_guard') {
    assert.ok(strictRecipeSet.has(file), route + ' must be covered by strict V3 Recipe ownership tests')
  }
})

const guard = read('src/pages/clock_guard/clock_guard.ux')
assert.ok(!guard.includes('page_runtime'), 'Clock Guard must not wait for layout runtime before redirecting')
assert.ok(guard.includes("navigation.push('/pages/clock')"), 'Clock Guard must restore the clock surface')

console.log('V3 architecture verified: current dependencies, Recipe ownership and runtime boundaries are coherent')
