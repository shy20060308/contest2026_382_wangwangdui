const fs = require('fs')
const path = require('path')
const safeArea = require('../src/common/safe_area')
const viewportMath = require('../src/common/viewport_math')
const pageViewportPolicy = require('../src/common/page_viewport_policy')

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
const BETA_VIEWPORT_HEIGHT = BAND10_LOGICAL_HEIGHT - BETA_VIEWPORT_TOP

expect(BAND10_LOGICAL_HEIGHT === 471, 'Band 10 logical height must stay 471 at designWidth=192')

const baseProfile = {
  viewportClass: 'beta-pill-viewport-212',
  viewportPosition: 'absolute',
  viewportLeft: '0px',
  viewportTop: BETA_VIEWPORT_TOP + 'px',
  viewportWidth: '192px',
  viewportHeight: BETA_VIEWPORT_HEIGHT + 'px',
  isBetaPillViewport: true,
  screenWidth: BAND10_WIDTH
}

const applistViewport = pageViewportPolicy.resolve(baseProfile, {
  $page: { path: 'pages/applist' }
})
const settingsViewport = pageViewportPolicy.resolve(baseProfile, {
  $page: { path: 'pages/settings/settings' }
})

expect(applistViewport.viewportTop === '0px', 'Band 10 applist must remove the duplicate beta top offset')
expect(applistViewport.viewportHeight === BAND10_LOGICAL_HEIGHT + 'px', 'Band 10 applist must restore the full logical height')
expect(settingsViewport.viewportTop === BETA_VIEWPORT_TOP + 'px', 'other Band 10 pages must retain the beta top inset')
expect(settingsViewport.viewportHeight === BETA_VIEWPORT_HEIGHT + 'px', 'other Band 10 pages must retain the beta viewport height')

const band9Profile = Object.assign({}, baseProfile, {
  viewportClass: 'beta-pill-viewport-192',
  screenWidth: 192
})
const band9Viewport = pageViewportPolicy.resolve(band9Profile, {
  $page: { path: 'pages/applist' }
})
expect(band9Viewport.viewportTop === BETA_VIEWPORT_TOP + 'px', 'Band 9 golden-reference viewport must not change')

const paddingTop = readRootPaddingTop()
const topMargin = readRuleNumber('.top-row', 'margin-top')
const topHeight = readRuleNumber('.top-row', 'height')
const topMarginBottom = readRuleNumber('.top-row', 'margin-bottom')
const listHeight = readRuleNumber('.pill-list', 'height')
const pagerWidth = readRuleNumber('.pager-row', 'width')
const pagerHeight = readRuleNumber('.pager-row', 'height')
const pagerMarginTop = readRuleNumber('.pager-row', 'margin-top') || 0

;[
  ['root padding-top', paddingTop],
  ['top margin', topMargin],
  ['top-row height', topHeight],
  ['top-row margin-bottom', topMarginBottom],
  ['pill-list height', listHeight],
  ['pager width', pagerWidth],
  ['pager height', pagerHeight]
].forEach(function (entry) {
  expect(entry[1] !== null, 'unable to read applist ' + entry[0])
})

// Keep the existing page design untouched. The compatibility layer changes only
// the root viewport, so the Band 9 reference geometry remains the source of truth.
expect(topMargin === 50, 'applist golden-reference top margin must remain 50px')

const topRowY = paddingTop + topMargin
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

// Reproduce the old runtime placement: adding the beta 24px root offset to the
// unchanged page geometry pushes the pager outside the safe bottom.
const oldPagerBottom = BETA_VIEWPORT_TOP + pagerBottom
expect(oldPagerBottom > pagerSafeBottom, 'regression fixture no longer reproduces the original Band 10 clipping condition')

console.log('Band 10 pill safe-area flow verified: title y=' + topRowY + ', pager bottom=' + pagerBottom + ', safe bottom=' + pagerSafeBottom)
