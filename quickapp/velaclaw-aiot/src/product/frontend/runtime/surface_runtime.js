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

function pad2(value) { return value < 10 ? '0' + value : '' + value }
function formatDateShort(value) {
  if (!value) return '--'
  var text = String(value)
  return text.length >= 10 ? text.slice(5).replace('-', '/') : text
}
function formatDateTime(value) {
  if (!value) return '--'
  var date = new Date(value)
  return pad2(date.getMonth() + 1) + '/' + pad2(date.getDate()) + ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes())
}
function formatTime(value) {
  if (!value) return '--:--'
  var date = new Date(value)
  return pad2(date.getHours()) + ':' + pad2(date.getMinutes())
}
function formatDurationSeconds(value) {
  var total = Math.max(0, Math.floor(Number(value) || 0))
  var hours = Math.floor(total / 3600)
  var minutes = Math.floor((total % 3600) / 60)
  var seconds = total % 60
  return hours > 0 ? pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds) : pad2(minutes) + ':' + pad2(seconds)
}
function formatDurationMs(value) { return formatDurationSeconds((Number(value) || 0) / 1000) }
function formatDistance(value) {
  var meters = Math.max(0, Math.round(Number(value) || 0))
  return meters >= 1000 ? (meters / 1000).toFixed(2) + ' km' : meters + ' m'
}
function weekdayIndex(value) {
  if (!value) return '--'
  var parts = String(value).split('-')
  if (parts.length !== 3) return String(value)
  var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return String(date.getDay())
}

function formatValue(value, format, nullText) {
  if (value === undefined || value === null || value === '') return nullText === undefined ? '--' : String(nullText)
  if (!format || format === 'raw') return String(value)
  if (format === 'number') return formatNumber(value)
  if (format === 'percent') return formatNumber(value) + '%'
  if (format === 'date-short') return formatDateShort(value)
  if (format === 'date-time') return formatDateTime(value)
  if (format === 'time') return formatTime(value)
  if (format === 'duration-seconds') return formatDurationSeconds(value)
  if (format === 'duration-ms') return formatDurationMs(value)
  if (format === 'distance') return formatDistance(value)
  if (format === 'weekday-index') return weekdayIndex(value)
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
  return { text: String(map[key].text || ''), color: String(map[key].color || ''), background: String(map[key].background || '') }
}

function mappedText(map, key, label) {
  if (!map || map[key] === undefined) throw new Error('V3 surface has no JSON text mapping for ' + label + ': ' + key)
  var value = map[key]
  if (value && typeof value === 'object') return String(value.text || '')
  return String(value)
}

function visible(expression, state) {
  if (!expression) return true
  var text = String(expression)
  if (text.charAt(0) === '!') return !valueAt(state, text.slice(1))
  return !!valueAt(state, text)
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
      current: formatNumber(current), unit: unit, accent: accent,
      progressText: percent > 999 ? fill(copy.percentCap, values) : fill(copy.percent, values),
      progressWidth: Math.round(Math.max(0, Math.min(1, ratio)) * trackWidth),
      goalText: fill(copy.goal, values), statusText: statusText,
      statusColor: complete ? accent : tokens.pendingColor, trackWidth: trackWidth
    })
  }
  return result
}

function listRaw(module, state) {
  var value = valueAt(state, module.bind && module.bind.items)
  return Array.isArray(value) ? value : []
}

function listCount(module, state) {
  return listRaw(module, state).length
}

function flowModuleHeight(module, tokens, state) {
  if (module.type === 'chart-card' && tokens.heightMode === 'rows') {
    var chartItems = valueAt(state, module.bind && module.bind.items) || []
    var rows = Math.max(1, chartItems.length)
    var required = (tokens.paddingY || 0) * 2 + (tokens.headHeight || 0) + (tokens.chartTop || 0) + rows * (tokens.rowHeight || 0)
    return tokens.maxHeight ? Math.min(tokens.maxHeight, required) : required
  }
  if (module.type === 'list' && tokens.heightMode === 'items') {
    var count = listCount(module, state)
    return count ? count * (tokens.itemHeight || 0) + Math.max(0, count - 1) * (tokens.itemGap || 0) : 0
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
    trailing = trailingState.text; trailingColor = trailingState.color
  }
  if (bind.subtitleTrailing && props.subtitleTrailingMap) {
    var subtitleState = mappedStatus(props.subtitleTrailingMap, valueAt(state, bind.subtitleTrailing), module.id + '.subtitleTrailing')
    subtitleTrailing = subtitleState.text; subtitleTrailingColor = subtitleState.color
  }
  return {
    id: module.id, type: module.type, frame: frame,
    copy: adapter.merge({}, module.copy || {}), tokens: tokens,
    title: module.copy && module.copy.title ? module.copy.title : (module.copy && module.copy.text ? module.copy.text : ''),
    subtitle: module.copy && module.copy.subtitle ? module.copy.subtitle : '',
    trailing: trailing, trailingColor: trailingColor,
    subtitleTrailing: subtitleTrailing, subtitleTrailingColor: subtitleTrailingColor
  }
}

