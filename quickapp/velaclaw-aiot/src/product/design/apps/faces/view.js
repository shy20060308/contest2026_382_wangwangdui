var visuals = require('../../watchface_catalog')

function decorate(face, selectedId) {
  var style = visuals.get(face.id)
  return {
    id: face.id,
    name: face.name,
    description: face.description,
    tag: face.tag,
    background: style.background,
    accent: style.accent,
    selected: face.id === selectedId,
    borderColor: face.id === selectedId ? style.accent : '#2C2C2E'
  }
}

function project(state, gap) {
  var faces = []
  var rectFaces = []
  for (var i = 0; i < state.faces.length; i++) {
    var face = decorate(state.faces[i], state.selectedId)
    faces.push(face)
    var rect = {}
    for (var key in face) rect[key] = face[key]
    rect.marginRight = i % 2 === 0 ? gap : 0
    rect.marginBottom = i < 2 ? gap : 0
    rectFaces.push(rect)
  }
  var selected = faces[state.selectedIndex]
  if (!selected) throw new Error('Faces view requires canonical selectedIndex')
  return {
    faces: faces,
    rectFaces: rectFaces,
    selectedIndex: state.selectedIndex,
    selectedName: selected.name,
    selectedAccent: selected.accent,
    previewName: selected.name
  }
}

module.exports = { project: project }
