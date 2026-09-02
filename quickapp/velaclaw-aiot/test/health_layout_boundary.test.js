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

expect(today.includes('steps-metric-value'), 'circle summary needs a dedicated steps value class')
expect(hasCssRule(today, '.steps-metric-value', 'width', '37px'), 'circle steps value must reserve enough width for formatted values such as 4,567')
expect(hasCssRule(today, '.steps-metric-value', 'left', '18px'), 'circle steps value must keep its widened left offset')
expect(hasCssRule(today, '.steps-metric-unit', 'left', '56px'), 'circle steps unit must remain outside the widened value box')
expect(hasCssRule(today, '.steps-metric-unit', 'width', '8px'), 'circle steps unit must keep its dedicated width')

console.log('健康页面裁切边界检查通过')
