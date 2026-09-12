const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const targets = ['dist', 'build', 'outputs']

for (const name of targets) {
  const target = path.join(root, name)
  fs.rmSync(target, { recursive: true, force: true })
}

console.log('Build outputs cleaned:', targets.join(', '))
