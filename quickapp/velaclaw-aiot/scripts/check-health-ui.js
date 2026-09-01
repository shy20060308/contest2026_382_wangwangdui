const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = function (name) { return fs.readFileSync(path.join(root, name), 'utf8') }
const manifest = JSON.parse(read('src/manifest.json'))
const pageSource = read('src/pages/heartrate/heartrate.ux')
const todaySource = read('src/pages/today/today.ux')
const clockSource = read('src/pages/clock/clock.ux')
const platformSource = read('src/platform/vela/health.js')
const domainSource = read('src/domain/health/store.js')
const watchDataSource = read('src/common/watch_data.js')
const metricsSource = read('src/common/health_metrics.js')
const metricsTestSource = read('test/health_metrics.test.js')
const errors = []

function requireCondition(condition, message) {
  if (!condition) errors.push(message)
}

const featureNames = new Set((manifest.features || []).map(function (feature) { return feature.name }))
const permissionNames = new Set((manifest.permissions || []).map(function (permission) { return permission.name }))

requireCondition(featureNames.has('service.health'), 'manifest must declare service.health')
requireCondition(permissionNames.has('hapjs.permission.HEALTH'), 'manifest must request hapjs.permission.HEALTH')
requireCondition(!manifest.config.background, 'health sampling must remain foreground-only')

;['HEART_RATE', 'SPO2', 'STRESS'].forEach(function (dataType) {
  requireCondition(platformSource.includes('health.DATA_TYPES.' + dataType), 'platform health adapter must resolve ' + dataType)
})
requireCondition(platformSource.includes('health.getRecentSamples'), 'platform health adapter must load recent samples')
requireCondition(platformSource.includes('health.subscribeSample'), 'platform health adapter must subscribe to live samples')
requireCondition(platformSource.includes('health.unsubscribeSample'), 'platform health adapter must release subscriptions')
requireCondition(platformSource.includes('updateFallbackValues'), 'platform health adapter must provide per-metric fallback')
requireCondition(platformSource.includes('heartRateUpdatedAt'), 'platform health adapter must timestamp heart-rate samples')
requireCondition(platformSource.includes('heartRateErrorCode'), 'platform health adapter must expose per-metric errors')

requireCondition(domainSource.includes("../../platform/vela/health"), 'health domain must consume the platform adapter')
requireCondition(domainSource.includes('heartRateChanged'), 'health domain must own heart-rate dirty tracking')
requireCondition(domainSource.includes('spo2Changed'), 'health domain must own SpO2 dirty tracking')
requireCondition(domainSource.includes('stressChanged'), 'health domain must own stress dirty tracking')
requireCondition(!domainSource.includes('watch_data'), 'health domain must not depend on watch_data')

;['心率', '血氧', '压力'].forEach(function (label) {
  requireCondition(pageSource.includes(label), 'health card is missing: ' + label)
})
requireCondition(pageSource.includes('healthDomain.start(this.healthListener)'), 'health page must subscribe through the health domain')
requireCondition(pageSource.includes('healthDomain.stop(this.healthListener)'), 'health page must release the health domain subscription')
requireCondition(pageSource.includes('scroll-y="true"'), 'health cards must remain vertically scrollable')
requireCondition(pageSource.includes('{{ viewportClass }}'), 'health page must use the shared viewport')
requireCondition(pageSource.includes('pageViewport.bind('), 'health page must bind the shared viewport')
requireCondition(pageSource.includes('healthMetrics.barHeights'), 'health trends must use adaptive bar heights')
requireCondition(pageSource.includes('spo2Trend'), 'SpO2 card must include a sample trend')
requireCondition(pageSource.includes('stressTrend'), 'stress card must include a sample trend')
requireCondition(pageSource.includes('stressAvg'), 'stress card must expose window statistics')
requireCondition(!pageSource.includes('lastHeartRateUpdatedAt'), 'health page must not own heart-rate dirty tracking')
requireCondition(!pageSource.includes('lastSpo2UpdatedAt'), 'health page must not own SpO2 dirty tracking')
requireCondition(!pageSource.includes('lastStressUpdatedAt'), 'health page must not own stress dirty tracking')

requireCondition(todaySource.includes('healthDomain.start(this.healthListener)'), 'today page must subscribe through the health domain')
requireCondition(todaySource.includes('healthDomain.stop(this.healthListener)'), 'today page must release the health domain subscription')
requireCondition(!todaySource.includes('watchData.applyHeartRate'), 'today page must not synchronize samples itself')

// clock is the last legacy low-power consumer; its lifecycle remains the golden reference until power migration.
requireCondition(clockSource.includes('healthSampleService.start(this.watchFaceHealthListener)'), 'watch face must subscribe while ACTIVE/DIM')
requireCondition(clockSource.includes('healthSampleService.stop(this.watchFaceHealthListener)'), 'watch face must unsubscribe in SLEEP/hide')
requireCondition(clockSource.includes('watchData.applyHeartRate(data.heartRate)'), 'watch face must still update the shared recent-heart state')
requireCondition(!clockSource.includes('watchData.tickHeartRate()'), 'watch face must not generate a second random heart rate')

requireCondition(watchDataSource.includes("../domain/health/recent"), 'watch_data compatibility layer must delegate recent heart state')
requireCondition(watchDataSource.includes("../presentation/mappers/watch_snapshot"), 'watch_data compatibility layer must delegate display mapping')
requireCondition(!watchDataSource.includes('barHeight:'), 'watch_data must not own chart geometry')
requireCondition(metricsSource.includes('function pushWindow'), 'health metrics must provide a sliding window')
requireCondition(metricsSource.includes('function stats'), 'health metrics must provide window statistics')
requireCondition(metricsSource.includes('function codeMessage'), 'health metrics must normalize service errors')
requireCondition(metricsTestSource.includes('自适应柱高保持起伏'), 'health metrics tests must cover visible bar fluctuation')

if (errors.length > 0) {
  errors.forEach(function (error) { console.error('health UI error: ' + error) })
  process.exitCode = 1
} else {
  console.log('Checked health platform/domain boundary, foreground lifecycle, metric UI, and viewport integration')
}
