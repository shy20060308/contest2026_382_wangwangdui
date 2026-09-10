const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const srcRoot = path.join(root, 'src')
const pagesRoot = path.join(srcRoot, 'pages')
const productRoot = path.join(srcRoot, 'product')
const surfacesRoot = path.join(productRoot, 'frontend', 'surfaces')
const frontendRuntimeRoot = path.join(productRoot, 'frontend', 'runtime')
const strict = process.argv.includes('--strict')
const staged = process.argv.includes('--staged')

const allowedModuleTypes = new Set([
  'header', 'text', 'metric-card', 'metric-pair', 'metric-list', 'chart-card',
  'progress-card', 'list', 'grid', 'calendar', 'button', 'slider', 'status',
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

function expectedSurface(route) {
  return path.join(surfacesRoot, surfaceFilename(route))
}

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

function visibleStaticText(source) {
  const template = (source.match(/<template>([\s\S]*?)<\/template>/) || [])[1] || ''
  const withoutBindings = template.replace(/\{\{[\s\S]*?\}\}/g, '')
  const text = []
  const pattern = />\s*([^<]*\S[^<]*)\s*</g
  let match
  while ((match = pattern.exec(withoutBindings)) !== null) {
    const value = match[1].replace(/\s+/g, ' ').trim()
    if (value) text.push(value)
  }
  return text
}

function allowedPageDependency(dependency) {
  const normalized = dependency.replace(/\\/g, '/')
  return /(?:^|\/)components\/surface_host(?:\.ux)?$/.test(normalized) ||
    /(?:^|\/)runtime\/surface_page$/.test(normalized)
}

function validateSurface(file, route, seenIds, seenRoutes, seenControllers) {
  const issues = []
  let surface
  try {
    surface = JSON.parse(read(file))
  } catch (error) {
    return { issues: ['surface:invalid-json'], surface: null }
  }

  if (surface.schemaVersion !== 1) issues.push('surface:schema-version')
  if (!surface.id || typeof surface.id !== 'string') issues.push('surface:id')
  if (surface.route !== route) issues.push('surface:route-mismatch')
  if (surface.renderer !== 'surface-v1') issues.push('surface:renderer-must-be-generic')
  if (!(typeof surface.controller === 'string' || surface.controller === null)) issues.push('surface:controller')
  if (!Array.isArray(surface.modules)) issues.push('surface:modules')
  if (!surface.tokens || typeof surface.tokens !== 'object' || Array.isArray(surface.tokens)) issues.push('surface:tokens')
  if (!surface.variants || typeof surface.variants !== 'object' || Array.isArray(surface.variants)) issues.push('surface:variants')
  ;['base', 'circle', 'pill', 'rect'].forEach(function (shape) {
    if (!surface.variants || !surface.variants[shape] || typeof surface.variants[shape] !== 'object') issues.push('surface:variant-' + shape)
  })

  if (surface.id) {
    if (seenIds.has(surface.id)) issues.push('surface:duplicate-id')
    else seenIds.add(surface.id)
  }
  if (surface.route) {
    if (seenRoutes.has(surface.route)) issues.push('surface:duplicate-route')
    else seenRoutes.add(surface.route)
  }
  if (surface.controller) seenControllers.add(surface.controller)

  const moduleIds = new Set()
  ;(Array.isArray(surface.modules) ? surface.modules : []).forEach(function (module, index) {
    if (!module || typeof module !== 'object') {
      issues.push('surface:module-' + index + '-invalid')
      return
    }
    if (!module.id || typeof module.id !== 'string') issues.push('surface:module-' + index + '-id')
    else if (moduleIds.has(module.id)) issues.push('surface:duplicate-module-id')
    else moduleIds.add(module.id)
    if (!allowedModuleTypes.has(module.type)) issues.push('surface:module-' + index + '-type')
  })

  return { issues: issues, surface: surface }
}

function auditUx(file) {
  if (!exists(file)) return ['ux:missing']
  const source = read(file)
  const issues = []

  if (!source.includes('surface-host')) issues.push('ux:not-thin-surface-host')
  if (/(?:^|[/'"])(?:v2)(?:[/'"]|$)/.test(source)) issues.push('ux:legacy-v2-dependency')

  dependencies(source).forEach(function (dependency) {
    if (!allowedPageDependency(dependency)) issues.push('ux:unauthorized-dependency')
    if (/(?:^|\/)(?:product\/(?:design|features)|v2|domain|capabilities)(?:\/|$)/.test(dependency)) {
      issues.push('ux:direct-product-dependency')
    }
  })

  const template = (source.match(/<template>([\s\S]*?)<\/template>/) || [])[1] || ''
  if (/<(?:div|stack|scroll|text|image|slider|canvas|list|list-item|input|switch|button|progress|swiper)\b/.test(template)) {
    issues.push('ux:handwritten-product-markup')
  }
  if (/\b(?:width|height|left|top|right|bottom|padding(?:-[\w]+)?|margin(?:-[\w]+)?|border-radius|font-size|line-height)\s*:\s*-?\d+(?:\.\d+)?px\b/i.test(source)) {
    issues.push('ux:literal-px')
  }
  if (/#[0-9a-f]{3,8}\b/i.test(source)) issues.push('ux:literal-color')
  if (/\b(?:isPill|isCircle|isRect|formFactor|screenShape)\b|(?:===|!==)\s*['"](?:pill|circle|rect|pill-shaped)['"]/i.test(source)) {
    issues.push('ux:shape-branch')
  }
  if (visibleStaticText(source).length) issues.push('ux:static-visible-copy')

  const style = (source.match(/<style>([\s\S]*?)<\/style>/) || [])[1]
  if (style && style.trim()) issues.push('ux:page-style-authority')

  return Array.from(new Set(issues))
}

const manifest = JSON.parse(read(path.join(srcRoot, 'manifest.json')))
const routeMap = manifest.router && manifest.router.pages ? manifest.router.pages : {}
const routes = Object.keys(routeMap).sort()
const expectedUxFiles = new Set()
const expectedSurfaceFiles = new Set()
const seenIds = new Set()
const seenSurfaceRoutes = new Set()
const seenControllers = new Set()
const rows = []

routes.forEach(function (route) {
  const ux = expectedUx(route, routeMap[route])
  const surface = expectedSurface(route)
  const hasSurface = exists(surface)
  expectedUxFiles.add(path.resolve(ux))
  expectedSurfaceFiles.add(path.resolve(surface))

  const issues = auditUx(ux)
  if (!hasSurface) issues.push('surface:missing')
  else issues.push.apply(issues, validateSurface(surface, route, seenIds, seenSurfaceRoutes, seenControllers).issues)

  rows.push({ route: route, ux: relative(ux), surface: relative(surface), hasSurface: hasSurface, issues: Array.from(new Set(issues)) })
})

const globalIssues = []
const stagedGlobalIssues = []
if (exists(path.join(srcRoot, 'v2'))) globalIssues.push('legacy namespace still exists: src/v2')

filesUnder(pagesRoot, /\.ux$/, []).forEach(function (file) {
  if (!expectedUxFiles.has(path.resolve(file))) {
    const issue = 'unrouted page UX: ' + relative(file)
    globalIssues.push(issue)
    stagedGlobalIssues.push(issue)
  }
})
filesUnder(pagesRoot, /\.js$/, []).forEach(function (file) {
  const issue = 'page-local JS can hide a second frontend authority: ' + relative(file)
  globalIssues.push(issue)
  stagedGlobalIssues.push(issue)
})

filesUnder(surfacesRoot, /\.json$/, []).forEach(function (file) {
  if (!expectedSurfaceFiles.has(path.resolve(file))) {
    const issue = 'unbound surface JSON: ' + relative(file)
    globalIssues.push(issue)
    stagedGlobalIssues.push(issue)
  }
})

filesUnder(path.join(productRoot, 'design', 'apps'), /\.(?:js|json)$/, []).forEach(function (file) {
  globalIssues.push('page-specific design authority outside Surface JSON: ' + relative(file))
})

const allowedNonPageUx = new Set([
  path.resolve(path.join(srcRoot, 'app.ux')),
  path.resolve(path.join(srcRoot, 'components', 'surface_host.ux'))
])
filesUnder(srcRoot, /\.ux$/, []).forEach(function (file) {
  const absolute = path.resolve(file)
  if (absolute.startsWith(path.resolve(pagesRoot) + path.sep)) return
  if (allowedNonPageUx.has(absolute)) return
  globalIssues.push('secondary product UX authority: ' + relative(file))
})

filesUnder(path.join(productRoot, 'features'), /\.js$/, []).forEach(function (file) {
  if (/#[0-9a-f]{3,8}\b/i.test(read(file))) globalIssues.push('feature leaks visual color authority: ' + relative(file))
})

const genericRendererFiles = []
const surfaceHost = path.join(srcRoot, 'components', 'surface_host.ux')
if (exists(surfaceHost)) genericRendererFiles.push(surfaceHost)
filesUnder(frontendRuntimeRoot, /\.(?:js|ux)$/, genericRendererFiles)
genericRendererFiles.forEach(function (file) {
  const source = read(file)
  routes.forEach(function (route) {
    if (source.includes(route)) {
      const issue = 'generic renderer contains route-specific branch: ' + relative(file) + ' -> ' + route
      globalIssues.push(issue); stagedGlobalIssues.push(issue)
    }
  })
  seenIds.forEach(function (id) {
    const quoted = new RegExp("['\"]" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]")
    if (quoted.test(source)) {
      const issue = 'generic renderer contains surface-specific branch: ' + relative(file) + ' -> ' + id
      globalIssues.push(issue); stagedGlobalIssues.push(issue)
    }
  })
  seenControllers.forEach(function (id) {
    const quoted = new RegExp("['\"]" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]")
    if (quoted.test(source)) {
      const issue = 'generic renderer contains controller-specific branch: ' + relative(file) + ' -> ' + id
      globalIssues.push(issue); stagedGlobalIssues.push(issue)
    }
  })
  if (/#[0-9a-f]{3,8}\b/i.test(source)) {
    const issue = 'generic renderer owns literal visual color: ' + relative(file)
    globalIssues.push(issue); stagedGlobalIssues.push(issue)
  }
  if (/\b(?:width|height|radius|fontSize|gap|padding|margin|left|top|right|bottom)\s*:\s*-?\d+(?:\.\d+)?\b/.test(source)) {
    const issue = 'generic renderer owns literal visual geometry: ' + relative(file)
    globalIssues.push(issue); stagedGlobalIssues.push(issue)
  }
})

const passed = rows.filter(function (row) { return row.issues.length === 0 }).length
const mode = strict ? 'STRICT' : (staged ? 'STAGED' : 'REPORT')
console.log('V3 Frontend Authority Audit [' + mode + ']')
console.log('Manifest routes: ' + rows.length + '; compliant: ' + passed + '; pending: ' + (rows.length - passed))
console.log('')
rows.forEach(function (row) {
  const state = row.issues.length ? (row.hasSurface ? 'INVALID' : 'PENDING') : 'OK'
  console.log(state.padEnd(8) + ' ' + row.route.padEnd(30) + ' ' + (row.issues.join(', ') || '-'))
})
if (globalIssues.length) {
  console.log('\nGlobal authority issues:')
  globalIssues.forEach(function (issue) { console.log('- ' + issue) })
}

const issueCount = rows.reduce(function (count, row) { return count + row.issues.length }, 0) + globalIssues.length
const stagedRouteIssueCount = rows.filter(function (row) { return row.hasSurface }).reduce(function (count, row) { return count + row.issues.length }, 0)
const stagedIssueCount = stagedRouteIssueCount + stagedGlobalIssues.length
console.log('\nTotal authority violations: ' + issueCount)
if (staged) console.log('Migrated-surface violations: ' + stagedIssueCount)
if (strict && issueCount) process.exit(1)
if (staged && stagedIssueCount) process.exit(1)
