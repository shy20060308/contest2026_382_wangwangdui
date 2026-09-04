var freedom = require('../freedom')
var assisted = require('../assisted')

function contentWidth(profile) { return assisted.contentWidth(profile) }

function resolve(profile, scene, safe) {
  var plan = assisted.createPlan(profile, safe, {
    circle: 'compact-chart-stream',
    pill: 'vertical-comparative-trend',
    rect: 'dashboard-stream'
  })
  plan.stream = assisted.safeFrame(safe)
  plan.chartHeight = plan.shape === 'pill' ? 10 : (plan.shape === 'rect' ? 64 : 40)
  plan.pillTrendMinWidth = plan.shape === 'pill' ? 14 : 0
  plan.pillTrendMaxWidth = plan.shape === 'pill' ? 70 : 0
  return plan
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  resolve: resolve
}
