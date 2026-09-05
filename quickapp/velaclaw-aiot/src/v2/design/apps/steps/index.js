var freedom = require('../../freedom')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, config.surface || 'goal-progress-stream')
  plan.title = adapter.placeBand(profile, scene, safe, config.title)
  plan.history = adapter.placeBand(profile, scene, safe, config.history)
  plan.stream = adapter.placeBand(profile, scene, safe, {
    top: config.stream.top,
    width: config.stream.width,
    height: safe.bottom - (safe.top + config.stream.top)
  })
  plan.titleSize = config.titleSize
  plan.historyRadius = Math.round(config.history.height / 2)
  plan.historyTitleSize = config.historyTitleSize
  plan.historySubSize = config.historySubSize
  plan.metricHeight = config.metricHeight
  plan.metricGap = config.metricGap
  plan.metricRadius = config.metricRadius
  plan.metricPadding = config.metricPadding
  plan.labelSize = config.labelSize
  plan.valueSize = config.valueSize
  plan.unitSize = config.unitSize
  plan.progressTextSize = config.progressTextSize
  plan.progressTrackWidth = plan.stream.width - config.metricPadding * 2
  plan.progressTrackHeight = config.progressTrackHeight
  plan.progressTrackRadius = Math.ceil(config.progressTrackHeight / 2)
  plan.footerSize = config.footerSize
  plan.progressGap = config.progressGap
  return plan
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve, layout: layout }
