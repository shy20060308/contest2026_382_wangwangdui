var freedom = require('../freedom')

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function resolve(profile, scene, safe) {
  var tall = safe.height > 250
  var compact = safe.height < 170
  var headerHeight = compact ? 20 : (tall ? 30 : 24)
  var summaryHeight = compact ? 38 : (tall ? 58 : 46)
  var gap = compact ? 5 : 8
  var headerTop = safe.top
  var summaryTop = headerTop + headerHeight + gap
  var streamTop = summaryTop + summaryHeight + gap
  var streamHeight = Math.max(40, safe.bottom - streamTop)
  var itemHeight = compact ? 66 : (tall ? 94 : 78)
  return {
    freedom: freedom.describe(freedom.AUTO),
    freedomLevel: freedom.AUTO,
    strategy: 'auto',
    shape: profile && profile.formFactor ? profile.formFactor : 'rect',
    surface: 'summary-record-stream',
    header: { left: safe.left, top: headerTop, width: safe.width, height: headerHeight },
    summary: { left: safe.left, top: summaryTop, width: safe.width, height: summaryHeight },
    stream: { left: safe.left, top: streamTop, width: safe.width, height: streamHeight, itemHeight: itemHeight, gap: tall ? 10 : 7 },
    titleSize: compact ? 12 : (tall ? 18 : 14),
    backSize: compact ? 7 : (tall ? 10 : 8),
    summaryValueSize: compact ? 13 : (tall ? 20 : 16),
    summaryLabelSize: compact ? 6 : (tall ? 9 : 7),
    recordTitleSize: compact ? 10 : (tall ? 14 : 12),
    recordMetaSize: compact ? 6 : (tall ? 9 : 7),
    radius: compact ? 14 : (tall ? 22 : 18),
    padding: compact ? 7 : (tall ? 12 : 9)
  }
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve }
