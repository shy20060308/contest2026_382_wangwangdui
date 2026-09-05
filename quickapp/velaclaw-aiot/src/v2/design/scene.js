var DESIGN_WIDTH = 192

function number(value, fallback) {
  var next = Number(value)
  return isFinite(next) ? next : (fallback || 0)
}

function shapeOf(profile) {
  var shape = profile && profile.formFactor ? String(profile.formFactor) : 'rect'
  return shape === 'circle' || shape === 'pill' || shape === 'rect' ? shape : 'rect'
}

function coverageHeight(profile) {
  if (shapeOf(profile) === 'circle') return DESIGN_WIDTH
  var width = number(profile && profile.screenWidth, DESIGN_WIDTH)
  var height = number(profile && profile.screenHeight, DESIGN_WIDTH)
  return Math.ceil(height * DESIGN_WIDTH / width)
}

function resolve(profile) {
  var height = coverageHeight(profile)
  return { width: DESIGN_WIDTH, height: height, hostTop: 0, hostBottom: height, shape: shapeOf(profile) }
}

function safe(profile, hostScene) {
  var host = hostScene || resolve(profile)
  var inset = profile && profile.safeInsets ? profile.safeInsets : {}
  var left = number(inset.left, 0)
  var top = number(inset.top, 0)
  var right = host.width - number(inset.right, 0)
  var bottom = host.height - number(inset.bottom, 0)
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: right - left,
    height: bottom - top,
    gestureBar: number(inset.gestureBar, 0)
  }
}

module.exports = { DESIGN_WIDTH: DESIGN_WIDTH, resolve: resolve, safe: safe, coverageHeight: coverageHeight, shapeOf: shapeOf }
