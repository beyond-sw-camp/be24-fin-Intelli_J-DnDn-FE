export const LEVEL_THRESHOLDS = [0, 30, 50, 65, 78, 88, 95, 100]

export const BASE_SITES = [
  {
    id: 'mokdong',
    name: '목동 복합개발 2공구',
    shortName: '목동',
    address: '서울 양천구 목동',
    contractor: '한화건설',
    manager: '현장 총괄자',
    score: 62.0,
    level: 3,
    carbon: 24.8,
    powerSaving: 86,
    riskCount: 0,
    missionRate: 62,
    trend: 3.0,
    accent: 'emerald',
  },
  {
    id: 'deungchon',
    name: '등촌동 현장',
    shortName: '등촌동',
    address: '서울 강서구 등촌동',
    contractor: '한화건설',
    manager: '안전관리자',
    score: 88.1,
    level: 6,
    carbon: 42.5,
    powerSaving: 146,
    riskCount: 2,
    missionRate: 88,
    trend: 4.6,
    accent: 'sky',
  },
  {
    id: 'singil',
    name: '신길동 현장',
    shortName: '신길동',
    address: '서울 영등포구 신길동',
    contractor: '한화건설',
    manager: '품질관리자',
    score: 76.2,
    level: 4,
    carbon: 31.2,
    powerSaving: 104,
    riskCount: 5,
    missionRate: 76,
    trend: 2.2,
    accent: 'violet',
  },
  {
    id: 'sindaebang',
    name: '신대방 현장',
    shortName: '신대방',
    address: '서울 동작구 신대방동',
    contractor: '한화건설',
    manager: '품질관리자',
    score: 72.5,
    level: 4,
    carbon: 28.4,
    powerSaving: 92,
    riskCount: 7,
    missionRate: 72,
    trend: 1.9,
    accent: 'amber',
  },
]

export const EMPTY_WORK_ZONE = {
  id: 'work-zone-empty',
  siteId: 'mokdong',
  name: '작업지시 연동 대기',
  type: '금일 작업지시서의 작업위치가 연결되면 자동 표시됩니다.',
  score: 62.0,
  level: 3,
  rank: 1,
  carbon: 0,
  powerSaving: 0,
  risk: 0,
  missionRate: 62,
  lead: 0,
  status: '대기',
  equipmentCount: 0,
  highRiskEquipmentCount: 0,
  equipmentSummary: '작업지시서 장비 데이터 없음',
  gateSummary: '',
  zoneType: 'empty',
  isEmpty: true,
}

const HIGH_RISK_EQUIPMENT_KEYWORDS = [
  '타워크레인',
  '크레인',
  '리프트',
  '굴착기',
  '펌프카',
  '덤프트럭',
  '고소작업대',
]

export function buildDashboardZones(equipments, context = {}) {
  const supportZones = buildSupportZones(equipments, context)
  const workZones = buildWorkLocationZones(equipments, context)
  return rankZones([...supportZones, ...workZones])
}

export function buildStaticMonitoringZones(equipments, context = {}) {
  return buildSupportZones(equipments, context)
}

