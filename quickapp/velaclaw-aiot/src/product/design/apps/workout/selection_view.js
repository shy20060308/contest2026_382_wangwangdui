var catalog = require('../../workout_catalog')

function project(model) {
  return {
    modes: catalog.list(model.modeTypes),
    hasActive: model.hasActive
  }
}

module.exports = { project: project }
