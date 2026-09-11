var SUPPORTED_TYPES = { walk: true, run: true }

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function supportedTypes() {
  return Object.keys(SUPPORTED_TYPES)
}

function requireType(type) {
  if (!SUPPORTED_TYPES[type]) throw new Error('Unknown workout mode: ' + type)
  return type
}

function validStatus(status) {
  return status === 'running' || status === 'paused'
}

function validNumber(value, integer) {
  return typeof value === 'number' && isFinite(value) && value >= 0 && (!integer || Math.round(value) === value)
}

function validNullableNumber(value, integer) {
  return value === null || validNumber(value, integer)
}

function validPoint(point) {
  return point === null || (!!point && typeof point === 'object' && !Array.isArray(point) && typeof point.latitude === 'number' && isFinite(point.latitude) && typeof point.longitude === 'number' && isFinite(point.longitude))
}

function validGpsStatus(status) {
  return status === 'locating' || status === 'active' || status === 'unavailable' || status === 'paused'
}

function validDistanceSource(source) {
  return source === 'unavailable' || source === 'gps'
}

function validHeartState(session) {
  if (!validNumber(session.heartTotal, false) || !validNumber(session.heartSamples, true)) return false
  if (session.heartSamples === 0) return session.heartTotal === 0 && session.currentHeartRate === null && session.heartSource === null
  return typeof session.currentHeartRate === 'number' && isFinite(session.currentHeartRate) && session.currentHeartRate > 0 && session.heartTotal > 0 && session.heartSource === 'official'
}

function validFinishedState(session) {
  if (session.finishedAt === undefined || session.finishedAt === null) return true
  return validNumber(session.finishedAt, false) && session.finishedAt >= session.lastUpdateAt && session.status === 'paused' && session.gpsStatus === 'paused'
}

function validActiveSession(session) {
  return !!session &&
    typeof session.id === 'string' && !!session.id &&
    !!SUPPORTED_TYPES[session.type] &&
    validStatus(session.status) &&
    validNumber(session.startedAt, false) &&
    validNumber(session.lastUpdateAt, false) &&
    session.lastUpdateAt >= session.startedAt &&
    validNumber(session.durationMs, false) &&
    validNullableNumber(session.steps, true) &&
    validNullableNumber(session.calories, true) &&
    validNullableNumber(session.distanceMeters, false) &&
    validNullableNumber(session.estimatedDistanceMeters, false) &&
    validNumber(session.gpsDistanceMeters, false) &&
    validDistanceSource(session.distanceSource) &&
    validGpsStatus(session.gpsStatus) &&
    validPoint(session.gpsPoint) &&
    validHeartState(session) &&
    validFinishedState(session)
}

function updateRunning(session, now) {
  if (!session || session.status !== 'running' || session.finishedAt !== null) return session
  var current = now === undefined ? Date.now() : now
  var elapsedMs = Math.max(0, current - session.lastUpdateAt)
  if (elapsedMs < 500) return session
  session.durationMs += elapsedMs
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
    distanceSource: session.distanceSource,
    gpsDistanceMeters: session.gpsDistanceMeters,
    gpsPoint: clone(session.gpsPoint),
    avgHeartRate: session.heartSamples > 0 ? Math.round(session.heartTotal / session.heartSamples) : null,
    heartSource: session.heartSamples > 0 ? 'official' : 'none',
    synced: false
  }
}

function createStateMachine() {
  var activeSession = null

  return {
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
      if (activeSession.finishedAt === undefined) activeSession.finishedAt = null
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
        finishedAt: null,
        steps: null,
        calories: null,
        distanceMeters: null,
        estimatedDistanceMeters: null,
        distanceSource: 'unavailable',
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
      if (activeSession.finishedAt !== null) return clone(activeSession)
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
        activeSession.distanceMeters = data.distanceMeters
        activeSession.distanceSource = 'gps'
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
      var completedAt = now === undefined ? Date.now() : now
      if (activeSession.finishedAt === null) {
        if (activeSession.status === 'running') updateRunning(activeSession, completedAt)
        activeSession.status = 'paused'
        activeSession.gpsStatus = 'paused'
        activeSession.finishedAt = completedAt
      }
      return rawRecord(activeSession, activeSession.finishedAt)
    },

    complete: function (recordId) {
      if (!activeSession) return false
      if (activeSession.id !== recordId) throw new Error('Workout completion id does not match active session')
      activeSession = null
      return true
    },

    cancel: function () {
      activeSession = null
    }
  }
}

module.exports = {
  createStateMachine: createStateMachine,
  supportedTypes: supportedTypes,
  validActiveSession: validActiveSession
}
