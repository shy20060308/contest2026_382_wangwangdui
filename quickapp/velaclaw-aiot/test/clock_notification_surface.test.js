const assert = require('assert')
const clock = require('../src/product/frontend/surfaces/clock.json')
const notificationDemo = require('../src/product/frontend/surfaces/notification_demo.json')
const runtime = require('../src/product/frontend/runtime/surface_runtime')

function safeFor(formFactor, scene) {
  if (formFactor === 'circle') return { left: 0, top: 10, right: scene.width, bottom: scene.height - 10, width: scene.width, height: scene.height - 20, gestureBar: 0 }
  if (formFactor === 'pill') return { left: 0, top: 52, right: scene.width, bottom: scene.height - 52, width: scene.width, height: scene.height - 104, gestureBar: 36 }
  return { left: 0, top: 2, right: scene.width, bottom: scene.height - 2, width: scene.width, height: scene.height - 4, gestureBar: 0 }
}

function callPlan(formFactor, height) {
  const profile = { formFactor: formFactor }
  const scene = { width: 192, height: height }
  return runtime.resolve(clock, profile, scene, safeFor(formFactor, scene), {
    notificationCallVisible: true,
    notificationAppVisible: false,
    clockVisible: false,
    sleepVisible: false,
    contact: '王小明',
    phone: '138 0000 0000'
  })
}

function assertCallActionsOnFirstScreen(label, plan) {
  assert.ok(plan.stream, label + ' call overlay must use the stream surface')
  const buttons = Object.fromEntries(plan.flowButtons.map(item => [item.id, item]))
  ;['notifyCallDismiss', 'notifyHangup'].forEach(function (id) {
    assert.ok(buttons[id], label + ' must render ' + id)
    const bottom = buttons[id].frame.top + buttons[id].frame.height
    assert.ok(bottom <= plan.stream.height, label + ' ' + id + ' must be reachable without scrolling; bottom=' + bottom + ', viewport=' + plan.stream.height)
  })
}

assertCallActionsOnFirstScreen('Circle 192x192', callPlan('circle', 192))
assertCallActionsOnFirstScreen('Rect 390x450 projection', callPlan('rect', Math.ceil(450 * 192 / 390)))
assertCallActionsOnFirstScreen('Rect square explicit-shape projection', callPlan('rect', 192))

const clockHangup = clock.modules.find(module => module.id === 'notifyHangup')
assert.ok(clockHangup, 'Clock call overlay must keep a secondary end-demo action')
assert.strictEqual(clockHangup.copy.title, '结束演示', 'Clock must not promise a real remote hangup without an ACK protocol')
const callHead = clock.modules.find(module => module.id === 'notifyCallHead')
assert.ok(callHead.copy.subtitle.includes('模拟'), 'Clock call overlay must clearly identify the local simulated call')

const demoHangup = notificationDemo.modules.find(module => module.id === 'hangup')
assert.ok(demoHangup, 'Notification demo must keep its local end-demo action')
assert.strictEqual(demoHangup.copy.title, '结束演示')
assert.ok(demoHangup.copy.subtitle.includes('本地'), 'Notification demo must state that ending the call is local only')

console.log('Clock notification surface verified: call actions stay first-screen reachable and local-demo semantics do not overpromise remote hangup')
