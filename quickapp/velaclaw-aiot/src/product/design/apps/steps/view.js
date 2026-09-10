var META = {
  steps: { name: '步数', unit: '步', color: '#FFD60A' },
  calories: { name: '卡路里', unit: 'kcal', color: '#FF9F0A' },
  stand: { name: '站立', unit: 'h', color: '#0A84FF' }
}

function formatNumber(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function withUnit(value, unit) {
  return formatNumber(value) + (unit ? ' ' + unit : '')
}

function progress(current, goal, trackWidth, unit, color) {
  var ratio = current / goal
  var percent = Math.round(ratio * 100)
  var displayPercent = percent > 999 ? '999%+' : percent + '%'
  var complete = current >= goal
  var remaining = complete ? 0 : goal - current
  var extra = complete ? current - goal : 0
  return {
    progressText: displayPercent,
    progressWidth: Math.round(Math.max(0, Math.min(1, ratio)) * trackWidth),
    goalText: '目标 ' + withUnit(goal, unit),
    statusText: complete ? (extra > 0 ? '超额 ' + formatNumber(extra) : '已达成') : '还差 ' + formatNumber(remaining),
    statusColor: complete ? color : '#8E8E93',
    isComplete: complete
  }
}

function present(metrics, trackWidth) {
  var result = []
  for (var i = 0; i < metrics.length; i++) {
    var item = metrics[i]
    var meta = META[item.id]
    if (!meta) throw new Error('Unknown Activity metric: ' + item.id)
    var state = progress(item.current, item.goal, trackWidth, meta.unit, meta.color)
    result.push({
      id: item.id,
      name: meta.name,
      current: formatNumber(item.current),
      goal: formatNumber(item.goal),
      unit: meta.unit,
      color: meta.color,
      progressText: state.progressText,
      progressWidth: state.progressWidth,
      goalText: state.goalText,
      statusText: state.statusText,
      statusColor: state.statusColor,
      isComplete: state.isComplete
    })
  }
  return result
}

module.exports = { present: present, progress: progress }
