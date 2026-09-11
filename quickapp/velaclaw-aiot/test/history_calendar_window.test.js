const assert = require('assert')
const fs = require('fs')
const path = require('path')
const dayWindow = require('../src/domain/calendar/day_window')
const summaryCore = require('../src/product/features/history/summary_core')
const scene = require('../src/product/design/scene')
const surfaceRuntime = require('../src/product/frontend/runtime/surface_runtime')
const historySurface = require('../src/product/frontend/surfaces/history.json')

const root = path.resolve(__dirname, '..')
const repositorySource = fs.readFileSync(path.join(root, 'src/domain/history/repository.js'), 'utf8')

assert.strictEqual(dayWindow.dateKey(new Date(2026, 8, 12, 23, 59)), '2026-09-12')
assert.strictEqual(dayWindow.shiftDateKey('2026-03-01', -1), '2026-02-28')
assert.strictEqual(dayWindow.shiftDateKey('2026-01-01', -1), '2025-12-31')
assert.strictEqual(dayWindow.parseDateKey('2026-02-29'), null, 'invalid calendar dates must not pass syntax-only validation')
assert.ok(dayWindow.parseDateKey('2028-02-29'))

const records = [
  { date: '2026-09-01', steps: 100 },
  { date: '2026-09-05', steps: 500 },
  { date: '2026-09-06', steps: 600 },
  { date: '2026-09-08', steps: 800 },
  { date: '2026-09-12', steps: 1200 },
  { date: '2026-09-13', steps: 1300 }
]
const recent = dayWindow.filterRecent(records, '2026-09-12', 7)
assert.deepStrictEqual(recent.map(function (item) { return item.date }), ['2026-09-06', '2026-09-08', '2026-09-12'])
assert.strictEqual(recent.length, 3, 'F05: missing natural days must remain missing rather than fabricated as zero records')
assert.strictEqual(dayWindow.inRecentWindow('2026-09-06', '2026-09-12', 7), true)
assert.strictEqual(dayWindow.inRecentWindow('2026-09-05', '2026-09-12', 7), false)
assert.strictEqual(dayWindow.inRecentWindow('2026-09-13', '2026-09-12', 7), false)

assert.ok(repositorySource.includes("require('../calendar/day_window')"), 'History repository must use the shared calendar-day window helper')
assert.ok(repositorySource.includes('dayWindow.filterRecent'), 'History persistence must prune by calendar range, not record count')
assert.ok(!repositorySource.includes('while (result.length > HISTORY_DAYS)'), 'History must not define seven days as the last seven records')
assert.ok(repositorySource.includes('Duplicate V4 history date:'), 'History must reject duplicate same-day records rather than consume multiple day slots')

const storedOnly = [
  { date: '2026-09-06', steps: 600, goalPercent: 10, avgHeartRate: null },
  { date: '2026-09-08', steps: 800, goalPercent: 20, avgHeartRate: null }
]
const missingToday = summaryCore.summarize(storedOnly, '2026-09-12')
assert.strictEqual(missingToday.todaySteps, null, 'last stored record must not be relabeled as today')
assert.strictEqual(missingToday.goalPercent, null, 'today goal must be unknown when today has no record')
assert.strictEqual(missingToday.avgSteps, 700, 'record average may summarize only the real records in the seven-day window')
assert.strictEqual(missingToday.bestSteps, 800)

const withToday = summaryCore.summarize(storedOnly.concat([{ date: '2026-09-12', steps: 1200, goalPercent: 50, avgHeartRate: null }]), '2026-09-12')
assert.strictEqual(withToday.todaySteps, 1200)
assert.strictEqual(withToday.goalPercent, 50)

const profile = { formFactor: 'rect', screenWidth: 432, screenHeight: 514, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
const host = scene.resolve(profile)
const safe = scene.safe(profile, host)
const plan = surfaceRuntime.resolve(historySurface, profile, host, safe, missingToday)
assert.strictEqual(plan.flowMetricItems.filter(function (item) { return item.id === 'summary-today' })[0].value, '--')
assert.strictEqual(plan.flowHeaders[0].trailing, '--')
assert.strictEqual(plan.flowMetricItems.filter(function (item) { return item.id === 'insights-goal' })[0].value, '--')
assert.ok(plan.flowColumnBars.every(function (item) { return item.label !== '今' && item.label !== '今天' }), 'missing today must not make the last real record render as today')
assert.strictEqual(historySurface.modules[1].props.items[1].copy.label, '有记录均值')
assert.strictEqual(historySurface.modules[2].copy.todayCompactLabel, undefined)
assert.strictEqual(historySurface.modules[2].copy.todayLabel, undefined)
assert.strictEqual(historySurface.modules[2].tokens.activeColor, historySurface.modules[2].tokens.inactiveColor, 'last record must not receive fake-today highlight color')

console.log('History calendar window verified: real records stay inside today-6..today and missing today remains visibly unknown')
