import watchfaceStore from '../../../domain/watchface/store'
import faceCatalog from '../../../domain/watchface/catalog'

function decorate(face, selectedId) {
  return {
    id: face.id,
    name: face.name,
    description: face.description,
    tag: face.tag,
    background: face.background,
    accent: face.accent,
    selected: face.id === selectedId,
    borderColor: face.id === selectedId ? face.accent : '#2C2C2E'
  }
}

export function createWatchfaceController(onChange) {
  var ids = []
  var selectedId = 'sport'

  function normalize(id) {
    if (ids.indexOf(id) >= 0) return id
    return ids.length ? ids[0] : 'sport'
  }

  function snapshot() {
    selectedId = normalize(selectedId)
    var source = faceCatalog.list(ids)
    var faces = []
    var selectedIndex = 0
    for (var i = 0; i < source.length; i++) {
      faces.push(decorate(source[i], selectedId))
      if (source[i].id === selectedId) selectedIndex = i
    }
    return { selectedId: selectedId, selectedIndex: selectedIndex, faces: faces }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  return {
    configure: function (faceIds) {
      ids = Array.isArray(faceIds) ? faceIds.slice() : []
      return emit()
    },
    load: function () {
      watchfaceStore.loadSelectedFaceId(function (id) { selectedId = normalize(id); emit() })
    },
    select: function (id, callback) {
      selectedId = normalize(id)
      emit()
      watchfaceStore.setSelectedFaceId(selectedId, function () { if (callback) callback(selectedId) })
    },
    refresh: emit
  }
}