export function buildSupportZones(equipments, context = {}) {
  const equipmentList = Array.isArray(equipments) ? equipments : []
  const missionRate = Number.isFinite(context.missionRate) ? context.missionRate : 62
  const weatherRiskCount = Number.isFinite(context.weatherRiskCount) ? context.weatherRiskCount : 0
  const analysis = context.weatherAnalysis ?? {}
  const airQuality = context.airQuality ?? {}

  const totalEquipmentCount = equipmentList.reduce((sum, equipment) => {
    return sum + normalizeCount(equipment.equipmentCount)
  }, 0)

  const highRiskEquipmentCount = equipmentList.reduce((sum, equipment) => {
    if (!isHighRiskEquipment(equipment.equipmentName)) return sum
    return sum + normalizeCount(equipment.equipmentCount)
  }, 0)

  const workLocationCount = new Set(
    equipmentList
      .map((equipment) => firstNonBlank(equipment.workLocation))
      .filter(Boolean),
  ).size

  const gateCount = new Set(
    equipmentList
      .map((equipment) => equipment.gateIdx)
      .filter((gateIdx) => gateIdx !== null && gateIdx !== undefined),
  ).size

  const rain = Number(analysis.precipitationProbability ?? 0)
  const wind = Number(analysis.maxWindSpeed ?? 0)
  const fineDust = Number(airQuality.value ?? analysis.fineDustValue ?? 0)

  const washRisk = Math.min(
    10,
    Math.round(
      totalEquipmentCount * 0.8
        + weatherRiskCount * 0.5
        + (rain >= 60 ? 1 : 0)
        + (fineDust >= 80 ? 1 : 0),
    ),
  )

  const complaintRisk = Math.min(
    10,
    Math.round(
      highRiskEquipmentCount * 1.2
        + workLocationCount
        + weatherRiskCount * 0.4
        + (fineDust >= 80 ? 2 : 0)
        + (wind >= 8 ? 1 : 0),
    ),
  )

  const washScore = clampScore(87 - washRisk * 2.2 + missionRate * 0.04)
  const complaintScore = clampScore(84 - complaintRisk * 2.8 + missionRate * 0.05)

  return [
    {
      id: 'wash-zone',
      siteId: 'mokdong',
      name: '세척장',
      type: '장비 세척·오염수·전력 피크 관리',
      score: washScore,
      level: resolveLevel(washScore),
      rank: 0,
      carbon: Math.max(0, Math.round(totalEquipmentCount * 1.8 + highRiskEquipmentCount * 1.1)),
      powerSaving: Math.max(0, Math.round(68 + gateCount * 4 - washRisk * 2)),
      risk: washRisk,
      missionRate,
      lead: 0,
      status: resolveStatus(washRisk),
      equipmentCount: totalEquipmentCount,
      highRiskEquipmentCount,
      equipmentSummary: totalEquipmentCount
        ? `금일 입차 장비 ${totalEquipmentCount}대 세척 대상`
        : '금일 입차 장비 연동 대기',
      gateSummary: gateCount
        ? `${gateCount}개 게이트 입차 기준`
        : '게이트 장비 연동 대기',
      zoneType: 'support',
    },
    {
      id: 'complaint-zone',
      siteId: 'mokdong',
      name: '민원 구역',
      type: '소음·분진·장비 동선 민원 대응',
      score: complaintScore,
      level: resolveLevel(complaintScore),
      rank: 0,
      carbon: Math.max(0, Math.round(highRiskEquipmentCount * 2.4 + workLocationCount * 1.2)),
      powerSaving: Math.max(0, Math.round(44 + workLocationCount * 5 - complaintRisk * 1.5)),
      risk: complaintRisk,
      missionRate,
      lead: 0,
      status: resolveStatus(complaintRisk),
      equipmentCount: totalEquipmentCount,
      highRiskEquipmentCount,
      equipmentSummary: totalEquipmentCount
        ? `작업구역 ${workLocationCount || 1}곳 · 장비 ${totalEquipmentCount}대 영향권`
        : '금일 작업지시 장비 영향권 연동 대기',
      gateSummary: fineDust
        ? `PM10 ${fineDust}㎍/㎥ 기준`
        : '미세먼지 API 연동 기준',
      zoneType: 'support',
    },
  ]
}

