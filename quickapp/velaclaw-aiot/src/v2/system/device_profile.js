import device from '../../capabilities/device'

var DESIGN_WIDTH = 192
var SAFE_INSETS = {
  circle: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 },
  pill: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 },
  rect: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 }
}

var cached = null
var pending = []
var loading = false

function number(value) {
  var next = Number(value)
  return isFinite(next) && next > 0 ? next : 0
}

function text(value) { return value === undefined || value === null ? '' : String(value) }
function contextDevice(context) { return context && context.$device ? context.$device : {} }
function pick(info, fallback, key) {
  if (info && info[key] !== undefined && info[key] !== null && info[key] !== '') return info[key]
  return fallback && fallback[key]
}
function pickViewport(info, fallback, key) {
  if (fallback && fallback[key] !== undefined && fallback[key] !== null && fallback[key] !== '') return fallback[key]
  return info && info[key]
}

function formFactor(shape, width, height) {
  var normalized = String(shape || '').toLowerCase()
  if (normalized === 'circle') return 'circle'
  if (normalized === 'pill' || normalized === 'pill-shaped') return 'pill'
  var ratio = height > 0 ? width / height : 0
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
  var source = SAFE_INSETS[factor] || SAFE_INSETS.rect
  return { left: source.left, top: source.top, right: source.right, bottom: source.bottom, gestureBar: source.gestureBar }
}

function make(info, context) {
  var local = contextDevice(context)
  var shapeText = text(pickViewport(info, local, 'screenShape')) || 'pill-shaped'
  var width = number(pickViewport(info, local, 'screenWidth'))
  var height = number(pickViewport(info, local, 'screenHeight'))
  var infoWidth = number(info && info.screenWidth)
  var infoHeight = number(info && info.screenHeight)
  var normalized = shapeText.toLowerCase()
  var ratio = height > 0 ? width / height : 0
  var infoRatio = infoHeight > 0 ? infoWidth / infoHeight : 0
  var ratioWrong = (normalized === 'circle' && (ratio < 0.9 || ratio > 1.1)) || ((normalized === 'pill' || normalized === 'pill-shaped') && (ratio < 0.3 || ratio >= 0.5))
  var infoMatches = (normalized === 'circle' && infoRatio >= 0.9 && infoRatio <= 1.1) || ((normalized === 'pill' || normalized === 'pill-shaped') && infoRatio > 0.3 && infoRatio < 0.5)
  if (ratioWrong && infoMatches) { width = infoWidth; height = infoHeight }

  if (!width || !height) {
    if (normalized === 'circle') { width = 466; height = 466 }
    else if (normalized === 'pill' || normalized === 'pill-shaped') { width = 192; height = 490 }
    else { width = 432; height = 514 }
  }

  var model = text(pick(info, local, 'model'))
  var platformVersionCode = number(pick(info, local, 'platformVersionCode'))
  if (model === 'Emulator-Vela' && platformVersionCode === 1200 && (normalized === 'pill' || normalized === 'pill-shaped') && width !== 192 && width !== 212) {
    if (infoWidth === 192 || infoWidth === 212) { width = infoWidth; height = infoHeight }
    else { width = 192; height = 490 }
  }

  var factor = formFactor(shapeText, width, height)
  return {
    shape: shapeText,
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
    isBetaPillViewport: model === 'Emulator-Vela' && platformVersionCode === 1200 && factor === 'pill' && (width === 192 || width === 212),
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
    cached = make(info || {}, context)
    loading = false
    flush(cached)
  })
}

export default { resolve: resolve, makeProfile: make, clearCache: function () { cached = null } }
