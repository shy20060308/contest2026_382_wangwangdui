module.exports = {
  base: {
    contentWidth: 164,
    surface: 'preview-grid',
    faceIds: ['sport', 'simple', 'dashboard'],
    pageSize: 0,
    header: { top: 0, width: 164, height: 24 },
    content: { top: 30, width: 164, bottomInset: 0 },
    cardHeight: 76,
    gap: 8,
    titleSize: 14,
    nameSize: 8,
    previewTimeSize: 17,
    chrome: {
      headerBackSize: 8,
      rect: {
        cardRadius: 14,
        cardPadding: 7,
        previewHeight: 42,
        previewRadius: 9,
        accentWidth: 28,
        accentHeight: 3,
        accentRadius: 2,
        accentMarginTop: 4,
        nameMarginTop: 5,
        selectedSize: 6,
        selectedMarginTop: 2,
        currentMarginLeft: 8,
        currentLabelSize: 6,
        currentLetterSpacing: 1,
        currentNameSize: 12,
        currentNameMarginTop: 5,
        currentLineWidth: 36,
        currentLineHeight: 3,
        currentLineRadius: 2,
        currentLineMarginTop: 6,
        currentHintSize: 6,
        currentHintMarginTop: 6
      }
    }
  },
  circle: {
    contentWidth: 148,
    surface: 'preview-swiper',
    faceIds: ['sport', 'simple', 'dashboard', 'mechanical'],
    header: { top: 8, width: 124, height: 18 },
    preview: { top: 32, width: 136, height: 112 },
    footer: { top: 148, width: 120, height: 16 },
    titleSize: 10,
    previewNameSize: 8,
    previewTimeSize: 24,
    previewRadius: 56,
    chrome: {
      circle: {
        previewBorderWidth: 1,
        faceNameMarginTop: 6,
        tagSize: 6,
        tagMarginTop: 3,
        selectedLineWidth: 34,
        selectedLineHeight: 3,
        selectedLineRadius: 2,
        selectedLineMarginTop: 7,
        footerSize: 7
      }
    }
  },
  pill: {
    contentWidth: 168,
    surface: 'cards-pager',
    faceIds: ['sport', 'simple', 'dashboard', 'alpine'],
    pageSize: 2,
    header: { top: 0, width: 168, height: 30 },
    content: { top: 42, width: 168, bottomInset: 50 },
    pager: { bottomInset: 30, width: 168, height: 24 },
    cardHeight: 126,
    cardGap: 12,
    titleSize: 18,
    nameSize: 14,
    descSize: 8,
    previewWidth: 64,
    chrome: {
      pill: {
        cardBorderWidth: 1,
        cardRadius: 24,
        cardPadding: 10,
        previewBorderWidth: 1,
        previewRadius: 20,
        previewTimeSize: 30,
        previewMinuteSize: 17,
        copyMarginLeft: 10,
        badgeHeight: 18,
        badgeRadius: 9,
        badgeSize: 7,
        badgePaddingX: 7,
        descLineHeight: 13,
        descMarginTop: 7,
        tagSize: 7,
        tagMarginTop: 8,
        pagerButtonWidth: 32,
        pagerButtonSize: 22,
        pagerTextSize: 8,
        cardInnerInset: 20
      }
    }
  },
  rect: { contentWidth: 164 }
}
