const assert = require('assert')
const honeycomb = require('../src/common/honeycomb_layout')
const safeArea = require('../src/common/safe_area')

let passed = 0

function test(name, callback) {
  callback()
  passed++
  console.log('通过 - ' + name)
}

const coords = honeycomb.buildCoords()

test('晶格最近邻间距完全一致', function () {
  let min = Infinity
  let max = 0
  for (let i = 0; i < coords.length; i++) {
    let nearest = Infinity
    for (let j = 0; j < coords.length; j++) {
      if (i === j) continue
      const dx = coords[i].x - coords[j].x
      const dy = coords[i].y - coords[j].y
      nearest = Math.min(nearest, Math.sqrt(dx * dx + dy * dy))
    }
    min = Math.min(min, nearest)
    max = Math.max(max, nearest)
  }
  assert.strictEqual(Math.round(min), honeycomb.SPACING)
  assert.strictEqual(Math.round(max), honeycomb.SPACING)
})

test('中心格恰好有六个等距邻居', function () {
  const distances = coords.slice(1).map(function (point) {
    const dx = point.x - coords[0].x
    const dy = point.y - coords[0].y
    return Math.round(Math.sqrt(dx * dx + dy * dy))
  })
  const neighbours = distances.filter(function (d) { return d === honeycomb.SPACING })
  assert.strictEqual(neighbours.length, 6)
})

test('晶格左右对称', function () {
  coords.forEach(function (point) {
    const mirrored = coords.some(function (other) {
      return other.y === point.y && other.x === 2 * honeycomb.FOCUS_X - point.x
    })
    assert.ok(mirrored, '(' + point.x + ',' + point.y + ') 缺少镜像格')
  })
})

test('全拖拽空间内图标永不重叠', function () {
  const limit = honeycomb.DRAG_LIMIT
  let worst = Infinity
  let worstAt = null
  for (let focus = 0; focus < coords.length; focus++) {
    const panX = honeycomb.FOCUS_X - coords[focus].x
    const panY = honeycomb.FOCUS_Y - coords[focus].y
    for (let ox = -limit; ox <= limit; ox += 4) {
      for (let oy = -limit; oy <= limit; oy += 4) {
        const gap = honeycomb.minimumEdgeGap(honeycomb.layoutFrame(coords, panX, panY, ox, oy))
        if (gap < worst) {
          worst = gap
          worstAt = { focus, ox, oy }
        }
      }
    }
  }
  assert.ok(worst > 0, '出现重叠，最小间隙 ' + worst.toFixed(2) + 'px @ ' + JSON.stringify(worstAt))
})

test('弹性差值被约束在 0.10 以内', function () {
  assert.ok(honeycomb.ELASTIC_RANGE <= 0.1)
})

test('聚焦图标明显大于邻居', function () {
  const frame = honeycomb.layoutFrame(coords, 0, 0, 0, 0)
  const focused = frame[0].size
  const neighbour = frame[1].size
  assert.strictEqual(focused, honeycomb.ICON_BASE + honeycomb.ICON_GROW)
  assert.ok(focused - neighbour >= 12)
})

test('八向滑动都能落到相邻格', function () {
  Object.keys(honeycomb.DIRECTIONS).forEach(function (name) {
    const target = honeycomb.pickByDirection(coords, 0, honeycomb.DIRECTIONS[name])
    assert.ok(target >= 0, name + ' 方向从中心找不到目标格')
    assert.notStrictEqual(target, 0)
  })
})

test('方向选格取该方向最近的一格', function () {
  const target = honeycomb.pickByDirection(coords, 0, honeycomb.DIRECTIONS.right)
  assert.strictEqual(coords[target].x, honeycomb.FOCUS_X + honeycomb.SPACING)
  assert.strictEqual(coords[target].y, honeycomb.FOCUS_Y)
})

