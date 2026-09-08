function magnitude(sample) {
  return Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z)
}

function vectorDelta(current, previous) {
  if (!previous) return 0
  var dx = current.x - previous.x
  var dy = current.y - previous.y
  var dz = current.z - previous.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function classify(score) {
  if (score < 1.5) return 'stable'
  if (score < 4) return 'light'
  if (score < 8) return 'medium'
  return 'strong'
}

function createState() {
  return { x: 0, y: 0, z: 0, magnitude: 0, baseline: 0, calibrationSamples: 0, delta: 0, score: 0, peak: 0, sampleCount: 0, intensityKey: 'stable', previous: null }
}

function applySample(state, sample) {
  var current = { x: sample.x, y: sample.y, z: sample.z }
  var currentMagnitude = magnitude(current)
  var calibrationSamples = state.calibrationSamples
  var baseline = state.baseline
  if (calibrationSamples < 12) {
    baseline = (baseline * calibrationSamples + currentMagnitude) / (calibrationSamples + 1)
    calibrationSamples++
  }
  var delta = vectorDelta(current, state.previous)
  var gravityOffset = Math.abs(currentMagnitude - baseline)
  var score = Math.max(delta, gravityOffset)
  return {
    x: current.x,
    y: current.y,
    z: current.z,
    magnitude: currentMagnitude,
    baseline: baseline,
    calibrationSamples: calibrationSamples,
    delta: delta,
    score: score,
    peak: Math.max(state.peak, score),
    sampleCount: state.sampleCount + 1,
    intensityKey: classify(score),
    previous: current
  }
}

module.exports = { magnitude: magnitude, vectorDelta: vectorDelta, classify: classify, createState: createState, applySample: applySample }
