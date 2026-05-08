import api from './index'

const BASE_URL = '/weather'

const unwrapWeatherResponse = (response) => {
  if (!response) {
    return null
  }

  if (response.today || response.analysis || response.forecastDays) {
    return response
  }

  if (response.data?.today || response.data?.analysis || response.data?.forecastDays) {
    return response.data
  }

  if (response.data?.data) {
    return response.data.data
  }

  if (response.data) {
    return response.data
  }

  return response
}

export const getWeatherDashboard = async (reportDate) => {
  const response = await api.get(`${BASE_URL}/dashboard`, {
    params: { reportDate },
    timeout: 20000,
  })

  return unwrapWeatherResponse(response)
}

export const getTodayWeather = async (reportDate) => {
  const response = await api.get(`${BASE_URL}/today`, {
    params: { reportDate },
    timeout: 20000,
  })

  return unwrapWeatherResponse(response)
}