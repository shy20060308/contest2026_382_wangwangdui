import capabilityIntrospection from '../../../capabilities/introspection'

function status(entry) {
  if (entry.available) return { text: '可用', color: '#30D158', background: '#102A19' }
  if (entry.fallback) return { text: '兼容', color: '#FFD60A', background: '#2A2310' }
  return { text: '不可用', color: '#FF453A', background: '#321519' }
}

function mapCapability(entry) {
  var state = status(entry || {})
  return {
    id: entry.id,
    name: entry.name,
    api: entry.api,
    status: state.text,
    color: state.color,
    background: state.background
  }
}

function profileView(profile, scene) {
  var source = profile || {}
  var host = scene || {}
  return {
    deviceFamily: source.deviceFamily || source.model || 'unknown',
    screenSize: (source.screenWidth || '--') + ' × ' + (source.screenHeight || '--'),
    formFactor: source.formFactor || 'rect',
    platformText: (source.model || 'unknown') + ' / ' + (source.platformVersionCode || '--'),
    hostSceneText: Math.round(Number(host.width) || 0) + ' × ' + Math.round(Number(host.height) || 0),
    viewportMode: source.isBetaPillViewport ? '宿主兼容视口' : '标准宿主视口'
  }
}

export function createDiagnosticsController(onChange) {
  var profile = null
  var scene = null

  function snapshot() {
    var raw = capabilityIntrospection.list()
    var capabilities = []
    for (var i = 0; i < raw.length; i++) capabilities.push(mapCapability(raw[i]))
    return {
      device: profileView(profile, scene),
      capabilities: capabilities
    }
  }

  function emit() {
    var value = snapshot()
    if (typeof onChange === 'function') onChange(value)
    return value
  }

  return {
    configureScene: function (nextProfile, nextScene) { profile = nextProfile; scene = nextScene; return emit() },
    refresh: emit
  }
}
