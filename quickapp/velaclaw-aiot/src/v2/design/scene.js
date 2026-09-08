var DESIGN_WIDTH = 192

function requiredNumber(value, label) {
  var next = Number(value)
  if (!isFinite(next)) throw new Error('V3 Scene requires ' + label)
  return next
}

function positiveNumber(value, label) {
  var next = requiredNumber(value, label)
  if (next <= 0) throw new Error('V3 Scene requires positive ' + label)
  return next
}

function shapeOf(profile) {
  if (!profile || !profile.formFactor) throw new Error('V3 Scene requires profile.formFactor')
  var shape = String(profile.formFactor)
  if (shape !== 'circle' && shape !== 'pill' && shape !== 'rect') throw new Error('Unsupported V3 scene shape: ' + shape)
  return shape
}

function coverageHeight(profile) {
  if (shapeOf(profile) === 'circle') return DESIGN_WIDTH
  var width = positiveNumber(profile.screenWidth, 'profile.screenWidth')
  var height = positiveNumber(profile.screenHeight, 'profile.screenHeight')
  return Math.ceil(height * DESIGN_WIDTH / width)
}

function resolve(profile) {
  var height = coverageHeight(profile)
  return { width: DESIGN_WIDTH, height: height, hostTop: 0, hostBottom: height, shape: shapeOf(profile) }
}

function safe(profile, hostScene) {
  shapeOf(profile)
  if (!hostScene) throw new Error('V3 Scene requires an explicit Host Scene')
  if (!profile.safeInsets || typeof profile.safeInsets !== 'object') throw new Error('V3 Scene requires profile.safeInsets')
  var hostWidth = positiveNumber(hostScene.width, 'host.width')
  var hostHeight = positiveNumber(hostScene.height, 'host.height')
  var inset = profile.safeInsets
  var left = requiredNumber(inset.left, 'safeInsets.left')
  var top = requiredNumber(inset.top, 'safeInsets.top')
  var right = hostWidth - requiredNumber(inset.right, 'safeInsets.right')
  var bottom = hostHeight - requiredNumber(inset.bottom, 'safeInsets.bottom')
  var width = right - left
  var height = bottom - top
  if (width <= 0 || height <= 0) throw new Error('V3 Scene safe region must be positive')
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: width,
    height: height,
    gestureBar: requiredNumber(inset.gestureBar, 'safeInsets.gestureBar')
  }
}

module.exports = { DESIGN_WIDTH: DESIGN_WIDTH, resolve: resolve, safe: safe, coverageHeight: coverageHeight, shapeOf: shapeOf }
