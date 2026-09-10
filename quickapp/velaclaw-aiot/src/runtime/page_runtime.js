import deviceProfile from './device_profile'
var scene = require('../v2/design/scene')

function applyViewport(page, profile, host) {
  var betaPill = !!(profile && profile.isBetaPillViewport)
  page.viewportClass = betaPill ? 'beta-pill-viewport-' + profile.screenWidth : ''
  page.viewportPosition = betaPill ? 'absolute' : 'relative'
  page.viewportLeft = '0px'
  page.viewportTop = '0px'
  page.viewportWidth = betaPill ? host.width + 'px' : '100%'
  page.viewportHeight = betaPill ? host.height + 'px' : '100%'
}

function bind(page, callback) {
  if (!page) throw new Error('V3 Page Runtime requires a page instance')
  if (typeof callback !== 'function') throw new Error('V3 Page Runtime requires a resolve callback')
  deviceProfile.resolve(page, function (profile) {
    var host = scene.resolve(profile)
    var safe = scene.safe(profile, host)

    applyViewport(page, profile, host)
    page.sceneWidth = host.width
    page.sceneHeight = host.height

    callback(profile, host, safe)
  })
}

export default { bind: bind, applyViewport: applyViewport }
