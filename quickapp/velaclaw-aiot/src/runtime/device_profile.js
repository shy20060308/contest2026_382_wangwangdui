import device from '../capabilities/device'

var SAFE_INSETS = {
  circle: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 },
  pill: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 },
  rect: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 }
}

var cached = null
var pending = []
var loading = false

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

function optionalText(value) {
  return value === undefined || value === null || value === '' ? null : String(value)
}

function contextDevice(context) { return context && context.$device ? context.$device : {} }
function pick(primary, secondary, key) {
  if (primary && primary[key] !== undefined && primary[key] !== null && primary[key] !== '') return primary[key]
  return secondary && secondary[key]
}

function screenShape(value, width, height, model, platformVersionCode) {
  var normalized = String(value || '').toLowerCase()
  if (normalized === 'circle') return 'circle'
  if (normalized === 'pill' || normalized === 'pill-shaped') return 'pill-shaped'
  if (normalized === 'rect') return 'rect'

  var ratio = height > 0 ? width / height : 0
  if (ratio >= 0.9 && ratio <= 1.1) return 'circle'
  if (ratio > 0.3 && ratio < 0.5) return 'pill-shaped'
  if (model === 'Emulator-Vela' && platformVersionCode === 1200 && ((width === 192 && height === 490) || (width === 212 && height === 520))) return 'pill-shaped'
  if (width > 0 && height > 0) return 'rect'
  throw new Error('V3 Device Profile requires screenShape or usable screen dimensions')
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

function isContestBetaPill(model, platformVersionCode, factor, width, height) {
  if (model !== 'Emulator-Vela' || platformVersionCode !== 1200 || factor !== 'pill') return false
  return (width === 192 && height === 490) || (width === 212 && height === 520)
}

function make(info, context) {
  info = info || {}
  var local = contextDevice(context)
  var width = positiveNumber(pick(info, local, 'screenWidth'), 'screenWidth')
  var height = positiveNumber(pick(info, local, 'screenHeight'), 'screenHeight')
  var model = optionalText(pick(info, local, 'model'))
  var platformVersionCode = optionalPositiveNumber(pick(info, local, 'platformVersionCode'), 'platformVersionCode')
  var apiLevel = optionalPositiveNumber(pick(info, local, 'APILevel'), 'APILevel')
  var shapeText = screenShape(pick(info, local, 'screenShape'), width, height, model, platformVersionCode)
  var factor = formFactor(shapeText)
  var betaPill = isContestBetaPill(model, platformVersionCode, factor, width, height)

  return {
    shape: shapeText,
    formFactor: factor,
    isCircle: factor === 'circle',
    isPill: factor === 'pill',
    isRect: factor === 'rect',
    isBetaPillViewport: betaPill,
    screenWidth: width,
    screenHeight: height,
    safeInsets: declaredInsets(factor),
    model: model,
    platformVersionCode: platformVersionCode,
    apiLevel: apiLevel,
    source: 'v3.capability.device'
  }
}

function flush(profile) {
  var current = pending
  pending = []
  for (var i = 0; i < current.length; i++) current[i](profile)
}

function resolve(context, callback) {
  if (typeof callback !== 'function') return
  if (cached) { callback(cached); return }
  pending.push(callback)
  if (loading) return
  loading = true
  device.get(function (info) {
    loading = false
    try {
      cached = make(info, context)
    } catch (error) {
      pending = []
      throw error
    }
    flush(cached)
  })
}

export default { resolve: resolve, makeProfile: make }
