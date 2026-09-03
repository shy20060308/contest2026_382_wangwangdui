function resolve(profile, scene, safe) {
  var tall = safe.height > 260
  var buttonHeight = tall ? 54 : 32
  var gap = tall ? 12 : 6
  var titleHeight = tall ? 34 : 22
  var contentHeight = buttonHeight * 4 + gap * 3
  var total = titleHeight + gap + contentHeight
  var top = safe.top + Math.max(0, Math.floor((safe.height - total) / 2))
  return {
    freedomLevel: 1,
    strategy: 'auto',
    title: { left: safe.left, top: top, width: safe.width, height: titleHeight },
    buttons: { left: safe.left + Math.max(0, Math.round((safe.width - Math.min(150, safe.width)) / 2)), top: top + titleHeight + gap, width: Math.min(150, safe.width), height: contentHeight },
    buttonHeight: buttonHeight,
    gap: gap,
    titleSize: tall ? 20 : 13,
    buttonSize: tall ? 14 : 9,
    radius: Math.round(buttonHeight / 2)
  }
}

module.exports = { resolve: resolve }