test('槽位构造保留应用语义字段', function () {
  const apps = [
    { id: 'a', label: 'A', icon: '/a.png', softIcon: '/a-soft.png', route: '/a' },
    { id: 'b', label: 'B', icon: '/b.png', softIcon: '/b-soft.png', route: '/b' }
  ]
  const slots = honeycomb.buildSlots(apps)
  assert.strictEqual(slots.length, 2)
  assert.strictEqual(slots[0].id, 'a')
  assert.strictEqual(slots[0].route, '/a')
  assert.strictEqual(slots[0].normalIcon, '/a.png')
  assert.strictEqual(slots[0].softIcon, '/a-soft.png')
  assert.strictEqual(slots[0].gridX, honeycomb.FOCUS_X)
  assert.strictEqual(slots[0].gridY, honeycomb.FOCUS_Y)
})

test('槽位投影保持旧版中心尺寸和透明度', function () {
  const slots = honeycomb.buildSlots([
    { id: 'a', label: 'A', icon: '/a.png', softIcon: '/a-soft.png', route: '/a' },
    { id: 'b', label: 'B', icon: '/b.png', softIcon: '/b-soft.png', route: '/b' }
  ])
  const frame = honeycomb.layoutSlots(slots, 0, 0, 0, 0)
  assert.strictEqual(frame.nearestIndex, 0)
  assert.strictEqual(frame.slots[0].size, 50)
  assert.strictEqual(frame.slots[0].radius, 25)
  assert.strictEqual(frame.slots[0].left, 71)
  assert.strictEqual(frame.slots[0].top, 65)
  assert.strictEqual(frame.slots[0].icon, '/a.png')
  assert.strictEqual(frame.slots[0].isCenter, true)
  assert.ok(frame.slots[0].opacity > 0.99)
})

test('首次进入仍保留旧版 y=74 的视觉偏移', function () {
  const slots = honeycomb.buildSlots([
    { id: 'a', label: 'A', icon: '/a.png', softIcon: '/a-soft.png', route: '/a' }
  ])
  const pan = honeycomb.panForSlot(slots[0], 74)
  assert.deepStrictEqual(pan, { x: 0, y: -16 })
})

test('正常吸附落回统一聚焦点 y=90', function () {
  const slots = honeycomb.buildSlots([
    { id: 'a', label: 'A', icon: '/a.png', softIcon: '/a-soft.png', route: '/a' }
  ])
  assert.deepStrictEqual(honeycomb.panForSlot(slots[0]), { x: 0, y: 0 })
})

test('拖拽输入保持旧版单帧限幅和阻尼', function () {
  assert.strictEqual(honeycomb.nextDragOffset(0, 100), Math.round(honeycomb.MAX_FRAME_DELTA * honeycomb.DRAG_DAMPING * 100) / 100)
  assert.ok(honeycomb.nextDragOffset(honeycomb.DRAG_LIMIT, 20) <= honeycomb.DRAG_LIMIT)
})

test('back-out 缓动起终点稳定', function () {
  assert.ok(Math.abs(honeycomb.backOut(0)) < 1e-9)
  assert.ok(Math.abs(honeycomb.backOut(1) - 1) < 1e-9)
})

test('聚焦格居中后完整落在圆屏可视范围内', function () {
  coords.forEach(function (point, index) {
    const panX = honeycomb.FOCUS_X - point.x
    const panY = honeycomb.FOCUS_Y - point.y
    const frame = honeycomb.layoutFrame(coords, panX, panY, 0, 0)
    const focused = frame[index]
    const half = focused.size / 2
    assert.ok(safeArea.fitsInCircle(safeArea.DESIGN_WIDTH, focused.centerX - half, focused.centerY - half, focused.size, focused.size))
  })
})

test('名称条四角落在内切圆内', function () {
  assert.strictEqual(safeArea.fitsInCircle(safeArea.DESIGN_WIDTH, 48, 152, 96, 20), true)
})

console.log('圆屏蜂巢布局测试通过：' + passed + ' 项')
