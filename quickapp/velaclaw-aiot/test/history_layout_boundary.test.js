const fs = require('fs')
const path = require('path')
const assert = require('assert')

const root = path.resolve(__dirname, '..')
const read = function (name) { return fs.readFileSync(path.join(root, name), 'utf8') }

const page = read('src/pages/history/history.ux')
const mapper = read('src/presentation/mappers/history.js')

assert.ok(page.includes("../../domain/history/repository"), 'history page must read history domain directly')
assert.ok(page.includes("../../presentation/mappers/history"), 'history page must map presentation explicitly')
assert.ok(!page.includes('watch_data'), 'history page must not depend on watch_data')

assert.ok(/\.record-scroll\s*\{[^}]*flex-direction\s*:\s*column/m.test(page), 'history records must stack vertically')
assert.ok(/@media \(shape: circle\)[\s\S]*\.record-item\s*\{[^}]*height\s*:\s*36px/m.test(page), 'circle history records need compact full-width cards')

assert.ok(mapper.includes('COMPACT_CHART_MAX_HEIGHT = 58'), 'circle history bars must respect the 58px bar space')
assert.ok(mapper.includes("toFixed(1)"), 'compact step labels must retain one decimal when useful')
assert.ok(mapper.includes("formatCompactDay"), 'circle chart must use short day labels')
assert.ok(!mapper.includes("Math.round(item.steps / 1000) + 'k'"), 'history must not collapse nearby days into the same rounded whole-k label')

console.log('History circle composition verified: readable labels, vertical records, bounded bars')
