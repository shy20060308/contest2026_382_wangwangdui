var freedom = require('./freedom')

var SYSTEM_ID = 'adapter-first-v2.2'
var VERSION = '2.2'
var SHAPES = {
  circle: { contentWidth: 148, density: 'compact', radius: 14, rhythm: 4 },
  pill: { contentWidth: 168, density: 'vertical', radius: 20, rhythm: 8 },
  rect: { contentWidth: 164, density: 'balanced', radius: 16, rhythm: 6 }
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }

function shapeOf(profile) {
  var shape = profile && profile.formFactor ? String(profile.formFactor) : 'rect'
  return SHAPES[shape] ? shape : 'rect'
}

function contentWidth(profile, overrides) {
  var shape = shapeOf(profile)
  if (overrides && Number(overrides[shape]) > 0) return Number(overrides[shape])
  return SHAPES[shape].contentWidth
}

function region(left, top, width, height) {
  return {
    left: Math.round(Number(left) || 0),
    top: Math.round(Number(top) || 0),
    width: Math.max(0, Math.round(Number(width) || 0)),
    height: Math.max(0, Math.round(Number(height) || 0))
  }
}

function sceneWidth(scene) { return Math.max(1, Number(scene && scene.width) || 192) }
function sceneHeight(scene) { return Math.max(1, Number(scene && scene.height) || 192) }

function circleChordWidth(scene, y, edgePadding) {
  var width = sceneWidth(scene)
  var height = sceneHeight(scene)
  var radius = Math.min(width, height) / 2 - Math.max(0, Number(edgePadding) || 0)
  var centerY = height / 2
  var dy = Math.abs(Number(y) - centerY)
  if (radius <= 0 || dy >= radius) return 0
  return 2 * Math.sqrt(radius * radius - dy * dy)
}

function availableBandWidth(profile, scene, top, height, options) {
  if (shapeOf(profile) !== 'circle') return sceneWidth(scene)
  var config = options || {}
  var padding = Math.max(0, Number(config.edgePadding) || 0)
  var mode = config.fit || 'edges'
  var y
  if (mode === 'center') {
    y = Number(top) + Number(height) / 2
    return circleChordWidth(scene, y, padding)
  }
  if (mode === 'top') {
    return circleChordWidth(scene, Number(top) + Math.max(1, padding), padding)
  }
  var topY = Number(top) + Math.max(1, padding)
  var bottomY = Number(top) + Number(height) - Math.max(1, padding)
  return Math.min(circleChordWidth(scene, topY, padding), circleChordWidth(scene, bottomY, padding))
}

function fitTop(profile, scene, safe, wantedTop, height, minWidth, options) {
  if (shapeOf(profile) !== 'circle' || !(options && options.reposition)) return wantedTop
  var low = Math.max(0, Math.round(Number(safe && safe.top) || 0))
  var high = Math.max(low, Math.floor(Math.min(sceneHeight(scene) - height, Number(safe && safe.bottom) - height || sceneHeight(scene) - height)))
  var origin = clamp(Math.round(wantedTop), low, high)
  var best = origin
  var bestDistance = Infinity
  for (var top = low; top <= high; top++) {
    if (availableBandWidth(profile, scene, top, height, options) + 0.01 < minWidth) continue
    var distance = Math.abs(top - origin)
    if (distance < bestDistance) { best = top; bestDistance = distance }
  }
  return best
}

function fitBand(profile, scene, safe, options) {
  var config = options || {}
  var preferredWidth = Math.max(1, Number(config.preferredWidth) || Number(safe && safe.width) || contentWidth(profile))
  var minWidth = Math.max(1, Math.min(preferredWidth, Number(config.minWidth) || preferredWidth))
  var height = Math.max(1, Number(config.height) || 1)
  var wantedTop = Number(config.top)
  if (!isFinite(wantedTop)) wantedTop = Number(safe && safe.top) || 0
  var top = fitTop(profile, scene, safe, wantedTop, height, minWidth, config)
  var available = availableBandWidth(profile, scene, top, height, config)
  var safeWidth = Math.max(1, Number(safe && safe.width) || sceneWidth(scene))
  var width = Math.min(preferredWidth, safeWidth)
  if (shapeOf(profile) === 'circle') width = Math.min(width, Math.max(1, Math.floor(available)))
  var centerX = sceneWidth(scene) / 2
  var safeLeft = Number(safe && safe.left) || 0
  var left = shapeOf(profile) === 'circle' ? centerX - width / 2 : safeLeft + (safeWidth - width) / 2
  return region(left, top, width, height)
}

function grid(regionValue, columns, gap) {
  var source = regionValue || region(0, 0, 0, 0)
  var count = Math.max(1, Math.round(Number(columns) || 1))
  var spacing = Math.max(0, Number(gap) || 0)
  return {
    columns: count,
    gap: spacing,
    itemWidth: Math.max(1, Math.floor((source.width - spacing * (count - 1)) / count))
  }
}

function heightScale(safe, baseline, min, max) {
  var base = Math.max(1, Number(baseline) || 192)
  var ratio = Math.sqrt(Math.max(1, Number(safe && safe.height) || base) / base)
  return clamp(ratio, Number(min) || 0.8, Number(max) || 1.3)
}

function createPlan(profile, scene, safe, level, surface) {
  var shape = shapeOf(profile)
  var tokens = SHAPES[shape]
  return {
    designSystem: SYSTEM_ID,
    designSystemVersion: VERSION,
    freedom: freedom.describe(level || freedom.AUTO),
    freedomLevel: level || freedom.AUTO,
    strategy: level === freedom.FREE ? 'free' : (level === freedom.ASSISTED ? 'assisted' : 'auto'),
    shape: shape,
    surface: surface || 'adaptive-surface',
    tokens: {
      contentWidth: tokens.contentWidth,
      density: tokens.density,
      radius: tokens.radius,
      rhythm: tokens.rhythm
    },
    content: region(safe && safe.left, safe && safe.top, safe && safe.width, safe && safe.height)
  }
}

module.exports = {
  SYSTEM_ID: SYSTEM_ID,
  VERSION: VERSION,
  shapeOf: shapeOf,
  contentWidth: contentWidth,
  region: region,
  circleChordWidth: circleChordWidth,
  availableBandWidth: availableBandWidth,
  fitBand: fitBand,
  grid: grid,
  heightScale: heightScale,
  createPlan: createPlan,
  clamp: clamp
}
