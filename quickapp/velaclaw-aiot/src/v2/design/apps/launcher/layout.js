module.exports = {
  base: {
    contentWidth: 164,
    appIds: ['workout','history','heart','clock','steps','faces','sync','brightness','settings','vibration','notification','today'],
    surface: 'designed-grid',
    pageSize: 6,
    header: { top: 0, width: 164, height: 24 },
    content: { top: 30, width: 164, bottomInset: 32 },
    pager: { bottomInset: 24, width: 164, height: 20 },
    columns: 2,
    gap: 6,
    itemHeight: 54,
    itemGap: 0,
    titleSize: 14,
    pageTextSize: 8,
    nameSize: 9,
    arrowSize: 20,
    iconSize: 30,
    itemRadius: 14,
    listChrome: {
      paddingX: 12,
      nameGap: 12,
      arrowWidth: 20
    },
    gridChrome: {
      borderWidth: 1,
      padding: 8,
      nameGap: 6,
      accentWidth: 3,
      accentHeight: 24,
      accentRadius: 2,
      accentGap: 4
    },
    pagerChrome: {
      buttonWidth: 28,
      buttonHeight: 24,
      buttonSize: 20,
      trackWidth: 96,
      trackHeight: 4,
      trackRadius: 2
    }
  },
  circle: {
    contentWidth: 148,
    surface: 'honeycomb',
    pageSize: 12,
    frame: 'scene',
    honeycomb: {
      label: { left: 54, top: 159, width: 84, height: 18, radius: 9 },
      nameWidth: 78,
      nameSize: 8,
      initialFocusDistance: 82
    }
  },
  pill: {
    contentWidth: 168,
    surface: 'paged-list',
    pageSize: 4,
    header: { top: 0, width: 168, height: 28 },
    content: { top: 36, width: 168, bottomInset: 78 },
    pager: { bottomInset: 30, width: 168, height: 24 },
    itemHeight: 62,
    itemGap: 8,
    titleSize: 18,
    pageTextSize: 8,
    nameSize: 14,
    arrowSize: 20,
    iconSize: 40,
    itemRadius: 20
  },
  rect: {
    contentWidth: 164,
    surface: 'designed-grid'
  }
}
