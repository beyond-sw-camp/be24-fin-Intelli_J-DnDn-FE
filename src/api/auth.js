import api from './index.js'

const AUTH = '/auth'
const ADMIN_ACCOUNTS = '/admin/accounts'

/**
 * 로그인 — AuthController POST /auth/login
 * @param {{ loginId: string, password: string }} body
 * @returns {Promise<{ accessToken: string, userIdx: number, name: string, role: string, siteCode?: string|null, trade?: string|null }>}
 */
export async function postAuthLogin(body) {
  return await api.post(`${AUTH}/login`, body)
}

/**
 * 로그인 사용자 본인 비밀번호 변경 — PUT /auth/password (Bearer 필수)
 * 백엔드 DTO 필드명이 다르면 이 모듈만 맞춰 주세요.
 * @param {{ currentPassword: string, newPassword: string }} body
 */
export async function putAuthPassword(body) {
  return await api.put(`${AUTH}/password`, body)
}

/**
 * 계정 생성 요청 제출 — AccountRequestController POST /account-requests (인증 필요)
 * @param {{
 *   requestedName: string,
 *   requestedLoginId: string,
 *   requestedRole: string,
 *   siteCode?: string,
 *   trade?: string,
 * }} body
 */
export async function postAccountRequest(body) {
  return await api.post('/account-requests', body)
}

/** @returns {Promise<unknown[]>} */
export async function getAdminAccounts() {
  return await api.get(ADMIN_ACCOUNTS)
}

/** @param {number|string} idx */
export async function getAdminAccount(idx) {
  return await api.get(`${ADMIN_ACCOUNTS}/${idx}`)
}

/** @param {Record<string, unknown>} body */
export async function postAdminAccount(body) {
  return await api.post(ADMIN_ACCOUNTS, body)
}

/** @param {number|string} idx @param {Record<string, unknown>} body */
export async function putAdminAccount(idx, body) {
  return await api.put(`${ADMIN_ACCOUNTS}/${idx}`, body)
}

/** 관리자: 계정 비밀번호 설정 — PUT /admin/accounts/{idx}/password (@link AccountDto.PasswordReq) */
export async function putAdminAccountPassword(idx, body) {
  return await api.put(`${ADMIN_ACCOUNTS}/${idx}/password`, body)
}

/** @param {number|string} idx */
export async function deleteAdminAccount(idx) {
  return await api.delete(`${ADMIN_ACCOUNTS}/${idx}`)
}

/**
 * [ADMIN] 요청 목록 — GET /admin/account-requests?status=
 * @param {string} [status] PENDING | APPROVED | REJECTED
 */
export async function getAdminAccountRequests(status) {
  const params = {}
  if (status) params.status = status
  return await api.get('/admin/account-requests', { params })
}

/**
 * [ADMIN] 요청 승인 — PUT /admin/account-requests/{idx}/approve
 * body 생략 또는 빈 객체 시 서버가 임시 비밀번호 자동 생성. initialPassword는 8자 이상일 때만 전송 권장.
 * @param {number|string} idx
 * @param {{ initialPassword?: string }} [body]
 */
export async function approveAccountRequest(idx, body = {}) {
  return await api.put(`/admin/account-requests/${idx}/approve`, body)
}

/** @param {number|string} idx @param {{ note?: string }} [body] */
export async function rejectAccountRequest(idx, body) {
  return await api.put(`/admin/account-requests/${idx}/reject`, body ?? {})
}
