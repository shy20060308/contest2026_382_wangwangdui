var freedom = require('./freedom')

var SYSTEM_ID = 'l2-v2.1'
var VERSION = '2.1'
var SHAPES = {
  circle: {
    contentWidth: 148,
    density: 'compact',
    rhythm: 4,
    cardGap: 6,
    radius: { card: 14, control: 12 }
  },
  pill: {
    contentWidth: 168,
    density: 'vertical',
    rhythm: 8,
    cardGap: 10,
    radius: { card: 20, control: 16 }
  },
  rect: {
    contentWidth: 164,
    density: 'balanced',
    rhythm: 6,
    cardGap: 8,
    radius: { card: 14, control: 12 }
  }
}

function shapeOf(profile) {
  var shape = profile && profile.formFactor ? String(profile.formFactor) : 'rect'
  return SHAPES[shape] ? shape : 'rect'
}

function tokens(profile) {
  var shape = shapeOf(profile)
  var source = SHAPES[shape]
  return {
    shape: shape,
    contentWidth: source.contentWidth,
    density: source.density,
    rhythm: source.rhythm,
    cardGap: source.cardGap,
    radius: { card: source.radius.card, control: source.radius.control }
  }
}

function contentWidth(profile, overrides) {
  var shape = shapeOf(profile)
  if (overrides && Number(overrides[shape]) > 0) return Number(overrides[shape])
  return SHAPES[shape].contentWidth
}

function region(left, top, width, height) {
  return {
    left: Number(left) || 0,
    top: Number(top) || 0,
    width: Math.max(0, Number(width) || 0),
    height: Math.max(0, Number(height) || 0)
  }
}

function safeFrame(safe) {
  return region(safe && safe.left, safe && safe.top, safe && safe.width, safe && safe.height)
}

function pickSurface(surfaces, shape) {
  if (typeof surfaces === 'string') return surfaces
  if (surfaces && surfaces[shape]) return surfaces[shape]
  if (surfaces && surfaces.rect) return surfaces.rect
  return 'assisted-surface'
}

function createPlan(profile, safe, surfaces) {
  var shape = shapeOf(profile)
  var shapeTokens = tokens(profile)
  return {
    designSystem: SYSTEM_ID,
    designSystemVersion: VERSION,
    freedom: freedom.describe(freedom.ASSISTED),
    freedomLevel: freedom.ASSISTED,
    strategy: 'assisted',
    shape: shape,
    surface: pickSurface(surfaces, shape),
    density: shapeTokens.density,
    tokens: shapeTokens,
    content: safeFrame(safe)
  }
}

function needsOverride(requiredHeight, safe) {
  return Math.max(0, Number(requiredHeight) || 0) > Math.max(0, Number(safe && safe.height) || 0)
}

module.exports = {
  SYSTEM_ID: SYSTEM_ID,
  VERSION: VERSION,
  shapeOf: shapeOf,
  tokens: tokens,
  contentWidth: contentWidth,
  region: region,
  safeFrame: safeFrame,
  createPlan: createPlan,
  needsOverride: needsOverride
}
