function sampleNumber(value, fallback) {
  var number = Number(value)
  return isFinite(number) ? number : fallback
}

function visualNumber(value, name) {
  var number = Number(value)
  if (!isFinite(number)) throw new Error('watchface chart requires recipe ' + name)
  return number
}

function range(values, minSpan) {
  var span = visualNumber(minSpan, 'minSpan')
  if (!(span > 0)) throw new Error('watchface chart requires positive recipe minSpan')
  if (!values || !values.length) return { min: 0, max: span }
  var min = sampleNumber(values[0], 0)
  var max = min
  for (var i = 1; i < values.length; i++) {
    var value = sampleNumber(values[i], min)
    if (value < min) min = value
    if (value > max) max = value
  }
  if (max - min < span) {
    var middle = (min + max) / 2
    min = middle - span / 2
    max = middle + span / 2
  }
  return { min: min, max: max }
}

function sampleBarHeight(samples, index, minHeight, maxHeight, minSpan) {
  var low = Math.round(visualNumber(minHeight, 'minHeight'))
  var high = Math.round(visualNumber(maxHeight, 'maxHeight'))
  if (!(low >= 0) || high < low) throw new Error('watchface chart requires ordered recipe bar heights')
  if (!samples || !samples.length || index < 0 || index >= samples.length) return low
  var values = []
  for (var i = 0; i < samples.length; i++) {
    var sample = samples[i]
    values.push(sample && typeof sample === 'object' ? sample.value : sample)
  }
  var bounds = range(values, minSpan)
  var span = bounds.max - bounds.min
  var current = Math.max(bounds.min, Math.min(bounds.max, sampleNumber(values[index], bounds.min)))
  return Math.round(low + ((current - bounds.min) / span) * (high - low))
}

module.exports = {
  sampleBarHeight: sampleBarHeight
}
