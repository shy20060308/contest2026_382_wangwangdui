const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

const platform = read('src/platform/vela/health.js')
const domain = read('src/domain/health/store.js')
const legacy = read('src/common/health_domain.js')
const today = read('src/pages/today/today.ux')
const healthPage = read('src/pages/heartrate/heartrate.ux')

expect(platform.includes("from '@service.health'"), 'only platform health adapter should import @service.health')
expect(domain.includes("../../platform/vela/health"), 'health domain must consume the platform adapter')
expect(!domain.includes('watch_data'), 'health domain must not depend on watch_data compatibility layer')
expect(domain.includes('heartRateChanged'), 'health domain must expose heart-rate dirty state')
expect(domain.includes('spo2Changed'), 'health domain must expose SpO2 dirty state')
expect(domain.includes('stressChanged'), 'health domain must expose stress dirty state')

;['circle', 'pill', 'rect', 'screenWidth', 'viewport', 'px'].forEach(function (token) {
  expect(!domain.includes(token), 'health domain must stay presentation-agnostic: found ' + token)
})

expect(legacy.includes("../domain/health/store"), 'legacy health entry must delegate to the new domain store')
expect(!platform.includes('watch_data'), 'platform adapter must not depend on application state')

// Today has been fully migrated and must consume the domain directly.
expect(today.includes("import healthStore from '../../domain/health/store'"), 'today must consume health store directly')
expect(today.includes('healthStore.subscribe(this.healthListener)'), 'today must subscribe through health store')
expect(today.includes('healthStore.unsubscribe(this.healthListener)'), 'today must release health store subscription')
expect(!today.includes("../../common/health_domain"), 'today must not regress to the legacy health bridge')
expect(!today.includes('watch_data'), 'today must not depend on watch_data')

// The dedicated health page is still on the compatibility bridge until its presentation
// status/text logic is migrated in the next page-thinning pass.
expect(healthPage.includes("import healthDomain from '../../common/health_domain'"), 'health page must remain on compatibility entry until migrated')
expect(!healthPage.includes("import healthSampleService from '../../common/health_sample_service'"), 'health page must not import low-level health directly')

expect(!today.includes('lastHeartRateUpdatedAt'), 'today page must not own dirty tracking')
expect(!healthPage.includes('lastHeartRateUpdatedAt'), 'health page must not own heart-rate dirty tracking')
expect(!healthPage.includes('lastSpo2UpdatedAt'), 'health page must not own SpO2 dirty tracking')
expect(!healthPage.includes('lastStressUpdatedAt'), 'health page must not own stress dirty tracking')

console.log('Health architecture boundary verified')
