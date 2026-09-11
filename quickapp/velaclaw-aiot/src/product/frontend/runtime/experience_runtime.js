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

function visible(expression, state) {
  if (!expression) return true
  var text = String(expression)
  if (text.charAt(0) === '!') return !valueAt(state, text.slice(1))
  return !!valueAt(state, text)
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

function previewForItem(item, formFactor, selected, tokens) {
  var source = item.previews && item.previews[formFactor] ? item.previews[formFactor] : null
  if (!source) return null
  var preview = {}
  for (var key in source) preview[key] = source[key]
  preview.boxes = Array.isArray(source.boxes) ? source.boxes.slice() : []
  preview.texts = Array.isArray(source.texts) ? source.texts.slice() : []
  if (!selected) return preview

  var width = Number(tokens.selectedLineWidth)
  var height = Number(tokens.selectedLineHeight)
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) return preview
  var left = Number(tokens.selectedLineLeft)
  var bottom = Number(tokens.selectedLineBottom)
  var previewWidth = Number(preview.width)
  var previewHeight = Number(preview.height)
  if (!isFinite(left)) left = isFinite(previewWidth) ? (previewWidth - width) / 2 : 0
  if (!isFinite(bottom)) bottom = 0
  var top = isFinite(previewHeight) ? previewHeight - bottom - height : 0
  preview.boxes.push({
    id: 'selection-indicator',
    frame: {
      left: Math.round(left),
      top: Math.max(0, Math.round(top)),
      width: Math.round(width),
      height: Math.round(height)
    },
    radius: Math.max(0, Number(tokens.selectedLineRadius) || 0),
    borderWidth: 0,
    borderColor: '',
    background: item.accent || '',
    originX: 0,
    originY: 0,
    transform: ''
  })
  return preview
}

function collectionItem(item, index, selectedId, idleBorderColor, formFactor, tokens) {
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
    preview: previewForItem(item, formFactor, selected, tokens || {}),
    selected: selected,
    borderColor: selected ? (item.accent || idleBorderColor) : idleBorderColor
  }
}

