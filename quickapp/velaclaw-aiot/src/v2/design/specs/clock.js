function resolve(profile, scene) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var height = Math.max(1, Number(scene && scene.height) || 192)
  return {
    freedomLevel: 3,
    strategy: 'free',
    shape: shape,
    componentFamily: shape === 'circle' ? 'circle' : 'rectangular',
    notificationOverlay: shape === 'pill',
    alpineDataGlassTop: Math.max(244, height - 128) + 'px',
    alpineDataRowTop: Math.max(252, height - 120) + 'px',
    alpineBatteryRowTop: Math.max(326, height - 46) + 'px'
  }
}

module.exports = { resolve: resolve }
