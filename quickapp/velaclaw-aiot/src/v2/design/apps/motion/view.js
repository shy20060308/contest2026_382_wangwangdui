function fixed(value) {
  return value.toFixed(2)
}

function intensity(key) {
  if (key === 'stable') return { label: '平稳', color: '#30D158' }
  if (key === 'light') return { label: '轻微', color: '#64D2FF' }
  if (key === 'medium') return { label: '中等', color: '#FFD60A' }
  if (key === 'strong') return { label: '强烈', color: '#FF453A' }
  throw new Error('Unknown motion intensity: ' + key)
}

function sensorStatus(code) {
  if (code === 'idle') return '未启动'
  if (code === 'waiting') return '等待样本'
  if (code === 'streaming') return '正在出数'
  if (code === 'unavailable') return '接口不可用'
  if (code === 'stopped') return '已停止'
  if (code === 'recalibrating') return '重新校准中'
  throw new Error('Unknown motion sensor status: ' + code)
}

function measurement(model) {
  var tone = intensity(model.measureIntensityKey)
  if (model.measurePhase === 'measuring') {
    return {
      countdownText: (model.remainingMs / 1000).toFixed(1),
      resultText: '测量中',
      color: '#64D2FF',
      buttonText: '请完成动作'
    }
  }
  if (model.measurePhase === 'complete') return { countdownText: '完成', resultText: tone.label, color: tone.color, buttonText: '再次测量' }
  if (model.measurePhase === 'no-samples') return { countdownText: '完成', resultText: '无样本', color: '#FF453A', buttonText: '再次测量' }
  if (model.measurePhase === 'idle') return { countdownText: '3.0', resultText: '待测量', color: '#8E8E93', buttonText: '开始测量' }
  throw new Error('Unknown motion measurement phase: ' + model.measurePhase)
}

function project(model) {
  var currentIntensity = intensity(model.intensityKey)
  var measure = measurement(model)
  return {
    sensorStatus: sensorStatus(model.sensorStatus),
    sensorColor: model.sensorActive ? '#30D158' : '#8E8E93',
    sensorButtonText: model.sensorActive ? '停止诊断' : '开始诊断',
    xText: fixed(model.x),
    yText: fixed(model.y),
    zText: fixed(model.z),
    magnitudeText: fixed(model.magnitude),
    scoreText: fixed(model.score),
    intensityColor: currentIntensity.color,
    sampleText: model.sensorActive ? '已收到 ' + model.sampleCount + ' 个样本 · 当前' + currentIntensity.label : '启动后显示真实样本与采样数量',
    countdownText: measure.countdownText,
    actionResult: measure.resultText,
    actionColor: measure.color,
    actionPeakText: fixed(model.measurePeak),
    measureButtonText: measure.buttonText,
    measureActive: model.measureActive
  }
}

function pageLabel(index) {
  if (index === 0) return '实时诊断'
  if (index === 1) return '动作测量'
  throw new Error('Unknown motion page index: ' + index)
}

module.exports = { project: project, pageLabel: pageLabel }
