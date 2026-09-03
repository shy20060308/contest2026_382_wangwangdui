var freedom = require('../freedom')

function contentWidth(profile) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') return 148
  if (shape === 'pill') return 168
  return 164
}

function base(shape, surface, faceIds) {
  return {
    freedom: freedom.describe(freedom.FREE),
    freedomLevel: freedom.FREE,
    strategy: 'free',
    shape: shape,
    surface: surface,
    faceIds: faceIds
  }
}

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') {
    var circle = base(shape, 'preview-swiper', ['sport','simple','dashboard','mechanical'])
    circle.header = { left: 34, top: Math.max(18, safe.top), width: 124, height: 18 }
    circle.preview = { left: 28, top: Math.max(42, safe.top + 24), width: 136, height: 112 }
    circle.footer = { left: 36, top: Math.min(scene.height - 26, safe.bottom - 20), width: 120, height: 16 }
    circle.titleSize = 10
    circle.previewNameSize = 8
    circle.previewTimeSize = 24
    circle.previewRadius = 56
    return circle
  }
  if (shape === 'pill') {
    var pill = base(shape, 'cards-pager', ['sport','simple','dashboard','alpine'])
    pill.pageSize = 2
    pill.header = { left: safe.left, top: safe.top, width: safe.width, height: 30 }
    pill.content = { left: safe.left, top: safe.top + 42, width: safe.width, height: Math.max(220, safe.height - 92) }
    pill.pager = { left: safe.left, top: safe.bottom - 30, width: safe.width, height: 24 }
    pill.cardHeight = 126
    pill.cardGap = 12
    pill.titleSize = 18
    pill.nameSize = 14
    pill.descSize = 8
    pill.previewWidth = 64
    return pill
  }
  var gap = 8
  var cardWidth = Math.floor((safe.width - gap) / 2)
  var rect = base(shape, 'preview-grid', ['sport','simple','dashboard'])
  rect.header = { left: safe.left, top: safe.top, width: safe.width, height: 24 }
  rect.content = { left: safe.left, top: safe.top + 30, width: safe.width, height: Math.max(100, safe.height - 34) }
  rect.cardWidth = cardWidth
  rect.cardHeight = 76
  rect.gap = gap
  rect.titleSize = 14
  rect.nameSize = 8
  rect.previewTimeSize = 17
  return rect
}

module.exports = {
  freedomLevel: freedom.FREE,
  contentWidth: contentWidth,
  resolve: resolve
}
