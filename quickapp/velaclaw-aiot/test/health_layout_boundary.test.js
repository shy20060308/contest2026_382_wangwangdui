const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const health = fs.readFileSync(path.join(root, 'src/pages/heartrate/heartrate.ux'), 'utf8')
const today = fs.readFileSync(path.join(root, 'src/pages/today/today.ux'), 'utf8')

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

function hasCssRule(source, selector, property, value) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rule = new RegExp(escapedSelector + '\\s*\\{[^}]*' + escapedProperty + '\\s*:\\s*' + escapedValue + '\\s*;?[^}]*\\}', 'm')
  return rule.test(source)
}

expect(health.includes("makeMetricBars(this.heartTrendValues || [], 8, '#7A2436', '#FF375F', 29)"), 'heart trend should keep the 29px scale')
expect(health.includes("makeMetricBars(this.spo2TrendValues || [], 4, '#245566', '#5AC8FA', 24)"), 'SpO2 compact trend must cap bars at 24px')
expect(health.includes("makeMetricBars(this.stressTrendValues || [], 10, '#542966', '#BF5AF2', 24)"), 'stress compact trend must cap bars at 24px')
expect(hasCssRule(health, '.compact-trend', 'height', '24px'), 'compact trend container must stay 24px high')

// Today is now an L2 three-surface design. Long formatted activity values are handled
// by the pill summary's dedicated value box + adaptive typography instead of the old
// circle-only absolute-offset classes.
expect(today.includes('pill-steps-value'), 'pill summary needs a dedicated steps value class')
expect(hasCssRule(today, '.pill-steps-value', 'width', '58px'), 'pill steps value must reserve the full metric-card content width')
expect(today.includes('pillStepsFontSize'), 'pill summary must expose adaptive steps typography')
expect(today.includes('metricFontSize(view.stepsText)'), 'formatted step length must drive pill typography')
expect(today.includes('lines: 1'), 'pill metric values must stay on one line')

console.log('健康页面裁切边界检查通过')
