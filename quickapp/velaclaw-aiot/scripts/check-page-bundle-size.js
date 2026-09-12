const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const pagesRoot = path.join(root, 'build', 'pages')
const hardLimit = 1024 * 1024
const softLimit = 900 * 1024

function filesUnder(dir, out) {
  out = out || []
  if (!fs.existsSync(dir)) return out
  fs.readdirSync(dir).forEach(function (name) {
    const file = path.join(dir, name)
    const stat = fs.statSync(file)
    if (stat.isDirectory()) filesUnder(file, out)
    else if (/\.js$/.test(name)) out.push({ file: file, size: stat.size })
  })
  return out
}

if (!fs.existsSync(pagesRoot)) {
  console.error('Page bundle budget: build/pages does not exist; run after aiot build')
  process.exit(1)
}

const files = filesUnder(pagesRoot, []).sort(function (a, b) { return b.size - a.size })
if (!files.length) {
  console.error('Page bundle budget: no page JavaScript output found under build/pages')
  process.exit(1)
}

const failures = []
console.log('V3 page JavaScript bundle budget (hard limit 1024 KiB)')
files.forEach(function (entry) {
  const relative = path.relative(root, entry.file).split(path.sep).join('/')
  const kib = (entry.size / 1024).toFixed(1)
  const label = entry.size > hardLimit ? 'FAIL' : (entry.size > softLimit ? 'WARN' : 'OK  ')
  console.log(label + '  ' + kib + ' KiB  ' + relative)
  if (entry.size > hardLimit) failures.push(relative + ' = ' + entry.size + ' bytes')
})

if (failures.length) {
  console.error('\nPage JavaScript files above the simulator 1 MiB single-file limit:')
  failures.forEach(function (failure) { console.error('- ' + failure) })
  process.exit(1)
}
console.log('\nPage bundle budget verified: ' + files.length + ' page JS files are <= 1024 KiB')