export function buildWorkLocationZones(equipments, context = {}) {
  if (!Array.isArray(equipments) || equipments.length === 0) return []

  const missionRate = Number.isFinite(context.missionRate) ? context.missionRate : 62
  const weatherRiskCount = Number.isFinite(context.weatherRiskCount) ? context.weatherRiskCount : 0
  const grouped = new Map()

  equipments.forEach((equipment) => {
    const zoneName = firstNonBlank(equipment.workLocation, '작업구역 미지정')
    const current = grouped.get(zoneName) || {
      name: zoneName,
      titles: new Set(),
      workDetails: new Set(),
      equipments: new Map(),
      totalCount: 0,
      gateSet: new Set(),
      highRiskEquipmentCount: 0,
    }

    if (equipment.title) current.titles.add(equipment.title)
    if (equipment.workDetail) current.workDetails.add(equipment.workDetail)
    if (equipment.gateIdx !== null && equipment.gateIdx !== undefined) {
      current.gateSet.add(equipment.gateIdx)
    }

    const equipmentName = firstNonBlank(equipment.equipmentName, '중장비')
    const equipmentCount = normalizeCount(equipment.equipmentCount)

    current.equipments.set(
      equipmentName,
      (current.equipments.get(equipmentName) || 0) + equipmentCount,
    )
    current.totalCount += equipmentCount

    if (isHighRiskEquipment(equipmentName)) {
      current.highRiskEquipmentCount += equipmentCount
    }

    grouped.set(zoneName, current)
  })

  return Array.from(grouped.values()).map((zone, index) => {
    const equipmentSummary = Array.from(zone.equipments.entries())
      .map(([name, count]) => `${name} ${count}대`)
      .join(', ')

    const gateSummary = Array.from(zone.gateSet)
      .sort((a, b) => Number(a) - Number(b))
      .map((gateIdx) => `${gateIdx}번 게이트`)
      .join(', ')

    const titleSummary = Array.from(zone.titles).slice(0, 2).join(' · ')
    const detailSummary = Array.from(zone.workDetails).slice(0, 1).join('')
    const risk = Math.min(
      10,
      weatherRiskCount + Math.max(0, zone.totalCount - 1) + zone.highRiskEquipmentCount,
    )
    const score = clampScore(84 - risk * 3.1 + missionRate * 0.08 - zone.totalCount * 0.55)
    const powerSaving = Math.max(0, Math.round(zone.totalCount * 7 - risk * 1.6))
    const carbon = Math.max(0, Math.round(zone.totalCount * 2.8 + zone.highRiskEquipmentCount * 1.5))

    return {
      id: `work-zone-${index + 1}`,
      siteId: 'mokdong',
      name: zone.name,
      type: titleSummary || detailSummary || equipmentSummary || '작업지시서 연동 구역',
      score,
      level: resolveLevel(score),
      rank: 0,
      carbon,
      powerSaving,
      risk,
      missionRate,
      lead: 0,
      status: resolveStatus(risk),
      equipmentCount: zone.totalCount,
      highRiskEquipmentCount: zone.highRiskEquipmentCount,
      equipmentSummary,
      gateSummary,
      zoneType: 'work',
    }
  })
}

export function calculateOperatingRiskCount(equipments, weatherRiskCount = 0) {
  if (!Array.isArray(equipments) || equipments.length === 0) return weatherRiskCount

  const highRiskCount = equipments.reduce((sum, equipment) => {
    if (!isHighRiskEquipment(equipment.equipmentName)) return sum
    return sum + normalizeCount(equipment.equipmentCount)
  }, 0)

  return weatherRiskCount + highRiskCount
}

export function buildRankingItems(sites, currentSiteId) {
  const items = [...sites].sort((a, b) => b.score - a.score)
  const currentIndex = items.findIndex((site) => site.id === currentSiteId)
  const currentRank = currentIndex + 1
  const currentSite = items[currentIndex]

  if (!currentSite || currentIndex < 0) {
    return {
      items,
      currentRank: 0,
      comparison: '순위 계산 중입니다.',
    }
  }

  if (currentIndex === 0) {
    const nextSite = items[1]
    const comparison = nextSite
      ? `${nextSite.name}보다 ${(currentSite.score - nextSite.score).toFixed(1)}점 앞섬`
      : '단독 1위입니다.'

    return { items, currentRank, comparison }
  }

  const upperSite = items[currentIndex - 1]

  return {
    items,
    currentRank,
    comparison: `${upperSite.name}까지 ${(upperSite.score - currentSite.score).toFixed(1)}점 부족`,
  }
}

export function getZoneGrowthTitle(zone) {
  return `${zone?.name ?? '관리구역'}의 ESG 빌딩 성장`
}

export function getGrowthTitle(zone) {
  return getZoneGrowthTitle(zone)
}

export function getZoneStage(zone) {
  if (!zone) {
    return {
      title: '단계 분석 대기',
      label: '단계 분석 대기',
      description: '관리구역 데이터를 불러오면 시공단계를 표시합니다.',
      guide: '관리구역 연동 후 단계별 개선 포인트를 확인할 수 있습니다.',
      progress: 0,
    }
  }

  if (zone.name === '세척장') {
    const title = zone.level >= 5 ? '세척 운영 안정화 단계' : '세척 운영 정비 단계'

    return {
      title,
      label: title,
      description: '장비 세척 동선, 오염수 회수, 전력 피크를 중점 관리합니다.',
      guide: '세척장 대기 동선을 분리하고 오염수 회수 상태를 꾸준히 기록하면 다음 레벨에 가까워집니다.',
      progress: Math.min(100, zone.level * 14),
    }
  }

  if (zone.name === '민원 구역') {
    const title = zone.level >= 5 ? '민원 대응 안정 관리 단계' : '민원 대응 집중 관리 단계'

    return {
      title,
      label: title,
      description: '소음·분진·장비 동선 민원 대응 수준을 단계별로 관리합니다.',
      guide: '살수, 방진막, 장비 통행 시간을 함께 관리하면 민원 리스크가 줄어듭니다.',
      progress: Math.min(100, zone.level * 14),
    }
  }

  if (zone.level >= 6) {
    return {
      title: '시공 안정 운영 단계',
      label: '시공 안정 운영 단계',
      description: '공정과 장비가 안정적으로 운영되는 상위 수준입니다.',
      guide: '현재 장비 동선과 작업 기록률을 유지하면 ESG 점수 하락을 방지할 수 있습니다.',
      progress: 92,
    }
  }

  if (zone.level >= 4) {
    return {
      title: '시공 관리 강화 단계',
      label: '시공 관리 강화 단계',
      description: '장비 동선과 공정 품질을 동시에 관리하는 핵심 구간입니다.',
      guide: '작업구역별 위험 조치 결과를 작업일보와 함께 남기면 다음 레벨로 올라가기 쉽습니다.',
      progress: 74,
    }
  }

  return {
    title: '시공 준비·관리 단계',
    label: '시공 준비·관리 단계',
    description: '초기 공정 준비 및 안전 기준 정착이 필요한 단계입니다.',
    guide: '장비 배치, 작업지시, 기상 위험 조치 기록을 먼저 안정화해야 합니다.',
    progress: 52,
  }
}

export function getConstructionStage(zone) {
  return getZoneStage(zone)
}

export function getZoneFocusMetric(zone, context = {}) {
  const weather = context.weatherAnalysis ?? {}
  const airQuality = context.airQuality ?? {}
  const rain = Number(weather.precipitationProbability ?? 0)
  const wind = Number(weather.maxWindSpeed ?? 0)
  const fineDust = Number(airQuality.value ?? weather.fineDustValue ?? 0)

  if (!zone) {
    return {
      title: '중점 관리',
      value: '확인 중',
      unit: '',
      caption: '관리구역 데이터를 불러오는 중입니다.',
    }
  }

  if (zone.name === '세척장') {
    return {
      title: '세척 관리',
      value: zone.equipmentCount ? `${zone.equipmentCount}` : '0',
      unit: '대',
      caption: rain >= 60
        ? '우천 기준 세척 대기·오염수 회수 점검'
        : '세척 대기 동선·전력 피크 분산 관리',
    }
  }

  if (zone.name === '민원 구역') {
    return {
      title: '민원 관리',
      value: fineDust >= 80 || wind >= 8 ? '강화' : '점검',
      unit: '',
      caption: wind >= 8
        ? '강풍 기준 비산먼지·소음 확산 통제'
        : '장비 동선·살수·안내 표지 점검',
    }
  }

  return {
    title: '장비 관리',
    value: zone.highRiskEquipmentCount
      ? `${zone.highRiskEquipmentCount}`
      : `${zone.equipmentCount ?? 0}`,
    unit: '대',
    caption: zone.gateSummary
      ? `${zone.gateSummary} 기준 동선 점검`
      : '작업구역 장비 배치 점검',
  }
}

export function getPriorityFocus(zone, context = {}) {
  const metric = getZoneFocusMetric(zone, context)

  return {
    title: metric.title,
    value: `${metric.value}${metric.unit ?? ''}`,
    description: metric.caption,
  }
}

