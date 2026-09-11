'use strict'

var schemaSubset = require('./json-schema-subset')

var FLOW_ONLY = { 'metric-grid': true, 'chart-card': true, 'list': true }
var NON_FLOW_ONLY = { 'metric-list': true }

function moduleFlow(module) {
  return !!(module && module.tokens && module.tokens.flow === true)
}

function semanticErrors(surface) {
  var errors = []
  var modules = Array.isArray(surface && surface.modules) ? surface.modules : []
  var ids = {}
  var hasStream = !!(surface && surface.tokens && surface.tokens.stream)

  for (var i = 0; i < modules.length; i++) {
    var module = modules[i] || {}
    var label = '$.modules[' + i + ']'
    if (module.id) {
      if (ids[module.id]) errors.push(label + '.id duplicates module id ' + module.id)
      ids[module.id] = true
    }
    var flow = moduleFlow(module)
    if (flow && !hasStream) errors.push(label + ' requests flow rendering but surface.tokens.stream is missing')
    if (FLOW_ONLY[module.type] && !flow) errors.push(label + ' type ' + module.type + ' is only rendered in flow; set tokens.flow=true')
    if (NON_FLOW_ONLY[module.type] && flow) errors.push(label + ' type ' + module.type + ' is not supported in flow')

    if (module.type === 'metric-grid') {
      var dynamicGrid = !!(module.bind && module.bind.items)
      var staticGrid = !!(module.props && Array.isArray(module.props.items))
      if (!dynamicGrid && !staticGrid) errors.push(label + ' metric-grid requires bind.items or props.items')
    }
    if (module.type === 'chart-card') {
      if (!(module.bind && module.bind.items)) errors.push(label + ' chart-card requires bind.items')
    }
    if (module.type === 'list') {
      if (!(module.bind && module.bind.items)) errors.push(label + ' list requires bind.items')
      var layout = module.props && module.props.layout
      if (layout !== 'menu' && layout !== 'record') errors.push(label + ' list props.layout must be menu or record')
    }
  }
  return errors
}

function validate(surface, schema) {
  return schemaSubset.validate(surface, schema).concat(semanticErrors(surface))
}

function assertValid(surface, schema, label) {
  var errors = validate(surface, schema)
  if (!errors.length) return surface
  throw new Error('Invalid V3 Surface contract' + (label ? ' (' + label + ')' : '') + ':\n- ' + errors.join('\n- '))
}

module.exports = {
  validate: validate,
  assertValid: assertValid,
  semanticErrors: semanticErrors
}
