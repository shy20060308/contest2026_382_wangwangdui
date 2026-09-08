var ROUTES = {
  workout: '/pages/workout_select',
  history: '/pages/history',
  heart: '/pages/heartrate',
  steps: '/pages/steps',
  faces: '/pages/watchface',
  sync: '/pages/settings/bluetooth',
  brightness: '/pages/settings/brightness',
  settings: '/pages/settings/settings',
  vibration: '/pages/settings/vibration',
  motion: '/pages/settings/motion',
  diagnostics: '/pages/settings/diagnostics',
  notification: '/pages/notification_demo',
  today: '/pages/today'
}

function routeFor(id) {
  var route = ROUTES[id]
  if (!route) throw new Error('No application route registered for ' + id)
  return route
}

module.exports = { routeFor: routeFor }
