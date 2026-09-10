import pageRuntime from './page_runtime'
import navigation from './navigation'
import controllerRegistry from '../product/controller_registry'

var surfaces = require('../product/frontend/generated/surfaces')
var surfaceRuntime = require('../product/frontend/runtime/surface_runtime')

function rebuild(page) {
  if (!page || !page._surface || !page._surfaceProfile || !page._surfaceScene || !page._surfaceSafe) return
  page.surfacePlan = surfaceRuntime.resolve(
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

function back() {
  navigation.back()
  return true
}

export default { bind: bind, show: show, hide: hide, destroy: destroy, back: back }
