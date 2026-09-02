/**
 * 圆屏 / 胶囊屏安全区回归校验
 *
 * 旧页面仍按 CSS 流式盒模型检查；已经迁入 Design Engine 的页面直接执行 Layout Spec，
 * 以 Adapter 产出的真实 region plan 为准。后者不再反向解析 CSS magic number。
 */
const fs = require('fs')
const path = require('path')
const safeArea = require('../src/common/safe_area')
const layoutAdapter = require('../src/presentation/layout/adapter')
const workoutLayout = require('../src/presentation/layout/specs/workout')

const root = path.resolve(__dirname, '..')
const errors = []

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '')
}

function extractCircleBlock(source) {
  const marker = source.indexOf('@media (shape: circle)')
  if (marker < 0) return ''
  let depth = 0
  let started = false
  for (let index = marker; index < source.length; index++) {
    const char = source[index]
    if (char === '{') {
      depth++
      started = true
    } else if (char === '}') {
      depth--
      if (started && depth === 0) return source.slice(marker, index + 1)
    }
  }
  return source.slice(marker)
}

function readNumeric(block, selector, property) {
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g
  const valuePattern = new RegExp('(?:^|;)\\s*' + property + '\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px')
  let result = null
  let rule
  while ((rule = rulePattern.exec(block)) !== null) {
    const selectors = rule[1].split(',').map(function (item) {
      return item.trim()
    })
    if (selectors.indexOf(selector) < 0) continue
    const valueMatch = rule[2].match(valuePattern)
    if (valueMatch) result = Number(valueMatch[1])
  }
  return result
}

function readEffective(circleBlock, baseSource, selector, property) {
  const scoped = readNumeric(circleBlock, selector, property)
  if (scoped !== null) return scoped
  return readNumeric(baseSource, selector, property)
}

function readPaddingTop(circleBlock, baseSource, selector) {
  const explicit = readEffective(circleBlock, baseSource, selector, 'padding-top')
  if (explicit !== null) return explicit
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g
  let result = null
  let rule
  while ((rule = rulePattern.exec(circleBlock || baseSource)) !== null) {
    const selectors = rule[1].split(',').map(function (item) {
      return item.trim()
    })
    if (selectors.indexOf(selector) < 0) continue
    const shorthand = rule[2].match(/(?:^|;)\s*padding\s*:\s*(-?\d+)px/)
    if (shorthand) result = Number(shorthand[1])
  }
  return result === null ? 0 : result
}

// Legacy CSS-flow pages. As each page moves to Design Engine it should leave this list.
const CIRCLE_PAGES = [
  {
    page: 'src/pages/today/today.ux',
    root: '.today-page',
    flows: [
      { name: '摘要页', children: ['.summary-page'] },
      { name: '月历页', children: ['.calendar-page'] }
    ]
  },
  {
    page: 'src/pages/settings/settings/settings.ux',
    root: '.settings-page',
    flows: [
      { name: '设置列表', children: ['.top-row', '.settings-list', '.pager-row'] }
    ]
  },
  {
    page: 'src/pages/settings/diagnostics/diagnostics.ux',
    root: '.diagnostics-page',
    flows: [
      { name: '屏幕档案页', children: ['.top-row', '.device-card', '.pager-row'] },
      { name: '能力列表页', children: ['.top-row', '.capability-list', '.pager-row'] }
    ]
  },
  {
    page: 'src/pages/workout_history/workout_history.ux',
    root: '.history-page',
    flows: [
      { name: '运动记录', children: ['.top-row', '.summary-row', '.record-scroll'] },
      { name: '空记录态', children: ['.top-row', '.summary-row', '.empty-state'] }
    ]
  }
]

CIRCLE_PAGES.forEach(function (target) {
  const source = stripComments(fs.readFileSync(path.join(root, target.page), 'utf8'))
  const circleBlock = extractCircleBlock(source)
  if (!circleBlock) {
    errors.push(target.page + ' 缺少 @media (shape: circle) 适配区块')
    return
  }
  const baseSource = source.replace(circleBlock, '')

  target.flows.forEach(function (flow) {
    let cursor = readPaddingTop(circleBlock, baseSource, target.root)

    flow.children.forEach(function (selector) {
      const height = readEffective(circleBlock, baseSource, selector, 'height')
      const width = readEffective(circleBlock, baseSource, selector, 'width')
      const marginTop = readEffective(circleBlock, baseSource, selector, 'margin-top') || 0
      const marginBottom = readEffective(circleBlock, baseSource, selector, 'margin-bottom') || 0

      if (height === null || width === null) {
        errors.push(target.page + ' ' + selector + ' 未声明宽高，无法校验圆屏安全区')
        return
      }

      cursor += marginTop
      const left = Math.round((safeArea.DESIGN_WIDTH - width) / 2)
      if (!safeArea.fitsInCircle(safeArea.DESIGN_WIDTH, left, cursor, width, height)) {
        const band = safeArea.circleBandForWidth(safeArea.DESIGN_WIDTH, width)
        errors.push(
          target.page + ' [' + flow.name + '] ' + selector + ' 超出圆屏安全区：' +
          width + '×' + height + ' 落在 y=' + cursor + '..' + (cursor + height) +
          '，该宽度仅有 y=' + band.top + '..' + band.bottom + ' 可用'
        )
      }
      cursor += height + marginBottom
    })
  })
})

const DESIGN_ENGINE_LAYOUTS = [
  { name: 'Workout L2', spec: workoutLayout }
]

DESIGN_ENGINE_LAYOUTS.forEach(function (target) {
  const plan = layoutAdapter.resolve({ formFactor: 'circle', logicalHeight: 192 }, target.spec)
  if (plan.needsOverride || plan.violations.length) {
    errors.push(target.name + ' Layout Plan 未通过圆屏安全几何：' + JSON.stringify(plan.violations))
  }
})

if (safeArea.capsuleCapInset(192, 168) !== 50) {
  errors.push('胶囊端帽推导偏离真机校准值 50px，请同步复核 test/safe_area.test.js')
}
if (safeArea.inscribedSquare(192) !== 135) {
  errors.push('圆屏内接正方形不再是 135px，蜂巢画布尺寸需要重新推导')
}

if (errors.length > 0) {
  errors.forEach(function (error) {
    console.error('safe-area error: ' + error)
  })
  process.exitCode = 1
} else {
  const legacyFlowCount = CIRCLE_PAGES.reduce(function (total, item) {
    return total + item.flows.length
  }, 0)
  console.log('Checked circle safe-area geometry for ' + legacyFlowCount + ' legacy flows + ' + DESIGN_ENGINE_LAYOUTS.length + ' Design Engine plans')
}
