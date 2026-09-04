var freedom = require('../freedom')
var assisted = require('../assisted')

function region(left, top, width, height) { return assisted.region(left, top, width, height) }
function contentWidth(profile) { return assisted.contentWidth(profile) }

function finalize(plan) {
  plan.metricItemWidth = Math.floor((plan.metrics.width - plan.metricGap * (plan.metricColumns - 1)) / plan.metricColumns)
  plan.actionWidth = Math.floor((plan.actions.width - plan.actionGap) / 2)
  return plan
}

function resolve(profile, scene, safe) {
  var plan = assisted.createPlan(profile, safe, {
    circle: 'circle-focus',
    pill: 'pill-session',
    rect: 'rect-dashboard'
  })
  plan.header = region(safe.left, safe.top, safe.width, 24)
  plan.hero = region(safe.left, safe.top + 30, safe.width, 64)
  plan.metrics = region(safe.left, safe.top + 100, safe.width, 66)
  plan.actions = region(safe.left, Math.max(safe.top + 172, safe.bottom - 42), safe.width, 38)
  plan.metricColumns = 4
  plan.metricGap = 4
  plan.metricHeight = 60
  plan.actionGap = 8
  plan.titleSize = 14
  plan.statusSize = 8
  plan.durationSize = 31
  plan.durationLineHeight = 38
  plan.durationLabelSize = 8
  plan.gpsSize = 7
  plan.metricValueSize = 14
  plan.metricLabelSize = 6
  plan.actionSize = 11
  plan.radius = 14

  if (plan.shape === 'circle') {
    // Circle Workout is a fixed composition. A 148px-wide header placed at
    // sceneSafeTop crosses the upper round mask, so each band uses the widest
    // chord that actually fits at its y position instead of inheriting one
    // rectangular safe width for the whole page.
    plan.header = region(32, 24, 128, 18)
    plan.hero = region(24, 45, 144, 48)
    plan.metrics = region(30, 97, 132, 54)
    plan.actions = region(42, 153, 108, 21)
    plan.metricColumns = 2
    plan.metricGap = 4
    plan.metricHeight = 25
    plan.actionGap = 6
    plan.titleSize = 10
    plan.statusSize = 6
    plan.durationSize = 27
    plan.durationLineHeight = 31
    plan.durationLabelSize = 6
    plan.gpsSize = 5
    plan.metricValueSize = 11
    plan.metricLabelSize = 5
    plan.actionSize = 8
    plan.radius = 13
    return finalize(plan)
  }

  if (plan.shape === 'pill') {
    var contentTop = safe.top
    var actionsHeight = 48
    plan.header = region(safe.left, contentTop, safe.width, 32)
    plan.hero = region(safe.left, contentTop + 42, safe.width, 108)
    plan.metrics = region(safe.left, contentTop + 164, safe.width, 166)
    plan.actions = region(safe.left, Math.min(safe.bottom - actionsHeight, contentTop + 346), safe.width, actionsHeight)
    plan.metricColumns = 2
    plan.metricGap = 8
    plan.metricHeight = 78
    plan.actionGap = 10
    plan.titleSize = 18
    plan.statusSize = 10
    plan.durationSize = 50
    plan.durationLineHeight = 60
    plan.durationLabelSize = 10
    plan.gpsSize = 9
    plan.metricValueSize = 20
    plan.metricLabelSize = 8
    plan.actionSize = 15
    plan.radius = 20
  }

  return finalize(plan)
}

module.exports = { freedomLevel: freedom.ASSISTED, contentWidth: contentWidth, resolve: resolve }
