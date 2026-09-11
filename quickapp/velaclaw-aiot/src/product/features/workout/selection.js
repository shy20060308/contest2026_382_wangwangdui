import workoutState from '../../../domain/workout/state_machine'
import workoutRepository from '../../../domain/workout/repository'

function persisted(result) {
  return result === true || !!(result && result.persisted)
}

export default {
  getModeTypes: function () { return workoutState.getSupportedTypes() },
  hasActive: function (callback) {
    var current = workoutState.getActive()
    if (current) { if (callback) callback(true); return }
    workoutRepository.loadActive(function (stored) { if (callback) callback(!!(stored && stored.id)) })
  },
  create: function (type, callback) {
    var session = workoutState.start(type)
    workoutRepository.saveActive(session, function (result) {
      if (!persisted(result)) {
        workoutState.cancel()
        return
      }
      if (callback) callback(session)
    })
  }
}
