'use strict'

const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { URL } = require('url')
const scene = require('../../src/v2/design/scene')
const adapter = require('../../src/v2/design/adapter')
const { PROFILES, APPS } = require('./config')
const { clone, getPath, hasPath, replaceObject } = require('./lib/object')
const { applyChanges, rewriteShapeBlock } = require('./lib/recipe_file')
const { translateUx } = require('./lib/ux_translator')

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const WEB_ROOT = path.join(__dirname, 'web')
const DEFAULT_PORT = Number(process.env.LAYOUT_STUDIO_PORT) || 4174
const PROFILE_INSETS = {
  circle: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 },
  pill: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 },
  rect: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 }
}

function safeApp(id) {
  const app = APPS[id]
  if (!app) throw new Error('未知 App：' + id)
  return app
}

function safeProfile(id) {
  const profile = clone(PROFILES[id])
  if (!profile) throw new Error('未知设备：' + id)
  profile.safeInsets = clone(PROFILE_INSETS[profile.formFactor] || PROFILE_INSETS.rect)
  return profile
}

function layoutPath(app) { return path.join(PROJECT_ROOT, app.appDir, 'layout.js') }
function indexPath(app) { return path.join(PROJECT_ROOT, app.appDir, 'index.js') }
function pagePath(app) { return path.join(PROJECT_ROOT, app.page) }

function freshLayout(app) {
  const file = layoutPath(app)
  delete require.cache[require.resolve(file)]
  return require(file)
}

function allowedPaths(app) {
  const set = new Set()
  ;(app.groups || []).forEach(group => (group.fields || []).forEach(field => set.add(field.path)))
  if (!set.size) {
    const layout = freshLayout(app)
    ;['base', 'circle', 'pill', 'rect'].forEach(section => {
      Object.keys(layout[section] || {}).forEach(key => { if (typeof layout[section][key] === 'number') set.add(key) })
    })
  }
  return set
}

function validateChanges(app, changes) {
  const allowed = allowedPaths(app)
  const source = changes || {}
  Object.keys(source).forEach(key => {
    if (!allowed.has(key)) throw new Error('不允许修改字段：' + key)
    const value = source[key]
    if (value !== null && typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'boolean') throw new Error('字段值类型不受支持：' + key)
    if (typeof value === 'number' && !isFinite(value)) throw new Error('字段必须是有限数字：' + key)
  })
  return source
}

function resolveWithLayout(app, profile, draftLayout) {
  const layoutFile = layoutPath(app)
  const designFile = indexPath(app)
  delete require.cache[require.resolve(designFile)]
  delete require.cache[require.resolve(layoutFile)]
  const exportedLayout = require(layoutFile)
  replaceObject(exportedLayout, draftLayout)
  const design = require(designFile)
  const host = scene.resolve(profile)
  const safe = scene.safe(profile, host)
  const plan = design.resolve(profile, host, safe)
  delete require.cache[require.resolve(designFile)]
  delete require.cache[require.resolve(layoutFile)]
  return { host, safe, plan }
}

function inheritedSource(layout, shape, fieldPath) {
  if (hasPath(layout[shape] || {}, fieldPath)) return { kind: 'override', value: getPath(layout[shape], fieldPath) }
  if (hasPath(layout.base || {}, fieldPath)) return { kind: 'inherited', value: getPath(layout.base, fieldPath) }
  return { kind: 'missing', value: undefined }
}

function fieldModel(layout, draftLayout, shape, app) {
  const resolved = adapter.select(draftLayout, { formFactor: shape })
  return (app.groups || []).map(group => ({
    id: group.id,
    label: group.label,
    hint: group.hint,
    planKey: group.planKey,
    geometry: group.geometry,
    fields: (group.fields || []).map(field => {
      const original = inheritedSource(layout, shape, field.path)
      const draftOwn = hasPath(draftLayout[shape] || {}, field.path)
      return Object.assign({}, field, {
        value: getPath(resolved, field.path),
        source: draftOwn ? 'override' : (hasPath(draftLayout.base || {}, field.path) ? 'inherited' : 'missing'),
        originalSource: original.kind,
        originalValue: original.value
      })
    })
  }))
}

function autoGroups(layout, draftLayout, shape) {
  const resolved = adapter.select(draftLayout, { formFactor: shape })
  const fields = []
  Object.keys(resolved).forEach(key => {
    const value = resolved[key]
    if (typeof value === 'number') fields.push({ path: key, label: key, type: 'number', step: 1, min: 0, max: 600, unit: 'px', value, source: hasPath(draftLayout[shape] || {}, key) ? 'override' : 'inherited' })
  })
  return [{ id: 'quick', label: '常用参数', hint: '直接修改 Recipe 顶层数字参数。', planKey: null, geometry: null, fields }]
}

function componentBoxes(groups, plan) {
  return groups.map(group => {
    if (!group.planKey) return null
    const box = getPath(plan, group.planKey)
    if (!box || typeof box !== 'object') return null
    if (![box.left, box.top, box.width, box.height].every(value => typeof value === 'number' && isFinite(value))) return null
    return { id: group.id, label: group.label, box, geometry: group.geometry || {} }
  }).filter(Boolean)
}

