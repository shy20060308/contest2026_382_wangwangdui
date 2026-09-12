import pageRuntime from './page_runtime'
import navigation from './navigation'

var surfaceRuntime = require('../product/frontend/runtime/surface_runtime')
var experienceRuntime = require('../product/frontend/runtime/experience_runtime')
var interactionPolicy = require('../product/interaction_policy')
var performanceMetrics = require('./performance_metrics')
var pageGeneration = require('./page_generation')
var interactionOwner = require('./interaction_owner')
var navigationContext = require('./navigation_context')
var routeTiming = require('./route_timing')

function noop() {}
function emptyController() { return { start: noop, stop: noop, destroy: noop, action: noop } }
function errorText(error) {
  var value = error && error.message ? error.message : String(error || 'unknown')
  return value.length > 120 ? value.slice(0, 120) : value
}
function boot(page, status, detail) {
  if (!page) return
  page.surfaceBootStatus = status || ''
  page.surfaceBootDetail = detail || ''
}
function bootFailure(page, stage, error) {
  if (!page || page._surfaceDestroyed) return
  page.surfaceReady = false
  boot(page, 'ERR:' + stage, errorText(error))
  console.log('[V3_BOOT] ' + stage + ': ' + errorText(error))
}
function controllerFailure(page, stage, error) {
  if (!page || page._surfaceDestroyed) return
  page._surfaceControllerError = { stage: stage, detail: errorText(error) }
  boot(page, 'ERR:' + stage, errorText(error))
  console.log('[V3_CONTROLLER] ' + stage + ': ' + errorText(error))
}
function controllerCall(page, stage, method, args) {
  var controller = page && page._surfaceController
  if (!controller || typeof controller[method] !== 'function') return true
  try {
    controller[method].apply(controller, args || [])
    return true
  } catch (error) {
    controllerFailure(page, stage, error)
    return false
  }
}

function initialState(surface) {
  var source = surface && surface.initialState ? surface.initialState : {}
  var state = {}
  for (var key in source) state[key] = source[key]
  return state
}

function copyObject(source) {
  var result = {}
  for (var key in (source || {})) result[key] = source[key]
  return result
}

function requireSurface(surface) {
  if (!surface || typeof surface !== 'object' || Array.isArray(surface)) throw new Error('V3 Surface Page requires a page-local Surface JSON object')
  if (!surface.id || !surface.route || surface.renderer !== 'surface-v1') throw new Error('Invalid page-local V3 Surface')
  return surface
}

function createController(surface, binding, onChange, context) {
  if (!surface.controller) {
    if (binding) throw new Error('Controller-free Surface must not import a page controller binding: ' + surface.id)
    return emptyController()
  }
  if (!binding || typeof binding.create !== 'function') throw new Error('Surface requires a page-local controller binding: ' + surface.controller)
  if (binding.id !== surface.controller) throw new Error('Surface/controller binding mismatch: ' + surface.controller + ' != ' + binding.id)
  return binding.create(onChange, context)
}

function renderSignature(page) {
  var startedAt = Date.now()
  var profile = page._surfaceProfile || {}
  var scene = page._surfaceScene || {}
  var stateText = ''
  try { stateText = JSON.stringify(page._surfaceState || {}) } catch (error) { stateText = '' }
  return {
    value: [page._surface && page._surface.id, profile.formFactor, scene.width, scene.height, stateText].join('|'),
    durationMs: Date.now() - startedAt
  }
}

