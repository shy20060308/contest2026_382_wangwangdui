function radians(value) { return value * Math.PI / 180 }

function between(first, second) {
  var latDelta = radians(second.latitude - first.latitude)
  var lonDelta = radians(second.longitude - first.longitude)
  var firstLat = radians(first.latitude)
  var secondLat = radians(second.latitude)
  var a = Math.sin(latDelta / 2) * Math.sin(latDelta / 2) + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2)
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function acceptedSegment(first, second) {
  var meters = between(first, second)
  return meters >= 2 && meters <= 200 ? meters : 0
}

module.exports = { between: between, acceptedSegment: acceptedSegment }
