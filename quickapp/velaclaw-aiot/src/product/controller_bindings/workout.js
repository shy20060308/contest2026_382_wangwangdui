import navigation from '../../runtime/navigation'
import { createWorkoutController } from '../features/workout/controller'
import { interactionOwner, ownerToken, ownerCurrent, ownerKey } from './shared'

function workoutState(session, confirming) {
  if (!session) return { hasSession: false, confirming: !!confirming, finalized: false }
  var finalized = session.finishedAt !== null && session.finishedAt !== undefined
  return {
    hasSession: true, confirming: !!confirming, finalized: finalized, type: session.type,
    status: finalized ? 'finalizing' : session.status,
    durationMs: session.durationMs, steps: session.steps, calories: session.calories,
    distanceMeters: session.distanceMeters, currentHeartRate: session.currentHeartRate,
    gpsStatus: session.gpsStatus, gpsDistanceMeters: session.gpsDistanceMeters
  }
}

function create(onChange, context) {
  var owner = interactionOwner(context)
  var current = null
  var confirming = false
  function emit() { if (typeof onChange === 'function') onChange(workoutState(current, confirming)) }
  function isFinalized() { return !!(current && current.finishedAt !== null && current.finishedAt !== undefined) }
  function finishAndNavigate() {
    confirming = false
    var token = ownerToken(owner)
    controller.finish(function () {
      if (ownerCurrent(owner, token)) navigation.replace('/pages/workout_history', null, ownerKey(owner))
    })
  }
  var controller = createWorkoutController(function (session) { current = session; emit() })
  return {
    start: function () {
      var token = ownerToken(owner)
      controller.loadActive(function (session) {
        if (!ownerCurrent(owner, token)) return
        if (!session) { navigation.back(ownerKey(owner)); return }
        current = session
        emit()
      })
    },
    stop: function () { controller.stop() }, destroy: function () { controller.stop() },
    action: function (name) {
      if (name === 'workout-toggle-pause') {
        if (!current || isFinalized()) return
        if (current.status === 'running') controller.pause()
        else if (current.status === 'paused') controller.resume()
        else throw new Error('Unsupported workout state: ' + current.status)
        return
      }
      if (name === 'workout-request-finish') {
        if (isFinalized()) { finishAndNavigate(); return }
        confirming = true
        emit()
        return
      }
      if (name === 'workout-cancel-finish') { confirming = false; emit(); return }
      if (name === 'workout-confirm-finish') { finishAndNavigate(); return }
      throw new Error('Unknown workout action: ' + name)
    }
  }
}

export default { id: 'workout', create: create }
