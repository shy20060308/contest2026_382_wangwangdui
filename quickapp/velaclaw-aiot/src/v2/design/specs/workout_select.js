var freedom = require('../freedom')

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function resolve(profile, scene, safe) {
  var compact = safe.height < 170
  var tall = safe.height > 250
  return {
    freedom: freedom.describe(freedom.AUTO),
    freedomLevel: freedom.AUTO,
    strategy: 'auto',
    shape: profile && profile.formFactor ? profile.formFactor : 'rect',
    surface: 'mode-stream',
    header: { left: safe.left, top: safe.top, width: safe.width, height: compact ? 20 : (tall ? 30 : 24) },
    stream: { left: safe.left, top: safe.top + (compact ? 25 : 34), width: safe.width, height: Math.max(50, safe.bottom - (safe.top + (compact ? 25 : 34))) },
    titleSize: compact ? 13 : (tall ? 18 : 15),
    cardHeight: compact ? 52 : (tall ? 76 : 62),
    cardRadius: Math.round((compact ? 52 : (tall ? 76 : 62)) * 0.32),
    actionHeight: compact ? 38 : (tall ? 50 : 42),
    actionRadius: Math.round((compact ? 38 : (tall ? 50 : 42)) / 2),
    modeNameSize: compact ? 10 : (tall ? 15 : 12),
    modeDescSize: compact ? 6 : (tall ? 9 : 7)
  }
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve }
