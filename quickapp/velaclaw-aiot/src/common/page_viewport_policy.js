/**
 * 页面级视口兼容策略。
 *
 * screen_profile 只描述宿主提供的基础视口；这里处理极少量“同一宿主、不同页面”
 * 才需要的兼容补偿，避免把设备判断散落进 UX 页面。
 *
 * 当前唯一例外：vela-watch-5.0 beta 的 Band 10（212×520）。宿主要求普通业务页
 * 根节点整体下移 24 个逻辑像素以避开顶部系统覆盖区；应用列表本身却已经按胶囊曲面
 * 留有 50px 的顶部安全间距。两层安全距叠加后，底部分页条会进入胶囊端帽/手势区域。
 * 因此仅对 applist 恢复完整的 471px 逻辑画布：页面现有 50px 曲面安全距继续负责
 * 顶部避让，设计坐标与 Band 9 Golden Reference 保持一致。
 */

function toPxNumber(value) {
  var number = parseInt(value, 10)
  return isFinite(number) ? number : 0
}

function pagePath(page) {
  if (!page || !page.$page || !page.$page.path) return ''
  return String(page.$page.path)
}

function resolve(profile, page) {
  var result = {
    viewportClass: profile.viewportClass,
    viewportPosition: profile.viewportPosition,
    viewportLeft: profile.viewportLeft,
    viewportTop: profile.viewportTop,
    viewportWidth: profile.viewportWidth,
    viewportHeight: profile.viewportHeight
  }

  var isBand10Beta = profile && profile.isBetaPillViewport && profile.screenWidth === 212
  if (isBand10Beta && pagePath(page) === 'pages/applist') {
    var top = toPxNumber(profile.viewportTop)
    var height = toPxNumber(profile.viewportHeight)
    result.viewportTop = '0px'
    result.viewportHeight = height + top + 'px'
  }

  return result
}

module.exports = {
  resolve: resolve
}
