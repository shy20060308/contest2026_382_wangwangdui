var freedom = require('../freedom')

var ALL_IDS = ['workout','history','heart','clock','steps','faces','sync','brightness','settings','vibration','notification','today']

function resolve(profile, scene, safe) {
  var shape = profile && profile.formFactor ? profile.formFactor : 'rect'
  if (shape === 'circle') {
    return {
      freedom: freedom.describe(freedom.FREE),
      shape: shape,
      surface: 'honeycomb',
      appIds: ALL_IDS.slice(),
      pageSize: ALL_IDS.length,
      frame: { left: 0, top: 0, width: scene.width, height: scene.height }
    }
  }
  if (shape === 'pill') {
    return {
      freedom: freedom.describe(freedom.FREE),
      shape: shape,
      surface: 'paged-list',
      appIds: ALL_IDS.slice(),
      pageSize: 4,
      header: { left: safe.left, top: safe.top, width: safe.width, height: 28 },
      content: { left: safe.left, top: safe.top + 36, width: safe.width, height: Math.max(120, safe.height - 78) },
      pager: { left: safe.left, top: safe.bottom - 30, width: safe.width, height: 24 },
      itemHeight: 72,
      itemGap: 8,
      titleSize: 18,
      nameSize: 14,
      arrowSize: 20
    }
  }
  return {
    freedom: freedom.describe(freedom.FREE),
    shape: shape,
    surface: 'designed-grid',
    appIds: ALL_IDS.slice(),
    pageSize: 6,
    header: { left: safe.left, top: safe.top, width: safe.width, height: 24 },
    content: { left: safe.left, top: safe.top + 30, width: safe.width, height: Math.max(100, safe.height - 62) },
    pager: { left: safe.left, top: safe.bottom - 24, width: safe.width, height: 20 },
    columns: 2,
    gap: 6,
    itemHeight: 54,
    titleSize: 14,
    nameSize: 9
  }
}

module.exports = {
  freedomLevel: freedom.FREE,
  resolve: resolve
}
