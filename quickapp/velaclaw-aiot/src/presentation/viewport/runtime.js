import screenProfile from './profile'

var DEFAULTS = {
  viewportClass: '',
  viewportPosition: 'relative',
  viewportLeft: '0px',
  viewportTop: '0px',
  viewportWidth: '100%',
  viewportHeight: '100%'
}

function apply(page, profile) {
  if (!page || !profile) return
  page.viewportClass = profile.viewportClass
  page.viewportPosition = profile.viewportPosition
  page.viewportLeft = profile.viewportLeft
  page.viewportTop = profile.viewportTop
  page.viewportWidth = profile.viewportWidth
  page.viewportHeight = profile.viewportHeight
}

function bind(page, callback) {
  screenProfile.resolve(page, function (profile) {
    apply(page, profile)
    if (typeof callback === 'function') callback(profile)
  })
}

module.exports = {
  DEFAULTS: DEFAULTS,
  apply: apply,
  bind: bind
}
