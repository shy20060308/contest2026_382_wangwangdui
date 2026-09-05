'use strict'

const { getPath } = require('./object')

function block(source, tag) {
  const match = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i').exec(source || '')
  return match ? match[1].trim() : ''
}

function flattenPlan(plan, scene, safe, mock) {
  const shape = plan && plan.shape ? plan.shape : 'rect'
  const values = Object.assign({
    ready: true,
    pageVisible: true,
    faceMounted: true,
    isCircle: shape === 'circle',
    isPill: shape === 'pill',
    isRect: shape === 'rect',
    sceneWidth: scene && scene.width || 192,
    sceneHeight: scene && scene.height || 192,
    viewportClass: '', viewportPosition: 'relative', viewportLeft: '0px', viewportTop: '0px', viewportWidth: '100%', viewportHeight: '100%'
  }, mock || {})
  Object.keys(plan || {}).forEach(key => {
    const value = plan[key]
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) values[key] = value
    if (value && typeof value === 'object' && ['left', 'top', 'width', 'height'].every(name => typeof value[name] === 'number')) {
      values[key + 'Left'] = value.left
      values[key + 'Top'] = value.top
      values[key + 'Width'] = value.width
      values[key + 'Height'] = value.height
    }
  })
  if (safe) {
    values.safeLeft = safe.left; values.safeTop = safe.top; values.safeWidth = safe.width; values.safeHeight = safe.height
  }
  return values
}

function replaceBindings(text, values) {
  return String(text || '').replace(/\{\{\s*([^{}]+?)\s*\}\}/g, function (_, expression) {
    const expr = expression.trim()
    if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(expr)) {
      const value = getPath(values, expr)
      if (value !== undefined && value !== null) return String(value)
    }
    if (/^\$item\./.test(expr)) return '示例'
    if (/^[0-9]+$/.test(expr)) return expr
    return ''
  })
}

function literal(value) {
  const source = String(value || '').trim()
  if ((source[0] === "'" && source[source.length - 1] === "'") || (source[0] === '"' && source[source.length - 1] === '"')) return source.slice(1, -1)
  if (source === 'true') return true
  if (source === 'false') return false
  if (/^-?\d+(?:\.\d+)?$/.test(source)) return Number(source)
  return undefined
}

function atom(expression, values) {
  const source = String(expression || '').trim()
  if (!source) return false
  if (source[0] === '!') return !atom(source.slice(1), values)
  const comparison = /^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*(===|!==|==|!=)\s*(.+)$/.exec(source)
  if (comparison) {
    const left = getPath(values, comparison[1])
    const rightLiteral = literal(comparison[3])
    const right = rightLiteral !== undefined ? rightLiteral : getPath(values, comparison[3].trim())
    return comparison[2] === '===' || comparison[2] === '==' ? left === right : left !== right
  }
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(source)) return !!getPath(values, source)
  const direct = literal(source)
  return direct === undefined ? false : !!direct
}

function condition(expression, values) {
  const orParts = String(expression || '').split(/\s*\|\|\s*/)
  return orParts.some(orPart => orPart.split(/\s*&&\s*/).every(andPart => atom(andPart, values)))
}

function translateTemplate(template, values) {
  let html = template || ''
  html = html.replace(/\s+if="\{\{\s*([^{}]+?)\s*\}\}"/g, function (_, expression) {
    return condition(expression, values) ? '' : ' hidden'
  })
  html = html.replace(/\s+(?:for|tid|show|elif|else|@[-\w]+)="[^"]*"/g, '')
  html = replaceBindings(html, values)
  const tags = ['stack', 'scroll', 'swiper', 'div']
  tags.forEach(tag => {
    if (tag === 'div') return
    html = html.replace(new RegExp('<' + tag + '\\b', 'gi'), '<div data-vela-tag="' + tag + '"')
    html = html.replace(new RegExp('<\\/' + tag + '>', 'gi'), '</div>')
  })
  html = html.replace(/<text\b/gi, '<span data-vela-tag="text"').replace(/<\/text>/gi, '</span>')
  html = html.replace(/<slider\b[^>]*><\/slider>/gi, '<div data-vela-tag="slider" class="vela-slider"><div></div></div>')
  html = html.replace(/<slider\b[^>]*\/>/gi, '<div data-vela-tag="slider" class="vela-slider"><div></div></div>')
  html = html.replace(/style="[^"]*\{\{[^"]*"/g, '')
  return html
}

function translateUx(source, plan, scene, safe, mock) {
  const template = block(source, 'template')
  const css = block(source, 'style')
  const values = flattenPlan(plan, scene, safe, mock)
  return {
    html: translateTemplate(template, values),
    css: replaceBindings(css, values),
    structure: Array.from(template.matchAll(/<([A-Za-z][\w-]*)\b[^>]*class="([^"]+)"/g)).slice(0, 80).map(match => ({ tag: match[1], classes: match[2] }))
  }
}

module.exports = { block, flattenPlan, replaceBindings, condition, translateTemplate, translateUx }