function syncPlanContext(page) {
  if (!page) return
  var owner = page._surfaceInteractionOwner ? page._surfaceInteractionOwner.key() : ''
  var controllerId = page._surface ? page._surface.controller : null
  var routesEnabled = interactionPolicy.routeNavigationEnabled(controllerId, page._surfaceState || {})
  if (page.surfacePlan) {
    var visible = !!page._surfaceVisible
    if (page.surfacePlan.pageVisible !== visible) {
      var nextPlan = copyObject(page.surfacePlan)
      nextPlan.pageVisible = visible
      nextPlan.interactionOwner = owner
      if (page.surfacePlan.collection) {
        nextPlan.collection = copyObject(page.surfacePlan.collection)
        nextPlan.collection.active = visible
      }
      page.surfacePlan = nextPlan
    } else {
      page.surfacePlan.interactionOwner = owner
      if (page.surfacePlan.collection && page.surfacePlan.collection.active !== visible) {
        var nextCollection = copyObject(page.surfacePlan.collection)
        nextCollection.active = visible
        page.surfacePlan.collection = nextCollection
      }
    }
  }
  if (page._surfaceVisible && owner) navigationContext.set(owner, routesEnabled)
}

function markRouteSurfaceReady(page) {
  if (!page || !page.surfaceReady || !page._surfaceVisible || !page._surface || !page._surface.route) return false
  return routeTiming.complete(page._surface.route)
}

function rebuild(page) {
  if (!page || page._surfaceDestroyed || !page._surface || !page._surfaceProfile || !page._surfaceScene || !page._surfaceSafe) return false
  var signatureResult = renderSignature(page)
  performanceMetrics.recordSurfaceSerialize(signatureResult.durationMs)
  if (page._surfaceRenderSignature === signatureResult.value) {
    syncPlanContext(page)
    performanceMetrics.recordSurfaceSkippedEqual()
    return false
  }

  var startedAt = Date.now()
  var resolveStartedAt = Date.now()
  var plan = surfaceRuntime.resolve(page._surface, page._surfaceProfile, page._surfaceScene, page._surfaceSafe, page._surfaceState || {})
  var resolveMs = Date.now() - resolveStartedAt

  var decorateStartedAt = Date.now()
  page.surfacePlan = experienceRuntime.decorate(plan, page._surface, page._surfaceProfile, page._surfaceScene, page._surfaceSafe, page._surfaceState || {})
  var decorateMs = Date.now() - decorateStartedAt

  var contextStartedAt = Date.now()
  syncPlanContext(page)
  var contextMs = Date.now() - contextStartedAt

  page._surfaceRenderSignature = signatureResult.value
  performanceMetrics.recordSurfaceRebuild(Date.now() - startedAt, {
    serializeMs: signatureResult.durationMs,
    resolveMs: resolveMs,
    decorateMs: decorateMs,
    contextMs: contextMs
  })
  return true
}

function bind(page, surface, controllerBinding) {
  if (!page) throw new Error('V3 Surface Page requires a page instance')
  surface = requireSurface(surface)
  var generation = pageGeneration.begin(page)
  function current() { return pageGeneration.isCurrent(page, generation) }

  page.surfaceReady = false
  page.surfacePlan = null
  boot(page, 'BOOT:bind', '')
  page._surface = surface
  page._surfaceState = initialState(surface)
  page._surfaceVisible = false
  page._surfaceRenderSignature = null
  page._surfaceController = null
  page._surfaceControllerError = null
  page._surfaceInteractionOwner = interactionOwner.create(surface.id)

  boot(page, 'BOOT:device-profile', '')
  try {
    pageRuntime.bind(page, function (profile, scene, safe) {
      if (!current()) return
      page._surfaceProfile = profile
      page._surfaceScene = scene
      page._surfaceSafe = safe

      try {
        boot(page, 'BOOT:surface-resolve', profile && profile.formFactor ? profile.formFactor : '')
        rebuild(page)
        page.surfaceReady = true
      } catch (error) {
        bootFailure(page, 'surface-init', error)
        return
      }

      boot(page, 'BOOT:controller-create', '')
      try {
        page._surfaceController = createController(surface, controllerBinding, function (state) {
          if (!current()) return
          page._surfaceState = state || {}
          if (page.surfaceReady && !page._surfaceVisible) {
            performanceMetrics.recordSurfaceDeferredHidden()
            return
          }
          try { rebuild(page) } catch (error) { bootFailure(page, 'controller-update', error) }
        }, { interactionOwner: page._surfaceInteractionOwner })
      } catch (error) {
        controllerFailure(page, 'controller-create', error)
        markRouteSurfaceReady(page)
        return
      }

      boot(page, 'BOOT:controller-configure', '')
      if (page._surfaceController && typeof page._surfaceController.configure === 'function') {
        var config = page.surfacePlan && page.surfacePlan.controllerConfig ? page.surfacePlan.controllerConfig : {}
        if (!controllerCall(page, 'controller-configure', 'configure', [profile, scene, safe, config])) {
          markRouteSurfaceReady(page)
          return
        }
      }

      if (!current()) return
      try { rebuild(page) } catch (error) { bootFailure(page, 'controller-configure-render', error); return }

      if (page._surfaceVisible && page._surfaceController) {
        boot(page, 'BOOT:controller-start', '')
        if (!controllerCall(page, 'controller-start', 'start')) {
          markRouteSurfaceReady(page)
          return
        }
      }
      if (!current()) return
      boot(page, 'BOOT:ready', '')
      markRouteSurfaceReady(page)
    }, current, function (error) {
      bootFailure(page, 'device-profile', error)
    })
  } catch (error) {
    bootFailure(page, 'page-runtime', error)
  }
}

