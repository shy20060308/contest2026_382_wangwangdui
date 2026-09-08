var LEVEL_TEXT = { light: '轻', medium: '中', strong: '强' }
var PATTERN_TEXT = { tap: '轻触', goal: '达标', countdown: '倒计时', alert: '警报' }

function selected(value, target) { return value === target ? '#FF9F0A' : '#1C1C1E' }
function patternBg(value, target) { return value === target ? '#2D210F' : '#14181F' }
function patternState(value, target) { return value === target ? '已选' : '›' }

function feedbackText(model) {
  if (model.feedbackCode === 'idle') return '点击播放反馈'
  if (model.feedbackCode === 'disabled') return '请先开启震动反馈'
  if (model.feedbackCode === 'unavailable') return '当前设备无法震动'
  if (model.feedbackCode === 'played') return PATTERN_TEXT[model.pattern] + ' · 已播放'
  if (model.feedbackCode === 'loaded') return '当前模式：' + PATTERN_TEXT[model.pattern]
  throw new Error('Unknown vibration feedback code: ' + model.feedbackCode)
}

function project(model) {
  var levelText = LEVEL_TEXT[model.level]
  var patternText = PATTERN_TEXT[model.pattern]
  if (!levelText) throw new Error('Unknown vibration level: ' + model.level)
  if (!patternText) throw new Error('Unknown vibration pattern: ' + model.pattern)
  return {
    enabled: model.enabled,
    enabledText: model.enabled ? '开' : '关',
    level: model.level,
    levelText: levelText,
    pattern: model.pattern,
    patternText: patternText,
    statusText: model.enabled ? '已开启' : '已关闭',
    statusColor: model.enabled ? '#30D158' : '#8E8E93',
    feedbackText: feedbackText(model),
    systemModeText: model.systemMode < 0 ? '未提供' : String(model.systemMode),
    capabilityText: model.capabilityAvailable ? '反馈可用' : '当前设备不可用',
    capabilityColor: model.capabilityAvailable ? '#30D158' : '#FFD60A',
    lightBg: selected(model.level, 'light'),
    mediumBg: selected(model.level, 'medium'),
    strongBg: selected(model.level, 'strong'),
    tapBg: patternBg(model.pattern, 'tap'),
    goalBg: patternBg(model.pattern, 'goal'),
    countdownBg: patternBg(model.pattern, 'countdown'),
    alertBg: patternBg(model.pattern, 'alert'),
    tapState: patternState(model.pattern, 'tap'),
    goalState: patternState(model.pattern, 'goal'),
    countdownState: patternState(model.pattern, 'countdown'),
    alertState: patternState(model.pattern, 'alert')
  }
}

module.exports = { project: project }
