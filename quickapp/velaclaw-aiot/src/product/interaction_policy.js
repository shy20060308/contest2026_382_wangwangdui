function routeNavigationEnabled(controllerId, state) {
  if (controllerId !== 'clock') return true
  return !!(state && state.clockVisible)
}

module.exports = { routeNavigationEnabled: routeNavigationEnabled }
