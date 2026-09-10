import capabilityIntrospection from '../../../capabilities/introspection'

function deviceSnapshot(profile) {
  return {
    model: profile.model,
    screenWidth: profile.screenWidth,
    screenHeight: profile.screenHeight,
    formFactor: profile.formFactor,
    platformVersionCode: profile.platformVersionCode
  }
}

function hostSnapshot(scene) {
  return { width: scene.width, height: scene.height }
}

export function createDiagnosticsController(onChange) {
  var profile = null
  var scene = null

  function snapshot() {
    if (!profile || !scene) throw new Error('Diagnostics requires resolved Device Profile and Host Scene')
    return {
      device: deviceSnapshot(profile),
      host: hostSnapshot(scene),
      capabilities: capabilityIntrospection.list()
    }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  return {
    configureScene: function (nextProfile, nextScene) {
      profile = nextProfile
      scene = nextScene
      return emit()
    },
    refresh: emit
  }
}
