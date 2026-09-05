var freedom = require('./freedom')

var SYSTEM_ID = 'recipe-translator-v3.0'
var VERSION = '3.0'

function number(value, fallback) {
  var next = Number(value)
  return isFinite(next) ? next : (fallback || 0)
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
    var value = source[key]
    if (value && typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) result[key] = merge(result[key], value)
    else result[key] = clone(value)
  }
  return result
}

function select(recipe, profile) {
  var source = recipe || {}
  return merge(source.base || {}, source[shapeOf(profile)] || {})
}

function contentWidth(profile, recipe) {
  return number(select(recipe, profile).contentWidth, 192)
}

function region(left, top, width, height) {
  return {
    left: Math.round(number(left, 0)),
    top: Math.round(number(top, 0)),
    width: Math.round(number(width, 0)),
    height: Math.round(number(height, 0))
  }
}

// Recipe owns geometry. This function only translates safe/scene-relative
// coordinates into the Host Scene; it does not resize, clamp, scan or scale.
function placeBand(profile, scene, safe, spec) {
  var config = spec || {}
  var bounds = config.bounds === 'scene'
    ? { left: 0, top: 0, width: number(scene && scene.width, 192), height: number(scene && scene.height, 192) }
    : { left: number(safe && safe.left, 0), top: number(safe && safe.top, 0), width: number(safe && safe.width, 192), height: number(safe && safe.height, 192) }
  var width = config.width === undefined ? bounds.width : number(config.width, bounds.width)
  var relativeTop = number(config.top, 0)
  var top = config.absoluteTop === true ? relativeTop : bounds.top + relativeTop
  var height = config.height === undefined ? bounds.top + bounds.height - top : number(config.height, 0)
  var left
  if (config.absoluteLeft === true) left = number(config.left, 0)
  else if (config.align === 'left') left = bounds.left + number(config.left, 0)
  else if (config.align === 'right') left = bounds.left + bounds.width - width - number(config.right, 0)
  else left = bounds.left + (bounds.width - width) / 2 + number(config.offsetX, 0)
  return region(left, top, width, height)
}

function grid(regionValue, columns, gap) {
  var width = number(regionValue && regionValue.width, 0)
  var count = Math.round(number(columns, 1))
  var spacing = number(gap, 0)
  return { columns: count, gap: spacing, itemWidth: Math.floor((width - spacing * (count - 1)) / count) }
}

// Vela treats explicit dimensions as content-box. Recipe dimensions are outer
// design dimensions, so this is a single box-model translation, not a check.
function contentBox(outerWidth, outerHeight, paddingX, paddingY) {
  var px = number(paddingX, 0)
  var py = number(paddingY, 0)
  return {
    width: Math.round(number(outerWidth, 0) - px * 2),
    height: Math.round(number(outerHeight, 0) - py * 2)
  }
}

function createPlan(profile, scene, safe, level, surface) {
  var freedomLevel = level || freedom.AUTO
  return {
    designSystem: SYSTEM_ID,
    designSystemVersion: VERSION,
    freedom: freedom.describe(freedomLevel),
    freedomLevel: freedomLevel,
    strategy: freedomLevel === freedom.FREE ? 'free' : (freedomLevel === freedom.ASSISTED ? 'assisted' : 'auto'),
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
  createPlan: createPlan
}
