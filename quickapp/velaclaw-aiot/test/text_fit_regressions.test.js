const assert = require('assert')
const fs = require('fs')
const path = require('path')
const scene = require('../src/v2/design/scene')
const history = require('../src/v2/design/apps/history')
const faces = require('../src/v2/design/apps/faces')

const root = path.join(__dirname, '..')
function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8')
}
function resolved(app, profile) {
  const host = scene.resolve(profile)
  const safe = scene.safeForWidth(profile, app.contentWidth(profile))
  return { safe, plan: app.resolve(profile, host, safe) }
}

const circle = { formFactor: 'circle', logicalHeight: 192, screenWidth: 466, screenHeight: 466 }
const rect = { formFactor: 'rect', logicalHeight: 228, screenWidth: 432, screenHeight: 514 }
const pill = { formFactor: 'pill', logicalHeight: 471, screenWidth: 212, screenHeight: 520 }

const circleHistory = resolved(history, circle).plan
const rectHistory = resolved(history, rect).plan
const pillHistory = resolved(history, pill).plan
assert.ok(circleHistory.insightHeight >= 38, 'Circle History insight cards must preserve three readable text lines')
assert.ok(rectHistory.insightHeight >= 41, 'Rect History insight cards must preserve three readable text lines')
assert.ok(pillHistory.insightHeight >= 42, 'Pill History insight cards must preserve three readable text lines')
assert.ok(pillHistory.cardRadius <= 17, 'Pill History cards must not regress to oversized 20px corners')

const simpleCircle = read('src/components/watchfaces/simple_circle.ux')
const sportCircle = read('src/components/watchfaces/sport_circle.ux')
const dashboardCircle = read('src/components/watchfaces/dashboard_circle.ux')
const sportPill = read('src/components/watchfaces/sport.ux')
const simplePill = read('src/components/watchfaces/simple.ux')
const dashboardPill = read('src/components/watchfaces/dashboard.ux')

assert.ok(simpleCircle.includes('.simple-circle-footer { width: 136px;'), 'Circle Simple footer must reserve the historical 136px metric band')
assert.ok(simpleCircle.includes('.simple-circle-metric { width: 44px;'), 'Circle Simple metrics must keep 44px text width')
assert.ok(sportCircle.includes('.circle-metric-row { width: 136px;'), 'Circle Sport metric band must not collapse back to 108px')
assert.ok(sportCircle.includes('.circle-metric { width: 44px;'), 'Circle Sport metrics must keep 44px text width')
assert.ok(dashboardCircle.includes('border-radius: 12px;'), 'Circle Dashboard cards must keep the reduced corner radius')
assert.ok(dashboardCircle.includes('.dashboard-circle-step { font-size: 12px;'), 'Circle Dashboard long step values need their compact type size')
assert.ok(sportPill.includes('.step-current { width: 118px; font-size: 15px;'), 'Pill Sport long step values must stay compact')
assert.ok(simplePill.includes('.simple-step-value { font-size: 13px;'), 'Pill Simple long step values must stay compact')
assert.ok(dashboardPill.includes('.dash-step-value { width: 86px; font-size: 16px;'), 'Pill Dashboard long step values must stay compact')

const circleFaces = resolved(faces, circle)
assert.strictEqual(faces.layout.circle.header.top, 10, 'Circle watchface selector recipe must keep the historical 10px safe-area offset')
assert.strictEqual(circleFaces.plan.header.top - circleFaces.safe.top, 10, 'Circle watchface selector header must stay 10px below the safe-area cap')

console.log('Text-fit regressions verified: readable History cards, compact corners and long-value-safe watchfaces')
