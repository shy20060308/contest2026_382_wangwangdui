var freedom = require('../freedom')

function region(left, top, width, height) { return { left: left, top: top, width: width, height: height } }

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function finalize(plan) {
  plan.metricItemWidth = Math.floor((plan.metrics.width - plan.metricGap * (plan.metricColumns - 1)) / plan.metricColumns)
  plan.actionWidth = Math.floor((plan.actions.width - plan.actionGap) / 2)
  return plan
}

function base(shape) {
  return {
    freedom: freedom.describe(freedom.ASSISTED),
    freedomLevel: freedom.ASSISTED,
    strategy: 'assisted',
    shape: shape,
    surface: 'rect-dashboard'
  }
}

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var plan = base(shape)
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
  plan.durationLabelSize = 8
  plan.gpsSize = 7
  plan.metricValueSize = 14
  plan.metricLabelSize = 6
  plan.actionSize = 11
  plan.radius = 14

  if (shape === 'circle') {
    plan.surface = 'circle-focus'
    plan.header = region(safe.left, safe.top, safe.width, 18)
    plan.hero = region(safe.left + 9, safe.top + 20, safe.width - 18, 42)
    plan.metrics = region(safe.left, safe.top + 65, safe.width, 58)
    plan.actions = region(safe.left + 10, safe.bottom - 25, safe.width - 20, 22)
    plan.metricColumns = 2
    plan.metricGap = 4
    plan.metricHeight = 27
    plan.actionGap = 8
    plan.titleSize = 10
    plan.statusSize = 6
    plan.durationSize = 27
    plan.durationLabelSize = 6
    plan.gpsSize = 6
    plan.metricValueSize = 11
    plan.metricLabelSize = 5
    plan.actionSize = 8
    plan.radius = 14
    return finalize(plan)
  }

  if (shape === 'pill') {
    var contentTop = safe.top
    var actionsHeight = 48
    plan.surface = 'pill-session'
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