function collection(spec, scene, safe, state, formFactor) {
  if (!spec || !visible(spec.visibleWhen, state || {})) return null
  var source = Array.isArray(spec.items) ? spec.items : []
  var tokens = adapter.merge({}, spec.tokens || {})
  var selectedId = valueAt(state || {}, spec.bind && spec.bind.selectedId)
  var idleBorderColor = tokens.idleBorderColor || ''
  var allItems = source.map(function (item, index) {
    return collectionItem(item || {}, index, selectedId, idleBorderColor, formFactor, tokens)
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

function pad2(value) { return value < 10 ? '0' + value : String(value) }
function numberText(value) {
  if (value === undefined || value === null || value === '') return '--'
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function stageFormat(value, format, nullText) {
  if (value === undefined || value === null || value === '') return nullText === undefined ? '--' : String(nullText)
  if (!format || format === 'raw') return String(value)
  if (format === 'number') return numberText(value)
  if (format === 'percent') return numberText(value) + '%'
  if (format === 'time') {
    var date = new Date(value)
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes())
  }
  if (format === 'hour') return pad2(new Date(value).getHours())
  if (format === 'minute') return pad2(new Date(value).getMinutes())
  if (format === 'day') return pad2(new Date(value).getDate())
  if (format === 'month') return pad2(new Date(value).getMonth() + 1)
  if (format === 'weekday') {
    var labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return labels[new Date(value).getDay()]
  }
  if (String(format).indexOf('suffix:') === 0) return numberText(value) + String(format).slice(7)
  throw new Error('Unknown V3 stage format: ' + format)
}
function fill(template, values) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, key) {
    var value = values[key]
    return value === undefined || value === null ? '' : String(value)
  })
}
function stageVisible(expression, state) {
  return visible(expression, state)
}
function localFrame(spec) {
  var source = spec || {}
  return {
    left: Math.round(Number(source.left) || 0),
    top: Math.round(Number(source.top) || 0),
    width: Math.max(0, Math.round(Number(source.width) || 0)),
    height: Math.max(0, Math.round(Number(source.height) || 0))
  }
}
function elementAction(element) {
  return element && element.actions && element.actions.tap ? element.actions.tap : ''
}
function resolveStageText(element, state) {
  var raw = element.bind && element.bind.value ? valueAt(state, element.bind.value) : undefined
  var props = element.props || {}
  var value = raw === undefined && element.copy && element.copy.text !== undefined
    ? String(element.copy.text)
    : stageFormat(raw, props.valueFormat || props.format, props.valueNullText)
  var text = element.copy && element.copy.template ? fill(element.copy.template, { value: value }) : value
  return { id: element.id, frame: localFrame(element.frame), text: text, action: elementAction(element), tokens: adapter.merge({}, element.tokens || {}) }
}
function resolveStageMetric(element, state) {
  var props = element.props || {}
  var value = stageFormat(valueAt(state, element.bind && element.bind.value), props.valueFormat || props.format, props.valueNullText)
  return {
    id: element.id,
    frame: localFrame(element.frame),
    label: element.copy && element.copy.label ? element.copy.label : '',
    value: value,
    detail: element.copy && element.copy.detail ? element.copy.detail : '',
    action: elementAction(element),
    tokens: adapter.merge({}, element.tokens || {})
  }
}
function resolveStageProgress(element, state) {
  var frame = localFrame(element.frame)
  var props = element.props || {}
  var raw = Number(valueAt(state, element.bind && element.bind.value)) || 0
  var max = Number(props.max)
  if (!isFinite(max) || max <= 0) max = 100
  var ratio = Math.max(0, Math.min(1, raw / max))
  return {
    id: element.id,
    frame: frame,
    fillWidth: Math.round(frame.width * ratio),
    valueText: stageFormat(raw, props.valueFormat || 'percent', props.valueNullText),
    action: elementAction(element),
    tokens: adapter.merge({}, element.tokens || {})
  }
}
function analogParts(element, state, model) {
  var frame = localFrame(element.frame)
  var tokens = adapter.merge({}, element.tokens || {})
  var timestamp = valueAt(state, element.bind && element.bind.value)
  var date = new Date(timestamp || Date.now())
  var centerX = frame.left + frame.width / 2
  var centerY = frame.top + frame.height / 2
  var tickCount = Math.max(1, Math.round(Number(tokens.tickCount) || 60))
  var majorEvery = Math.max(1, Math.round(Number(tokens.majorEvery) || 5))
  model.analogDials.push({ id: element.id + '-outer', frame: frame, tokens: tokens })
  if (Number(tokens.innerInset) > 0) {
    var inset = Number(tokens.innerInset)
    model.analogDials.push({
      id: element.id + '-inner',
      frame: { left: frame.left + inset, top: frame.top + inset, width: frame.width - inset * 2, height: frame.height - inset * 2 },
      tokens: { background: '', borderColor: tokens.innerBorderColor, borderWidth: tokens.innerBorderWidth, radius: Math.max(0, (frame.width - inset * 2) / 2) }
    })
  }
  for (var i = 0; i < tickCount; i++) {
    var major = i % majorEvery === 0
    var width = major ? Number(tokens.majorTickWidth) : Number(tokens.tickWidth)
    var height = major ? Number(tokens.majorTickHeight) : Number(tokens.tickHeight)
    var insetTop = major ? Number(tokens.majorTickInset) : Number(tokens.tickInset)
    width = isFinite(width) ? width : 1
    height = isFinite(height) ? height : 4
    insetTop = isFinite(insetTop) ? insetTop : 8
    model.analogTicks.push({
      id: element.id + '-tick-' + i,
      frame: { left: Math.round(centerX - width / 2), top: Math.round(frame.top + insetTop), width: width, height: height },
      originX: width / 2,
      originY: centerY - (frame.top + insetTop),
      transform: 'rotate(' + Math.round(i * 360 / tickCount) + 'deg)',
      color: major ? tokens.majorTickColor : tokens.tickColor
    })
  }
  var hands = [
    { id: 'hour', angle: (date.getHours() % 12) * 30 + date.getMinutes() * 0.5, length: Number(tokens.hourLength), width: Number(tokens.hourWidth), color: tokens.hourColor },
    { id: 'minute', angle: date.getMinutes() * 6 + date.getSeconds() * 0.1, length: Number(tokens.minuteLength), width: Number(tokens.minuteWidth), color: tokens.minuteColor },
    { id: 'second', angle: date.getSeconds() * 6, length: Number(tokens.secondLength), width: Number(tokens.secondWidth), color: tokens.secondColor }
  ]
  for (var h = 0; h < hands.length; h++) {
    var hand = hands[h]
    if (!isFinite(hand.length) || !isFinite(hand.width) || hand.length <= 0 || hand.width <= 0) continue
    model.analogHands.push({
      id: element.id + '-' + hand.id,
      frame: { left: Math.round(centerX - hand.width / 2), top: Math.round(centerY - hand.length), width: hand.width, height: hand.length },
      originX: hand.width / 2,
      originY: hand.length,
      transform: 'rotate(' + hand.angle + 'deg)',
      color: hand.color,
      radius: Number(tokens.handRadius) || 0
    })
  }
  var pinSize = Number(tokens.pinSize)
  if (isFinite(pinSize) && pinSize > 0) {
    model.analogPins.push({
      id: element.id + '-pin',
      frame: { left: Math.round(centerX - pinSize / 2), top: Math.round(centerY - pinSize / 2), width: pinSize, height: pinSize },
      radius: Number(tokens.pinRadius) || pinSize / 2,
      color: tokens.pinColor
    })
  }
}
function resolveStage(spec, scene, safe, state) {
  if (!spec || !stageVisible(spec.visibleWhen, state || {})) return null
  var variantId = valueAt(state || {}, spec.bind && spec.bind.variant)
  var definitions = spec.variants || {}
  var definition = definitions[String(variantId)]
  if (!definition) throw new Error('V3 stage has no JSON composition for variant: ' + variantId)
  var model = {
    id: spec.id || 'stage',
    variantId: String(variantId),
    frame: resolveFrame(scene, safe, spec.frame),
    background: definition.background || (spec.tokens && spec.tokens.background) || '',
    tokens: adapter.merge(spec.tokens || {}, definition.tokens || {}),
    panels: [], texts: [], metrics: [], progresses: [], analogDials: [], analogTicks: [], analogHands: [], analogPins: []
  }
  var elements = Array.isArray(definition.elements) ? definition.elements : []
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i]
    if (!element || !stageVisible(element.visibleWhen, state || {})) continue
    if (element.type === 'panel') {
      model.panels.push({ id: element.id, frame: localFrame(element.frame), action: elementAction(element), tokens: adapter.merge({}, element.tokens || {}) })
    } else if (element.type === 'text') {
      model.texts.push(resolveStageText(element, state || {}))
    } else if (element.type === 'metric') {
      model.metrics.push(resolveStageMetric(element, state || {}))
    } else if (element.type === 'progress') {
      model.progresses.push(resolveStageProgress(element, state || {}))
    } else if (element.type === 'analog') {
      analogParts(element, state || {}, model)
    } else {
      throw new Error('Unknown V3 stage element type: ' + element.type)
    }
  }
  return model
}

function decorate(plan, surface, profile, scene, safe, state) {
  var result = plan || {}
  var selected = select(surface, profile)
  result.collection = collection(selected.collection, scene, safe, state, profile.formFactor)
  result.sliders = sliders(selected.sliders, scene, safe, state)
  result.stage = resolveStage(selected.stage, scene, safe, state)
  result.gestures = adapter.merge({}, selected.gestures || {})
  result.controllerConfig = adapter.merge({}, selected.controllerConfig || {})
  return result
}

module.exports = { decorate: decorate, select: select }
