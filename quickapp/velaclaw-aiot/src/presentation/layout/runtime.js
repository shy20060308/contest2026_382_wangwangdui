import screenProfile from '../viewport/profile'
var adapter = require('./adapter')

function regionStyle(region) {
  if (!region) return ''
  return 'position: absolute; left: ' + region.left + 'px; top: ' + region.top + 'px; width: ' + region.width + 'px; height: ' + region.height + 'px;'
}

function apply(page, plan) {
  if (!page || !plan) return
  page.layoutPlan = plan
  page.layoutScale = plan.scale
  page.layoutNeedsOverride = plan.needsOverride
  page.layoutComposition = plan.composition
  page.layoutRegions = adapter.regionMap(plan)
}

function bind(page, spec, callback) {
  screenProfile.resolve(page, function (profile) {
    var plan = adapter.resolve(profile, spec)
    apply(page, plan)
    if (typeof callback === 'function') callback(plan, profile)
  })
}

module.exports = {
  bind: bind,
  apply: apply,
  regionStyle: regionStyle
}
