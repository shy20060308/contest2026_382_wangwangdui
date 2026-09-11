import activityStore from '../../../domain/activity/store'
import healthStore from '../../../domain/health/store'
import historyRepository from '../../../domain/history/repository'
import workoutRepository from '../../../domain/workout/repository'
import settingsStore from '../../../domain/settings/store'
import interconnect from '../../../capabilities/interconnect'
var protocol = require('./protocol')

export function createSyncController(onChange) {
  var active = false
  var lifecycleEpoch = 0
  var state = {
    connected: false,
    syncing: false,
    progress: 0,
    phase: 'idle',
    lastSyncAt: 0,
    packetCount: 0,
    payloadChars: 0,
    packetSent: 0,
    packetTotal: 0,
    todaySteps: null,
    historyCount: 0,
    workoutCount: 0
  }

  function snapshot() {
    var value = {}
    for (var key in state) value[key] = state[key]
    return value
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  function isLive(epoch) {
    return active && epoch === lifecycleEpoch
  }

  function resetTransfer() {
    state.progress = 0
    state.packetCount = 0
    state.payloadChars = 0
    state.packetSent = 0
    state.packetTotal = 0
  }

  function onConnectionState(connectionState) {
    if (!active) return
    state.connected = !!connectionState.connected
    if (state.syncing && !state.connected) {
      state.syncing = false
      state.phase = 'failed'
    } else if (!state.syncing) {
      state.phase = connectionState.event === 'error'
        ? 'connect-failed'
        : (state.connected ? 'connected' : 'disconnected')
    }
    emit()
  }

  function collect(callback, epoch) {
    var activity = null
    var history = []
    var workouts = []
    var pending = 3
    function done() {
      pending--
      if (pending > 0 || !isLive(epoch)) return
      state.todaySteps = activity.steps
      state.historyCount = history.length
      state.workoutCount = workouts.length
      emit()
      if (!callback) return
      var health = healthStore.getSnapshot()
      callback({
        version: protocol.VERSION,
        syncedAt: Date.now(),
        health: { steps: activity.steps, calories: activity.calories, standHours: activity.standHours, heartRate: health.heartRate },
        history: history,
        workouts: workouts
      })
    }
    activityStore.hydrate(function (value) {
      if (!isLive(epoch)) return
      activity = value
      done()
    })
    historyRepository.getHistory(function (value) {
      if (!isLive(epoch)) return
      history = value
      done()
    })
    workoutRepository.getRecords(function (value) {
      if (!isLive(epoch)) return
      workouts = value
      done()
    })
  }

  function refreshConnection() {
    if (!active) return emit()
    var epoch = lifecycleEpoch
    state.phase = 'checking'
    emit()
    interconnect.getReadyState({
      success: function () {},
      fail: function () {
        if (!isLive(epoch) || state.phase !== 'checking') return
        state.connected = false
        state.phase = 'connect-failed'
        emit()
      }
    })
    return snapshot()
  }

  function loadSettings() {
    if (active) return emit()
    active = true
    lifecycleEpoch++
    var epoch = lifecycleEpoch
    interconnect.subscribeState(onConnectionState)
    settingsStore.load(function (settings) {
      if (!isLive(epoch)) return
      state.lastSyncAt = settings.lastSyncAt
      state.connected = false
      state.syncing = false
      state.phase = 'idle'
      resetTransfer()
      emit()
      refreshConnection()
      collect(null, epoch)
    })
    return emit()
  }

  function sendTransfer(transfer, epoch, success, fail) {
    var index = 0
    var total = transfer.packetTotal
    state.packetTotal = total
    function next() {
      if (!isLive(epoch) || !state.syncing) return
      if (index >= total) {
        success()
        return
      }
      var packet = transfer.packetAt(index)
      interconnect.send(packet, {
        success: function () {
          if (!isLive(epoch) || !state.syncing) return
          index++
          state.packetSent = index
          state.progress = Math.round((index / total) * 100)
          state.phase = 'sending'
          emit()
          next()
        },
        fail: function () {
          if (!isLive(epoch) || !state.syncing) return
          fail()
        }
      })
    }
    next()
  }

  function sync() {
    if (!active) return emit()
    if (!state.connected) { state.phase = 'connect-required'; return emit() }
    if (state.syncing) return emit()
    var epoch = lifecycleEpoch
    state.syncing = true
    resetTransfer()
    state.phase = 'collecting'
    emit()
    collect(function (payload) {
      if (!isLive(epoch) || !state.syncing) return
      var transfer = protocol.createTransfer(payload, 96)
      state.packetCount = transfer.packetTotal
      state.payloadChars = transfer.bytesText
      state.packetTotal = transfer.packetTotal
      state.phase = 'sending'
      emit()
      sendTransfer(transfer, epoch, function () {
        if (!isLive(epoch) || !state.syncing) return
        state.syncing = false
        state.progress = 100
        state.phase = 'completed'
        state.lastSyncAt = Date.now()
        settingsStore.update('lastSyncAt', state.lastSyncAt)
        workoutRepository.markAllSynced()
        emit()
      }, function () {
        if (!isLive(epoch) || !state.syncing) return
        state.syncing = false
        state.phase = 'failed'
        emit()
      })
    }, epoch)
    return snapshot()
  }

  function stop() {
    if (!active) return
    active = false
    lifecycleEpoch++
    interconnect.unsubscribeState(onConnectionState)
    state.connected = false
    state.syncing = false
    state.phase = 'idle'
    resetTransfer()
  }

  return {
    load: loadSettings,
    refreshConnection: refreshConnection,
    sync: sync,
    stop: stop
  }
}
