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
    while ((match = pattern.exec(source)) !== null) if (match[1] && match[1][0] === '.') dependencies.push(match[1])
  })
  return dependencies
}
function dependencyExists(file, dependency) {
  const base = path.resolve(path.dirname(path.join(root, file)), dependency)
  return [base, base + '.js', base + '.ux', path.join(base, 'index.js'), path.join(base, 'index.ux')].some(fs.existsSync)
}
function surfaceFilename(route) { return route.replace(/^pages\//, '').replace(/\//g, '__') + '.json' }

filesUnder('src', []).forEach(function (file) {
  const source = read(file)
  relativeDependencies(source).forEach(function (dependency) {
    assert.ok(dependencyExists(file, dependency), file + ' has unresolved dependency ' + dependency)
  })
})

const manifest = JSON.parse(read('src/manifest.json'))
const routes = Object.keys(manifest.router.pages)
assert.strictEqual(manifest.versionName, '3.0.0')
assert.strictEqual(manifest.versionCode, 30)
assert.strictEqual(manifest.minAPILevel, 2)
assert.ok(manifest.router.pages[manifest.router.entry], 'manifest entry must point to a registered page')
assert.strictEqual(routes.length, 18, 'V3 product route count changed; update the declarative contract deliberately')

const ids = new Set()
routes.forEach(function (route) {
  const component = manifest.router.pages[route].component
  const pageFile = 'src/' + route + '/' + component + '.ux'
  const surfaceFile = 'src/product/frontend/surfaces/' + surfaceFilename(route)
  assert.ok(exists(pageFile), route + ' must point to an existing UX component')
  assert.ok(exists(surfaceFile), route + ' must have exactly one authored Surface JSON')

  const source = read(pageFile)
  const surface = JSON.parse(read(surfaceFile))
  assert.strictEqual(surface.route, route)
  assert.strictEqual(surface.renderer, 'surface-v1')
  assert.ok(surface.id && !ids.has(surface.id), route + ' must own a unique Surface id')
  ids.add(surface.id)
  assert.ok(source.includes('surface_host.ux'), pageFile + ' must render the generic Surface Host')
  assert.ok(source.includes("surfacePage.bind(this, '" + surface.id + "')"), pageFile + ' must bind its Surface id')
  assert.ok(!/(?:\.\.\/)+(?:v2|product\/design\/apps|product\/features|domain|capabilities)(?:\/|['"])/.test(source), pageFile + ' must not reach product implementation layers')
  assert.ok(!/<(?:div|stack|scroll|text|image|slider|canvas|list|button)\b/.test((source.match(/<template>([\s\S]*?)<\/template>/) || [])[1] || ''), pageFile + ' must not own product markup')
})

assert.strictEqual(exists('src/v2'), false, 'V3 must not keep a duplicate src/v2 implementation tree')
assert.strictEqual(exists('src/product/design/apps'), false, 'page-specific visual recipes must live in Surface JSON only')
assert.strictEqual(exists('src/components/watchfaces'), false, 'specialized watchface UX must not survive the Surface migration')

const pageRuntime = read('src/runtime/page_runtime.js')
assert.ok(pageRuntime.includes("require('../product/design/scene')"), 'Page Runtime must consume the single current Scene implementation')
assert.ok(!pageRuntime.includes('../v2/'), 'Page Runtime must not depend on a retired namespace')

const adapter = read('src/product/design/adapter.js')
assert.ok(!adapter.includes('function clamp('), 'Adapter must not repair product geometry at runtime')
assert.ok(!adapter.includes('circleChord') && !adapter.includes('circleBand'), 'Adapter must not contain round-screen fitting algorithms')
assert.ok(!adapter.includes('safeForWidth'), 'Safe area must not depend on component width')

const guardSurface = JSON.parse(read('src/product/frontend/surfaces/clock_guard.json'))
assert.strictEqual(guardSurface.controller, 'clock-guard')
const registry = read('src/product/controller_registry.js')
assert.ok(/function clockGuard\(\)/.test(registry), 'Clock Guard behavior must live in the semantic controller registry')
assert.ok(registry.includes("navigation.push('/pages/clock')"), 'Clock Guard must restore the clock route')

const pkg = JSON.parse(read('package.json'))
assert.strictEqual(pkg.version, '3.0.0')
assert.ok(pkg.scripts['v3:frontend-contract'])
assert.ok(pkg.scripts.check.includes('v3:frontend-contract'), 'strict frontend authority contract must gate npm run check')
assert.ok(!pkg.scripts.check.includes('v3:frontend-staged'), 'completed migration must not use the staged gate')
assert.strictEqual(Object.keys(pkg.scripts).some(name => name.startsWith('v2:') || name === 'check:legacy'), false)

console.log('V3 architecture verified: all ' + routes.length + ' routes use one declarative Surface path with no legacy visual tree')
