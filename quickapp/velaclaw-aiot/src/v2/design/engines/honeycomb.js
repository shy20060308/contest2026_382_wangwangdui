var ELASTIC_BASE = 0.94
var ELASTIC_RANGE = 0.06
var ELASTIC_FALLOFF = 90
var DRAG_DAMPING = 0.92
var MAX_FRAME_DELTA = 24
var FRAME_MS = 24
var OVERSCROLL_LIMIT = 30
var OVERSCROLL_DAMPING = 0.34
var INERTIA_DECAY = 0.86
var MIN_VELOCITY = 0.025
var MAGNET_DISTANCE = 22
var VISIBLE_MARGIN = 42

var AXIAL_DIRECTIONS = [
  { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
  { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 }
]

function clamp(value, min, max) { return value < min ? min : value > max ? max : value }
function clamp01(value) { return clamp(value, 0, 1) }
function smoothStep(value) { var t = clamp01(value); return t * t * (3 - 2 * t) }
function requireArray(name, value) { if (!Array.isArray(value)) throw new Error('Honeycomb requires ' + name + ' array'); return value }
function requireObject(name, value) { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Honeycomb requires ' + name + ' object'); return value }
function requireNumber(name, value) { if (typeof value !== 'number' || !isFinite(value)) throw new Error('Honeycomb requires numeric ' + name); return value }
function requireCount(value) {
  if (typeof value !== 'number' || !isFinite(value) || Math.round(value) !== value || value < 0) throw new Error('Honeycomb requires non-negative integer count')
  return value
}

function minimumEdgeGap(placed) {
  var source = requireArray('placed points', placed)
  var worst = Infinity
  for (var i = 0; i < source.length; i++) for (var j = i + 1; j < source.length; j++) {
    var dx = source[j].centerX - source[i].centerX
    var dy = source[j].centerY - source[i].centerY
    var gap = Math.sqrt(dx * dx + dy * dy) - (source[i].size + source[j].size) / 2
    if (gap < worst) worst = gap
  }
  return worst
}

function pickByDirection(coords, currentIndex, direction) {
  var source = requireArray('coords', coords)
  var current = source[currentIndex]
  if (!current || !direction) return -1
  var bestIndex = -1
  var bestScore = Infinity
  for (var index = 0; index < source.length; index++) {
    if (index === currentIndex) continue
    var dx = source[index].x - current.x
    var dy = source[index].y - current.y
    var distance = Math.sqrt(dx * dx + dy * dy)
    if (!distance) continue
    var alignment = (dx * direction.x + dy * direction.y) / distance
    if (alignment < 0.5) continue
    var score = distance / alignment
    if (score < bestScore) { bestScore = score; bestIndex = index }
  }
  return bestIndex
}

function create(recipe) {
  var config = requireObject('recipe', recipe)
  var focus = requireObject('recipe focus', config.focus)
  var icon = requireObject('recipe icon', config.icon)
  var label = requireObject('recipe label', config.label)
  var viewport = requireObject('resolved viewport', config.viewport)

  var focusX = requireNumber('focus.x', focus.x)
  var focusY = requireNumber('focus.y', focus.y)
  var spacing = requireNumber('spacing', config.spacing)
  var rowHeight = Math.round(spacing * Math.sqrt(3) / 2)
  var iconBaseSize = requireNumber('icon.baseSize', icon.baseSize)
  var iconGrow = requireNumber('icon.grow', icon.grow)
  var emphasisFalloff = requireNumber('icon.emphasisFalloff', icon.emphasisFalloff)
  var centerRadius = requireNumber('icon.centerRadius', icon.centerRadius)
  var radiusRatio = requireNumber('icon.radiusRatio', icon.radiusRatio)
  var opacityBase = requireNumber('icon.opacityBase', icon.opacityBase)
  var opacityEmphasis = requireNumber('icon.opacityEmphasis', icon.opacityEmphasis)
  var avoidanceOpacity = requireNumber('icon.avoidanceOpacity', icon.avoidanceOpacity)
  var labelCenterX = requireNumber('label.left', label.left) + requireNumber('label.width', label.width) / 2
  var labelCenterY = requireNumber('label.top', label.top) + requireNumber('label.height', label.height) / 2
  var labelHalfWidth = label.width / 2
  var labelHalfHeight = label.height / 2
  var viewportWidth = requireNumber('viewport.width', viewport.width)
  var viewportHeight = requireNumber('viewport.height', viewport.height)

  function axialPoint(q, r) {
    return {
      q: q,
      r: r,
      x: Math.round(focusX + spacing * (q + r / 2)),
      y: Math.round(focusY + rowHeight * r)
    }
  }

  function buildCoords(count) {
    var wanted = requireCount(count)
    if (wanted === 0) return []
    var coords = [axialPoint(0, 0)]
    var ring = 1
    while (coords.length < wanted) {
      var q = 0
      var r = -ring
      for (var side = 0; side < AXIAL_DIRECTIONS.length && coords.length < wanted; side++) {
        var direction = AXIAL_DIRECTIONS[side]
        for (var step = 0; step < ring && coords.length < wanted; step++) {
          coords.push(axialPoint(q, r))
          q += direction.q
          r += direction.r
        }
      }
      ring++
    }
    return coords
  }

  function buildSlots(apps) {
    var source = requireArray('apps', apps)
    var coords = buildCoords(source.length)
    var slots = []
    for (var index = 0; index < source.length; index++) {
      var app = source[index]
      var coordinate = coords[index]
      slots.push({
        slotKey: app.id + '-' + index,
        id: app.id,
        label: app.label,
        normalIcon: app.icon,
        sourceIndex: index,
        q: coordinate.q,
        r: coordinate.r,
        gridX: coordinate.x,
        gridY: coordinate.y
      })
    }
    return slots
  }

  function projectPoint(x, y, panX, panY, offsetX, offsetY) {
    var baseX = x + panX
    var baseY = y + panY
    var baseDx = baseX - focusX
    var baseDy = baseY - focusY
    var baseDistance = Math.sqrt(baseDx * baseDx + baseDy * baseDy)
    var elasticFollow = ELASTIC_BASE + clamp01(1 - baseDistance / ELASTIC_FALLOFF) * ELASTIC_RANGE
    var centerX = baseX + offsetX * elasticFollow
    var centerY = baseY + offsetY * elasticFollow
    var dx = centerX - focusX
    var dy = centerY - focusY
    var distance = Math.sqrt(dx * dx + dy * dy)
    var emphasis = smoothStep(1 - distance / emphasisFalloff)
    return { centerX: centerX, centerY: centerY, distance: distance, size: Math.round(iconBaseSize + emphasis * iconGrow), emphasis: emphasis }
  }

  function layoutFrame(coords, panX, panY, offsetX, offsetY) {
    var source = requireArray('coords', coords)
    var px = requireNumber('panX', panX)
    var py = requireNumber('panY', panY)
    var ox = requireNumber('offsetX', offsetX)
    var oy = requireNumber('offsetY', offsetY)
    var result = []
    for (var index = 0; index < source.length; index++) result.push(projectPoint(source[index].x, source[index].y, px, py, ox, oy))
    return result
  }

  function layoutSlots(slots, panX, panY, offsetX, offsetY) {
    var source = requireArray('slots', slots)
    var px = requireNumber('panX', panX)
    var py = requireNumber('panY', panY)
    var ox = requireNumber('offsetX', offsetX)
    var oy = requireNumber('offsetY', offsetY)
    var nextSlots = []
    var nearestIndex = -1
    var nearestDistance = Infinity
    for (var index = 0; index < source.length; index++) {
      var slot = source[index]
      var point = projectPoint(slot.gridX, slot.gridY, px, py, ox, oy)
      if (point.distance < nearestDistance) { nearestDistance = point.distance; nearestIndex = index }
      var bandFadeY = clamp01(1 - Math.abs(point.centerY - labelCenterY) / (labelHalfHeight + point.size / 2))
      var bandFadeX = clamp01(1 - Math.abs(point.centerX - labelCenterX) / (labelHalfWidth + point.size / 2))
      var avoidanceProgress = smoothStep(bandFadeY * bandFadeX)
      var opacity = (opacityBase + point.emphasis * opacityEmphasis) * (1 - avoidanceProgress * avoidanceOpacity)
      nextSlots.push({
        slotKey: slot.slotKey,
        id: slot.id,
        label: slot.label,
        normalIcon: slot.normalIcon,
        sourceIndex: slot.sourceIndex,
        q: slot.q,
        r: slot.r,
        gridX: slot.gridX,
        gridY: slot.gridY,
        isCenter: point.distance < centerRadius,
        size: point.size,
        radius: Math.round(point.size * radiusRatio),
        opacity: opacity,
        icon: slot.normalIcon,
        left: Math.round(point.centerX - point.size / 2),
        top: Math.round(point.centerY - point.size / 2),
        centerX: point.centerX,
        centerY: point.centerY
      })
    }
    return { slots: nextSlots, nearestIndex: nearestIndex, nearestDistance: nearestDistance }
  }

  function visibleSlots(slots) {
    var source = requireArray('slots', slots)
    var result = []
    var minX = -VISIBLE_MARGIN
    var minY = -VISIBLE_MARGIN
    var maxX = viewportWidth + VISIBLE_MARGIN
    var maxY = viewportHeight + VISIBLE_MARGIN
    for (var index = 0; index < source.length; index++) {
      var slot = source[index]
      var half = slot.size / 2
      if (slot.centerX + half < minX || slot.centerX - half > maxX || slot.centerY + half < minY || slot.centerY - half > maxY) continue
      result.push(slot)
    }
    return result
  }

  function panBounds(slots) {
    var source = requireArray('slots', slots)
    if (!source.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    var minX = source[0].gridX
    var maxX = source[0].gridX
    var minY = source[0].gridY
    var maxY = source[0].gridY
    for (var index = 1; index < source.length; index++) {
      minX = Math.min(minX, source[index].gridX)
      maxX = Math.max(maxX, source[index].gridX)
      minY = Math.min(minY, source[index].gridY)
      maxY = Math.max(maxY, source[index].gridY)
    }
    return {
      minX: focusX - maxX,
      maxX: focusX - minX,
      minY: focusY - maxY,
      maxY: focusY - minY
    }
  }

  function clampPan(slots, panX, panY, overscroll) {
    var bounds = panBounds(slots)
    var px = requireNumber('panX', panX)
    var py = requireNumber('panY', panY)
    var extra = requireNumber('overscroll', overscroll)
    if (extra < 0) throw new Error('Honeycomb overscroll must be non-negative')
    return {
      x: clamp(px, bounds.minX - extra, bounds.maxX + extra),
      y: clamp(py, bounds.minY - extra, bounds.maxY + extra)
    }
  }

  function nextPan(slots, panX, panY, deltaX, deltaY) {
    var bounds = panBounds(slots)
    var px = requireNumber('panX', panX)
    var py = requireNumber('panY', panY)
    var dx = clamp(requireNumber('deltaX', deltaX), -MAX_FRAME_DELTA, MAX_FRAME_DELTA) * DRAG_DAMPING
    var dy = clamp(requireNumber('deltaY', deltaY), -MAX_FRAME_DELTA, MAX_FRAME_DELTA) * DRAG_DAMPING
    var nextX = px + dx
    var nextY = py + dy
    if (nextX < bounds.minX) nextX = bounds.minX + (nextX - bounds.minX) * OVERSCROLL_DAMPING
    if (nextX > bounds.maxX) nextX = bounds.maxX + (nextX - bounds.maxX) * OVERSCROLL_DAMPING
    if (nextY < bounds.minY) nextY = bounds.minY + (nextY - bounds.minY) * OVERSCROLL_DAMPING
    if (nextY > bounds.maxY) nextY = bounds.maxY + (nextY - bounds.maxY) * OVERSCROLL_DAMPING
    return clampPan(slots, nextX, nextY, OVERSCROLL_LIMIT)
  }

  function panForSlot(slot, targetFocusY) {
    if (!slot) return null
    var targetY = targetFocusY === undefined ? focusY : requireNumber('targetFocusY', targetFocusY)
    return { x: focusX - slot.gridX, y: targetY - slot.gridY }
  }

  return {
    spacing: spacing,
    focusX: focusX,
    focusY: focusY,
    buildCoords: buildCoords,
    buildSlots: buildSlots,
    layoutFrame: layoutFrame,
    layoutSlots: layoutSlots,
    visibleSlots: visibleSlots,
    panBounds: panBounds,
    clampPan: clampPan,
    nextPan: nextPan,
    minimumEdgeGap: minimumEdgeGap,
    pickByDirection: pickByDirection,
    panForSlot: panForSlot
  }
}

var DIRECTIONS = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
  upLeft: { x: -0.7071, y: -0.7071 }, upRight: { x: 0.7071, y: -0.7071 }, downLeft: { x: -0.7071, y: 0.7071 }, downRight: { x: 0.7071, y: 0.7071 }
}

module.exports = {
  ELASTIC_BASE: ELASTIC_BASE,
  ELASTIC_RANGE: ELASTIC_RANGE,
  DRAG_DAMPING: DRAG_DAMPING,
  MAX_FRAME_DELTA: MAX_FRAME_DELTA,
  FRAME_MS: FRAME_MS,
  OVERSCROLL_LIMIT: OVERSCROLL_LIMIT,
  INERTIA_DECAY: INERTIA_DECAY,
  MIN_VELOCITY: MIN_VELOCITY,
  MAGNET_DISTANCE: MAGNET_DISTANCE,
  VISIBLE_MARGIN: VISIBLE_MARGIN,
  DIRECTIONS: DIRECTIONS,
  create: create
}
