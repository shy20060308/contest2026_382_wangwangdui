var pager = require('../../pager')

function capability(entry) {
  var status = entry.available ? { text: '可用', color: '#30D158', background: '#102A19' } : (entry.fallback ? { text: '兼容', color: '#FFD60A', background: '#2A2310' } : { text: '不可用', color: '#FF453A', background: '#321519' })
  return {
    id: entry.id,
    name: entry.name,
    api: entry.api,
    status: status.text,
    color: status.color,
    background: status.background
  }
}

function project(model) {
  var capabilities = []
  for (var i = 0; i < model.capabilities.length; i++) capabilities.push(capability(model.capabilities[i]))
  return {
    device: {
      deviceFamily: model.device.deviceFamily || model.device.model,
      screenSize: model.device.screenWidth + ' × ' + model.device.screenHeight,
      formFactor: model.device.formFactor,
      platformText: model.device.model + ' / ' + model.device.platformVersionCode,
      hostSceneText: Math.round(model.host.width) + ' × ' + Math.round(model.host.height),
      viewportMode: '标准宿主视口'
    },
    capabilities: capabilities
  }
}

function page(capabilities, pageIndex, pageSize) {
  if (!(pageSize > 0) || Math.round(pageSize) !== pageSize) throw new Error('diagnostics view requires resolved integer capabilityPageSize')
  var groups = [{ id: 'device' }]
  for (var start = 0; start < capabilities.length; start += pageSize) groups.push({ id: 'cap-' + start, items: capabilities.slice(start, start + pageSize) })
  var state = pager.resolve(groups, pageIndex, 1)
  var group = state.items[0]
  return {
    pageIndex: state.pageIndex,
    pageText: state.pageText,
    pageProgress: state.progress,
    capabilityPage: group && group.items ? group.items : []
  }
}

module.exports = { project: project, page: page }
