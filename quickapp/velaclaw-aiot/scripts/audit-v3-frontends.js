const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const srcRoot = path.join(root, 'src')
const pagesRoot = path.join(srcRoot, 'pages')
const productRoot = path.join(srcRoot, 'product')
const surfacesRoot = path.join(productRoot, 'frontend', 'surfaces')
const enginesRoot = path.join(productRoot, 'frontend', 'engines')
const strict = process.argv.includes('--strict')

const allowedModuleTypes = new Set([
  'header', 'text', 'metric-card', 'metric-pair', 'metric-grid', 'metric-list', 'chart-card',
  'progress-card', 'list', 'grid', 'calendar', 'button', 'slider', 'status', 'dialog',
  'image', 'watchface-preview', 'honeycomb', 'spacer'
])

function exists(file) { return fs.existsSync(file) }
function read(file) { return fs.readFileSync(file, 'utf8') }
function relative(file) { return path.relative(root, file).split(path.sep).join('/') }
function filesUnder(dir, matcher, out) {
  out = out || []
  if (!exists(dir)) return out
  fs.readdirSync(dir).forEach(function (name) {
    const file = path.join(dir, name)
    const stat = fs.statSync(file)
    if (stat.isDirectory()) filesUnder(file, matcher, out)
    else if (!matcher || matcher.test(name)) out.push(file)
  })
  return out
}
function expectedUx(route, page) {
  const component = page.component || route.split('/').pop()
  return path.join(srcRoot, route, component + '.ux')
}
function surfaceFilename(route) {
  return route.replace(/^pages\//, '').replace(/\//g, '__') + '.json'
}
function expectedSurface(route) { return path.join(surfacesRoot, surfaceFilename(route)) }
function dependencies(source) {
  const found = []
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /<import\b[^>]*\bsrc=['"]([^'"]+)['"]/g
  ]
  patterns.forEach(function (pattern) {
    let match
    while ((match = pattern.exec(source)) !== null) found.push(match[1])
  })
  return found
}
function allowedPageDependency(dependency) {
  const normalized = dependency.replace(/\\/g, '/')
  return /(?:^|\/)components\/surface_host(?:\.ux)?$/.test(normalized) ||
    /(?:^|\/)runtime\/surface_page$/.test(normalized)
}
function declaredSurfaceIds(source) {
  const ids = []
  const pattern = /surfacePage\.bind\(\s*this\s*,\s*['"]([^'"]+)['"]\s*\)/g
  let match
  while ((match = pattern.exec(source)) !== null) ids.push(match[1])
  return ids
}

const manifest = JSON.parse(read(path.join(srcRoot, 'manifest.json')))
const routeMap = manifest.router && manifest.router.pages ? manifest.router.pages : {}
const routes = Object.keys(routeMap).sort()
const expectedUxFiles = new Set()
const expectedSurfaceFiles = new Set()
const seenIds = new Set()
const seenRoutes = new Set()
const seenControllers = new Set()
const rows = []