function buildProject(appId, profileId, changes) {
  const app = safeApp(appId)
  const profile = safeProfile(profileId)
  const cleanChanges = validateChanges(app, changes || {})
  const layout = freshLayout(app)
  const draftLayout = applyChanges(layout, profile.formFactor, cleanChanges)
  const result = resolveWithLayout(app, profile, draftLayout)
  let groups = fieldModel(layout, draftLayout, profile.formFactor, app)
  if (!groups.length) groups = autoGroups(layout, draftLayout, profile.formFactor)
  const components = componentBoxes(groups, result.plan)
  const uxSource = fs.readFileSync(pagePath(app), 'utf8')
  const ux = translateUx(uxSource, result.plan, result.host, result.safe, app.mock || {})
  return {
    app: { id: app.id, name: app.name, level: app.level, page: app.page, appDir: app.appDir },
    profile,
    recipe: { base: clone(draftLayout.base || {}), override: clone(draftLayout[profile.formFactor] || {}), resolved: adapter.select(draftLayout, profile) },
    groups,
    components,
    scene: result.host,
    safe: result.safe,
    plan: result.plan,
    ux,
    warnings: [],
    changes: clone(cleanChanges),
    files: { layout: path.relative(PROJECT_ROOT, layoutPath(app)).replace(/\\/g, '/'), page: app.page }
  }
}

function saveChanges(appId, profileId, changes) {
  const app = safeApp(appId)
  const profile = safeProfile(profileId)
  const cleanChanges = validateChanges(app, changes || {})
  const file = layoutPath(app)
  const layout = freshLayout(app)
  const draftLayout = applyChanges(layout, profile.formFactor, cleanChanges)
  const source = fs.readFileSync(file, 'utf8')
  const next = rewriteShapeBlock(source, profile.formFactor, draftLayout[profile.formFactor] || {})
  if (next !== source) fs.writeFileSync(file, next, 'utf8')
  delete require.cache[require.resolve(file)]
  delete require.cache[require.resolve(indexPath(app))]
  return buildProject(appId, profileId, {})
}

function listApps() { return Object.values(APPS).map(app => ({ id: app.id, name: app.name, level: app.level, page: app.page })) }

function json(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data), 'Cache-Control': 'no-store' })
  res.end(data)
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 65536) { reject(new Error('请求过大')); req.destroy() }
    })
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) } catch (_) { reject(new Error('JSON 格式错误')) }
    })
    req.on('error', reject)
  })
}

function staticFile(res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const file = path.resolve(WEB_ROOT, relative)
  if (!file.startsWith(WEB_ROOT + path.sep) && file !== path.join(WEB_ROOT, 'index.html')) return false
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' }
  const data = fs.readFileSync(file)
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': data.length, 'Cache-Control': 'no-store' })
  res.end(data)
  return true
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1')
  try {
    if (req.method === 'GET' && url.pathname === '/api/apps') return json(res, 200, { apps: listApps(), profiles: Object.values(PROFILES) })
    if (req.method === 'GET' && url.pathname === '/api/project') return json(res, 200, buildProject(url.searchParams.get('app') || 'heart', url.searchParams.get('profile') || 'circle', {}))
    if (req.method === 'POST' && url.pathname === '/api/preview') { const body = await readJson(req); return json(res, 200, buildProject(body.app || 'heart', body.profile || 'circle', body.changes || {})) }
    if (req.method === 'POST' && url.pathname === '/api/save') { const body = await readJson(req); return json(res, 200, { saved: true, project: saveChanges(body.app || 'heart', body.profile || 'circle', body.changes || {}) }) }
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, projectRoot: PROJECT_ROOT, version: '3.0' })
    if (req.method === 'GET' && staticFile(res, url.pathname)) return
    json(res, 404, { error: '未找到资源' })
  } catch (error) {
    console.error('[Layout Studio]', error)
    json(res, 400, { error: error.message || '请求失败' })
  }
}

function openBrowser(url) {
  if (process.argv.includes('--no-open') || process.env.LAYOUT_STUDIO_NO_OPEN === '1') return
  let command, args
  if (process.platform === 'win32') { command = 'cmd'; args = ['/c', 'start', '', url] }
  else if (process.platform === 'darwin') { command = 'open'; args = [url] }
  else { command = 'xdg-open'; args = [url] }
  try { const child = spawn(command, args, { detached: true, stdio: 'ignore' }); child.unref() } catch (_) {}
}

function start(port) {
  const server = http.createServer(handler)
  const listenPort = port || DEFAULT_PORT
  server.listen(listenPort, '127.0.0.1', () => {
    const url = 'http://127.0.0.1:' + listenPort
    console.log('\nVela Layout Studio V3 已启动')
    console.log('地址：' + url)
    console.log('说明：只监听本机；点击“保存到本地”才会修改 layout.js。')
    console.log('停止：Ctrl + C\n')
    openBrowser(url)
  })
  return server
}

if (require.main === module) start()
module.exports = { PROJECT_ROOT, listApps, validateChanges, buildProject, saveChanges, handler, start }
