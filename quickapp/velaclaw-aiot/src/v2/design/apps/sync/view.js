function numberText(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function timeText(timestamp) {
  if (timestamp === 0) return '未同步'
  var date = new Date(timestamp)
  var hours = date.getHours() < 10 ? '0' + date.getHours() : '' + date.getHours()
  var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : '' + date.getMinutes()
  return hours + ':' + minutes
}

function phaseText(model) {
  if (model.phase === 'idle') return '连接上位机后同步手环数据'
  if (model.phase === 'connecting') return '正在建立同步链路'
  if (model.phase === 'connected') return '模拟器链路已连接'
  if (model.phase === 'disconnected') return '已断开上位机'
  if (model.phase === 'connect-failed') return '连接失败，请重试'
  if (model.phase === 'disconnect-blocked') return '同步中不能断开'
  if (model.phase === 'connect-required') return '请先连接上位机'
  if (model.phase === 'collecting') return '正在收集健康与运动数据'
  if (model.phase === 'waiting-ack') return '等待分包 ACK'
  if (model.phase === 'sending') return '已确认 ' + model.ackSent + '/' + model.ackTotal + ' 包'
  if (model.phase === 'completed') return '同步完成，对端已确认'
  if (model.phase === 'failed') return '同步失败，可重新尝试'
  throw new Error('Unknown sync phase: ' + model.phase)
}

function packetText(model) {
  if (model.packetCount > 0) return model.packetCount + ' 包 · ' + model.payloadChars + ' 字符'
  if (model.phase === 'connected') return '可开始同步'
  if (model.phase === 'disconnected') return '等待连接'
  if (model.phase === 'collecting') return '正在打包'
  return '等待打包'
}

function transportText(model) {
  if (model.transportMode === 'mock') return '模拟器分包链路'
  if (model.transportMode === 'device') return model.realBleAvailable ? '设备传输链路' : '传输不可用'
  throw new Error('Unknown sync transport mode: ' + model.transportMode)
}

function project(model) {
  return {
    statusText: model.connected ? '已连接' : '未连接',
    statusColor: model.connected ? '#30D158' : '#8E8E93',
    connectButtonText: model.connected ? '断开' : '连接',
    lastSyncText: timeText(model.lastSyncAt),
    transportText: transportText(model),
    syncPercent: model.progress,
    syncWidth: model.progress + '%',
    syncMessage: phaseText(model),
    packetText: packetText(model),
    todayStepsText: model.todaySteps === null ? '--' : numberText(model.todaySteps) + ' 步',
    historyCount: String(model.historyCount),
    workoutCount: String(model.workoutCount)
  }
}

module.exports = { project: project, timeText: timeText }
