/** @typedef {'direct' | 'partner' | 'agency'} AffiliationKind */

/**
 * 출처 문자열(소속/협력사명)로 현장 관리용 구분을 반환합니다.
 * @param {string} [text]
 * @returns {AffiliationKind}
 */
export function getAffiliationKind(text) {
  const s = String(text ?? '')
  if (s.includes('본사')) return 'direct'
  if (s.includes('인력사무소')) return 'agency'
  if (s.includes('협력사')) return 'partner'
  return 'partner'
}

/**
 * 카드 등에 표시할 소속 문구. 협력사는 `협력사 (태양건설)` → `태양건설` 형태로만 출력합니다.
 * @param {string} [text]
 */
export function formatAffiliationDisplay(text) {
  const s = String(text ?? '')
  const m = s.match(/^협력사\s*\(([^)]+)\)\s*$/)
  if (m) return m[1].trim()
  return s
}

/** @param {AffiliationKind} kind */
export function affiliationKindBadgeClass(kind) {
  if (kind === 'direct') return 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/80'
  if (kind === 'agency') return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/90'
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
}