function resolveButton(module, tokens, frame, state) {
  var copy = adapter.merge({}, module.copy || {})
  var props = module.props || {}
  var bind = module.bind || {}
  var background = tokens.background
  var foreground = tokens.titleColor
  if (bind.state && props.stateMap) {
    var mapped = mappedStatus(props.stateMap, valueAt(state, bind.state), module.id + '.state')
    if (mapped.text) copy.title = mapped.text
    if (mapped.color) foreground = mapped.color
    if (mapped.background) background = mapped.background
  }
  return {
    id: module.id, type: module.type, frame: frame, copy: copy,
    tokens: adapter.merge(tokens, { background: background, titleColor: foreground }),
    action: module.actions && module.actions.tap ? module.actions.tap : ''
  }
}

function itemValue(item, field) {
  if (!field) return item
  if (item && typeof item === 'object') return valueAt(item, field)
  return item
}

function mapValue(spec, item, moduleId, fieldName) {
  if (!spec) return { text: '', color: '', background: '' }
  var raw = itemValue(item, spec.path || '')
  if (spec.map) {
    var mapped = mappedStatus(spec.map, raw, moduleId + '.' + fieldName)
    return { text: mapped.text, color: mapped.color, background: mapped.background }
  }
  return { text: formatValue(raw, spec.format, spec.nullText), color: spec.color || '', background: spec.background || '' }
}

function dynamicGridTokens(baseTokens, item, rules) {
  var result = adapter.merge({}, baseTokens)
  var list = rules || []
  for (var i = 0; i < list.length; i++) {
    var rule = list[i]
    if (!rule || !rule.path) continue
    if (itemValue(item, rule.path) === rule.equals) result = adapter.merge(result, rule.tokens || {})
  }
  return result
}

function metricGridData(module, tokens, frame, state) {
  var props = module.props || {}
  var dynamic = !!(module.bind && module.bind.items)
  var definitions = dynamic ? listRaw(module, state) : (props.items || [])
  var columns = tokens.columns || definitions.length || 1
  var gap = tokens.gap || 0
  var rowGap = tokens.rowGap === undefined ? gap : tokens.rowGap
  var itemWidth = Math.floor((frame.width - gap * (columns - 1)) / columns)
  var rows = Math.max(1, Math.ceil(definitions.length / columns))
  var itemHeight = tokens.itemHeight || Math.floor((frame.height - rowGap * (rows - 1)) / rows)
  var result = []
  for (var i = 0; i < definitions.length; i++) {
    var definition = definitions[i]
    var col = i % columns
    var row = Math.floor(i / columns)
    var itemTokens = dynamic ? dynamicGridTokens(tokens, definition, props.styleRules) : adapter.merge(tokens, definition.tokens || {})
    var label = ''
    var value = ''
    var detail = ''
    var detailColor = itemTokens.detailColor
    var accent = itemTokens.accent || itemTokens.valueColor

    if (dynamic) {
      var fields = props.fields || {}
      var labelValue = mapValue(fields.label, definition, module.id, 'label')
      var displayValue = mapValue(fields.value, definition, module.id, 'value')
      var detailValue = mapValue(fields.detail, definition, module.id, 'detail')
      label = labelValue.text
      value = displayValue.text
      detail = detailValue.text
      if (displayValue.color) accent = displayValue.color
      if (detailValue.color) detailColor = detailValue.color
    } else {
      var bind = definition.bind || {}
      var itemProps = definition.props || {}
      label = definition.copy && definition.copy.label ? definition.copy.label : definition.id
      value = formatValue(valueAt(state, bind.value), itemProps.valueFormat, itemProps.valueNullText)
      detail = definition.copy && definition.copy.detail ? definition.copy.detail : ''
      detailColor = definition.tokens && definition.tokens.detailColor ? definition.tokens.detailColor : tokens.detailColor
      if (bind.detail) detail = formatValue(valueAt(state, bind.detail), itemProps.detailFormat, itemProps.detailNullText)
      if (bind.status && itemProps.statusMap) {
        var status = mappedStatus(itemProps.statusMap, valueAt(state, bind.status), module.id + '.' + definition.id + '.status')
        detail = status.text; detailColor = status.color
      }
      accent = definition.tokens && definition.tokens.accent ? definition.tokens.accent : tokens.valueColor
    }

    result.push({
      id: module.id + '-' + (dynamic ? (definition.key || definition.id || i) : definition.id),
      frame: { left: frame.left + col * (itemWidth + gap), top: frame.top + row * (itemHeight + rowGap), width: itemWidth, height: itemHeight },
      label: label, value: value, detail: detail, detailColor: detailColor,
      accent: accent, tokens: itemTokens
    })
  }
  return result
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
  var min = values[0], max = values[0], total = 0
  for (var i = 0; i < values.length; i++) { min = Math.min(min, values[i]); max = Math.max(max, values[i]); total += values[i] }
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
  return range.min === range.max ? fill(copy.rangeSingle || '', valuesForCopy) : fill(copy.rangeSpan || '', valuesForCopy)
}
function chartLabel(module, item, props, labelField) {
  var label = formatValue(itemValue(item, labelField), props.labelFormat || 'raw', '--')
  return props.labelMap ? mappedText(props.labelMap, label, module.id + '.label') : label
}

