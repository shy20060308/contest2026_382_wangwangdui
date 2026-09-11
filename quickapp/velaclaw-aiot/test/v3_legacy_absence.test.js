const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const exists = file => fs.existsSync(path.join(root, file))

function filesUnder(relative, matcher, result) {
  const target = path.join(root, relative)
  if (!fs.existsSync(target)) return result
  fs.readdirSync(target).forEach(function (name) {
    const full = path.join(target, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) filesUnder(path.relative(root, full), matcher, result)
    else if (matcher.test(name)) result.push(path.relative(root, full))
  })
  return result
}

[
  ['src/v2', 'duplicate V2 source namespace'],
  ['src/platform', 'platform aliases'],
  ['src/presentation', 'presentation runtime'],
  ['src/product/design/apps', 'page-specific JS design recipes'],
  ['src/product/features/launcher', 'retired launcher pagination controller'],
  ['src/components/watchfaces', 'specialized watchface UX'],
  ['src/common/watchfaces', 'retired baked watchface backgrounds'],
  ['assets/icons', 'retired icon source pack'],
  ['assets/watchfaces', 'retired watchface source pack'],
  ['scripts/render-icons.ps1', 'retired icon renderer'],
  ['scripts/fade-watchface-background.py', 'retired watchface background renderer'],
  ['src/pages/index', 'sample index page'],
  ['src/pages/detail', 'sample detail page']
].forEach(function (entry) {
  assert.strictEqual(exists(entry[0]), false, 'V3 must not restore ' + entry[1])
})

assert.deepStrictEqual(filesUnder('src/common', /\.(?:js|ux)$/, []), [], 'src/common must remain static-resource-only')
assert.deepStrictEqual(filesUnder('src/pages', /\.js$/, []), [], 'page-local JS must not become a second frontend authority')

const pageRuntime = read('src/runtime/page_runtime.js')
assert.ok(pageRuntime.includes("require('../product/design/scene')"), 'Page Runtime must use the single current Scene')
assert.ok(!pageRuntime.includes('../v2/'), 'Page Runtime must not restore a retired namespace')

const deviceProfile = read('src/runtime/device_profile.js')
assert.ok(!deviceProfile.includes('isBetaPillViewport'), 'Device Profile must not restore beta-emulator compatibility state')
assert.ok(!deviceProfile.includes('width = 192; height = 490'), 'Device Profile must not fabricate Band dimensions')
assert.ok(!deviceProfile.includes('logicalHeight'), 'Device Profile must not duplicate Scene-owned projection')
assert.ok(deviceProfile.includes('var ratio = width / height'), 'Device Profile must normalize missing screen shape from physical geometry')

const sceneRuntime = read('src/product/design/scene.js')
assert.ok(!sceneRuntime.includes('shapeOf('), 'Scene must trust validated Device Profile shape')
assert.ok(!sceneRuntime.includes('hostScene || resolve(profile)'), 'Scene safe projection must consume the resolved Host Scene')

const adapter = read('src/product/design/adapter.js')
assert.ok(!adapter.includes('function shapeOf('), 'Adapter must not duplicate Device Profile shape validation')
assert.ok(!adapter.includes('function clamp('), 'Adapter must not repair authored Surface geometry')

const packageSource = read('package.json')
assert.ok(!packageSource.includes('render-soft-icons'), 'tooling must not regenerate retired soft icons')
assert.ok(!packageSource.includes('icons:render'), 'tooling must not regenerate product icons from a second visual authority')
assert.ok(!packageSource.includes('backgrounds:render'), 'tooling must not regenerate retired watchface backgrounds')
assert.ok(!packageSource.includes('honeycomb:logic'), 'page-specific Honeycomb product math must not return to the validation contract')
assert.ok(!packageSource.includes('analog:logic'), 'retired analog watchface helper must not stay in the validation contract')

console.log('V3 legacy absence verified: duplicate namespaces and page-specific visual authorities stay absent while JSON-referenced static assets remain allowed')
