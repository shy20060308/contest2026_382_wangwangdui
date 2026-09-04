var freedom = require('../freedom')

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function resolve(profile, scene, safe, options) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var config = options || {}
  var width = Math.min(Number(config.width) || safe.width, safe.width)
  var height = Math.min(Number(config.height) || 72, safe.height)
  return {
    freedom: freedom.describe(freedom.AUTO),
    freedomLevel: freedom.AUTO,
    strategy: 'auto',
    shape: shape,
    surface: 'simple-centered-content',
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

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve }
