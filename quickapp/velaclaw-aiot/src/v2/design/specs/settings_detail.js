var freedom = require('../freedom')

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var compact = shape === 'circle' || safe.height < 170
  var tall = shape !== 'circle' && safe.height > 250
  var headerHeight = compact ? 20 : (tall ? 32 : 24)
  var gap = compact ? 5 : 8
  var header = { left: safe.left, top: safe.top, width: safe.width, height: headerHeight }
  var streamTop = safe.top + headerHeight + gap
  var stream = { left: safe.left, top: streamTop, width: safe.width, height: Math.max(40, safe.bottom - streamTop) }

  if (shape === 'circle') {
    // The topmost chord is intentionally narrow on a round display. Keep the
    // header centered in that chord, then allow the scroll stream to widen once
    // it reaches the body of the watch. This uses the screen instead of hiding
    // it behind large top/bottom rectangular safe bands.
    header = { left: 36, top: 18, width: 120, height: 20 }
    streamTop = 42
    stream = { left: 22, top: streamTop, width: 148, height: Math.max(40, Math.min(140, scene.height - streamTop - 10)) }
  }

  return {
    freedom: freedom.describe(freedom.AUTO),
    freedomLevel: freedom.AUTO,
    strategy: 'auto',
    shape: shape,
    surface: 'settings-stream',
    header: header,
    stream: stream,
    compact: compact,
    tall: tall,
    titleSize: compact ? 12 : (tall ? 18 : 14),
    cardRadius: compact ? 16 : (tall ? 22 : 18),
    cardGap: compact ? 6 : (tall ? 10 : 8),
    bodySize: compact ? 8 : (tall ? 11 : 9),
    valueSize: compact ? 18 : (tall ? 28 : 22)
  }
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve }
