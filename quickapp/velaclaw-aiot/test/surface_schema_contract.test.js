const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const surfaceRoot = path.join(root, 'src', 'product', 'frontend', 'surfaces')
const schema = JSON.parse(fs.readFileSync(path.join(root, 'src', 'product', 'frontend', 'surface.schema.json'), 'utf8'))
const validator = require('../scripts/lib/surface-contract-validator')

const expectedModuleTypes = ['header', 'text', 'button', 'metric-list', 'metric-grid', 'chart-card', 'list']
assert.deepStrictEqual(schema.$defs.module.properties.type.enum, expectedModuleTypes, 'Surface schema module enum must match the actually rendered module contract')

const files = fs.readdirSync(surfaceRoot).filter(function (name) { return /\.json$/.test(name) }).sort()
assert.ok(files.length > 0, 'Surface contract test requires authored Surface JSON files')
files.forEach(function (name) {
  const surface = JSON.parse(fs.readFileSync(path.join(surfaceRoot, name), 'utf8'))
  const errors = validator.validate(surface, schema)
  assert.deepStrictEqual(errors, [], name + ' must satisfy schema + runtime semantic contract:\n' + errors.join('\n'))
})

const diagnostics = JSON.parse(fs.readFileSync(path.join(surfaceRoot, 'settings__diagnostics.json'), 'utf8'))
function clone(value) { return JSON.parse(JSON.stringify(value)) }
function expectError(surface, fragment, label) {
  const errors = validator.validate(surface, schema)
  assert.ok(errors.some(function (error) { return error.indexOf(fragment) >= 0 }), label + ' must fail with ' + fragment + '; got:\n' + errors.join('\n'))
}

const unsupported = clone(diagnostics)
unsupported.modules[0].type = 'image'
expectError(unsupported, 'must be one of', 'unsupported module type')

const grid = clone(diagnostics)
const gridModule = grid.modules.find(function (module) { return module.type === 'metric-grid' })
delete gridModule.tokens.flow
expectError(grid, 'metric-grid is only rendered in flow', 'non-flow metric-grid')

const flowMetricList = clone(diagnostics)
const flowMetricListModule = flowMetricList.modules.find(function (module) { return module.type === 'metric-grid' })
flowMetricListModule.type = 'metric-list'
expectError(flowMetricList, 'metric-list is not supported in flow', 'flow metric-list')

const duplicate = clone(diagnostics)
duplicate.modules[1].id = duplicate.modules[0].id
expectError(duplicate, 'duplicates module id', 'duplicate module id')

const unknownTopLevel = clone(diagnostics)
unknownTopLevel.visualAuthority = true
expectError(unknownTopLevel, 'visualAuthority is not allowed', 'unknown top-level property')

const compileSource = fs.readFileSync(path.join(root, 'scripts', 'compile-v3-surfaces.js'), 'utf8')
assert.ok(compileSource.includes("require('./lib/surface-contract-validator')"), 'surfaces:compile must execute the Surface contract validator')
assert.ok(compileSource.includes('surfaceContract.assertValid'), 'surfaces:compile must reject invalid authored JSON before generating resources')
const auditSource = fs.readFileSync(path.join(root, 'scripts', 'audit-v3-frontends.js'), 'utf8')
assert.ok(auditSource.includes('surface.schema.json'), 'strict frontend audit must source its module type allowlist from Surface schema')
assert.ok(auditSource.includes('surfaceSchema.$defs.module.properties.type.enum'), 'strict frontend audit must not maintain a duplicate module type list')

console.log('V3 Surface schema contract verified: ' + files.length + ' authored surfaces valid; unsupported/invisible module configurations fail before runtime; strict audit shares schema authority')
