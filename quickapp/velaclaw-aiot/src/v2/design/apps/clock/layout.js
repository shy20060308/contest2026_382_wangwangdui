module.exports = {
  base: {
    surface: 'rect-face-stage',
    faceIds: ['sport', 'simple', 'dashboard'],
    notificationOverlay: false,
    alpine: {
      dataGlassTop: 0,
      dataRowTop: 0,
      batteryTop: 0
    },
    faces: {}
  },
  circle: {
    surface: 'circle-face-stage',
    faceIds: ['sport', 'simple', 'dashboard', 'mechanical'],
    notificationOverlay: false,
    faces: {
      sport: {
        root: { width: 192, height: 192 },
        date: { fontSize: 8, marginTop: -2 },
        ring: { width: 122, height: 122, marginTop: 12 },
        arc: { width: 122, height: 122, strokeWidth: 5, startAngle: -132, totalAngle: 264, centerX: 61, centerY: 61, radius: 55 },
        timeBlock: { width: 122, height: 122 },
        vitalTime: { width: 104, height: 66 },
        hour: { width: 104, height: 46, fontSize: 36, marginTop: -4, marginRight: 22 },
        minute: { width: 104, height: 46, fontSize: 36, marginLeft: 22, marginBottom: -22 },
        goal: { fontSize: 8, marginTop: 2 },
        metricRow: { width: 108, height: 29, marginTop: 3 },
        metric: { width: 34, height: 29 },
        metricIcon: { width: 10, height: 10 },
        metricValue: { width: 34, fontSize: 7, marginTop: 1 }
      },
      simple: {
        root: { width: 192, height: 192 },
        week: { fontSize: 8 },
        time: { fontSize: 28, marginTop: 3 },
        date: { fontSize: 8, marginTop: 1 },
        dial: { width: 122, height: 122, marginTop: 12 },
        arc: { width: 122, height: 122, strokeWidth: 5, startAngle: 0, totalAngle: 360, centerX: 61, centerY: 61, radius: 55 },
        center: { width: 122, height: 122 },
        label: { fontSize: 8, marginTop: 5 },
        footer: { width: 108, height: 29, marginTop: 3 },
        metric: { width: 34, height: 29 },
        icon: { width: 10, height: 10 },
        stat: { width: 34, fontSize: 7, marginTop: 1 }
      },
      dashboard: {
        root: { width: 192, height: 192 },
        time: { fontSize: 35, marginTop: 14 },
        date: { fontSize: 8, marginTop: -1 },
        grid: { width: 142, height: 71, marginTop: 8 },
        card: { width: 68, height: 71, radius: 16, paddingTop: 8 },
        label: { fontSize: 7 },
        value: { fontSize: 15, marginTop: 3 },
        track: { width: 48, height: 4, radius: 2, marginTop: 7 },
        fill: { height: 4, radius: 2 },
        bars: { width: 50, height: 18, marginTop: 4 },
        bar: { width: 4, maxHeight: 18, radius: 2, minHeight: 4, minSpan: 8 },
        battery: { width: 104, height: 24, marginTop: 7 },
        batteryIcon: { width: 12, height: 12 },
        batteryTrack: { width: 62, height: 4, radius: 2, marginLeft: 5 },
        batteryFill: { height: 4, radius: 2 },
        batteryText: { width: 24, fontSize: 7, marginLeft: 3 }
      },
      mechanical: {
        root: { left: 0, top: 0, width: 192, height: 192 },
        dial: { left: 8, top: 8, width: 176, height: 176 },
        bezel: { left: 0, top: 0, width: 176, height: 176, radius: 88, borderWidth: 3 },
        innerRing: { left: 6, top: 6, width: 164, height: 164, radius: 82, borderWidth: 1 },
        minuteTick: { left: 88, top: 9, width: 1, height: 4, originX: 0, originY: 79 },
        majorTick: { left: 87, top: 7, width: 2, height: 9, originX: 1, originY: 81 },
        roman: { width: 22, height: 14, fontSize: 9 },
        romanTwelve: { left: 77, top: 16 },
        romanThree: { left: 145, top: 81 },
        romanSix: { left: 77, top: 148 },
        romanNine: { left: 9, top: 81 },
        brand: { left: 61, top: 41, width: 54, height: 15, fontSize: 10 },
        caption: { left: 57, top: 54, width: 62, height: 8, fontSize: 5 },
        power: { left: 60, top: 64, width: 56, height: 8, fontSize: 5 },
        dateWindow: { left: 121, top: 82, width: 25, height: 20, radius: 3, borderWidth: 1 },
        dateLabel: { width: 23, height: 7, fontSize: 4 },
        dateValue: { width: 23, height: 10, fontSize: 8 },
        subdial: { left: 70, top: 116, width: 36, height: 36, radius: 18 },
        subdialRing: { left: 0, top: 0, width: 36, height: 36, radius: 18, borderWidth: 1 },
        subdialCopy: { width: 36, height: 36 },
        subdialLabel: { width: 34, height: 8, fontSize: 5 },
        subdialValue: { width: 34, height: 13, fontSize: 10 },
        hourHand: { left: 86, top: 48, width: 4, height: 43, radius: 2, originX: 2, originY: 40 },
        minuteHand: { left: 87, top: 31, width: 2, height: 60, radius: 1, originX: 1, originY: 57 },
        secondHand: { left: 88, top: 25, width: 1, height: 68, originX: 0, originY: 63 },
        centerPin: { left: 83, top: 83, width: 11, height: 11, radius: 6 },
        centerCap: { left: 86, top: 86, width: 5, height: 5, radius: 3 }
      }
    }
  },
  pill: {
    surface: 'pill-face-stage',
    faceIds: ['sport', 'simple', 'dashboard', 'alpine'],
    notificationOverlay: true,
    alpine: {
      dataGlassTop: 319,
      dataRowTop: 327,
      batteryTop: 401
    }
  },
  rect: {
    surface: 'rect-face-stage'
  }
}