function chartCardData(module, tokens, frame, state) {
  var raw = valueAt(state, module.bind && module.bind.items) || []
  var props = module.props || {}, bind = module.bind || {}
  var valueField = props.valueField || '', labelField = props.labelField || ''
  var values = numericValues(raw, valueField)
  var statusText = '', statusColor = tokens.statusColor || ''
  if (bind.status && props.statusMap) {
    var status = mappedStatus(props.statusMap, valueAt(state, bind.status), module.id + '.status')
    statusText = status.text; statusColor = status.color
  }
  var card = {
    id: module.id, frame: frame,
    title: module.copy && module.copy.title ? module.copy.title : '',
    caption: chartCaption(module, raw),
    value: bind.value ? formatValue(valueAt(state, bind.value), props.valueFormat, props.valueNullText) : '',
    unit: module.copy && module.copy.unit ? module.copy.unit : '',
    status: statusText, statusColor: statusColor, footer: chartFooter(module, values),
    tokens: tokens, mode: tokens.mode || 'columns'
  }
  var columns = [], rows = []
  var contentLeft = frame.left + (tokens.paddingX || 0)
  var valueBlockHeight = bind.value ? (tokens.valueBlockHeight || 0) : 0
  var chartTop = frame.top + (tokens.paddingY || 0) + (tokens.headHeight || 0) + valueBlockHeight + (tokens.chartTop || 0)
  var contentWidth = frame.width - (tokens.paddingX || 0) * 2
  if (card.mode === 'rows') {
    var labelWidth = tokens.rowLabelWidth || 0, valueWidth = tokens.rowValueWidth || 0, sideGap = tokens.rowTrackGap || 0
    var trackWidth = contentWidth - labelWidth - valueWidth - sideGap * 2
    for (var i = 0; i < raw.length; i++) {
      var rowItem = raw[i], rowValue = Number(itemValue(rowItem, valueField)) || 0
      var rowRatio = chartRatio(rowValue, values, props, tokens), isLastRow = i === raw.length - 1
      var label = isLastRow && module.copy && module.copy.todayLabel ? module.copy.todayLabel : chartLabel(module, rowItem, props, labelField)
      var fillWidth = Math.round((tokens.rowMinWidth || 0) + rowRatio * ((tokens.rowMaxWidth || trackWidth) - (tokens.rowMinWidth || 0)))
      rows.push({
        id: module.id + '-row-' + i, top: chartTop + i * (tokens.rowHeight || 0), height: tokens.rowHeight || 0,
        label: label, labelLeft: contentLeft, labelWidth: labelWidth,
        trackLeft: contentLeft + labelWidth + sideGap, trackWidth: trackWidth, fillWidth: Math.min(trackWidth, fillWidth),
        valueLeft: contentLeft + labelWidth + sideGap + trackWidth + sideGap, valueWidth: valueWidth,
        value: formatValue(rowValue, props.valueFormat || 'number', '--'), color: isLastRow ? tokens.activeColor : tokens.inactiveColor,
        isActive: isLastRow, tokens: tokens
      })
    }
  } else {
    var columnCount = tokens.columns || Math.max(1, raw.length), cellWidth = Math.floor(contentWidth / columnCount)
    for (var columnIndex = 0; columnIndex < raw.length; columnIndex++) {
      var item = raw[columnIndex], value = Number(itemValue(item, valueField)) || 0
      var ratio = chartRatio(value, values, props, tokens), isLast = columnIndex === raw.length - 1
      var height = Math.max(tokens.barMinHeight || 0, Math.round(ratio * (tokens.chartHeight || 0)))
      var compactLabel = labelField ? (isLast && module.copy && module.copy.todayCompactLabel ? module.copy.todayCompactLabel : chartLabel(module, item, props, labelField)) : ''
      columns.push({
        id: module.id + '-column-' + columnIndex,
        barLeft: contentLeft + columnIndex * cellWidth + Math.round((cellWidth - (tokens.barWidth || 0)) / 2),
        barTop: chartTop + (tokens.chartHeight || 0) - height, barWidth: tokens.barWidth || 0, barHeight: height,
        labelLeft: contentLeft + columnIndex * cellWidth, labelTop: chartTop + (tokens.chartHeight || 0) + (tokens.labelTop || 0), labelWidth: cellWidth,
        label: compactLabel, color: isLast ? tokens.activeColor : tokens.inactiveColor, isActive: isLast, tokens: tokens
      })
    }
  }
  return { card: card, columns: columns, rows: rows }
}

