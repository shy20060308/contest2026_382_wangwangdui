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
  if (model.phase === 'idle') return '检测手机连接后同步手环数据'
  if (model.phase === 'checking') return '正在检测系统同步链路'
  if (model.phase === 'connected') return '手机同步链路已就绪'
  if (model.phase === 'disconnected') return '手机同步链路未连接'
  if (model.phase === 'connect-failed') return '无法读取手机连接状态'
  if (model.phase === 'connect-required') return '请先确认手机已连接'
  if (model.phase === 'collecting') return '正在收集健康与运动数据'
  if (model.phase === 'sending') return '已发送 ' + model.packetSent + '/' + model.packetTotal + ' 包'
  if (model.phase === 'completed') return '同步完成，数据已发送'
  if (model.phase === 'failed') return '同步失败，可重新尝试'
  throw new Error('Unknown sync phase: ' + model.phase)
}

function packetText(model) {
  if (model.packetCount > 0) return model.packetCount + ' 包 · ' + model.payloadChars + ' 字符'
  if (model.phase === 'connected') return '可开始同步'
  if (model.phase === 'checking') return '正在检测连接'
  if (model.phase === 'disconnected' || model.phase === 'connect-failed') return '等待手机连接'
  if (model.phase === 'collecting') return '正在打包'
  return '等待打包'
}

function project(model) {
  return {
    statusText: model.connected ? '已连接' : '未连接',
    statusColor: model.connected ? '#30D158' : '#8E8E93',
    connectButtonText: model.connected ? '重检' : '检测',
    lastSyncText: timeText(model.lastSyncAt),
    transportText: '系统 Interconnect',
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
