const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

// 기상 대시보드 조회

export async function fetchWeatherDashboard(reportDate) {
  try {
    const url = `${API_BASE_URL}/weather/dashboard?reportDate=${reportDate}`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.warn(`[Weather API] ${response.status} - ${url}`)
      return createEmptyWeatherData()
    }
    
    const data = await response.json()
    return normalizeWeatherResponse(data)
  } catch (error) {
    console.error('[Weather API] 기상 대시보드 조회 실패:', error)
    return createEmptyWeatherData()
  }
}

// 작업지시 조회
export async function fetchWorkOrders(date) {
  try {
    const url = `${API_BASE_URL}/work-order?date=${date}`
    const response = await fetch(url)
    
    if (!response.ok) {
      console.warn(`[WorkOrder API] ${response.status} - ${url}`)
      return []
    }
    
    const data = await response.json()
    return normalizeWorkOrderResponse(data)
  } catch (error) {
    console.error('[WorkOrder API] 작업지시 조회 실패:', error)
    return []
  }
}

// 응답 정규화 함수
function normalizeWeatherResponse(data) {
  if (!data) return createEmptyWeatherData()
  
  return {
    today: data.today || null,
    week: data.week || null,
    rain: data.rain || null,
    airQuality: data.airQuality || null,
    analysis: data.analysis || null,
    equipmentRisks: Array.isArray(data.equipmentRisks) ? data.equipmentRisks : [],
    planRisks: Array.isArray(data.planRisks) ? data.planRisks : [],
    forecastDays: Array.isArray(data.forecastDays) ? data.forecastDays : [],
    alerts: Array.isArray(data.alerts) ? data.alerts : [],
    locationLabel: data.locationLabel || '현장',
  }
}

function normalizeWorkOrderResponse(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (data.data) {
    if (Array.isArray(data.data)) return data.data
    if (data.data.data && Array.isArray(data.data.data)) return data.data.data
  }
  return []
}

function createEmptyWeatherData() {
  return {
    today: null,
    week: null,
    rain: null,
    airQuality: null,
    analysis: null,
    equipmentRisks: [],
    planRisks: [],
    forecastDays: [],
    alerts: [],
    locationLabel: '현장',
  }
}