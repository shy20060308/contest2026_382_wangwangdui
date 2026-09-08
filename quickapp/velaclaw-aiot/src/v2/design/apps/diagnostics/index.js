var adapter = require('../../adapter')
var detail = require('../_shared/detail')
var layout = require('./layout')

var base = detail.create(layout)

function resolve(profile, scene, safe) {
  var plan = base.resolve(profile, scene, safe)
  var controls = plan.controls
  plan.content = adapter.region(plan.stream.left, plan.stream.top, plan.stream.width, plan.stream.height - controls.pagerHeight - controls.contentGap)
  plan.pager = adapter.region(plan.stream.left, plan.content.top + plan.content.height + controls.contentGap, plan.stream.width, controls.pagerHeight)
  plan.capabilityHeight = controls.capabilityCardHeight
  plan.capabilityGap = plan.cardGap
  plan.capabilityPageSize = controls.capabilityPageSize
  return plan
}

module.exports = {
  differenceLevel: base.differenceLevel,
  contentWidth: base.contentWidth,
  resolve: resolve,
  layout: layout
}
