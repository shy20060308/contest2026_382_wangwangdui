const assert = require('assert')
const fs = require('fs')
const path = require('path')
const freeSurface = require('../src/presentation/layout/free_surface')
const todayLayout = require('../src/presentation/layout/specs/today')
const safeArea = require('../src/common/safe_area')

const root = path.resolve(__dirname, '..')
const page = fs.readFileSync(path.join(root, 'src/pages/today/today.ux'), 'utf8')

function profile(shape, height) {
  return { formFactor: shape, logicalHeight: height }
}

const circle = freeSurface.resolve(profile('circle', 192), todayLayout)
const pill = freeSurface.resolve(profile('pill', 490), todayLayout)
const rect = freeSurface.resolve(profile('rect', 228), todayLayout)

assert.strictEqual(circle.freedomLevel, 2)
assert.strictEqual(circle.strategy, 'assisted')
assert.strictEqual(circle.surface, 'circle-dual-page')
assert.strictEqual(circle.pageSize, 2)
assert.strictEqual(circle.tokens.calendar, true)
assert.strictEqual(safeArea.fitsInCircle(192, 28, 31, 136, 130), true, 'circle Today surface must remain inside the shared safe band')

assert.strictEqual(pill.surface, 'pill-month-gallery')
assert.strictEqual(pill.pageSize, 2)
assert.strictEqual(pill.tokens.calendarVariant, 'gallery')
assert.ok(page.includes('.pill-month-number'), 'pill must own a large month-number visual language')
assert.ok(page.includes('.pill-calendar-card'), 'pill must own a dedicated full month card')
assert.ok(page.includes('.pill-week-row { width: 154px;'), 'pill weekday row must use the shared seven-column grid width')
assert.ok(page.includes('.pill-week { width: 22px;'), 'pill weekday labels must match calendar column width')
assert.ok(page.includes('.pill-calendar-grid { width: 154px;'), 'pill dates must use the same seven-column grid width')
assert.ok(page.includes('.pill-calendar-cell { width: 22px;'), 'pill dates must align one-to-one with weekday columns')
assert.ok(page.includes('width: 168px; height: 198px'), 'pill month card should deliberately use tall-screen space without overflowing')
assert.ok(!page.includes('border-bottom-width: 1px'), 'pill month hero must not render the accidental framed divider')
assert.ok(page.includes('@touchstart="handlePillTouchStart"'), 'pill surfaces must own raw touch gestures')
assert.ok(page.includes('@touchmove="handlePillTouchMove"'), 'pill surfaces must consume vertical movement rather than scroll')
assert.ok(page.includes('if (!event || this.isPillSurface) return'), 'root swipe handler must not double-handle pill gestures')
assert.ok(page.includes('this.changeCalendarMonth(deltaY < 0 ? 1 : -1)'), 'pill vertical touch gestures must switch month')

assert.strictEqual(rect.surface, 'rect-calendar-dashboard')
assert.strictEqual(rect.pageSize, 1)
assert.strictEqual(rect.tokens.calendarVariant, 'dashboard')
assert.ok(page.includes('.rect-metric-strip'), 'rect Today should use a horizontal metric dashboard')
assert.ok(page.includes('.rect-calendar-grid'), 'rect Today must retain calendar capability')

assert.ok(page.includes("../../common/calendar_utils"), 'all surfaces must reuse one calendar engine')
assert.ok(page.includes("../../domain/activity/store"), 'all surfaces must reuse one activity state source')
assert.ok(page.includes("../../domain/health/store"), 'all surfaces must reuse one health state source')
assert.ok(page.includes('calendarUtils.buildMonth'), 'month building must remain shared functionality')
assert.ok(page.includes('calendarUtils.shiftMonth'), 'month navigation must remain shared functionality')
assert.ok(!page.includes('profile.isCircle') && !page.includes('profile.isPill'), 'Today must consume surfaces rather than shape branching')
assert.ok(!page.includes('@media (shape:'), 'Today top-level design must not regress to shape CSS')

console.log('Today L2 verified: pill calendar alignment/gestures and shared calendar capability are locked')
