var ITEMS = [
  { id: 'sync', name: '蓝牙同步', description: '连接手机并模拟数据上传', icon: '/common/icons/sync.jpg', route: '/pages/settings/bluetooth' },
  { id: 'vibration', name: '震动反馈', description: '提醒开关、强度与反馈模式', icon: '/common/icons/vibration.jpg', route: '/pages/settings/vibration' },
  { id: 'brightness', name: '亮度与省电', description: '亮度、抬腕亮屏、低功耗', icon: '/common/icons/brightness.jpg', route: '/pages/settings/brightness' },
  { id: 'motion', name: '动作与加速度', description: '三轴诊断与动作强度测量', icon: '/common/icons/motion.jpg', route: '/pages/settings/motion' },
  { id: 'diagnostics', name: '设备自检', description: '屏幕档案与系统能力状态', icon: '/common/icons/diagnostics.jpg', route: '/pages/settings/diagnostics' }
]

export function getSettingsMenu() {
  var result = []
  for (var i = 0; i < ITEMS.length; i++) {
    var item = ITEMS[i]
    result.push({ id: item.id, name: item.name, description: item.description, icon: item.icon, route: item.route })
  }
  return result
}
