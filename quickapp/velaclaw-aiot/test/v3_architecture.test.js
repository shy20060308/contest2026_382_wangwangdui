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

assert.strictEqual(exists('src/presentation'), false, 'V3 must not keep the retired presentation system')
assert.strictEqual(exists('src/v2/design/specs'), false, 'V3 must not keep design spec compatibility bridges')
assert.strictEqual(exists('src/v2/design/views'), false, 'V3 must not keep design view compatibility bridges')
assert.strictEqual(exists('src/v2/design/geometry.js'), false, 'Safe geometry belongs to the device profile + scene, not another geometry layer')
assert.strictEqual(exists('src/pages/index'), false, 'sample index page is not a V3 product surface')
assert.strictEqual(exists('src/pages/detail'), false, 'sample detail page is not a V3 product surface')

const sources = filesUnder('src', [])
sources.forEach(function (file) {
  const source = read(file)
  assert.ok(!source.includes('/design/specs/') && !source.includes('/design/views/'), file + ' must consume app-owned V3 design directly')
  assert.ok(!source.includes('../presentation/') && !source.includes('/presentation/'), file + ' must not depend on retired presentation code')
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
  'src/pages/steps/steps.ux',
  'src/pages/workout/workout.ux',
  'src/pages/workout_history/workout_history.ux',
  'src/pages/workout_select/workout_select.ux'
]
strictRecipePages.forEach(function (file) {
  const source = read(file)
  const style = styleBlock(source)
  assert.ok(source.includes('if="{{ ready }}"'), file + ' must not render product geometry before its V3 plan resolves')
  assert.ok(!source.includes('|| this.'), file + ' must not fall back to UX-owned legacy geometry')
  assert.ok(!/:\s*-?(?:[1-9]\d*|0\.\d*[1-9]\d*)px\b/.test(style), file + ' CSS must not own non-zero geometry after strict V3 migration')
})

const clockHost = read('src/pages/clock/clock.ux')
assert.ok(clockHost.includes('if="{{ profileReady }}"'), 'Clock must not render product geometry before its V3 plan resolves')
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
  assert.ok(source.includes('faceLayout'), file + ' must render the resolved Clock Recipe instead of owning a private layout')
  assert.ok(!/:\s*-?(?:[1-9]\d*|0\.\d*[1-9]\d*)px\b/.test(style), file + ' CSS must not own non-zero geometry after strict V3 migration')
})

const strictRecipeResolvers = [
  'src/v2/design/apps/steps/index.js',
  'src/v2/design/apps/launcher/index.js',
  'src/v2/design/apps/heart/index.js',
  'src/v2/design/apps/history/index.js',
  'src/v2/design/apps/clock/index.js',
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
  'src/v2/design/apps/history/view.js'
]
strictPlanViews.forEach(function (file) {
  const source = read(file)
  assert.ok(!/plan\s*&&/.test(source), file + ' must require the resolved V3 plan instead of silently falling back')
  assert.ok(!/Number\(\s*plan[^)]*\)\s*\|\|/.test(source), file + ' must not invent visual geometry when plan data is missing')
})

const adapter = read('src/v2/design/adapter.js')
assert.ok(adapter.includes("SYSTEM_ID = 'recipe-translator-v3.0'"))
assert.ok(!adapter.includes('function clamp('), 'Adapter must not repair recipe geometry at runtime')
assert.ok(!adapter.includes('circleChord') && !adapter.includes('circleBand'), 'Adapter must not contain round-screen fitting algorithms')
assert.ok(!adapter.includes('safeForWidth'), 'Safe area must not depend on component width')

const scene = read('src/v2/design/scene.js')
assert.ok(!scene.includes("require('./geometry')"), 'Scene must use profile-declared insets directly')
const profile = read('src/v2/system/device_profile.js')
assert.ok(profile.includes('safeInsets: declaredInsets(factor)'), 'Device profile must own explicit safe insets')

const pkg = JSON.parse(read('package.json'))
assert.strictEqual(pkg.version, '3.0.0')
assert.ok(pkg.scripts['v3:architecture'] && pkg.scripts['v3:design'])
assert.strictEqual(Object.keys(pkg.scripts).some(name => name.startsWith('v2:') || name === 'check:legacy'), false, 'V3 must not expose old validation entry points')

const manifest = JSON.parse(read('src/manifest.json'))
assert.strictEqual(manifest.versionName, '3.0.0')
assert.strictEqual(manifest.versionCode, 30)
assert.ok(manifest.router.pages[manifest.router.entry], 'manifest entry must point to a registered page')
Object.keys(manifest.router.pages).forEach(function (route) {
  const component = manifest.router.pages[route].component
  assert.ok(exists('src/' + route + '/' + component + '.ux'), route + ' must point to an existing UX component')
})

const guard = read('src/pages/clock_guard/clock_guard.ux')
assert.ok(!guard.includes('page_runtime'), 'clock guard must not wait for the layout runtime before redirecting')
assert.ok(guard.includes("navigation.push('/pages/clock')"), 'clock guard must always restore the clock surface')

console.log('V3 architecture verified: runnable routes and dependencies, one design runtime, no adaptive safety solver')
