import workoutRepository from '../../../domain/workout/repository'

function modelFor(records) {
  var totalSteps = 0
  for (var i = 0; i < records.length; i++) totalSteps += records[i].steps
  return { totalSteps: totalSteps, records: records.slice() }
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
