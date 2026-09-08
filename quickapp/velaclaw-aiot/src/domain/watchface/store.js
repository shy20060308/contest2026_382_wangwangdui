import storage from '../../capabilities/storage'

var SELECTED_FACE_KEY = 'selected_face_id_v3'
var selectedFaceId = ''

function requireFaceId(id) {
  if (typeof id !== 'string' || !id) throw new Error('Watchface store requires explicit faceId')
  return id
}

export default {
  loadSelectedFaceId: function (callback) {
    storage.get(SELECTED_FACE_KEY, function (value) {
      selectedFaceId = value
      if (callback) callback(selectedFaceId)
    })
  },

  setSelectedFaceId: function (id, callback) {
    selectedFaceId = requireFaceId(id)
    storage.set(SELECTED_FACE_KEY, selectedFaceId, callback)
  }
}
