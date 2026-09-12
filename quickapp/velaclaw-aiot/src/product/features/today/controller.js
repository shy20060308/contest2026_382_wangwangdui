import activityStore from '../../../domain/activity/store'
import healthStore from '../../../domain/health/store'
var calendar = require('../../../domain/calendar')

function copy(state) {
  return {
    currentMonth: state.currentMonth,
    currentDay: state.currentDay,
    currentWeekday: state.currentWeekday,
    lunarText: state.lunarText,
    steps: state.steps,
    calories: state.calories,
    standHours: state.standHours,
    heartRate: state.heartRate,
    goalPercent: state.goalPercent,
    calendarYear: state.calendarYear,
    calendarMonth: state.calendarMonth,
    calendarCells: state.calendarCells.slice()
  }
}

export function createTodayController(onChange) {
  var now = new Date()
  var state = {
    currentMonth: now.getMonth(),
    currentDay: now.getDate(),
    currentWeekday: now.getDay(),
    lunarText: calendar.formatLunar(now),
    steps: 0,
    calories: 0,
    standHours: 0,
    heartRate: null,
    goalPercent: 0,
    calendarYear: now.getFullYear(),
    calendarMonth: now.getMonth(),
    calendarCells: []
  }
  var started = false
  var lifecycleEpoch = 0

  function emit() {
    var value = copy(state)
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  function refreshCalendar() {
    state.calendarCells = calendar.buildMonth(state.calendarYear, state.calendarMonth, new Date())
  }

  function refreshDate() {
    var date = new Date()
    state.currentMonth = date.getMonth()
    state.currentDay = date.getDate()
    state.currentWeekday = date.getDay()
    state.lunarText = calendar.formatLunar(date)
    state.calendarYear = date.getFullYear()
    state.calendarMonth = date.getMonth()
    refreshCalendar()
  }

  function applyActivity(snapshot) {
    state.steps = snapshot.steps
    state.calories = snapshot.calories
    state.standHours = snapshot.standHours
    state.goalPercent = snapshot.goalPercent
    emit()
  }

  function onActivity(snapshot) {
    if (started) applyActivity(snapshot)
  }

  function onHealth(snapshot) {
    if (!started) return
    state.heartRate = snapshot && snapshot.heartRateLive && snapshot.heartRateSource === 'live' ? snapshot.heartRate : null
    emit()
  }

  refreshCalendar()

  return {
    start: function () {
      if (started) {
        refreshDate()
        applyActivity(activityStore.getSnapshot())
        return
      }
      started = true
      lifecycleEpoch++
      var epoch = lifecycleEpoch
      refreshDate()
      activityStore.subscribe(onActivity)
      emit()
      activityStore.hydrate(function (snapshot) {
        if (!started || epoch !== lifecycleEpoch) return
        applyActivity(snapshot)
      })
      healthStore.subscribeHeartRate(onHealth)
    },
    stop: function () {
      if (!started) return
      started = false
      lifecycleEpoch++
      activityStore.unsubscribe(onActivity)
      healthStore.unsubscribe(onHealth)
    },
    shiftMonth: function (delta) {
      var next = calendar.shiftMonth(state.calendarYear, state.calendarMonth, delta)
      state.calendarYear = next.year
      state.calendarMonth = next.month
      refreshCalendar()
      emit()
    }
  }
}
