var freedom = require('../freedom')

function resolve(profile, scene, safe) {
  var compact = safe.height < 170
  var tall = safe.height > 250
  var headerHeight = compact ? 20 : (tall ? 32 : 24)
  var gap = compact ? 5 : 8
  var streamTop = safe.top + headerHeight + gap
  return {
    freedom: freedom.describe(freedom.AUTO),
    header: { left: safe.left, top: safe.top, width: safe.width, height: headerHeight },
    stream: { left: safe.left, top: streamTop, width: safe.width, height: Math.max(40, safe.bottom - streamTop) },
    compact: compact,
    tall: tall,
    titleSize: compact ? 12 : (tall ? 18 : 14),
    cardRadius: compact ? 16 : (tall ? 22 : 18),
    cardGap: compact ? 6 : (tall ? 10 : 8),
    bodySize: compact ? 8 : (tall ? 11 : 9),
    valueSize: compact ? 18 : (tall ? 28 : 22)
  }
}

module.exports = { freedomLevel: freedom.AUTO, resolve: resolve }
