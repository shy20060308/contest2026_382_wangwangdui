var freedom = require('./freedom')

var SYSTEM_ID = 'recipe-translator-v3.0'
var VERSION = '3.0'

function clamp(value, min, max) {
  var number = Number(value)
  if (!isFinite(number)) number = Number(min) || 0
  return Math.max(Number(min) || 0, Math.min(Number(max), number))
}

function shapeOf(profile) {
  var shape = profile && profile.formFactor ? String(profile.formFactor) : 'rect'
  return shape === 'circle' || shape === 'pill' || shape === 'rect' ? shape : 'rect'
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone)
  if (!value || typeof value !== 'object') return value
  var result = {}
  for (var key in value) result[key] = clone(value[key])
  return result
}

function merge(base, override) {
  var result = clone(base || {})
  var source = override || {}
  for (var key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = merge(result[key], source[key])
    } else {
      result[key] = clone(source[key])
    }
  }
  return result
}

function select(recipe, profile) {
  var source = recipe || {}
  return merge(source.base || {}, source[shapeOf(profile)] || {})
}

function contentWidth(profile, recipe) {
  var config = recipe && (recipe.base || recipe.circle || recipe.pill || recipe.rect) ? select(recipe, profile) : (recipe || {})
  var width = Number(config.contentWidth)
  return isFinite(width) && width > 0 ? width : 192
}

function region(left, top, width, height) {
  return {
    left: Math.round(Number(left) || 0),
    top: Math.round(Number(top) || 0),
    width: Math.max(0, Math.round(Number(width) || 0)),
    height: Math.max(0, Math.round(Number(height) || 0))
  }
}

function boundsOf(scene, safe, mode) {
  if (mode === 'scene') return region(0, 0, scene && scene.width, scene && scene.height)
  return region(safe && safe.left, safe && safe.top, safe && safe.width, safe && safe.height)
}

// v3 Adapter is a translator. Recipes choose dimensions and placement;
// Adapter only converts safe-relative coordinates into a concrete rectangle
// and clips impossible values to the declared rectangular bounds.
function placeBand(profile, scene, safe, spec) {
  var config = spec || {}
  var bounds = boundsOf(scene, safe, config.bounds)
  var width = Math.max(1, Number(config.width) || bounds.width || 1)
  var height = Math.max(1, Number(config.height) || 1)
  width = Math.min(width, bounds.width)
  height = Math.min(height, bounds.height)

  var top = config.absoluteTop === true
    ? Number(config.top) || 0
    : bounds.top + (Number(config.top) || 0)

  var left
  if (config.absoluteLeft === true) left = Number(config.left) || 0
  else if (config.align === 'left') left = bounds.left + (Number(config.left) || 0)
  else if (config.align === 'right') left = bounds.left + bounds.width - width - (Number(config.right) || 0)
  else left = bounds.left + (bounds.width - width) / 2 + (Number(config.offsetX) || 0)

  left = clamp(left, bounds.left, bounds.left + bounds.width - width)
  top = clamp(top, bounds.top, bounds.top + bounds.height - height)
  return region(left, top, width, height)
}

function grid(regionValue, columns, gap) {
  var source = regionValue || { width: 0 }
  var count = Math.max(1, Math.round(Number(columns) || 1))
  var spacing = Math.max(0, Number(gap) || 0)
  return {
    columns: count,
    gap: spacing,
    itemWidth: Math.max(1, Math.floor((Math.max(1, Number(source.width) || 1) - spacing * (count - 1)) / count))
  }
}

// Recipes describe outer size. Vela element width/height are translated to
// content size here so padding does not silently change the declared design.
function contentBox(outerWidth, outerHeight, paddingX, paddingY) {
  var px = Math.max(0, Number(paddingX) || 0)
  var py = Math.max(0, Number(paddingY) || 0)
  return {
    width: Math.max(1, Math.round(Number(outerWidth) || 0) - px * 2),
    height: Math.max(1, Math.round(Number(outerHeight) || 0) - py * 2)
  }
}

function createPlan(profile, scene, safe, level, surface) {
  return {
    designSystem: SYSTEM_ID,
    designSystemVersion: VERSION,
    freedom: freedom.describe(level || freedom.AUTO),
    freedomLevel: level || freedom.AUTO,
    strategy: level === freedom.FREE ? 'free' : (level === freedom.ASSISTED ? 'assisted' : 'auto'),
    shape: shapeOf(profile),
    surface: surface || 'surface',
    content: region(safe && safe.left, safe && safe.top, safe && safe.width, safe && safe.height)
  }
}

module.exports = {
  SYSTEM_ID: SYSTEM_ID,
  VERSION: VERSION,
  shapeOf: shapeOf,
  select: select,
  merge: merge,
  contentWidth: contentWidth,
  region: region,
  placeBand: placeBand,
  grid: grid,
  contentBox: contentBox,
  createPlan: createPlan,
  clamp: clamp
}
