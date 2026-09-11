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

function select(surface, profile) {
  var source = surface && surface.experience ? surface.experience : {}
  var base = source.base || {}
  var shape = source[profile.formFactor] || {}
  return adapter.merge(base, shape)
}

function resolveFrame(scene, safe, spec) {
  var frame = spec || {}
  if (frame.bounds === 'scene') {
    return adapter.placeBand({}, scene, safe, {
      bounds: 'scene',
      absoluteTop: true,
      top: frame.top || 0,
      width: frame.width === undefined ? scene.width : frame.width,
      height: frame.height === undefined ? scene.height : frame.height,
      absoluteLeft: frame.left !== undefined,
      left: frame.left || 0,
      align: frame.align,
      offsetX: frame.offsetX || 0
    })
  }
  return adapter.placeBand({}, scene, safe, {
    top: frame.top || 0,
    width: frame.width === undefined ? safe.width : frame.width,
    height: frame.height === undefined ? safe.height : frame.height,
    align: frame.align,
    offsetX: frame.offsetX || 0
  })
}

function collectionItem(item, index, selectedId, idleBorderColor) {
  var id = item.id || String(index)
  var selected = selectedId !== undefined && selectedId !== null && String(selectedId) === String(id)
  return {
    id: id,
    label: item.label || '',
    subtitle: item.subtitle || '',
    description: item.description || item.subtitle || '',
    tag: item.tag || '',
    icon: item.icon || '',
    background: item.background || '',
    accent: item.accent || '',
    action: item.action || '',
    selected: selected,
    borderColor: selected ? (item.accent || idleBorderColor) : idleBorderColor
  }
}

function collection(spec, scene, safe, state) {
  if (!spec) return null
  var source = Array.isArray(spec.items) ? spec.items : []
  var tokens = adapter.merge({}, spec.tokens || {})
  var selectedId = valueAt(state || {}, spec.bind && spec.bind.selectedId)
  var idleBorderColor = tokens.idleBorderColor || ''
  var allItems = source.map(function (item, index) {
    return collectionItem(item || {}, index, selectedId, idleBorderColor)
  })
  var items = allItems
  if (Array.isArray(spec.itemIds) && spec.itemIds.length) {
    var allowed = {}
    for (var allowIndex = 0; allowIndex < spec.itemIds.length; allowIndex++) allowed[String(spec.itemIds[allowIndex])] = true
    items = allItems.filter(function (item) { return !!allowed[String(item.id)] })
  }
  var selectedIndex = -1
  for (var i = 0; i < items.length; i++) if (items[i].selected) { selectedIndex = i; break }
  var selectedItem = null
  for (var j = 0; j < allItems.length; j++) if (allItems[j].selected) { selectedItem = allItems[j]; break }
  if (selectedIndex < 0 && items.length) selectedIndex = 0
  if (!selectedItem && items.length) selectedItem = items[selectedIndex]
  return {
    id: spec.id || 'collection',
    mode: spec.mode || 'list',
    frame: resolveFrame(scene, safe, spec.frame),
    items: items,
    allItems: allItems,
    selectedId: selectedId === undefined || selectedId === null ? '' : String(selectedId),
    selectedIndex: selectedIndex,
    selectedItem: selectedItem,
    tokens: tokens,
    actions: adapter.merge({}, spec.actions || {})
  }
}

function sliders(specs, scene, safe, state) {
  var source = Array.isArray(specs) ? specs : []
  var result = []
  for (var i = 0; i < source.length; i++) {
    var spec = source[i]
    var raw = valueAt(state || {}, spec.bind && spec.bind.value)
    var min = Number(spec.min)
    var max = Number(spec.max)
    var step = Number(spec.step)
    if (!isFinite(min)) min = 0
    if (!isFinite(max)) max = 100
    if (!isFinite(step) || step <= 0) step = 1
    var value = Number(raw)
    if (!isFinite(value)) value = min
    value = Math.max(min, Math.min(max, value))
    result.push({
      id: spec.id || ('slider-' + i),
      frame: resolveFrame(scene, safe, spec.frame),
      min: min,
      max: max,
      step: step,
      value: value,
      title: spec.copy && spec.copy.title ? spec.copy.title : '',
      subtitle: spec.copy && spec.copy.subtitle ? spec.copy.subtitle : '',
      minLabel: spec.copy && spec.copy.minLabel ? spec.copy.minLabel : '',
      maxLabel: spec.copy && spec.copy.maxLabel ? spec.copy.maxLabel : '',
      action: spec.action || '',
      tokens: adapter.merge({}, spec.tokens || {})
    })
  }
  return result
}

function decorate(plan, surface, profile, scene, safe, state) {
  var result = plan || {}
  var selected = select(surface, profile)
  result.collection = collection(selected.collection, scene, safe, state)
  result.sliders = sliders(selected.sliders, scene, safe, state)
  result.gestures = adapter.merge({}, selected.gestures || {})
  result.controllerConfig = adapter.merge({}, selected.controllerConfig || {})
  return result
}

module.exports = { decorate: decorate, select: select }
