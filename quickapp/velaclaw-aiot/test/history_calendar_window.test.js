const assert = require('assert')
const fs = require('fs')
const path = require('path')
const dayWindow = require('../src/domain/calendar/day_window')

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

console.log('History calendar window verified: only real records inside today-6..today survive and gaps are not fabricated')
