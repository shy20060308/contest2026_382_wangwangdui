const fs = require('fs')
const path = require('path')
const assert = require('assert')

const root = path.resolve(__dirname, '..')
const watchData = fs.readFileSync(path.join(root, 'src', 'common', 'watch_data.js'), 'utf8')
const tallFace = fs.readFileSync(path.join(root, 'src', 'components', 'watchfaces', 'dashboard.ux'), 'utf8')
const compactFace = fs.readFileSync(path.join(root, 'src', 'components', 'watchfaces', 'dashboard_circle.ux'), 'utf8')

assert.ok(!watchData.includes('circleBarHeight'), 'watch_data must not expose circle-specific chart geometry')
assert.ok(!watchData.includes('barHeight:'), 'watch_data must not expose pixel bar heights')
assert.ok(!watchData.includes('pillHeights'), 'watch_data must not calculate pill presentation geometry')
assert.ok(!watchData.includes('circleHeights'), 'watch_data must not calculate circle presentation geometry')
assert.ok(watchData.includes("result.push({ value: state.heartRateData[i].value })"), 'watch_data snapshot must retain semantic heart-rate samples')

assert.ok(tallFace.includes('sampleBarHeight(this.heartRateData, index, 4, 28, 8)'), 'tall dashboard must own its 28px chart geometry')
assert.ok(compactFace.includes('sampleBarHeight(this.heartRateData, index, 4, 18, 8)'), 'compact dashboard must own its 18px chart geometry')

console.log('watch_data boundary verified: semantic samples only; chart geometry stays in presentation components')
