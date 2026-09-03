var freedom = require('../freedom')

var ALL_IDS = ['workout','history','heart','clock','steps','faces','sync','brightness','settings','vibration','notification','today']

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function base(shape) {
  return { freedom: freedom.describe(freedom.FREE), freedomLevel: freedom.FREE, strategy: 'free', shape: shape, appIds: ALL_IDS.slice() }
}

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  var plan = base(shape)
  if (shape === 'circle') {
    plan.surface = 'honeycomb'
    plan.pageSize = ALL_IDS.length
    plan.frame = { left: 0, top: 0, width: scene.width, height: scene.height }
    return plan
  }
  if (shape === 'pill') {
    plan.surface = 'paged-list'
    plan.pageSize = 4
    plan.header = { left: safe.left, top: safe.top, width: safe.width, height: 28 }
    plan.content = { left: safe.left, top: safe.top + 36, width: safe.width, height: Math.max(120, safe.height - 78) }
    plan.pager = { left: safe.left, top: safe.bottom - 30, width: safe.width, height: 24 }
    plan.itemHeight = 62
    plan.itemGap = 8
    plan.titleSize = 18
    plan.nameSize = 14
    plan.arrowSize = 20
    plan.iconSize = 40
    plan.itemRadius = 20
    return plan
  }
  var gap = 6
  var itemWidth = Math.floor((safe.width - gap) / 2)
  plan.surface = 'designed-grid'
  plan.pageSize = 6
  plan.header = { left: safe.left, top: safe.top, width: safe.width, height: 24 }
  plan.content = { left: safe.left, top: safe.top + 30, width: safe.width, height: Math.max(100, safe.height - 62) }
  plan.pager = { left: safe.left, top: safe.bottom - 24, width: safe.width, height: 20 }
  plan.columns = 2
  plan.gap = gap
  plan.itemWidth = itemWidth
  plan.itemHeight = 54
  plan.titleSize = 14
  plan.nameSize = 9
  plan.iconSize = 30
  plan.itemRadius = 14
  return plan
}

module.exports = { freedomLevel: freedom.FREE, contentWidth: contentWidth, resolve: resolve }
