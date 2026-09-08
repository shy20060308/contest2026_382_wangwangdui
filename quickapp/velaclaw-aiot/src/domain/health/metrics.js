function isHeartRate(value) {
  return typeof value === 'number' && isFinite(value) && value > 0
}

function isSpo2(value) {
  return typeof value === 'number' && isFinite(value) && value > 0 && value <= 100
}

function isStress(value) {
  return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 100
}

function classifyHeartRate(value) {
  if (value < 60) return 'rest'
  if (value < 100) return 'normal'
  if (value < 140) return 'elevated'
  return 'peak'
}

function classifyStress(value) {
  if (value < 30) return 'relaxed'
  if (value < 60) return 'normal'
  if (value < 80) return 'elevated'
  return 'high'
}

function pushWindow(values, value, maxLength) {
  var next = values.concat([value])
  return next.length > maxLength ? next.slice(next.length - maxLength) : next
}

function stats(values) {
  if (!values.length) return { min: 0, avg: 0, max: 0 }
  var min = values[0]
  var max = values[0]
  var sum = 0
  for (var i = 0; i < values.length; i++) {
    var value = values[i]
    if (value < min) min = value
    if (value > max) max = value
    sum += value
  }
  return { min: min, avg: Math.round(sum / values.length), max: max }
}

module.exports = {
  isHeartRate: isHeartRate,
  isSpo2: isSpo2,
  isStress: isStress,
  classifyHeartRate: classifyHeartRate,
  classifyStress: classifyStress,
  pushWindow: pushWindow,
  stats: stats
}
