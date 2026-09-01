const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

const domain = read('src/common/health_domain.js')
const today = read('src/pages/today/today.ux')
const healthPage = read('src/pages/heartrate/heartrate.ux')

expect(domain.includes("import healthSampleService from './health_sample_service'"), 'health_domain must own the low-level health service')
expect(domain.includes("import watchData from './watch_data'"), 'health_domain must own watchData synchronization')
expect(domain.includes('watchData.applyHeartRate'), 'health_domain must synchronize new heart-rate samples into watchData')
expect(domain.includes('heartRateChanged'), 'health_domain must expose heart-rate dirty state')
expect(domain.includes('spo2Changed'), 'health_domain must expose SpO2 dirty state')
expect(domain.includes('stressChanged'), 'health_domain must expose stress dirty state')

;['circle', 'pill', 'rect', 'screenWidth', 'viewport'].forEach(function (token) {
  expect(!domain.includes(token), 'health_domain must stay shape-agnostic: found ' + token)
})

;[
  ['today', today],
  ['heartrate', healthPage]
].forEach(function (entry) {
  const name = entry[0]
  const source = entry[1]
  expect(source.includes("import healthDomain from '../../common/health_domain'"), name + ' must consume health_domain')
  expect(!source.includes("import healthSampleService from '../../common/health_sample_service'"), name + ' must not import health_sample_service directly')
  expect(source.includes('healthDomain.start(this.healthListener)'), name + ' must subscribe through health_domain')
  expect(source.includes('healthDomain.stop(this.healthListener)'), name + ' must unsubscribe through health_domain')
})

expect(!today.includes('lastHeartRateUpdatedAt'), 'today page must not own heart-rate dirty tracking')
expect(!today.includes('watchData.applyHeartRate'), 'today page must not synchronize health samples itself')
expect(!healthPage.includes('lastHeartRateUpdatedAt'), 'health page must not own heart-rate dirty tracking')
expect(!healthPage.includes('lastSpo2UpdatedAt'), 'health page must not own SpO2 dirty tracking')
expect(!healthPage.includes('lastStressUpdatedAt'), 'health page must not own stress dirty tracking')

console.log('Health domain boundary verified')
