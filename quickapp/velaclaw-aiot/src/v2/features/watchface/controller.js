import watchfaceStore from '../../../domain/watchface/store'
import faceCatalog from '../../../domain/watchface/catalog'

function requireFaceIds(faceIds) {
  if (!Array.isArray(faceIds) || !faceIds.length) throw new Error('Watchface controller requires Recipe faceIds')
  return faceIds.slice()
}

export function createWatchfaceController(onChange) {
  var ids = []
  var selectedId = ''

  function normalize(id) {
    if (!ids.length) throw new Error('Watchface controller must be configured before use')
    if (ids.indexOf(id) >= 0) return id
    return ids[0]
  }

  function snapshot() {
    selectedId = normalize(selectedId)
    var faces = faceCatalog.list(ids)
    var selectedIndex = faceCatalog.indexOf(ids, selectedId)
    return { selectedId: selectedId, selectedIndex: selectedIndex, faces: faces }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  return {
    configure: function (faceIds) {
      ids = requireFaceIds(faceIds)
      selectedId = normalize(selectedId)
      return emit()
    },
    load: function () {
      if (!ids.length) throw new Error('Watchface controller must be configured before load')
      watchfaceStore.loadSelectedFaceId(function (id) { selectedId = normalize(id); emit() })
    },
    select: function (id, callback) {
      if (!ids.length) throw new Error('Watchface controller must be configured before select')
      selectedId = normalize(id)
      emit()
      watchfaceStore.setSelectedFaceId(selectedId, function () { if (callback) callback(selectedId) })
    },
    refresh: emit
  }
}
