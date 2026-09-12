import { createWorkoutHistoryController } from '../features/workout/history_controller'
import { noop } from './shared'

function create(onChange) {
  var controller = createWorkoutHistoryController(function (model) {
    var source = model || { totalSteps: 0, records: [] }
    var records = Array.isArray(source.records) ? source.records : []
    if (typeof onChange === 'function') onChange({ totalSteps: source.totalSteps, recordCount: records.length, empty: records.length === 0, hasRecords: records.length > 0, records: records })
  })
  return { start: function () { controller.refresh() }, stop: noop, destroy: noop, action: noop }
}

export default { id: 'workout-history', create: create }
