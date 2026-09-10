var adapter = require('../../design/adapter')

function valueAt(source, pathValue) {
  if (!pathValue) return source
  var cursor = source
  var parts = String(pathValue).split('.')
  for (var i = 0; i < parts.length; i++) {
    if (cursor === null || cursor === undefined) return undefined
    cursor = cursor[parts[i]]
  }
  return cursor
}

function formatNumber(value) {
  return String(value === undefined || value === null ? 0 : value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fill(template, values) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, key) {
    var value = values[key]
    return value === undefined || value === null ? '' : String(value)
  })
}

function variant(surface, profile) {
  var base = surface.variants && surface.variants.base ? surface.variants.base : {}
  var shape = surface.variants && surface.variants[profile.formFactor] ? surface.variants[profile.formFactor] : {}
  return {
    tokens: adapter.merge(adapter.merge(surface.tokens || {}, base.tokens || {}), shape.tokens || {}),
    modules: adapter.merge(base.modules || {}, shape.modules || {})
  }
}

function frameFor(profile, scene, safe, tokens) {
  var spec = adapter.merge({}, tokens.frame || {})
  if (spec.heightMode === 'scene-bottom') {
    var relativeTop = spec.top || 0
    var absoluteTop = safe.top + relativeTop
    spec.bounds = 'scene'
    spec.absoluteTop = true
    spec.top = absoluteTop
    spec.height = scene.height - absoluteTop
    delete spec.heightMode
  }
  return adapter.placeBand(profile, scene, safe, spec)
}

function definitionMap(definitions) {
  var result = {}
  for (var i = 0; i < definitions.length; i++) result[definitions[i].id] = definitions[i]
  return result
}

function metricListData(module, tokens, frame, state) {
  var raw = valueAt(state, module.bind && module.bind.items) || []
  var rawById = definitionMap(raw)
  var definitions = module.props && module.props.items ? module.props.items : []
  var definitionById = definitionMap(definitions)
  var copy = module.copy || {}
  var trackWidth = frame.width - (tokens.itemPadding || 0) * 2
  var result = []

  for (var rawIndex = 0; rawIndex < raw.length; rawIndex++) {
    if (!definitionById[raw[rawIndex].id]) throw new Error('V3 metric-list received undeclared semantic id ' + raw[rawIndex].id)
  }

  for (var i = 0; i < definitions.length; i++) {
    var definition = definitions[i]
    var metric = rawById[definition.id]
    if (!metric) continue
    var current = Number(metric.current) || 0
    var goal = Number(metric.goal) || 0
    var ratio = goal > 0 ? current / goal : 0
    var percent = Math.round(ratio * 100)
    var complete = goal > 0 && current >= goal
    var remaining = complete ? 0 : Math.max(0, goal - current)
    var extra = complete ? Math.max(0, current - goal) : 0
    var accent = definition.tokens && definition.tokens.accent
    var unit = definition.copy && definition.copy.unit ? definition.copy.unit : ''
    var values = {
      percent: percent,
      goal: formatNumber(goal),
      remaining: formatNumber(remaining),
      extra: formatNumber(extra),
      unit: unit
    }
    var statusText = complete
      ? (extra > 0 ? fill(copy.over, values) : fill(copy.complete, values))
      : fill(copy.remaining, values)

    result.push({
      id: definition.id,
      name: definition.copy && definition.copy.label ? definition.copy.label : definition.id,
      current: formatNumber(current),
      unit: unit,
      accent: accent,
      progressText: percent > 999 ? fill(copy.percentCap, values) : fill(copy.percent, values),
      progressWidth: Math.round(Math.max(0, Math.min(1, ratio)) * trackWidth),
      goalText: fill(copy.goal, values),
      statusText: statusText,
      statusColor: complete ? accent : tokens.pendingColor,
      trackWidth: trackWidth
    })
  }
  return result
}

function resolveModule(surfaceModule, moduleOverride, profile, scene, safe, state) {
  var tokens = adapter.merge(surfaceModule.tokens || {}, moduleOverride || {})
  var frame = frameFor(profile, scene, safe, tokens)
  var resolved = {
    id: surfaceModule.id,
    type: surfaceModule.type,
    frame: frame,
    copy: adapter.merge({}, surfaceModule.copy || {}),
    tokens: tokens,
    action: surfaceModule.actions && surfaceModule.actions.tap ? surfaceModule.actions.tap : ''
  }
  if (surfaceModule.type === 'metric-list') resolved.items = metricListData(surfaceModule, tokens, frame, state || {})
  return resolved
}

function resolve(surface, profile, scene, safe, state) {
  if (!surface || surface.renderer !== 'surface-v1') throw new Error('V3 Surface Runtime requires surface-v1 JSON')
  var selected = variant(surface, profile)
  var modules = []
  var headers = []
  var texts = []
  var buttons = []
  var metricList = null

  for (var i = 0; i < surface.modules.length; i++) {
    var module = resolveModule(surface.modules[i], selected.modules[surface.modules[i].id], profile, scene, safe, state || {})
    modules.push(module)
    if (module.type === 'header') headers.push(module)
    else if (module.type === 'text') texts.push(module)
    else if (module.type === 'button') buttons.push(module)
    else if (module.type === 'metric-list') {
      if (metricList) throw new Error('surface-v1 currently permits one metric-list module per surface')
      metricList = module
    }
  }

  return {
    id: surface.id,
    shape: profile.formFactor,
    sceneWidth: scene.width,
    sceneHeight: scene.height,
    background: selected.tokens.background,
    modules: modules,
    headers: headers,
    texts: texts,
    buttons: buttons,
    metricList: metricList
  }
}

module.exports = { resolve: resolve }
