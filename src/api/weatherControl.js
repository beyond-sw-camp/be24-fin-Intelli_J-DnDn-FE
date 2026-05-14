import api from '@/api/index.js'
import { getGateEquipments } from '@/api/workOrder'
import { analyzeWeatherRisk } from '@/api/weatherAi'

export async function fetchWeatherDashboard(reportDate) {
  return api.get('/weather/dashboard', {
    params: { reportDate },
    timeout: 30000,
  })
}

export async function fetchWeatherWorkOrderEquipments(reportDate) {
  const response = await getGateEquipments(reportDate)
  return Array.isArray(response) ? response : []
}

export async function fetchWeatherAiAnalysis(reportDate) {
  return analyzeWeatherRisk(reportDate)
}
