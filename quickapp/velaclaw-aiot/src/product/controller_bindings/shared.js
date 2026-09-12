function noop() {}
function copyState(source) { var result = {}; for (var key in (source || {})) result[key] = source[key]; return result }
function interactionOwner(context) { return context && context.interactionOwner ? context.interactionOwner : null }
function ownerToken(owner) { return owner ? owner.capture() : null }
function ownerCurrent(owner, token) { return !owner || owner.isCurrent(token) }
function ownerKey(owner) { return owner ? owner.key() : '' }

function configuredFaceIds(config, label) {
  var source = config && Array.isArray(config.faceIds) ? config.faceIds : []
  if (!source.length) throw new Error(label + ' requires JSON controllerConfig.faceIds')
  var seen = {}
  var result = []
  for (var i = 0; i < source.length; i++) {
    var id = String(source[i] || '')
    if (!id) throw new Error(label + ' controllerConfig.faceIds may not contain empty ids')
    if (seen[id]) throw new Error(label + ' controllerConfig.faceIds may not contain duplicates: ' + id)
    seen[id] = true
    result.push(id)
  }
  return result
}

export { noop, copyState, interactionOwner, ownerToken, ownerCurrent, ownerKey, configuredFaceIds }
