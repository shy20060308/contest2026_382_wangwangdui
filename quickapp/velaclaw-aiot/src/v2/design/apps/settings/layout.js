module.exports = {
  base: {
    contentWidth: 164,
    surface: 'paged-settings-list',
    itemIds: ['sync', 'vibration', 'brightness', 'motion', 'diagnostics'],
    header: { top: 0, width: 164, height: 24 },
    list: { top: 30, width: 164, height: 164 },
    footer: { top: 190, width: 100, height: 20 },
    pageSize: 3,
    itemHeight: 50,
    itemGap: 7,
    chrome: {
      itemRadius: 16,
      itemPadding: 7,
      iconSize: 30,
      iconRadius: 15,
      titleSize: 13,
      pageTextSize: 7,
      itemCopyMarginLeft: 8,
      itemNameSize: 10,
      itemDescSize: 6,
      itemDescLineHeight: 8,
      itemDescMarginTop: 2,
      arrowWidth: 14,
      arrowSize: 13,
      pagerButtonWidth: 24,
      pagerButtonHeight: 18,
      pagerButtonSize: 16,
      dotsWidth: 54,
      dotSize: 6,
      dotRadius: 3,
      dotMarginX: 3
    }
  },
  circle: {
    contentWidth: 148,
    header: { top: 14, width: 112, height: 18 },
    list: { top: 37, width: 148, height: 106 },
    footer: { top: 147, width: 100, height: 16 },
    pageSize: 2,
    itemHeight: 50,
    itemGap: 6,
    chrome: {
      itemRadius: 17,
      itemPadding: 7,
      iconSize: 30,
      iconRadius: 15,
      titleSize: 12,
      itemNameSize: 10,
      itemDescSize: 6,
      itemDescLineHeight: 8,
      arrowSize: 13
    }
  },
  pill: {
    contentWidth: 168,
    header: { top: 0, width: 168, height: 30 },
    list: { top: 40, width: 168, height: 246 },
    footer: { top: 298, width: 112, height: 24 },
    pageSize: 3,
    itemHeight: 76,
    itemGap: 9,
    chrome: {
      itemRadius: 22,
      itemPadding: 10,
      iconSize: 40,
      iconRadius: 20,
      titleSize: 18,
      itemNameSize: 14,
      itemDescSize: 8,
      itemDescLineHeight: 10,
      arrowSize: 18
    }
  },
  rect: {
    contentWidth: 164,
    header: { top: 0, width: 164, height: 24 },
    list: { top: 30, width: 164, height: 164 },
    footer: { top: 196, width: 100, height: 20 }
  }
}
