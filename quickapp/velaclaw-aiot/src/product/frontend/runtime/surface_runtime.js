var adapter = require('../../design/adapter')

function valueAt(source, pathValue) {
  if (!pathValue) return source
  var cursor = source
  var parts = String(pathValue).split('.')
  for (var i = 0; i < parts.length; i++) {
    if (cursor === null || cursor === undefined) return undefined
    cursor = cursor[parts[i]]
  }
  return cursor
}

function formatNumber(value) {
  if (value === undefined || value === null) return '--'
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDateShort(value) {
  if (!value) return '--'
  var text = String(value)
  return text.length >= 10 ? text.slice(5).replace('-', '/') : text
}

function formatTime(value) {
  if (!value) return '--:--'
  var date = new Date(value)
  var hours = date.getHours() < 10 ? '0' + date.getHours() : '' + date.getHours()
  var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : '' + date.getMinutes()
  return hours + ':' + minutes
}

function weekday(value) {
  if (!value) return '--'
  var parts = String(value).split('-')
  if (parts.length !== 3) return String(value)
  var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  var labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return labels[date.getDay()]
}

function formatValue(value, format, nullText) {
  if (value === undefined || value === null || value === '') return nullText === undefined ? '--' : String(nullText)
  if (!format || format === 'raw') return String(value)
  if (format === 'number') return formatNumber(value)
  if (format === 'percent') return formatNumber(value) + '%'
  if (format === 'date-short') return formatDateShort(value)
  if (format === 'time') return formatTime(value)
  if (format === 'weekday') return weekday(value)
  if (format === 'weekday-short') return weekday(value).replace('周', '')
  if (String(format).indexOf('suffix:') === 0) return formatNumber(value) + String(format).slice(7)
  throw new Error('Unknown V3 surface format: ' + format)
}

function fill(template, values) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, key) {
    var value = values[key]
    return value === undefined || value === null ? '' : String(value)
  })
}

function mappedStatus(map, key, label) {
  if (!map || !map[key]) throw new Error('V3 surface has no JSON status mapping for ' + label + ': ' + key)
  return { text: String(map[key].text || ''), color: String(map[key].color || '') }
}

function variant(surface, profile) {
  var base = surface.variants && surface.variants.base ? surface.variants.base : {}
  var shape = surface.variants && surface.variants[profile.formFactor] ? surface.variants[profile.formFactor] : {}
  return {
    tokens: adapter.merge(adapter.merge(surface.tokens || {}, base.tokens || {}), shape.tokens || {}),
    modules: adapter.merge(base.modules || {}, shape.modules || {})
  }
}

function frameFor(profile, scene, safe, tokens) {
  var spec = adapter.merge({}, tokens.frame || {})
  if (spec.heightMode === 'scene-bottom') {
    var relativeTop = spec.top || 0
    var absoluteTop = safe.top + relativeTop
    spec.bounds = 'scene'
    spec.absoluteTop = true
    spec.top = absoluteTop
    spec.height = scene.height - absoluteTop
    delete spec.heightMode
  }
  return adapter.placeBand(profile, scene, safe, spec)
}

function streamFor(profile, scene, safe, tokens) {
  if (!tokens.stream) return null
  return frameFor(profile, scene, safe, { frame: tokens.stream })
}

function definitionMap(definitions) {
  var result = {}
  for (var i = 0; i < definitions.length; i++) result[definitions[i].id] = definitions[i]
  return result
}

