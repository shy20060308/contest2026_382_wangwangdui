var DESIGN_WIDTH = 192

function coverageHeight(profile) {
  if (profile.formFactor === 'circle') return DESIGN_WIDTH
  return Math.ceil(profile.screenHeight * DESIGN_WIDTH / profile.screenWidth)
}

function resolve(profile) {
  var height = coverageHeight(profile)
  return { width: DESIGN_WIDTH, height: height, hostTop: 0, hostBottom: height, shape: profile.formFactor }
}

function safe(profile, hostScene) {
  var inset = profile.safeInsets
  var left = inset.left
  var top = inset.top
  var right = hostScene.width - inset.right
  var bottom = hostScene.height - inset.bottom
  var width = right - left
  var height = bottom - top
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) throw new Error('V3 Scene safe region must be positive')
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: width,
    height: height,
    gestureBar: inset.gestureBar
  }
}

module.exports = { DESIGN_WIDTH: DESIGN_WIDTH, resolve: resolve, safe: safe, coverageHeight: coverageHeight }
