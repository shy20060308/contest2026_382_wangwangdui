var activeSession = null

var MODE_RULES = {
  walk: {
    stepsPerSecond: 1.5,
    strideMeters: 0.7,
    caloriesPerStep: 0.04
  },
  run: {
    stepsPerSecond: 2.5,
    strideMeters: 0.9,
    caloriesPerStep: 0.06
  }
}

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function supportedTypes() {
  return Object.keys(MODE_RULES)
}

function requireType(type) {
  if (!MODE_RULES[type]) throw new Error('Unknown workout mode: ' + type)
  return type
}

function ruleFor(type) {
  return MODE_RULES[requireType(type)]
}

function validStatus(status) {
  return status === 'running' || status === 'paused'
}

function validNumber(value, integer) {
  return typeof value === 'number' && isFinite(value) && value >= 0 && (!integer || Math.round(value) === value)
}

function validPoint(point) {
  return point === null || (!!point && typeof point === 'object' && !Array.isArray(point) && typeof point.latitude === 'number' && isFinite(point.latitude) && typeof point.longitude === 'number' && isFinite(point.longitude))
}

function validGpsStatus(status) {
  return status === 'locating' || status === 'active' || status === 'unavailable' || status === 'paused'
}

function validHeartState(session) {
  if (!validNumber(session.heartTotal, false) || !validNumber(session.heartSamples, true)) return false
  if (session.heartSamples === 0) return session.heartTotal === 0 && session.currentHeartRate === null && session.heartSource === null
  return typeof session.currentHeartRate === 'number' && isFinite(session.currentHeartRate) && session.currentHeartRate > 0 && session.heartTotal > 0 && session.heartSource === 'official'
}

function validActiveSession(session) {
  return !!session &&
    typeof session.id === 'string' && !!session.id &&
    !!MODE_RULES[session.type] &&
    validStatus(session.status) &&
    validNumber(session.startedAt, false) &&
    validNumber(session.lastUpdateAt, false) &&
    session.lastUpdateAt >= session.startedAt &&
    validNumber(session.durationMs, false) &&
    validNumber(session.steps, true) &&
    typeof session.stepCarry === 'number' && isFinite(session.stepCarry) && session.stepCarry >= 0 && session.stepCarry < 1 &&
    validNumber(session.calories, true) &&
    validNumber(session.distanceMeters, false) &&
    validNumber(session.estimatedDistanceMeters, false) &&
    validNumber(session.gpsDistanceMeters, false) &&
    validGpsStatus(session.gpsStatus) &&
    validPoint(session.gpsPoint) &&
    validHeartState(session)
}

function updateRunning(session, now) {
  if (!session || session.status !== 'running') return session
  var current = now === undefined ? Date.now() : now
  var elapsedMs = Math.max(0, current - session.lastUpdateAt)
  if (elapsedMs < 500) return session

  var rule = ruleFor(session.type)
  var elapsedSeconds = elapsedMs / 1000
  session.durationMs += elapsedMs
  session.stepCarry += elapsedSeconds * rule.stepsPerSecond
  var newSteps = Math.floor(session.stepCarry)
  session.stepCarry -= newSteps
  session.steps += newSteps
  session.estimatedDistanceMeters = Math.round(session.steps * rule.strideMeters)
  session.distanceMeters = session.gpsDistanceMeters > 0 ? session.gpsDistanceMeters : session.estimatedDistanceMeters
  session.calories = Math.round(session.steps * rule.caloriesPerStep)
  session.lastUpdateAt = current
  return session
}

function rawRecord(session, endTime) {
  return {
    id: session.id,
    type: session.type,
    startTime: session.startedAt,
    endTime: endTime === undefined ? Date.now() : endTime,
    durationSec: Math.floor(session.durationMs / 1000),
    steps: session.steps,
    calories: session.calories,
    distanceMeters: session.distanceMeters,
    distanceSource: session.gpsDistanceMeters > 0 ? 'gps' : 'steps',
    gpsDistanceMeters: session.gpsDistanceMeters,
    gpsPoint: clone(session.gpsPoint),
    avgHeartRate: session.heartSamples > 0
      ? Math.round(session.heartTotal / session.heartSamples)
      : null,
    heartSource: session.heartSamples > 0 ? 'official' : 'none',
    synced: false
  }
}

export default {
  getSupportedTypes: function () {
    return supportedTypes()
  },

  getActive: function () {
    return clone(activeSession)
  },

  restore: function (session) {
    if (!validActiveSession(session)) {
      activeSession = null
      return null
    }
    activeSession = clone(session)
    updateRunning(activeSession)
    return clone(activeSession)
  },

  start: function (type, now) {
    var startedAt = now === undefined ? Date.now() : now
    requireType(type)
    activeSession = {
      id: 'workout_' + startedAt,
      type: type,
      status: 'running',
      startedAt: startedAt,
      lastUpdateAt: startedAt,
      durationMs: 0,
      steps: 0,
      stepCarry: 0,
      calories: 0,
      distanceMeters: 0,
      estimatedDistanceMeters: 0,
      gpsDistanceMeters: 0,
      gpsStatus: 'locating',
      gpsPoint: null,
      currentHeartRate: null,
      heartTotal: 0,
      heartSamples: 0,
      heartSource: null
    }
    return clone(activeSession)
  },

  tick: function (now) {
    if (!activeSession) return null
    updateRunning(activeSession, now)
    return clone(activeSession)
  },

  pause: function (now) {
    if (!activeSession) return null
    if (activeSession.status === 'running') {
      updateRunning(activeSession, now)
      activeSession.status = 'paused'
      activeSession.gpsStatus = 'paused'
    }
    return clone(activeSession)
  },

  resume: function (now) {
    if (!activeSession) return null
    if (activeSession.status === 'paused') {
      activeSession.status = 'running'
      activeSession.gpsStatus = 'locating'
      activeSession.lastUpdateAt = now === undefined ? Date.now() : now
    }
    return clone(activeSession)
  },

  updateGps: function (data) {
    if (!activeSession) return null
    if (!data) throw new Error('Workout GPS update requires data')
    if (data.status !== undefined && !validGpsStatus(data.status)) throw new Error('Invalid workout GPS status: ' + data.status)
    if (data.point !== undefined && !validPoint(data.point)) throw new Error('Invalid workout GPS point')
    if (data.distanceMeters !== undefined && !validNumber(data.distanceMeters, false)) throw new Error('Invalid workout GPS distance')
    if (data.status !== undefined) activeSession.gpsStatus = data.status
    if (data.point !== undefined) activeSession.gpsPoint = clone(data.point)
    if (data.distanceMeters !== undefined) {
      activeSession.gpsDistanceMeters = data.distanceMeters
      if (activeSession.gpsDistanceMeters > 0) activeSession.distanceMeters = activeSession.gpsDistanceMeters
    }
    return clone(activeSession)
  },

  updateHeartRate: function (value) {
    if (!activeSession) return null
    activeSession.currentHeartRate = value
    activeSession.heartTotal += value
    activeSession.heartSamples += 1
    activeSession.heartSource = 'official'
    return clone(activeSession)
  },

  finish: function (now) {
    if (!activeSession) return null
    updateRunning(activeSession, now)
    var record = rawRecord(activeSession, now)
    activeSession = null
    return record
  },

  cancel: function () {
    activeSession = null
  }
}
