var FACE_CATALOG = {
  sport: { id: 'sport', name: '活力数字', description: '时间、心率、步数集中展示', tag: '运动日常' },
  simple: { id: 'simple', name: '极简霓虹', description: '大时间和目标完成度', tag: '简洁耐看' },
  dashboard: { id: 'dashboard', name: '运动仪表', description: '进度条和心率趋势图', tag: '数据控' },
  mechanical: { id: 'mechanical', name: '曜金机械', description: '金属刻度、三针和机械副盘', tag: '经典机械' },
  alpine: { id: 'alpine', name: '星野远山', description: '星空雪山和透明数据层', tag: '沉浸夜景' }
}

function clone(face) {
  return { id: face.id, name: face.name, description: face.description, tag: face.tag }
}

function get(id) {
  var face = FACE_CATALOG[id]
  if (!face) throw new Error('Unknown watchface: ' + id)
  return clone(face)
}

function requireIds(ids) {
  if (!Array.isArray(ids) || !ids.length) throw new Error('Watchface catalog requires explicit faceIds')
  return ids
}

function list(ids) {
  var source = requireIds(ids)
  var result = []
  for (var i = 0; i < source.length; i++) result.push(get(source[i]))
  return result
}

function indexOf(ids, faceId) {
  var source = requireIds(ids)
  var index = source.indexOf(faceId)
  if (index < 0) throw new Error('Watchface not allowed by Recipe: ' + faceId)
  return index
}

module.exports = { get: get, list: list, indexOf: indexOf }
