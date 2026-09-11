import storage from '../../capabilities/storage'

var ACTIVE_KEY = 'active_workout_v4'
var RECORDS_KEY = 'workout_records_v4'
var MAX_RECORDS = 30

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function requireNumber(name, value, integer) {
  if (typeof value !== 'number' || !isFinite(value) || value < 0 || (integer && Math.round(value) !== value)) throw new Error('Invalid V4 workout record field: ' + name)
  return value
}

function requireNullableNumber(name, value, integer) {
  if (value === null) return null
  return requireNumber(name, value, integer)
}

function requirePoint(point) {
  if (point === null) return null
  if (!point || typeof point !== 'object' || Array.isArray(point)) throw new Error('Invalid V4 workout record field: gpsPoint')
  if (typeof point.latitude !== 'number' || !isFinite(point.latitude) || typeof point.longitude !== 'number' || !isFinite(point.longitude)) throw new Error('Invalid V4 workout record field: gpsPoint')
  return point
}

function requireRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid V4 workout record')
  if (typeof record.id !== 'string' || !record.id) throw new Error('Invalid V4 workout record field: id')
  if (record.type !== 'walk' && record.type !== 'run') throw new Error('Invalid V4 workout record field: type')
  if (record.distanceSource !== 'gps' && record.distanceSource !== 'unavailable') throw new Error('Invalid V4 workout record field: distanceSource')
  if (record.heartSource !== 'official' && record.heartSource !== 'none') throw new Error('Invalid V4 workout record field: heartSource')
  if (typeof record.synced !== 'boolean') throw new Error('Invalid V4 workout record field: synced')
  requireNumber('startTime', record.startTime, false)
  requireNumber('endTime', record.endTime, false)
  requireNumber('durationSec', record.durationSec, true)
  requireNullableNumber('steps', record.steps, true)
  requireNullableNumber('calories', record.calories, true)
  requireNullableNumber('distanceMeters', record.distanceMeters, false)
  requireNumber('gpsDistanceMeters', record.gpsDistanceMeters, false)
  requirePoint(record.gpsPoint)
  if (record.avgHeartRate !== null && (typeof record.avgHeartRate !== 'number' || !isFinite(record.avgHeartRate) || record.avgHeartRate <= 0)) throw new Error('Invalid V4 workout record field: avgHeartRate')
  return record
}

function requireRecords(value) {
  if (!Array.isArray(value)) throw new Error('V4 workout records persistence must be an array')
  for (var i = 0; i < value.length; i++) requireRecord(value[i])
  return value
}

function sameRecord(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export default {
  saveActive: function (session, callback) {
    storage.set(ACTIVE_KEY, session, callback)
  },

  loadActive: function (callback) {
    storage.getJSON(ACTIVE_KEY, function (session) {
      if (callback) callback(clone(session))
    }, null)
  },

  clearActive: function (callback) {
    storage.delete(ACTIVE_KEY, callback)
  },

  saveRecord: function (record, callback) {
    requireRecord(record)
    var savedRecord = record
    storage.updateJSON(RECORDS_KEY, [], function (records) {
      var next = requireRecords(records)
      for (var i = 0; i < next.length; i++) {
        if (next[i].id !== record.id) continue
        if (!sameRecord(next[i], record)) throw new Error('Conflicting workout record id: ' + record.id)
        savedRecord = next[i]
        return next
      }
      next.unshift(record)
      return next.length > MAX_RECORDS ? next.slice(0, MAX_RECORDS) : next
    }, function (records, result) {
      if (callback) callback(clone(savedRecord), result)
    })
  },

  getRecords: function (callback) {
    storage.getJSON(RECORDS_KEY, function (records) {
      if (callback) callback(clone(requireRecords(records)))
    }, [])
  },

  markAllSynced: function (callback) {
    storage.updateJSON(RECORDS_KEY, [], function (records) {
      var next = requireRecords(records)
      for (var i = 0; i < next.length; i++) next[i].synced = true
      return next
    }, function (records, result) {
      if (callback) callback(clone(records), result)
    })
  }
}
