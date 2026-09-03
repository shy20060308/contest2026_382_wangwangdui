var freedom = require('../freedom')

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 136
  if (shape === 'pill') return 168
  return 164
}

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  return {
    freedom: freedom.describe(freedom.ASSISTED),
    freedomLevel: freedom.ASSISTED,
    strategy: 'assisted',
    shape: shape,
    surface: shape === 'circle' ? 'summary-calendar-pages' : (shape === 'pill' ? 'pill-month-calendar' : 'calendar-dashboard'),
    content: { left: safe.left, top: safe.top, width: safe.width, height: safe.height },
    interaction: 'explicit-buttons',
    overflow: 'fixed'
  }
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  resolve: resolve
}
