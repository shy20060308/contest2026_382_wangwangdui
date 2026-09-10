const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const srcRoot = path.join(root, 'src')
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

function surfaceFilename(route) {
  return route.replace(/^pages\//, '').replace(/\//g, '__') + '.json'
}

filesUnder('src', []).forEach(function (file) {
  const source = read(file)
  relativeDependencies(source).forEach(function (dependency) {
    assert.ok(dependencyExists(file, dependency), file + ' has unresolved dependency ' + dependency)
  })
})

const manifest = JSON.parse(read('src/manifest.json'))
assert.strictEqual(manifest.versionName, '3.0.0')
assert.strictEqual(manifest.versionCode, 30)
assert.strictEqual(manifest.minAPILevel, 2)
assert.ok(manifest.router.pages[manifest.router.entry], 'manifest entry must point to a registered page')

const migrated = []
Object.keys(manifest.router.pages).forEach(function (route) {
  const component = manifest.router.pages[route].component
  const pageFile = 'src/' + route + '/' + component + '.ux'
  assert.ok(exists(pageFile), route + ' must point to an existing UX component')
  const source = read(pageFile)
  assert.ok(!/pageRuntime\.bind\(this,\s*\{/.test(source), pageFile + ' must not use the retired bind options contract')

  const surfaceFile = 'src/product/frontend/surfaces/' + surfaceFilename(route)
  if (!exists(surfaceFile)) return

  const surface = JSON.parse(read(surfaceFile))
  migrated.push(route)
  assert.strictEqual(surface.route, route, route + ' surface must own exactly its manifest route')
  assert.strictEqual(surface.renderer, 'surface-v1', route + ' must use the generic renderer')
  assert.ok(source.includes('surface_host.ux'), route + ' migrated UX must render only the generic Surface Host')
  assert.ok(source.includes("surfacePage.bind(this, '" + surface.id + "')"), route + ' UX must bind its declared Surface id')
  assert.ok(!/(?:\.\.\/)+(?:v2|product\/design\/apps|product\/features|domain|capabilities)(?:\/|['"])/.test(source), route + ' migrated UX must not reach product implementation layers')
})

const profile = read('src/runtime/device_profile.js')
assert.ok(profile.includes('safeInsets: declaredInsets(factor)'), 'Device Profile must own explicit safe insets')
assert.ok(profile.includes('var ratio = width / height'), 'Device Profile must normalize shape from canonical geometry when needed')
assert.ok(!profile.includes('Emulator-Vela') && !profile.includes('isBetaPillViewport'), 'Device Profile must not contain emulator-specific compatibility branches')

const pageRuntime = read('src/runtime/page_runtime.js')
assert.ok(pageRuntime.includes("require('../product/design/scene')"), 'Page Runtime must consume the current product Scene')
assert.ok(!pageRuntime.includes('../v2/design/scene'), 'Page Runtime must not depend on the legacy Scene namespace')
assert.ok(pageRuntime.includes("page.viewportWidth = host.width + 'px'") && pageRuntime.includes("page.viewportHeight = host.height + 'px'"), 'Page Runtime must expose exactly the resolved Scene coordinate space')

const adapter = read('src/product/design/adapter.js')
assert.ok(!adapter.includes('function clamp('), 'Adapter must not repair recipe geometry at runtime')
assert.ok(!adapter.includes('circleChord') && !adapter.includes('circleBand'), 'Adapter must not contain round-screen fitting algorithms')
assert.ok(!adapter.includes('safeForWidth'), 'Safe area must not depend on component width')

const pager = read('src/product/design/pager.js')
assert.ok(!pager.includes('Number(pageSize)') && !pager.includes('Number(pageIndex)'), 'Pager must not coerce non-canonical numeric input')

const honeycombEngine = read('src/product/design/engines/honeycomb.js')
assert.ok(honeycombEngine.includes('function create(recipe)'), 'Honeycomb Engine must bind to a resolved Launcher Recipe')
assert.ok(!honeycombEngine.includes('var FOCUS_X') && !honeycombEngine.includes('var FOCUS_Y'), 'Honeycomb Engine must not own product focus coordinates')
assert.ok(!honeycombEngine.includes('var ICON_BASE') && !honeycombEngine.includes('var ICON_GROW'), 'Honeycomb Engine must not own product icon sizing')
assert.ok(!honeycombEngine.includes('LABEL_CENTER') && !honeycombEngine.includes('LABEL_HALF'), 'Honeycomb Engine must derive label avoidance from Recipe geometry')

const guard = read('src/pages/clock_guard/clock_guard.ux')
assert.ok(!guard.includes('page_runtime'), 'Clock Guard must not wait for layout runtime before redirecting')
assert.ok(guard.includes("navigation.push('/pages/clock')"), 'Clock Guard must restore the clock surface')

const pkg = JSON.parse(read('package.json'))
assert.strictEqual(pkg.version, '3.0.0')
assert.ok(pkg.scripts['v3:architecture'] && pkg.scripts['v3:frontend-staged'])
assert.strictEqual(Object.keys(pkg.scripts).some(name => name.startsWith('v2:') || name === 'check:legacy'), false, 'V3 must not expose old validation entry points')

console.log('V3 architecture verified across ' + Object.keys(manifest.router.pages).length + ' manifest routes; migrated JSON surfaces: ' + migrated.length)
