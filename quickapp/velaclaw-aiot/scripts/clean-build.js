const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const generated = ['dist', 'build', 'outputs', '.temp_velaclaw-aiot']

generated.forEach(function (name) {
  fs.rmSync(path.join(root, name), { recursive: true, force: true })
})

console.log('[vela_band] Cleaned generated build directories: ' + generated.join(', '))
