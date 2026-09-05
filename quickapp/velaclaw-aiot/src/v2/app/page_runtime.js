import deviceProfile from '../system/device_profile'
var scene = require('../design/scene')

function bind(page, callback) {
  if (!page || typeof callback !== 'function') return
  deviceProfile.resolve(page, function (profile) {
    var host = scene.resolve(profile)
    var safe = scene.safe(profile, host)
    var betaPill = !!(profile && profile.isBetaPillViewport)

    page.viewportClass = betaPill ? 'beta-pill-viewport-' + profile.screenWidth : ''
    page.viewportPosition = betaPill ? 'absolute' : 'relative'
    page.viewportLeft = '0px'
    page.viewportTop = '0px'
    page.viewportWidth = betaPill ? host.width + 'px' : '100%'
    page.viewportHeight = betaPill ? host.height + 'px' : '100%'

    page.sceneWidth = host.width
    page.sceneHeight = host.height
    page.sceneShape = host.shape
    page.sceneSafeLeft = safe.left
    page.sceneSafeTop = safe.top
    page.sceneSafeBottom = safe.bottom
    page.sceneSafeHeight = safe.height

    callback(profile, host, safe)
  })
}

export default { bind: bind }
