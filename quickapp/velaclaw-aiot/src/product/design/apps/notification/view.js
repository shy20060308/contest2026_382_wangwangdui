function project(state) {
  if (state.type !== 'app' && state.type !== 'call') throw new Error('Unknown notification type: ' + state.type)
  return {
    visible: state.visible,
    type: state.type,
    appName: state.appName,
    appIcon: state.appIcon || '/common/logo.png',
    content: state.content,
    contact: state.contact,
    phone: state.phone,
    hangUp: state.hangUp,
    hangUpColor: state.hangUp ? '#777777' : '#FFFFFF'
  }
}

module.exports = { project: project }
