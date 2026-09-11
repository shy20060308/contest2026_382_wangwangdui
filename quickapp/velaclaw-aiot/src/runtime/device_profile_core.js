var SAFE_INSETS = {
  circle: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 },
  pill: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 },
  rect: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 }
}

function positiveNumber(value, label) {
  var next = Number(value)
  if (!isFinite(next) || next <= 0) throw new Error('V3 Device Profile requires ' + label)
  return next
}
function optionalPositiveNumber(value, label) {
  if (value === undefined || value === null || value === '') return null
  var next = Number(value)
  if (!isFinite(next) || next <= 0) throw new Error('V3 Device Profile requires canonical ' + label)
  return next
}
function optionalText(value) { return value === undefined || value === null || value === '' ? null : String(value) }
function present(value) { return value !== undefined && value !== null && value !== '' }
function pick(primary, secondary, key) {
  if (primary && present(primary[key])) return primary[key]
  return secondary && secondary[key]
}
function viewportPick(local, info, key) {
  if (local && present(local[key])) return local[key]
  return info && info[key]
}
function screenShape(value, width, height) {
  var normalized = String(value || '').toLowerCase()
  if (normalized === 'circle') return 'circle'
  if (normalized === 'pill' || normalized === 'pill-shaped') return 'pill-shaped'
  if (normalized === 'rect') return 'rect'
  var ratio = width / height
  if (ratio >= 0.9 && ratio <= 1.1) return 'circle'
  if (ratio > 0.3 && ratio < 0.5) return 'pill-shaped'
  return 'rect'
}
function formFactor(shape) {
  if (shape === 'circle') return 'circle'
  if (shape === 'pill-shaped') return 'pill'
  if (shape === 'rect') return 'rect'
  throw new Error('V3 Device Profile requires a normalized screen shape')
}
function declaredInsets(factor) {
  var source = SAFE_INSETS[factor]
  if (!source) throw new Error('V3 Device Profile has no safe insets for ' + factor)
  return { left: source.left, top: source.top, right: source.right, bottom: source.bottom, gestureBar: source.gestureBar }
}
function make(info, local) {
  info = info || {}
  local = local || {}
  var width = positiveNumber(viewportPick(local, info, 'screenWidth'), 'screenWidth')
  var height = positiveNumber(viewportPick(local, info, 'screenHeight'), 'screenHeight')
  var shapeText = screenShape(viewportPick(local, info, 'screenShape'), width, height)
  var factor = formFactor(shapeText)
  return {
    shape: shapeText,
    formFactor: factor,
    isCircle: factor === 'circle',
    isPill: factor === 'pill',
    isRect: factor === 'rect',
    screenWidth: width,
    screenHeight: height,
    safeInsets: declaredInsets(factor),
    model: optionalText(pick(info, local, 'model')),
    platformVersionCode: optionalPositiveNumber(pick(info, local, 'platformVersionCode'), 'platformVersionCode'),
    apiLevel: optionalPositiveNumber(pick(info, local, 'APILevel'), 'APILevel'),
    source: 'v3.host-viewport+capability.device'
  }
}

module.exports = { make: make, screenShape: screenShape }
