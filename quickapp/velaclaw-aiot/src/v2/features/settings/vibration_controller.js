import settingsStore from '../../domain/settings/store'
import vibration from '../../../capabilities/vibration'
var patterns = require('../../domain/haptics/patterns')

export function createVibrationController(onChange) {
  var state = settingsStore.getSnapshot()
  var timers = []
  var feedback = '点击播放反馈'

  function stopTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = [] }
  function emit() {
    var view = {
      enabled: state.vibrationEnabled,
      level: state.vibrationLevel,
      levelText: settingsStore.vibrationLevelText(state.vibrationLevel),
      pattern: state.vibrationPattern,
      patternText: settingsStore.vibrationPatternText(state.vibrationPattern),
      statusText: state.vibrationEnabled ? '已开启' : '已关闭',
      statusColor: state.vibrationEnabled ? '#30D158' : '#8E8E93',
      feedbackText: feedback,
      systemModeText: vibration.getSystemMode() < 0 ? '未提供' : String(vibration.getSystemMode()),
      capabilityText: vibration.available() ? '反馈可用' : '当前设备不可用',
      capabilityColor: vibration.available() ? '#30D158' : '#FFD60A'
    }
    if (typeof onChange === 'function') onChange(view)
    return view
  }
  function commit(key, value) { state = settingsStore.update(key, value); return emit() }
  function play(name) {
    stopTimers()
    if (!state.vibrationEnabled) { feedback = '请先开启震动反馈'; return emit() }
    var pattern = patterns.get(name, state.vibrationLevel)
    var firstOk = vibration.vibrate(pattern.mode)
    for (var i = 1; i < pattern.count; i++) {
      (function (delay, mode) { timers.push(setTimeout(function () { vibration.vibrate(mode) }, delay)) })(i * (pattern.duration + pattern.interval), pattern.mode)
    }
    feedback = firstOk ? pattern.label + ' · 已播放' : '当前设备无法震动'
    return emit()
  }

  return {
    load: function () { settingsStore.load(function (value) { state = value; feedback = '当前模式：' + settingsStore.vibrationPatternText(state.vibrationPattern); emit() }) },
    stop: function () { stopTimers() },
    toggle: function () { return commit('vibrationEnabled', !state.vibrationEnabled) },
    setLevel: function (level) { return commit('vibrationLevel', level) },
    selectPattern: function (name) { state = settingsStore.update('vibrationPattern', patterns.normalize(name)); emit(); return play(name) },
    playCurrent: function () { return play(state.vibrationPattern) },
    refresh: emit
  }
}
