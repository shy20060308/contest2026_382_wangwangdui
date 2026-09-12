import navigation from '../../runtime/navigation'
import workoutSelectionFeature from '../features/workout/selection'
import { noop, interactionOwner, ownerToken, ownerCurrent, ownerKey } from './shared'

function create(onChange, context) {
  var owner = interactionOwner(context)
  var state = { modeTypes: workoutSelectionFeature.getModeTypes(), hasActive: false }
  function emit() { if (typeof onChange === 'function') onChange({ modeTypes: state.modeTypes.slice(), hasActive: state.hasActive }) }
  function refresh() { workoutSelectionFeature.hasActive(function (active) { state.hasActive = active; emit() }) }
  return {
    start: function () { emit(); refresh() }, stop: noop, destroy: noop,
    action: function (name) {
      if (name === 'workout-continue') { navigation.push('/pages/workout', null, ownerKey(owner)); return }
      if (String(name).indexOf('workout-select:') === 0) {
        var type = String(name).slice('workout-select:'.length)
        if (state.modeTypes.indexOf(type) < 0) throw new Error('Unsupported workout selection action: ' + type)
        var token = ownerToken(owner)
        workoutSelectionFeature.create(type, function () {
          if (ownerCurrent(owner, token)) navigation.push('/pages/workout', null, ownerKey(owner))
        })
        return
      }
      throw new Error('Unknown workout selection action: ' + name)
    }
  }
}

export default { id: 'workout-selection', create: create }
