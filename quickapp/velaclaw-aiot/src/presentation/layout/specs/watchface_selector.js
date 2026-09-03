module.exports = {
  id: 'watchface-selector-l3-free',
  freedomLevel: 3,
  strategy: 'free',
  default: {
    mode: 'external-engine',
    surface: 'cards-pager',
    itemIds: ['sport', 'simple', 'dashboard', 'alpine'],
    pageSize: 2,
    safeWidth: 168,
    tokens: {
      title: '选择表盘',
      hint: '左右翻页，点击表盘立即应用'
    }
  },
  compositions: {
    circle: {
      mode: 'external-engine',
      surface: 'preview-swiper',
      itemIds: ['sport', 'simple', 'dashboard', 'mechanical'],
      pageSize: 1,
      safeWidth: 152,
      tokens: {
        title: '表盘库',
        hint: '点击应用'
      }
    },
    rect: {
      mode: 'external-engine',
      surface: 'preview-grid',
      itemIds: ['sport', 'simple', 'dashboard'],
      pageSize: 3,
      columns: 2,
      safeWidth: 168,
      tokens: {
        title: '表盘库',
        hint: '点击预览立即应用'
      }
    },
    pill: {
      mode: 'external-engine',
      surface: 'cards-pager',
      itemIds: ['sport', 'simple', 'dashboard', 'alpine'],
      pageSize: 2,
      safeWidth: 168,
      tokens: {
        title: '选择表盘',
        hint: '左右翻页，点击表盘立即应用'
      }
    }
  }
}
