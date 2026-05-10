export const LEVEL_THRESHOLDS = [0, 30, 50, 65, 78, 88, 95, 100]

const HIGH_RISK_EQUIPMENT_KEYWORDS = [
  '타워크레인',
  '크레인',
  '리프트',
  '펌프카',
  '덤프트럭',
  '고소작업대',
  '고소작업차',
  '굴착기',
]

const WASH_TARGET_EQUIPMENT_KEYWORDS = [
  '덤프트럭',
  '굴착기',
  '펌프카',
  '콘크리트펌프카',
  '카고트럭',
  '지게차',
  '로더',
]

const DUST_WORK_KEYWORDS = [
  '굴착',
  '토사',
  '반출',
  '절단',
  '연마',
  '외부',
  '마감',
  '도장',
]

const EQUIPMENT_CARBON_FACTORS = [
  { keywords: ['콘크리트펌프카', '펌프카'], factor: 2.2 },
  { keywords: ['굴착기'], factor: 2.0 },
  { keywords: ['덤프트럭'], factor: 2.0 },
  { keywords: ['타워크레인', '크레인'], factor: 1.7 },
  { keywords: ['카고트럭'], factor: 1.6 },
  { keywords: ['고소작업차', '고소작업대', '리프트'], factor: 1.5 },
  { keywords: ['지게차'], factor: 1.2 },
]

export function buildDashboardZones(equipments, context = {}) {
  const supportZones = buildSupportZones(equipments, context)
  const workZones = buildWorkLocationZones(equipments, context)
  return rankZones([...supportZones, ...workZones])
}

export function buildStaticMonitoringZones(equipments, context = {}) {
  return buildSupportZones(equipments, context)
}

function resolveContextSiteId(context = {}) {
  const siteId = context.currentProjectId ?? context.projectId ?? context.siteId
  return siteId !== null && siteId !== undefined && siteId !== '' ? String(siteId) : 'current-site'
}

export function buildSupportZones(equipments, context = {}) {
  const equipmentList = Array.isArray(equipments) ? equipments : []
  const sharedMetrics = buildEsgMetrics(equipmentList, context)
  const totalEquipmentCount = sharedMetrics.totalEquipmentCount
  const highRiskEquipmentCount = sharedMetrics.highRiskEquipmentCount
  const workLocationCount = sharedMetrics.workLocationCount
  const gateCount = sharedMetrics.gateCount
  const missionRate = sharedMetrics.missionRate

  const washRisk = clampNumber(
    Math.round(
      sharedMetrics.washTargetCount * 1.1
        + sharedMetrics.wastewaterRisk * 0.7
        + sharedMetrics.powerPeakRisk * 0.45
        + sharedMetrics.weatherRiskCount * 0.45,
    ),
    0,
    10,
  )
  const complaintRisk = clampNumber(
    Math.round(
      highRiskEquipmentCount * 1.1
        + workLocationCount
        + sharedMetrics.fineDustRiskLevel * 1.5
        + (sharedMetrics.windSpeed >= 8 ? 1 : 0)
        + sharedMetrics.weatherRiskCount * 0.4,
    ),
    0,
    10,
  )

  const washMetrics = {
    ...sharedMetrics,
    environmentScore: clampScore(sharedMetrics.environmentScore - washRisk * 0.7 + sharedMetrics.waterScore * 0.12),
    socialScore: clampScore(sharedMetrics.socialScore - washRisk * 0.35),
    governanceScore: clampScore(sharedMetrics.governanceScore - Math.max(0, washRisk - 4) * 0.9),
    operatingRisk: washRisk,
  }
  washMetrics.totalScore = buildTotalScore(washMetrics)

  const complaintMetrics = {
    ...sharedMetrics,
    environmentScore: clampScore(sharedMetrics.environmentScore - sharedMetrics.fineDustRiskLevel * 1.8),
    socialScore: clampScore(sharedMetrics.socialScore - complaintRisk * 0.75),
    governanceScore: clampScore(sharedMetrics.governanceScore - Math.max(0, complaintRisk - 3) * 0.8),
    operatingRisk: complaintRisk,
  }
  complaintMetrics.totalScore = buildTotalScore(complaintMetrics)

  return [
    {
      id: 'wash-zone',
      siteId: resolveContextSiteId(context),
      name: '세척장',
      type: '장비 세척·오염수·전력 피크 관리',
      score: washMetrics.totalScore,
      level: resolveLevel(washMetrics.totalScore),
      rank: 0,
      carbon: washMetrics.estimatedCarbonKg,
      powerSaving: washMetrics.powerSavingKwh,
      risk: washRisk,
      missionRate,
      lead: 0,
      status: resolveStatus(washRisk),
      equipmentCount: totalEquipmentCount,
      highRiskEquipmentCount,
      equipmentSummary: totalEquipmentCount
        ? `금일 입차 장비 ${totalEquipmentCount}대 · 세척 대상 ${washMetrics.washTargetCount}대`
        : '금일 입차 장비 연동 대기',
      gateSummary: gateCount ? `${gateCount}개 게이트 입차 기준` : '게이트 장비 연동 대기',
      zoneType: 'support',
      metrics: washMetrics,
    },
    {
      id: 'complaint-zone',
      siteId: resolveContextSiteId(context),
      name: '민원 구역',
      type: '소음·분진·장비 동선 민원 대응',
      score: complaintMetrics.totalScore,
      level: resolveLevel(complaintMetrics.totalScore),
      rank: 0,
      carbon: complaintMetrics.estimatedCarbonKg,
      powerSaving: complaintMetrics.powerSavingKwh,
      risk: complaintRisk,
      missionRate,
      lead: 0,
      status: resolveStatus(complaintRisk),
      equipmentCount: totalEquipmentCount,
      highRiskEquipmentCount,
      equipmentSummary: totalEquipmentCount
        ? `작업구역 ${workLocationCount || 1}곳 · 장비 ${totalEquipmentCount}대 영향권`
        : '금일 작업지시 장비 영향권 연동 대기',
      gateSummary: complaintMetrics.fineDustValue
        ? `PM10 ${complaintMetrics.fineDustValue}㎍/㎥ 기준`
        : '미세먼지 API 연동 기준',
      zoneType: 'support',
      metrics: complaintMetrics,
    },
  ]
}

