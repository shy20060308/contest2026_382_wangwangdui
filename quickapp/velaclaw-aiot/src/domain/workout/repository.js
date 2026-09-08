import storage from '../../capabilities/storage'

var ACTIVE_KEY = 'active_workout_v3'
var RECORDS_KEY = 'workout_records_v3'
var MAX_RECORDS = 30

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
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
    storage.updateJSON(RECORDS_KEY, [], function (records) {
      var next = Array.isArray(records) ? records : []
      next.unshift(record)
      return next.length > MAX_RECORDS ? next.slice(0, MAX_RECORDS) : next
    }, function (records, result) {
      if (callback) callback(clone(record), result)
    })
  },

  getRecords: function (callback) {
    storage.getJSON(RECORDS_KEY, function (records) {
      if (callback) callback(clone(Array.isArray(records) ? records : []))
    }, [])
  },

  markAllSynced: function (callback) {
    storage.updateJSON(RECORDS_KEY, [], function (records) {
      var next = Array.isArray(records) ? records : []
      for (var i = 0; i < next.length; i++) next[i].synced = true
      return next
    }, function (records, result) {
      if (callback) callback(clone(records), result)
    })
  }
}
