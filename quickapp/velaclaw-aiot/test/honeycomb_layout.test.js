const assert = require('assert')
const honeycomb = require('../src/v2/design/engines/honeycomb')
const launcherLayout = require('../src/v2/design/apps/launcher/layout')

let passed = 0
function test(name, callback) { callback(); passed++; console.log('通过 - ' + name) }
function fitsInCircle(left, top, width, height) {
  const radius = 96
  const corners = [[left, top], [left + width, top], [left, top + height], [left + width, top + height]]
  return corners.every(function (point) { const dx = point[0] - radius; const dy = point[1] - radius; return dx * dx + dy * dy <= radius * radius + 0.01 })
}

const circleRecipe = launcherLayout.circle.honeycomb
const resolvedRecipe = Object.assign({}, circleRecipe, { viewport: { width: 192, height: 192 } })
const engine = honeycomb.create(resolvedRecipe)
const coords = engine.buildCoords(37)

test('Honeycomb 必须由 resolved Launcher Recipe 创建', function () {
  assert.throws(function () { honeycomb.create(circleRecipe) }, /resolved viewport object/)
  assert.strictEqual(honeycomb.FOCUS_X, undefined)
  assert.strictEqual(honeycomb.ICON_BASE, undefined)
  assert.strictEqual(honeycomb.LABEL_CENTER_Y, undefined)
})

test('动态 hex ring 按 0/1/7/19/37 容量扩展且坐标唯一', function () {
  assert.strictEqual(engine.buildCoords(0).length, 0)
  assert.strictEqual(engine.buildCoords(1).length, 1)
  assert.strictEqual(engine.buildCoords(7).length, 7)
  assert.strictEqual(engine.buildCoords(19).length, 19)
  assert.strictEqual(coords.length, 37)
  const keys = coords.map(function (point) { return point.q + ':' + point.r })
  assert.strictEqual(new Set(keys).size, 37)
})

test('Honeycomb 不修复非 canonical 输入', function () {
  assert.throws(function () { engine.buildCoords('19') }, /non-negative integer count/)
  assert.throws(function () { engine.buildSlots(null) }, /apps array/)
  assert.throws(function () { engine.clampPan([], '0', 0, 0) }, /numeric panX/)
  assert.throws(function () { engine.nextPan([], 0, 0, '4', 2) }, /numeric deltaX/)
})

test('中心格恰好有六个等距邻居', function () {
  const distances = coords.slice(1).map(function (point) { const dx = point.x - coords[0].x, dy = point.y - coords[0].y; return Math.round(Math.sqrt(dx * dx + dy * dy)) })
  assert.strictEqual(distances.filter(function (d) { return d === circleRecipe.spacing }).length, 6)
})

test('动态晶格最近邻间距保持 Recipe spacing', function () {
  for (let i = 0; i < coords.length; i++) {
    let nearest = Infinity
    for (let j = 0; j < coords.length; j++) {
      if (i === j) continue
      const dx = coords[i].x - coords[j].x, dy = coords[i].y - coords[j].y
      nearest = Math.min(nearest, Math.sqrt(dx * dx + dy * dy))
    }
    assert.strictEqual(Math.round(nearest), circleRecipe.spacing)
  }
})

test('12 个应用不再复用第一个坐标', function () {
  const apps = []
  for (let i = 0; i < 12; i++) apps.push({ id: 'app-' + i, label: 'App ' + i, icon: '/' + i + '.png' })
  const slots = engine.buildSlots(apps)
  const keys = slots.map(function (slot) { return slot.gridX + ':' + slot.gridY })
  assert.strictEqual(slots.length, 12)
  assert.strictEqual(new Set(keys).size, 12)
  assert.notStrictEqual(keys[0], keys[11])
})

test('聚焦时图标保持间隙并按 Recipe 放大', function () {
  const sample = engine.buildCoords(19)
  for (let focus = 0; focus < sample.length; focus++) {
    const panX = circleRecipe.focus.x - sample[focus].x
    const panY = circleRecipe.focus.y - sample[focus].y
    const frame = engine.layoutFrame(sample, panX, panY, 0, 0)
    assert.ok(engine.minimumEdgeGap(frame) > 0)
    assert.strictEqual(frame[focus].size, circleRecipe.icon.baseSize + circleRecipe.icon.grow)
  }
})

