import settingsStore from '../../../domain/settings/store'
import vibration from '../../../capabilities/vibration'
import haptics from '../../system/haptics'
var patterns = require('../../../domain/haptics/patterns')

export function createVibrationController(onChange) {
  var state = settingsStore.getSnapshot()
  var feedback = '点击播放反馈'

  function emit() {
    var mode = vibration.getSystemMode()
    var view = {
      enabled: state.vibrationEnabled,
      level: state.vibrationLevel,
      levelText: settingsStore.vibrationLevelText(state.vibrationLevel),
      pattern: state.vibrationPattern,
      patternText: settingsStore.vibrationPatternText(state.vibrationPattern),
      statusText: state.vibrationEnabled ? '已开启' : '已关闭',
      statusColor: state.vibrationEnabled ? '#30D158' : '#8E8E93',
      feedbackText: feedback,
      systemModeText: mode < 0 ? '未提供' : String(mode),
      capabilityText: vibration.available() ? '反馈可用' : '当前设备不可用',
      capabilityColor: vibration.available() ? '#30D158' : '#FFD60A'
    }
    if (typeof onChange === 'function') onChange(view)
    return view
  }

  function commit(key, value) { state = settingsStore.update(key, value); return emit() }

  function play(name) {
    if (!state.vibrationEnabled) { feedback = '请先开启震动反馈'; return emit() }
    var normalized = patterns.normalize(name)
    var pattern = patterns.get(normalized, state.vibrationLevel)
    haptics.play(normalized, state.vibrationLevel)
    feedback = vibration.available() ? pattern.label + ' · 已播放' : '当前设备无法震动'
    return emit()
  }

  return {
    load: function () { settingsStore.load(function (value) { state = value; feedback = '当前模式：' + settingsStore.vibrationPatternText(state.vibrationPattern); emit() }) },
    stop: function () { haptics.stop() },
    toggle: function () { return commit('vibrationEnabled', !state.vibrationEnabled) },
    setLevel: function (level) { return commit('vibrationLevel', level) },
    selectPattern: function (name) { state = settingsStore.update('vibrationPattern', patterns.normalize(name)); emit(); return play(name) },
    playCurrent: function () { return play(state.vibrationPattern) },
    refresh: emit
  }
}
