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
assert.ok(/^npm run clean && aiot build\b/.test(pkg.scripts.build), 'build must clean generated output before aiot build')
assert.ok(/^npm run clean && aiot release\b/.test(pkg.scripts.release), 'release must clean generated output before aiot release')

const sourceFiles = filesUnder(sourceRoot, [])
const textFiles = sourceFiles.filter(function (file) { return /\.(?:js|ux|json)$/.test(file) })
const corpus = textFiles.map(function (file) { return fs.readFileSync(file, 'utf8') }).join('\n')
const packagedAssets = sourceFiles.filter(function (file) {
  return file.startsWith(path.join(sourceRoot, 'common') + path.sep) && /\.(?:png|jpe?g|webp|gif|svg)$/i.test(file)
})

packagedAssets.forEach(function (file) {
  const relative = path.relative(sourceRoot, file).split(path.sep).join('/')
  const publicPath = '/' + relative
  assert.ok(corpus.includes(publicPath), 'unreferenced packaged asset: src/' + relative)
})

sourceFiles.forEach(function (file) {
  assert.ok(!/\.(?:bak|old|orig|rej|tmp|map)$/i.test(file), 'temporary/generated file must not live under src: ' + path.relative(root, file))
})

console.log('V3 package hygiene verified: clean packaging and referenced static assets only')
