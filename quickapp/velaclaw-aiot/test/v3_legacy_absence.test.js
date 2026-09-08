const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const sourceRoot = path.join(root, 'src')
const commonRoot = path.join(sourceRoot, 'common')
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

function inside(target, parent) {
  const relative = path.relative(parent, target)
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))
}

assert.strictEqual(exists('src/platform'), false, 'V3 must consume capabilities directly; platform aliases are retired')
assert.strictEqual(exists('src/presentation'), false, 'V3 must not restore the retired presentation runtime')
assert.strictEqual(exists('src/v2/system'), false, 'V3 runtime ownership must not restore the retired v2/system namespace')
assert.strictEqual(exists('src/v2/app'), false, 'V3 app runtime ownership must not restore the retired v2/app namespace')
assert.strictEqual(exists('src/v2/design/specs'), false, 'V3 must not restore Design Spec compatibility code')
assert.strictEqual(exists('src/v2/design/views'), false, 'V3 must not restore Design View compatibility code')
assert.strictEqual(exists('src/v2/design/geometry.js'), false, 'V3 must not restore the retired geometry solver')
assert.strictEqual(exists('src/v2/design/freedom.js'), false, 'V3 design difference levels must not restore the retired freedom compatibility system')

const commonLogic = filesUnder('src/common', /\.(?:js|ux)$/, [])
assert.deepStrictEqual(commonLogic, [], 'src/common is a static-resource namespace only; runtime logic belongs to Capability/Domain/Feature/Design/App')

filesUnder('src', /\.(?:js|ux)$/, []).forEach(function (file) {
  const source = read(file)
  assert.ok(!source.includes('v2/app/'), file + ' must use the formal src/runtime app boundary instead of retired v2/app code')
  relativeDependencies(source).forEach(function (dependency) {
    const resolved = path.resolve(path.dirname(path.join(root, file)), dependency)
    assert.ok(!inside(resolved, commonRoot), file + ' must not depend on legacy src/common logic: ' + dependency)
  })
})

filesUnder('src/v2/design', /\.(?:js|ux)$/, []).forEach(function (file) {
  const source = read(file)
  assert.ok(!source.includes('freedomLevel'), file + ' must expose design difference metadata, not retired freedom metadata')
  assert.ok(!source.includes('freedom.AUTO') && !source.includes('freedom.ASSISTED') && !source.includes('freedom.FREE'), file + ' must not use retired AUTO/ASSISTED/FREE design levels')
  assert.ok(!source.includes('adaptive-geometry'), file + ' must not restore the retired adaptive geometry strategy')
})

filesUnder('src/v2/design/apps', /(?:^|_)layout\.js$/, []).forEach(function (file) {
  const source = read(file)
  assert.ok(!/^module\.exports\s*=\s*\{\s*\r?\n\s*level\s*:/m.test(source), file + ' must not duplicate resolver-owned differenceLevel in Recipe layout metadata')
})

const deviceProfile = read('src/runtime/device_profile.js')
assert.ok(!deviceProfile.includes('isBetaPillViewport'), 'Device Profile must not restore beta-emulator viewport compatibility state')
assert.ok(!deviceProfile.includes("|| 'pill-shaped'"), 'Device Profile must not default an unknown device to Pill')
assert.ok(!deviceProfile.includes('width = 192; height = 490'), 'Device Profile must not fabricate Band dimensions')
const pageRuntime = read('src/runtime/page_runtime.js')
assert.ok(!pageRuntime.includes('betaPill'), 'Page Runtime must not restore beta-pill viewport compatibility branches')
const sceneRuntime = read('src/v2/design/scene.js')
assert.ok(!sceneRuntime.includes("? String(profile.formFactor) : 'rect'"), 'Scene must not default an unknown profile to Rect')
assert.ok(!sceneRuntime.includes('hostScene || resolve(profile)'), 'Scene safe projection must require the already-resolved Host Scene')

filesUnder('test', /\.test\.js$/, []).forEach(function (file) {
  const source = read(file)
  assert.ok(!source.includes('src/common/'), file + ' must not validate retired common logic')
  assert.ok(!source.includes('src/presentation/'), file + ' must not validate retired presentation logic')
  assert.ok(!source.includes('src/platform/'), file + ' must not validate retired platform aliases')
  assert.ok(!source.includes('src/v2/app/'), file + ' must not validate retired v2 app runtime')
  assert.ok(!source.includes('design/views/'), file + ' must not validate retired Design Views')
  assert.ok(!source.includes('design/specs/'), file + ' must not validate retired Design Specs')
})

console.log('V3 legacy absence verified: no compatibility runtime, v2 app/system namespaces, duplicate layout levels or retired design metadata')
