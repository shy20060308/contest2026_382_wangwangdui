import pageRuntime from './page_runtime'
import navigation from './navigation'
import controllerRegistry from '../product/controller_registry'

var surfaces = require('../product/frontend/generated/surfaces')
var surfaceRuntime = require('../product/frontend/runtime/surface_runtime')
var experienceRuntime = require('../product/frontend/runtime/experience_runtime')

function rebuild(page) {
  if (!page || !page._surface || !page._surfaceProfile || !page._surfaceScene || !page._surfaceSafe) return
  var plan = surfaceRuntime.resolve(
    page._surface,
    page._surfaceProfile,
    page._surfaceScene,
    page._surfaceSafe,
    page._surfaceState || {}
  )
  page.surfacePlan = experienceRuntime.decorate(
    plan,
    page._surface,
    page._surfaceProfile,
    page._surfaceScene,
    page._surfaceSafe,
    page._surfaceState || {}
  )
}

function bind(page, surfaceId) {
  if (!page) throw new Error('V3 Surface Page requires a page instance')
  var surface = surfaces.byId[surfaceId]
  if (!surface) throw new Error('Unknown V3 Surface: ' + surfaceId)

  page.surfaceReady = false
  page.surfacePlan = null
  page._surface = surface
  page._surfaceState = {}
  page._surfaceVisible = false
  page._surfaceController = controllerRegistry.create(surface.controller, function (state) {
    page._surfaceState = state || {}
    rebuild(page)
  })

  pageRuntime.bind(page, function (profile, scene, safe) {
    page._surfaceProfile = profile
    page._surfaceScene = scene
    page._surfaceSafe = safe
    if (page._surfaceController && typeof page._surfaceController.configure === 'function') {
      page._surfaceController.configure(profile, scene, safe)
    }
    rebuild(page)
    page.surfaceReady = true
    if (page._surfaceVisible && page._surfaceController) page._surfaceController.start()
  })
}

function show(page) {
  if (!page) return
  page._surfaceVisible = true
  if (page.surfaceReady && page._surfaceController) page._surfaceController.start()
}

function hide(page) {
  if (!page) return
  page._surfaceVisible = false
  if (page._surfaceController) page._surfaceController.stop()
}

function destroy(page) {
  if (!page) return
  page._surfaceVisible = false
  if (page._surfaceController) page._surfaceController.destroy()
  page._surfaceController = null
  page._surface = null
  page._surfaceState = null
  page._surfaceProfile = null
  page._surfaceScene = null
  page._surfaceSafe = null
  page.surfacePlan = null
  page.surfaceReady = false
}

function actionName(event) {
  if (typeof event === 'string') return event
  if (!event) return ''
  if (typeof event.action === 'string') return event.action
  if (event.detail && typeof event.detail.action === 'string') return event.detail.action
  if (event.detail && typeof event.detail === 'string') return event.detail
  return ''
}

function actionPayload(event) {
  if (!event || typeof event === 'string') return {}
  if (event.detail && typeof event.detail === 'object') return event.detail
  return event
}

function action(page, event) {
  var name = actionName(event)
  if (!name) return
  if (!page || !page._surfaceController || typeof page._surfaceController.action !== 'function') {
    throw new Error('V3 Surface Page has no action controller for ' + name)
  }
  page._surfaceController.action(name, actionPayload(event))
}

function back() {
  navigation.back()
  return true
}

export default { bind: bind, show: show, hide: hide, destroy: destroy, action: action, back: back }
