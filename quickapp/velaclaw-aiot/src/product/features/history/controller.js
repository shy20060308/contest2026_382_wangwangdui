import historyRepository from '../../../domain/history/repository'
var dayWindow = require('../../../domain/calendar/day_window')
var summaryCore = require('./summary_core')

export function createHistoryController(onChange) {
  function emit(history) {
    var model = summaryCore.summarize(history, dayWindow.dateKey(new Date()))
    if (typeof onChange === 'function') onChange(model)
    return model
  }

  return {
    load: function () { historyRepository.getHistory(emit) }
  }
}
