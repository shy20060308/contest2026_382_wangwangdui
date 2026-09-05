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
})

filesUnder('src/pages', []).forEach(function (file) {
  const source = read(file)
  assert.ok(!/pageRuntime\.bind\(this,\s*\{/.test(source), file + ' must use the V3 bind(page, callback) contract')
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

console.log('V3 architecture verified: one design runtime, no compatibility bridge, no adaptive safety solver')
