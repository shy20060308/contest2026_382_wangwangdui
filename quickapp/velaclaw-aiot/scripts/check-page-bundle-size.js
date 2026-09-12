const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const candidates = [
  path.join(root, 'build', 'pages'),
  path.join(root, '.temp_velaclaw-aiot', 'build', 'pages')
]
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

var pagesRoot = null
var files = []
for (var index = 0; index < candidates.length; index++) {
  var candidateFiles = filesUnder(candidates[index], [])
  if (candidateFiles.length) {
    pagesRoot = candidates[index]
    files = candidateFiles
    break
  }
}

if (!files.length) {
  console.error('Page bundle budget: no page JavaScript output found after AIoT compile')
  console.error('Checked:')
  candidates.forEach(function (candidate) { console.error('- ' + candidate) })
  process.exit(1)
}

files.sort(function (a, b) { return b.size - a.size })
const failures = []
console.log('V3 page JavaScript bundle budget (hard limit 1024 KiB)')
console.log('Bundle root: ' + pagesRoot)
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
