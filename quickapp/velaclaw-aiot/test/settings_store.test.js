const assert = require('assert')
const core = require('../src/domain/settings/store_core')

let passed = 0
function test(name, callback) { callback(); passed++; console.log('通过 - ' + name) }

function persisted(overrides) {
  return Object.assign({}, core.DEFAULTS, overrides || {})
}

function readResult(status, error) {
  return { ok: status === 'ok' || status === 'missing', status: status, error: error || null }
}

function fakeStorage() {
  const reads = []
  const writes = []
  const quarantines = []
  return {
    reads: reads,
    writes: writes,
    quarantines: quarantines,
    getJSONResult: function (key, callback) { reads.push({ key: key, callback: callback }) },
    set: function (key, value, callback) {
      writes.push({ key: key, value: JSON.parse(JSON.stringify(value)), callback: callback, resolved: false })
    },
    quarantine: function (key, callback) { quarantines.push({ key: key, callback: callback }) },
    resolveRead: function (value, result) {
      const read = reads.shift()
      assert.ok(read, 'expected pending storage read')
      read.callback(value, result || readResult(value === null || value === undefined ? 'missing' : 'ok'))
    },
    resolveWrite: function (result) {
      const write = writes.find(function (entry) { return !entry.resolved })
      assert.ok(write, 'expected pending storage write')
      write.resolved = true
      write.callback(result === undefined ? { persisted: true, memoryOnly: false, error: null } : result)
    },
    resolveQuarantine: function (result) {
      const entry = quarantines.shift()
      assert.ok(entry, 'expected pending quarantine')
      entry.callback(result || { ok: true, status: 'quarantined', backupKey: entry.key + '__corrupt_backup', error: null })
    }
  }
}

assert.strictEqual(core.KEY, 'device_settings_v4', 'Settings schema migration must invalidate the unsafe default-low-power snapshot')
assert.strictEqual(core.DEFAULTS.lowPowerEnabled, false, 'Fresh V3 installs must not enter low power automatically')

test('并发 load 合并为一次初始读取，后续 load 只读内存真源', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  let first = null
  let second = null
  let third = null
  store.load(function (value) { first = value })
  store.load(function (value) { second = value })
  assert.strictEqual(storage.reads.length, 1)
  storage.resolveRead(persisted({ brightnessValue: 88, vibrationLevel: 'strong' }))
  assert.strictEqual(first.brightnessValue, 88)
  assert.strictEqual(second.vibrationLevel, 'strong')
  store.load(function (value) { third = value })
  assert.strictEqual(storage.reads.length, 0)
  assert.strictEqual(third.brightnessValue, 88)
})

test('初始读取期间 update 不会用默认值提前覆盖已存配置', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  store.load(function () {})
  store.update('brightnessValue', 210)
  assert.strictEqual(storage.writes.length, 0, 'load 完成前不得写入基于默认值的快照')
  storage.resolveRead(persisted({ brightnessValue: 80, vibrationLevel: 'strong', vibrationPattern: 'alert' }))
  const snapshot = store.getSnapshot()
  assert.strictEqual(snapshot.brightnessValue, 210, 'pending update must win over stored value')
  assert.strictEqual(snapshot.vibrationLevel, 'strong', 'unrelated stored fields must survive')
  assert.strictEqual(snapshot.vibrationPattern, 'alert', 'initial load must not be erased by early update')
  assert.strictEqual(storage.writes.length, 1)
  assert.strictEqual(storage.writes[0].value.brightnessValue, 210)
  assert.strictEqual(storage.writes[0].value.vibrationLevel, 'strong')
})

test('快速连续 update 串行写入，最终落盘一定是最新快照', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  store.load(function () {})
  storage.resolveRead(persisted({ brightnessValue: 100 }))

  store.update('brightnessValue', 150)
  store.update('brightnessValue', 160)
  assert.strictEqual(storage.writes.length, 1, 'first write must be the only in-flight write')
  assert.strictEqual(storage.writes[0].value.brightnessValue, 150)

  storage.resolveWrite()
  assert.strictEqual(storage.writes.length, 2, 'queued latest snapshot must start after first write completes')
  assert.strictEqual(storage.writes[1].value.brightnessValue, 160)

  store.update('brightnessValue', 170)
  assert.strictEqual(storage.writes.length, 2, 'third update must wait for second write')
  storage.resolveWrite()
  assert.strictEqual(storage.writes.length, 3)
  assert.strictEqual(storage.writes[2].value.brightnessValue, 170)
  storage.resolveWrite()
  assert.strictEqual(store.getSnapshot().brightnessValue, 170)
})

