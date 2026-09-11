function clampIndex(items, index) {
  var length = Array.isArray(items) ? items.length : 0
  if (!length) return -1
  var value = Math.round(Number(index))
  if (!isFinite(value)) value = 0
  return Math.max(0, Math.min(length - 1, value))
}

function select(items, index, radius) {
  var source = Array.isArray(items) ? items : []
  var center = clampIndex(source, index)
  var distance = Math.max(0, Math.round(Number(radius === undefined ? 1 : radius)) || 0)
  if (center < 0) return []
  return source.map(function (item, itemIndex) {
    var copy = {}
    for (var key in item) copy[key] = item[key]
    if (Math.abs(itemIndex - center) > distance) copy.preview = null
    return copy
  })
}

function primitiveCount(items) {
  var source = Array.isArray(items) ? items : []
  var count = 0
  for (var i = 0; i < source.length; i++) {
    var preview = source[i] && source[i].preview
    if (!preview) continue
    count += Array.isArray(preview.boxes) ? preview.boxes.length : 0
    count += Array.isArray(preview.texts) ? preview.texts.length : 0
  }
  return count
}

module.exports = {
  select: select,
  primitiveCount: primitiveCount
}
