import workoutRepository from '../../../domain/workout/repository'

function modelFor(records) {
  var totalSteps = 0
  var measuredStepRecords = 0
  for (var i = 0; i < records.length; i++) {
    if (typeof records[i].steps !== 'number' || !isFinite(records[i].steps)) continue
    totalSteps += records[i].steps
    measuredStepRecords++
  }
  return { totalSteps: measuredStepRecords ? totalSteps : null, records: records.slice() }
}

export function createWorkoutHistoryController(onChange) {
  function emit(records) {
    var model = modelFor(records)
    if (typeof onChange === 'function') onChange(model)
    return model
  }
  return {
    refresh: function () { workoutRepository.getRecords(emit) }
  }
}