function metricListData(module, tokens, frame, state) {
  var raw = valueAt(state, module.bind && module.bind.items) || []
  var rawById = definitionMap(raw)
  var definitions = module.props && module.props.items ? module.props.items : []
  var definitionsById = definitionMap(definitions)
  var copy = module.copy || {}
  var trackWidth = frame.width - (tokens.itemPadding || 0) * 2
  var result = []

  for (var rawIndex = 0; rawIndex < raw.length; rawIndex++) {
    if (!definitionsById[raw[rawIndex].id]) throw new Error('V3 metric-list has no JSON definition for ' + raw[rawIndex].id)
  }

  for (var i = 0; i < definitions.length; i++) {
    var definition = definitions[i]
    var metric = rawById[definition.id]
    if (!metric) continue
    var current = Number(metric.current) || 0
    var goal = Number(metric.goal) || 0
    var ratio = goal > 0 ? current / goal : 0
    var percent = Math.round(ratio * 100)
    var complete = goal > 0 && current >= goal
    var remaining = complete ? 0 : Math.max(0, goal - current)
    var extra = complete ? Math.max(0, current - goal) : 0
    var accent = definition.tokens && definition.tokens.accent
    var unit = definition.copy && definition.copy.unit ? definition.copy.unit : ''
    var values = { percent: percent, goal: formatNumber(goal), remaining: formatNumber(remaining), extra: formatNumber(extra), unit: unit }
    var statusText = complete ? (extra > 0 ? fill(copy.over, values) : fill(copy.complete, values)) : fill(copy.remaining, values)

    result.push({
      id: definition.id,
      name: definition.copy && definition.copy.label ? definition.copy.label : definition.id,
      current: formatNumber(current),
      unit: unit,
      accent: accent,
      progressText: percent > 999 ? fill(copy.percentCap, values) : fill(copy.percent, values),
      progressWidth: Math.round(Math.max(0, Math.min(1, ratio)) * trackWidth),
      goalText: fill(copy.goal, values),
      statusText: statusText,
      statusColor: complete ? accent : tokens.pendingColor,
      trackWidth: trackWidth
    })
  }
  return result
}

function flowModuleHeight(module, tokens, state) {
  if (module.type === 'chart-card' && tokens.heightMode === 'rows') {
    var items = valueAt(state, module.bind && module.bind.items) || []
    var rows = Math.max(1, items.length)
    var required = (tokens.paddingY || 0) * 2 + (tokens.headHeight || 0) + (tokens.chartTop || 0) + rows * (tokens.rowHeight || 0)
    return tokens.maxHeight ? Math.min(tokens.maxHeight, required) : required
  }
  if (typeof tokens.height !== 'number') throw new Error('V3 flow module requires tokens.height: ' + module.id)
  return tokens.height
}

function flowFrame(stream, module, tokens, cursor, state) {
  var marginTop = tokens.marginTop || 0
  var width = tokens.width === undefined ? stream.width : tokens.width
  var height = flowModuleHeight(module, tokens, state)
  var left = tokens.align === 'left' ? 0 : (tokens.align === 'right' ? stream.width - width : Math.round((stream.width - width) / 2))
  return { left: left, top: cursor + marginTop, width: width, height: height }
}

function resolveHeader(module, tokens, frame, state) {
  var bind = module.bind || {}
  var props = module.props || {}
  var trailing = bind.trailing ? formatValue(valueAt(state, bind.trailing), props.trailingFormat, props.trailingNullText) : ''
  var trailingColor = tokens.trailingColor
  var subtitleTrailing = bind.subtitleTrailing ? formatValue(valueAt(state, bind.subtitleTrailing), props.subtitleTrailingFormat, props.subtitleTrailingNullText) : ''
  var subtitleTrailingColor = tokens.subtitleTrailingColor
  if (bind.trailing && props.trailingMap) {
    var trailingState = mappedStatus(props.trailingMap, valueAt(state, bind.trailing), module.id + '.trailing')
    trailing = trailingState.text
    trailingColor = trailingState.color
  }
  if (bind.subtitleTrailing && props.subtitleTrailingMap) {
    var subtitleState = mappedStatus(props.subtitleTrailingMap, valueAt(state, bind.subtitleTrailing), module.id + '.subtitleTrailing')
    subtitleTrailing = subtitleState.text
    subtitleTrailingColor = subtitleState.color
  }
  return {
    id: module.id,
    type: module.type,
    frame: frame,
    copy: adapter.merge({}, module.copy || {}),
    tokens: tokens,
    title: module.copy && module.copy.title ? module.copy.title : (module.copy && module.copy.text ? module.copy.text : ''),
    subtitle: module.copy && module.copy.subtitle ? module.copy.subtitle : '',
    trailing: trailing,
    trailingColor: trailingColor,
    subtitleTrailing: subtitleTrailing,
    subtitleTrailingColor: subtitleTrailingColor
  }
}

