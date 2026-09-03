var freedom = require('../freedom')
var pagedStack = require('../paged_stack')

var ITEM_IDS = ['sync', 'vibration', 'brightness', 'motion', 'diagnostics']

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function resolve(profile, scene, safe) {
  var tall = safe.height > 250
  var capacity = pagedStack.resolve(safe, {
    minItems: 2,
    maxItems: 3,
    headerHeight: tall ? 30 : 20,
    footerHeight: tall ? 24 : 16,
    sectionGap: tall ? 10 : 6,
    minItemHeight: 48,
    maxItemHeight: 82,
    itemGap: tall ? 10 : 6
  })
  return {
    freedom: freedom.describe(freedom.AUTO),
    freedomLevel: freedom.AUTO,
    strategy: 'auto',
    shape: profile && profile.formFactor ? profile.formFactor : 'rect',
    surface: 'paged-settings-list',
    itemIds: ITEM_IDS.slice(),
    capacity: capacity
  }
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve }
