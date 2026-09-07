module.exports = {
  base: {
    surface: 'settings-stream', contentWidth: 164,
    headerTop: 0, headerWidth: 164, headerHeight: 24, headerGap: 8, streamWidth: 164,
    compact: false, tall: false, titleSize: 12, cardRadius: 16, cardGap: 6, bodySize: 7, valueSize: 18, testTitleSize: 10,
    controls: { statusCardHeight: 64, levelRowHeight: 34, levelButtonHeight: 34, testCardHeight: 56, capabilityCardHeight: 64, patternCardHeight: 50, pagerHeight: 30 },
    chrome: {
      pageTextSize: 7, cardPadding: 10, cardMarginBottom: 7, statusBorderWidth: 1, statusValueMarginTop: 3,
      switchWidth: 28, switchSize: 13, sectionMarginTop: 4, sectionMarginBottom: 5, levelButtonRadius: 12, levelButtonSize: 11,
      testFeedbackMarginTop: 4, arrowWidth: 18, arrowSize: 14, capabilitySize: 14, capabilityMarginTop: 3, capabilityMarginBottom: 3,
      patternNameWidth: 50, stateWidth: 32, stateSize: 7, pagerMarginTop: 4, pagerButtonWidth: 30, pagerButtonSize: 20, pagerLabelSize: 7
    }
  },
  circle: {
    contentWidth: 148, headerTop: 14, headerWidth: 124, headerHeight: 20, headerGap: 5, streamWidth: 148,
    compact: true, tall: false, titleSize: 12, cardRadius: 14, cardGap: 6, bodySize: 7, valueSize: 18, testTitleSize: 10,
    controls: { statusCardHeight: 64, levelRowHeight: 34, levelButtonHeight: 34, testCardHeight: 56, capabilityCardHeight: 64, patternCardHeight: 50, pagerHeight: 18 }
  },
  pill: {
    contentWidth: 168, headerTop: 0, headerWidth: 168, headerHeight: 32, headerGap: 8, streamWidth: 168,
    compact: false, tall: true, titleSize: 14, cardRadius: 20, cardGap: 8, bodySize: 9, valueSize: 22, testTitleSize: 12,
    controls: { statusCardHeight: 82, levelRowHeight: 44, levelButtonHeight: 44, testCardHeight: 70, capabilityCardHeight: 82, patternCardHeight: 64, pagerHeight: 34 }
  },
  rect: { contentWidth: 164 }
}
