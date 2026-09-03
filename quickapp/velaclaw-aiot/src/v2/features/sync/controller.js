import activityStore from '../../../domain/activity/store'
import healthStore from '../../../domain/health/store'
import historyRepository from '../../../domain/history/repository'
import workoutRepository from '../../../domain/workout/repository'
import settingsStore from '../../../domain/settings/store'
import transport from './mock_transport'
var protocol = require('./protocol')

export function createSyncController(onChange) {
  var capability = transport.capability()
  var state = {
    connected: false,
    syncing: false,
    progress: 0,
    phase: 'idle',
    lastSyncAt: 0,
    transportMode: capability.mode,
    realBleAvailable: !!capability.realBleAvailable,
    packetCount: 0,
    payloadChars: 0,
    ackSent: 0,
    ackTotal: 0,
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

  function collect(callback) {
    var activity = activityStore.getSnapshot()
    var health = healthStore.getSnapshot()
    var history = []
    var workouts = []
    var pending = 2
    function done() {
      pending--
      if (pending > 0) return
      state.todaySteps = Number(activity.steps) || 0
      state.historyCount = history.length
      state.workoutCount = workouts.length
      var payload = {
        version: protocol.VERSION,
        deviceId: 'vela-band-demo',
        syncedAt: Date.now(),
        health: { steps: activity.steps, calories: activity.calories, standHours: activity.standHours, heartRate: health.heartRate },
        history: history,
        workouts: workouts
      }
      emit()
      if (callback) callback(payload)
    }
    historyRepository.getHistory(function (value) { history = Array.isArray(value) ? value : []; done() })
    workoutRepository.getRecords(function (value) { workouts = Array.isArray(value) ? value : []; done() })
  }

  function loadSettings() {
    settingsStore.load(function (settings) {
      state.lastSyncAt = Number(settings.lastSyncAt) || 0
      state.connected = false
      state.syncing = false
      state.progress = 0
      state.phase = 'idle'
      state.packetCount = 0
      state.payloadChars = 0
      state.ackSent = 0
      state.ackTotal = 0
      emit()
      collect()
    })
  }

  return {
    load: loadSettings,
    refreshPreview: function () { collect() },
    toggleConnection: function () {
      if (state.syncing) { state.phase = 'disconnect-blocked'; return emit() }
      if (state.connected) {
        transport.disconnect()
        state.connected = false
        state.progress = 0
        state.phase = 'disconnected'
        state.packetCount = 0
        state.payloadChars = 0
        settingsStore.update('bluetoothConnected', false)
        return emit()
      }
      state.phase = 'connecting'
      emit()
      transport.connect({
        success: function () {
          state.connected = true
          state.phase = 'connected'
          settingsStore.update('bluetoothConnected', true)
          emit()
        },
        fail: function () {
          state.connected = false
          state.phase = 'connect-failed'
          emit()
        }
      })
      return emit()
    },
    sync: function () {
      if (!state.connected) { state.phase = 'connect-required'; return emit() }
      if (state.syncing) return emit()
      state.syncing = true
      state.progress = 0
      state.packetCount = 0
      state.payloadChars = 0
      state.ackSent = 0
      state.ackTotal = 0
      state.phase = 'collecting'
      emit()
      collect(function (payload) {
        var transfer = protocol.encode(payload, 96)
        state.packetCount = transfer.packets.length
        state.payloadChars = Number(transfer.bytesText) || 0
        state.ackTotal = transfer.packets.length
        state.phase = 'waiting-ack'
        emit()
        transport.send(transfer.packets, {
          progress: function (progressState) {
            state.progress = progressState.percent
            state.ackSent = progressState.sent
            state.ackTotal = progressState.total
            state.phase = 'sending'
            emit()
          },
          success: function () {
            state.syncing = false
            state.progress = 100
            state.phase = 'completed'
            state.lastSyncAt = Date.now()
            settingsStore.updateMany({ lastSyncAt: state.lastSyncAt, bluetoothConnected: true })
            workoutRepository.markAllSynced(function () { collect() })
            emit()
          },
          fail: function () {
            state.syncing = false
            state.phase = 'failed'
            emit()
          }
        })
      })
      return emit()
    },
    stop: function () {
      transport.disconnect()
      state.connected = false
      state.syncing = false
      settingsStore.update('bluetoothConnected', false)
    },
    refresh: emit
  }
}