function show(page) {
  if (!page || page._surfaceDestroyed) return
  page._surfaceVisible = true
  if (page._surfaceInteractionOwner) page._surfaceInteractionOwner.activate()
  try {
    if (page.surfaceReady) rebuild(page)
    else syncPlanContext(page)
  } catch (error) {
    bootFailure(page, 'show-render', error)
    return
  }
  if (page.surfaceReady && page._surfaceController && !page._surfaceControllerError) controllerCall(page, 'controller-start', 'start')
  markRouteSurfaceReady(page)
}

function hide(page) {
  if (!page || page._surfaceDestroyed) return
  page._surfaceVisible = false
  if (page._surfaceInteractionOwner) {
    navigationContext.clear(page._surfaceInteractionOwner.key())
    page._surfaceInteractionOwner.deactivate()
  }
  syncPlanContext(page)
  if (page._surfaceController) controllerCall(page, 'controller-stop', 'stop')
}

function destroy(page) {
  if (!page) return
  if (page._surfaceController && typeof page._surfaceController.destroy === 'function') {
    try { page._surfaceController.destroy() } catch (error) { console.log('[V3_CONTROLLER] controller-destroy: ' + errorText(error)) }
  }
  pageGeneration.destroy(page)
  page._surfaceVisible = false
  if (page._surfaceInteractionOwner) {
    navigationContext.clear(page._surfaceInteractionOwner.key())
    page._surfaceInteractionOwner.deactivate()
  }
  page._surfaceController = null
  page._surfaceControllerError = null
  page._surfaceInteractionOwner = null
  page._surface = null
  page._surfaceState = null
  page._surfaceProfile = null
  page._surfaceScene = null
  page._surfaceSafe = null
  page._surfaceRenderSignature = null
  page.surfacePlan = null
  page.surfaceReady = false
  boot(page, '', '')
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
  if (!page || page._surfaceDestroyed || !page._surfaceVisible) return
  if (page._surfaceControllerError) {
    console.log('[V3_CONTROLLER] action suppressed after ' + page._surfaceControllerError.stage + ': ' + name)
    return
  }
  if (!page._surfaceController || typeof page._surfaceController.action !== 'function') return
  try { page._surfaceController.action(name, actionPayload(event)) } catch (error) { controllerFailure(page, 'controller-action', error) }
}

function back(page) {
  var owner = page && page._surfaceInteractionOwner ? page._surfaceInteractionOwner.key() : ''
  navigation.back(owner)
  return true
}

export default { bind: bind, show: show, hide: hide, destroy: destroy, action: action, back: back }
