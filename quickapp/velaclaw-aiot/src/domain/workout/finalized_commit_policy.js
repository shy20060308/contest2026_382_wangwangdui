function isFinalized(session) {
  return !!(session && session.finishedAt !== null && session.finishedAt !== undefined)
}

function decide(stored, persistence, finalized) {
  if (!finalized || !isFinalized(finalized)) throw new Error('Finalized commit policy requires a frozen session')
  var status = persistence && persistence.status ? persistence.status : ''
  if ((persistence && persistence.blocked) || status === 'corrupt' || status === 'io-error' || status === 'recovering') {
    return { action: 'block', reason: status || 'blocked' }
  }
  if (stored === null || stored === undefined) return { action: 'commit', reason: 'active-missing' }
  if (!stored || stored.id !== finalized.id) return { action: 'corrupt', reason: 'id-conflict' }
  if (!isFinalized(stored)) return { action: 'persist', reason: 'intent-not-durable' }
  if (stored.finishedAt !== finalized.finishedAt) return { action: 'corrupt', reason: 'finished-at-conflict' }
  return { action: 'commit', reason: 'intent-durable' }
}

module.exports = {
  isFinalized: isFinalized,
  decide: decide
}
