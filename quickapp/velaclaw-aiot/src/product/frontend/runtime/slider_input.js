function userFlag(event) {
  if (!event) return false
  if (event.isFromUser !== undefined) return event.isFromUser === true
  if (event.detail && event.detail.isFromUser !== undefined) return event.detail.isFromUser === true
  return false
}

function value(event, fallback) {
  if (!userFlag(event)) return { accepted: false, value: fallback }
  if (event && event.progress !== undefined) return { accepted: true, value: event.progress }
  if (event && event.value !== undefined) return { accepted: true, value: event.value }
  if (event && event.detail && event.detail.progress !== undefined) return { accepted: true, value: event.detail.progress }
  if (event && event.detail && event.detail.value !== undefined) return { accepted: true, value: event.detail.value }
  return { accepted: false, value: fallback }
}

module.exports = { value: value }
