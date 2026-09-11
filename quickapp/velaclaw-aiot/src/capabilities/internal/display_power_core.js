function failure(action, data, code) {
  var error = data instanceof Error ? data : new Error('brightness.' + action + ' failed')
  if (code !== undefined) error.code = code
  return { ok: false, error: error }
}

function success(value) {
  return value === undefined ? { ok: true, error: null } : { ok: true, value: value, error: null }
}

function invoke(api, action, params, callback, projector) {
  if (typeof api !== 'function') {
    if (callback) callback(failure(action, new Error('brightness.' + action + ' unavailable')))
    return false
  }
  var settled = false
  function done(result) {
    if (settled) return
    settled = true
    if (callback) callback(result)
  }
  var request = {}
  for (var key in (params || {})) request[key] = params[key]
  request.success = function (data) {
    if (typeof projector !== 'function') { done(success()); return }
    try {
      done(success(projector(data || {})))
    } catch (error) {
      done(failure(action, error))
    }
  }
  request.fail = function (data, code) { done(failure(action, data, code)) }
  try {
    api(request)
    return true
  } catch (error) {
    done(failure(action, error))
    return false
  }
}

function createDisplayPower(brightness) {
  return {
    setBrightness: function (value, callback) {
      if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > 255 || Math.round(value) !== value) {
        if (callback) callback(failure('setValue', new Error('Invalid brightness value')))
        return false
      }
      return invoke(brightness && brightness.setValue, 'setValue', { value: value }, callback)
    },
    setMode: function (automatic, callback) {
      if (typeof automatic !== 'boolean') {
        if (callback) callback(failure('setMode', new Error('Invalid brightness mode')))
        return false
      }
      return invoke(brightness && brightness.setMode, 'setMode', { mode: automatic ? 1 : 0 }, callback)
    },
    setKeepScreenOn: function (keepScreenOn, callback) {
      if (typeof keepScreenOn !== 'boolean') {
        if (callback) callback(failure('setKeepScreenOn', new Error('Invalid keep-screen-on value')))
        return false
      }
      return invoke(brightness && brightness.setKeepScreenOn, 'setKeepScreenOn', { keepScreenOn: keepScreenOn }, callback)
    },
    getBrightness: function (callback) {
      return invoke(brightness && brightness.getValue, 'getValue', {}, callback, function (data) {
        if (typeof data.value !== 'number' || !isFinite(data.value)) throw new Error('Invalid brightness.getValue result')
        return data.value
      })
    },
    getMode: function (callback) {
      return invoke(brightness && brightness.getMode, 'getMode', {}, callback, function (data) {
        if (data.mode !== 0 && data.mode !== 1) throw new Error('Invalid brightness.getMode result')
        return data.mode === 1
      })
    },
    isAvailable: function () { return !!(brightness && brightness.setValue) }
  }
}

module.exports = { createDisplayPower: createDisplayPower }
