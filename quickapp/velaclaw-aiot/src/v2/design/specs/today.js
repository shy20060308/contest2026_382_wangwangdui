var freedom = require('../freedom')

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 136
  if (shape === 'pill') return 168
  return 164
}

function requiredHeights(shape) {
  if (shape === 'circle') return { summary: 128, calendar: 128 }
  if (shape === 'pill') return { summary: 327, calendar: 350 }
  return { dashboard: 211 }
}

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var heights = requiredHeights(shape)
  var maxRequired = 0
  for (var key in heights) if (heights[key] > maxRequired) maxRequired = heights[key]
  return {
    freedom: freedom.describe(freedom.ASSISTED),
    freedomLevel: freedom.ASSISTED,
    strategy: 'assisted',
    shape: shape,
    surface: shape === 'circle' ? 'summary-calendar-pages' : (shape === 'pill' ? 'pill-month-calendar' : 'calendar-dashboard'),
    content: { left: safe.left, top: safe.top, width: safe.width, height: safe.height },
    interaction: 'explicit-buttons',
    overflow: 'fixed',
    requiredHeights: heights,
    needsOverride: maxRequired > safe.height
  }
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  requiredHeights: requiredHeights,
  resolve: resolve
}
