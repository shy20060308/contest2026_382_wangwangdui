function cloneViewport(profile) {
  return {
    viewportClass: profile.viewportClass || '',
    viewportPosition: profile.viewportPosition || 'relative',
    viewportLeft: profile.viewportLeft || '0px',
    viewportTop: profile.viewportTop || '0px',
    viewportWidth: profile.viewportWidth || '100%',
    viewportHeight: profile.viewportHeight || '100%'
  }
}

function design(profile) {
  var result = cloneViewport(profile || {})
  if (!profile || !profile.isBetaPillViewport) return result

  // The beta pill compatibility viewport predates the Design Engine. It shifts
  // legacy page roots down to avoid the host's top cover. Design Engine pages
  // already reserve the capsule cap through safe geometry, so reusing that
  // legacy inset would make layout coordinates and rendered coordinates differ.
  // Keep one 192-wide design canvas and let safe-area geometry own the inset.
  result.viewportPosition = 'absolute'
  result.viewportLeft = '0px'
  result.viewportTop = '0px'
  result.viewportWidth = '192px'
  result.viewportHeight = Math.max(1, Math.round(Number(profile.logicalHeight) || 1)) + 'px'
  return result
}

module.exports = {
  legacy: cloneViewport,
  design: design
}