test('槽位只保留渲染与语义字段，不携带路由或退休 softIcon', function () {
  const slots = engine.buildSlots([{ id: 'a', label: 'A', icon: '/a.png' }, { id: 'b', label: 'B', icon: '/b.png' }])
  assert.strictEqual(slots.length, 2)
  assert.strictEqual(slots[0].id, 'a')
  assert.strictEqual(slots[0].route, undefined)
  assert.strictEqual(slots[0].normalIcon, '/a.png')
  assert.strictEqual(slots[0].softIcon, undefined)
  assert.strictEqual(slots[0].gridX, circleRecipe.focus.x)
  assert.strictEqual(slots[0].gridY, circleRecipe.focus.y)
})

test('移动期间图标 src 保持稳定，由 Recipe 尺寸和透明度表达焦点', function () {
  const slots = engine.buildSlots([{ id: 'a', label: 'A', icon: '/a.png' }, { id: 'b', label: 'B', icon: '/b.png' }])
  const centered = engine.layoutSlots(slots, 0, 0, 0, 0)
  const shifted = engine.layoutSlots(slots, -80, -80, 0, 0)
  assert.strictEqual(centered.slots[0].icon, '/a.png')
  assert.strictEqual(shifted.slots[0].icon, '/a.png')
  assert.strictEqual(centered.slots[0].size, circleRecipe.icon.baseSize + circleRecipe.icon.grow)
  assert.ok(centered.slots[0].opacity > shifted.slots[0].opacity)
})

test('visible-slot culling 使用 resolved viewport', function () {
  const source = [
    { id: 'a', centerX: 96, centerY: 96, size: 40 },
    { id: 'b', centerX: 400, centerY: 96, size: 40 },
    { id: 'c', centerX: -300, centerY: 96, size: 40 }
  ]
  const visible = engine.visibleSlots(source)
  assert.strictEqual(visible.length, 1)
  assert.strictEqual(visible[0].id, 'a')
})

test('pan bounds 允许最外层应用移动到 Recipe focus', function () {
  const apps = []
  for (let i = 0; i < 19; i++) apps.push({ id: 'a' + i, label: 'A' + i, icon: '/a.png' })
  const slots = engine.buildSlots(apps)
  const bounds = engine.panBounds(slots)
  slots.forEach(function (slot) {
    const target = engine.panForSlot(slot)
    assert.ok(target.x >= bounds.minX && target.x <= bounds.maxX)
    assert.ok(target.y >= bounds.minY && target.y <= bounds.maxY)
  })
})

test('拖动越界只进入有限 rubber-band 区域', function () {
  const slots = engine.buildSlots([{ id: 'a', label: 'A', icon: '/a.png' }, { id: 'b', label: 'B', icon: '/b.png' }])
  const bounds = engine.panBounds(slots)
  let pan = { x: 0, y: 0 }
  for (let i = 0; i < 40; i++) pan = engine.nextPan(slots, pan.x, pan.y, 100, 100)
  assert.ok(pan.x <= bounds.maxX + honeycomb.OVERSCROLL_LIMIT)
  assert.ok(pan.y <= bounds.maxY + honeycomb.OVERSCROLL_LIMIT)
  const strict = engine.clampPan(slots, pan.x, pan.y, 0)
  assert.ok(strict.x <= bounds.maxX && strict.y <= bounds.maxY)
})

test('frame cadence 和惯性参数保持 wearable 级限幅', function () {
  assert.ok(honeycomb.FRAME_MS >= 20 && honeycomb.FRAME_MS <= 32)
  assert.ok(honeycomb.INERTIA_DECAY > 0.75 && honeycomb.INERTIA_DECAY < 0.95)
  assert.ok(honeycomb.MAGNET_DISTANCE <= circleRecipe.spacing / 2)
  assert.ok(honeycomb.ELASTIC_RANGE <= 0.1)
})

test('焦点图标完整落在圆屏可视范围内', function () {
  const sample = engine.buildCoords(19)
  sample.forEach(function (point, index) {
    const panX = circleRecipe.focus.x - point.x
    const panY = circleRecipe.focus.y - point.y
    const focused = engine.layoutFrame(sample, panX, panY, 0, 0)[index]
    const half = focused.size / 2
    assert.ok(fitsInCircle(focused.centerX - half, focused.centerY - half, focused.size, focused.size))
  })
})

test('Launcher Recipe 名称条位于圆屏安全区域', function () {
  const label = circleRecipe.label
  assert.strictEqual(fitsInCircle(label.left, label.top, label.width, label.height), true)
})

console.log('V3 圆屏蜂巢布局测试通过：' + passed + ' 项')
