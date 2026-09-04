var freedom = require('../freedom')
var assisted = require('../assisted')

function contentWidth(profile) { return assisted.contentWidth(profile) }

function resolve(profile, scene, safe) {
  var plan = assisted.createPlan(profile, safe, {
    circle: 'compact-vitals-stream',
    pill: 'vertical-vitals-stream',
    rect: 'vitals-dashboard'
  })
  plan.chartHeight = plan.shape === 'pill' ? 42 : (plan.shape === 'rect' ? 30 : 24)
  return plan
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  resolve: resolve
}
