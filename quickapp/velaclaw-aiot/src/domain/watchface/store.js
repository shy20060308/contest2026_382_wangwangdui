import storage from '../../capabilities/storage'

var SELECTED_FACE_KEY = 'selected_face_id_v3'
var selectedFaceId = ''
var persistenceStatus = 'loading'
var persistenceError = null

function requireFaceId(id) {
  if (typeof id !== 'string' || !id) throw new Error('Watchface store requires explicit faceId')
  return id
}

function persistenceSnapshot() {
  return {
    status: persistenceStatus,
    blocked: persistenceStatus === 'io-error',
    recoverable: false,
    errorCode: persistenceError && persistenceError.code !== undefined ? String(persistenceError.code) : '',
    errorMessage: persistenceError && persistenceError.message ? persistenceError.message : ''
  }
}

export default {
  loadSelectedFaceId: function (callback) {
    storage.getResult(SELECTED_FACE_KEY, function (value, result) {
      if (!result || !result.ok) {
        selectedFaceId = ''
        persistenceStatus = result && result.status ? result.status : 'io-error'
        persistenceError = result && result.error ? result.error : new Error('Watchface persistence read failed')
        if (callback) callback(selectedFaceId, persistenceSnapshot())
        return
      }
      selectedFaceId = value || ''
      persistenceStatus = result.status || 'ok'
      persistenceError = null
      if (callback) callback(selectedFaceId, persistenceSnapshot())
    }, '')
  },

  setSelectedFaceId: function (id, callback) {
    selectedFaceId = requireFaceId(id)
    storage.set(SELECTED_FACE_KEY, selectedFaceId, callback)
  },

  getPersistenceState: persistenceSnapshot
}
