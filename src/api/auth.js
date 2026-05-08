import api from './index.js'

const AUTH = '/auth'
const ADMIN_ACCOUNTS = '/admin/accounts'

/**
 * 로그인
 * @param {{ loginId: string, password: string }} body
 * @returns {Promise<{ accessToken: string, userIdx: number, name: string, role: string, siteCode?: string|null, trade?: string|null }>}
 */
export async function postAuthLogin(body) {
  return await api.post(`${AUTH}/login`, body)
}

/**
 * 로그인 사용자 본인 비밀번호 변경 (백엔드 규격에 맞춤)
 * @param {{ currentPassword: string, newPassword: string }} body
 */
export async function putAuthChangePassword(body) {
  return await api.put(`${AUTH}/password`, body)
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

/** @param {number|string} idx @param {{ newPassword: string }} body */
export async function putAdminAccountPassword(idx, body) {
  return await api.put(`${ADMIN_ACCOUNTS}/${idx}/password`, body)
}

/** @param {number|string} idx */
export async function deleteAdminAccount(idx) {
  return await api.delete(`${ADMIN_ACCOUNTS}/${idx}`)
}

/** @param {string} [status] PENDING | APPROVED | REJECTED */
export async function getAdminAccountRequests(status) {
  const params = {}
  if (status) params.status = status
  return await api.get('/admin/account-requests', { params })
}

/** @param {number|string} idx @param {{ initialPassword?: string }} [body] */
export async function approveAccountRequest(idx, body = {}) {
  return await api.put(`/admin/account-requests/${idx}/approve`, body)
}

/** @param {number|string} idx @param {{ note?: string }} [body] */
export async function rejectAccountRequest(idx, body) {
  return await api.put(`/admin/account-requests/${idx}/reject`, body ?? {})
}
