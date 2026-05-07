import api from './index.js'

/** @returns {Promise<Array<{ idx: number, name: string, location?: string, period?: string }>>} */
export async function getProjectList() {
  return await api.get('/project')
}

/**
 * @param {{ name: string, location?: string, startDate?: string|null, endDate?: string|null }} body
 */
export async function createProject(body) {
  return await api.post('/project', body)
}

/**
 * 현장별 공정(공종) 목록 — 공종 선택용
 * @param {number|string} projectId
 * @param {string} [tradeName]
 */
export async function getTradeProcessList(projectId, tradeName) {
  const params = { projectId }
  if (tradeName) params.tradeName = tradeName
  return await api.get('/trade-process', { params })
}
