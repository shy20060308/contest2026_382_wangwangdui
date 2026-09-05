module.exports = {
  base: {
    surface: 'rect-face-stage',
    faceIds: ['sport', 'simple', 'dashboard'],
    notificationOverlay: false
  },
  circle: {
    surface: 'circle-face-stage',
    faceIds: ['sport', 'simple', 'dashboard', 'mechanical'],
    notificationOverlay: false
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
