import api from './index' // localAxios 대신 기본 api 인스턴스를 가져옵니다.

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