export function buildZoneMissions(zone, currentSite = {}) {
  const siteName = currentSite.shortName || currentSite.name || '현장'

  if (!zone) {
    return [
      {
        id: 'mission-empty',
        title: '관리구역 연동 대기',
        description: '관리구역 데이터가 들어오면 ESG 미션을 표시합니다.',
        tag: '대기',
        progress: 0,
      },
    ]
  }

  if (zone.name === '세척장') {
    return [
      {
        id: 'wash-water',
        title: '오염수 회수 점검',
        description: '세척수 유출 여부와 회수통 상태를 교대별로 확인합니다.',
        tag: 'E',
        progress: clampPercent(zone.score),
      },
      {
        id: 'wash-flow',
        title: '세척 대기 분산',
        description: '입차 장비를 게이트별로 분산해 세척 대기 혼잡을 줄입니다.',
        tag: 'S',
        progress: clampPercent(zone.missionRate),
      },
      {
        id: 'wash-power',
        title: '전력 피크 관리',
        description: '세척 설비 동시 가동 시간을 분산해 전력 사용량을 안정화합니다.',
        tag: 'G',
        progress: clampPercent(100 - zone.risk * 7),
      },
    ]
  }

  if (zone.name === '민원 구역') {
    return [
      {
        id: 'complaint-guide',
        title: '민원 안내 강화',
        description: '민원 가능 시간대에 안내 표지와 담당자 응대 체계를 점검합니다.',
        tag: 'S',
        progress: clampPercent(zone.missionRate),
      },
      {
        id: 'dust-control',
        title: '분진 저감 운영',
        description: '살수, 방진막, 청소 주기를 조정해 분진 민원을 줄입니다.',
        tag: 'E',
        progress: clampPercent(zone.score),
      },
      {
        id: 'route-control',
        title: '장비 동선 통제',
        description: '중장비 이동 경로를 정리하고 민감 구역 통행 시간을 분산합니다.',
        tag: 'G',
        progress: clampPercent(100 - zone.risk * 7),
      },
    ]
  }

  return [
    {
      id: 'work-route',
      title: `${zone.name} 장비 동선 점검`,
      description: zone.gateSummary
        ? `${zone.gateSummary} 기준으로 장비 충돌 위험을 사전 점검합니다.`
        : `${siteName} 작업구역의 장비 이동 동선을 사전 점검합니다.`,
      tag: 'S',
      progress: clampPercent(zone.missionRate),
    },
    {
      id: 'work-quality',
      title: `${zone.name} 공정 품질 유지`,
      description: '작업 품질, 자재 정리, 기상 영향 가능성을 함께 확인합니다.',
      tag: 'E',
      progress: clampPercent(zone.score),
    },
    {
      id: 'work-record',
      title: `${zone.name} 위험 조치 기록`,
      description: 'AI 위험 추천 조치 결과를 작업일보와 함께 남깁니다.',
      tag: 'G',
      progress: clampPercent(100 - zone.risk * 7),
    },
  ]
}

export function getZoneMissionBundle(zone, context = {}) {
  const missions = buildZoneMissions(zone, context.currentSite ?? {})

  return {
    weeklyMission: missions[0]?.description ?? '관리구역 데이터를 불러오면 ESG 미션을 표시합니다.',
    cards: missions.map((mission) => ({
      title: mission.title,
      badge: mission.tag,
      description: mission.description,
    })),
  }
}

export function resolveLevel(score) {
  const normalizedScore = Number(score) || 0
  let level = 1

  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (normalizedScore >= LEVEL_THRESHOLDS[index]) {
      level = index + 1
    }
  }

  return Math.max(1, Math.min(7, level))
}

export function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0) * 10) / 10))
}

function rankZones(zones) {
  const rankedZones = [...zones].sort((a, b) => b.score - a.score)

  rankedZones.forEach((zone, index) => {
    zone.rank = index + 1
    zone.lead = index === 0 ? 0 : Math.round((zone.score - rankedZones[0].score) * 10) / 10
  })

  return rankedZones
}

function resolveStatus(risk) {
  if (risk >= 7) return '위험'
  if (risk >= 4) return '관리'
  return '우수'
}

function firstNonBlank(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

function normalizeCount(value) {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? count : 1
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))))
}

function isHighRiskEquipment(equipmentName = '') {
  return HIGH_RISK_EQUIPMENT_KEYWORDS.some((keyword) => equipmentName.includes(keyword))
}