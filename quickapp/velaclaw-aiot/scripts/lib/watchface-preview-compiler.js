function finite(value, fallback) {
  var next = Number(value)
  return isFinite(next) ? next : (fallback === undefined ? 0 : fallback)
}

function positive(value, fallback) {
  var next = finite(value, fallback)
  return next > 0 ? next : (fallback === undefined ? 1 : fallback)
}

function scaled(value, scale, minimum) {
  var next = Math.round(finite(value, 0) * scale)
  return Math.max(minimum === undefined ? 0 : minimum, next)
}

function fit(stage, targetWidth, targetHeight) {
  var sourceWidth = positive(stage && stage.frame && stage.frame.width, 1)
  var sourceHeight = positive(stage && stage.frame && stage.frame.height, 1)
  var width = positive(targetWidth, 1)
  var height = positive(targetHeight, 1)
  var scale = Math.min(width / sourceWidth, height / sourceHeight)
  return {
    width: Math.round(width),
    height: Math.round(height),
    scale: scale,
    offsetX: (width - sourceWidth * scale) / 2,
    offsetY: (height - sourceHeight * scale) / 2
  }
}

function frame(value, fitValue) {
  var source = value || {}
  return {
    left: Math.round(fitValue.offsetX + finite(source.left, 0) * fitValue.scale),
    top: Math.round(fitValue.offsetY + finite(source.top, 0) * fitValue.scale),
    width: Math.max(1, Math.round(finite(source.width, 0) * fitValue.scale)),
    height: Math.max(1, Math.round(finite(source.height, 0) * fitValue.scale))
  }
}

function box(id, sourceFrame, tokens, fitValue, transform, originX, originY) {
  var sourceTokens = tokens || {}
  var borderWidth = finite(sourceTokens.borderWidth, 0)
  return {
    id: id,
    frame: frame(sourceFrame, fitValue),
    background: sourceTokens.background || '',
    borderColor: sourceTokens.borderColor || '',
    borderWidth: borderWidth > 0 ? Math.max(1, scaled(borderWidth, fitValue.scale, 1)) : 0,
    radius: scaled(sourceTokens.radius, fitValue.scale, 0),
    transform: transform || '',
    originX: scaled(originX, fitValue.scale, 0),
    originY: scaled(originY, fitValue.scale, 0)
  }
}

function text(id, sourceFrame, value, tokens, fitValue, sizeKey, colorKey, weightKey, alignKey, lineHeightKey, letterSpacingKey) {
  var sourceTokens = tokens || {}
  var fontSize = positive(sourceTokens[sizeKey || 'fontSize'], 1)
  var lineHeight = positive(sourceTokens[lineHeightKey || 'lineHeight'], fontSize)
  return {
    id: id,
    frame: frame(sourceFrame, fitValue),
    text: value === undefined || value === null ? '' : String(value),
    fontSize: Math.max(2, scaled(fontSize, fitValue.scale, 2)),
    lineHeight: Math.max(2, scaled(lineHeight, fitValue.scale, 2)),
    color: sourceTokens[colorKey || 'color'] || '#FFFFFF',
    fontWeight: sourceTokens[weightKey || 'fontWeight'] || 'normal',
    textAlign: sourceTokens[alignKey || 'textAlign'] || 'center',
    letterSpacing: scaled(sourceTokens[letterSpacingKey || 'letterSpacing'], fitValue.scale, 0)
  }
}

function metricParts(model, item, fitValue) {
  var tokens = item.tokens || {}
  var padding = finite(tokens.padding, 0)
  var contentWidth = Math.max(0, finite(item.frame.width, 0) - padding * 2)
  model.boxes.push(box('metric-' + item.id, item.frame, tokens, fitValue))

  var labelHeight = positive(tokens.labelHeight, tokens.labelSize || 1)
  var labelFrame = {
    left: finite(item.frame.left, 0) + padding,
    top: finite(item.frame.top, 0) + padding,
    width: contentWidth,
    height: labelHeight
  }
  model.texts.push(text('metric-label-' + item.id, labelFrame, item.label, tokens, fitValue, 'labelSize', 'labelColor', 'labelWeight', 'textAlign', 'labelHeight'))

  var valueHeight = positive(tokens.valueHeight, tokens.valueSize || 1)
  var valueFrame = {
    left: finite(item.frame.left, 0) + padding,
    top: finite(item.frame.top, 0) + padding + labelHeight + finite(tokens.valueTop, 0),
    width: contentWidth,
    height: valueHeight
  }
  model.texts.push(text('metric-value-' + item.id, valueFrame, item.value, tokens, fitValue, 'valueSize', 'valueColor', 'valueWeight', 'textAlign', 'valueHeight'))

  if (item.detail && finite(tokens.detailHeight, 0) > 0) {
    var detailFrame = {
      left: finite(item.frame.left, 0) + padding,
      top: finite(valueFrame.top, 0) + valueHeight + finite(tokens.detailTop, 0),
      width: contentWidth,
      height: finite(tokens.detailHeight, 0)
    }
    model.texts.push(text('metric-detail-' + item.id, detailFrame, item.detail, tokens, fitValue, 'detailSize', 'detailColor', 'detailWeight', 'textAlign', 'detailHeight'))
  }
}

