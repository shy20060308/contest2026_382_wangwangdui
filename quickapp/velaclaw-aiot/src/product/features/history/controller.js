import historyRepository from '../../../domain/history/repository'

function summarize(records) {
  if (!records.length) {
    return { todaySteps: 0, avgSteps: 0, bestSteps: 0, bestDate: '', avgHeartRate: null, goalPercent: 0, records: [] }
  }

  var totalSteps = 0
  var totalHeart = 0
  var heartCount = 0
  var best = records[0]
  for (var i = 0; i < records.length; i++) {
    var item = records[i]
    totalSteps += item.steps
    if (item.avgHeartRate !== null) { totalHeart += item.avgHeartRate; heartCount++ }
    if (item.steps > best.steps) best = item
  }

  var today = records[records.length - 1]
  return {
    todaySteps: today.steps,
    avgSteps: Math.round(totalSteps / records.length),
    bestSteps: best.steps,
    bestDate: best.date,
    avgHeartRate: heartCount ? Math.round(totalHeart / heartCount) : null,
    goalPercent: today.goalPercent,
    records: records.slice()
  }
}

export function createHistoryController(onChange) {
  function emit(history) {
    var model = summarize(history)
    if (typeof onChange === 'function') onChange(model)
    return model
  }

  return {
    load: function () { historyRepository.getHistory(emit) }
  }
}
