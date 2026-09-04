const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const adapter = require('../src/v2/design/adapter')
const freedom = require('../src/v2/design/freedom')
const settingsDetail = require('../src/v2/design/specs/settings_detail')
const settingsMenu = require('../src/v2/design/specs/settings_menu')
const health = require('../src/v2/design/specs/health')
const history = require('../src/v2/design/specs/history')
const historyView = require('../src/v2/design/views/history')
const launcher = require('../src/v2/design/specs/launcher')

const circleProfile = { formFactor: 'circle', logicalHeight: 192 }
const pillProfile = { formFactor: 'pill', logicalHeight: 471 }
const rectProfile = { formFactor: 'rect', logicalHeight: 228 }
const circleScene = { width: 192, height: 192 }
const pillScene = { width: 192, height: 471 }
const rectScene = { width: 192, height: 228 }
const circleSafe = { left: 10, top: 10, width: 172, height: 172, bottom: 182 }
const pillSafe = { left: 12, top: 52, width: 168, height: 367, bottom: 419 }
const rectSafe = { left: 14, top: 10, width: 164, height: 208, bottom: 218 }

assert.strictEqual(adapter.VERSION, '2.2')
assert.ok(adapter.circleChordWidth(circleScene, 24, 3) > adapter.circleChordWidth(circleScene, 10, 3), 'round chord must widen away from the cap')

const circleDetail = settingsDetail.resolve(circleProfile, circleScene, circleSafe)
const pillDetail = settingsDetail.resolve(pillProfile, pillScene, pillSafe)
const rectDetail = settingsDetail.resolve(rectProfile, rectScene, rectSafe)
;[circleDetail, pillDetail, rectDetail].forEach(plan => {
  assert.strictEqual(plan.freedomLevel, freedom.AUTO)
  assert.strictEqual(plan.designSystem, 'adapter-first-v2.2')
  assert.ok(plan.header.width > 0 && plan.stream.width > 0)
  assert.ok(plan.controls.levelButtonWidth * 3 + plan.cardGap * 2 <= plan.stream.width)
})

assert.ok(circleDetail.header.top >= circleSafe.top, 'L1 adapter may reposition a circle header instead of creating a second template')
assert.ok(pillDetail.controls.statusCardHeight > circleDetail.controls.statusCardHeight, 'height adaptation is independent from width adaptation')

const menuSource = read('src/v2/design/specs/settings_menu.js')
assert.ok(!menuSource.includes('circleCapacity'), 'Settings must not keep a screenshot-specific Circle layout branch')
assert.ok(!menuSource.includes("shape === 'circle'"), 'Settings geometry should be solved by L1 Adapter')

const vibrationPage = read('src/pages/settings/vibration/vibration.ux')
assert.ok(!vibrationPage.includes('applyShape('), 'Vibration must not keep three form-factor code paths')
assert.ok(!vibrationPage.includes('shape-pill'), 'Vibration styling must consume one L1 plan')

const healthSpecSource = read('src/v2/design/specs/health.js')
const healthPage = read('src/pages/heartrate/heartrate.ux')
const circleHealth = health.resolve(circleProfile, circleScene, circleSafe)
assert.strictEqual(health.freedomLevel, freedom.AUTO)
assert.ok(!healthSpecSource.includes("plan.shape ==="), 'Health L1 spec must not choose three product surfaces')
assert.ok(!healthPage.includes('isCircle') && !healthPage.includes('isPill') && !healthPage.includes('isRect'), 'Health must render one canonical component tree')
assert.strictEqual((healthPage.match(/class="health-stream"/g) || []).length, 1, 'Health should have one L1 stream')
assert.strictEqual(circleHealth.stream.width, 136, 'Circle Health should use one narrower canonical stream rather than letting text hit the round mask')
assert.ok(circleHealth.detailHeight >= circleHealth.cardPaddingY * 2 + circleHealth.labelLineHeight + circleHealth.chartHeight + circleHealth.metaLineHeight + 8, 'Health detail cards must reserve a complete footer line box')
assert.ok(circleHealth.scrollPaddingBottom >= 24, 'Health scroll tail must let a round-screen footer move into a readable chord')

const historyPage = read('src/pages/history/history.ux')
const historySpec = history.resolve(pillProfile, pillScene, pillSafe)
const circleHistory = history.resolve(circleProfile, circleScene, circleSafe)
assert.strictEqual(history.freedomLevel, freedom.ASSISTED)
assert.strictEqual(historySpec.trendMode, 'comparative-row')
assert.strictEqual(circleHistory.trendMode, 'compact-column')
assert.ok(circleHistory.chartHeight >= 50, 'The reference step chart needs a real vertical comparison area')
assert.ok(circleHistory.trendHeight >= 110, 'The column chart must reserve value, weekday and date labels under every bar')
assert.strictEqual((historyPage.match(/class="history-stream"/g) || []).length, 1, 'History shell must be shared')
assert.ok(historyPage.includes("trendMode === 'compact-column'") && historyPage.includes("trendMode === 'comparative-row'"), 'Only the local trend renderer should vary at L2')
assert.ok(historyPage.includes('历史步数') && historyPage.includes('column-value') && historyPage.includes('column-weekday') && historyPage.includes('column-date'), 'Compact trend must match the requested seven-bar step history composition')
assert.ok(!historyPage.includes('isCircle') && !historyPage.includes('isPill') && !historyPage.includes('isRect'), 'History must not duplicate whole-page templates')

const projected = historyView.project({ records: [
  { date: '2026-08-10', steps: 1037 },
  { date: '2026-08-11', steps: 4953 }
] }, circleHistory)
assert.strictEqual(projected.bars[0].columnStepsText, '1037')
assert.strictEqual(projected.bars[0].weekdayText, '周一')
assert.strictEqual(projected.bars[0].dateText, '8.10')
assert.strictEqual(projected.bars[0].color, '#32ADE6')

assert.strictEqual(settingsMenu.freedomLevel, freedom.AUTO, 'Settings menu remains L1')
assert.strictEqual(launcher.freedomLevel, freedom.FREE, 'Launcher remains L3 because its interaction model differs by form factor')

console.log('Adapter-first v2.2 verified: L1 adapts geometry, L2 varies local expression, L3 keeps independent surfaces')
