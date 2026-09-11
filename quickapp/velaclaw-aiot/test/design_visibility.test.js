const assert = require('assert')
const sceneRuntime = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const experienceRuntime = require('../src/product/frontend/runtime/experience_runtime')
const visibility = require('../scripts/lib/shape-visibility')

const clockSurface = require('../src/product/frontend/surfaces/clock.json')
const watchfaceSurface = require('../src/product/frontend/surfaces/watchface.json')

const profiles = {
  circle: { formFactor: 'circle', screenWidth: 466, screenHeight: 466, safeInsets: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 } },
  pill: { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
  rect: { formFactor: 'rect', screenWidth: 390, screenHeight: 450, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
}

function context(formFactor) {
  const profile = profiles[formFactor]
  const scene = sceneRuntime.resolve(profile)
  return { profile: profile, scene: scene, safe: sceneRuntime.safe(profile, scene) }
}

function resolve(surface, formFactor, state) {
  const ctx = context(formFactor)
  const plan = surfaceRuntime.resolve(surface, ctx.profile, ctx.scene, ctx.safe, state || {})
  return { ctx: ctx, plan: experienceRuntime.decorate(plan, surface, ctx.profile, ctx.scene, ctx.safe, state || {}) }
}

function assertInside(formFactor, scene, frame, label, inset) {
  assert.ok(visibility.frameInside(formFactor, scene, frame, inset || 0), label + ' must fit the visible ' + formFactor + ' mask: ' + JSON.stringify(frame))
}

function clockState(faceId) {
  return {
    clockVisible: true,
    sleepVisible: false,
    notificationAppVisible: false,
    notificationCallVisible: false,
    faceId: faceId,
    powerMode: 'ACTIVE',
    timestamp: new Date(2026, 8, 11, 8, 32, 25).getTime(),
    steps: 99999,
    currentHeartRate: 188,
    goalPercent: 100,
    batteryPercent: 100
  }
}

;['circle', 'pill'].forEach(function (formFactor) {
  const faceIds = clockSurface.experience[formFactor].controllerConfig.faceIds
  faceIds.forEach(function (faceId) {
    const resolved = resolve(clockSurface, formFactor, clockState(faceId))
    const stage = resolved.plan.stage
    assert.ok(stage, formFactor + '/' + faceId + ' must resolve stage')
    ;(stage.texts || []).forEach(function (item) {
      assertInside(formFactor, resolved.ctx.scene, visibility.translate(item.frame, stage.frame.left, stage.frame.top), formFactor + '/' + faceId + ' text ' + item.id)
      assert.ok(Number(item.tokens.fontSize) >= 6, formFactor + '/' + faceId + ' text ' + item.id + ' should not use sub-6 design-unit copy')
    })
    ;(stage.metrics || []).forEach(function (item) {
      assertInside(formFactor, resolved.ctx.scene, visibility.translate(item.frame, stage.frame.left, stage.frame.top), formFactor + '/' + faceId + ' metric ' + item.id)
      assert.ok(Number(item.tokens.labelSize) >= 5, formFactor + '/' + faceId + ' metric ' + item.id + ' label should remain readable')
      assert.ok(Number(item.tokens.valueSize) >= 9, formFactor + '/' + faceId + ' metric ' + item.id + ' value should remain readable')
      const contentWidth = item.frame.width - (Number(item.tokens.padding) || 0) * 2
      assert.ok(visibility.estimatedTextWidth(item.value, item.tokens.valueSize) <= contentWidth + 1, formFactor + '/' + faceId + ' metric ' + item.id + ' stress value must fit its content width')
    })
    ;(stage.progresses || []).filter(item => item.action).forEach(function (item) {
      assertInside(formFactor, resolved.ctx.scene, visibility.translate(item.frame, stage.frame.left, stage.frame.top), formFactor + '/' + faceId + ' actionable progress ' + item.id)
    })
  })
})

const call = resolve(clockSurface, 'circle', {
  clockVisible: false,
  sleepVisible: false,
  notificationAppVisible: false,
  notificationCallVisible: true,
  contact: '王小明王小明王小明',
  phone: '138 0000 0000'
})
;[].concat(call.plan.flowHeaders || [], call.plan.flowTexts || [], call.plan.flowButtons || []).forEach(function (item) {
  assertInside('circle', call.ctx.scene, visibility.translate(item.frame, call.plan.stream.left, call.plan.stream.top), 'Circle call ' + item.id)
})
const callContact = call.plan.flowTexts.find(item => item.id === 'notifyContact')
assert.ok(callContact, 'Circle call must render contact text')
assert.ok(visibility.estimatedTextWidth('王小明王小明王小明', callContact.tokens.fontSize) <= callContact.frame.width, 'Long Chinese contact fixture must fit the authored Circle contact frame')

const selector = resolve(watchfaceSurface, 'circle', { selectedId: 'sport', selectedIndex: 0 }).plan.collection
assert.ok(selector, 'Circle watchface selector must resolve')
const selectorBaseLeft = selector.frame.left
const selectorBaseTop = selector.frame.top
const selectorRects = [
  { label: 'watchface header', frame: { left: selector.tokens.headerLeft, top: selector.tokens.headerTop, width: selector.tokens.headerWidth, height: selector.tokens.headerHeight } },
  { label: 'watchface preview', frame: { left: selector.tokens.previewLeft, top: selector.tokens.previewTop, width: selector.tokens.previewWidth, height: selector.tokens.previewHeight } },
  { label: 'watchface footer', frame: { left: selector.tokens.footerLeft, top: selector.tokens.footerTop, width: selector.tokens.footerWidth, height: selector.tokens.footerHeight } }
]
selectorRects.forEach(function (entry) {
  assertInside('circle', context('circle').scene, visibility.translate(entry.frame, selectorBaseLeft, selectorBaseTop), 'Circle ' + entry.label)
})
assert.ok(selector.tokens.tagSize >= 7, 'Circle watchface tags should use at least 7 design units')
assert.ok(selector.tokens.footerSize >= 7, 'Circle watchface footer should use at least 7 design units')

const rectSelector = resolve(watchfaceSurface, 'rect', { selectedId: 'sport', selectedIndex: 0 }).plan.collection
assert.ok(rectSelector.tokens.selectedSize >= 7, 'Rect selected-state copy should use at least 7 design units')
assert.ok(rectSelector.tokens.currentLabelSize >= 7, 'Rect current label should use at least 7 design units')
assert.ok(rectSelector.tokens.currentHintSize >= 7, 'Rect current hint should use at least 7 design units')

console.log('Design visibility preview verified: Circle/Pill mask geometry and critical text stress fixtures stay inside authored bounds')
