const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const sourceRoot = path.join(root, 'src')

function filesUnder(target, result) {
  if (!fs.existsSync(target)) return result
  fs.readdirSync(target).forEach(function (name) {
    const full = path.join(target, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) filesUnder(full, result)
    else result.push(full)
  })
  return result
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
assert.ok(pkg.scripts.clean === 'node scripts/clean-build.js', 'V3 must expose the deterministic build clean command')
assert.ok(/^npm run clean && npm run surfaces:compile && aiot build\b/.test(pkg.scripts.build), 'build must clean output and compile JSON surfaces before aiot build')
assert.ok(/^npm run clean && npm run surfaces:compile && aiot release\b/.test(pkg.scripts.release), 'release must clean output and compile JSON surfaces before aiot release')
assert.ok(/^npm run surfaces:compile && aiot start\b/.test(pkg.scripts.start), 'debug start must compile JSON surfaces before aiot start')

const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8')
assert.ok(!gitignore.includes('/src/product/frontend/generated/'), 'compiled Surface registry must be available to every AIoT staging mode')

const generatedRegistryFile = path.join(sourceRoot, 'product', 'frontend', 'generated', 'surfaces.js')
assert.ok(fs.existsSync(generatedRegistryFile), 'tracked Surface registry must exist before AIoT staging')
const generatedRegistry = fs.readFileSync(generatedRegistryFile, 'utf8')
const generatedRequires = generatedRegistry.match(/require\('\.\.\/surfaces\/[^']+\.json'\)/g) || []
const manifestRouteCount = Object.keys(JSON.parse(fs.readFileSync(path.join(sourceRoot, 'manifest.json'), 'utf8')).router.pages || {}).length
assert.strictEqual(generatedRequires.length, manifestRouteCount, 'Surface registry must statically reference every manifest Surface JSON')
assert.ok(Buffer.byteLength(generatedRegistry, 'utf8') < 10000, 'Surface registry must stay compact and must not inline JSON presentation trees')

const sourceFiles = filesUnder(sourceRoot, [])
const generatedRoot = path.join(sourceRoot, 'product', 'frontend', 'generated')
const authoredSourceFiles = sourceFiles.filter(function (file) { return !file.startsWith(generatedRoot + path.sep) })
const textFiles = authoredSourceFiles.filter(function (file) { return /\.(?:js|ux|json)$/.test(file) })
const corpus = textFiles.map(function (file) { return fs.readFileSync(file, 'utf8') }).join('\n')
const packagedAssets = sourceFiles.filter(function (file) {
  return file.startsWith(path.join(sourceRoot, 'common') + path.sep) && /\.(?:png|jpe?g|webp|gif|svg)$/i.test(file)
})

packagedAssets.forEach(function (file) {
  const relative = path.relative(sourceRoot, file).split(path.sep).join('/')
  const publicPath = '/' + relative
  assert.ok(corpus.includes(publicPath), 'unreferenced packaged asset: src/' + relative)
})

authoredSourceFiles.forEach(function (file) {
  assert.ok(!/\.(?:bak|old|orig|rej|tmp|map)$/i.test(file), 'temporary/generated file must not live under authored src: ' + path.relative(root, file))
})

console.log('V3 package hygiene verified: deterministic compact Surface registry, clean packaging and referenced static assets only')
