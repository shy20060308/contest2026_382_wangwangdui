import router from '@system.router'

function push(path, params) {
  if (!path) throw new Error('Navigation requires a target path')
  router.push({ uri: path, params: params || {} })
}

function replace(path, params) {
  if (!path) throw new Error('Navigation requires a target path')
  router.replace({ uri: path, params: params || {} })
}

function back() {
  router.back()
}

export default {
  push: push,
  replace: replace,
  back: back
}