function metricGridData(module, tokens, frame, state) {
  var definitions = module.props && module.props.items ? module.props.items : []
  var columns = tokens.columns || definitions.length || 1
  var gap = tokens.gap || 0
  var rowGap = tokens.rowGap === undefined ? gap : tokens.rowGap
  var itemWidth = Math.floor((frame.width - gap * (columns - 1)) / columns)
  var rows = Math.ceil(definitions.length / columns)
  var itemHeight = tokens.itemHeight || Math.floor((frame.height - rowGap * (rows - 1)) / rows)
  var result = []

  for (var i = 0; i < definitions.length; i++) {
    var definition = definitions[i]
    var bind = definition.bind || {}
    var props = definition.props || {}
    var col = i % columns
    var row = Math.floor(i / columns)
    var detail = definition.copy && definition.copy.detail ? definition.copy.detail : ''
    var detailColor = definition.tokens && definition.tokens.detailColor ? definition.tokens.detailColor : tokens.detailColor
    if (bind.detail) detail = formatValue(valueAt(state, bind.detail), props.detailFormat, props.detailNullText)
    if (bind.status && props.statusMap) {
      var status = mappedStatus(props.statusMap, valueAt(state, bind.status), module.id + '.' + definition.id + '.status')
      detail = status.text
      detailColor = status.color
    }
    result.push({
      id: module.id + '-' + definition.id,
      frame: {
        left: frame.left + col * (itemWidth + gap),
        top: frame.top + row * (itemHeight + rowGap),
        width: itemWidth,
        height: itemHeight
      },
      label: definition.copy && definition.copy.label ? definition.copy.label : definition.id,
      value: formatValue(valueAt(state, bind.value), props.valueFormat, props.valueNullText),
      detail: detail,
      detailColor: detailColor,
      accent: definition.tokens && definition.tokens.accent ? definition.tokens.accent : tokens.valueColor,
      tokens: adapter.merge(tokens, definition.tokens || {})
    })
  }
  return result
}

function itemValue(item, field) {
  if (!field) return item
  if (item && typeof item === 'object') return item[field]
  return item
}

function numericValues(raw, field) {
  var values = []
  for (var i = 0; i < raw.length; i++) {
    var value = Number(itemValue(raw[i], field))
    if (isFinite(value)) values.push(value)
  }
  return values
}

function bounds(values) {
  if (!values.length) return { min: 0, max: 0, avg: 0 }
  var min = values[0]
  var max = values[0]
  var total = 0
  for (var i = 0; i < values.length; i++) {
    min = Math.min(min, values[i])
    max = Math.max(max, values[i])
    total += values[i]
  }
  return { min: min, max: max, avg: Math.round(total / values.length) }
}

function chartRatio(value, values, props, tokens) {
  if (props.scale === 'relative-range') {
    var range = bounds(values)
    var spread = Math.max(tokens.minimumSpread || 1, range.max - range.min)
    var center = (range.min + range.max) / 2
    var visualMin = center - spread / 2
    return Math.max(0, Math.min(1, (value - visualMin) / spread))
  }
  var maxValue = 1
  for (var i = 0; i < values.length; i++) maxValue = Math.max(maxValue, values[i])
  return value / maxValue
}

function chartCaption(module, raw) {
  var copy = module.copy || {}
  if (!copy.trendEmpty && !copy.trendOne && !copy.trendMany) return copy.caption || ''
  if (!raw.length) return copy.trendEmpty || ''
  if (raw.length === 1) return copy.trendOne || ''
  return fill(copy.trendMany || '', { count: raw.length })
}

function chartFooter(module, values) {
  var copy = module.copy || {}
  if (!copy.rangeEmpty && !copy.rangeSingle && !copy.rangeSpan) return copy.footer || ''
  if (!values.length) return copy.rangeEmpty || ''
  var range = bounds(values)
  var valuesForCopy = { min: formatNumber(range.min), max: formatNumber(range.max), avg: formatNumber(range.avg), unit: copy.unit || '' }
  if (range.min === range.max) return fill(copy.rangeSingle || '', valuesForCopy)
  return fill(copy.rangeSpan || '', valuesForCopy)
}

