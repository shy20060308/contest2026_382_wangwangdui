import { noop } from './shared'

function workoutHistoryControllerFactory() {
  var feature = require('../features/workout/history_controller')
  if (!feature || typeof feature.createWorkoutHistoryController !== 'function') throw new Error('Workout history feature controller module unavailable')
  return feature.createWorkoutHistoryController
}

function create(onChange) {
  var createWorkoutHistoryController = workoutHistoryControllerFactory()
  var controller = createWorkoutHistoryController(function (model) {
    var source = model || { totalSteps: 0, records: [] }
    var records = Array.isArray(source.records) ? source.records : []
    if (typeof onChange === 'function') onChange({ totalSteps: source.totalSteps, recordCount: records.length, empty: records.length === 0, hasRecords: records.length > 0, records: records })
  })
  return { start: function () { controller.refresh() }, stop: noop, destroy: noop, action: noop }
}

export default { id: 'workout-history', create: create }
