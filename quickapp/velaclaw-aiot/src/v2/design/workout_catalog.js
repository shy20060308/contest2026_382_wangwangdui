var MODES = {
  walk: { name: '步行', desc: '轻量有氧与日常健走', color: '#30D158' },
  run: { name: '跑步', desc: '更高步频与热量消耗', color: '#FF9F0A' }
}

function get(type) {
  var value = MODES[type]
  if (!value) throw new Error('Unknown V3 workout mode: ' + type)
  return { type: type, name: value.name, desc: value.desc, color: value.color }
}

function list(types) {
  if (!Array.isArray(types) || !types.length) throw new Error('Workout catalog requires explicit mode types')
  var result = []
  for (var i = 0; i < types.length; i++) result.push(get(types[i]))
  return result
}

module.exports = { get: get, list: list }
