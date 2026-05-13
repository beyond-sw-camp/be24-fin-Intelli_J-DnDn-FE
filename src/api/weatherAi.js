import api from '@/api/index.js'

export async function analyzeWeatherRisk(date) {
  return api.post('/ai/weather/analyze', null, {
    params: {
      date,
    },
    timeout: 60000,
  })
}