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
  return [base, base + '.js', base + '.ux', base + '.json', path.join(base, 'index.js'), path.join(base, 'index.ux')].some(fs.existsSync)
}
function surfaceFilename(route) { return route.replace(/^pages\//, '').replace(/\//g, '__') + '.json' }
function normalizedRelative(fromFile, toFile) {
  let value = path.relative(path.dirname(path.join(root, fromFile)), path.join(root, toFile)).split(path.sep).join('/')
  if (value[0] !== '.') value = './' + value
  return value
}

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
assert.strictEqual(manifest.router.entry, 'pages/clock', 'V3 must boot directly into the clock Surface instead of a routing guard')
assert.strictEqual(routes.length, 17, 'V3 product route count changed; update the declarative contract deliberately')
assert.ok(!manifest.router.pages['pages/clock_guard'], 'Clock Guard must stay removed once direct clock entry is verified')

const ids = new Set()
const controllerIds = new Set()
routes.forEach(function (route) {
  const component = manifest.router.pages[route].component
  const pageFile = 'src/' + route + '/' + component + '.ux'
  const surfaceFile = 'src/product/frontend/surfaces/' + surfaceFilename(route)
  assert.ok(exists(pageFile), route + ' must point to an existing UX component')
  assert.ok(exists(surfaceFile), route + ' must have exactly one authored Surface JSON')

  const source = read(pageFile)
  const surface = JSON.parse(read(surfaceFile))
  const expectedDependency = normalizedRelative(pageFile, surfaceFile)
  assert.strictEqual(surface.route, route)
  assert.strictEqual(surface.renderer, 'surface-v1')
  assert.ok(surface.id && !ids.has(surface.id), route + ' must own a unique Surface id')
  ids.add(surface.id)
  assert.ok(/surface_host(?:_stage)?\.ux/.test(source), pageFile + ' must render an audited generic Surface Host composition')
  if (route === 'pages/clock') assert.ok(source.includes('surface_host_stage.ux'), 'Clock must use the isolated Stage host directly')
  else assert.ok(source.includes('surface_host.ux'), pageFile + ' must keep the full generic Surface Host until its renderer needs are explicitly isolated')
  assert.ok(source.includes("require('" + expectedDependency + "')") || source.includes('require("' + expectedDependency + '")'), pageFile + ' must require only its own Surface JSON')
  const surfaceDependencies = relativeDependencies(source).filter(dep => dep.indexOf('/product/frontend/surfaces/') >= 0 && dep.endsWith('.json'))
  assert.deepStrictEqual(surfaceDependencies, [expectedDependency], pageFile + ' must not pull another page Surface into this route bundle')
  const controllerDependencies = relativeDependencies(source).filter(dep => dep.indexOf('/product/controller_bindings/') >= 0)
  if (surface.controller) {
    controllerIds.add(surface.controller)
    const controllerFile = 'src/product/controller_bindings/' + surface.controller + '.js'
    const expectedControllerDependency = normalizedRelative(pageFile, controllerFile).replace(/\.js$/, '')
    assert.ok(exists(controllerFile), surface.controller + ' must have a page-local controller binding')
    assert.deepStrictEqual(controllerDependencies, [expectedControllerDependency], pageFile + ' must import only its Surface-declared controller binding')
    assert.ok(source.includes('import controllerBinding from'), pageFile + ' must import the controller binding explicitly')
    assert.ok(source.includes('surfacePage.bind(this, surface, controllerBinding)'), pageFile + ' must bind the page-local controller explicitly')
  } else {
    assert.deepStrictEqual(controllerDependencies, [], pageFile + ' must not import a controller binding when Surface controller is null')
    assert.ok(source.includes('surfacePage.bind(this, surface)'), pageFile + ' must bind the page-local Surface object')
  }
  assert.ok(!/(?:\.\.\/)+(?:v2|product\/design\/apps|product\/features|domain|capabilities)(?:\/|['"])/.test(source), pageFile + ' must not reach product implementation layers')
  assert.ok(!/<(?:div|stack|scroll|text|image|slider|canvas|list|button)\b/.test((source.match(/<template>([\s\S]*?)<\/template>/) || [])[1] || ''), pageFile + ' must not own product markup')
})

controllerIds.forEach(function (id) {
  const binding = read('src/product/controller_bindings/' + id + '.js')
  assert.ok(binding.includes("id: '" + id + "'"), id + ' binding must declare the same semantic controller id as Surface JSON')
  assert.ok(!/\bimport\b[^\n]*\bfrom\s+['"]\.\.\/features\//.test(binding), id + ' binding must not execute its feature module while the page script is loading')
  assert.ok(/\brequire\(\s*['"]\.\.\/features\//.test(binding), id + ' binding must defer its feature module until controller creation')
})

const surfacePage = read('src/runtime/surface_page.js')
assert.ok(!surfacePage.includes('frontend/generated/surfaces'), 'Surface Page must not import a central eager Surface registry')
assert.ok(!surfacePage.includes('surfaces.byId'), 'Surface Page must consume the page-local Surface object directly')
assert.ok(!surfacePage.includes('controller_registry'), 'Surface Page must not eagerly import the all-feature controller registry')
assert.ok(surfacePage.includes('binding.id !== surface.controller'), 'Surface Page must reject a page-local controller binding that disagrees with Surface JSON')
assert.ok(surfacePage.indexOf("boot(page, 'BOOT:surface-resolve'") < surfacePage.indexOf("boot(page, 'BOOT:controller-create'"), 'Surface Page must make the static Surface renderable before executing a feature controller')
assert.ok(surfacePage.includes("controllerCall(page, 'controller-stop', 'stop')"), 'Surface Page must isolate controller stop failures so navigation can finish')
const generatedSurfaceMetadata = read('src/product/frontend/generated/surfaces.js')
assert.ok(!/require\([^)]*surfaces\//.test(generatedSurfaceMetadata), 'generated Surface metadata must never eagerly require authored JSON')

assert.strictEqual(exists('src/v2'), false, 'V3 must not keep a duplicate src/v2 implementation tree')
assert.strictEqual(exists('src/product/design/apps'), false, 'page-specific visual recipes must live in Surface JSON only')
assert.strictEqual(exists('src/components/watchfaces'), false, 'specialized watchface UX must not survive the Surface migration')
assert.strictEqual(exists('src/pages/clock_guard/clock_guard.ux'), false, 'obsolete routing guard page must stay deleted')
assert.strictEqual(exists('src/product/frontend/surfaces/clock_guard.json'), false, 'obsolete routing guard Surface must stay deleted')
assert.strictEqual(exists('src/components/surface_entry_stage.ux'), false, 'temporary Clock boot wrapper must not survive simulator diagnosis')
const stageHost = read('src/components/surface_host_stage.ux')
assert.ok(!stageHost.includes('surface_stage.ux'), 'Clock Stage host must not nest the Stage renderer custom component on Vela')
assert.ok(!/<surfacestage\b/.test(stageHost), 'Clock Stage host must render Stage primitives directly')
assert.ok(stageHost.includes('plan.stage.texts') && stageHost.includes('plan.stage.metrics') && stageHost.includes('plan.stage.progresses'), 'Clock Stage host must inline the resolved Stage primitive collections')

const pageRuntime = read('src/runtime/page_runtime.js')
assert.ok(pageRuntime.includes("require('../product/design/scene')"), 'Page Runtime must consume the single current Scene implementation')
assert.ok(!pageRuntime.includes('../v2/'), 'Page Runtime must not depend on a retired namespace')

const adapter = read('src/product/design/adapter.js')
assert.ok(!adapter.includes('function clamp('), 'Adapter must not repair product geometry at runtime')
assert.ok(!adapter.includes('circleChord') && !adapter.includes('circleBand'), 'Adapter must not contain round-screen fitting algorithms')
assert.ok(!adapter.includes('safeForWidth'), 'Safe area must not depend on component width')

const deviceProfile = read('src/runtime/device_profile.js')
const deviceProfileCore = read('src/runtime/device_profile_core.js')
assert.ok(deviceProfile.includes("require('./device_profile_core')"), 'Device Profile wrapper must delegate viewport/shape projection to the single core')
assert.ok(deviceProfileCore.includes("viewportPick(local, info, 'screenWidth')"), 'layout projection must prefer the actual host viewport over system metadata')
assert.ok(deviceProfileCore.includes("viewportPick(local, info, 'screenHeight')"), 'layout projection must prefer the actual host viewport height')

const registry = read('src/product/controller_registry.js')
assert.ok(!/function clockGuard\(/.test(registry), 'obsolete Clock Guard controller must stay deleted')
assert.ok(!registry.includes("id === 'clock-guard'"), 'controller registry must not expose obsolete clock-guard')

const pkg = JSON.parse(read('package.json'))
assert.strictEqual(pkg.version, '3.0.0')
assert.ok(pkg.scripts['v3:frontend-contract'])
assert.ok(pkg.scripts.check.includes('v3:frontend-contract'), 'strict frontend authority contract must gate npm run check')
assert.ok(!pkg.scripts.check.includes('v3:frontend-staged'), 'completed migration must not use the staged gate')
assert.strictEqual(Object.keys(pkg.scripts).some(name => name.startsWith('v2:') || name === 'check:legacy'), false)

console.log('V3 architecture verified: all ' + routes.length + ' routes own one Surface dependency and only their declared controller binding')
