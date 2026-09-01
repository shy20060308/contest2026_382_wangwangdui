const fs = require('fs')
const path = require('path')
const safeArea = require('../src/common/safe_area')
const viewportMath = require('../src/common/viewport_math')

const root = path.resolve(__dirname, '..')
const applistPath = path.join(root, 'src', 'pages', 'applist', 'applist.ux')
const source = fs.readFileSync(applistPath, 'utf8')

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

function readRuleNumber(selector, property) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rule = source.match(new RegExp(escapedSelector + '\\s*\\{([\\s\\S]*?)\\}'))
  if (!rule) return null
  const value = rule[1].match(new RegExp(property + '\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px'))
  return value ? Number(value[1]) : null
}

function readRootPaddingTop() {
  const rule = source.match(/\.applist-page\s*\{([\s\S]*?)\}/)
  if (!rule) return null
  const padding = rule[1].match(/padding\s*:\s*(-?\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?/)
  return padding ? Number(padding[1]) : null
}

const DESIGN_WIDTH = safeArea.DESIGN_WIDTH
const BAND10_WIDTH = 212
const BAND10_HEIGHT = 520
const BAND10_LOGICAL_HEIGHT = viewportMath.logicalHeight(BAND10_WIDTH, BAND10_HEIGHT, DESIGN_WIDTH)
const BETA_VIEWPORT_TOP = 24

expect(BAND10_LOGICAL_HEIGHT === 471, 'Band 10 logical height must stay 471 at designWidth=192')
expect(source.includes("viewportClass === 'beta-pill-viewport-212'"), 'applist must apply a Band 10 beta-only safe-area compensation class')

const paddingTop = readRootPaddingTop()
const baseTopMargin = readRuleNumber('.top-row', 'margin-top')
const band10TopMargin = readRuleNumber('.band10-top-row', 'margin-top')
const topHeight = readRuleNumber('.top-row', 'height')
const topMarginBottom = readRuleNumber('.top-row', 'margin-bottom')
const listHeight = readRuleNumber('.pill-list', 'height')
const pagerWidth = readRuleNumber('.pager-row', 'width')
const pagerHeight = readRuleNumber('.pager-row', 'height')
const pagerMarginTop = readRuleNumber('.pager-row', 'margin-top') || 0

;[
  ['root padding-top', paddingTop],
  ['base top margin', baseTopMargin],
  ['Band 10 top margin', band10TopMargin],
  ['top-row height', topHeight],
  ['top-row margin-bottom', topMarginBottom],
  ['pill-list height', listHeight],
  ['pager width', pagerWidth],
  ['pager height', pagerHeight]
].forEach(function (entry) {
  expect(entry[1] !== null, 'unable to read applist ' + entry[0])
})

// Band 9 is the golden reference: the normal 50px margin must not move.
expect(baseTopMargin === 50, 'Band 9 applist top margin changed from the golden-reference 50px')

// Beta Band 10 already shifts the whole page down by 24 logical px in screen_profile.
// Compensate that offset locally so the actual content remains at the same logical y
// as the Band 9 design instead of paying the safe top inset twice.
expect(band10TopMargin === Math.max(0, baseTopMargin - BETA_VIEWPORT_TOP), 'Band 10 applist margin must compensate the beta viewport top inset')

const topRowY = BETA_VIEWPORT_TOP + paddingTop + band10TopMargin
const pagerY = topRowY + topHeight + topMarginBottom + listHeight + pagerMarginTop
const pagerBottom = pagerY + pagerHeight

const topSafe = safeArea.capsuleCapInset(DESIGN_WIDTH, 168) + safeArea.COMFORT_PADDING
const pagerBottomInset = Math.max(
  safeArea.capsuleCapInset(DESIGN_WIDTH, pagerWidth) + safeArea.COMFORT_PADDING,
  safeArea.PILL_GESTURE_BAR
)
const pagerSafeBottom = BAND10_LOGICAL_HEIGHT - pagerBottomInset

expect(topRowY >= topSafe, 'Band 10 applist title enters the capsule top curve: y=' + topRowY + ', safeTop=' + topSafe)
expect(pagerBottom <= pagerSafeBottom, 'Band 10 applist pager enters the capsule bottom curve/gesture area: bottom=' + pagerBottom + ', safeBottom=' + pagerSafeBottom)

// Guard the failure mode reported by visual testing: without compensation the old
// 50px margin would place the pager outside the Band 10 safe bottom.
const oldPagerBottom = BETA_VIEWPORT_TOP + paddingTop + baseTopMargin + topHeight + topMarginBottom + listHeight + pagerMarginTop + pagerHeight
expect(oldPagerBottom > pagerSafeBottom, 'regression fixture no longer reproduces the original Band 10 clipping condition')

console.log('Band 10 pill safe-area flow verified: title y=' + topRowY + ', pager bottom=' + pagerBottom + ', safe bottom=' + pagerSafeBottom)
