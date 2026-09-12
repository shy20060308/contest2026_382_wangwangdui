import deviceProfile from './device_profile'
var scene = require('../product/design/scene')

function bind(page, callback, isCurrent, onError) {
  if (!page) throw new Error('V3 Page Runtime requires a page instance')
  if (typeof callback !== 'function') throw new Error('V3 Page Runtime requires a resolve callback')
  function fail(error) {
    if (typeof isCurrent === 'function' && !isCurrent()) return
    if (typeof onError === 'function') onError(error)
  }
  deviceProfile.resolve(page, function (profile) {
    if (typeof isCurrent === 'function' && !isCurrent()) return
    try {
      var host = scene.resolve(profile)
      var safe = scene.safe(profile, host)
      if (typeof isCurrent === 'function' && !isCurrent()) return

      page.viewportClass = ''
      page.viewportPosition = 'absolute'
      page.viewportLeft = '0px'
      page.viewportTop = '0px'
      page.viewportWidth = host.width + 'px'
      page.viewportHeight = host.height + 'px'
      page.sceneWidth = host.width
      page.sceneHeight = host.height

      callback(profile, host, safe)
    } catch (error) {
      fail(error)
    }
  }, fail)
}

export default { bind: bind }
