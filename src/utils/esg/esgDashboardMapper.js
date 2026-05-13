import {
  ESG_CATEGORY_WEIGHTS,
  ESG_METRIC_CARD_WEIGHTS,
  METRIC_COLOR_CLASS,
  buildEsgMetrics,
  buildTotalScore,
  clampNumber,
  clampPercent,
  clampScore,
  createEmptyMetrics,
  firstNonBlank,
  hasEsgOperationData,
  isHighRiskEquipment,
  normalizeCount,
  resolveLevel,
} from './esgScoreCalculator.js'

// esgZoneMapper
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
  const hasLinkedOperationData = hasEsgOperationData(sharedMetrics, context)
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
  washMetrics.totalScore = hasLinkedOperationData ? buildTotalScore(washMetrics) : 0
  if (!hasLinkedOperationData) {
    washMetrics.environmentScore = 0
    washMetrics.socialScore = 0
    washMetrics.governanceScore = 0
  }

  const complaintMetrics = {
    ...sharedMetrics,
    environmentScore: clampScore(sharedMetrics.environmentScore - sharedMetrics.fineDustRiskLevel * 1.8),
    socialScore: clampScore(sharedMetrics.socialScore - complaintRisk * 0.75),
    governanceScore: clampScore(sharedMetrics.governanceScore - Math.max(0, complaintRisk - 3) * 0.8),
    operatingRisk: complaintRisk,
  }
  complaintMetrics.totalScore = hasLinkedOperationData ? buildTotalScore(complaintMetrics) : 0
  if (!hasLinkedOperationData) {
    complaintMetrics.environmentScore = 0
    complaintMetrics.socialScore = 0
    complaintMetrics.governanceScore = 0
  }

  return [
    {
      id: 'wash-zone',
      siteId: resolveContextSiteId(context),
      name: '세척장',
      type: '상시 관리구역',
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
        : '금일 입차 장비 0대',
      gateSummary: gateCount ? `${gateCount}개 게이트 입차 기준` : '게이트 0개',
      zoneType: 'support',
      metrics: washMetrics,
    },
    {
      id: 'complaint-zone',
      siteId: resolveContextSiteId(context),
      name: '민원 구역',
      type: '상시 관리구역',
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
        : '금일 작업지시 장비 0대',
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


// esgMissionMapper
export function buildZoneMissions(zone, currentSite = {}) {
  const siteName = currentSite.shortName || currentSite.name || '현장'
  const metrics = zone?.metrics ?? createEmptyMetrics()
  const hasEquipmentData = metrics.totalEquipmentCount > 0
  const hasWorkerData = metrics.workerCount > 0
  const fineDustLabel = metrics.fineDustValue > 0 ? `${metrics.fineDustValue}㎍/㎥` : '0%'
  const reportLabel = hasEquipmentData || metrics.reportRate > 0 ? `${clampPercent(metrics.reportRate)}점` : '0%'
  const actionLabel = hasEquipmentData || metrics.actionTrackingRate < 100 ? `${clampPercent(metrics.actionTrackingRate)}점` : '0%'

  if (!zone) {
    return [
      buildMissionItem({
        id: 'mission-empty',
        title: 'ESG 미션 0%',
        description: '선택 구역의 ESG 기준값을 확인합니다.',
        tag: '대기',
        progress: 0,
        progressLabel: '0%',
        progressCaption: '',
        color: 'emerald',
      }),
    ]
  }

  if (zone.name === '세척장') {
    return [
      buildMissionItem({
        id: 'wash-water',
        title: '세척수·오염수 회수 점검',
        description: hasEquipmentData
          ? `${metrics.washTargetCount}대 세척 대상 기준으로 오염수 회수통과 배수 유출 여부를 확인합니다.`
          : '세척수·오염수 회수 상태를 점검합니다.',
        tag: 'E',
        progress: hasEquipmentData ? metrics.waterScore : 0,
        progressLabel: hasEquipmentData ? `${metrics.estimatedWashWaterLiters}L` : '0%',
        progressCaption: hasEquipmentData ? `세척 대상 ${metrics.washTargetCount}대 기준` : '',
        color: 'emerald',
      }),
      buildMissionItem({
        id: 'wash-flow',
        title: '세척 대기·장비 동선 분산',
        description: '입차 장비를 게이트별로 분산해 세척 대기 혼잡과 작업자 접근 위험을 줄입니다.',
        tag: 'S',
        progress: hasEquipmentData ? metrics.socialScore : 0,
        progressLabel: hasEquipmentData ? `${metrics.totalEquipmentCount}대` : '0%',
        progressCaption: hasEquipmentData ? '금일 입차 장비 기준' : '',
        color: 'sky',
      }),
      buildMissionItem({
        id: 'wash-record',
        title: '세척장 점검 이력 기록',
        description: '세척 설비 가동, 오염수 회수, 전력 피크 관리 내용을 작업일보에 남깁니다.',
        tag: 'G',
        progress: hasEquipmentData || metrics.reportRate > 0 ? metrics.governanceScore : 0,
        progressLabel: reportLabel,
        progressCaption: '작업일보 기록 지수 기준',
        color: 'violet',
      }),
    ]
  }

  if (zone.name === '민원 구역') {
    return [
      buildMissionItem({
        id: 'dust-control',
        title: '분진·살수 관리',
        description: metrics.fineDustValue > 0
          ? `PM10 ${metrics.fineDustValue}㎍/㎥ 기준으로 살수, 방진막, 청소 주기를 조정합니다.`
          : '살수, 방진막, 청소 주기를 점검합니다.',
        tag: 'E',
        progress: metrics.fineDustValue > 0 ? metrics.fineDustScore : 0,
        progressLabel: fineDustLabel,
        progressCaption: '기상관제 PM10 기준',
        color: 'emerald',
      }),
      buildMissionItem({
        id: 'complaint-guide',
        title: '민원 안내·작업 동선 관리',
        description: '민원 가능 시간대에 안내 표지와 장비 통행 시간을 함께 관리합니다.',
        tag: 'S',
        progress: hasEquipmentData ? metrics.socialScore : 0,
        progressLabel: hasEquipmentData ? `${metrics.highRiskEquipmentCount}대` : '0%',
        progressCaption: hasEquipmentData ? '고위험 장비 영향 기준' : '',
        color: 'sky',
      }),
      buildMissionItem({
        id: 'complaint-record',
        title: '민원 대응 이력 기록',
        description: '분진·소음 저감 조치와 민원 대응 내용을 작업일보에 기록합니다.',
        tag: 'G',
        progress: hasEquipmentData || metrics.actionTrackingRate < 100 ? metrics.governanceScore : 0,
        progressLabel: actionLabel,
        progressCaption: '위험 조치 기록 지수 기준',
        color: 'violet',
      }),
    ]
  }

  return [
    buildMissionItem({
      id: 'work-environment',
      title: `${zone.name} 환경 영향 관리`,
      description: `${zone.equipmentSummary || '작업 장비'} 기준으로 탄소 부하, 분진, 세척 필요도를 점검합니다.`,
      tag: 'E',
      progress: hasEquipmentData ? metrics.environmentScore : 0,
      progressLabel: hasEquipmentData ? `${metrics.carbonLoadIndex}pt` : '0%',
      progressCaption: hasEquipmentData ? '장비 탄소부하지수 기준' : '',
      color: 'emerald',
    }),
    buildMissionItem({
      id: 'work-safety',
      title: `${zone.name} 안전교육·보호구 확인`,
      description: zone.gateSummary
        ? `${zone.gateSummary} 투입 전 안전교육 이수와 보호구 착용 상태를 확인합니다.`
        : `${siteName} 작업구역의 작업자 안전교육과 보호구 상태를 확인합니다.`,
      tag: 'S',
      progress: hasEquipmentData || hasWorkerData ? metrics.socialScore : 0,
      progressLabel: hasWorkerData ? `${clampPercent(metrics.safetyEducationRate)}점` : `${metrics.safetyDays}일`,
      progressCaption: hasWorkerData ? `교육 이수 ${metrics.trainedWorkerCount}/${metrics.workerCount}명` : '현장 시작일 기준 무사고 일수',
      color: 'sky',
    }),
    buildMissionItem({
      id: 'work-record',
      title: `${zone.name} 작업일보·위험 조치 기록`,
      description: '작업지시, 기상 위험, 장비 투입 결과를 작업일보와 함께 남깁니다.',
      tag: 'G',
      progress: hasEquipmentData || metrics.reportRate > 0 ? metrics.governanceScore : 0,
      progressLabel: reportLabel,
      progressCaption: '작업일보·위험 조치 기록 기준',
      color: 'violet',
    }),
  ]
}

function buildMissionItem({
  id,
  title,
  description,
  tag,
  progress,
  progressLabel,
  progressCaption,
  color,
}) {
  return {
    id,
    title,
    description,
    tag,
    progress: clampPercent(progress),
    progressLabel: progressLabel || `${clampPercent(progress)}점`,
    progressCaption: progressCaption || '',
    color,
  }
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
export function buildMissions(zone, currentSite = {}) {
  return buildZoneMissions(zone, currentSite)
}


// esgPanelMapper
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
export function buildEsgBreakdown(zone, context = {}) {
  const metrics = zone?.metrics ?? createEmptyMetrics()
  const fineDustValue = metrics.fineDustValue || context.airQuality?.value || 0
  const safetyDays = Math.max(1, Number(context.safetyDays || metrics.safetyDays || 1))

  // 작업구역 점수는 E/S/G 중요도 50/30/20을 반영하고,
  // E/S/G 내부 카드는 중요도 순서대로 40/30/20/10 가중치를 적용합니다.
  const eScoreRounded = Math.round(metrics.environmentScore)
  const sScoreRounded = Math.round(metrics.socialScore)
  const gScoreRounded = Math.round(metrics.governanceScore)

  return [
    {
      key: 'E',
      title: 'Environment',
      subtitle: '탄소 · 세척수/오염수 · PM10 · 전력 피크',
      score: metrics.environmentScore,
      weight: ESG_CATEGORY_WEIGHTS.E,
      contributionLabel: '작업구역 점수 50% 반영',
      weightedScore: Math.round((eScoreRounded * ESG_CATEGORY_WEIGHTS.E / 100) * 10) / 10,
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
      weight: ESG_CATEGORY_WEIGHTS.S,
      contributionLabel: '작업구역 점수 30% 반영',
      weightedScore: Math.round((sScoreRounded * ESG_CATEGORY_WEIGHTS.S / 100) * 10) / 10,
      color: 'sky',
      description: '작업자 안전교육, 구역별 배치, 기상 위험 보호, 민원·동선 안전을 반영한 사회 점수입니다.',
      details: [
        { label: '무사고 일수', value: `${safetyDays}일`, caption: '현장 공사 시작일 기준' },
        { label: '구역 배치율', value: `${Math.round(metrics.staffingRate || 0)}%`, caption: '인력 배치 데이터 기준' },
        { label: '안전교육', value: metrics.safetyEducationRate ? `${Math.round(metrics.safetyEducationRate)}%` : '0%', caption: '교육 이수 필드가 들어오면 자동 반영' },
      ],
      guide: '작업구역 배치와 교육 이수 데이터가 명확해질수록 S 점수가 구역별로 더 정밀해집니다.',
    },
    {
      key: 'G',
      title: 'Governance',
      subtitle: '작업일보 · 위험 조치 · 데이터 연동 · 점검 누락',
      score: metrics.governanceScore,
      weight: ESG_CATEGORY_WEIGHTS.G,
      contributionLabel: '작업구역 점수 20% 반영',
      weightedScore: Math.round((gScoreRounded * ESG_CATEGORY_WEIGHTS.G / 100) * 10) / 10,
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
  const fineDustLabel = metrics.fineDustValue > 0 ? `${metrics.fineDustValue}㎍/㎥` : '0㎍/㎥'
  const [primaryWeight, secondaryWeight, tertiaryWeight, quaternaryWeight] = ESG_METRIC_CARD_WEIGHTS

  if (activeKey === 'S') {
    return [
      buildScoreCard({
        id: 'education',
        title: '안전교육 이수율',
        subtitle: `${primaryWeight}% · ${metrics.workerCount ? `이수 ${metrics.trainedWorkerCount}/${metrics.workerCount}명` : `무사고 ${safetyDays}일 참고`}`,
        rawScore: metrics.safetyEducationRate || 0,
        weight: primaryWeight,
        source: '인력 관리 · 안전교육 이수 필드',
        badge: metrics.safetyEducationRate >= 80 ? '우수' : metrics.workerCount ? '관리' : '대기',
        icon: icons.Medal,
        color: 'violet',
      }),
      buildScoreCard({
        id: 'staffing-rate',
        title: '구역별 인력 배치율',
        subtitle: `${secondaryWeight}% · 배치 ${metrics.assignedWorkerCount}/${metrics.workerCount || 0}명`,
        rawScore: metrics.staffingRate || 0,
        weight: secondaryWeight,
        source: '인력 투입 관리 · 구역 배치 현황',
        badge: metrics.workerCount ? '연동' : '대기',
        icon: icons.Users,
        color: 'emerald',
      }),
      buildScoreCard({
        id: 'weather-protection',
        title: '기상 위험 작업자 보호',
        subtitle: `${tertiaryWeight}% · 기상 위험 ${metrics.weatherRiskCount}건`,
        rawScore: metrics.weatherProtectionScore,
        weight: tertiaryWeight,
        source: '기상관제 · 기상 AI 위험 분석',
        badge: metrics.weatherProtectionScore < 70 ? '주의' : '관리',
        icon: icons.AlertTriangle,
        color: metrics.weatherProtectionScore < 70 ? 'rose' : 'amber',
      }),
      buildScoreCard({
        id: 'route-safety',
        title: '민원·동선 안전',
        subtitle: `${quaternaryWeight}% · 고위험 장비 ${metrics.highRiskEquipmentCount}대`,
        rawScore: metrics.routeSafetyScore,
        weight: quaternaryWeight,
        source: '중장비 입출차 · 게이트 동선',
        badge: metrics.routeSafetyScore < 70 ? '주의' : '관리',
        icon: icons.ShieldCheck,
        color: metrics.routeSafetyScore < 70 ? 'rose' : 'sky',
      }),
    ]
  }

  if (activeKey === 'G') {
    return [
      buildScoreCard({
        id: 'daily-log',
        title: '작업일보 기록률',
        subtitle: `${primaryWeight}% · 선택일 공사일보 저장 기준`,
        rawScore: metrics.reportRate || 0,
        weight: primaryWeight,
        source: '공사일보 · 일별 저장 현황',
        badge: metrics.reportRate >= 80 ? '우수' : '관리',
        icon: icons.Gauge,
        color: 'violet',
      }),
      buildScoreCard({
        id: 'action-done',
        title: '위험 조치 기록률',
        subtitle: `${secondaryWeight}% · 조치/통제/점검/확인 키워드 기준`,
        rawScore: metrics.actionTrackingRate || 0,
        weight: secondaryWeight,
        source: '공사일보 본문 · 조치 키워드 추출',
        badge: metrics.actionTrackingRate >= 80 ? '우수' : '주의',
        icon: icons.ShieldCheck,
        color: 'emerald',
      }),
      buildScoreCard({
        id: 'data-link',
        title: '데이터 연동 완성도',
        subtitle: `${tertiaryWeight}% · 날씨·작업·인력·일보 연동 기준`,
        rawScore: metrics.dataLinkRate || 0,
        weight: tertiaryWeight,
        source: '대시보드 연동 · 4개 모듈 입력 상태',
        badge: metrics.dataLinkRate >= 80 ? '우수' : '연동',
        icon: icons.Medal,
        color: 'sky',
      }),
      buildScoreCard({
        id: 'missing-check',
        title: '점검 누락 여부',
        subtitle: `${quaternaryWeight}% · 누락 ${Math.max(0, metrics.missingCheckCount || 0)}건`,
        rawScore: metrics.checkScore || 0,
        weight: quaternaryWeight,
        source: '공사일보 + 기상관제 위험 매칭',
        badge: metrics.missingCheckCount > 2 ? '위험' : '관리',
        icon: icons.AlertTriangle,
        color: metrics.missingCheckCount > 2 ? 'rose' : 'amber',
      }),
    ]
  }

  return [
    buildScoreCard({
      id: 'carbon',
      title: '탄소/장비부하',
      subtitle: `${primaryWeight}% · 탄소부하지수 ${metrics.carbonLoadIndex}pt`,
      rawScore: metrics.carbonScore,
      weight: primaryWeight,
      source: '중장비 입출차 + 작업지시 · 장비 종류·대수',
      badge: metrics.carbonScore >= 80 ? '우수' : '관리',
      icon: icons.Leaf,
      color: 'emerald',
    }),
    buildScoreCard({
      id: 'wash-water',
      title: '세척수/오염수',
      subtitle: `${secondaryWeight}% · 세척수 ${metrics.estimatedWashWaterLiters}L · 위험 ${metrics.wastewaterRisk}/10`,
      rawScore: metrics.waterScore,
      weight: secondaryWeight,
      source: '중장비 입출차 · 세척대상 장비 + 우천 조건',
      badge: metrics.wastewaterRisk >= 6 ? '주의' : '관리',
      icon: icons.Droplets,
      color: 'emerald',
    }),
    buildScoreCard({
      id: 'fine-dust',
      title: '미세먼지/분진',
      subtitle: `${tertiaryWeight}% · ${fineDustLabel} · 분진작업 ${metrics.dustWorkCount}건`,
      rawScore: metrics.fineDustScore,
      weight: tertiaryWeight,
      source: '기상관제 PM10 + 작업지시 외부작업',
      badge: metrics.fineDustRiskLevel >= 3 ? '주의' : '관리',
      icon: icons.Factory,
      color: 'emerald',
    }),
    buildScoreCard({
      id: 'power-peak',
      title: '전력/피크관리',
      subtitle: `${quaternaryWeight}% · 피크 위험 ${metrics.powerPeakRisk}/10`,
      rawScore: metrics.powerScore,
      weight: quaternaryWeight,
      source: '게이트 세척기계 + 장비 집중도',
      badge: metrics.powerPeakRisk >= 7 ? '위험' : '관리',
      icon: icons.Zap,
      color: metrics.powerPeakRisk >= 7 ? 'rose' : 'amber',
    }),
  ]
}

function buildScoreCard({ id, title, subtitle, rawScore, weight, badge, icon, color }) {
  // 표시 점수: 0~100 정수 (사용자 화면 기준)
  // 카드 기여도: E/S/G 내부 카드는 중요도 순서대로 차등 반영합니다.
  const displayScore = Math.round(clampScore(rawScore || 0))
  const safeWeight = Math.max(0, Number(weight) || 0)
  const weightedScore = Math.round(displayScore * safeWeight) / 100

  return {
    id,
    title,
    subtitle,
    value: `${displayScore}점`,
    badge,
    icon,
    iconClass: METRIC_COLOR_CLASS[color]?.icon ?? METRIC_COLOR_CLASS.emerald.icon,
    valueClass: METRIC_COLOR_CLASS[color]?.score ?? METRIC_COLOR_CLASS.emerald.score,
    barClass: METRIC_COLOR_CLASS[color]?.bar ?? METRIC_COLOR_CLASS.emerald.bar,
    weight: safeWeight,
    weightLabel: `${safeWeight}%`,
    displayScore,
    weightedScore,
  }
}