export function buildWorkLocationZones(equipments, context = {}) {
  if (!Array.isArray(equipments) || equipments.length === 0) return []

  const grouped = new Map()

  equipments.forEach((equipment) => {
    const zoneName = firstNonBlank(equipment.workLocation, '작업구역 미지정')
    const current = grouped.get(zoneName) || {
      name: zoneName,
      titles: new Set(),
      workDetails: new Set(),
      equipments: new Map(),
      equipmentList: [],
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
    current.equipmentList.push(equipment)

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
    const metrics = buildEsgMetrics(zone.equipmentList, { ...context, zoneName: zone.name })
    const risk = clampNumber(
      Math.round(
        metrics.weatherRiskCount
          + Math.max(0, zone.totalCount - 1)
          + zone.highRiskEquipmentCount
          + metrics.fineDustRiskLevel * 0.7
          + metrics.wastewaterRisk * 0.25,
      ),
      0,
      10,
    )
    const zoneMetrics = {
      ...metrics,
      operatingRisk: risk,
      socialScore: clampScore(metrics.socialScore - risk * 0.35),
      governanceScore: clampScore(metrics.governanceScore - Math.max(0, risk - 3) * 0.7),
    }
    zoneMetrics.totalScore = buildTotalScore(zoneMetrics)

    return {
      id: `work-zone-${index + 1}`,
      siteId: resolveContextSiteId(context),
      name: zone.name,
      type: titleSummary || detailSummary || equipmentSummary || '작업지시서 연동 구역',
      score: zoneMetrics.totalScore,
      level: resolveLevel(zoneMetrics.totalScore),
      rank: 0,
      carbon: zoneMetrics.estimatedCarbonKg,
      powerSaving: zoneMetrics.powerSavingKwh,
      risk,
      missionRate: zoneMetrics.missionRate,
      lead: 0,
      status: resolveStatus(risk),
      equipmentCount: zone.totalCount,
      highRiskEquipmentCount: zone.highRiskEquipmentCount,
      equipmentSummary,
      gateSummary,
      zoneType: 'work',
      metrics: zoneMetrics,
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
  const metrics = zone?.metrics ?? createEmptyMetrics()
  const weather = context.weatherAnalysis ?? {}
  const airQuality = context.airQuality ?? {}
  const rain = Number(weather.precipitationProbability ?? metrics.rainPercent ?? 0)
  const wind = Number(weather.maxWindSpeed ?? metrics.windSpeed ?? 0)
  const fineDust = Number(airQuality.value ?? weather.fineDustValue ?? metrics.fineDustValue ?? 0)

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
      title: '세척수 관리',
      value: metrics.estimatedWashWaterLiters ? `${metrics.estimatedWashWaterLiters}` : '0',
      unit: 'L',
      caption: rain >= 60
        ? '우천 기준 오염수 유출 방지와 회수 상태를 우선 점검합니다.'
        : '세척 대상 장비와 전력 피크를 함께 관리합니다.',
    }
  }

  if (zone.name === '민원 구역') {
    return {
      title: '민원 리스크',
      value: fineDust >= 80 || wind >= 8 ? '강화' : '점검',
      unit: '',
      caption: wind >= 8
        ? '강풍 기준 비산먼지·소음 확산 통제 필요'
        : '장비 동선·살수·안내 표지 점검',
    }
  }

  return {
    title: '탄소 부하',
    value: `${metrics.carbonLoadIndex}`,
    unit: 'pt',
    caption: zone.gateSummary
      ? `${zone.gateSummary} 기준 장비 공회전·동선 관리`
      : '작업구역 장비 배치 기준 탄소 영향 추정',
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
  const metrics = zone?.metrics ?? createEmptyMetrics()

  if (!zone) {
    return [
      {
        id: 'mission-empty',
        title: '관리구역 연동 대기',
        description: '관리구역 데이터가 들어오면 ESG 미션을 표시합니다.',
        tag: '대기',
        progress: 0,
        color: 'emerald',
      },
    ]
  }

  if (zone.name === '세척장') {
    return [
      {
        id: 'wash-water',
        title: '세척수·오염수 회수 점검',
        description: `${metrics.washTargetCount}대 세척 대상 기준으로 오염수 회수통과 배수 유출 여부를 확인합니다.`,
        tag: 'E',
        progress: clampPercent(metrics.waterScore),
        color: 'emerald',
      },
      {
        id: 'wash-flow',
        title: '세척 대기·장비 동선 분산',
        description: '입차 장비를 게이트별로 분산해 세척 대기 혼잡과 작업자 접근 위험을 줄입니다.',
        tag: 'S',
        progress: clampPercent(metrics.socialScore),
        color: 'sky',
      },
      {
        id: 'wash-power',
        title: '세척장 점검 이력 기록',
        description: '세척 설비 가동, 오염수 회수, 전력 피크 관리 내용을 작업일보에 남깁니다.',
        tag: 'G',
        progress: clampPercent(metrics.governanceScore),
        color: 'violet',
      },
    ]
  }

  if (zone.name === '민원 구역') {
    return [
      {
        id: 'dust-control',
        title: '분진·살수 관리',
        description: `PM10 ${metrics.fineDustValue || 0}㎍/㎥ 기준으로 살수, 방진막, 청소 주기를 조정합니다.`,
        tag: 'E',
        progress: clampPercent(metrics.fineDustScore),
        color: 'emerald',
      },
      {
        id: 'complaint-guide',
        title: '민원 안내·작업 동선 관리',
        description: '민원 가능 시간대에 안내 표지와 장비 통행 시간을 함께 관리합니다.',
        tag: 'S',
        progress: clampPercent(metrics.socialScore),
        color: 'sky',
      },
      {
        id: 'complaint-record',
        title: '민원 대응 이력 기록',
        description: '분진·소음 저감 조치와 민원 대응 내용을 작업일보에 기록합니다.',
        tag: 'G',
        progress: clampPercent(metrics.governanceScore),
        color: 'violet',
      },
    ]
  }

  return [
    {
      id: 'work-environment',
      title: `${zone.name} 환경 영향 관리`,
      description: `${zone.equipmentSummary || '작업 장비'} 기준으로 탄소 부하, 분진, 세척 필요도를 점검합니다.`,
      tag: 'E',
      progress: clampPercent(metrics.environmentScore),
      color: 'emerald',
    },
    {
      id: 'work-safety',
      title: `${zone.name} 안전교육·보호구 확인`,
      description: zone.gateSummary
        ? `${zone.gateSummary} 투입 전 안전교육 이수와 보호구 착용 상태를 확인합니다.`
        : `${siteName} 작업구역의 작업자 안전교육과 보호구 상태를 확인합니다.`,
      tag: 'S',
      progress: clampPercent(metrics.socialScore),
      color: 'sky',
    },
    {
      id: 'work-record',
      title: `${zone.name} 작업일보·위험 조치 기록`,
      description: '작업지시, 기상 위험, 장비 투입 결과를 작업일보와 함께 남깁니다.',
      tag: 'G',
      progress: clampPercent(metrics.governanceScore),
      color: 'violet',
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

function buildEsgMetrics(equipments, context = {}) {
  const equipmentList = Array.isArray(equipments) ? equipments : []
  const analysis = context.weatherAnalysis ?? {}
  const airQuality = context.airQuality ?? {}
  const missionRate = Number.isFinite(context.missionRate) ? Number(context.missionRate) : 0
  const weatherRiskCount = Number.isFinite(context.weatherRiskCount) ? Number(context.weatherRiskCount) : 0
  const reportRate = Number.isFinite(context.reportRate) ? Number(context.reportRate) : null
  const actionTrackingRate = Number.isFinite(context.actionTrackingRate) ? Number(context.actionTrackingRate) : null
  const dataLinkRate = Number.isFinite(context.dataLinkRate) ? Number(context.dataLinkRate) : null
  const safetyDays = Number.isFinite(context.safetyDays) ? Number(context.safetyDays) : 1
  const workerMetrics = buildWorkerMetrics(context.workers, context.staffingWorkers, context.zoneName)

  const totalEquipmentCount = equipmentList.reduce((sum, equipment) => {
    return sum + normalizeCount(equipment.equipmentCount)
  }, 0)
  const highRiskEquipmentCount = equipmentList.reduce((sum, equipment) => {
    if (!isHighRiskEquipment(equipment.equipmentName)) return sum
    return sum + normalizeCount(equipment.equipmentCount)
  }, 0)
  const washTargetCount = equipmentList.reduce((sum, equipment) => {
    if (!isWashTargetEquipment(equipment.equipmentName)) return sum
    return sum + normalizeCount(equipment.equipmentCount)
  }, 0)
  const carbonLoadIndex = roundOne(equipmentList.reduce((sum, equipment) => {
    return sum + getEquipmentCarbonFactor(equipment.equipmentName) * normalizeCount(equipment.equipmentCount)
  }, 0))
  const workLocationCount = new Set(
    equipmentList.map((equipment) => firstNonBlank(equipment.workLocation)).filter(Boolean),
  ).size
  const gateCount = new Set(
    equipmentList
      .map((equipment) => equipment.gateIdx)
      .filter((gateIdx) => gateIdx !== null && gateIdx !== undefined),
  ).size
  const dustWorkCount = equipmentList.reduce((sum, equipment) => {
    const mergedText = `${equipment.workDetail ?? ''} ${equipment.title ?? ''} ${equipment.equipmentName ?? ''}`
    if (!containsAny(mergedText, DUST_WORK_KEYWORDS)) return sum
    return sum + normalizeCount(equipment.equipmentCount)
  }, 0)

  const rainPercent = Number(analysis.precipitationProbability ?? 0)
  const windSpeed = Number(analysis.maxWindSpeed ?? 0)
  const fineDustValue = Number(airQuality.value ?? analysis.fineDustValue ?? 0)
  const weatherFactor = 1
    + (fineDustValue >= 80 ? 0.2 : 0)
    + (rainPercent >= 60 ? 0.2 : 0)
  const estimatedWashWaterLiters = Number.isFinite(Number(context.actualWashWaterLiters))
    ? Math.round(Number(context.actualWashWaterLiters))
    : Math.round(washTargetCount * 120 * weatherFactor)
  const wastewaterRisk = clampNumber(
    Math.round(washTargetCount * 0.9 + (rainPercent >= 60 ? 2 : 0) + (fineDustValue >= 80 ? 1 : 0)),
    0,
    10,
  )
  const fineDustRiskLevel = fineDustValue >= 151 ? 4 : fineDustValue >= 81 ? 3 : fineDustValue >= 31 ? 1 : 0
  const powerPeakRisk = clampNumber(
    Math.round(
      gateCount * 0.8
        + Math.max(0, totalEquipmentCount - 4) * 0.6
        + (rainPercent >= 60 || fineDustValue >= 80 ? 1 : 0)
        + washTargetCount * 0.25,
    ),
    0,
    10,
  )
  const estimatedCarbonKg = Number.isFinite(Number(context.actualCarbonKg))
    ? Math.max(0, Math.round(Number(context.actualCarbonKg)))
    : Math.max(0, Math.round(carbonLoadIndex * 6.8 + highRiskEquipmentCount * 2.5))
  const powerSavingKwh = Number.isFinite(Number(context.actualPowerSavingKwh))
    ? Math.max(0, Math.round(Number(context.actualPowerSavingKwh)))
    : (totalEquipmentCount > 0 ? Math.max(0, Math.round(42 + gateCount * 7 + Math.max(0, 10 - powerPeakRisk) * 3)) : 0)

  const carbonScore = clampScore(100 - Math.min(40, carbonLoadIndex * 4))
  const waterScore = clampScore(100 - Math.min(35, wastewaterRisk * 3.5))
  const fineDustScore = clampScore(100 - fineDustRiskLevel * 12 - dustWorkCount * 2)
  const powerScore = clampScore(100 - Math.min(25, powerPeakRisk * 2.5))
  const environmentScore = clampScore(
    carbonScore * 0.35
      + waterScore * 0.25
      + fineDustScore * 0.25
      + powerScore * 0.15,
  )

  const staffingRate = workerMetrics.staffingRate ?? (totalEquipmentCount > 0 ? missionRate : 0)
  const safetyEducationRate = workerMetrics.safetyEducationRate ?? (totalEquipmentCount > 0 ? missionRate : 0)
  const weatherProtectionScore = clampScore(100 - weatherRiskCount * 6 - fineDustRiskLevel * 4 - (windSpeed >= 8 ? 6 : 0))
  const routeSafetyScore = clampScore(100 - Math.min(35, highRiskEquipmentCount * 4 + gateCount * 1.5))
  const socialScore = clampScore(
    safetyEducationRate * 0.4
      + staffingRate * 0.3
      + weatherProtectionScore * 0.2
      + routeSafetyScore * 0.1,
  )

  const reportMetrics = buildReportMetrics(context.reports, equipmentList, weatherRiskCount)
  const resolvedReportRate = reportRate ?? reportMetrics.reportRate
  const resolvedActionTrackingRate = actionTrackingRate ?? reportMetrics.actionTrackingRate
  const resolvedDataLinkRate = dataLinkRate ?? buildDefaultDataLinkRate(context, totalEquipmentCount)
  const missingCheckCount = Math.max(
    0,
    Math.round((100 - resolvedReportRate) / 25) + Math.max(0, weatherRiskCount - 2),
  )
  const governanceScore = clampScore(
    resolvedReportRate * 0.35
      + resolvedActionTrackingRate * 0.3
      + resolvedDataLinkRate * 0.2
      + clampScore(100 - missingCheckCount * 8) * 0.15,
  )

  const metrics = {
    totalEquipmentCount,
    highRiskEquipmentCount,
    washTargetCount,
    workLocationCount,
    gateCount,
    dustWorkCount,
    weatherRiskCount,
    missionRate,
    rainPercent,
    windSpeed,
    fineDustValue,
    fineDustRiskLevel,
    carbonLoadIndex,
    estimatedCarbonKg,
    carbonScore,
    estimatedWashWaterLiters,
    wastewaterRisk,
    waterScore,
    fineDustScore,
    powerPeakRisk,
    powerSavingKwh,
    powerScore,
    staffingRate,
    safetyEducationRate,
    weatherProtectionScore,
    routeSafetyScore,
    reportRate: clampScore(resolvedReportRate),
    actionTrackingRate: clampScore(resolvedActionTrackingRate),
    dataLinkRate: clampScore(resolvedDataLinkRate),
    missingCheckCount,
    safetyDays,
    workerCount: workerMetrics.workerCount,
    assignedWorkerCount: workerMetrics.assignedWorkerCount,
    trainedWorkerCount: workerMetrics.trainedWorkerCount,
    environmentScore,
    socialScore,
    governanceScore,
    operatingRisk: 0,
  }
  metrics.totalScore = buildTotalScore(metrics)

  return metrics
}

function createEmptyMetrics() {
  return {
    totalEquipmentCount: 0,
    highRiskEquipmentCount: 0,
    washTargetCount: 0,
    workLocationCount: 0,
    gateCount: 0,
    dustWorkCount: 0,
    weatherRiskCount: 0,
    missionRate: 0,
    rainPercent: 0,
    windSpeed: 0,
    fineDustValue: 0,
    fineDustRiskLevel: 0,
    carbonLoadIndex: 0,
    estimatedCarbonKg: 0,
    carbonScore: 100,
    estimatedWashWaterLiters: 0,
    wastewaterRisk: 0,
    waterScore: 100,
    fineDustScore: 100,
    powerPeakRisk: 0,
    powerSavingKwh: 0,
    powerScore: 100,
    staffingRate: 0,
    safetyEducationRate: 0,
    weatherProtectionScore: 100,
    routeSafetyScore: 100,
    reportRate: 0,
    actionTrackingRate: 100,
    dataLinkRate: 0,
    missingCheckCount: 0,
    safetyDays: 1,
    workerCount: 0,
    assignedWorkerCount: 0,
    trainedWorkerCount: 0,
    environmentScore: 100,
    socialScore: 0,
    governanceScore: 0,
    totalScore: 0,
    operatingRisk: 0,
  }
}

function buildTotalScore(metrics) {
  return clampScore(
    metrics.environmentScore * 0.4
      + metrics.socialScore * 0.35
      + metrics.governanceScore * 0.25,
  )
}

function buildWorkerMetrics(workers, staffingWorkers, zoneName = '') {
  const workerList = normalizeList(workers)
  const staffingList = normalizeList(staffingWorkers)
  const mergedWorkers = workerList.length ? workerList : staffingList
  const scopedWorkers = filterWorkersByZone(mergedWorkers, zoneName)
  const workerCount = scopedWorkers.length

  if (!workerCount) {
    return {
      workerCount: 0,
      assignedWorkerCount: 0,
      trainedWorkerCount: 0,
      staffingRate: null,
      safetyEducationRate: null,
    }
  }

  const assignedWorkerCount = scopedWorkers.filter(isAssignedWorker).length
  const educationKnown = scopedWorkers.some(hasSafetyEducationSignal)
  const trainedWorkerCount = educationKnown ? scopedWorkers.filter(isSafetyEducationCompleted).length : 0

  return {
    workerCount,
    assignedWorkerCount,
    trainedWorkerCount,
    staffingRate: Math.round((assignedWorkerCount / workerCount) * 100),
    safetyEducationRate: educationKnown ? Math.round((trainedWorkerCount / workerCount) * 100) : null,
  }
}


function buildReportMetrics(reports, equipments, weatherRiskCount) {
  const reportList = normalizeList(reports)
  const equipmentList = normalizeList(equipments)
  const zoneCount = new Set(
    equipmentList.map((equipment) => firstNonBlank(equipment.workLocation)).filter(Boolean),
  ).size
  const expectedReportCount = Math.max(1, zoneCount || (equipmentList.length ? 1 : 0))
  const reportRate = equipmentList.length
    ? Math.min(100, Math.round((reportList.length / expectedReportCount) * 100))
    : reportList.length
      ? 100
      : 60

  if (!weatherRiskCount) {
    return { reportRate, actionTrackingRate: reportList.length ? 100 : 60 }
  }

  const actionKeywords = ['조치', '통제', '점검', '확인', '중지', '순연', '안전', '살수', '방진', '세척', '회수']
  const actionReportCount = reportList.filter((report) => {
    const mergedText = [report.issue, report.todayWork, report.tomorrowPlan, report.action, report.safetyAction]
      .map((value) => String(value || ''))
      .join(' ')
    return containsAny(mergedText, actionKeywords)
  }).length

  return {
    reportRate,
    actionTrackingRate: reportList.length
      ? Math.min(100, Math.round((actionReportCount / reportList.length) * 100))
      : Math.max(35, 100 - weatherRiskCount * 10),
  }
}

function buildDefaultDataLinkRate(context, equipmentCount) {
  const checks = [
    context.weatherAnalysis != null,
    equipmentCount > 0,
    normalizeList(context.reports).length > 0,
    normalizeList(context.workOrders).length > 0,
    normalizeList(context.workers).length > 0 || normalizeList(context.staffingWorkers).length > 0,
  ]
  const linked = checks.filter(Boolean).length
  return Math.round((linked / checks.length) * 100)
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

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

function roundOne(value) {
  return Math.round(Number(value || 0) * 10) / 10
}

function isHighRiskEquipment(equipmentName = '') {
  return HIGH_RISK_EQUIPMENT_KEYWORDS.some((keyword) => equipmentName.includes(keyword))
}

function isWashTargetEquipment(equipmentName = '') {
  return WASH_TARGET_EQUIPMENT_KEYWORDS.some((keyword) => equipmentName.includes(keyword))
}

function getEquipmentCarbonFactor(equipmentName = '') {
  const matched = EQUIPMENT_CARBON_FACTORS.find((item) => {
    return item.keywords.some((keyword) => equipmentName.includes(keyword))
  })
  return matched?.factor ?? 1
}

function containsAny(text = '', keywords = []) {
  return keywords.some((keyword) => String(text).includes(keyword))
}

function normalizeList(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.list)) return value.list
  if (Array.isArray(value?.workers)) return value.workers
  if (Array.isArray(value?.rows)) return value.rows
  return []
}

function isAssignedWorker(worker) {
  const candidates = [
    worker.assigned,
    worker.isAssigned,
    worker.confirmed,
    worker.assignmentConfirmed,
    worker.zoneMain,
    worker.zoneSub,
    worker.zoneName,
    worker.workLocation,
    worker.assignedZone,
    worker.deploymentZone,
    worker.workArea,
  ]

  return candidates.some((value) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value.trim().length > 0 && value !== '미배치'
    return value !== null && value !== undefined
  })
}

function isSafetyEducationCompleted(worker) {
  const candidates = [
    worker.safetyEducationCompleted,
    worker.safetyTrainingCompleted,
    worker.basicSafetyTrainingCompleted,
    worker.isSafetyEducationCompleted,
    worker.educationCompleted,
    worker.safetyEducationStatus,
    worker.educationStatus,
    worker.trainingStatus,
  ]

  return candidates.some((value) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      return ['이수', '완료', 'Y', 'YES', 'true', 'completed', 'COMPLETE'].includes(value.trim())
    }
    return false
  })
}


export function parseProjectDisplayName(rawName = '') {
  const normalized = String(rawName || '').trim()
  const matched = normalized.match(/^\s*\[([^\]]+)]\s*(.*)$/)
  if (!matched) {
    return {
      siteCode: '',
      displayName: normalized || '현장명 미지정',
      shortName: buildShortSiteName(normalized || '현장'),
    }
  }

  const displayName = matched[2]?.trim() || normalized
  return {
    siteCode: matched[1]?.trim() || '',
    displayName,
    shortName: buildShortSiteName(displayName),
  }
}

export function buildProjectSiteItems(projects = [], rankings = [], currentProjectId = null, fallbackSite = null) {
  const rankingMap = new Map(
    normalizeList(rankings).map((item) => [String(item.projectId ?? item.idx ?? item.id), item]),
  )

  const projectItems = normalizeList(projects).map((project, index) => {
    const projectId = project.idx ?? project.projectId ?? project.id
    const ranking = rankingMap.get(String(projectId)) ?? {}
    const parsed = parseProjectDisplayName(project.name ?? ranking.projectName)
    const totalScore = Number(ranking.totalScore ?? ranking.score ?? 0)
    const hasSnapshot = Boolean(ranking.snapshotSaved ?? ranking.hasSnapshot ?? totalScore > 0)

    return {
      id: String(projectId),
      projectId,
      siteCode: parsed.siteCode,
      name: parsed.displayName,
      shortName: parsed.shortName,
      address: project.location ?? ranking.address ?? '',
      contractor: ranking.contractor ?? project.contractor ?? '',
      manager: ranking.manager ?? project.manager ?? '',
      score: clampScore(totalScore),
      level: resolveLevel(totalScore),
      carbon: Math.round(Number(ranking.carbonKg ?? ranking.carbon ?? 0)),
      powerSaving: Math.round(Number(ranking.powerSavingKwh ?? ranking.powerSaving ?? 0)),
      riskCount: Math.round(Number(ranking.riskCount ?? 0)),
      missionRate: Math.round(Number(ranking.missionRate ?? 0)),
      trend: Number(ranking.trend ?? 0),
      accent: ['emerald', 'sky', 'violet', 'amber'][index % 4],
      snapshotSaved: hasSnapshot,
      startDate: project.startDate ?? ranking.startDate ?? null,
      endDate: project.endDate ?? ranking.endDate ?? null,
    }
  })

  if (projectItems.length) return projectItems
  return fallbackSite ? [fallbackSite] : []
}

export function buildSnapshotPayload({ reportDate, currentSite, siteZones, esgBreakdown, safetyDays }) {
  const zones = normalizeList(siteZones)
  const scores = normalizeList(esgBreakdown)
  const findScore = (key) => scores.find((item) => item.key === key)?.score ?? currentSite?.score ?? 0

  return {
    projectId: currentSite?.projectId ?? Number(currentSite?.id),
    reportDate,
    totalScore: clampScore(currentSite?.score ?? 0),
    level: resolveLevel(currentSite?.score ?? 0),
    environmentScore: clampScore(findScore('E')),
    socialScore: clampScore(findScore('S')),
    governanceScore: clampScore(findScore('G')),
    carbonKg: Math.round(zones.reduce((sum, zone) => sum + Number(zone.carbon || 0), 0)),
    powerSavingKwh: Math.round(zones.reduce((sum, zone) => sum + Number(zone.powerSaving || 0), 0)),
    riskCount: Math.round(zones.reduce((sum, zone) => sum + Number(zone.risk || 0), 0)),
    missionRate: zones.length
      ? Math.round(zones.reduce((sum, zone) => sum + Number(zone.missionRate || 0), 0) / zones.length)
      : Math.round(Number(currentSite?.missionRate || 0)),
    zoneCount: zones.length,
    safetyDays: Math.max(1, Math.round(Number(safetyDays || 1))),
    snapshotJson: JSON.stringify({
      site: currentSite,
      zones,
      scores,
    }),
  }
}

export function calculateSafetyDays(project, reportDate) {
  const startDateText = project?.startDate
  if (!startDateText) return 1

  const start = new Date(`${startDateText}T00:00:00`)
  const target = new Date(`${reportDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) return 1
  const diff = Math.floor((target.getTime() - start.getTime()) / 86400000) + 1
  return Math.max(1, diff)
}

export function buildEsgBreakdown(zone, context = {}) {
  const metrics = zone?.metrics ?? createEmptyMetrics()
  const fineDustValue = metrics.fineDustValue || context.airQuality?.value || 0
  const safetyDays = Math.max(1, Number(context.safetyDays || metrics.safetyDays || 1))

  return [
    {
      key: 'E',
      title: 'Environment',
      subtitle: '탄소 · 세척수/오염수 · PM10 · 전력 피크',
      score: metrics.environmentScore,
      color: 'emerald',
      description: '장비 탄소부하, 세척수·오염수, PM10, 전력 피크 위험을 합산한 환경 점수입니다.',
      details: [
        { label: '탄소 부하지수', value: `${metrics.carbonLoadIndex}pt`, caption: '장비 종류와 대수 기반 운영 추정' },
        { label: '세척수 추정', value: `${metrics.estimatedWashWaterLiters}L`, caption: '세척 대상 장비와 우천/미세먼지 조건 반영' },
        { label: 'PM10', value: `${fineDustValue}㎍/㎥`, caption: '분진·살수 관리 기준' },
      ],
      guide: '실제 연료량·전력량·세척수 계측값이 들어오면 해당 값을 우선 사용하고, 없으면 작업지시 운영 데이터로 추정합니다.',
    },
    {
      key: 'S',
      title: 'Social',
      subtitle: '안전교육 · 구역 배치 · 기상 보호 · 민원 동선',
      score: metrics.socialScore,
      color: 'sky',
      description: '작업자 안전교육, 구역별 배치, 기상 위험 보호, 민원·동선 안전을 반영한 사회 점수입니다.',
      details: [
        { label: '무사고 일수', value: `${safetyDays}일`, caption: '현장 공사 시작일 기준' },
        { label: '구역 배치율', value: `${Math.round(metrics.staffingRate || 0)}%`, caption: '인력 배치 데이터 기준' },
        { label: '안전교육', value: metrics.safetyEducationRate ? `${Math.round(metrics.safetyEducationRate)}%` : '연동 대기', caption: '교육 이수 필드가 들어오면 자동 반영' },
      ],
      guide: '작업구역 배치와 교육 이수 데이터가 명확해질수록 S 점수가 구역별로 더 정밀해집니다.',
    },
    {
      key: 'G',
      title: 'Governance',
      subtitle: '작업일보 · 위험 조치 · 데이터 연동 · 점검 누락',
      score: metrics.governanceScore,
      color: 'violet',
      description: '작업일보 기록률, 위험 조치 기록, 데이터 연동률, 점검 누락 여부를 반영한 거버넌스 점수입니다.',
      details: [
        { label: '작업일보 기록률', value: `${Math.round(metrics.reportRate || 0)}%`, caption: '선택일 공사일보 저장 기준' },
        { label: '위험 조치 기록률', value: `${Math.round(metrics.actionTrackingRate || 0)}%`, caption: '조치/통제/점검/확인 키워드 기준' },
        { label: '데이터 연동률', value: `${Math.round(metrics.dataLinkRate || 0)}%`, caption: '날씨·작업지시·일보·인력 연동 기준' },
      ],
      guide: '기상 위험 조치 결과를 작업일보에 남기면 G 점수가 가장 직접적으로 올라갑니다.',
    },
  ]
}

export function buildZoneMetricCards(zone, activeKey, icons = {}, context = {}) {
  const metrics = zone?.metrics ?? createEmptyMetrics()
  const safetyDays = Math.max(1, Number(context.safetyDays || metrics.safetyDays || 1))

  if (activeKey === 'S') {
    return [
      {
        id: 'safe-days',
        title: '무사고 일수',
        subtitle: '현장 시작일 기준',
        value: `${safetyDays}일`,
        badge: safetyDays >= 90 ? '우수' : '관리',
        icon: icons.ShieldCheck,
        iconClass: 'bg-sky-50 text-sky-700',
        valueClass: 'text-sky-800',
      },
      {
        id: 'staffing-rate',
        title: '구역 배치율',
        subtitle: '투입 관리 연동',
        value: `${Math.round(metrics.staffingRate || 0)}%`,
        badge: metrics.workerCount ? '연동' : '대기',
        icon: icons.Users,
        iconClass: 'bg-emerald-50 text-emerald-700',
        valueClass: 'text-emerald-800',
      },
      {
        id: 'weather-protection',
        title: '기상 보호',
        subtitle: '위험 작업자 보호',
        value: `${Math.round(metrics.weatherProtectionScore)}점`,
        badge: metrics.weatherProtectionScore < 70 ? '주의' : '관리',
        icon: icons.AlertTriangle,
        iconClass: metrics.weatherProtectionScore < 70 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
        valueClass: metrics.weatherProtectionScore < 70 ? 'text-rose-700' : 'text-amber-700',
      },
      {
        id: 'education',
        title: '안전교육',
        subtitle: '이수 필드 자동 반영',
        value: metrics.safetyEducationRate ? `${Math.round(metrics.safetyEducationRate)}%` : '대기',
        badge: metrics.safetyEducationRate ? '연동' : '대기',
        icon: icons.Medal,
        iconClass: 'bg-violet-50 text-violet-700',
        valueClass: 'text-violet-800',
      },
    ]
  }

  if (activeKey === 'G') {
    return [
      {
        id: 'daily-log',
        title: '작업일보 기록률',
        subtitle: '선택일 공사일보',
        value: `${Math.round(metrics.reportRate || 0)}%`,
        badge: metrics.reportRate >= 80 ? '우수' : '관리',
        icon: icons.Gauge,
        iconClass: 'bg-violet-50 text-violet-700',
        valueClass: 'text-violet-800',
      },
      {
        id: 'action-done',
        title: '위험 조치 기록',
        subtitle: '조치/점검 키워드',
        value: `${Math.round(metrics.actionTrackingRate || 0)}%`,
        badge: metrics.actionTrackingRate >= 80 ? '우수' : '주의',
        icon: icons.ShieldCheck,
        iconClass: 'bg-emerald-50 text-emerald-700',
        valueClass: 'text-emerald-800',
      },
      {
        id: 'missing-check',
        title: '점검 누락',
        subtitle: '기상 위험 포함',
        value: `${Math.max(0, metrics.missingCheckCount || 0)}건`,
        badge: metrics.missingCheckCount > 2 ? '위험' : '관리',
        icon: icons.AlertTriangle,
        iconClass: metrics.missingCheckCount > 2 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
        valueClass: metrics.missingCheckCount > 2 ? 'text-rose-700' : 'text-amber-700',
      },
      {
        id: 'data-link',
        title: '데이터 연동률',
        subtitle: '날씨·작업·인력·일보',
        value: `${Math.round(metrics.dataLinkRate || 0)}%`,
        badge: '연동',
        icon: icons.Medal,
        iconClass: 'bg-sky-50 text-sky-700',
        valueClass: 'text-sky-800',
      },
    ]
  }

  return [
    {
      id: 'carbon',
      title: '탄소 부하',
      subtitle: '장비 종류·대수 기준',
      value: `${metrics.estimatedCarbonKg}kg`,
      badge: metrics.carbonScore >= 80 ? '우수' : '관리',
      icon: icons.Leaf,
      iconClass: 'bg-emerald-50 text-emerald-700',
      valueClass: 'text-emerald-800',
    },
    {
      id: 'wash-water',
      title: '세척수/오염수',
      subtitle: '세척 대상 장비 기준',
      value: `${metrics.estimatedWashWaterLiters}L`,
      badge: metrics.wastewaterRisk >= 6 ? '주의' : '관리',
      icon: icons.Droplets,
      iconClass: 'bg-emerald-50 text-emerald-700',
      valueClass: 'text-emerald-800',
    },
    {
      id: 'power-peak',
      title: '전력 피크',
      subtitle: '세척장·게이트 집중도',
      value: `${metrics.powerPeakRisk}/10`,
      badge: metrics.powerPeakRisk >= 7 ? '위험' : '관리',
      icon: icons.Zap,
      iconClass: metrics.powerPeakRisk >= 7 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
      valueClass: metrics.powerPeakRisk >= 7 ? 'text-rose-700' : 'text-amber-700',
    },
    {
      id: 'fine-dust',
      title: 'PM10 분진',
      subtitle: '미세먼지·외부작업',
      value: `${metrics.fineDustValue || 0}㎍/㎥`,
      badge: metrics.fineDustRiskLevel >= 3 ? '주의' : '관리',
      icon: icons.Factory,
      iconClass: 'bg-emerald-50 text-emerald-700',
      valueClass: 'text-emerald-800',
    },
  ]
}

export function buildMissions(zone, currentSite = {}) {
  return buildZoneMissions(zone, currentSite)
}

function buildShortSiteName(name = '') {
  const cleaned = String(name || '').replace(/신축|재건축|공구|공사|현장/g, '').trim()
  return cleaned.split(/\s+/).slice(0, 2).join(' ') || String(name || '현장').trim()
}

function filterWorkersByZone(workers, zoneName = '') {
  const list = normalizeList(workers)
  const cleanZone = String(zoneName || '').trim()
  if (!cleanZone || cleanZone === '세척장' || cleanZone === '민원 구역') return list

  const matched = list.filter((worker) => {
    const fields = [
      worker.placement,
      worker.zoneMain,
      worker.zoneSub,
      worker.zoneName,
      worker.workLocation,
      worker.assignedZone,
      worker.deploymentZone,
      worker.workArea,
      worker.site,
    ]
    return fields.some((value) => String(value || '').includes(cleanZone))
  })

  return matched.length ? matched : list
}

function hasSafetyEducationSignal(worker) {
  return [
    'safetyEducationCompleted',
    'safetyTrainingCompleted',
    'basicSafetyTrainingCompleted',
    'isSafetyEducationCompleted',
    'educationCompleted',
    'safetyEducationStatus',
    'educationStatus',
    'trainingStatus',
  ].some((key) => Object.prototype.hasOwnProperty.call(worker, key))
}
