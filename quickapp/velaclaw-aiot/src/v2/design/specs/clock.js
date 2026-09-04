var freedom = require('../freedom')

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var height = Math.max(1, Number(scene && scene.height) || 192)
  var safeBottom = Math.max(1, Number(safe && safe.bottom) || height)
  var faceIds = ['sport', 'simple', 'dashboard']
  var surface = 'rect-face-stage'

  if (shape === 'circle') {
    faceIds = ['sport', 'simple', 'dashboard', 'mechanical']
    surface = 'circle-face-stage'
  } else if (shape === 'pill') {
    faceIds = ['sport', 'simple', 'dashboard', 'alpine']
    surface = 'pill-face-stage'
  }

  return {
    freedom: freedom.describe(freedom.FREE),
    freedomLevel: freedom.FREE,
    strategy: 'free',
    shape: shape,
    surface: surface,
    faceIds: faceIds,
    notificationOverlay: shape === 'pill',
    alpineDataGlassTop: Math.max(244, safeBottom - 100) + 'px',
    alpineDataRowTop: Math.max(252, safeBottom - 92) + 'px',
    alpineBatteryRowTop: Math.max(326, safeBottom - 18) + 'px'
  }
}

module.exports = {
  freedomLevel: freedom.FREE,
  resolve: resolve
}
