import activityStore from '../../../domain/activity/store'
import healthStore from '../../../domain/health/store'
import historyRepository from '../../../domain/history/repository'
import workoutRepository from '../../../domain/workout/repository'
import settingsStore from '../../domain/settings/store'
import transport from './mock_transport'
var protocol = require('./protocol')

function formatNumber(value) { return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }

export function createSyncController(onChange) {
  var connected = false
  var syncing = false
  var progress = 0
  var message = '连接上位机后同步手环数据'
  var packetText = '等待打包'
  var lastSyncText = '未同步'
  var preview = { todayStepsText: '--', historyCount: '0', workoutCount: '0' }

  function emit() {
    var capability = transport.capability()
    var view = {
      connected: connected,
      syncing: syncing,
      statusText: connected ? '已连接' : '未连接',
      statusColor: connected ? '#30D158' : '#8E8E93',
      connectButtonText: connected ? '断开' : '连接',
      transportText: capability.name,
      lastSyncText: lastSyncText,
      syncPercent: progress,
      syncWidth: progress + '%',
      syncMessage: message,
      packetText: packetText,
      todayStepsText: preview.todayStepsText,
      historyCount: preview.historyCount,
      workoutCount: preview.workoutCount
    }
    if (typeof onChange === 'function') onChange(view)
    return view
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
      preview = { todayStepsText: formatNumber(activity.steps) + ' 步', historyCount: history.length.toString(), workoutCount: workouts.length.toString() }
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
    settingsStore.load(function (settings) { lastSyncText = settings.lastSyncText; connected = false; syncing = false; progress = 0; emit(); collect() })
  }

  return {
    load: loadSettings,
    refreshPreview: function () { collect() },
    toggleConnection: function () {
      if (syncing) { message = '同步中不能断开'; return emit() }
      if (connected) {
        transport.disconnect(); connected = false; progress = 0; message = '已断开上位机'; packetText = '等待连接'; settingsStore.update('bluetoothConnected', false); return emit()
      }
      message = '正在建立同步链路'; emit()
      transport.connect({
        success: function () { connected = true; message = '模拟器链路已连接'; packetText = '可开始同步'; settingsStore.update('bluetoothConnected', true); emit() },
        fail: function () { connected = false; message = '连接失败，请重试'; emit() }
      })
      return emit()
    },
    sync: function () {
      if (!connected) { message = '请先连接上位机'; return emit() }
      if (syncing) return emit()
      syncing = true; progress = 0; message = '正在收集健康与运动数据'; packetText = '正在打包'; emit()
      collect(function (payload) {
        var transfer = protocol.encode(payload, 96)
        packetText = transfer.packets.length + ' 包 · ' + transfer.bytesText + ' 字符'
        message = '等待分包 ACK'
        emit()
        transport.send(transfer.packets, {
          progress: function (state) { progress = state.percent; message = '已确认 ' + state.sent + '/' + state.total + ' 包'; emit() },
          success: function () {
            syncing = false; progress = 100; message = '同步完成，对端已确认'; lastSyncText = settingsStore.syncTimeText()
            settingsStore.updateMany({ lastSyncText: lastSyncText, bluetoothConnected: true })
            workoutRepository.markAllSynced(function () { collect() })
            emit()
          },
          fail: function () { syncing = false; message = '同步失败，可重新尝试'; emit() }
        })
      })
      return emit()
    },
    stop: function () { transport.disconnect(); connected = false; syncing = false; settingsStore.update('bluetoothConnected', false) },
    refresh: emit
  }
}