function previewStage(stage, targetWidth, targetHeight) {
  var fitValue = fit(stage, targetWidth, targetHeight)
  var model = {
    width: fitValue.width,
    height: fitValue.height,
    background: stage.background || '#000000',
    boxes: [],
    texts: []
  }

  ;(stage.panels || []).forEach(function (item) {
    model.boxes.push(box('panel-' + item.id, item.frame, item.tokens, fitValue))
  })
  ;(stage.texts || []).forEach(function (item) {
    model.texts.push(text('text-' + item.id, item.frame, item.text, item.tokens, fitValue))
  })
  ;(stage.metrics || []).forEach(function (item) {
    metricParts(model, item, fitValue)
  })
  ;(stage.progresses || []).forEach(function (item) {
    model.boxes.push(box('progress-track-' + item.id, item.frame, {
      background: item.tokens && item.tokens.trackColor,
      radius: item.tokens && item.tokens.radius
    }, fitValue))
    model.boxes.push(box('progress-fill-' + item.id, {
      left: item.frame.left,
      top: item.frame.top,
      width: item.fillWidth,
      height: item.frame.height
    }, {
      background: item.tokens && item.tokens.fillColor,
      radius: item.tokens && item.tokens.radius
    }, fitValue))
  })
  ;(stage.analogDials || []).forEach(function (item) {
    model.boxes.push(box('dial-' + item.id, item.frame, item.tokens, fitValue))
  })
  ;(stage.analogTicks || []).forEach(function (item) {
    model.boxes.push(box('tick-' + item.id, item.frame, {
      background: item.color,
      radius: 0
    }, fitValue, item.transform, item.originX, item.originY))
  })
  ;(stage.analogHands || []).forEach(function (item) {
    model.boxes.push(box('hand-' + item.id, item.frame, {
      background: item.color,
      radius: item.radius
    }, fitValue, item.transform, item.originX, item.originY))
  })
  ;(stage.analogPins || []).forEach(function (item) {
    model.boxes.push(box('pin-' + item.id, item.frame, {
      background: item.color,
      radius: item.radius
    }, fitValue))
  })

  return model
}

function previewTarget(watchfaceSurface, shape) {
  var tokens = watchfaceSurface.experience[shape].collection.tokens
  if (shape === 'circle') return { width: tokens.previewSize, height: tokens.previewSize }
  if (shape === 'pill') return { width: tokens.previewWidth, height: tokens.previewHeight }
  if (shape === 'rect') return { width: tokens.gridItemWidth - tokens.cardPadding * 2, height: tokens.previewHeight }
  throw new Error('Unsupported watchface preview shape: ' + shape)
}

function compile(clockSurface, watchfaceSurface, runtime) {
  var result = {}
  var items = watchfaceSurface.experience.base.collection.items || []
  var known = {}
  items.forEach(function (item) { known[item.id] = true })
  var demoState = {
    clockVisible: true,
    sleepVisible: false,
    notificationAppVisible: false,
    notificationCallVisible: false,
    powerMode: 'ACTIVE',
    timestamp: Date.UTC(2026, 8, 11, 8, 32, 25),
    steps: 9999,
    currentHeartRate: 76,
    goalPercent: 52,
    batteryPercent: 88
  }
  var profiles = {
    circle: { formFactor: 'circle', screenWidth: 466, screenHeight: 466, safeInsets: { left: 0, top: 10, right: 0, bottom: 10, gestureBar: 0 } },
    pill: { formFactor: 'pill', screenWidth: 212, screenHeight: 520, safeInsets: { left: 0, top: 52, right: 0, bottom: 52, gestureBar: 36 } },
    rect: { formFactor: 'rect', screenWidth: 390, screenHeight: 450, safeInsets: { left: 0, top: 2, right: 0, bottom: 2, gestureBar: 0 } }
  }

  ;['circle', 'pill', 'rect'].forEach(function (shape) {
    var profile = profiles[shape]
    var scene = runtime.scene.resolve(profile)
    var safe = runtime.scene.safe(profile, scene)
    var faceIds = clockSurface.experience[shape].controllerConfig.faceIds || []
    var selectorIds = watchfaceSurface.experience[shape].controllerConfig.faceIds || []
    if (JSON.stringify(faceIds) !== JSON.stringify(selectorIds)) throw new Error('Watchface preview faceIds drift from Clock for ' + shape)
    var target = previewTarget(watchfaceSurface, shape)

    faceIds.forEach(function (faceId) {
      if (!known[faceId]) throw new Error('Clock face is missing from Watchface catalog: ' + faceId)
      var state = {}
      for (var key in demoState) state[key] = demoState[key]
      state.faceId = faceId
      var plan = runtime.surfaceRuntime.resolve(clockSurface, profile, scene, safe, state)
      var decorated = runtime.experienceRuntime.decorate(plan, clockSurface, profile, scene, safe, state)
      if (!decorated.stage) throw new Error('Clock preview stage did not resolve: ' + shape + '/' + faceId)
      if (!result[faceId]) result[faceId] = {}
      result[faceId][shape] = previewStage(decorated.stage, target.width, target.height)
    })
  })
  return result
}

module.exports = {
  compile: compile,
  previewStage: previewStage
}
