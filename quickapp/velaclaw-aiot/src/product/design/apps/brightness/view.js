function switchView(enabled) {
  return { text: enabled ? '开' : '关', color: enabled ? '#30D158' : '#8E8E93' }
}

function project(model) {
  var auto = switchView(model.autoBrightness)
  var raise = switchView(model.raiseWakeEnabled)
  var lowPower = switchView(model.lowPowerEnabled)
  return {
    brightnessValue: model.brightnessValue,
    brightnessText: Math.round((model.brightnessValue / 255) * 100) + '%',
    brightnessDetail: model.brightnessValue + ' / 255',
    manualStateText: model.autoBrightness ? '自动管理' : '可调节',
    autoText: auto.text,
    autoColor: auto.color,
    raiseText: raise.text,
    raiseColor: raise.color,
    lowPowerText: lowPower.text,
    lowPowerColor: lowPower.color
  }
}

module.exports = { project: project }