test('persist callback 等到合并后的最终写入完成', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  store.load(function () {})
  storage.resolveRead(persisted({ brightnessValue: 100 }))
  let callbackValue = null
  store.update('brightnessValue', 120, function (value) { callbackValue = value.brightnessValue })
  store.update('brightnessValue', 130)
  storage.resolveWrite()
  assert.strictEqual(callbackValue, null)
  storage.resolveWrite()
  assert.strictEqual(callbackValue, 130)
})

test('未知 setting key、非法 canonical value 和半合法 patch 必须原子失败', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  const before = store.getSnapshot()
  assert.throws(function () { store.update('bluetoothConnected', true) }, /Unknown setting/)
  assert.throws(function () { store.update('brightnessValue', 300) }, /Invalid setting value/)
  assert.throws(function () { store.update('brightnessValue', '100') }, /Invalid setting value/)
  assert.throws(function () { store.update('vibrationPattern', 'unknown') }, /Unknown haptic pattern/)
  assert.throws(function () { store.update('vibrationLevel', 'unknown') }, /Invalid setting value/)
  assert.throws(function () { store.updateMany({ brightnessValue: 100, extra: true }) }, /Unknown setting/)
  assert.deepStrictEqual(store.getSnapshot(), before, 'failed updateMany must not partially mutate canonical settings')
})

test('合法 JSON 但 schema 损坏时使用受限内存默认值且禁止覆盖原 key', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  let loaded = null
  let loadState = null
  store.load(function (value, persistence) { loaded = value; loadState = persistence })
  storage.resolveRead({ brightnessValue: 88 })
  assert.strictEqual(loaded.brightnessValue, core.DEFAULTS.brightnessValue)
  assert.strictEqual(loadState.status, 'corrupt')
  assert.strictEqual(loadState.recoverable, true)
  store.update('brightnessValue', 199)
  assert.strictEqual(store.getSnapshot().brightnessValue, 199, 'degraded mode may keep user changes in memory')
  assert.strictEqual(storage.writes.length, 0, 'corrupt persisted content must not be overwritten before explicit recovery')
})

test('storage parse corrupt 也必须结算 load 且保持 persistence-blocked', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  let loaded = false
  store.load(function (value, persistence) {
    loaded = true
    assert.strictEqual(value.brightnessValue, core.DEFAULTS.brightnessValue)
    assert.strictEqual(persistence.status, 'corrupt')
  })
  storage.resolveRead(null, readResult('corrupt', new Error('bad json')))
  assert.strictEqual(loaded, true)
  store.update('lowPowerEnabled', true)
  assert.strictEqual(storage.writes.length, 0)
})

test('I/O 读取失败允许内存启动但不能执行破坏性恢复', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  store.load(function () {})
  storage.resolveRead(null, readResult('io-error', new Error('device unavailable')))
  assert.strictEqual(store.getPersistenceState().status, 'io-error')
  assert.strictEqual(store.getPersistenceState().recoverable, false)
  let recovery = null
  store.recoverPersistence(function (result) { recovery = result })
  assert.strictEqual(recovery.status, 'not-recoverable')
  assert.strictEqual(storage.quarantines.length, 0, 'I/O failure must never delete data without a readable backup')
})

test('显式恢复必须先 quarantine，再写默认值，成功后解除写保护', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  store.load(function () {})
  storage.resolveRead({ brightnessValue: 88 })
  assert.strictEqual(store.getPersistenceState().status, 'corrupt')

  let recovery = null
  store.recoverPersistence(function (result) { recovery = result })
  assert.strictEqual(storage.quarantines.length, 1)
  assert.strictEqual(storage.writes.length, 0, 'reset write must wait until corrupt raw content has been quarantined')
  storage.resolveQuarantine()
  assert.strictEqual(storage.writes.length, 1)
  assert.deepStrictEqual(storage.writes[0].value, core.DEFAULTS, 'explicit recovery resets Settings to canonical defaults')
  storage.resolveWrite()
  assert.ok(recovery && recovery.ok)
  assert.strictEqual(store.getPersistenceState().status, 'ok')

  store.update('brightnessValue', 155)
  assert.strictEqual(storage.writes.length, 2, 'normal persistence must resume only after recovery completes')
})

test('load 回调拿到副本，外部修改不会污染 Store', function () {
  const storage = fakeStorage()
  const store = core.createStore(storage)
  let exposed = null
  store.load(function (value) { exposed = value })
  storage.resolveRead(persisted({ vibrationPattern: 'countdown' }))
  exposed.vibrationPattern = 'alert'
  assert.strictEqual(store.getSnapshot().vibrationPattern, 'countdown')
})

console.log('Settings Store 单一真源测试通过：' + passed + ' 项')