function resolveText(module, tokens, frame, state) {
  var bind = module.bind || {}, props = module.props || {}
  var value = bind.value ? formatValue(valueAt(state, bind.value), props.valueFormat, props.valueNullText) : ''
  return { id: module.id, type: module.type, frame: frame, tokens: tokens, text: module.copy && module.copy.template ? fill(module.copy.template, { value: value }) : (module.copy && module.copy.text ? module.copy.text : value) }
}

function listData(module, tokens, frame, state) {
  var raw = listRaw(module, state)
  var props = module.props || {}
  var layout = props.layout || 'menu'
  var result = []
  if (layout === 'menu') {
    var definitions = props.items || []
    var allowed = {}
    for (var r = 0; r < raw.length; r++) allowed[String(itemValue(raw[r], props.idField || ''))] = true
    for (var i = 0; i < definitions.length; i++) {
      var definition = definitions[i]
      if (!allowed[String(definition.id)]) continue
      var index = result.length
      result.push({
        id: module.id + '-' + definition.id,
        frame: { left: frame.left, top: frame.top + index * ((tokens.itemHeight || 0) + (tokens.itemGap || 0)), width: frame.width, height: tokens.itemHeight || 0 },
        title: definition.copy && definition.copy.title ? definition.copy.title : definition.id,
        subtitle: definition.copy && definition.copy.subtitle ? definition.copy.subtitle : '',
        accent: definition.tokens && definition.tokens.accent ? definition.tokens.accent : '',
        action: definition.actions && definition.actions.tap ? definition.actions.tap : '',
        tokens: adapter.merge(tokens, definition.tokens || {})
      })
    }
    return result
  }
  if (layout !== 'record') throw new Error('Unknown V3 list layout: ' + layout)
  var fields = props.fields || {}
  for (var recordIndex = 0; recordIndex < raw.length; recordIndex++) {
    var record = raw[recordIndex]
    var title = mapValue(fields.title, record, module.id, 'title')
    var trailing = mapValue(fields.trailing, record, module.id, 'trailing')
    var subtitle = mapValue(fields.subtitle, record, module.id, 'subtitle')
    var metric1 = mapValue(fields.metric1, record, module.id, 'metric1')
    var metric2 = mapValue(fields.metric2, record, module.id, 'metric2')
    var metric3 = mapValue(fields.metric3, record, module.id, 'metric3')
    var footer = mapValue(fields.footer, record, module.id, 'footer')
    var footerTrailing = mapValue(fields.footerTrailing, record, module.id, 'footerTrailing')
    result.push({
      id: module.id + '-' + (record.id || recordIndex),
      frame: { left: frame.left, top: frame.top + recordIndex * ((tokens.itemHeight || 0) + (tokens.itemGap || 0)), width: frame.width, height: tokens.itemHeight || 0 },
      title: title.text, titleColor: title.color || tokens.titleColor,
      trailing: trailing.text, trailingColor: trailing.color || tokens.trailingColor,
      subtitle: subtitle.text, subtitleColor: subtitle.color || tokens.secondaryColor,
      metric1: metric1.text, metric2: metric2.text, metric3: metric3.text,
      footer: footer.text, footerColor: footer.color || tokens.footerColor,
      footerTrailing: footerTrailing.text, footerTrailingColor: footerTrailing.color || tokens.footerTrailingColor,
      tokens: tokens
    })
  }
  return result
}

