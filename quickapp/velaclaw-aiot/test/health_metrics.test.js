const assert = require('assert')
const metrics = require('../src/domain/health/metrics')

let passed = 0

function test(name, callback) {
  callback()
  passed++
  console.log('通过 - ' + name)
}

test('健康语义合法性只由 Domain 定义', function () {
  assert.strictEqual(metrics.isHeartRate(72), true)
  assert.strictEqual(metrics.isHeartRate(0), false)
  assert.strictEqual(metrics.isHeartRate('72'), false)
  assert.strictEqual(metrics.isSpo2(98), true)
  assert.strictEqual(metrics.isSpo2(101), false)
  assert.strictEqual(metrics.isStress(0), true)
  assert.strictEqual(metrics.isStress(100), true)
  assert.strictEqual(metrics.isStress(101), false)
})

test('心率区间边界', function () {
  assert.strictEqual(metrics.classifyHeartRate(59), 'rest')
  assert.strictEqual(metrics.classifyHeartRate(60), 'normal')
  assert.strictEqual(metrics.classifyHeartRate(99), 'normal')
  assert.strictEqual(metrics.classifyHeartRate(100), 'elevated')
  assert.strictEqual(metrics.classifyHeartRate(139), 'elevated')
  assert.strictEqual(metrics.classifyHeartRate(140), 'peak')
})

test('压力区间边界', function () {
  assert.strictEqual(metrics.classifyStress(29), 'relaxed')
  assert.strictEqual(metrics.classifyStress(30), 'normal')
  assert.strictEqual(metrics.classifyStress(60), 'elevated')
  assert.strictEqual(metrics.classifyStress(80), 'high')
})

test('滑动窗口保持固定长度', function () {
  assert.deepStrictEqual(metrics.pushWindow([1, 2, 3], 4, 3), [2, 3, 4])
  assert.deepStrictEqual(metrics.pushWindow([], 7, 3), [7])
})

test('统计最低平均最高', function () {
  assert.deepStrictEqual(metrics.stats([60, 70, 80]), { min: 60, avg: 70, max: 80 })
  assert.deepStrictEqual(metrics.stats([]), { min: 0, avg: 0, max: 0 })
})

console.log('\n健康 Domain 测试通过：' + passed + ' 项；展示映射由 V3 Surface runtime/truth contracts 覆盖')
