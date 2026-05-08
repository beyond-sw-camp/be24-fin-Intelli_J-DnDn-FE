import api from './index'

const BASE_URL = '/work-order'

// 1. 작업 지시서 작성
export const createWorkOrder = async (workOrderData) => {
  return await api.post(BASE_URL, workOrderData)
}

export const getWorkOrderList = async () => {
  return await api.get(BASE_URL)
}

// 2. 작업 지시서 단일 조회
export const getWorkOrder = async (workOrderId) => {
  return await api.get(`${BASE_URL}/${workOrderId}`)
}

// 3. 작업 지시서 수정
export const updateWorkOrder = async (workOrderId, workOrderData) => {
  return await api.put(`${BASE_URL}/${workOrderId}`, workOrderData)
}

// 4. 작업 지시서 삭제
export const deleteWorkOrder = async (workOrderId) => {
  return await api.delete(`${BASE_URL}/${workOrderId}`)
}

export const approveWorkOrder = async (workOrderId) => {
  return await api.put(`${BASE_URL}/${workOrderId}/approve`)
}
// 중장비 입출차 페이지
export const getGateEquipments = async (targetDate) => {
  try {
    const params = {}
    if (targetDate) {
      params.targetDate = targetDate
    }
    
    const response = await api.get(`${BASE_URL}/gate-equipments`, {
      params,
      timeout: 20000
    })
    
    // 응답 정규화
    const data = response.data || response
    if (Array.isArray(data)) return data
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.data?.data && Array.isArray(data.data.data)) return data.data.data
    return []
  } catch (error) {
    console.error('[WorkOrder API] 중장비 조회 실패:', error)
    return []
  }
}

// 기상관제/ESG 대시보드
export const getWorkOrdersByDate = async (date) => {
  try {
    const params = {}
    if (date) {
      params.date = date
    }
    
    const response = await api.get(BASE_URL, {
      params,
      timeout: 20000
    })
    
    // 응답 정규화
    const data = response.data || response
    if (Array.isArray(data)) return data
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.data?.data && Array.isArray(data.data.data)) return data.data.data
    return []
  } catch (error) {
    console.error('[WorkOrder API] 작업지시 조회 실패:', error)
    return []
  }
}