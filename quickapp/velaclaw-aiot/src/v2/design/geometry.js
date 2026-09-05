var DESIGN_WIDTH = 192

var DEFAULT_INSETS = {
  circle: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 },
  pill: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 },
  rect: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 }
}

function positive(value, fallback) {
  var number = Number(value)
  return isFinite(number) && number > 0 ? number : (fallback || 0)
}

function nonNegative(value, fallback) {
  var number = Number(value)
  return isFinite(number) && number >= 0 ? number : (fallback || 0)
}

function logicalHeight(screenWidth, screenHeight) {
  var width = positive(screenWidth, DESIGN_WIDTH)
  var height = positive(screenHeight, DESIGN_WIDTH)
  return Math.round(height * DESIGN_WIDTH / width)
}

function shapeOf(profile) {
  var shape = profile && profile.formFactor ? String(profile.formFactor) : 'rect'
  return DEFAULT_INSETS[shape] ? shape : 'rect'
}

function insets(profile) {
  var shape = shapeOf(profile)
  var defaults = DEFAULT_INSETS[shape]
  var declared = profile && profile.safeInsets ? profile.safeInsets : {}
  return {
    left: nonNegative(declared.left, defaults.left),
    top: nonNegative(declared.top, defaults.top),
    right: nonNegative(declared.right, defaults.right),
    bottom: nonNegative(declared.bottom, defaults.bottom),
    gestureBar: nonNegative(declared.gestureBar, defaults.gestureBar)
  }
}

module.exports = {
  DESIGN_WIDTH: DESIGN_WIDTH,
  DEFAULT_INSETS: DEFAULT_INSETS,
  logicalHeight: logicalHeight,
  shapeOf: shapeOf,
  insets: insets
}
