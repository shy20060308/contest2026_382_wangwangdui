var freedom = require('../freedom')

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') {
    return {
      freedom: freedom.describe(freedom.FREE),
      shape: shape,
      surface: 'preview-swiper',
      faceIds: ['sport','simple','dashboard','mechanical'],
      header: { left: 34, top: Math.max(18, safe.top), width: 124, height: 18 },
      preview: { left: 28, top: Math.max(42, safe.top + 24), width: 136, height: 112 },
      footer: { left: 36, top: Math.min(scene.height - 26, safe.bottom - 20), width: 120, height: 16 },
      titleSize: 10,
      previewNameSize: 8,
      previewTimeSize: 24,
      previewRadius: 56
    }
  }
  if (shape === 'pill') {
    return {
      freedom: freedom.describe(freedom.FREE),
      shape: shape,
      surface: 'cards-pager',
      faceIds: ['sport','simple','dashboard','alpine'],
      pageSize: 2,
      header: { left: safe.left, top: safe.top, width: safe.width, height: 30 },
      content: { left: safe.left, top: safe.top + 42, width: safe.width, height: Math.max(220, safe.height - 92) },
      pager: { left: safe.left, top: safe.bottom - 30, width: safe.width, height: 24 },
      cardHeight: 126,
      cardGap: 12,
      titleSize: 18,
      nameSize: 14,
      descSize: 8,
      previewWidth: 64
    }
  }
  var gap = 8
  var cardWidth = Math.floor((safe.width - gap) / 2)
  return {
    freedom: freedom.describe(freedom.FREE),
    shape: shape,
    surface: 'preview-grid',
    faceIds: ['sport','simple','dashboard'],
    header: { left: safe.left, top: safe.top, width: safe.width, height: 24 },
    content: { left: safe.left, top: safe.top + 30, width: safe.width, height: Math.max(100, safe.height - 34) },
    cardWidth: cardWidth,
    cardHeight: 76,
    gap: gap,
    titleSize: 14,
    nameSize: 8,
    previewTimeSize: 17
  }
}

module.exports = {
  freedomLevel: freedom.FREE,
  resolve: resolve
}