function chartCardData(module, tokens, frame, state) {
  var raw = valueAt(state, module.bind && module.bind.items) || []
  var props = module.props || {}
  var bind = module.bind || {}
  var valueField = props.valueField || ''
  var labelField = props.labelField || ''
  var values = numericValues(raw, valueField)
  var statusText = ''
  var statusColor = tokens.statusColor || ''
  if (bind.status && props.statusMap) {
    var status = mappedStatus(props.statusMap, valueAt(state, bind.status), module.id + '.status')
    statusText = status.text
    statusColor = status.color
  }

  var card = {
    id: module.id,
    frame: frame,
    title: module.copy && module.copy.title ? module.copy.title : '',
    caption: chartCaption(module, raw),
    value: bind.value ? formatValue(valueAt(state, bind.value), props.valueFormat, props.valueNullText) : '',
    unit: module.copy && module.copy.unit ? module.copy.unit : '',
    status: statusText,
    statusColor: statusColor,
    footer: chartFooter(module, values),
    tokens: tokens,
    mode: tokens.mode || 'columns'
  }
  var columns = []
  var rows = []
  var contentLeft = frame.left + (tokens.paddingX || 0)
  var valueBlockHeight = bind.value ? (tokens.valueBlockHeight || 0) : 0
  var chartTop = frame.top + (tokens.paddingY || 0) + (tokens.headHeight || 0) + valueBlockHeight + (tokens.chartTop || 0)
  var contentWidth = frame.width - (tokens.paddingX || 0) * 2

  if (card.mode === 'rows') {
    var labelWidth = tokens.rowLabelWidth || 0
    var valueWidth = tokens.rowValueWidth || 0
    var sideGap = tokens.rowTrackGap || 0
    var trackWidth = contentWidth - labelWidth - valueWidth - sideGap * 2
    for (var i = 0; i < raw.length; i++) {
      var rowItem = raw[i]
      var rowValue = Number(itemValue(rowItem, valueField)) || 0
      var rowRatio = chartRatio(rowValue, values, props, tokens)
      var isLastRow = i === raw.length - 1
      var label = isLastRow && module.copy && module.copy.todayLabel ? module.copy.todayLabel : formatValue(itemValue(rowItem, labelField), props.labelFormat, '--')
      var fillWidth = Math.round((tokens.rowMinWidth || 0) + rowRatio * ((tokens.rowMaxWidth || trackWidth) - (tokens.rowMinWidth || 0)))
      rows.push({
        id: module.id + '-row-' + i,
        top: chartTop + i * (tokens.rowHeight || 0),
        height: tokens.rowHeight || 0,
        label: label,
        labelLeft: contentLeft,
        labelWidth: labelWidth,
        trackLeft: contentLeft + labelWidth + sideGap,
        trackWidth: trackWidth,
        fillWidth: Math.min(trackWidth, fillWidth),
        valueLeft: contentLeft + labelWidth + sideGap + trackWidth + sideGap,
        valueWidth: valueWidth,
        value: formatValue(rowValue, props.valueFormat || 'number', '--'),
        color: isLastRow ? tokens.activeColor : tokens.inactiveColor,
        isActive: isLastRow,
        tokens: tokens
      })
    }
  } else {
    var columnCount = tokens.columns || Math.max(1, raw.length)
    var cellWidth = Math.floor(contentWidth / columnCount)
    for (var columnIndex = 0; columnIndex < raw.length; columnIndex++) {
      var item = raw[columnIndex]
      var value = Number(itemValue(item, valueField)) || 0
      var ratio = chartRatio(value, values, props, tokens)
      var isLast = columnIndex === raw.length - 1
      var height = Math.max(tokens.barMinHeight || 0, Math.round(ratio * (tokens.chartHeight || 0)))
      var compactLabel = labelField ? (isLast && module.copy && module.copy.todayCompactLabel ? module.copy.todayCompactLabel : formatValue(itemValue(item, labelField), props.labelFormat || 'raw', '--')) : ''
      columns.push({
        id: module.id + '-column-' + columnIndex,
        barLeft: contentLeft + columnIndex * cellWidth + Math.round((cellWidth - (tokens.barWidth || 0)) / 2),
        barTop: chartTop + (tokens.chartHeight || 0) - height,
        barWidth: tokens.barWidth || 0,
        barHeight: height,
        labelLeft: contentLeft + columnIndex * cellWidth,
        labelTop: chartTop + (tokens.chartHeight || 0) + (tokens.labelTop || 0),
        labelWidth: cellWidth,
        label: compactLabel,
        color: isLast ? tokens.activeColor : tokens.inactiveColor,
        isActive: isLast,
        tokens: tokens
      })
    }
  }
  return { card: card, columns: columns, rows: rows }
}

