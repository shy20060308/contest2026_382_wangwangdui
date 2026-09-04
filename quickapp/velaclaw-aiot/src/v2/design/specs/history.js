var freedom = require('../freedom')

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
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
    surface: shape === 'circle' ? 'compact-chart-stream' : (shape === 'pill' ? 'vertical-comparative-trend' : 'dashboard-stream'),
    stream: { left: safe.left, top: safe.top, width: safe.width, height: safe.height },
    chartHeight: shape === 'pill' ? 10 : (shape === 'rect' ? 64 : 40),
    pillTrendMinWidth: shape === 'pill' ? 14 : 0,
    pillTrendMaxWidth: shape === 'pill' ? 70 : 0
  }
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  resolve: resolve
}
