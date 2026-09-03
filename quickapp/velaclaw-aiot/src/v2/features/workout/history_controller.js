import workoutRepository from '../../../domain/workout/repository'
import { mapRecord } from '../../../presentation/mappers/workout'

function formatNumber(value) {
  return Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function mapHistory(records) {
  var source = Array.isArray(records) ? records : []
  var totalSteps = 0
  var result = []
  for (var i = 0; i < source.length; i++) {
    var record = mapRecord(source[i])
    totalSteps += Number(record.steps) || 0
    result.push({
      id: record.id,
      typeName: record.typeName,
      startText: record.startText,
      durationText: record.durationText,
      stepsText: formatNumber(record.steps),
      caloriesText: formatNumber(record.calories),
      distanceText: record.distanceText,
      heartText: record.avgHeartRate ? record.avgHeartRate + ' bpm' : '--',
      syncText: record.synced ? '已同步' : '待同步',
      distanceSourceText: record.distanceSource === 'gps' ? 'GPS 距离' : '步幅估算'
    })
  }
  return {
    totalCount: result.length.toString(),
    totalSteps: formatNumber(totalSteps),
    empty: result.length === 0,
    records: result
  }
}

export function createWorkoutHistoryController(onChange) {
  function emit(records) {
    if (typeof onChange === 'function') onChange(mapHistory(records))
  }
  return {
    refresh: function () {
      workoutRepository.getRecords(function (records) { emit(records) })
    },
    markAllSynced: function () {
      workoutRepository.markAllSynced(function (records) { emit(records) })
    }
  }
}
