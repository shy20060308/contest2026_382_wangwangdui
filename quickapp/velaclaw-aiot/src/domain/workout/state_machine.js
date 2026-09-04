var activeSession = null

var MODE_RULES = {
  walk: {
    stepsPerSecond: 1.5,
    strideMeters: 0.7,
    caloriesPerStep: 0.04,
    initialHeartRate: 86,
    heartRateSpan: 10
  },
  run: {
    stepsPerSecond: 2.5,
    strideMeters: 0.9,
    caloriesPerStep: 0.06,
    initialHeartRate: 118,
    heartRateSpan: 12
  }
}

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function ruleFor(type) {
  return MODE_RULES[type] || MODE_RULES.walk
}

function normalizeType(type) {
  return MODE_RULES[type] ? type : 'walk'
}

function updateRunning(session, now) {
  if (!session || session.status !== 'running') return session
  var current = now || Date.now()
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
  session.currentHeartRate = rule.initialHeartRate + (session.steps % rule.heartRateSpan)
  session.heartTotal += session.currentHeartRate
  session.heartSamples += 1
  session.lastUpdateAt = current
  return session
}

function rawRecord(session, endTime) {
  return {
    id: session.id,
    type: session.type,
    startTime: session.startedAt,
    endTime: endTime || Date.now(),
    durationSec: Math.floor(session.durationMs / 1000),
    steps: session.steps,
    calories: session.calories,
    distanceMeters: session.distanceMeters,
    distanceSource: session.gpsDistanceMeters > 0 ? 'gps' : 'steps',
    gpsDistanceMeters: session.gpsDistanceMeters || 0,
    gpsPoint: clone(session.gpsPoint),
    avgHeartRate: session.heartSamples > 0
      ? Math.round(session.heartTotal / session.heartSamples)
      : session.currentHeartRate,
    synced: false
  }
}

export default {
  getActive: function () {
    return clone(activeSession)
  },

  restore: function (session) {
    activeSession = session && session.id ? clone(session) : null
    if (activeSession) updateRunning(activeSession)
    return clone(activeSession)
  },

  start: function (type, now) {
    var startedAt = now || Date.now()
    var normalized = normalizeType(type)
    var rule = ruleFor(normalized)
    activeSession = {
      id: 'workout_' + startedAt,
      type: normalized,
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
      currentHeartRate: rule.initialHeartRate,
      heartTotal: rule.initialHeartRate,
      heartSamples: 1
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
      activeSession.lastUpdateAt = now || Date.now()
    }
    return clone(activeSession)
  },

  updateGps: function (data) {
    if (!activeSession || !data) return this.tick()
    if (data.status) activeSession.gpsStatus = data.status
    if (data.point) activeSession.gpsPoint = clone(data.point)
    if (typeof data.distanceMeters === 'number' && data.distanceMeters >= 0) {
      activeSession.gpsDistanceMeters = Math.round(data.distanceMeters)
      if (activeSession.gpsDistanceMeters > 0) activeSession.distanceMeters = activeSession.gpsDistanceMeters
    }
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
