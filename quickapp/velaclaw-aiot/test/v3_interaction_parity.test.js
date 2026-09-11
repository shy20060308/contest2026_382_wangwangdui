const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const appList = readJson('src/product/frontend/surfaces/applist.json')
const watchface = readJson('src/product/frontend/surfaces/watchface.json')
const brightness = readJson('src/product/frontend/surfaces/settings__brightness.json')
const clock = readJson('src/product/frontend/surfaces/clock.json')
const collectionUx = read('src/components/surface_collection.ux')
const sliderUx = read('src/components/surface_slider.ux')
const honeycomb = read('src/product/frontend/engines/honeycomb.js')
const designSkill = read('docs/VELA_WEARABLE_DESIGN_SKILL.md')

assert.ok(appList.experience, 'AppList must declare interaction experience in JSON')
assert.strictEqual(appList.experience.circle.collection.mode, 'honeycomb', 'Circle launcher must remain honeycomb')
assert.strictEqual(appList.experience.pill.collection.mode, 'paged-list', 'Pill launcher must remain paged list')
assert.strictEqual(appList.experience.rect.collection.mode, 'designed-grid', 'Rect launcher must remain designed grid')
const launcherItems = appList.experience.base.collection.items
assert.strictEqual(launcherItems.length, 12, 'Launcher parity requires the accepted 12 app entries')
launcherItems.forEach(item => {
  assert.ok(item.icon && item.icon.indexOf('/common/icons/') === 0, item.id + ' must retain visual icon')
  assert.ok(item.action && item.action.charAt(0) === '/', item.id + ' must retain navigation action')
})
const honeyTokens = appList.experience.circle.collection.tokens
;[
  'spacing', 'rowHeight', 'focusX', 'focusY', 'iconBase', 'iconGrow', 'radiusRatio', 'emphasisFalloff',
  'opacityBase', 'opacityEmphasis', 'avoidanceOpacity', 'elasticBase', 'elasticRange', 'elasticFalloff',
  'dragDamping', 'maxFrameDelta', 'frameMs', 'overscrollLimit', 'overscrollDamping', 'inertiaDecay',
  'minVelocity', 'magnetDistance', 'visibleMargin', 'labelCenterY', 'labelHalfHeight', 'labelHalfWidth',
  'movingLabelOpacity', 'snapDuration', 'dragThreshold', 'tapSuppressDuration', 'velocityPreviousWeight',
  'velocitySampleWeight', 'edgeBackDistance', 'edgeBackStart', 'edgeBackVerticalLimit'
].forEach(name => assert.strictEqual(typeof honeyTokens[name], 'number', 'L3 Honeycomb must author ' + name + ' in JSON'))
assert.ok(honeyTokens.inertiaDecay < 1, 'Honeycomb must declare inertia')
assert.ok(honeyTokens.magnetDistance > 0, 'Honeycomb must declare center snap')
assert.ok(collectionUx.includes('@touchstart="onHoneyStart"') && collectionUx.includes('startHoneyInertia'), 'Generic collection must implement direct honeycomb drag/inertia')
assert.ok(collectionUx.includes('@swipe="onSwipe"'), 'Generic collection must implement swipe pagination')
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(collectionUx), 'Generic collection renderer must not own product colors')
assert.ok(!/pages\//.test(honeycomb), 'Generic honeycomb engine must not know product routes')
assert.ok(honeycomb.includes('requiredNumber(source.spacing'), 'Honeycomb engine must require authored JSON geometry instead of carrying a default design')
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(honeycomb), 'Generic honeycomb engine must not own product colors')

assert.ok(watchface.experience, 'Watchface must declare its L3 selector experience in JSON')
assert.strictEqual(watchface.experience.circle.collection.mode, 'preview-swiper', 'Circle watchface selector must remain preview swiper')
assert.strictEqual(watchface.experience.pill.collection.mode, 'cards-pager', 'Pill watchface selector must remain preview-card pager')
assert.strictEqual(watchface.experience.rect.collection.mode, 'preview-grid', 'Rect watchface selector must remain preview grid')
const faceItems = watchface.experience.base.collection.items
assert.deepStrictEqual(faceItems.map(item => item.id), ['sport', 'simple', 'dashboard', 'mechanical', 'alpine'])
faceItems.forEach(item => {
  assert.ok(item.label && item.description && item.tag, item.id + ' presentation copy must remain JSON-owned')
  assert.ok(/^#[0-9A-Fa-f]{6}$/.test(item.background), item.id + ' preview background must remain JSON-owned')
  assert.ok(/^#[0-9A-Fa-f]{6}$/.test(item.accent), item.id + ' preview accent must remain JSON-owned')
  assert.strictEqual(item.action, 'watchface-select:' + item.id)
})
assert.deepStrictEqual(watchface.experience.circle.collection.itemIds, ['sport', 'simple', 'dashboard', 'mechanical'])
assert.deepStrictEqual(watchface.experience.pill.collection.itemIds, ['sport', 'simple', 'dashboard', 'alpine'])
assert.deepStrictEqual(watchface.experience.rect.collection.itemIds, ['sport', 'simple', 'dashboard'])
assert.ok(collectionUx.includes("model.mode === 'preview-swiper'") && collectionUx.includes('<swiper'), 'Generic collection must render the Circle watchface preview swiper')
assert.ok(collectionUx.includes("model.mode === 'cards-pager'"), 'Generic collection must render the Pill watchface preview-card pager')
assert.ok(collectionUx.includes("model.mode === 'preview-grid'"), 'Generic collection must render the Rect watchface preview grid')
assert.ok(collectionUx.includes('@click="activateItem($item)"'), 'Watchface previews must remain directly selectable')

assert.ok(brightness.experience, 'Brightness must declare direct-manipulation experience')
const slider = brightness.experience.base.sliders[0]
assert.strictEqual(slider.min, 0)
assert.strictEqual(slider.max, 255)
assert.strictEqual(slider.step, 1)
assert.strictEqual(slider.action, 'brightness-set')
assert.ok(sliderUx.includes('<slider'), 'Brightness parity requires a real slider primitive')
assert.ok(!brightness.modules.some(module => module.id === 'down' || module.id === 'up'), 'Brightness must not degrade the slider into +/- buttons')

assert.ok(clock.experience && clock.experience.base.gestures, 'Clock gestures must be declared in JSON')
assert.strictEqual(clock.experience.base.gestures.up, '/pages/applist')
assert.strictEqual(clock.experience.base.gestures.left, 'clock-next-face')
assert.strictEqual(clock.experience.base.gestures.right, 'clock-prev-face')
assert.strictEqual(clock.experience.base.gestures.longpress, '/pages/watchface')

assert.ok(designSkill.includes('A migration is incomplete if functionality or interaction quality is reduced'), 'Wearable design contract must explicitly ban interaction regression')
console.log('V3 interaction parity verified: L3 launcher/watchface compositions, slider and clock gestures remain first-class declarative behavior')
