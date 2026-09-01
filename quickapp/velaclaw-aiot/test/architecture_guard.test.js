const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  let result = []
  fs.readdirSync(dir).forEach(function (name) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) result = result.concat(walk(full))
    else if (/\.(js|ux)$/.test(name)) result.push(full)
  })
  return result
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, '/')
}

function fail(message) {
  throw new Error(message)
}

const domainFiles = walk(path.join(root, 'src', 'domain'))
domainFiles.forEach(function (file) {
  const source = fs.readFileSync(file, 'utf8')
  const name = relative(file)
  ;['@system.', '@service.', '@system/', '@service/'].forEach(function (token) {
    if (source.includes(token)) fail(name + ' leaks platform API into domain: ' + token)
  })
  ;['screenWidth', 'screenHeight', 'screenShape', 'isCircle', 'isPill', 'isRect', '@media', 'px;'].forEach(function (token) {
    if (source.includes(token)) fail(name + ' leaks presentation concerns into domain: ' + token)
  })
})

const presentationFiles = walk(path.join(root, 'src', 'presentation'))
presentationFiles.forEach(function (file) {
  const source = fs.readFileSync(file, 'utf8')
  const name = relative(file)
  ;['@system.', '@service.', '@system/', '@service/'].forEach(function (token) {
    if (source.includes(token)) fail(name + ' must access Vela through platform adapters: ' + token)
  })
})

const legacyBudgets = {
  'src/common/watch_data.js': 100,
  'src/common/health_domain.js': 60,
  'src/common/health_sample_service.js': 10,
  'src/common/health_metrics.js': 20,
  'src/common/screen_profile.js': 10,
  'src/common/page_viewport.js': 10,
  'src/common/safe_area.js': 10,
  'src/common/viewport_math.js': 10,
  'src/common/storage_adapter.js': 10
}

Object.keys(legacyBudgets).forEach(function (name) {
  const file = path.join(root, name)
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length
  if (lines > legacyBudgets[name]) {
    fail(name + ' compatibility entry grew to ' + lines + ' lines; budget=' + legacyBudgets[name])
  }
})

console.log('Architecture guard passed: platform/domain/presentation boundaries hold')
