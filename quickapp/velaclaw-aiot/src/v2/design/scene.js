var safeArea = require('../../presentation/viewport/safe_area')

function px(value, fallback) {
  if (typeof value === 'number') return value
  var number = parseFloat(String(value || ''))
  return isFinite(number) ? number : (fallback || 0)
}

function resolve(profile) {
  var logicalHeight = Number(profile && profile.logicalHeight) || safeArea.DESIGN_WIDTH
  var hostTop = px(profile && profile.viewportTop, 0)
  var hostHeight = px(profile && profile.viewportHeight, 0)
  if (!hostHeight) hostHeight = Math.max(1, logicalHeight - hostTop)
  return {
    width: safeArea.DESIGN_WIDTH,
    height: hostHeight,
    hostTop: hostTop,
    hostBottom: hostTop + hostHeight,
    shape: profile && profile.formFactor ? profile.formFactor : 'rect'
  }
}

function safeForWidth(profile, contentWidth, comfort) {
  var scene = resolve(profile)
  var globalSafe = safeArea.resolve(profile, contentWidth, comfort)
  var top = Math.max(0, globalSafe.top - scene.hostTop)
  var bottom = Math.min(scene.height, globalSafe.bottom - scene.hostTop)
  if (bottom < top) bottom = top
  return {
    left: globalSafe.left,
    top: top,
    bottom: bottom,
    width: globalSafe.contentWidth,
    height: bottom - top,
    gestureBar: globalSafe.gestureBar
  }
}

module.exports = {
  resolve: resolve,
  safeForWidth: safeForWidth
}
