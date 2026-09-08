import device from '../capabilities/device'

var DESIGN_WIDTH = 192
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

function optionalNumber(value) {
  var next = Number(value)
  return isFinite(next) && next > 0 ? next : 0
}

function text(value) { return value === undefined || value === null ? '' : String(value) }
function contextDevice(context) { return context && context.$device ? context.$device : {} }
function pick(primary, secondary, key) {
  if (primary && primary[key] !== undefined && primary[key] !== null && primary[key] !== '') return primary[key]
  return secondary && secondary[key]
}

function formFactor(shape, width, height) {
  var normalized = String(shape || '').toLowerCase()
  if (normalized === 'circle') return 'circle'
  if (normalized === 'pill' || normalized === 'pill-shaped') return 'pill'
  if (normalized === 'rect' || normalized === 'rectangle' || normalized === 'rectangular') return 'rect'
  var ratio = width / height
  if (ratio >= 0.95 && ratio <= 1.05) return 'circle'
  if (ratio > 0.3 && ratio < 0.5) return 'pill'
  return 'rect'
}

function family(shape, width, height) {
  var size = width + 'x' + height
  if (size === '192x490') return 'xiaomi_band'
  if (size === '212x520') return 'xiaomi_band_10'
  if (size === '336x480') return 'xiaomi_band_pro'
  if (size === '432x514') return 'redmi_watch'
  if (shape === 'circle' && size === '466x466') return 'xiaomi_round_466'
  if (shape === 'circle' && size === '480x480') return 'xiaomi_round_480'
  return shape + '_generic'
}

function logicalHeight(width, height, factor) {
  if (factor === 'circle') return DESIGN_WIDTH
  return Math.ceil(height * DESIGN_WIDTH / width)
}

function declaredInsets(factor) {
  var source = SAFE_INSETS[factor]
  if (!source) throw new Error('V3 Device Profile has no safe insets for ' + factor)
  return { left: source.left, top: source.top, right: source.right, bottom: source.bottom, gestureBar: source.gestureBar }
}

function make(info, context) {
  var local = contextDevice(context)
  var shapeText = text(pick(info, local, 'screenShape'))
  var width = positiveNumber(pick(info, local, 'screenWidth'), 'screenWidth')
  var height = positiveNumber(pick(info, local, 'screenHeight'), 'screenHeight')
  var factor = formFactor(shapeText, width, height)
  var model = text(pick(info, local, 'model'))
  var platformVersionCode = optionalNumber(pick(info, local, 'platformVersionCode'))

  return {
    shape: shapeText || factor,
    formFactor: factor,
    isCircle: factor === 'circle',
    isPill: factor === 'pill',
    isRect: factor === 'rect',
    screenWidth: width,
    screenHeight: height,
    logicalHeight: logicalHeight(width, height, factor),
    safeInsets: declaredInsets(factor),
    deviceFamily: family(factor, width, height),
    model: model,
    platformVersionCode: platformVersionCode,
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

export default { resolve: resolve, makeProfile: make, clearCache: function () { cached = null } }
