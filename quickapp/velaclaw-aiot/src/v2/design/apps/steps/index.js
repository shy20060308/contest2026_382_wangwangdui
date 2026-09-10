var difference = require('../../difference')
var adapter = require('../../adapter')
var layout = require('./layout')

function contentWidth(profile) { return adapter.contentWidth(profile, layout) }

function resolve(profile, scene, safe) {
  var config = adapter.select(layout, profile)
  var plan = adapter.createPlan(profile, scene, safe, difference.L1, config.surface)
  plan.title = adapter.placeBand(profile, scene, safe, config.title)
  plan.history = adapter.placeBand(profile, scene, safe, config.history)
  var streamTop = safe.top + config.stream.top
  plan.stream = adapter.placeBand(profile, scene, safe, {
    bounds: 'scene',
    absoluteTop: true,
    top: streamTop,
    width: config.stream.width,
    height: scene.height - streamTop
  })
  plan.titleSize = config.titleSize
  plan.historyRadius = config.historyRadius
  plan.historyPaddingX = config.historyPaddingX
  plan.historyTitleSize = config.historyTitleSize
  plan.historySubSize = config.historySubSize
  plan.metricHeight = config.metricHeight
  plan.metricGap = config.metricGap
  plan.metricRadius = config.metricRadius
  plan.metricPadding = config.metricPadding
  plan.metricHeadHeight = config.metricHeadHeight
  plan.labelSize = config.labelSize
  plan.metricValueRowHeight = config.metricValueRowHeight
  plan.valueSize = config.valueSize
  plan.unitSize = config.unitSize
  plan.unitGap = config.unitGap
  plan.unitBottom = config.unitBottom
  plan.progressTextSize = config.progressTextSize
  plan.progressTrackWidth = plan.stream.width - config.metricPadding * 2
  plan.progressTrackHeight = config.progressTrackHeight
  plan.progressTrackRadius = config.progressTrackRadius
  plan.footerSize = config.footerSize
  plan.metricFootHeight = config.metricFootHeight
  plan.metricFootTop = config.metricFootTop
  plan.progressGap = config.progressGap
  return plan
}

module.exports = { differenceLevel: difference.L1, contentWidth: contentWidth, resolve: resolve, layout: layout }
