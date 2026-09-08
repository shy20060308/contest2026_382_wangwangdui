import deviceProfile from './device_profile'
var scene = require('../v2/design/scene')

function bind(page, callback) {
  if (!page) throw new Error('V3 Page Runtime requires a page instance')
  if (typeof callback !== 'function') throw new Error('V3 Page Runtime requires a resolve callback')
  deviceProfile.resolve(page, function (profile) {
    var host = scene.resolve(profile)
    var safe = scene.safe(profile, host)

    page.viewportClass = ''
    page.viewportPosition = 'relative'
    page.viewportLeft = '0px'
    page.viewportTop = '0px'
    page.viewportWidth = '100%'
    page.viewportHeight = '100%'

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
