import capabilityIntrospection from '../../../capabilities/introspection'
import activityStore from '../../../domain/activity/store'
import settingsStore from '../../../domain/settings/store'
import watchfaceStore from '../../../domain/watchface/store'
var performanceMetrics = require('../../../runtime/performance_metrics')

function deviceSnapshot(profile) {
  return {
    model: profile.model,
    screenWidth: profile.screenWidth,
    screenHeight: profile.screenHeight,
    formFactor: profile.formFactor,
    platformVersionCode: profile.platformVersionCode
  }
}

function hostSnapshot(scene) {
  return { width: scene.width, height: scene.height }
}

function persistenceState(store) {
  if (!store || typeof store.getPersistenceState !== 'function') return { status: 'unavailable', blocked: false, recoverable: false, errorCode: '' }
  var value = store.getPersistenceState() || {}
  return {
    status: value.status || 'unavailable',
    blocked: !!value.blocked,
    recoverable: !!value.recoverable,
    errorCode: value.errorCode || ''
  }
}

export function createDiagnosticsController(onChange) {
  var profile = null
  var scene = null
  var storageRecoveryState = 'idle'

  function storageSnapshot() {
    var activity = persistenceState(activityStore)
    var settings = persistenceState(settingsStore)
    var watchface = persistenceState(watchfaceStore)
    var recoverable = activity.recoverable || settings.recoverable
    return {
      items: [
        { id: 'activity', status: activity.status, errorCode: activity.errorCode },
        { id: 'settings', status: settings.status, errorCode: settings.errorCode },
        { id: 'watchface', status: watchface.status, errorCode: watchface.errorCode }
      ],
      recoverable: recoverable,
      requestVisible: recoverable && storageRecoveryState === 'idle',
      confirmVisible: recoverable && storageRecoveryState === 'confirming'
    }
  }

  function snapshot() {
    if (!profile || !scene) throw new Error('Diagnostics requires resolved Device Profile and Host Scene')
    var storage = storageSnapshot()
    return {
      device: deviceSnapshot(profile),
      host: hostSnapshot(scene),
      performance: performanceMetrics.snapshot(),
      capabilities: capabilityIntrospection.list(),
      storageItems: storage.items,
      storageRecoverable: storage.recoverable,
      storageRecoveryState: storageRecoveryState,
      storageRecoveryRequestVisible: storage.requestVisible,
      storageRecoveryConfirmVisible: storage.confirmVisible
    }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  function recoverTasks() {
    var tasks = []
    if (persistenceState(activityStore).recoverable) tasks.push(function (done) { activityStore.recoverPersistence(done) })
    if (persistenceState(settingsStore).recoverable) tasks.push(function (done) { settingsStore.recoverPersistence(done) })
    return tasks
  }

  function confirmRecovery() {
    if (storageRecoveryState !== 'confirming') throw new Error('Storage recovery requires explicit confirmation')
    var tasks = recoverTasks()
    if (!tasks.length) {
      storageRecoveryState = 'idle'
      return emit()
    }
    storageRecoveryState = 'recovering'
    emit()
    var index = 0
    var failed = false
    function next(result) {
      if (result && !result.ok) failed = true
      if (index >= tasks.length) {
        storageRecoveryState = failed ? 'error' : 'done'
        emit()
        return
      }
      var task = tasks[index++]
      task(next)
    }
    next(null)
  }

  return {
    configureScene: function (nextProfile, nextScene) {
      profile = nextProfile
      scene = nextScene
      return emit()
    },
    refresh: emit,
    requestStorageRecovery: function () {
      if (!storageSnapshot().recoverable) return emit()
      storageRecoveryState = 'confirming'
      return emit()
    },
    confirmStorageRecovery: confirmRecovery,
    cancelStorageRecovery: function () {
      storageRecoveryState = 'idle'
      return emit()
    }
  }
}
