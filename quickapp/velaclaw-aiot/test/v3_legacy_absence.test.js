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
assert.strictEqual(exists('src/v2/design/specs'), false, 'V3 must not restore Design Spec compatibility code')
assert.strictEqual(exists('src/v2/design/views'), false, 'V3 must not restore Design View compatibility code')
assert.strictEqual(exists('src/v2/design/geometry.js'), false, 'V3 must not restore the retired geometry solver')

const commonLogic = filesUnder('src/common', /\.(?:js|ux)$/, [])
assert.deepStrictEqual(commonLogic, [], 'src/common is a static-resource namespace only; runtime logic belongs to Capability/Domain/Feature/Design/App')

filesUnder('src', /\.(?:js|ux)$/, []).forEach(function (file) {
  const source = read(file)
  relativeDependencies(source).forEach(function (dependency) {
    const resolved = path.resolve(path.dirname(path.join(root, file)), dependency)
    assert.ok(!inside(resolved, commonRoot), file + ' must not depend on legacy src/common logic: ' + dependency)
  })
})

filesUnder('test', /\.test\.js$/, []).forEach(function (file) {
  const source = read(file)
  assert.ok(!source.includes('src/common/'), file + ' must not validate retired common logic')
  assert.ok(!source.includes('src/presentation/'), file + ' must not validate retired presentation logic')
  assert.ok(!source.includes('src/platform/'), file + ' must not validate retired platform aliases')
  assert.ok(!source.includes('design/views/'), file + ' must not validate retired Design Views')
  assert.ok(!source.includes('design/specs/'), file + ' must not validate retired Design Specs')
})

console.log('V3 legacy absence verified: no compatibility runtime, aliases or legacy test contracts')
