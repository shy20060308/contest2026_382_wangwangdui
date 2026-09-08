var difference = require('./difference')

var SYSTEM_ID = 'recipe-translator-v3.0'
var VERSION = '3.0'

function requiredNumber(value, label) {
  var next = Number(value)
  if (!isFinite(next)) throw new Error('V3 Adapter requires ' + label)
  return next
}

function optionalNumber(value, label, fallback) {
  return value === undefined ? fallback : requiredNumber(value, label)
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
  if (!recipe || typeof recipe !== 'object') throw new Error('V3 Adapter requires a recipe object')
  var shape = profile.formFactor
  var base = recipe.base && typeof recipe.base === 'object' ? recipe.base : {}
  var override = recipe[shape] && typeof recipe[shape] === 'object' ? recipe[shape] : {}
  return merge(base, override)
}

function contentWidth(profile, recipe) {
  return requiredNumber(select(recipe, profile).contentWidth, 'recipe.contentWidth')
}

function region(left, top, width, height) {
  return {
    left: Math.round(requiredNumber(left, 'region.left')),
    top: Math.round(requiredNumber(top, 'region.top')),
    width: Math.round(requiredNumber(width, 'region.width')),
    height: Math.round(requiredNumber(height, 'region.height'))
  }
}

function placeBand(profile, scene, safe, spec) {
  var config = spec || {}
  var bounds = config.bounds === 'scene'
    ? { left: 0, top: 0, width: scene.width, height: scene.height }
    : { left: safe.left, top: safe.top, width: safe.width, height: safe.height }
  var width = config.width === undefined ? bounds.width : requiredNumber(config.width, 'band.width')
  var relativeTop = optionalNumber(config.top, 'band.top', 0)
  var top = config.absoluteTop === true ? relativeTop : bounds.top + relativeTop
  var height = config.height === undefined ? bounds.top + bounds.height - top : requiredNumber(config.height, 'band.height')
  var left
  if (config.absoluteLeft === true) left = optionalNumber(config.left, 'band.left', 0)
  else if (config.align === 'left') left = bounds.left + optionalNumber(config.left, 'band.left', 0)
  else if (config.align === 'right') left = bounds.left + bounds.width - width - optionalNumber(config.right, 'band.right', 0)
  else left = bounds.left + (bounds.width - width) / 2 + optionalNumber(config.offsetX, 'band.offsetX', 0)
  return region(left, top, width, height)
}

function grid(regionValue, columns, gap) {
  var width = requiredNumber(regionValue && regionValue.width, 'grid.region.width')
  var count = Math.round(requiredNumber(columns, 'grid.columns'))
  if (count < 1) throw new Error('V3 Adapter requires grid.columns >= 1')
  var spacing = optionalNumber(gap, 'grid.gap', 0)
  return { columns: count, gap: spacing, itemWidth: Math.floor((width - spacing * (count - 1)) / count) }
}

function contentBox(outerWidth, outerHeight, paddingX, paddingY) {
  var width = requiredNumber(outerWidth, 'contentBox.outerWidth')
  var height = requiredNumber(outerHeight, 'contentBox.outerHeight')
  var px = optionalNumber(paddingX, 'contentBox.paddingX', 0)
  var py = optionalNumber(paddingY, 'contentBox.paddingY', 0)
  var contentWidth = Math.round(width - px * 2)
  var contentHeight = Math.round(height - py * 2)
  if (contentWidth < 0 || contentHeight < 0) throw new Error('V3 Adapter content box cannot be negative')
  return { width: contentWidth, height: contentHeight }
}

function createPlan(profile, scene, safe, level, surface) {
  var differenceInfo = difference.describe(level)
  if (!surface || typeof surface !== 'string') throw new Error('V3 Adapter requires recipe.surface')
  return {
    designSystem: SYSTEM_ID,
    designSystemVersion: VERSION,
    difference: differenceInfo,
    differenceLevel: level,
    shape: profile.formFactor,
    surface: surface,
    content: { left: safe.left, top: safe.top, width: safe.width, height: safe.height }
  }
}

module.exports = {
  SYSTEM_ID: SYSTEM_ID,
  VERSION: VERSION,
  select: select,
  merge: merge,
  contentWidth: contentWidth,
  region: region,
  placeBand: placeBand,
  grid: grid,
  contentBox: contentBox,
  createPlan: createPlan
}
