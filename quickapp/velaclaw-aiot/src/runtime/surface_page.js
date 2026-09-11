import pageRuntime from './page_runtime'
import navigation from './navigation'
import controllerRegistry from '../product/controller_registry'

var surfaceRuntime = require('../product/frontend/runtime/surface_runtime')
var experienceRuntime = require('../product/frontend/runtime/experience_runtime')
var performanceMetrics = require('./performance_metrics')
var pageGeneration = require('./page_generation')
var interactionOwner = require('./interaction_owner')
var navigationContext = require('./navigation_context')

function initialState(surface) {
  var source = surface && surface.initialState ? surface.initialState : {}
  var state = {}
  for (var key in source) state[key] = source[key]
  return state
}

function requireSurface(surface) {
  if (!surface || typeof surface !== 'object' || Array.isArray(surface)) throw new Error('V3 Surface Page requires a page-local Surface JSON object')
  if (!surface.id || !surface.route || surface.renderer !== 'surface-v1') throw new Error('Invalid page-local V3 Surface')
  return surface
}

function renderSignature(page) {
  var profile = page._surfaceProfile || {}
  var scene = page._surfaceScene || {}
  var stateText = ''
  try { stateText = JSON.stringify(page._surfaceState || {}) } catch (error) { stateText = '' }
  return [page._surface && page._surface.id, profile.formFactor, scene.width, scene.height, stateText].join('|')
}

function syncPlanContext(page) {
  if (!page) return
  var owner = page._surfaceInteractionOwner ? page._surfaceInteractionOwner.key() : ''
  var routesEnabled = !page._surfaceState || page._surfaceState.routeNavigationEnabled !== false
  if (page.surfacePlan) {
    page.surfacePlan.pageVisible = !!page._surfaceVisible
    page.surfacePlan.interactionOwner = owner
    if (page.surfacePlan.collection) page.surfacePlan.collection.active = !!page._surfaceVisible
  }
  if (page._surfaceVisible && owner) navigationContext.set(owner, routesEnabled)
}

function rebuild(page) {
  if (!page || page._surfaceDestroyed || !page._surface || !page._surfaceProfile || !page._surfaceScene || !page._surfaceSafe) return false
  var signature = renderSignature(page)
  if (page._surfaceRenderSignature === signature) {
    syncPlanContext(page)
    performanceMetrics.recordSurfaceSkippedEqual()
    return false
  }
  var startedAt = Date.now()
  var plan = surfaceRuntime.resolve(page._surface, page._surfaceProfile, page._surfaceScene, page._surfaceSafe, page._surfaceState || {})
  page.surfacePlan = experienceRuntime.decorate(plan, page._surface, page._surfaceProfile, page._surfaceScene, page._surfaceSafe, page._surfaceState || {})
  syncPlanContext(page)
  page._surfaceRenderSignature = signature
  performanceMetrics.recordSurfaceRebuild(Date.now() - startedAt)
  return true
}

function bind(page, surface) {
  if (!page) throw new Error('V3 Surface Page requires a page instance')
  surface = requireSurface(surface)
  var generation = pageGeneration.begin(page)
  function current() { return pageGeneration.isCurrent(page, generation) }

  page.surfaceReady = false
  page.surfacePlan = null
  page._surface = surface
  page._surfaceState = initialState(surface)
  page._surfaceVisible = false
  page._surfaceRenderSignature = null
  page._surfaceInteractionOwner = interactionOwner.create(surface.id)
  page._surfaceController = controllerRegistry.create(surface.controller, function (state) {
    if (!current()) return
    page._surfaceState = state || {}
    if (page.surfaceReady && !page._surfaceVisible) {
      performanceMetrics.recordSurfaceDeferredHidden()
      return
    }
    rebuild(page)
  }, { interactionOwner: page._surfaceInteractionOwner })

  pageRuntime.bind(page, function (profile, scene, safe) {
    if (!current()) return
    page._surfaceProfile = profile
    page._surfaceScene = scene
    page._surfaceSafe = safe
    rebuild(page)
    if (page._surfaceController && typeof page._surfaceController.configure === 'function') {
      var config = page.surfacePlan && page.surfacePlan.controllerConfig ? page.surfacePlan.controllerConfig : {}
      page._surfaceController.configure(profile, scene, safe, config)
    }
    if (!current()) return
    rebuild(page)
    page.surfaceReady = true
    if (page._surfaceVisible && page._surfaceController) page._surfaceController.start()
  }, current)
}

function show(page) {
  if (!page || page._surfaceDestroyed) return
  page._surfaceVisible = true
  if (page._surfaceInteractionOwner) page._surfaceInteractionOwner.activate()
  if (page.surfaceReady) rebuild(page)
  else syncPlanContext(page)
  if (page.surfaceReady && page._surfaceController) page._surfaceController.start()
}

function hide(page) {
  if (!page || page._surfaceDestroyed) return
  page._surfaceVisible = false
  if (page._surfaceInteractionOwner) {
    navigationContext.clear(page._surfaceInteractionOwner.key())
    page._surfaceInteractionOwner.deactivate()
  }
  syncPlanContext(page)
  if (page._surfaceController) page._surfaceController.stop()
}

function destroy(page) {
  if (!page) return
  pageGeneration.destroy(page)
  page._surfaceVisible = false
  if (page._surfaceInteractionOwner) {
    navigationContext.clear(page._surfaceInteractionOwner.key())
    page._surfaceInteractionOwner.deactivate()
  }
  if (page._surfaceController) page._surfaceController.destroy()
  page._surfaceController = null
  page._surfaceInteractionOwner = null
  page._surface = null
  page._surfaceState = null
  page._surfaceProfile = null
  page._surfaceScene = null
  page._surfaceSafe = null
  page._surfaceRenderSignature = null
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
  if (!page || page._surfaceDestroyed || !page._surfaceVisible || !page._surfaceController || typeof page._surfaceController.action !== 'function') throw new Error('V3 Surface Page has no active action controller for ' + name)
  page._surfaceController.action(name, actionPayload(event))
}

function back(page) {
  var owner = page && page._surfaceInteractionOwner ? page._surfaceInteractionOwner.key() : ''
  navigation.back(owner)
  return true
}

export default { bind: bind, show: show, hide: hide, destroy: destroy, action: action, back: back }
