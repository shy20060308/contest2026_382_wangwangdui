function project(state) {
  if (state.type !== 'app' && state.type !== 'call') throw new Error('Unknown notification type: ' + state.type)
  return {
    visible: state.visible,
    type: state.type,
    appName: state.appName || (state.type === 'call' ? '电话' : '通知'),
    appIcon: state.appIcon || '/common/logo.png',
    content: state.content,
    contact: state.contact || (state.type === 'call' ? '未知来电' : ''),
    phone: state.phone,
    hangUp: state.hangUp,
    hangUpColor: state.hangUp ? '#777777' : '#FFFFFF'
  }
}

module.exports = { project: project }
