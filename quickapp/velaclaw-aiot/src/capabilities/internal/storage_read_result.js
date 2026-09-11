function make(status, error) {
  return {
    ok: status === 'ok' || status === 'missing',
    status: status,
    error: error || null
  }
}

function missing(value, fallback) {
  return value === '' || value === undefined || value === null
    ? { value: fallback !== undefined ? fallback : null, result: make('missing') }
    : null
}

function raw(value, fallback) {
  var empty = missing(value, fallback)
  if (empty) return empty
  return { value: value, result: make('ok') }
}

function json(key, value, fallback) {
  var empty = missing(value, fallback)
  if (empty) return empty
  try {
    return { value: JSON.parse(value), result: make('ok') }
  } catch (cause) {
    var error = new Error('Invalid persisted JSON for ' + key)
    error.cause = cause
    return { value: fallback !== undefined ? fallback : null, result: make('corrupt', error) }
  }
}

function io(fallback, error) {
  return {
    value: fallback !== undefined ? fallback : null,
    result: make('io-error', error || new Error('storage read failed'))
  }
}

module.exports = {
  make: make,
  raw: raw,
  json: json,
  io: io
}
