import storage from '../../capabilities/storage'

var SELECTED_FACE_KEY = 'selected_face_id_v3'
var RIGHT_FACE_TRANSITION_KEY = 'right_face_transition_v3'
var RIGHT_FACE_TRANSITION_MAX_AGE = 3000
var selectedFaceId = ''

function parseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch (error) {
    return fallback
  }
}

function requireFaceId(id) {
  if (typeof id !== 'string' || !id) throw new Error('Watchface store requires explicit faceId')
  return id
}

export default {
  getSelectedFaceId: function () {
    return selectedFaceId
  },

  loadSelectedFaceId: function (callback) {
    storage.get(SELECTED_FACE_KEY, function (value) {
      selectedFaceId = typeof value === 'string' ? value : ''
      if (callback) callback(selectedFaceId)
    }, true)
  },

  setSelectedFaceId: function (id, callback) {
    selectedFaceId = requireFaceId(id)
    storage.set(SELECTED_FACE_KEY, selectedFaceId, callback)
  },

  markRightFaceTransition: function (faceId, callback) {
    storage.set(RIGHT_FACE_TRANSITION_KEY, JSON.stringify({
      faceId: requireFaceId(faceId),
      updatedAt: Date.now()
    }), callback)
  },

  consumeRightFaceTransition: function (callback) {
    storage.get(RIGHT_FACE_TRANSITION_KEY, function (raw) {
      var transition = parseJson(raw, null)
      var recent = transition && transition.faceId &&
        Date.now() - Number(transition.updatedAt) < RIGHT_FACE_TRANSITION_MAX_AGE
      storage.delete(RIGHT_FACE_TRANSITION_KEY, function () {
        if (callback) callback(recent ? transition.faceId : '')
      })
    }, true)
  },

  clearRightFaceTransition: function () {
    storage.delete(RIGHT_FACE_TRANSITION_KEY)
  }
}
