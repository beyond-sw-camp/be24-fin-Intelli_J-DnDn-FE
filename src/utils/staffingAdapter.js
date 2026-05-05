/** API ↔ 인력 배치 화면 모델 (STAFFING.md / StaffingDto) */

export const TRADE_UI_TO_API = {
  carpenter: 'CARPENTER',
  rebar: 'REBAR',
  welder: 'WELDER',
  labor: 'TILE',
}

export const TRADE_API_TO_UI = {
  CARPENTER: 'carpenter',
  REBAR: 'rebar',
  WELDER: 'welder',
  TILE: 'labor',
}

function affiliationKindToUiString(kind, partnerCompany) {
  const k = String(kind ?? '').toUpperCase()
  const pc = String(partnerCompany ?? '').trim()
  if (k === 'DIRECT') return '본사 소속'
  if (k === 'AGENCY') return '인력사무소 (개인)'
  if (k === 'PARTNER') return pc ? `협력사 (${pc})` : '협력사'
  return pc ? `협력사 (${pc})` : '협력사'
}

export function inferSkillsFromAffiliationLine(line) {
  const s = String(line ?? '').toLowerCase()
  const skills = []
  if (s.includes('목공')) skills.push('carpenter')
  if (s.includes('철근')) skills.push('rebar')
  if (s.includes('용접')) skills.push('welder')
  if (s.includes('타일')) skills.push('labor')
  if (s.includes('인부')) skills.push('labor')
  if (!skills.length) skills.push('labor')
  return [...new Set(skills)]
}

/** AssignedWorkerRes → 테이블/workerTagOk용 행 */
export function mapAssignedWorkerRes(apiRow) {
  const idx = apiRow.workerIdx
  const affiliation = affiliationKindToUiString(apiRow.affiliationKind, apiRow.partnerCompany)
  const score = typeof apiRow.fatigueScore === 'number' ? apiRow.fatigueScore : 0
  return {
    workerIdx: idx,
    id: String(idx),
    profileId: idx,
    name: apiRow.name ?? '',
    affiliation,
    affiliationLine: apiRow.affiliationLine ?? '',
    employmentKind: apiRow.employmentKind,
    fatigueScore: score,
    fatigueHighRisk: apiRow.fatigueHighRisk === true || apiRow.fatigue_high_risk === true,
    fatiguePtAccident: apiRow.fatiguePtAccident ?? apiRow.fatigue_pt_accident,
    fatiguePtStreak: apiRow.fatiguePtStreak ?? apiRow.fatigue_pt_streak,
    fatiguePtOvernight: apiRow.fatiguePtOvernight ?? apiRow.fatigue_pt_overnight,
    fatiguePtTradeRisk: apiRow.fatiguePtTradeRisk ?? apiRow.fatigue_pt_trade_risk,
    fatigue: { nightShiftYesterday: false, consecutiveDays: 0 },
    workerTag: '작업자',
    attendanceTag: '출근',
    nationality: '내국인',
    skills: inferSkillsFromAffiliationLine(apiRow.affiliationLine),
  }
}

/** ZoneSubRes.tradeNeeds → 화면 tradeNeeds ({ trade: carpenter|…, need }) */
export function tradeNeedsFromZoneSubRes(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((tn) => ({
    trade: TRADE_API_TO_UI[tn.trade] ?? String(tn.trade ?? '').toLowerCase(),
    need: tn.need,
  }))
}

/** 구역 수정 PATCH 바디 (Trade enum 문자열) */
export function buildZoneUpdateBody(title, tradeRows) {
  const merged = {}
  for (const row of tradeRows || []) {
    const need = Math.max(0, Math.floor(Number(row.need) || 0))
    if (!row.trade || need <= 0) continue
    const apiTrade = TRADE_UI_TO_API[row.trade] ?? 'TILE'
    merged[apiTrade] = (merged[apiTrade] || 0) + need
  }
  const tradeNeeds = Object.entries(merged).map(([trade, need]) => ({ trade, need }))
  return { title: String(title ?? '').trim(), tradeNeeds }
}
