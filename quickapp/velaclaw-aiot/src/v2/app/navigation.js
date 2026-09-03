import router from '@system.router'

function push(path, params) {
  try {
    router.push({ uri: path, params: params || {} })
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
  back: back
}
