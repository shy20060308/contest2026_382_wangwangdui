import watchfaceStore from '../../../domain/watchface/store'

function requireFaceIds(faceIds) {
  if (!Array.isArray(faceIds) || !faceIds.length) throw new Error('Watchface controller requires Surface faceIds')
  return faceIds.slice()
}

function requireAllowedFace(ids, id) {
  if (ids.indexOf(id) < 0) throw new Error('Watchface is not allowed by Surface configuration: ' + id)
  return id
}

export function createWatchfaceController(onChange) {
  var ids = []
  var selectedId = ''

  function snapshot() {
    if (!ids.length || !selectedId) throw new Error('Watchface controller must be configured before use')
    var selectedIndex = ids.indexOf(selectedId)
    if (selectedIndex < 0) throw new Error('Selected watchface is not allowed by current Surface configuration: ' + selectedId)
    return { selectedId: selectedId, selectedIndex: selectedIndex }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  return {
    configure: function (faceIds) {
      ids = requireFaceIds(faceIds)
      selectedId = ids[0]
      return emit()
    },
    load: function () {
      if (!ids.length) throw new Error('Watchface controller must be configured before load')
      watchfaceStore.loadSelectedFaceId(function (id) {
        if (id && ids.indexOf(id) >= 0) selectedId = id
        emit()
      })
    },
    select: function (id, callback) {
      if (!ids.length) throw new Error('Watchface controller must be configured before select')
      selectedId = requireAllowedFace(ids, id)
      emit()
      watchfaceStore.setSelectedFaceId(selectedId, function () { if (callback) callback(selectedId) })
    }
  }
}