routes.forEach(function (route) {
  const ux = expectedUx(route, routeMap[route])
  const surfaceFile = expectedSurface(route)
  expectedUxFiles.add(path.resolve(ux))
  expectedSurfaceFiles.add(path.resolve(surfaceFile))
  const issues = []
  let surface = null

  if (!exists(ux)) issues.push('ux:missing')
  if (!exists(surfaceFile)) issues.push('surface:missing')
  if (exists(surfaceFile)) {
    try { surface = JSON.parse(read(surfaceFile)) } catch (error) { issues.push('surface:invalid-json') }
  }

  if (surface) {
    if (surface.schemaVersion !== 1) issues.push('surface:schema-version')
    if (!surface.id || typeof surface.id !== 'string') issues.push('surface:id')
    else if (seenIds.has(surface.id)) issues.push('surface:duplicate-id')
    else seenIds.add(surface.id)
    if (surface.route !== route) issues.push('surface:route-mismatch')
    if (seenRoutes.has(surface.route)) issues.push('surface:duplicate-route')
    else seenRoutes.add(surface.route)
    if (surface.renderer !== 'surface-v1') issues.push('surface:renderer')
    if (!(surface.controller === null || typeof surface.controller === 'string')) issues.push('surface:controller')
    if (surface.controller) seenControllers.add(surface.controller)
    if (!Array.isArray(surface.modules)) issues.push('surface:modules')
    if (!surface.tokens || typeof surface.tokens !== 'object' || Array.isArray(surface.tokens)) issues.push('surface:tokens')
    ;['base', 'circle', 'pill', 'rect'].forEach(function (shape) {
      if (!surface.variants || !surface.variants[shape] || typeof surface.variants[shape] !== 'object') issues.push('surface:variant-' + shape)
    })
    const moduleIds = new Set()
    ;(surface.modules || []).forEach(function (module, index) {
      if (!module || typeof module !== 'object') { issues.push('surface:module-' + index + '-invalid'); return }
      if (!module.id || typeof module.id !== 'string') issues.push('surface:module-' + index + '-id')
      else if (moduleIds.has(module.id)) issues.push('surface:duplicate-module-id')
      else moduleIds.add(module.id)
      if (!allowedModuleTypes.has(module.type)) issues.push('surface:module-' + index + '-type')
    })
  }

  if (exists(ux)) {
    const source = read(ux)
    if (!/surface_host\.ux/.test(source)) issues.push('ux:not-thin-surface-host')
    dependencies(source).forEach(function (dependency) {
      if (!allowedPageDependency(dependency)) issues.push('ux:unauthorized-dependency')
    })
    const template = (source.match(/<template>([\s\S]*?)<\/template>/) || [])[1] || ''
    if (/<(?:div|stack|scroll|text|image|slider|canvas|list|list-item|input|switch|button|progress|swiper)\b/.test(template)) issues.push('ux:handwritten-product-markup')
    if (/#[0-9a-f]{3,8}\b/i.test(source)) issues.push('ux:literal-color')
    if (/\b(?:isPill|isCircle|isRect|formFactor|screenShape)\b|(?:===|!==)\s*['"](?:pill|circle|rect|pill-shaped)['"]/i.test(source)) issues.push('ux:shape-branch')
    const style = (source.match(/<style>([\s\S]*?)<\/style>/) || [])[1]
    if (style && style.trim()) issues.push('ux:page-style-authority')
    if (surface) {
      const ids = declaredSurfaceIds(source)
      if (ids.length !== 1 || ids[0] !== surface.id) issues.push('ux:surface-id-binding')
    }
  }

  rows.push({ route: route, issues: Array.from(new Set(issues)) })
})

const globalIssues = []
if (exists(path.join(srcRoot, 'v2'))) globalIssues.push('legacy namespace still exists: src/v2')
if (exists(path.join(productRoot, 'design', 'apps'))) globalIssues.push('page-specific design authority still exists: src/product/design/apps')

filesUnder(pagesRoot, /\.ux$/, []).forEach(function (file) {
  if (!expectedUxFiles.has(path.resolve(file))) globalIssues.push('unrouted page UX: ' + relative(file))
})
filesUnder(pagesRoot, /\.js$/, []).forEach(function (file) {
  globalIssues.push('page-local JS can hide a second frontend authority: ' + relative(file))
})
filesUnder(surfacesRoot, /\.json$/, []).forEach(function (file) {
  if (!expectedSurfaceFiles.has(path.resolve(file))) globalIssues.push('unbound surface JSON: ' + relative(file))
})

const genericUx = [
  path.join(srcRoot, 'components', 'surface_host.ux'),
  path.join(srcRoot, 'components', 'surface_collection.ux'),
  path.join(srcRoot, 'components', 'surface_slider.ux'),
  path.join(srcRoot, 'components', 'surface_stage.ux')
]
const allowedNonPageUx = new Set([path.resolve(path.join(srcRoot, 'app.ux'))].concat(genericUx.map(function (file) { return path.resolve(file) })))
filesUnder(srcRoot, /\.ux$/, []).forEach(function (file) {
  const absolute = path.resolve(file)
  if (absolute.startsWith(path.resolve(pagesRoot) + path.sep)) return
  if (allowedNonPageUx.has(absolute)) return
  globalIssues.push('secondary product UX authority: ' + relative(file))
})

filesUnder(path.join(productRoot, 'features'), /\.js$/, []).forEach(function (file) {
  if (/#[0-9a-f]{3,8}\b/i.test(read(file))) globalIssues.push('feature leaks visual color authority: ' + relative(file))
})

const genericFiles = genericUx.concat([
  path.join(productRoot, 'frontend', 'runtime', 'surface_runtime.js'),
  path.join(productRoot, 'frontend', 'runtime', 'experience_runtime.js')
]).concat(filesUnder(enginesRoot, /\.js$/, [])).filter(exists)

genericFiles.forEach(function (file) {
  const source = read(file)
  routes.forEach(function (route) {
    if (source.includes(route)) globalIssues.push('generic renderer contains route-specific branch: ' + relative(file) + ' -> ' + route)
  })
  seenIds.forEach(function (id) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp("['\"]" + escaped + "['\"]").test(source)) globalIssues.push('generic renderer contains surface-specific branch: ' + relative(file) + ' -> ' + id)
  })
  seenControllers.forEach(function (id) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp("['\"]" + escaped + "['\"]").test(source)) globalIssues.push('generic renderer contains controller-specific branch: ' + relative(file) + ' -> ' + id)
  })
  if (/#[0-9a-f]{3,8}\b/i.test(source)) globalIssues.push('generic renderer owns literal visual color: ' + relative(file))
})

const passed = rows.filter(function (row) { return row.issues.length === 0 }).length
console.log('V3 Frontend Authority Audit [' + (strict ? 'STRICT' : 'REPORT') + ']')
console.log('Manifest routes: ' + rows.length + '; compliant: ' + passed + '; pending: ' + (rows.length - passed))
console.log('')
rows.forEach(function (row) {
  console.log((row.issues.length ? 'INVALID ' : 'OK      ') + row.route + (row.issues.length ? '  ' + row.issues.join(', ') : ''))
})
if (globalIssues.length) {
  console.log('\nGlobal authority issues:')
  globalIssues.forEach(function (issue) { console.log('- ' + issue) })
}
const issueCount = rows.reduce(function (count, row) { return count + row.issues.length }, 0) + globalIssues.length
console.log('\nTotal authority violations: ' + issueCount)
if (strict && issueCount) process.exit(1)
