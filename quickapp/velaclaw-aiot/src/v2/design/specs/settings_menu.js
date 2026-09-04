var freedom = require('../freedom')
var pagedStack = require('../paged_stack')

var ITEM_IDS = ['sync', 'vibration', 'brightness', 'motion', 'diagnostics']

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function circleCapacity() {
  return {
    pageSize: 2,
    itemHeight: 52,
    itemGap: 7,
    header: { left: 40, top: 22, width: 112, height: 18 },
    list: { left: 22, top: 45, width: 148, height: 111 },
    footer: { left: 46, top: 157, width: 100, height: 16 },
    visualScale: 1.05,
    capacityReduced: true,
    fixedFrame: true
  }
}

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var tall = safe.height > 250
  var capacity = shape === 'circle' ? circleCapacity() : pagedStack.resolve(safe, {
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
    shape: shape,
    surface: 'paged-settings-list',
    itemIds: ITEM_IDS.slice(),
    capacity: capacity
  }
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve }
