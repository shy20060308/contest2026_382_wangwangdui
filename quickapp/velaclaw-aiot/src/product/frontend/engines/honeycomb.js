function number(value, fallback) {
  var parsed = Number(value)
  return isFinite(parsed) ? parsed : fallback
}

function clamp(value, min, max) { return value < min ? min : value > max ? max : value }
function clamp01(value) { return clamp(value, 0, 1) }
function smoothStep(value) { var t = clamp01(value); return t * t * (3 - 2 * t) }

function config(tokens, width, height) {
  var spacing = number(tokens.spacing, 46)
  return {
    width: number(width, 192),
    height: number(height, 192),
    spacing: spacing,
    rowHeight: number(tokens.rowHeight, Math.round(spacing * Math.sqrt(3) / 2)),
    focusX: number(tokens.focusX, number(width, 192) / 2),
    focusY: number(tokens.focusY, number(height, 192) * 0.47),
    iconBase: number(tokens.iconBase, 34),
    iconGrow: number(tokens.iconGrow, 16),
    emphasisFalloff: number(tokens.emphasisFalloff, 60),
    centerRadius: number(tokens.centerRadius, 27),
    elasticBase: number(tokens.elasticBase, 0.94),
    elasticRange: number(tokens.elasticRange, 0.06),
    dragDamping: number(tokens.dragDamping, 0.92),
    maxFrameDelta: number(tokens.maxFrameDelta, 24),
    frameMs: number(tokens.frameMs, 24),
    overscrollLimit: number(tokens.overscrollLimit, 30),
    overscrollDamping: number(tokens.overscrollDamping, 0.34),
    inertiaDecay: number(tokens.inertiaDecay, 0.86),
    minVelocity: number(tokens.minVelocity, 0.025),
    magnetDistance: number(tokens.magnetDistance, 22),
    visibleMargin: number(tokens.visibleMargin, 42),
    labelCenterY: number(tokens.labelCenterY, number(height, 192) * 0.875),
    labelHalfHeight: number(tokens.labelHalfHeight, 9),
    labelHalfWidth: number(tokens.labelHalfWidth, 43)
  }
}

var DIRECTIONS = [
  { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
  { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 }
]

function axialPoint(q, r, cfg) {
  return {
    q: q,
    r: r,
    x: Math.round(cfg.focusX + cfg.spacing * (q + r / 2)),
    y: Math.round(cfg.focusY + cfg.rowHeight * r)
  }
}

function buildCoords(count, cfg) {
  var wanted = Math.max(1, Math.floor(Number(count) || 1))
  var coords = [axialPoint(0, 0, cfg)]
  var ring = 1
  while (coords.length < wanted) {
    var q = 0
    var r = -ring
    for (var side = 0; side < DIRECTIONS.length && coords.length < wanted; side++) {
      var direction = DIRECTIONS[side]
      for (var step = 0; step < ring && coords.length < wanted; step++) {
        coords.push(axialPoint(q, r, cfg))
        q += direction.q
        r += direction.r
      }
    }
    ring += 1
  }
  return coords
}

function buildSlots(items, cfg) {
  var source = items || []
  var coords = buildCoords(source.length, cfg)
  var slots = []
  for (var index = 0; index < source.length; index++) {
    var item = source[index]
    var coordinate = coords[index]
    slots.push({
      slotKey: String(item.id || index) + '-' + index,
      id: item.id,
      label: item.label || '',
      icon: item.icon || '',
      action: item.action || '',
      accent: item.accent || '',
      sourceIndex: index,
      gridX: coordinate.x,
      gridY: coordinate.y
    })
  }
  return slots
}

function projectPoint(x, y, panX, panY, cfg) {
  var centerX = x + panX
  var centerY = y + panY
  var dx = centerX - cfg.focusX
  var dy = centerY - cfg.focusY
  var distance = Math.sqrt(dx * dx + dy * dy)
  var elastic = cfg.elasticBase + clamp01(1 - distance / 90) * cfg.elasticRange
  centerX = cfg.focusX + dx * elastic
  centerY = cfg.focusY + dy * elastic
  dx = centerX - cfg.focusX
  dy = centerY - cfg.focusY
  distance = Math.sqrt(dx * dx + dy * dy)
  var emphasis = smoothStep(1 - distance / cfg.emphasisFalloff)
  return { centerX: centerX, centerY: centerY, distance: distance, emphasis: emphasis, size: Math.round(cfg.iconBase + emphasis * cfg.iconGrow) }
}

function layoutSlots(slots, panX, panY, cfg) {
  var source = slots || []
  var result = []
  var nearestIndex = -1
  var nearestDistance = Infinity
  for (var index = 0; index < source.length; index++) {
    var slot = source[index]
    var point = projectPoint(slot.gridX, slot.gridY, panX, panY, cfg)
    if (point.distance < nearestDistance) { nearestDistance = point.distance; nearestIndex = index }
    var bandFadeY = clamp01(1 - Math.abs(point.centerY - cfg.labelCenterY) / (cfg.labelHalfHeight + point.size / 2))
    var bandFadeX = clamp01(1 - Math.abs(point.centerX - cfg.focusX) / (cfg.labelHalfWidth + point.size / 2))
    var avoidance = smoothStep(bandFadeY * bandFadeX)
    result.push({
      slotKey: slot.slotKey,
      id: slot.id,
      label: slot.label,
      icon: slot.icon,
      action: slot.action,
      accent: slot.accent,
      size: point.size,
      radius: Math.round(point.size / 2),
      opacity: (0.48 + point.emphasis * 0.52) * (1 - avoidance * 0.72),
      left: Math.round(point.centerX - point.size / 2),
      top: Math.round(point.centerY - point.size / 2),
      centerX: point.centerX,
      centerY: point.centerY
    })
  }
  return { slots: result, nearestIndex: nearestIndex, nearestDistance: nearestDistance }
}

function visibleSlots(slots, cfg) {
  var result = []
  var min = -cfg.visibleMargin
  var maxX = cfg.width + cfg.visibleMargin
  var maxY = cfg.height + cfg.visibleMargin
  for (var i = 0; i < (slots || []).length; i++) {
    var slot = slots[i]
    var half = slot.size / 2
    if (slot.centerX + half < min || slot.centerX - half > maxX || slot.centerY + half < min || slot.centerY - half > maxY) continue
    result.push(slot)
  }
  return result
}

function panBounds(slots, cfg) {
  if (!slots || !slots.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  var minX = slots[0].gridX, maxX = slots[0].gridX, minY = slots[0].gridY, maxY = slots[0].gridY
  for (var i = 1; i < slots.length; i++) {
    minX = Math.min(minX, slots[i].gridX); maxX = Math.max(maxX, slots[i].gridX)
    minY = Math.min(minY, slots[i].gridY); maxY = Math.max(maxY, slots[i].gridY)
  }
  return { minX: cfg.focusX - maxX, maxX: cfg.focusX - minX, minY: cfg.focusY - maxY, maxY: cfg.focusY - minY }
}

function clampPan(slots, panX, panY, overscroll, cfg) {
  var bounds = panBounds(slots, cfg)
  var extra = Math.max(0, Number(overscroll) || 0)
  return { x: clamp(Number(panX) || 0, bounds.minX - extra, bounds.maxX + extra), y: clamp(Number(panY) || 0, bounds.minY - extra, bounds.maxY + extra) }
}

function nextPan(slots, panX, panY, deltaX, deltaY, cfg) {
  var bounds = panBounds(slots, cfg)
  var dx = clamp(Number(deltaX) || 0, -cfg.maxFrameDelta, cfg.maxFrameDelta) * cfg.dragDamping
  var dy = clamp(Number(deltaY) || 0, -cfg.maxFrameDelta, cfg.maxFrameDelta) * cfg.dragDamping
  var nextX = (Number(panX) || 0) + dx
  var nextY = (Number(panY) || 0) + dy
  if (nextX < bounds.minX) nextX = bounds.minX + (nextX - bounds.minX) * cfg.overscrollDamping
  if (nextX > bounds.maxX) nextX = bounds.maxX + (nextX - bounds.maxX) * cfg.overscrollDamping
  if (nextY < bounds.minY) nextY = bounds.minY + (nextY - bounds.minY) * cfg.overscrollDamping
  if (nextY > bounds.maxY) nextY = bounds.maxY + (nextY - bounds.maxY) * cfg.overscrollDamping
  return clampPan(slots, nextX, nextY, cfg.overscrollLimit, cfg)
}

function panForSlot(slot, cfg) {
  if (!slot) return null
  return { x: cfg.focusX - slot.gridX, y: cfg.focusY - slot.gridY }
}

module.exports = { config: config, buildSlots: buildSlots, layoutSlots: layoutSlots, visibleSlots: visibleSlots, clampPan: clampPan, nextPan: nextPan, panForSlot: panForSlot }
