const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const buildDir = path.join(root, 'build')

function walk(dir, files) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target, files)
    else files.push(target)
  }
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, '/')
}

assert.ok(fs.existsSync(distDir), 'aiot build must create dist/')
assert.ok(fs.existsSync(buildDir), 'aiot build must create build/')

const distFiles = []
const buildFiles = []
walk(distDir, distFiles)
walk(buildDir, buildFiles)

assert.ok(distFiles.length > 0, 'dist/ must contain build output')
assert.ok(buildFiles.length > 0, 'build/ must contain compiled output')

for (const file of distFiles.concat(buildFiles)) {
  const size = fs.statSync(file).size
  assert.ok(size > 0, relative(file) + ' must not be empty')
}

const debugRpks = distFiles.filter(file => /\.debug(?:\.[^/\\]+)*\.rpk$/i.test(file))
assert.ok(debugRpks.length > 0, 'aiot build must generate at least one versioned debug RPK in dist/')

for (const file of debugRpks) {
  const size = fs.statSync(file).size
  assert.ok(size >= 1024, relative(file) + ' is unexpectedly small (' + size + ' bytes)')
}

const inlineSourceMap = /sourceMappingURL\s*=\s*data:/
for (const file of buildFiles) {
  if (!/\.(?:js|mjs|cjs)$/i.test(file)) continue
  const text = fs.readFileSync(file, 'utf8')
  assert.ok(!inlineSourceMap.test(text), relative(file) + ' must not embed an inline source map')
}

const largest = buildFiles
  .map(file => ({ file: relative(file), size: fs.statSync(file).size }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 8)

console.log('QuickApp build artifacts verified')
console.log('debug rpk:', debugRpks.map(relative).join(', '))
console.log('compiled files:', buildFiles.length)
console.log('largest compiled artifacts:')
for (const item of largest) console.log(' - ' + item.file + ': ' + item.size + ' bytes')
