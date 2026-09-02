var APP_CATALOG = {
  workout: { id: 'workout', label: '运动', icon: '/common/icons/workout.jpg', route: '/pages/workout_select' },
  history: { id: 'history', label: '趋势', icon: '/common/icons/history.jpg', route: '/pages/history' },
  heart: { id: 'heart', label: '心率', icon: '/common/icons/heart.jpg', route: '/pages/heartrate' },
  clock: { id: 'clock', label: '表盘', icon: '/common/icons/clock.jpg', route: '' },
  steps: { id: 'steps', label: '健康', icon: '/common/icons/health.jpg', route: '/pages/steps' },
  faces: { id: 'faces', label: '表盘库', icon: '/common/icons/faces.jpg', route: '/pages/watchface' },
  sync: { id: 'sync', label: '同步', icon: '/common/icons/sync.jpg', route: '/pages/settings/bluetooth' },
  brightness: { id: 'brightness', label: '亮度', icon: '/common/icons/brightness.jpg', route: '/pages/settings/brightness' },
  settings: { id: 'settings', label: '设置', icon: '/common/icons/settings.jpg', route: '/pages/settings/settings' },
  vibration: { id: 'vibration', label: '振动', icon: '/common/icons/vibration.jpg', route: '/pages/settings/vibration' },
  notification: { id: 'notification', label: '通知', icon: '/common/icons/notification.jpg', route: '/pages/notification_demo' },
  today: { id: 'today', label: '今日日历', icon: '/common/icons/calendar.jpg', route: '/pages/today' }
}

function clone(item) {
  if (!item) return null
  return {
    id: item.id,
    label: item.label,
    icon: item.icon,
    softIcon: item.icon.replace('/common/icons/', '/common/icons/soft/'),
    route: item.route
  }
}

function get(id) {
  return clone(APP_CATALOG[id])
}

function list(ids) {
  var source = ids && ids.length ? ids : Object.keys(APP_CATALOG)
  var result = []
  for (var i = 0; i < source.length; i++) {
    var item = get(source[i])
    if (item) result.push(item)
  }
  return result
}

module.exports = {
  get: get,
  list: list
}
