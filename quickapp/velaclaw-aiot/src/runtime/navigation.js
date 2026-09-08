import router from '@system.router'

function push(path, params) {
  if (!path) throw new Error('Navigation requires a target path')
  try {
    router.push({ uri: path, params: params || {} })
    return true
  } catch (error) {
    return false
  }
}

function replace(path, params) {
  if (!path) throw new Error('Navigation requires a target path')
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
