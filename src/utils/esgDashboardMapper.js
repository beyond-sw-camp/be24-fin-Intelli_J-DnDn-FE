const MANAGEMENT_ZONES = [
  { id: 'wash', name: '세척장', icon: '🧼', type: 'fixed' },
  { id: 'civil', name: '민원 구역', icon: '📢', type: 'fixed' },
]

export function generateWorkZones(workOrders) {
  const locations = new Set()
  
  workOrders?.forEach((wo) => {
    if (wo.workLocation) {
      locations.add(wo.workLocation)
    }
  })
  
  return Array.from(locations)
    .sort()
    .map((loc) => ({
      id: `work_${loc}`,
      name: loc,
      icon: '🏗️',
      type: 'work',
    }))
}

export function getAllZones(workOrders) {
  const workZones = generateWorkZones(workOrders)
  return [...workZones, ...MANAGEMENT_ZONES]
}


export function calculateEsgScore(zoneId, data) {
  if (!data) return 0
  
  const e = Number(data.environmental || 0)
  const s = Number(data.social || 0)
  const g = Number(data.governance || 0)
  
  return Math.round((e * 0.4 + s * 0.35 + g * 0.25) * 100) / 100
}


export function getScoreBadgeClass(score) {
  if (score >= 85) return 'text-emerald-700 bg-emerald-100 border-emerald-200'
  if (score >= 70) return 'text-amber-700 bg-amber-100 border-amber-200'
  return 'text-rose-700 bg-rose-100 border-rose-200'
}


export function getBuildingGrowthLevel(score) {
  if (score >= 85) return '최고 성과'
  if (score >= 70) return '성장 중'
  return '기초 단계'
}


export function getDefaultMissions(zoneId) {
  const missionsByZone = {
    wash: [
      { id: 'w1', title: '오염수 회수 점검', status: 'ongoing', priority: 'high' },
      { id: 'w2', title: '세척 대기 동선 분산', status: 'pending', priority: 'medium' },
      { id: 'w3', title: '전력 피크 관리', status: 'completed', priority: 'medium' },
    ],
    civil: [
      { id: 'c1', title: '민원 안내 강화', status: 'ongoing', priority: 'high' },
      { id: 'c2', title: '분진 저감 운영', status: 'pending', priority: 'high' },
      { id: 'c3', title: '장비 동선 통제', status: 'completed', priority: 'medium' },
    ],
  }

  const isWorkZone = zoneId?.startsWith('work_')
  
  if (isWorkZone) {
    return [
      { id: 'wk1', title: '양중·장비 동선 점검', status: 'ongoing', priority: 'high' },
      { id: 'wk2', title: '작업 품질 유지', status: 'pending', priority: 'medium' },
      { id: 'wk3', title: '위험 조치 기록', status: 'completed', priority: 'medium' },
    ]
  }

  return missionsByZone[zoneId] || []
}

export function getRankingData() {
  return [
    { rank: 1, site: '목동 프로젝트', score: 87, trend: 'up' },
    { rank: 2, site: '등촌동 현장', score: 78, trend: 'flat' },
    { rank: 3, site: '신길동 현장', score: 72, trend: 'down' },
  ]
}