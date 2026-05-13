export const LEVEL_THRESHOLDS = [0, 30, 50, 65, 78, 88, 95, 100]

export const HIGH_RISK_EQUIPMENT_KEYWORDS = [
  '타워크레인',
  '크레인',
  '리프트',
  '펌프카',
  '덤프트럭',
  '고소작업대',
  '고소작업차',
  '굴착기',
]

export const WASH_TARGET_EQUIPMENT_KEYWORDS = [
  '덤프트럭',
  '굴착기',
  '펌프카',
  '콘크리트펌프카',
  '카고트럭',
  '지게차',
  '로더',
]

export const DUST_WORK_KEYWORDS = [
  '굴착',
  '토사',
  '반출',
  '절단',
  '연마',
  '외부',
  '마감',
  '도장',
]

export const EQUIPMENT_CARBON_FACTORS = [
  { keywords: ['콘크리트펌프카', '펌프카'], factor: 2.2 },
  { keywords: ['굴착기'], factor: 2.0 },
  { keywords: ['덤프트럭'], factor: 2.0 },
  { keywords: ['타워크레인', '크레인'], factor: 1.7 },
  { keywords: ['카고트럭'], factor: 1.6 },
  { keywords: ['고소작업차', '고소작업대', '리프트'], factor: 1.5 },
  { keywords: ['지게차'], factor: 1.2 },
]

