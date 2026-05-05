import api from './index.js'

/** @typedef {'DIRECT' | 'PARTNER'} StaffingAffiliationKindApi */

const PATH = '/staffing'

/**
 * STAFFING_001 — 자동 추천 배치 (본사 DIRECT·WORKER·당일 PRESENT/LATE·미배치만)
 * @param {string} [rosterDate] yyyy-MM-dd
 * @returns {Promise<{ assignedCount: number, unassignedCount: number }>}
 */
export async function postStaffingAutoRecommend(rosterDate) {
  const params = {}
  if (rosterDate) params.rosterDate = rosterDate
  return await api.post(`${PATH}/auto-recommend`, {}, { params })
}

/**
 * STAFFING_002 — 배치 초기화
 * @param {string} [rosterDate] yyyy-MM-dd
 */
export async function postStaffingReset(rosterDate) {
  const params = {}
  if (rosterDate) params.rosterDate = rosterDate
  return await api.post(`${PATH}/reset`, {}, { params })
}

/** STAFFING_003 — 기본구역 트리 */
export async function getStaffingZones() {
  return await api.get(`${PATH}/zones`)
}

/** STAFFING_004 — 상세구역 단건 */
export async function getZoneSubDetail(zoneSubIdx) {
  return await api.get(`${PATH}/zones/${zoneSubIdx}`)
}

/**
 * STAFFING_006 GET — 상세구역 배치 작업자
 * @param {number|string} zoneSubIdx
 * @param {string} [rosterDate]
 */
export async function getZoneSubWorkers(zoneSubIdx, rosterDate) {
  const params = {}
  if (rosterDate) params.rosterDate = rosterDate
  return await api.get(`${PATH}/zones/${zoneSubIdx}/workers`, { params })
}

/** STAFFING_005 — 구역명·직종별 필요 인원 */
export async function patchZoneSub(zoneSubIdx, body) {
  return await api.patch(`${PATH}/zones/${zoneSubIdx}`, body)
}

/**
 * STAFFING_006 DELETE — 구역에서 미투입
 * @param {number|string} zoneSubIdx
 * @param {number|string} workerIdx
 */
export async function deleteZoneSubWorker(zoneSubIdx, workerIdx, rosterDate) {
  const params = {}
  if (rosterDate) params.rosterDate = rosterDate
  return await api.delete(`${PATH}/zones/${zoneSubIdx}/workers/${workerIdx}`, { params })
}

/**
 * STAFFING_007 — 수동 배치 (성공 시 201)
 * @param {number[]} workerIds
 */
export async function postZoneSubAssign(zoneSubIdx, workerIds, rosterDate) {
  const params = {}
  if (rosterDate) params.rosterDate = rosterDate
  return await api.post(`${PATH}/zones/${zoneSubIdx}/assign`, { workerIds }, { params })
}

/**
 * STAFFING_008 — 작업자 현황
 * @param {object} [opts]
 * @param {StaffingAffiliationKindApi} [opts.affiliationKind]
 * @param {string} [opts.keyword]
 * @param {boolean} [opts.unassignedOnly]
 * @param {string} [opts.rosterDate]
 */
export async function getStaffingWorkerPool(opts = {}) {
  const params = {}
  if (opts.affiliationKind) params.affiliationKind = opts.affiliationKind
  if (opts.keyword != null && String(opts.keyword).trim() !== '') {
    params.keyword = String(opts.keyword).trim()
  }
  if (opts.unassignedOnly === true) params.unassignedOnly = true
  if (opts.rosterDate) params.rosterDate = opts.rosterDate
  return await api.get(`${PATH}/workers`, { params })
}