function resolveText(module, tokens, frame, state) {
  var bind = module.bind || {}
  var props = module.props || {}
  var value = bind.value ? formatValue(valueAt(state, bind.value), props.valueFormat, props.valueNullText) : ''
  return {
    id: module.id,
    type: module.type,
    frame: frame,
    tokens: tokens,
    text: module.copy && module.copy.template ? fill(module.copy.template, { value: value }) : (module.copy && module.copy.text ? module.copy.text : value)
  }
}

function resolveModule(surfaceModule, moduleOverride, profile, scene, safe, state, flow) {
  var tokens = adapter.merge(surfaceModule.tokens || {}, moduleOverride || {})
  var frame = flow ? flow.frame : frameFor(profile, scene, safe, tokens)
  var resolved = {
    id: surfaceModule.id,
    type: surfaceModule.type,
    frame: frame,
    copy: adapter.merge({}, surfaceModule.copy || {}),
    tokens: tokens,
    action: surfaceModule.actions && surfaceModule.actions.tap ? surfaceModule.actions.tap : ''
  }
  if (surfaceModule.type === 'header') return resolveHeader(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'text') return resolveText(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'metric-list') resolved.items = metricListData(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'metric-grid') resolved.items = metricGridData(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'chart-card') resolved.chart = chartCardData(surfaceModule, tokens, frame, state || {})
  return resolved
}

function resolve(surface, profile, scene, safe, state) {
  if (!surface || surface.renderer !== 'surface-v1') throw new Error('V3 Surface Runtime requires surface-v1 JSON')
  var selected = variant(surface, profile)
  var stream = streamFor(profile, scene, safe, selected.tokens)
  var cursor = 0
  var modules = []
  var headers = []
  var texts = []
  var buttons = []
  var metricList = null
  var flowHeaders = []
  var flowTexts = []
  var flowMetricItems = []
  var flowChartCards = []
  var flowColumnBars = []
  var flowRowBars = []

  for (var i = 0; i < surface.modules.length; i++) {
    var source = surface.modules[i]
    var override = selected.modules[source.id]
    var mergedTokens = adapter.merge(source.tokens || {}, override || {})
    var isFlow = !!stream && mergedTokens.flow === true
    var flow = null
    if (isFlow) {
      var flowFrameValue = flowFrame(stream, source, mergedTokens, cursor, state || {})
      flow = { frame: flowFrameValue }
      cursor = flowFrameValue.top + flowFrameValue.height + (mergedTokens.marginBottom || 0)
    }
    var module = resolveModule(source, override, profile, scene, safe, state || {}, flow)
    modules.push(module)

    if (isFlow) {
      if (module.type === 'header') flowHeaders.push(module)
      else if (module.type === 'text') flowTexts.push(module)
      else if (module.type === 'metric-grid') flowMetricItems = flowMetricItems.concat(module.items)
      else if (module.type === 'chart-card') {
        flowChartCards.push(module.chart.card)
        flowColumnBars = flowColumnBars.concat(module.chart.columns)
        flowRowBars = flowRowBars.concat(module.chart.rows)
      } else throw new Error('Unsupported V3 flow module type: ' + module.type)
      continue
    }

    if (module.type === 'header') headers.push(module)
    else if (module.type === 'text') texts.push(module)
    else if (module.type === 'button') buttons.push(module)
    else if (module.type === 'metric-list') {
      if (metricList) throw new Error('surface-v1 currently permits one metric-list module per surface')
      metricList = module
    }
  }

  return {
    id: surface.id,
    shape: profile.formFactor,
    sceneWidth: scene.width,
    sceneHeight: scene.height,
    background: selected.tokens.background,
    modules: modules,
    headers: headers,
    texts: texts,
    buttons: buttons,
    metricList: metricList,
    stream: stream,
    streamPaddingBottom: selected.tokens.streamPaddingBottom || 0,
    flowContentHeight: cursor + (selected.tokens.streamPaddingBottom || 0),
    flowHeaders: flowHeaders,
    flowTexts: flowTexts,
    flowMetricItems: flowMetricItems,
    flowChartCards: flowChartCards,
    flowColumnBars: flowColumnBars,
    flowRowBars: flowRowBars
  }
}

module.exports = { resolve: resolve, formatValue: formatValue }
