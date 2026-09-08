function notificationType(value) {
  if (value === undefined || value === null || value === '') return 'app'
  if (value === 'app' || value === 'call') return value
  throw new Error('Unknown notification type: ' + value)
}

function normalize(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Notification payload must be an object')
  return {
    type: notificationType(payload.type),
    appName: payload.appName || payload.title || '',
    appIcon: payload.appIcon || '',
    content: payload.content || '',
    contact: payload.contact || payload.title || '',
    phone: payload.phone || '',
    hangUp: false
  }
}

function demo(type) {
  if (type === 'call') return { type: 'call', contact: '演示来电', phone: '未知号码' }
  if (type === 'sms') return { type: 'app', appName: '短信', content: '这是一条短信演示通知。' }
  if (type === undefined || type === null || type === 'app') return { type: 'app', appName: 'VelaClaw', content: '设备通知通路已连接。' }
  throw new Error('Unknown notification demo type: ' + type)
}

module.exports = { normalize: normalize, demo: demo }
