var freedom = require('../freedom')
var assisted = require('../assisted')

function contentWidth(profile) { return assisted.contentWidth(profile, { circle: 136 }) }

function requiredHeights(shape) {
  if (shape === 'circle') return { summary: 128, calendar: 128 }
  if (shape === 'pill') return { summary: 327, calendar: 350 }
  return { dashboard: 211 }
}

function resolve(profile, scene, safe) {
  var plan = assisted.createPlan(profile, safe, {
    circle: 'summary-calendar-pages',
    pill: 'pill-month-calendar',
    rect: 'calendar-dashboard'
  })
  var heights = requiredHeights(plan.shape)
  var maxRequired = 0
  for (var key in heights) if (heights[key] > maxRequired) maxRequired = heights[key]
  plan.interaction = 'explicit-buttons'
  plan.overflow = 'fixed'
  plan.requiredHeights = heights
  plan.needsOverride = assisted.needsOverride(maxRequired, safe)
  return plan
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  requiredHeights: requiredHeights,
  resolve: resolve
}
