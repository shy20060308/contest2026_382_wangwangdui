import createHealthChannel from './internal/health_channel'

export default createHealthChannel({
  dataTypeName: 'HEART_RATE',
  fallbackDataType: 0
})
