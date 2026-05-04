import api from './index.js'

/** Backend.md — 근무자 관리 Base path */
const PATH = '/management'

/**
 * MANAGEMENT_001 인력 데이터 불러오기 (siteCode·date 필수)
 * GET /management/sync?siteCode=&date=
 */
export const syncWorkforce = (siteCode, date) => {
  const sc = siteCode != null ? String(siteCode).trim() : ''
  const d = date != null ? String(date).trim() : ''
  return api.get(`${PATH}/sync`, { params: { siteCode: sc, date: d } })
}

/**
 * MANAGEMENT_003 작업자 목록 조회
 * GET /management/list?date=
 */
export const fetchWorkerList = (date) => {
  const params = {}
  if (date != null && String(date).trim() !== '') {
    params.date = date
  }
  return api.get(`${PATH}/list`, { params })
}

/**
 * MANAGEMENT_002 근무자 검색
 * GET /management/search
 */
export const fetchWorkerSearch = ({ date, attendanceStatus, partnerCompany, searchName } = {}) => {
  const params = {}
  if (date != null && String(date).trim() !== '') params.date = date
  if (attendanceStatus != null && String(attendanceStatus).trim() !== '')
    params.attendanceStatus = attendanceStatus
  if (partnerCompany != null && String(partnerCompany).trim() !== '')
    params.partnerCompany = partnerCompany
  if (searchName != null && String(searchName).trim() !== '') params.searchName = searchName
  return api.get(`${PATH}/search`, { params })
}

/** MANAGEMENT_004 */
export const fetchWorkerProfile = (workerIdx) => api.get(`${PATH}/${workerIdx}/detail`)

/** MANAGEMENT_005 */
export const fetchWorkerDocs = (workerIdx) => api.get(`${PATH}/${workerIdx}/docs`)

/** MANAGEMENT_006 @param {string} [yearMonth] 예: 2026-05 */
export const fetchWorkerAttendance = (workerIdx, yearMonth) =>
  api.get(`${PATH}/${workerIdx}/attendance`, {
    params: yearMonth ? { yearMonth } : {},
  })

/** MANAGEMENT_007 */
export const fetchWorkerDeployments = (workerIdx) => api.get(`${PATH}/${workerIdx}/deployments`)

/** MANAGEMENT_008 */
export const fetchWorkerPenalties = (workerIdx) => api.get(`${PATH}/${workerIdx}/penalties`)

/** MANAGEMENT_009 */
export const fetchWorkerAccidents = (workerIdx) => api.get(`${PATH}/${workerIdx}/accidents`)

/** MANAGEMENT_010 게이트 출근 */
export const gateClockIn = (body) => api.post(`${PATH}/attendance/gate-clock-in`, body)

/** MANAGEMENT_011 게이트 퇴근 */
export const gateClockOut = (body) => api.post(`${PATH}/attendance/gate-clock-out`, body)
