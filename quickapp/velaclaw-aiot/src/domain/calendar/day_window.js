function pad2(value) { return value < 10 ? '0' + value : '' + value }

function dateKey(date) {
  var value = date || new Date()
  return value.getFullYear() + '-' + pad2(value.getMonth() + 1) + '-' + pad2(value.getDate())
}

function parseDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  var parts = value.split('-')
  var year = Number(parts[0])
  var month = Number(parts[1])
  var day = Number(parts[2])
  var date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

function shiftDateKey(value, delta) {
  var date = parseDateKey(value)
  if (!date) throw new Error('Invalid calendar date key: ' + value)
  date.setDate(date.getDate() + delta)
  return dateKey(date)
}

function inRecentWindow(value, today, days) {
  if (!parseDateKey(value) || !parseDateKey(today)) return false
  var count = Math.floor(Number(days) || 0)
  if (count < 1) return false
  var first = shiftDateKey(today, -(count - 1))
  return value >= first && value <= today
}

function filterRecent(records, today, days) {
  var source = Array.isArray(records) ? records : []
  var result = []
  for (var i = 0; i < source.length; i++) {
    var record = source[i]
    if (record && inRecentWindow(record.date, today, days)) result.push(record)
  }
  result.sort(function (a, b) { return a.date > b.date ? 1 : (a.date < b.date ? -1 : 0) })
  return result
}

module.exports = {
  dateKey: dateKey,
  parseDateKey: parseDateKey,
  shiftDateKey: shiftDateKey,
  inRecentWindow: inRecentWindow,
  filterRecent: filterRecent
}
