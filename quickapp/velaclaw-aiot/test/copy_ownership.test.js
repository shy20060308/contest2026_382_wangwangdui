const assert = require('assert')
const fs = require('fs')
const path = require('path')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const experienceRuntime = require('../src/product/frontend/runtime/experience_runtime')
const historySurface = require('../src/product/frontend/surfaces/history.json')
const clockSurface = require('../src/product/frontend/surfaces/clock.json')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const surfaceRuntimeSource = read('src/product/frontend/runtime/surface_runtime.js')
const experienceRuntimeSource = read('src/product/frontend/runtime/experience_runtime.js')

const weekdayCopy = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
weekdayCopy.forEach(function (label) {
  assert.ok(!surfaceRuntimeSource.includes(label), 'generic Surface runtime must not own weekday copy: ' + label)
  assert.ok(!experienceRuntimeSource.includes(label), 'generic Experience runtime must not own weekday copy: ' + label)
})
assert.ok(surfaceRuntimeSource.includes("format === 'weekday-index'"), 'Surface runtime must expose semantic weekday index formatting')
assert.ok(experienceRuntimeSource.includes("format === 'weekday-index'"), 'Stage runtime must expose semantic weekday index formatting')
assert.ok(!surfaceRuntimeSource.includes("format === 'weekday'") && !surfaceRuntimeSource.includes("format === 'weekday-short'"), 'legacy weekday copy-producing formatters must stay removed from Surface runtime')
assert.ok(!experienceRuntimeSource.includes("format === 'weekday'"), 'legacy weekday copy-producing formatter must stay removed from Stage runtime')

const historyTrend = historySurface.modules.filter(function (module) { return module.id === 'trend' })[0]
assert.strictEqual(historyTrend.props.labelFormat, 'weekday-index')
assert.deepStrictEqual(historyTrend.props.labelMap, { '0': '日', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六' })

const clockWeekdayMap = clockSurface.experience.base.stage.valueMaps.weekday
assert.deepStrictEqual(clockWeekdayMap, { '0': '周日', '1': '周一', '2': '周二', '3': '周三', '4': '周四', '5': '周五', '6': '周六' })
;['circle', 'pill', 'rect'].forEach(function (shape) {
  const stage = clockSurface.experience[shape].stage
  Object.keys(stage.variants).forEach(function (faceId) {
    const elements = stage.variants[faceId].elements || []
    elements.forEach(function (element) {
      if (element.props && element.props.valueFormat === 'weekday-index') assert.strictEqual(element.props.valueMap, 'weekday', shape + '/' + faceId + '/' + element.id + ' must reference JSON-owned weekday map')
    })
  })
})

const circleProfile = { formFactor: 'circle', screenWidth: 192, screenHeight: 192, safeInsets: { left: 0, top: 0, right: 0, bottom: 0, gestureBar: 0 } }
const circleHost = scene.resolve(circleProfile)
const circleSafe = scene.safe(circleProfile, circleHost)
const sundayTimestamp = new Date(2026, 8, 6, 12, 0, 0).getTime()
const clockPlan = experienceRuntime.decorate({}, clockSurface, circleProfile, circleHost, circleSafe, {
  clockVisible: true,
  faceId: 'sport',
  timestamp: sundayTimestamp,
  steps: 1234,
  currentHeartRate: 72,
  goalPercent: 50,
  batteryPercent: 80
})
const clockDate = clockPlan.stage.texts.filter(function (item) { return item.id === 'date' })[0]
assert.strictEqual(clockDate.text, '周日 · ACTIVE', 'Clock rendered copy must remain unchanged after weekday ownership migration')

const rectProfile = { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
const rectHost = scene.resolve(rectProfile)
const rectSafe = scene.safe(rectProfile, rectHost)
const rectHistory = surfaceRuntime.resolve(historySurface, rectProfile, rectHost, rectSafe, {
  todaySteps: 200,
  avgSteps: 150,
  bestSteps: 200,
  bestDate: '2026-09-07',
  avgHeartRate: null,
  goalPercent: 50,
  records: [{ date: '2026-09-06', steps: 100 }, { date: '2026-09-07', steps: 200 }]
})
assert.strictEqual(rectHistory.flowColumnBars[0].label, '日')
assert.strictEqual(rectHistory.flowColumnBars[1].label, '今')

const pillProfile = { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } }
const pillHost = scene.resolve(pillProfile)
const pillSafe = scene.safe(pillProfile, pillHost)
const pillHistory = surfaceRuntime.resolve(historySurface, pillProfile, pillHost, pillSafe, {
  todaySteps: 200,
  avgSteps: 150,
  bestSteps: 200,
  bestDate: '2026-09-07',
  avgHeartRate: null,
  goalPercent: 50,
  records: [{ date: '2026-09-06', steps: 100 }, { date: '2026-09-07', steps: 200 }]
})
assert.strictEqual(pillHistory.flowRowBars[0].label, '日')
assert.strictEqual(pillHistory.flowRowBars[1].label, '今天')

console.log('Copy ownership verified: weekday computation stays generic while Clock/History display labels remain Surface JSON-owned')
