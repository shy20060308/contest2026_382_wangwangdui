import router from '@system.router'

var lastPushPath = ''
var lastPushAt = 0

function push(path, params) {
  var now = Date.now()
  if (path === lastPushPath && now - lastPushAt < 800) return false
  lastPushPath = path
  lastPushAt = now
  try {
    // Vela may dispatch the page swipe callback before the active touch sequence
    // is fully released. Entering a new page synchronously from that callback can
    // leave the destination mounted as an empty black surface. Push on the next
    // task and reject duplicate native/raw-touch navigation from the same swipe.
    setTimeout(function () {
      try { router.push({ uri: path, params: params || {} }) } catch (error) {}
    }, 0)
    return true
  } catch (error) {
    return false
  }
}

function replace(path, params) {
  try {
    router.replace({ uri: path, params: params || {} })
    return true
  } catch (error) {
    return false
  }
}

function back() {
  try {
    router.back()
    return true
  } catch (error) {
    return false
  }
}

export default {
  push: push,
  replace: replace,
  back: back
}
