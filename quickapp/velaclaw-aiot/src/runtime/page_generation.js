function nextValue(page) {
  return (typeof page._surfaceGeneration === 'number' ? page._surfaceGeneration : 0) + 1
}

function begin(page) {
  if (!page) throw new Error('Page generation requires a page instance')
  page._surfaceGeneration = nextValue(page)
  page._surfaceDestroyed = false
  return page._surfaceGeneration
}

function isCurrent(page, generation) {
  return !!page && !page._surfaceDestroyed && page._surfaceGeneration === generation
}

function destroy(page) {
  if (!page) return
  page._surfaceDestroyed = true
  page._surfaceGeneration = nextValue(page)
}

module.exports = {
  begin: begin,
  isCurrent: isCurrent,
  destroy: destroy
}
