function range(values, minSpan) {
  var min = values[0]
  var max = min
  for (var i = 1; i < values.length; i++) {
    var value = values[i]
    if (value < min) min = value
    if (value > max) max = value
  }
  if (max - min < minSpan) {
    var middle = (min + max) / 2
    min = middle - minSpan / 2
    max = middle + minSpan / 2
  }
  return { min: min, max: max }
}

function sampleBarHeight(samples, index, minHeight, maxHeight, minSpan) {
  var bounds = range(samples, minSpan)
  var ratio = (samples[index] - bounds.min) / (bounds.max - bounds.min)
  return Math.round(minHeight + ratio * (maxHeight - minHeight))
}

module.exports = { sampleBarHeight: sampleBarHeight }
