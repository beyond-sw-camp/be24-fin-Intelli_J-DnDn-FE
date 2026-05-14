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

function hasMetricInputForZone(metricInputs, zoneName) {
  const inputs = Array.isArray(metricInputs) ? metricInputs : []
  return inputs.some((input) => firstNonBlank(input?.zoneName) === zoneName)
}

export function buildSupportZones(equipments, context = {}) {
  const equipmentList = Array.isArray(equipments) ? equipments : []
  const washBaseMetrics = buildEsgMetrics(equipmentList, { ...context, zoneName: '세척장' })
  const complaintBaseMetrics = buildEsgMetrics(equipmentList, { ...context, zoneName: '민원 구역' })
  const hasWashLinkedOperationData = hasEsgOperationData(washBaseMetrics, context)
    || hasMetricInputForZone(context.metricInputs, '세척장')
  const hasComplaintLinkedOperationData = hasEsgOperationData(complaintBaseMetrics, context)
    || hasMetricInputForZone(context.metricInputs, '민원 구역')
  const totalEquipmentCount = washBaseMetrics.totalEquipmentCount
  const highRiskEquipmentCount = washBaseMetrics.highRiskEquipmentCount
  const workLocationCount = washBaseMetrics.workLocationCount
  const gateCount = washBaseMetrics.gateCount
  const missionRate = washBaseMetrics.missionRate

  const washRisk = clampNumber(
    Math.round(
      washBaseMetrics.washTargetCount * 1.1
        + washBaseMetrics.washWaterDemandRisk * 0.7
        + washBaseMetrics.gateCongestionRisk * 0.45
        + washBaseMetrics.weatherRiskCount * 0.45,
    ),
    0,
    10,
  )
  const complaintRisk = clampNumber(
    Math.round(
      highRiskEquipmentCount * 1.1
        + workLocationCount
        + complaintBaseMetrics.fineDustRiskLevel * 1.5
        + complaintBaseMetrics.complaintRisk * 0.9
        + (complaintBaseMetrics.windSpeed >= 8 ? 1 : 0)
        + complaintBaseMetrics.weatherRiskCount * 0.4,
    ),
    0,
    10,
  )

  const washMetrics = {
    ...washBaseMetrics,
    environmentScore: clampScore(washBaseMetrics.environmentScore - washRisk * 0.7 + washBaseMetrics.waterScore * 0.12),
    socialScore: clampScore(washBaseMetrics.socialScore - washRisk * 0.35),
    governanceScore: clampScore(washBaseMetrics.governanceScore - Math.max(0, washRisk - 4) * 0.9),
    operatingRisk: washRisk,
  }
  washMetrics.totalScore = hasWashLinkedOperationData ? buildTotalScore(washMetrics) : 0
  if (!hasWashLinkedOperationData) {
    washMetrics.environmentScore = 0
    washMetrics.socialScore = 0
    washMetrics.governanceScore = 0
  }

  const complaintMetrics = {
    ...complaintBaseMetrics,
    environmentScore: clampScore(
      complaintBaseMetrics.environmentScore
        - complaintBaseMetrics.fineDustRiskLevel * 1.8
,
    ),
    socialScore: clampScore(
      complaintBaseMetrics.socialScore
        - complaintRisk * 0.75,
    ),
    governanceScore: clampScore(
      complaintBaseMetrics.governanceScore
        - Math.max(0, complaintRisk - 3) * 0.8
        - Math.max(0, 100 - complaintBaseMetrics.complaintResolutionRate) * 0.08,
    ),
    operatingRisk: complaintRisk,
  }
  complaintMetrics.totalScore = hasComplaintLinkedOperationData ? buildTotalScore(complaintMetrics) : 0
  if (!hasComplaintLinkedOperationData) {
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
        ? `금일 입차 장비 ${totalEquipmentCount}대 · 세척 관리 ${washMetrics.washTargetCount}대`
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
          + metrics.washWaterDemandRisk * 0.25,
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

  if (!zone) {
    return [
      buildMissionItem({
        id: 'mission-empty-e',
        title: '주간 환경 미션 연동 대기',
        description: '선택 구역의 환경 데이터를 불러오면 주간 관리 미션을 표시합니다.',
        tag: 'E',
        progress: 0,
        progressLabel: '0점',
        progressCaption: '환경 데이터 대기',
        color: 'emerald',
      }),
      buildMissionItem({
        id: 'mission-empty-s',
        title: '주간 안전 미션 연동 대기',
        description: '선택 구역의 안전·인력 데이터를 불러오면 주간 관리 미션을 표시합니다.',
        tag: 'S',
        progress: 0,
        progressLabel: '0점',
        progressCaption: '안전 데이터 대기',
        color: 'sky',
      }),
      buildMissionItem({
        id: 'mission-empty-g',
        title: '주간 기록 미션 연동 대기',
        description: '선택 구역의 기록·조치 데이터를 불러오면 주간 관리 미션을 표시합니다.',
        tag: 'G',
        progress: 0,
        progressLabel: '0점',
        progressCaption: '기록 데이터 대기',
        color: 'violet',
      }),
    ]
  }

  if (zone.name === '세척장') {
    return buildWashZoneWeeklyMissions(metrics)
  }

  if (zone.name === '민원 구역') {
    return buildComplaintZoneWeeklyMissions(metrics)
  }

  return buildWorkZoneWeeklyMissions(zone, metrics, siteName)
}

function buildWashZoneWeeklyMissions(metrics) {
  return [
    buildMissionItem({
      id: 'wash-weekly-e',
      title: '세척장 주간 세척수 관리',
      description: '입차 중장비 대수와 세척수 소요를 함께 보며 세척장 운영 상태를 주간 기준으로 점검합니다.',
      tag: 'E',
      progress: metrics.environmentScore,
      progressLabel: `${clampPercent(metrics.environmentScore)}점`,
      progressCaption: `세척수 ${metrics.estimatedWashWaterLiters || 0}L · 장비 ${metrics.washTargetCount || 0}대`,
      color: 'emerald',
    }),
    buildMissionItem({
      id: 'wash-weekly-s',
      title: '세척장 주간 작업자·동선 안전',
      description: '세척 대기 차량과 작업자 동선이 겹치지 않도록 안전교육, 배치율, 보호조치를 함께 관리합니다.',
      tag: 'S',
      progress: metrics.socialScore,
      progressLabel: `${clampPercent(metrics.socialScore)}점`,
      progressCaption: `교육 ${clampPercent(metrics.safetyEducationRate || 0)}% · 배치 ${clampPercent(metrics.staffingRate || 0)}%`,
      color: 'sky',
    }),
    buildMissionItem({
      id: 'wash-weekly-g',
      title: '세척장 주간 점검·조치 기록',
      description: '세척장 점검일보와 운영 이행 기록이 누락 없이 남는지 확인합니다.',
      tag: 'G',
      progress: metrics.governanceScore,
      progressLabel: `${clampPercent(metrics.governanceScore)}점`,
      progressCaption: `기록 ${clampPercent(metrics.reportRate || 0)}% · 조치 ${clampPercent(metrics.actionTrackingRate || 0)}%`,
      color: 'violet',
    }),
  ]
}

function buildComplaintZoneWeeklyMissions(metrics) {
  return [
    buildMissionItem({
      id: 'complaint-weekly-e',
      title: '민원구역 주간 분진 영향 관리',
      description: 'PM10과 분진성 작업을 함께 보며 주변 환경 영향을 주간 기준으로 점검합니다.',
      tag: 'E',
      progress: metrics.environmentScore,
      progressLabel: `${clampPercent(metrics.environmentScore)}점`,
      progressCaption: `PM10 ${metrics.fineDustValue || 0}㎍/㎥ · 분진작업 ${metrics.dustWorkCount || 0}건`,
      color: 'emerald',
    }),
    buildMissionItem({
      id: 'complaint-weekly-s',
      title: '민원구역 주간 주변 영향 완화',
      description: '작업자 안내, 통행 분산, 민원 처리 흐름을 함께 관리해 주변 영향도를 낮춥니다.',
      tag: 'S',
      progress: metrics.socialScore,
      progressLabel: `${clampPercent(metrics.socialScore)}점`,
      progressCaption: `처리 ${metrics.complaintResolvedCount || 0}/${metrics.complaintCount || 0}건 · 배치 ${clampPercent(metrics.staffingRate || 0)}%`,
      color: 'sky',
    }),
    buildMissionItem({
      id: 'complaint-weekly-g',
      title: '민원구역 주간 대응 이력 관리',
      description: '민원 접수, 대응 조치, 관련 기록이 같은 주차 기준으로 연결되는지 확인합니다.',
      tag: 'G',
      progress: metrics.governanceScore,
      progressLabel: `${clampPercent(metrics.governanceScore)}점`,
      progressCaption: `조치 ${clampPercent(metrics.actionTrackingRate || 0)}% · 연동 ${clampPercent(metrics.dataLinkRate || 0)}%`,
      color: 'violet',
    }),
  ]
}

function buildWorkZoneWeeklyMissions(zone, metrics, siteName) {
  return [
    buildMissionItem({
      id: `work-weekly-e-${zone.id}`,
      title: `${zone.name} 주간 환경부하 관리`,
      description: `${siteName} 작업구역의 장비 탄소부하, 세척수 관리, 분진성 작업을 묶어 주간 환경 상태를 점검합니다.`,
      tag: 'E',
      progress: metrics.environmentScore,
      progressLabel: `${clampPercent(metrics.environmentScore)}점`,
      progressCaption: `탄소 ${metrics.estimatedCarbonKg || 0}kg · PM10 ${metrics.fineDustValue || 0}㎍/㎥`,
      color: 'emerald',
    }),
    buildMissionItem({
      id: `work-weekly-s-${zone.id}`,
      title: `${zone.name} 주간 안전·인력 운영`,
      description: '안전교육 이수율, 인력 배치율, 기상 위험 보호 수준을 함께 보며 현장 안전을 관리합니다.',
      tag: 'S',
      progress: metrics.socialScore,
      progressLabel: `${clampPercent(metrics.socialScore)}점`,
      progressCaption: `교육 ${clampPercent(metrics.safetyEducationRate || 0)}% · 배치 ${clampPercent(metrics.staffingRate || 0)}%`,
      color: 'sky',
    }),
    buildMissionItem({
      id: `work-weekly-g-${zone.id}`,
      title: `${zone.name} 주간 기록·조치 정합성`,
      description: '작업지시, 공사일보, 위험 조치 기록이 같은 구역 기준으로 연결되는지 주간 단위로 확인합니다.',
      tag: 'G',
      progress: metrics.governanceScore,
      progressLabel: `${clampPercent(metrics.governanceScore)}점`,
      progressCaption: `일보 ${clampPercent(metrics.reportRate || 0)}% · 조치 ${clampPercent(metrics.actionTrackingRate || 0)}%`,
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
      description: '장비 세척 흐름, 세척수 관리, 게이트 분산을 중점 관리합니다.',
      guide: '세척장 대기 동선을 분리하고 점검일보를 꾸준히 남기면 다음 레벨에 가까워집니다.',
      progress: Math.min(100, zone.level * 14),
    }
  }

  if (zone.name === '민원 구역') {
    const title = zone.level >= 5 ? '민원 대응 안정 관리 단계' : '민원 대응 집중 관리 단계'

    return {
      title,
      label: title,
      description: '분진·장비 동선·민원 대응 수준을 단계별로 관리합니다.',
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
        ? '우천일에는 세척수 관리와 장비 출입 동선을 우선 점검합니다.'
        : '세척 대상 장비와 게이트 분산 상태를 함께 관리합니다.',
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

  // 작업구역 점수 = E × 0.50 + S × 0.30 + G × 0.20 (esgScoreCalculator buildTotalScore 기준)
  const eScoreRounded = Math.round(metrics.environmentScore)
  const sScoreRounded = Math.round(metrics.socialScore)
  const gScoreRounded = Math.round(metrics.governanceScore)

  return [
    {
      key: 'E',
      title: 'Environment',
      subtitle: '탄소 · 세척수/오염수 · PM10 · 게이트 분산',
      score: metrics.environmentScore,
      weight: ESG_CATEGORY_WEIGHTS.E,
      weightedScore: Math.round(eScoreRounded * ESG_CATEGORY_WEIGHTS.E) / 100,
      color: 'emerald',
      description: '장비 탄소부하, 세척수·오염수, PM10, 게이트 분산·공회전 저감 운영을 합산한 환경 점수입니다.',
      details: [
        { label: '탄소 부하지수', value: `${metrics.carbonLoadIndex}pt`, caption: '장비 종류와 대수 기반 운영 추정' },
        { label: '세척수 추정', value: `${metrics.estimatedWashWaterLiters}L`, caption: '세척 대상 장비와 우천/미세먼지 조건 반영' },
        { label: 'PM10', value: `${fineDustValue}㎍/㎥`, caption: '분진·살수 관리 기준' },
        { label: '게이트 분산', value: `${Math.round(metrics.idleReductionScore || 0)}점`, caption: `최대 게이트 집중 ${metrics.gateConcentrationRate || 0}%` },
      ],
      guide: '실제 연료량 계측값이 있으면 우선 사용하고, 없으면 작업지시 장비·세척 대상·PM10·게이트 분산 상태로 환경 운영 점수를 추정합니다.',
    },
    {
      key: 'S',
      title: 'Social',
      subtitle: '안전교육 · 인력 배치 · 기상 보호 · 출입 동선',
      score: metrics.socialScore,
      weight: ESG_CATEGORY_WEIGHTS.S,
      weightedScore: Math.round(sScoreRounded * ESG_CATEGORY_WEIGHTS.S) / 100,
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
      subtitle: '작업일보 · 위험 조치 · 데이터 완결성 · 점검 누락',
      score: metrics.governanceScore,
      weight: ESG_CATEGORY_WEIGHTS.G,
      weightedScore: Math.round(gScoreRounded * ESG_CATEGORY_WEIGHTS.G) / 100,
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

  if (activeKey === 'S') {
    return [
      buildScoreCard({
        id: 'education',
        title: '안전교육 이수율',
        subtitle: `40% · ${metrics.workerCount ? `이수 ${metrics.trainedWorkerCount}/${metrics.workerCount}명` : `무사고 ${safetyDays}일 참고`}`,
        rawScore: metrics.safetyEducationRate || 0,
        weight: 40,
        source: '인력 관리 · 안전교육 이수 필드',
        badge: metrics.safetyEducationRate >= 80 ? '우수' : metrics.workerCount ? '관리' : '대기',
        icon: icons.Medal,
        color: 'violet',
      }),
      buildScoreCard({
        id: 'staffing-rate',
        title: '구역별 인력 배치율',
        subtitle: `30% · 배치 ${metrics.assignedWorkerCount}/${metrics.workerCount || 0}명`,
        rawScore: metrics.staffingRate || 0,
        weight: 30,
        source: '인력 투입 관리 · 구역 배치 현황',
        badge: metrics.workerCount ? '연동' : '대기',
        icon: icons.Users,
        color: 'emerald',
      }),
      buildScoreCard({
        id: 'weather-protection',
        title: '기상 위험 작업자 보호',
        subtitle: `20% · 기상 위험 ${metrics.weatherRiskCount}건`,
        rawScore: metrics.weatherProtectionScore,
        weight: 20,
        source: '기상관제 · 기상 AI 위험 분석',
        badge: metrics.weatherProtectionScore < 70 ? '주의' : '관리',
        icon: icons.AlertTriangle,
        color: metrics.weatherProtectionScore < 70 ? 'rose' : 'amber',
      }),
      buildScoreCard({
        id: 'route-safety',
        title: '민원·동선 안전',
        subtitle: `10% · 고위험 장비 ${metrics.highRiskEquipmentCount}대`,
        rawScore: metrics.routeSafetyScore,
        weight: 10,
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
        subtitle: `${ESG_METRIC_CARD_WEIGHTS[0]}% · 선택일 공사일보 저장 기준`,
        rawScore: metrics.reportRate || 0,
        weight: ESG_METRIC_CARD_WEIGHTS[0],
        source: '공사일보 · 일별 저장 현황',
        badge: metrics.reportRate >= 80 ? '우수' : '관리',
        icon: icons.Gauge,
        color: 'violet',
      }),
      buildScoreCard({
        id: 'action-done',
        title: '공사일보 이행 완료율',
        subtitle: `${ESG_METRIC_CARD_WEIGHTS[1]}% · 공사일보 진척률 평균`,
        rawScore: metrics.actionTrackingRate || 0,
        weight: ESG_METRIC_CARD_WEIGHTS[1],
        source: '공사일보 · todayProgress / 진행률 연동',
        badge: metrics.actionTrackingRate >= 80 ? '우수' : '주의',
        icon: icons.ShieldCheck,
        color: 'emerald',
      }),
      buildScoreCard({
        id: 'data-link',
        title: '데이터 연동 완성도',
        subtitle: `${ESG_METRIC_CARD_WEIGHTS[2]}% · 날씨·작업·인력·일보 연동 기준`,
        rawScore: metrics.dataLinkRate || 0,
        weight: ESG_METRIC_CARD_WEIGHTS[2],
        source: '대시보드 연동 · 4개 모듈 입력 상태',
        badge: metrics.dataLinkRate >= 80 ? '우수' : '연동',
        icon: icons.Medal,
        color: 'sky',
      }),
      buildScoreCard({
        id: 'missing-check',
        title: '점검 누락 여부',
        subtitle: `${ESG_METRIC_CARD_WEIGHTS[3]}% · 누락 ${Math.max(0, metrics.missingCheckCount || 0)}건`,
        rawScore: metrics.checkScore || 0,
        weight: ESG_METRIC_CARD_WEIGHTS[3],
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
      subtitle: `${ESG_METRIC_CARD_WEIGHTS[0]}% · 탄소부하지수 ${metrics.carbonLoadIndex}pt`,
      rawScore: metrics.carbonScore,
      weight: ESG_METRIC_CARD_WEIGHTS[0],
      source: '중장비 입출차 + 작업지시 · 장비 종류·대수',
      badge: metrics.carbonScore >= 80 ? '우수' : '관리',
      icon: icons.Leaf,
      color: 'emerald',
    }),
    buildScoreCard({
      id: 'wash-water',
      title: '세척수 관리',
      subtitle: `${ESG_METRIC_CARD_WEIGHTS[1]}% · 세척수 ${metrics.estimatedWashWaterLiters}L · 관리지수 ${metrics.washWaterDemandRisk}/10`,
      rawScore: metrics.waterScore,
      weight: ESG_METRIC_CARD_WEIGHTS[1],
      source: '중장비 입출차 · 입차 장비 대수 + 우천·PM10 조건',
      badge: metrics.washWaterDemandRisk >= 6 ? '주의' : '관리',
      icon: icons.Droplets,
      color: 'emerald',
    }),
    buildScoreCard({
      id: 'fine-dust',
      title: '미세먼지/분진',
      subtitle: `${ESG_METRIC_CARD_WEIGHTS[2]}% · ${fineDustLabel} · 분진작업 ${metrics.dustWorkCount}건`,
      rawScore: metrics.fineDustScore,
      weight: ESG_METRIC_CARD_WEIGHTS[2],
      source: '기상관제 PM10 + 작업지시 제목·상세 분진 키워드',
      badge: metrics.fineDustRiskLevel >= 3 ? '주의' : '관리',
      icon: icons.Factory,
      color: 'emerald',
    }),
    buildScoreCard({
      id: 'gate-idle',
      title: '게이트 분산·공회전 저감',
      subtitle: `${ESG_METRIC_CARD_WEIGHTS[3]}% · 최대 게이트 집중 ${metrics.gateConcentrationRate || 0}%`,
      rawScore: metrics.idleReductionScore || 0,
      weight: ESG_METRIC_CARD_WEIGHTS[3],
      source: '작업지시 게이트 배정 · 장비 집중도',
      badge: metrics.gateCongestionRisk >= 5 ? '주의' : '관리',
      icon: icons.Zap,
      color: metrics.gateCongestionRisk >= 5 ? 'rose' : 'amber',
    }),
  ]
}

function buildScoreCard({ id, title, subtitle, rawScore, weight, badge, icon, color }) {
  // 표시 점수: 0~100 정수 (사용자 화면 기준)
  // 가중 기여: 표시 점수 × 가중치 (반올림 후 합산이 ESG 점수와 일치하도록)
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