export const METRIC_COLOR_CLASS = {
  emerald: { icon: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', score: 'text-emerald-800' },
  sky: { icon: 'bg-sky-50 text-sky-700', bar: 'bg-sky-500', score: 'text-sky-800' },
  violet: { icon: 'bg-violet-50 text-violet-700', bar: 'bg-violet-500', score: 'text-violet-800' },
  amber: { icon: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500', score: 'text-amber-700' },
  rose: { icon: 'bg-rose-50 text-rose-700', bar: 'bg-rose-500', score: 'text-rose-700' },
}

export function resolveLevel(score) {
  const normalizedScore = Number(score) || 0
  if (normalizedScore <= 0) return 0

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
function resolveMetricInput(context = {}) {
  const metricInputs = normalizeList(context.metricInputs)
  const zoneName = firstNonBlank(context.zoneName)

  if (!metricInputs.length) {
    return {}
  }

  const matchedZoneInput = metricInputs.find((item) => {
    return zoneName && firstNonBlank(item.zoneName) === zoneName
  })

  if (matchedZoneInput) {
    return matchedZoneInput
  }

  return metricInputs.find((item) => {
    const inputZoneName = firstNonBlank(item.zoneName)
    return !inputZoneName || inputZoneName === '전체 현장' || inputZoneName === 'SITE'
  }) ?? {}
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

export function buildEsgMetrics(equipments, context = {}) {
  const equipmentList = Array.isArray(equipments) ? equipments : []
  const analysis = context.weatherAnalysis ?? {}
  const airQuality = context.airQuality ?? {}
  const metricInput = resolveMetricInput(context)
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
  const fineDustValue = Number(firstFiniteNumber(metricInput.fineDustValue, airQuality.value, analysis.fineDustValue) ?? 0)
  const weatherFactor = 1
    + (fineDustValue >= 80 ? 0.2 : 0)
    + (rainPercent >= 60 ? 0.2 : 0)
  const actualWashWaterLiters = firstFiniteNumber(metricInput.washWaterLiters, context.actualWashWaterLiters)
  const estimatedWashWaterLiters = actualWashWaterLiters !== null
    ? Math.round(actualWashWaterLiters)
    : Math.round(washTargetCount * 120 * weatherFactor)
  const actualWastewaterLiters = firstFiniteNumber(metricInput.wastewaterLiters, context.actualWastewaterLiters)
  const wastewaterRecoveryRate = firstFiniteNumber(metricInput.wastewaterRecoveryRate, context.wastewaterRecoveryRate)
  const wastewaterRisk = actualWastewaterLiters !== null
    ? clampNumber(Math.round(actualWastewaterLiters / 120 + (wastewaterRecoveryRate !== null ? Math.max(0, 100 - wastewaterRecoveryRate) / 20 : 0)), 0, 10)
    : clampNumber(
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
  const actualCarbonKg = firstFiniteNumber(metricInput.carbonKg, context.actualCarbonKg)
  const estimatedCarbonKg = actualCarbonKg !== null
    ? Math.max(0, Math.round(actualCarbonKg))
    : Math.max(0, Math.round(carbonLoadIndex * 6.8 + highRiskEquipmentCount * 2.5))
  const actualPowerSavingKwh = firstFiniteNumber(metricInput.powerSavingKwh, context.actualPowerSavingKwh)
  const powerSavingKwh = actualPowerSavingKwh !== null
    ? Math.max(0, Math.round(actualPowerSavingKwh))
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

  const staffingRate = firstFiniteNumber(metricInput.staffingRate, workerMetrics.staffingRate) ?? (totalEquipmentCount > 0 ? missionRate : 0)
  const safetyEducationRate = firstFiniteNumber(metricInput.safetyEducationRate, workerMetrics.safetyEducationRate) ?? (totalEquipmentCount > 0 ? missionRate : 0)
  const weatherProtectionScore = clampScore(100 - weatherRiskCount * 6 - fineDustRiskLevel * 4 - (windSpeed >= 8 ? 6 : 0))
  const routeSafetyScore = clampScore(100 - Math.min(35, highRiskEquipmentCount * 4 + gateCount * 1.5))
  const socialScore = clampScore(
    safetyEducationRate * 0.4
      + staffingRate * 0.3
      + weatherProtectionScore * 0.2
      + routeSafetyScore * 0.1,
  )

  const reportMetrics = buildReportMetrics(context.reports, equipmentList, weatherRiskCount)
  const resolvedReportRate = firstFiniteNumber(metricInput.reportRate, reportRate, reportMetrics.reportRate) ?? 0
  const resolvedActionTrackingRate = firstFiniteNumber(metricInput.actionTrackingRate, actionTrackingRate, reportMetrics.actionTrackingRate) ?? 0
  const resolvedDataLinkRate = firstFiniteNumber(metricInput.dataLinkRate, dataLinkRate, buildDefaultDataLinkRate(context, totalEquipmentCount)) ?? 0
  const missingCheckCount = Math.max(
    0,
    Math.round((100 - resolvedReportRate) / 25) + Math.max(0, weatherRiskCount - 2),
  )
  const checkScore = clampScore(100 - missingCheckCount * 8)
  const governanceScore = clampScore(
    resolvedReportRate * 0.35
      + resolvedActionTrackingRate * 0.3
      + resolvedDataLinkRate * 0.2
      + checkScore * 0.15,
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
    actualWastewaterLiters: actualWastewaterLiters ?? 0,
    wastewaterRecoveryRate: wastewaterRecoveryRate ?? 0,
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
    checkScore,
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

export function createEmptyMetrics() {
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
    carbonScore: 0,
    estimatedWashWaterLiters: 0,
    wastewaterRisk: 0,
    waterScore: 0,
    fineDustScore: 0,
    powerPeakRisk: 0,
    powerSavingKwh: 0,
    powerScore: 0,
    staffingRate: 0,
    safetyEducationRate: 0,
    weatherProtectionScore: 0,
    routeSafetyScore: 0,
    reportRate: 0,
    actionTrackingRate: 0,
    dataLinkRate: 0,
    missingCheckCount: 0,
    checkScore: 0,
    safetyDays: 1,
    workerCount: 0,
    assignedWorkerCount: 0,
    trainedWorkerCount: 0,
    environmentScore: 0,
    socialScore: 0,
    governanceScore: 0,
    totalScore: 0,
    operatingRisk: 0,
  }
}

export function buildTotalScore(metrics) {
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

export function hasEsgOperationData(metrics, context = {}) {
  return metrics.totalEquipmentCount > 0
    || normalizeList(context.reports).length > 0
    || normalizeList(context.workOrders).length > 0
    || normalizeList(context.workers).length > 0
    || normalizeList(context.staffingWorkers).length > 0
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
export function firstNonBlank(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

export function normalizeCount(value) {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? count : 1
}

export function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))))
}

export function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

export function roundOne(value) {
  return Math.round(Number(value || 0) * 10) / 10
}

export function isHighRiskEquipment(equipmentName = '') {
  return HIGH_RISK_EQUIPMENT_KEYWORDS.some((keyword) => equipmentName.includes(keyword))
}

export function isWashTargetEquipment(equipmentName = '') {
  return WASH_TARGET_EQUIPMENT_KEYWORDS.some((keyword) => equipmentName.includes(keyword))
}

export function getEquipmentCarbonFactor(equipmentName = '') {
  const matched = EQUIPMENT_CARBON_FACTORS.find((item) => {
    return item.keywords.some((keyword) => equipmentName.includes(keyword))
  })
  return matched?.factor ?? 1
}

export function containsAny(text = '', keywords = []) {
  return keywords.some((keyword) => String(text).includes(keyword))
}

export function normalizeList(value) {
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
