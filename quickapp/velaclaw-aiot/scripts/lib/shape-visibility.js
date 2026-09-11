function number(value, label) {
  var next = Number(value)
  if (!isFinite(next)) throw new Error('Shape visibility requires ' + label)
  return next
}

function pointInside(formFactor, scene, x, y) {
  var width = number(scene && scene.width, 'scene.width')
  var height = number(scene && scene.height, 'scene.height')
  var px = number(x, 'point.x')
  var py = number(y, 'point.y')
  if (px < 0 || py < 0 || px > width || py > height) return false
  if (formFactor === 'rect') return true
  if (formFactor === 'circle') {
    var radius = Math.min(width, height) / 2
    var dx = px - width / 2
    var dy = py - height / 2
    return dx * dx + dy * dy <= radius * radius + 0.0001
  }
  if (formFactor === 'pill') {
    var capRadius = width / 2
    if (height <= width) {
      var centerDx = px - width / 2
      var centerDy = py - height / 2
      var shortRadius = Math.min(width, height) / 2
      return centerDx * centerDx + centerDy * centerDy <= shortRadius * shortRadius + 0.0001
    }
    if (py >= capRadius && py <= height - capRadius) return true
    var centerY = py < capRadius ? capRadius : height - capRadius
    var pillDx = px - width / 2
    var pillDy = py - centerY
    return pillDx * pillDx + pillDy * pillDy <= capRadius * capRadius + 0.0001
  }
  throw new Error('Unknown form factor: ' + formFactor)
}

function insetFrame(frame, inset) {
  var amount = Math.max(0, Number(inset) || 0)
  return {
    left: number(frame && frame.left, 'frame.left') + amount,
    top: number(frame && frame.top, 'frame.top') + amount,
    width: Math.max(0, number(frame && frame.width, 'frame.width') - amount * 2),
    height: Math.max(0, number(frame && frame.height, 'frame.height') - amount * 2)
  }
}

function frameInside(formFactor, scene, frame, inset) {
  var value = insetFrame(frame, inset)
  var right = value.left + value.width
  var bottom = value.top + value.height
  return pointInside(formFactor, scene, value.left, value.top) &&
    pointInside(formFactor, scene, right, value.top) &&
    pointInside(formFactor, scene, value.left, bottom) &&
    pointInside(formFactor, scene, right, bottom)
}

function translate(frame, left, top) {
  return {
    left: number(frame && frame.left, 'frame.left') + (Number(left) || 0),
    top: number(frame && frame.top, 'frame.top') + (Number(top) || 0),
    width: number(frame && frame.width, 'frame.width'),
    height: number(frame && frame.height, 'frame.height')
  }
}

function estimatedTextWidth(text, fontSize) {
  var value = String(text === undefined || text === null ? '' : text)
  var size = Math.max(0, number(fontSize, 'fontSize'))
  var units = 0
  for (var i = 0; i < value.length; i++) {
    var code = value.charCodeAt(i)
    var char = value.charAt(i)
    if (/\s/.test(char)) units += 0.35
    else if (code >= 0x2e80) units += 1
    else if (/[A-Z0-9]/.test(char)) units += 0.64
    else if (/[a-z]/.test(char)) units += 0.56
    else units += 0.5
  }
  return units * size
}

module.exports = {
  pointInside: pointInside,
  frameInside: frameInside,
  translate: translate,
  estimatedTextWidth: estimatedTextWidth
}
