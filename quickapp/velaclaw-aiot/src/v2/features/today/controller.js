import activityStore from '../../../domain/activity/store'
import healthStore from '../../../domain/health/store'
import { mapActivity } from '../../../presentation/mappers/activity'
var calendar = require('../../domain/calendar')

var WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function pad2(value) { return value < 10 ? '0' + value : '' + value }

function copy(state) {
  return {
    yearText: state.yearText,
    monthText: state.monthText,
    monthNumberText: state.monthNumberText,
    dayText: state.dayText,
    weekdayText: state.weekdayText,
    lunarText: state.lunarText,
    stepsText: state.stepsText,
    caloriesText: state.caloriesText,
    standText: state.standText,
    heartText: state.heartText,
    goalPercent: state.goalPercent,
    goalWidth: state.goalWidth,
    calendarYear: state.calendarYear,
    calendarMonth: state.calendarMonth,
    calendarTitle: state.calendarTitle,
    calendarCells: state.calendarCells.slice()
  }
}

export function createTodayController(onChange) {
  var now = new Date()
  var state = {
    yearText: '', monthText: '', monthNumberText: '', dayText: '', weekdayText: '', lunarText: '',
    stepsText: '0', caloriesText: '0', standText: '0', heartText: '--', goalPercent: 0, goalWidth: '0%',
    calendarYear: now.getFullYear(), calendarMonth: now.getMonth(), calendarTitle: '', calendarCells: []
  }
  var started = false

  function emit() { if (typeof onChange === 'function') onChange(copy(state)) }
  function refreshCalendar() {
    var today = new Date()
    state.calendarTitle = state.calendarYear + '年 ' + (state.calendarMonth + 1) + '月'
    state.monthNumberText = pad2(state.calendarMonth + 1)
    state.calendarCells = calendar.buildMonth(state.calendarYear, state.calendarMonth, today)
  }
  function refreshDate() {
    var date = new Date()
    state.yearText = date.getFullYear() + ' 年'
    state.monthText = date.getMonth() + 1 + '月'
    state.dayText = String(date.getDate())
    state.weekdayText = WEEKDAYS[date.getDay()]
    state.lunarText = calendar.formatLunar(date)
    state.calendarYear = date.getFullYear()
    state.calendarMonth = date.getMonth()
    refreshCalendar()
  }
  function applyActivity(snapshot) {
    var view = mapActivity(snapshot)
    state.stepsText = view.stepsText
    state.caloriesText = view.caloriesText
    state.standText = view.standText
    state.goalPercent = view.goalPercent
    state.goalWidth = view.goalWidth
    emit()
  }
  function onHealth(snapshot) {
    if (snapshot && snapshot.heartRate !== undefined && snapshot.heartRate !== null) state.heartText = String(snapshot.heartRate)
    emit()
  }

  return {
    start: function () {
      if (started) return
      started = true
      refreshDate()
      emit()
      activityStore.hydrate(applyActivity)
      healthStore.subscribeHeartRate(onHealth)
    },
    stop: function () {
      if (!started) return
      started = false
      healthStore.unsubscribe(onHealth)
    },
    resetToday: function () { refreshDate(); emit() },
    shiftMonth: function (delta) {
      var next = calendar.shiftMonth(state.calendarYear, state.calendarMonth, delta)
      state.calendarYear = next.year
      state.calendarMonth = next.month
      refreshCalendar()
      emit()
    },
    getSnapshot: function () { return copy(state) }
  }
}
