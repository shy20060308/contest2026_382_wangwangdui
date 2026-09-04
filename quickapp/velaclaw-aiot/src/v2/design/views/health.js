function bars(values, height, inactive, active) {
  var source = Array.isArray(values) ? values : []
  var max = 1
  for (var i = 0; i < source.length; i++) if ((Number(source[i]) || 0) > max) max = Number(source[i]) || 0
  var result = []
  for (var j = 0; j < source.length; j++) {
    result.push({
      height: Math.max(3, Math.round(((Number(source[j]) || 0) / max) * height)),
      color: j === source.length - 1 ? active : inactive,
      index: j
    })
  }
  return result
}

function sourceText(source) {
  var value = source || {}
  if (value.live) return '实时'
  if (value.errorCode === 203) return '不支持'
  if (value.errorCode) return '异常'
  return '演示'
}

function heartStatus(zone) {
  if (zone === 'rest') return { text: '偏低', color: '#5AC8FA' }
  if (zone === 'elevated') return { text: '偏高', color: '#FF9F0A' }
  if (zone === 'peak') return { text: '峰值', color: '#FF453A' }
  return { text: '正常', color: '#30D158' }
}

function stressStatus(zone) {
  if (zone === 'relaxed') return { text: '放松', color: '#30D158' }
  if (zone === 'normal') return { text: '正常', color: '#64D2FF' }
  if (zone === 'elevated') return { text: '偏高', color: '#FFD60A' }
  return { text: '较高', color: '#FF453A' }
}

function formatTime(timestamp) {
  if (!timestamp) return '--:--'
  var date = new Date(timestamp)
  var hours = date.getHours() < 10 ? '0' + date.getHours() : '' + date.getHours()
  var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : '' + date.getMinutes()
  return hours + ':' + minutes
}

function project(model, plan) {
  var source = model || {}
  var chartHeight = Math.max(18, Math.round(Number(plan && plan.chartHeight) || 24))
  var heart = heartStatus(source.heartZone)
  var stress = stressStatus(source.stressZone)
  var spo2Attention = source.spo2Zone === 'attention'

  return {
    heartRate: Number(source.heartRate) || 0,
    spo2: Number(source.spo2) || 0,
    stress: Number(source.stress) || 0,
    heartStatus: heart.text,
    heartStatusColor: heart.color,
    spo2Status: spo2Attention ? '请关注' : '良好',
    spo2StatusColor: spo2Attention ? '#FF9F0A' : '#30D158',
    stressStatus: stress.text,
    stressStatusColor: stress.color,
    dailyMin: Number(source.dailyMin) || 0,
    dailyMax: Number(source.dailyMax) || 0,
    stressMin: Number(source.stressMin) || 0,
    stressAvg: Number(source.stressAvg) || 0,
    stressMax: Number(source.stressMax) || 0,
    heartSource: sourceText(source.heartSource),
    spo2Source: sourceText(source.spo2Source),
    stressSource: sourceText(source.stressSource),
    sourceText: source.anyLive ? '设备实时数据' : '兼容演示数据',
    updatedAtText: formatTime(source.updatedAt),
    heartBars: bars(source.heartValues, chartHeight, '#7A2436', '#FF375F'),
    spo2Bars: bars(source.spo2Values, chartHeight, '#245566', '#5AC8FA'),
    stressBars: bars(source.stressValues, chartHeight, '#542966', '#BF5AF2')
  }
}

module.exports = { project: project }
