import deviceProfile from '../system/device_profile'
var scene = require('../design/scene')

function applyHostViewport(page, profile) {
  var hostScene = scene.resolve(profile)
  var betaPill = !!(profile && profile.isBetaPillViewport)
  page.viewportClass = profile && profile.viewportClass ? profile.viewportClass : ''
  page.viewportPosition = betaPill ? 'absolute' : ((profile && profile.viewportPosition) || 'relative')
  page.viewportLeft = betaPill ? '0px' : ((profile && profile.viewportLeft) || '0px')
  page.viewportTop = '0px'
  page.viewportWidth = betaPill ? hostScene.width + 'px' : ((profile && profile.viewportWidth) || '100%')
  page.viewportHeight = betaPill ? hostScene.height + 'px' : '100%'
}

function applyScene(page, profile) {
  var hostScene = scene.resolve(profile)
  var safe = scene.safe(profile)
  page.sceneWidth = hostScene.width
  page.sceneHeight = hostScene.height
  page.sceneShape = hostScene.shape
  page.sceneSafeLeft = safe.left
  page.sceneSafeTop = safe.top
  page.sceneSafeBottom = safe.bottom
  page.sceneSafeHeight = safe.height
  return { scene: hostScene, safe: safe }
}

function bind(page, callback) {
  deviceProfile.resolve(page, function (profile) {
    applyHostViewport(page, profile)
    var result = applyScene(page, profile)
    if (typeof callback === 'function') callback(profile, result.scene, result.safe)
  })
}

export default {
  bind: bind,
  applyHostViewport: applyHostViewport,
  applyScene: applyScene
}
