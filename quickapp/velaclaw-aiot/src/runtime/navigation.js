import router from '@system.router'

function errorText(error) {
  return error && error.message ? error.message : String(error || 'unknown')
}

function push(path, params) {
  if (!path) return false
  try {
    router.push({ uri: path, params: params || {} })
    return true
  } catch (error) {
    console.log('[V3_ROUTE] push failed ' + path + ': ' + errorText(error))
    return false
  }
}

function replace(path, params) {
  if (!path) return false
  try {
    router.replace({ uri: path, params: params || {} })
    return true
  } catch (error) {
    console.log('[V3_ROUTE] replace failed ' + path + ': ' + errorText(error))
    return false
  }
}

function back() {
  try {
    router.back()
    return true
  } catch (error) {
    console.log('[V3_ROUTE] back failed: ' + errorText(error))
    return false
  }
}

export default {
  push: push,
  replace: replace,
  back: back
}
