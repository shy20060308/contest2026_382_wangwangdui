const assert = require('assert')
const patterns = require('../src/domain/haptics/patterns')

let passed = 0

function test(name, callback) {
  callback()
  passed++
  console.log('通过 - ' + name)
}

test('未知模式与强度直接失败', function () {
  assert.strictEqual(typeof patterns.normalize, 'undefined')
  assert.throws(function () { patterns.get('unknown', 'medium') }, /Unknown haptic pattern/)
  assert.throws(function () { patterns.get('tap', 'unknown') }, /Unknown haptic level/)
})

test('四种模式保持独立节奏配置', function () {
  assert.strictEqual(patterns.get('tap', 'medium').count, 1)
  assert.strictEqual(patterns.get('goal', 'medium').count, 2)
  assert.strictEqual(patterns.get('countdown', 'medium').count, 3)
  assert.strictEqual(patterns.get('alert', 'medium').mode, 'long')
})

test('强度只缩放持续时间，不改变模式语义', function () {
  assert.strictEqual(patterns.get('tap', 'strong').id, 'tap')
  assert.ok(patterns.get('tap', 'strong').duration > patterns.get('tap', 'light').duration)
})

test('Domain 不输出展示文案', function () {
  patterns.list().forEach(function (pattern) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(pattern, 'label'), false)
  })
})

test('模式列表只包含四个 canonical pattern', function () {
  assert.deepStrictEqual(patterns.list().map(function (pattern) { return pattern.id }), ['tap', 'goal', 'countdown', 'alert'])
})

console.log('震动模式 Domain 测试通过：' + passed + ' 项')
