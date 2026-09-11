function summarize(records, todayKey) {
  var source = Array.isArray(records) ? records : []
  if (!source.length) {
    return { todaySteps: null, avgSteps: null, bestSteps: null, bestDate: '', avgHeartRate: null, goalPercent: null, records: [] }
  }

  var totalSteps = 0
  var totalHeart = 0
  var heartCount = 0
  var best = source[0]
  var today = null
  for (var i = 0; i < source.length; i++) {
    var item = source[i]
    totalSteps += item.steps
    if (item.avgHeartRate !== null) { totalHeart += item.avgHeartRate; heartCount++ }
    if (item.steps > best.steps) best = item
    if (item.date === todayKey) today = item
  }

  return {
    todaySteps: today ? today.steps : null,
    avgSteps: Math.round(totalSteps / source.length),
    bestSteps: best.steps,
    bestDate: best.date,
    avgHeartRate: heartCount ? Math.round(totalHeart / heartCount) : null,
    goalPercent: today ? today.goalPercent : null,
    records: source.slice()
  }
}

module.exports = { summarize: summarize }
