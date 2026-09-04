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

  if (plan.shape === 'circle') {
    // The global circle safe band intentionally exposes almost the full vertical
    // canvas. That is correct for scroll surfaces, but a fixed 136px-wide card
    // cannot start at safe.top=10: the physical chord there is too narrow and
    // the round mask clips both top corners. Place the complete 128px fixed
    // composition in the first chord that can actually contain 136px.
    plan.circleFrame = assisted.region(28, 30, 136, 128)
  }

  return plan
}

module.exports = {
  freedomLevel: freedom.ASSISTED,
  contentWidth: contentWidth,
  requiredHeights: requiredHeights,
  resolve: resolve
}
