var WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function pad2(value) { return value < 10 ? '0' + value : '' + value }
function formatNumber(value) { return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }

function decorateCells(cells) {
  var result = []
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i]
    result.push({
      key: cell.key,
      day: cell.day,
      inMonth: cell.inMonth,
      isToday: cell.isToday,
      textColor: cell.isToday ? '#FFFFFF' : (cell.inMonth ? '#E5E5EA' : '#4D4D52'),
      backgroundColor: cell.isToday ? '#FF375F' : 'transparent'
    })
  }
  return result
}

function project(model) {
  return {
    yearText: model.currentYear + ' 年',
    monthText: (model.currentMonth + 1) + '月',
    monthNumberText: pad2(model.calendarMonth + 1),
    dayText: String(model.currentDay),
    weekdayText: WEEKDAYS[model.currentWeekday],
    lunarText: model.lunarText,
    stepsText: formatNumber(model.steps),
    caloriesText: formatNumber(model.calories),
    standText: formatNumber(model.standHours),
    heartText: model.heartRate === null ? '--' : String(model.heartRate),
    goalPercent: model.goalPercent,
    goalWidth: model.goalPercent + '%',
    calendarTitle: model.calendarYear + '年 ' + (model.calendarMonth + 1) + '月',
    calendarCells: decorateCells(model.calendarCells)
  }
}

module.exports = { project: project, decorateCells: decorateCells }
