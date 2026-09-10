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

const retiredRoots = [
  ['src/platform', 'platform aliases'],
  ['src/presentation', 'presentation runtime'],
  ['src/v2/system', 'v2/system namespace'],
  ['src/v2/app', 'v2/app namespace'],
  ['src/v2/design/specs', 'Design Specs'],
  ['src/v2/design/views', 'Design Views']
]

[
  ...retiredRoots,
  ['src/v2/design/geometry.js', 'geometry solver'],
  ['src/v2/design/freedom.js', 'freedom compatibility system'],
  ['src/v2/features/sync/mock_transport.js', 'mock sync transport'],
  ['src/pages/index', 'sample index page'],
  ['src/pages/detail', 'sample detail page'],
  [path.join('src', 'common', 'icons', 'soft'), 'soft launcher icon variants'],
  ['scripts/render-soft-icons.py', 'soft icon renderer'],
  ['husky.sh', 'inactive Husky setup'],
  ['commitlint.config.js', 'inactive Commitlint config'],
  ['.prettierrc.js', 'inactive Prettier config'],
  ['.stylelintrc.js', 'inactive Stylelint config']
].forEach(function (entry) {
  assert.strictEqual(exists(entry[0]), false, 'V3 must not restore retired ' + entry[1])
})

const retiredAbsoluteRoots = retiredRoots.map(function (entry) { return { root: path.join(root, entry[0]), label: entry[1] } })
const commonLogic = filesUnder('src/common', /\.(?:js|ux)$/, [])
assert.deepStrictEqual(commonLogic, [], 'src/common is a static-resource namespace only')

filesUnder('src', /\.(?:js|ux)$/, []).forEach(function (file) {
  const source = read(file)
  assert.ok(!source.includes('soft' + 'Icon'), file + ' must not restore the retired soft launcher icon strategy')
  relativeDependencies(source).forEach(function (dependency) {
    const resolved = path.resolve(path.dirname(path.join(root, file)), dependency)
    assert.ok(!inside(resolved, commonRoot), file + ' must not depend on legacy src/common logic: ' + dependency)
    retiredAbsoluteRoots.forEach(function (retired) {
      assert.ok(!inside(resolved, retired.root), file + ' must not depend on retired ' + retired.label + ': ' + dependency)
    })
  })
})

filesUnder('src/v2/design', /\.(?:js|ux)$/, []).forEach(function (file) {
  const source = read(file)
  assert.ok(!source.includes('freedomLevel'), file + ' must not restore retired freedom metadata')
  assert.ok(!source.includes('freedom.AUTO') && !source.includes('freedom.ASSISTED') && !source.includes('freedom.FREE'), file + ' must not restore AUTO/ASSISTED/FREE design levels')
  assert.ok(!source.includes('adaptive-geometry'), file + ' must not restore adaptive geometry strategy')
})

filesUnder('src/v2/design/apps', /(?:^|_)layout\.js$/, []).forEach(function (file) {
  const source = read(file)
  assert.ok(!/^module\.exports\s*=\s*\{\s*\r?\n\s*level\s*:/m.test(source), file + ' must not duplicate resolver-owned differenceLevel')
})

const deviceProfile = read('src/runtime/device_profile.js')
assert.ok(!deviceProfile.includes('isBetaPillViewport'), 'Device Profile must not restore beta-emulator compatibility state')
assert.ok(!deviceProfile.includes("|| 'pill-shaped'"), 'Device Profile must not default an unknown device to Pill')
assert.ok(!deviceProfile.includes('width = 192; height = 490'), 'Device Profile must not fabricate Band dimensions')
assert.ok(!deviceProfile.includes('logicalHeight'), 'Device Profile must not duplicate Scene-owned design projection')
assert.ok(deviceProfile.includes('var ratio = width / height'), 'Device Profile must normalize missing screenShape from physical geometry')
assert.ok(deviceProfile.includes("screenShape(pick(info, local, 'screenShape'), width, height)"), 'Device Profile must prefer native screenShape and use geometry only as fallback')
const pageRuntime = read('src/runtime/page_runtime.js')
assert.ok(!pageRuntime.includes('betaPill'), 'Page Runtime must not restore beta-pill compatibility branches')
const sceneRuntime = read('src/v2/design/scene.js')
assert.ok(!sceneRuntime.includes('shapeOf('), 'Scene must trust the validated Device Profile instead of re-validating shape')
assert.ok(!sceneRuntime.includes('hostScene || resolve(profile)'), 'Scene safe projection must use the resolved Host Scene')
const adapter = read('src/v2/design/adapter.js')
assert.ok(!adapter.includes('function shapeOf('), 'Adapter must not duplicate Device Profile shape validation')
const packageSource = read('package.json')
assert.ok(!packageSource.includes('render-' + 'soft-icons'), 'tooling must not regenerate retired soft launcher icons')
assert.ok(!packageSource.includes('lint-' + 'staged'), 'package metadata must not restore inactive hook tooling')
assert.ok(!packageSource.includes('commit' + 'lint'), 'package metadata must not restore inactive Commitlint tooling')

console.log('V3 legacy absence verified: retired namespaces stay absent and device geometry has one normalization owner')
