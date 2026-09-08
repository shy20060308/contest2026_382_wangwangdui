import createHealthChannel from './internal/health_channel'

export default createHealthChannel({
  dataTypeName: 'SPO2',
  fallbackDataType: 6
})
