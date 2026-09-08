var LEVEL_L1 = 1
var LEVEL_L2 = 2
var LEVEL_L3 = 3

function describe(level) {
  if (level === LEVEL_L1) return { level: 1, id: 'L1', kind: 'shared-expression' }
  if (level === LEVEL_L2) return { level: 2, id: 'L2', kind: 'local-expression' }
  if (level === LEVEL_L3) return { level: 3, id: 'L3', kind: 'independent-surface' }
  throw new Error('Unknown V3 difference level: ' + level)
}

module.exports = {
  L1: LEVEL_L1,
  L2: LEVEL_L2,
  L3: LEVEL_L3,
  describe: describe
}