function resolveModule(surfaceModule, moduleOverride, profile, scene, safe, state, flow) {
  var tokens = adapter.merge(surfaceModule.tokens || {}, moduleOverride || {})
  var frame = flow ? flow.frame : frameFor(profile, scene, safe, tokens)
  if (surfaceModule.type === 'header') return resolveHeader(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'button') return resolveButton(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'text') return resolveText(surfaceModule, tokens, frame, state || {})
  var resolved = { id: surfaceModule.id, type: surfaceModule.type, frame: frame, copy: adapter.merge({}, surfaceModule.copy || {}), tokens: tokens, action: surfaceModule.actions && surfaceModule.actions.tap ? surfaceModule.actions.tap : '' }
  if (surfaceModule.type === 'metric-list') resolved.items = metricListData(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'metric-grid') resolved.items = metricGridData(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'chart-card') resolved.chart = chartCardData(surfaceModule, tokens, frame, state || {})
  if (surfaceModule.type === 'list') resolved.items = listData(surfaceModule, tokens, frame, state || {})
  return resolved
}

function resolve(surface, profile, scene, safe, state) {
  if (!surface || surface.renderer !== 'surface-v1') throw new Error('V3 Surface Runtime requires surface-v1 JSON')
  var selected = variant(surface, profile)
  var stream = streamFor(profile, scene, safe, selected.tokens)
  var cursor = 0
  var modules = [], headers = [], texts = [], buttons = [], metricList = null
  var flowHeaders = [], flowTexts = [], flowButtons = [], flowMetricItems = [], flowChartCards = [], flowColumnBars = [], flowRowBars = [], flowMenuItems = [], flowRecordItems = []

  for (var i = 0; i < surface.modules.length; i++) {
    var source = surface.modules[i]
    if (!visible(source.visibleWhen, state || {})) continue
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
      else if (module.type === 'button') flowButtons.push(module)
      else if (module.type === 'metric-grid') flowMetricItems = flowMetricItems.concat(module.items)
      else if (module.type === 'chart-card') {
        flowChartCards.push(module.chart.card)
        flowColumnBars = flowColumnBars.concat(module.chart.columns)
        flowRowBars = flowRowBars.concat(module.chart.rows)
      } else if (module.type === 'list') {
        if ((source.props && source.props.layout) === 'record') flowRecordItems = flowRecordItems.concat(module.items)
        else flowMenuItems = flowMenuItems.concat(module.items)
      } else throw new Error('Unsupported V3 flow module type: ' + module.type)
      continue
    }

    if (module.type === 'header') headers.push(module)
    else if (module.type === 'text') texts.push(module)
    else if (module.type === 'button') buttons.push(module)
    else if (module.type === 'metric-list') {
      if (metricList) throw new Error('surface-v1 currently permits one metric-list module per surface')
      metricList = module
    } else if (module.type === 'metric-grid') flowMetricItems = flowMetricItems.concat(module.items)
  }

  return {
    id: surface.id, shape: profile.formFactor, sceneWidth: scene.width, sceneHeight: scene.height,
    background: selected.tokens.background, modules: modules,
    headers: headers, texts: texts, buttons: buttons, metricList: metricList,
    stream: stream, streamPaddingBottom: selected.tokens.streamPaddingBottom || 0,
    flowContentHeight: cursor + (selected.tokens.streamPaddingBottom || 0),
    flowHeaders: flowHeaders, flowTexts: flowTexts, flowButtons: flowButtons,
    flowMetricItems: flowMetricItems, flowChartCards: flowChartCards,
    flowColumnBars: flowColumnBars, flowRowBars: flowRowBars,
    flowMenuItems: flowMenuItems, flowRecordItems: flowRecordItems
  }
}

module.exports = { resolve: resolve, formatValue: formatValue }
