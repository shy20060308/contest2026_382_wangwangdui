'use strict'

function typeMatches(value, type) {
  if (type === 'null') return value === null
  if (type === 'array') return Array.isArray(value)
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value)
  if (type === 'number') return typeof value === 'number' && isFinite(value)
  if (type === 'integer') return typeof value === 'number' && isFinite(value) && Math.floor(value) === value
  return typeof value === type
}

function sameValue(left, right) {
  if (left === right) return true
  return JSON.stringify(left) === JSON.stringify(right)
}

function pointer(root, ref) {
  if (typeof ref !== 'string' || ref.indexOf('#/') !== 0) throw new Error('Only local JSON Schema refs are supported: ' + ref)
  var parts = ref.slice(2).split('/')
  var value = root
  for (var i = 0; i < parts.length; i++) {
    var key = parts[i].replace(/~1/g, '/').replace(/~0/g, '~')
    if (!value || !Object.prototype.hasOwnProperty.call(value, key)) throw new Error('Unknown JSON Schema ref: ' + ref)
    value = value[key]
  }
  return value
}

function validateNode(value, schema, root, path, errors) {
  if (!schema || typeof schema !== 'object') return
  if (schema.$ref) {
    validateNode(value, pointer(root, schema.$ref), root, path, errors)
    return
  }

  if (schema.const !== undefined && !sameValue(value, schema.const)) errors.push(path + ' must equal ' + JSON.stringify(schema.const))
  if (Array.isArray(schema.enum) && !schema.enum.some(function (entry) { return sameValue(value, entry) })) errors.push(path + ' must be one of ' + JSON.stringify(schema.enum))

  if (schema.type !== undefined) {
    var types = Array.isArray(schema.type) ? schema.type : [schema.type]
    var validType = types.some(function (type) { return typeMatches(value, type) })
    if (!validType) {
      errors.push(path + ' must have type ' + types.join('|'))
      return
    }
  }

  if (typeof value === 'string' && schema.pattern) {
    var expression = new RegExp(schema.pattern)
    if (!expression.test(value)) errors.push(path + ' must match ' + schema.pattern)
  }

  if (Array.isArray(value)) {
    if (schema.items) {
      for (var itemIndex = 0; itemIndex < value.length; itemIndex++) validateNode(value[itemIndex], schema.items, root, path + '[' + itemIndex + ']', errors)
    }
    return
  }

  if (value === null || typeof value !== 'object') return

  var properties = schema.properties || {}
  var required = Array.isArray(schema.required) ? schema.required : []
  for (var requiredIndex = 0; requiredIndex < required.length; requiredIndex++) {
    var requiredKey = required[requiredIndex]
    if (!Object.prototype.hasOwnProperty.call(value, requiredKey)) errors.push(path + '.' + requiredKey + ' is required')
  }

  Object.keys(value).forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      validateNode(value[key], properties[key], root, path + '.' + key, errors)
      return
    }
    if (schema.additionalProperties === false) {
      errors.push(path + '.' + key + ' is not allowed')
      return
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validateNode(value[key], schema.additionalProperties, root, path + '.' + key, errors)
  })
}

function validate(value, schema) {
  var errors = []
  validateNode(value, schema, schema, '$', errors)
  return errors
}

module.exports = { validate: validate }
