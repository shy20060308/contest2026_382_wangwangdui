var WEEKDAY_LABELS = null

function range(values) {
  if (!values.length) return { min: 0, max: 0 }
  var min = values[0]
  var max = values[0]
  for (var i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i]
    if (values[i] > max) max = values[i]
  }
  return { min: min, max: max }
}

function relativeBars(values, height, minHeight, minimumSpread, inactive, active) {
  if (!values.length) return []
  var bounds = range(values)
  var spread = Math.max(minimumSpread, bounds.max - bounds.min)
  var center = (bounds.min + bounds.max) / 2
  var visualMin = center - spread / 2
  var result = []
  for (var i = 0; i < values.length; i++) {
    var ratio = Math.max(0, Math.min(1, (values[i] - visualMin) / spread))
    result.push({ height: minHeight + Math.round(ratio * (height - minHeight)), color: i === values.length - 1 ? active : inactive, index: i })
  }
  return result
}

function sourceText(source) {
  if (source.live && source.mode === 'live') return '系统'
  if (source.errorCode === 203) return '不支持'
  if (source.errorCode) return '异常'
  return '等待'
}

function heartStatus(zone, value) {
  if (value === null) return { text: '等待', color: '#8E8E93' }
  if (zone === 'rest') return { text: '偏低', color: '#5AC8FA' }
  if (zone === 'elevated') return { text: '偏高', color: '#FF9F0A' }
  if (zone === 'peak') return { text: '峰值', color: '#FF453A' }
  return { text: '正常', color: '#30D158' }
}

function stressStatus(zone, value) {
  if (value === null) return { text: '等待', color: '#8E8E93' }
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

function trendText(values) { return values.length > 1 ? '近' + values.length + '次' : (values.length ? '当前' : '等待') }
function rangeText(values, unit) { var bounds = range(values); if (!values.length) return '等待数据'; if (bounds.min === bounds.max) return '当前 ' + bounds.max + unit; return '本次 ' + bounds.min + '–' + bounds.max + unit }

function summaryState(source) {
  if (!source.anyLive) return { text: source.serviceAvailable ? '等待系统数据' : '等待健康服务', color: '#8E8E93' }
  var attention = source.heartZone === 'elevated' || source.heartZone === 'peak' || source.spo2Zone === 'attention' || source.stressZone === 'elevated' || source.stressZone === 'high'
  return attention ? { text: '有指标需关注', color: '#FF9F0A' } : { text: '状态平稳', color: '#30D158' }
}

function project(model, plan) {
  var source = model
  var visual = plan.trendVisual
  var heartValue = source.heartRate
  var spo2Value = source.spo2
  var stressValue = source.stress
  var heart = heartStatus(source.heartZone, heartValue)
  var stress = stressStatus(source.stressZone, stressValue)
  var spo2Attention = spo2Value !== null && source.spo2Zone === 'attention'
  var summary = summaryState(source)
  var heartValues = source.heartValues
  var spo2Values = source.spo2Values
  var stressValues = source.stressValues
  return {
    heartRate: heartValue === null ? '--' : heartValue,
    spo2: spo2Value === null ? '--' : spo2Value,
    stress: stressValue === null ? '--' : stressValue,
    heartStatus: heart.text, heartStatusColor: heart.color,
    spo2Status: spo2Value === null ? '等待' : (spo2Attention ? '请关注' : '良好'),
    spo2StatusColor: spo2Value === null ? '#8E8E93' : (spo2Attention ? '#FF9F0A' : '#30D158'),
    stressStatus: stress.text, stressStatusColor: stress.color,
    summaryText: summary.text, summaryColor: summary.color,
    dailyMin: source.dailyMin,
    dailyMax: source.dailyMax,
    stressMin: source.stressMin,
    stressAvg: source.stressAvg,
    stressMax: source.stressMax,
    heartSource: sourceText(source.heartSource), spo2Source: sourceText(source.spo2Source), stressSource: sourceText(source.stressSource),
    sourceText: source.anyLive ? '系统健康数据' : (source.serviceAvailable ? '等待系统数据' : '等待健康服务'),
    updatedAtText: source.anyLive ? formatTime(source.updatedAt) : '--:--',
    heartTrendText: trendText(heartValues), spo2TrendText: trendText(spo2Values), stressTrendText: trendText(stressValues),
    heartRangeText: rangeText(heartValues, ' bpm'), spo2RangeText: rangeText(spo2Values, '%'),
    stressRangeText: stressValues.length ? '本次 ' + source.stressMin + '–' + source.stressMax + ' · 均 ' + source.stressAvg : '等待数据',
    heartBars: relativeBars(heartValues, plan.chartHeight, plan.trendMinHeight, visual.heartSpread, visual.heartInactive, visual.heartActive),
    spo2Bars: relativeBars(spo2Values, plan.chartHeight, plan.trendMinHeight, visual.spo2Spread, visual.spo2Inactive, visual.spo2Active),
    stressBars: relativeBars(stressValues, plan.chartHeight, plan.trendMinHeight, visual.stressSpread, visual.stressInactive, visual.stressActive)
  }
}

module.exports = { project: project }
