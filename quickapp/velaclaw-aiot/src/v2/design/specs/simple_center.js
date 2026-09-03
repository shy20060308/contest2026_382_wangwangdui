function resolve(profile, scene, safe, options) {
  var config = options || {}
  var width = Math.min(Number(config.width) || safe.width, safe.width)
  var height = Math.min(Number(config.height) || 72, safe.height)
  return {
    freedomLevel: 1,
    strategy: 'auto',
    region: {
      left: safe.left + Math.round((safe.width - width) / 2),
      top: safe.top + Math.round((safe.height - height) / 2),
      width: width,
      height: height
    },
    titleSize: safe.height > 260 ? 22 : 15,
    buttonHeight: safe.height > 260 ? 48 : 32,
    radius: safe.height > 260 ? 24 : 16
  }
}

module.exports = { resolve: resolve }
