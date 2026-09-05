var geometry = require('./geometry')

function positive(value, fallback) {
  var number = Number(value)
  return isFinite(number) && number > 0 ? number : (fallback || 0)
}

function coverageHeight(profile) {
  var logicalHeight = positive(profile && profile.logicalHeight, geometry.DESIGN_WIDTH)
  var screenWidth = positive(profile && profile.screenWidth, 0)
  var screenHeight = positive(profile && profile.screenHeight, 0)
  if (screenWidth && screenHeight) {
    var physicalCoverage = Math.ceil(screenHeight * geometry.DESIGN_WIDTH / screenWidth)
    if (physicalCoverage > logicalHeight) logicalHeight = physicalCoverage
  }
  return logicalHeight
}

function resolve(profile) {
  var height = coverageHeight(profile)
  return {
    width: geometry.DESIGN_WIDTH,
    height: height,
    hostTop: 0,
    hostBottom: height,
    shape: geometry.shapeOf(profile)
  }
}

function safe(profile) {
  var host = resolve(profile)
  var inset = geometry.insets(profile)
  var left = Math.min(host.width, inset.left)
  var right = Math.min(host.width, inset.right)
  var top = Math.min(host.height, inset.top)
  var bottomInset = Math.min(host.height, inset.bottom)
  var width = Math.max(0, host.width - left - right)
  var bottom = Math.max(top, host.height - bottomInset)
  return {
    left: left,
    top: top,
    right: left + width,
    bottom: bottom,
    width: width,
    height: Math.max(0, bottom - top),
    gestureBar: inset.gestureBar
  }
}

module.exports = {
  resolve: resolve,
  safe: safe,
  coverageHeight: coverageHeight
}
