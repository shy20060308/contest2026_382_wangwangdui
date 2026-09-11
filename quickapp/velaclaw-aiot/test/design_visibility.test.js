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

function assertInside(formFactor, scene, frame, label) {
  assert.ok(visibility.frameInside(formFactor, scene, frame, 0), label + ' must fit the visible ' + formFactor + ' mask: ' + JSON.stringify(frame))
}

function glyphFrame(frame, text, fontSize, align) {
  const width = Math.min(frame.width, visibility.estimatedTextWidth(text, fontSize))
  const height = Math.min(frame.height, Math.max(1, Number(fontSize) || 0))
  let left = frame.left
  if (align === 'right') left = frame.left + frame.width - width
  else if (align !== 'left') left = frame.left + (frame.width - width) / 2
  return { left: left, top: frame.top + (frame.height - height) / 2, width: width, height: height }
}

function assertGlyphInside(formFactor, scene, frame, text, fontSize, align, label) {
  assert.ok(visibility.estimatedTextWidth(text, fontSize) <= frame.width + 1, label + ' text width must fit its authored frame')
  assertInside(formFactor, scene, glyphFrame(frame, text, fontSize, align), label + ' glyphs')
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
      const frame = visibility.translate(item.frame, stage.frame.left, stage.frame.top)
      assert.ok(Number(item.tokens.fontSize) >= 6, formFactor + '/' + faceId + ' text ' + item.id + ' should not use sub-6 design-unit copy')
      assertGlyphInside(formFactor, resolved.ctx.scene, frame, item.text, item.tokens.fontSize, item.tokens.textAlign, formFactor + '/' + faceId + ' text ' + item.id)
    })
    ;(stage.metrics || []).forEach(function (item) {
      const frame = visibility.translate(item.frame, stage.frame.left, stage.frame.top)
      if (item.action) assertInside(formFactor, resolved.ctx.scene, frame, formFactor + '/' + faceId + ' metric tap ' + item.id)
      assert.ok(Number(item.tokens.labelSize) >= 5, formFactor + '/' + faceId + ' metric ' + item.id + ' label should remain readable')
      assert.ok(Number(item.tokens.valueSize) >= 9, formFactor + '/' + faceId + ' metric ' + item.id + ' value should remain readable')
      const padding = Number(item.tokens.padding) || 0
      const contentWidth = item.frame.width - padding * 2
      assert.ok(visibility.estimatedTextWidth(item.value, item.tokens.valueSize) <= contentWidth + 1, formFactor + '/' + faceId + ' metric ' + item.id + ' stress value must fit its content width')
      const labelLocal = { left: item.frame.left + padding, top: item.frame.top + padding, width: contentWidth, height: Number(item.tokens.labelHeight) || item.tokens.labelSize }
      const valueLocal = { left: item.frame.left + padding, top: item.frame.top + padding + (Number(item.tokens.labelHeight) || 0) + (Number(item.tokens.valueTop) || 0), width: contentWidth, height: Number(item.tokens.valueHeight) || item.tokens.valueSize }
      assertGlyphInside(formFactor, resolved.ctx.scene, visibility.translate(labelLocal, stage.frame.left, stage.frame.top), item.label, item.tokens.labelSize, item.tokens.textAlign, formFactor + '/' + faceId + ' metric label ' + item.id)
      assertGlyphInside(formFactor, resolved.ctx.scene, visibility.translate(valueLocal, stage.frame.left, stage.frame.top), item.value, item.tokens.valueSize, item.tokens.textAlign, formFactor + '/' + faceId + ' metric value ' + item.id)
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
;(call.plan.flowButtons || []).forEach(function (item) {
  assertInside('circle', call.ctx.scene, visibility.translate(item.frame, call.plan.stream.left, call.plan.stream.top), 'Circle call action ' + item.id)
  assert.ok(Number(item.tokens.titleSize) >= 8, 'Circle call action ' + item.id + ' title should remain readable')
})
;(call.plan.flowTexts || []).forEach(function (item) {
  const frame = visibility.translate(item.frame, call.plan.stream.left, call.plan.stream.top)
  assertGlyphInside('circle', call.ctx.scene, frame, item.text, item.tokens.fontSize, item.tokens.textAlign, 'Circle call text ' + item.id)
})
const callContact = call.plan.flowTexts.find(item => item.id === 'notifyContact')
assert.ok(callContact, 'Circle call must render contact text')
assert.ok(visibility.estimatedTextWidth('王小明王小明王小明', callContact.tokens.fontSize) <= callContact.frame.width, 'Long Chinese contact fixture must fit the authored Circle contact frame')

const selectorResolved = resolve(watchfaceSurface, 'circle', { selectedId: 'sport', selectedIndex: 0 })
const selector = selectorResolved.plan.collection
assert.ok(selector, 'Circle watchface selector must resolve')
const baseLeft = selector.frame.left
const baseTop = selector.frame.top
const previewFrame = visibility.translate({ left: selector.tokens.previewLeft, top: selector.tokens.previewTop, width: selector.tokens.previewWidth, height: selector.tokens.previewHeight }, baseLeft, baseTop)
assertInside('circle', selectorResolved.ctx.scene, previewFrame, 'Circle watchface preview tap area')
const titleFrame = visibility.translate({ left: selector.tokens.headerLeft, top: selector.tokens.headerTop, width: selector.tokens.headerWidth, height: selector.tokens.headerHeight }, baseLeft, baseTop)
assertGlyphInside('circle', selectorResolved.ctx.scene, titleFrame, selector.tokens.title, selector.tokens.titleSize, 'left', 'Circle watchface title')
const backWidth = visibility.estimatedTextWidth(selector.tokens.backText, selector.tokens.backSize)
const backFrame = { left: titleFrame.left + titleFrame.width - backWidth, top: titleFrame.top, width: backWidth, height: titleFrame.height }
assertGlyphInside('circle', selectorResolved.ctx.scene, backFrame, selector.tokens.backText, selector.tokens.backSize, 'right', 'Circle watchface back')
const footerFrame = visibility.translate({ left: selector.tokens.footerLeft, top: selector.tokens.footerTop, width: selector.tokens.footerWidth, height: selector.tokens.footerHeight }, baseLeft, baseTop)
assertGlyphInside('circle', selectorResolved.ctx.scene, footerFrame, '曜金机械' + selector.tokens.footerSuffix, selector.tokens.footerSize, 'center', 'Circle watchface footer')
assert.ok(selector.tokens.tagSize >= 7, 'Circle watchface tags should use at least 7 design units')
assert.ok(selector.tokens.footerSize >= 7, 'Circle watchface footer should use at least 7 design units')

const rectSelector = resolve(watchfaceSurface, 'rect', { selectedId: 'sport', selectedIndex: 0 }).plan.collection
assert.ok(rectSelector.tokens.selectedSize >= 7, 'Rect selected-state copy should use at least 7 design units')
assert.ok(rectSelector.tokens.currentLabelSize >= 7, 'Rect current label should use at least 7 design units')
assert.ok(rectSelector.tokens.currentHintSize >= 7, 'Rect current hint should use at least 7 design units')

console.log('Design visibility preview verified: Circle/Pill glyphs, tap frames and critical text stress fixtures stay inside authored masks')
