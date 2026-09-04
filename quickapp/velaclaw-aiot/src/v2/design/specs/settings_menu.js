var freedom = require('../freedom')
var pagedStack = require('../paged_stack')
var adapter = require('../adapter')

var ITEM_IDS = ['sync', 'vibration', 'brightness', 'motion', 'diagnostics']

function contentWidth(profile) { return adapter.contentWidth(profile) }

function fitCapacity(profile, scene, safe, capacity, preferred) {
  var header = adapter.fitBand(profile, scene, safe, {
    top: capacity.header.top,
    height: capacity.header.height,
    preferredWidth: preferred,
    minWidth: Math.min(112, preferred),
    edgePadding: 3,
    fit: 'edges',
    reposition: true
  })

  var footer = adapter.fitBand(profile, scene, safe, {
    top: Math.min(safe.bottom - capacity.footer.height, capacity.footer.top),
    height: capacity.footer.height,
    preferredWidth: Math.min(100, preferred),
    minWidth: Math.min(88, preferred),
    edgePadding: 3,
    fit: 'edges',
    reposition: true
  })

  var listTop = Math.max(capacity.list.top, header.top + header.height + 5)
  var footerGap = Math.max(5, capacity.itemGap)
  var listAvailable = Math.max(capacity.pageSize * 40, footer.top - footerGap - listTop)
  var itemHeight = Math.floor((listAvailable - capacity.itemGap * (capacity.pageSize - 1)) / capacity.pageSize)
  itemHeight = adapter.clamp(itemHeight, 40, capacity.itemHeight)
  var listHeight = itemHeight * capacity.pageSize + capacity.itemGap * (capacity.pageSize - 1)
  var list = adapter.fitBand(profile, scene, safe, {
    top: listTop,
    height: listHeight,
    preferredWidth: preferred,
    minWidth: Math.min(140, preferred),
    edgePadding: 2,
    fit: 'center'
  })

  capacity.header = header
  capacity.list = list
  capacity.footer = footer
  capacity.itemHeight = itemHeight
  capacity.visualScale = adapter.clamp(itemHeight / 48, 1, 1.5)
  return capacity
}

function resolve(profile, scene, safe) {
  var tall = safe.height > 250
  var compact = safe.height < 190
  var preferred = adapter.contentWidth(profile)
  var capacity = pagedStack.resolve(safe, {
    minItems: 2,
    maxItems: 3,
    headerHeight: compact ? 18 : (tall ? 30 : 20),
    footerHeight: compact ? 16 : (tall ? 24 : 16),
    sectionGap: compact ? 5 : (tall ? 10 : 6),
    minItemHeight: compact ? 48 : 52,
    maxItemHeight: tall ? 82 : 64,
    itemGap: compact ? 6 : (tall ? 10 : 6)
  })
  capacity = fitCapacity(profile, scene, safe, capacity, preferred)

  var plan = adapter.createPlan(profile, scene, safe, freedom.AUTO, 'paged-settings-list')
  plan.itemIds = ITEM_IDS.slice()
  plan.capacity = capacity
  return plan
}

module.exports = { freedomLevel: freedom.AUTO, contentWidth: contentWidth, resolve: resolve }
