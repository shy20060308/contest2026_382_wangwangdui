var geometry = require('./geometry')

function px(value, fallback) {
  if (typeof value === 'number') return value
  var number = parseFloat(String(value || ''))
  return isFinite(number) ? number : (fallback || 0)
}

function resolve(profile) {
  var logicalHeight = Number(profile && profile.logicalHeight) || geometry.DESIGN_WIDTH
  var hostTop = px(profile && profile.viewportTop, 0)
  var hostHeight = px(profile && profile.viewportHeight, 0)
  if (!hostHeight) hostHeight = Math.max(1, logicalHeight - hostTop)
  return {
    width: geometry.DESIGN_WIDTH,
    height: hostHeight,
    hostTop: hostTop,
    hostBottom: hostTop + hostHeight,
    shape: profile && profile.formFactor ? profile.formFactor : 'rect'
  }
}

function safeForWidth(profile, contentWidth, comfort) {
  var host = resolve(profile)
  var globalSafe = geometry.safe(profile, contentWidth, comfort)
  var top = Math.max(0, globalSafe.top - host.hostTop)
  var bottom = Math.min(host.height, globalSafe.bottom - host.hostTop)
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
