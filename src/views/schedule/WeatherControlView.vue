<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  CloudSun,
  Sparkles,
  AlertTriangle,
  CalendarRange,
  Wind,
  Droplets,
  CheckCircle2,
} from 'lucide-vue-next'

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081').replace(/\/$/, '')

const STORAGE_KEY = 'weather-plan-storage'

function createEmptyStorage() {
  return {
    tradeSites: [],
    tradeUploads: {},
  }
}

function safeParse(jsonText) {
  try {
    return JSON.parse(jsonText)
  } catch (error) {
    return null
  }
}

function normalizeStorage(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyStorage()
  }

  const tradeSites = Array.isArray(raw.tradeSites) ? raw.tradeSites : []
  const tradeUploads =
    raw.tradeUploads && typeof raw.tradeUploads === 'object' ? raw.tradeUploads : {}

  return {
    tradeSites,
    tradeUploads,
  }
}

function loadWeatherPlanStorage() {
  if (typeof window === 'undefined') {
    return createEmptyStorage()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return createEmptyStorage()
  }

  return normalizeStorage(safeParse(raw))
}

function parseDateText(dateText) {
  if (!dateText || typeof dateText !== 'string') {
    return null
  }

  const matched = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return null
  }

  return {
    y: Number(matched[1]),
    m: Number(matched[2]),
    d: Number(matched[3]),
  }
}

function isSameMonthPlan(plan, target) {
  return (
    plan &&
    Number(plan.y) === target.y &&
    Number(plan.m) === target.m &&
    Number.isFinite(Number(plan.d0)) &&
    Number.isFinite(Number(plan.d1))
  )
}

function isTargetIncluded(plan, targetDay) {
  const d0 = Math.min(Number(plan.d0), Number(plan.d1))
  const d1 = Math.max(Number(plan.d0), Number(plan.d1))
  return targetDay >= d0 && targetDay <= d1
}

function getPlanSegmentsByDate(dateText) {
  const target = parseDateText(dateText)
  if (!target) {
    return []
  }

  const storage = loadWeatherPlanStorage()
  const tradeSites = Array.isArray(storage.tradeSites) ? storage.tradeSites : []
  const tradeUploads =
    storage.tradeUploads && typeof storage.tradeUploads === 'object' ? storage.tradeUploads : {}

  const tradeLabelMap = new Map(tradeSites.map((trade) => [trade.id, trade.label || trade.id]))

  const result = []

  Object.entries(tradeUploads).forEach(([tradeId, uploads]) => {
    if (!Array.isArray(uploads)) return

    const tradeLabel = tradeLabelMap.get(tradeId) || tradeId

    uploads.forEach((upload, uploadIndex) => {
      const fileName = upload?.fileName || `upload-${uploadIndex + 1}`
      const segments = Array.isArray(upload?.segments) ? upload.segments : []

      segments.forEach((segment, segmentIndex) => {
        const plan = segment?.plan
        if (!isSameMonthPlan(plan, target)) return
        if (!isTargetIncluded(plan, target.d)) return

        result.push({
          id: `${tradeId}-${uploadIndex}-${segmentIndex}`,
          tradeId,
          tradeLabel,
          task: segment?.task || '계획 작업',
          source: fileName,
          planStart: Number(plan.d0),
          planEnd: Number(plan.d1),
          actual: segment?.actual || null,
        })
      })
    })
  })

  result.sort((a, b) => {
    if (a.planStart !== b.planStart) return a.planStart - b.planStart
    if (a.planEnd !== b.planEnd) return a.planEnd - b.planEnd
    return String(a.task).localeCompare(String(b.task), 'ko')
  })

  return result
}


const T = {
  title: '기상 관제',
  desc: '기상 변화에 따른 위험 공정 통제와 작업 계획 조정 포인트를 한 화면에서 확인합니다.',
  catRisk: '위험 통제',
  row2Title: 'AI 위험 장비 통제',
  row3Title: '계획 대비 위험 경고',
  demoToday: '오늘 현장 요약',
  demoWeek: '기상 영향도',
  demoRain: '강수 확률',
  fineDustTitle: '금일 미세먼지',
  badgeAi: 'AI',
  badgePlan: '계획 연동',
  liveRisk: '실시간 위험 통제 추천',
  threeDayTitle: '오늘 · 내일 · 모레 저장 예보',
  monthPlanTitle: 'AI 기상 기반 1개월 작업 추천',
}

function getTodayDateText() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createEmptyDashboard() {
  return {
    reportDate: '',
    locationLabel: '현장',
    today: {
      headlineTemp: '--°C / --°C',
      summary: '기상 정보 없음',
      amLabel: '기상정보 없음',
      pmLabel: '기상정보 없음',
      observedAt: '-',
    },
    week: {
      summary: '3일 특이 기상 정보 없음',
      subSummary: '-',
    },
    rain: {
      label: '강수확률',
      value: '0%',
    },
    airQuality: {
      fineDustLabel: '정보 없음',
      fineDustValue: '-',
      fineDustGrade: '',
    },
    briefing: {
      title: '기상 브리핑 및 자동화',
      description: '',
    },
    analysis: {
      reportDate: '',
      sourceType: 'EMPTY',
      outOfRange: false,
      minTemperature: null,
      maxTemperature: null,
      avgAmTemperature: null,
      avgPmTemperature: null,
      precipitationProbability: 0,
      maxWindSpeed: 0,
      hasRain: false,
      hasSnow: false,
      heatRisk: false,
      coldRisk: false,
      windRisk: false,
    },
    equipmentRisks: [],
    planRisks: [],
    alerts: [],
    forecastDays: [],
  }
}

function normalizeKeyword(text) {
  return String(text || '').replace(/\s+/g, '').toLowerCase()
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue
    if (typeof value === 'string' && value.trim() === '') continue
    return value
  }
  return null
}

function parseNumber(value) {
  const matched = String(value || '').match(/-?\d+(?:\.\d+)?/)
  return matched ? Number(matched[0]) : null
}

function formatPercent(value) {
  const picked = firstNonEmpty(value)
  if (picked == null) return '0%'
  const text = String(picked).trim()
  return text.includes('%') ? text : `${text}%`
}

function formatFineDustValue(value) {
  const picked = firstNonEmpty(value)
  if (picked == null) return '-'
  const text = String(picked).trim()
  return /㎍|ug|µg/i.test(text) ? text : `${text}㎍/㎥`
}

function formatWindSpeed(value) {
  const picked = firstNonEmpty(value)
  if (picked == null) return '-'
  const text = String(picked).trim()
  return /m\/s|mps|km\/h/i.test(text) ? text : `${text}m/s`
}

function normalizeFineDustLabel(value, grade) {
  return (
    firstNonEmpty(
      value?.label,
      value?.status,
      value?.grade,
      grade,
    ) || '정보 없음'
  )
}

function buildFineDustCard(data) {
  const airQuality = data?.airQuality || data?.fineDust || data?.pm10 || data?.today?.fineDust || null

  if (airQuality && typeof airQuality === 'object' && !Array.isArray(airQuality)) {
    return {
      label: normalizeFineDustLabel(airQuality, airQuality.grade),
      value: formatFineDustValue(
        firstNonEmpty(
          airQuality.value,
          airQuality.pm10,
          airQuality.concentration,
          airQuality.density,
        ),
      ),
      grade: firstNonEmpty(airQuality.grade, airQuality.status, airQuality.label) || '',
    }
  }

  return {
    label: normalizeFineDustLabel(null, data?.fineDustGrade || data?.airQualityGrade),
    value: formatFineDustValue(
      firstNonEmpty(
        data?.fineDustValue,
        data?.pm10Value,
        data?.pm10,
        data?.today?.fineDustValue,
      ),
    ),
    grade: firstNonEmpty(data?.fineDustGrade, data?.airQualityGrade) || '',
  }
}

function buildAnalysisFromDashboard(data) {
  const analysis = data?.analysis
  if (analysis && analysis.sourceType && analysis.sourceType !== 'EMPTY') {
    return analysis
  }

  const todaySummary = String(data?.today?.summary || '')
  const rainValue = parseNumber(data?.rain?.value) ?? 0
  const weekSubSummary = String(data?.week?.subSummary || '')
  const temps = String(data?.today?.headlineTemp || '')
    .match(/-?\d+(?:\.\d+)?/g)?.map(Number) || []

  const maxTemperature = temps.length >= 1 ? temps[0] : null
  const minTemperature = temps.length >= 2 ? temps[1] : null
  const maxWindSpeed = parseNumber(weekSubSummary) ?? 0
  const summaryKeyword = normalizeKeyword(todaySummary)

  return {
    reportDate: data?.reportDate || '',
    sourceType: 'DERIVED',
    outOfRange: false,
    minTemperature,
    maxTemperature,
    avgAmTemperature: null,
    avgPmTemperature: null,
    precipitationProbability: rainValue,
    maxWindSpeed,
    hasRain: summaryKeyword.includes('비'),
    hasSnow: summaryKeyword.includes('눈'),
    heatRisk: maxTemperature != null && maxTemperature >= 33,
    coldRisk: minTemperature != null && minTemperature <= -5,
    windRisk: maxWindSpeed >= 8,
  }
}

function isRainy(analysis) {
  return Boolean(analysis?.hasRain) || Number(analysis?.precipitationProbability || 0) >= 60
}

function isSnowy(analysis) {
  return Boolean(analysis?.hasSnow)
}

function isWindy(analysis) {
  return Boolean(analysis?.windRisk) || Number(analysis?.maxWindSpeed || 0) >= 8
}

function isHot(analysis) {
  return Boolean(analysis?.heatRisk) || Number(analysis?.maxTemperature || 0) >= 33
}

function isCold(analysis) {
  return Boolean(analysis?.coldRisk) || Number(analysis?.minTemperature || 0) <= -5
}

function includesAny(target, keywords) {
  return keywords.some((keyword) => target.includes(keyword))
}

function buildRiskLevel(analysis) {
  let score = 0
  if (isRainy(analysis)) score += 2
  if (isWindy(analysis)) score += 2
  if (isSnowy(analysis)) score += 2
  if (isHot(analysis)) score += 1
  if (isCold(analysis)) score += 1

  if (score >= 4) return { label: '높음', tone: 'text-rose-700 bg-rose-100 border-rose-200' }
  if (score >= 2) return { label: '보통', tone: 'text-amber-700 bg-amber-100 border-amber-200' }
  return { label: '낮음', tone: 'text-emerald-700 bg-emerald-100 border-emerald-200' }
}

function levelBadgeClass(level) {
  if (level === '경고' || level === '제한') {
    return 'bg-rose-600 text-white'
  }
  if (level === '주의') {
    return 'bg-amber-100 text-amber-900'
  }
  return 'bg-emerald-100 text-emerald-900'
}

function buildLinkedPlanRisks(segments, analysis) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return []
  }

  const result = []
  const seen = new Set()

  segments.forEach((segment, index) => {
    const taskText = normalizeKeyword(`${segment.tradeLabel} ${segment.task} ${segment.source}`)
    const taskName = segment.task || segment.tradeLabel || '계획 작업'

    const pushRisk = (payload) => {
      const key = `${payload.title}-${taskName}`
      if (seen.has(key)) return
      seen.add(key)
      result.push({
        id: `plan-linked-${index}-${result.length}`,
        source: 'plan',
        taskName,
        ...payload,
      })
    }

    if (
      isRainy(analysis) &&
      includesAny(taskText, ['타설', '콘크리트', '도장', '방수', '굴착', '토공', '외부', '옥외', '비계'])
    ) {
      pushRisk({
        label: `계획 연동 · ${taskName}`,
        level: Number(analysis?.precipitationProbability || 0) >= 70 ? '경고' : '주의',
        reason: `우천 시 ${taskName} 작업은 품질 저하와 바닥 미끄럼 위험이 함께 커집니다.`,
        title: '우천 연동 위험',
      })
    }

    if (
      isWindy(analysis) &&
      includesAny(taskText, ['철골', '양중', '크레인', '고소', '비계', '외장', '유리', '패널', '거푸집'])
    ) {
      pushRisk({
        label: `계획 연동 · ${taskName}`,
        level: Number(analysis?.maxWindSpeed || 0) >= 10 ? '경고' : '주의',
        reason: `강풍 시 ${taskName} 작업은 추락·낙하·자재 흔들림 위험이 증가합니다.`,
        title: '강풍 연동 위험',
      })
    }

    if (
      isSnowy(analysis) &&
      includesAny(taskText, ['외부', '이동', '운반', '굴착', '도장', '방수', '배관', '타설', '토공'])
    ) {
      pushRisk({
        label: `계획 연동 · ${taskName}`,
        level: '경고',
        reason: `적설/결빙 시 ${taskName} 작업은 이동 동선과 작업면 확보가 어렵습니다.`,
        title: '적설 연동 위험',
      })
    }

    if (
      isHot(analysis) &&
      includesAny(taskText, ['옥외', '외부', '철근', '거푸집', '해체', '배관', '토목', '도로'])
    ) {
      pushRisk({
        label: `계획 연동 · ${taskName}`,
        level: '주의',
        reason: `고온 시 ${taskName} 작업은 열 스트레스와 집중력 저하 관리가 필요합니다.`,
        title: '폭염 연동 위험',
      })
    }

    if (
      isCold(analysis) &&
      includesAny(taskText, ['타설', '콘크리트', '배관', '방수', '옥외', '외부'])
    ) {
      pushRisk({
        label: `계획 연동 · ${taskName}`,
        level: '주의',
        reason: `저온 시 ${taskName} 작업은 동결과 양생 품질 저하 가능성이 있습니다.`,
        title: '저온 연동 위험',
      })
    }
  })

  return result
}

function buildFallbackEquipmentRisk(analysis) {
  const wind = Number(analysis?.maxWindSpeed || 0)
  const rain = Number(analysis?.precipitationProbability || 0)
  const hasRealWeather = analysis?.sourceType && analysis.sourceType !== 'EMPTY'

  if (!hasRealWeather) {
    return {
      title: T.row2Title,
      level: '경고',
      reason: '예시 기준으로 강풍·우천이 겹치면 타워크레인과 고소작업대는 우선 통제 대상입니다.',
      action: '타워크레인 양중 중지, 붐/시저리프트 상승 제한, 이동식크레인 아웃트리거 지반 상태 재확인을 먼저 적용하세요.',
      equipment: ['타워크레인', '이동식크레인', '붐리프트', '시저리프트'],
    }
  }

  if (wind >= 12.5) {
    return {
      title: T.row2Title,
      level: '경고',
      reason: '고소작업대는 제조사 풍속 제한(예: 12.5m/s) 초과 시 작업 중지가 필요하고, 크레인 양중도 강풍 시 즉시 재검토가 필요합니다.',
      action: '타워크레인과 이동식크레인은 양중을 중지하고 붐을 안전 위치로 내리며, 붐리프트·시저리프트는 상승 작업을 보류하세요.',
      equipment: ['타워크레인', '이동식크레인', '붐리프트', '시저리프트'],
    }
  }

  if (wind >= 8) {
    return {
      title: T.row2Title,
      level: '주의',
      reason: '강풍 조건에서는 타워크레인 훅 흔들림, 이동식크레인 하중 편심, 붐리프트 작업대 흔들림 위험이 커집니다.',
      action: '대형 패널·철골·거푸집 양중은 감시자를 배치해 재판단하고, 고소작업대는 외곽면 작업보다 내부면 우선으로 전환하세요.',
      equipment: ['타워크레인', '이동식크레인', '붐리프트'],
    }
  }

  if (rain >= 70) {
    return {
      title: T.row2Title,
      level: '주의',
      reason: '우천 시 이동식크레인 아웃트리거 지지면과 경사로 장비 동선이 불안정해져 전도·미끄럼 위험이 커집니다.',
      action: '이동식크레인 설치면 배수 상태를 먼저 확인하고, 지게차·텔레핸들러는 젖은 램프 구간을 저속 운행으로 제한하세요.',
      equipment: ['이동식크레인', '지게차', '텔레핸들러', '콘크리트펌프카'],
    }
  }

  if (isHot(analysis)) {
    return {
      title: T.row2Title,
      level: '주의',
      reason: '폭염 시 옥외 장비 조작자의 집중력 저하와 장시간 대기 구간 피로 누적 가능성이 커집니다.',
      action: '양중 보조 인원과 장비 유도 인원은 1~2시간 단위 교대 편성을 적용하고, 정오 시간대 외부 장비 가동을 분산하세요.',
      equipment: ['타워크레인', '이동식크레인', '굴착기'],
    }
  }

  return {
    title: T.row2Title,
    level: '안정',
    reason: '현재 주요 중장비는 정상 운용 가능 범위로 판단됩니다.',
    action: '장비 일상점검, 신호수 배치, 양중 반경 통제선만 기본 유지하면 됩니다.',
    equipment: ['타워크레인', '이동식크레인', '지게차'],
  }
}

function buildFallbackPlanRisk(analysis, linkedPlanRisk) {
  const wind = Number(analysis?.maxWindSpeed || 0)
  const rain = Number(analysis?.precipitationProbability || 0)
  const hasRealWeather = analysis?.sourceType && analysis?.sourceType !== 'EMPTY'

  if (linkedPlanRisk) {
    return {
      title: T.row3Title,
      level: linkedPlanRisk.level,
      reason: linkedPlanRisk.reason,
      action: '외부 공정은 실내 선행 작업, 자재 검수, 가공 준비 작업으로 우선 전환을 검토하세요.',
    }
  }

  if (!hasRealWeather) {
    return {
      title: T.row3Title,
      level: '경고',
      reason: '예시 기준으로 오늘 비가 오면 옥상 방수, 외부 도장, 콘크리트 타설, 굴착 작업은 우선 위험 공정으로 분류합니다.',
      action: '옥외 공정은 보류하고 실내 배관·전기 트레이 정리·자재 반입 검수·양생 준비 작업으로 바꾸는 편이 현실적입니다.',
    }
  }

  if (rain >= 70) {
    return {
      title: T.row3Title,
      level: '경고',
      reason: '우천 시 옥상 방수, 외부 도장, 콘크리트 타설, 굴착 작업은 품질 저하와 작업면 미끄럼 위험이 동시에 커집니다.',
      action: '실내 MEP 작업, 자재 검수, 거푸집 선조립, 양생 준비 작업으로 당일 계획을 재편성하세요.',
    }
  }

  if (wind >= 10) {
    return {
      title: T.row3Title,
      level: '경고',
      reason: '강풍 시 철골·유리·패널 양중과 외부 고소 설치 공정은 낙하·흔들림 위험으로 순연 검토가 필요합니다.',
      action: '지상 조립, 볼트 체결 준비, 반입 자재 정리, 안전시설 보강 작업을 우선 편성하세요.',
    }
  }

  if (isSnowy(analysis)) {
    return {
      title: T.row3Title,
      level: '경고',
      reason: '적설·결빙 시 굴착, 외부 배관, 옥외 이동 공정은 작업 동선 확보가 어려워집니다.',
      action: '제설·제빙, 출입동선 확보, 실내 공정 전환을 먼저 적용하세요.',
    }
  }

  if (isHot(analysis)) {
    return {
      title: T.row3Title,
      level: '주의',
      reason: '폭염 시 옥외 철근, 토목, 포장, 외부 마감 공정은 시간대 조정이 필요합니다.',
      action: '오전 선시공 후 오후는 실내 보조 작업 또는 자재 정리 작업으로 분산하세요.',
    }
  }

  return {
    title: T.row3Title,
    level: '안정',
    reason: '현재 기준으로 일정 전체를 중지할 정도의 기상 리스크는 크지 않습니다.',
    action: '기존 계획을 유지하되 외부 공정은 시작 전 풍속·작업면 상태만 한 번 더 확인하세요.',
  }
}

function buildLiveControlFallbacks(analysis, equipmentRisk, planRisk) {
  const items = []
  const wind = Number(analysis?.maxWindSpeed || 0)
  const rain = Number(analysis?.precipitationProbability || 0)
  const hasRealWeather = analysis?.sourceType && analysis?.sourceType !== 'EMPTY'

  if (!hasRealWeather) {
    return [
      {
        id: 'demo-crane',
        label: '타워크레인 양중 중지',
        level: '경고',
        reason: '예시 기준으로 강풍 특보 또는 돌풍 예보 시 철골·거푸집·대형 자재 양중은 즉시 중지 대상으로 분류합니다.',
      },
      {
        id: 'demo-lift',
        label: '붐리프트·시저리프트 상승 제한',
        level: '경고',
        reason: '고소작업대는 강풍 시 작업대 흔들림이 커져 외벽 설치·점검 작업을 보류하는 편이 안전합니다.',
      },
      {
        id: 'demo-plan',
        label: '옥상 방수·외부 도장 순연',
        level: '경고',
        reason: '우천 시 방수·도장·실리콘 시공은 품질 확보가 어려워 실내 작업으로 즉시 전환하는 사례가 많습니다.',
      },
      {
        id: 'demo-excavation',
        label: '굴착 구간 중장비 접근 통제',
        level: '주의',
        reason: '비 뒤에는 지반 약화와 배수 문제로 굴착 가장자리 주변 장비 접근을 줄이고 배수 상태를 먼저 점검합니다.',
      },
    ]
  }

  if (equipmentRisk && equipmentRisk.level !== '안정') {
    items.push({
      id: 'live-eq',
      label: equipmentRisk.level === '경고' ? '중장비 즉시 통제' : '중장비 주의 운용',
      level: equipmentRisk.level,
      reason: equipmentRisk.action || equipmentRisk.reason,
    })
  }

  if (planRisk && planRisk.level !== '안정') {
    items.push({
      id: 'live-plan',
      label: planRisk.level === '경고' ? '당일 공정 순연 검토' : '공정 조정 필요',
      level: planRisk.level,
      reason: planRisk.action || planRisk.reason,
    })
  }

  if (wind >= 10) {
    items.push({
      id: 'live-crane-radius',
      label: '양중 반경 출입 통제',
      level: '경고',
      reason: '크레인 훅 흔들림과 자재 요동 가능성이 커서 신호수 재배치와 양중 반경 통제선 강화가 필요합니다.',
    })
  } else if (wind >= 8) {
    items.push({
      id: 'live-lift',
      label: '고소장비 외곽면 작업 축소',
      level: '주의',
      reason: '붐리프트·시저리프트는 외벽 면보다 내부면 또는 저층 구간 우선으로 배치하는 편이 안전합니다.',
    })
  }

  if (rain >= 70) {
    items.push({
      id: 'live-rain',
      label: '우천 공정 실내 전환',
      level: '경고',
      reason: '옥상 방수, 외부 도장, 타설, 굴착 작업은 순연하고 실내 배관·전기·자재 검수 작업으로 전환하세요.',
    })
  } else if (rain >= 40) {
    items.push({
      id: 'live-surface',
      label: '작업면 배수·미끄럼 점검',
      level: '주의',
      reason: '통로, 슬래브, 경사로, 자재 적치 구간의 배수와 논슬립 상태를 먼저 확인해야 합니다.',
    })
  }

  if (isHot(analysis)) {
    items.push({
      id: 'live-heat',
      label: '옥외 작업 시간대 분산',
      level: '주의',
      reason: '정오 시간대 옥외 작업을 줄이고 장비 유도 인원과 보조 인원은 교대 주기를 짧게 가져가세요.',
    })
  }

  return items.slice(0, 4)
}

function buildBriefingItems(data, analysis, riskLevel, fineDust) {
  const serverAlerts = Array.isArray(data?.alerts) ? data.alerts : []
  const mappedServerAlerts = serverAlerts
    .map((item, index) => ({
      id: item.id || `alert-${index}`,
      title: item.title || item.label || '현장 특보',
      level: item.level || '주의',
      detail: item.description || item.reason || '현장 특보 내용을 확인하세요.',
    }))
    .slice(0, 3)

  if (mappedServerAlerts.length > 0) {
    return mappedServerAlerts
  }

  const items = [
    {
      id: 'briefing-overview',
      title: '현장 종합 판단',
      level: riskLevel.label === '높음' ? '경고' : riskLevel.label === '보통' ? '주의' : '안정',
      detail: `${data?.today?.summary || '현장 기상 정보'} 기준으로 오늘 공정 조정 여부를 우선 확인하세요.`,
    },
  ]

  if (isWindy(analysis)) {
    items.push({
      id: 'briefing-wind',
      title: '강풍 영향',
      level: Number(analysis?.maxWindSpeed || 0) >= 10 ? '경고' : '주의',
      detail: `최대 풍속 ${formatWindSpeed(analysis?.maxWindSpeed)} 기준으로 고소·양중 작업은 즉시 재검토가 필요합니다.`,
    })
  }

  if (isRainy(analysis)) {
    items.push({
      id: 'briefing-rain',
      title: '강수 대응',
      level: Number(analysis?.precipitationProbability || 0) >= 70 ? '경고' : '주의',
      detail: `강수 확률 ${formatPercent(analysis?.precipitationProbability)}로 외부 마감과 타설 품질 관리에 유의해야 합니다.`,
    })
  }

  if (fineDust?.label && fineDust.label !== '정보 없음' && fineDust.label !== '좋음') {
    items.push({
      id: 'briefing-fine-dust',
      title: '미세먼지 관리',
      level: fineDust.label.includes('매우') ? '경고' : '주의',
      detail: `${fineDust.label} 수준으로 절단·비산먼지 작업 구간은 방진 관리와 보호구 착용 확인이 필요합니다.`,
    })
  }

  return items.slice(0, 3)
}

function parseDateParts(dateText) {
  const matched = String(dateText || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) return null
  return {
    y: Number(matched[1]),
    m: Number(matched[2]),
    d: Number(matched[3]),
  }
}

function getMonthlyPlanSegments(dateText) {
  const target = parseDateParts(dateText)
  if (!target) return []

  const storage = loadWeatherPlanStorage()
  const tradeSites = Array.isArray(storage.tradeSites) ? storage.tradeSites : []
  const tradeUploads = storage.tradeUploads && typeof storage.tradeUploads === 'object'
    ? storage.tradeUploads
    : {}

  const tradeLabelMap = new Map(tradeSites.map((trade) => [trade.id, trade.label || trade.id]))
  const result = []

  Object.entries(tradeUploads).forEach(([tradeId, uploads]) => {
    if (!Array.isArray(uploads)) return

    const tradeLabel = tradeLabelMap.get(tradeId) || tradeId

    uploads.forEach((upload, uploadIndex) => {
      const fileName = upload?.fileName || `upload-${uploadIndex + 1}`
      const segments = Array.isArray(upload?.segments) ? upload.segments : []

      segments.forEach((segment, segmentIndex) => {
        const plan = segment?.plan
        if (!plan) return
        if (Number(plan.y) !== target.y || Number(plan.m) !== target.m) return

        result.push({
          id: `${tradeId}-${uploadIndex}-${segmentIndex}`,
          tradeId,
          tradeLabel,
          task: segment?.task || '계획 작업',
          source: fileName,
          planStart: Number(plan.d0),
          planEnd: Number(plan.d1),
          actual: segment?.actual || null,
        })
      })
    })
  })

  result.sort((a, b) => {
    if (a.planStart !== b.planStart) return a.planStart - b.planStart
    if (a.planEnd !== b.planEnd) return a.planEnd - b.planEnd
    return String(a.task).localeCompare(String(b.task), 'ko')
  })

  return result
}

function buildMonthlyPlanRecommendations(monthlyPlans, analysis, selectedDateText) {
  const target = parseDateParts(selectedDateText)
  if (!target) return []

  const results = []
  const sourcePlans = Array.isArray(monthlyPlans) && monthlyPlans.length > 0
    ? monthlyPlans.slice(0, 6)
    : [
      { id: 'dummy-1', tradeLabel: '골조', task: '외부 거푸집 해체', planStart: target.d, planEnd: target.d + 1 },
      { id: 'dummy-2', tradeLabel: '마감', task: '옥상 방수 시공', planStart: target.d + 2, planEnd: target.d + 3 },
      { id: 'dummy-3', tradeLabel: '전기', task: '실내 배선 정리', planStart: target.d + 4, planEnd: target.d + 5 },
      { id: 'dummy-4', tradeLabel: '토목', task: '외곽 배수로 정비', planStart: target.d + 6, planEnd: target.d + 7 },
    ]

  sourcePlans.forEach((plan, index) => {
    const taskText = normalizeKeyword(`${plan.tradeLabel} ${plan.task}`)
    let level = '유지'
    let reason = '현재 기준으로 기존 일정 유지가 가능합니다.'
    let suggestion = '작업 시작 전 오전 브리핑만 재확인하세요.'

    if (
      isRainy(analysis) &&
      includesAny(taskText, ['타설', '방수', '도장', '외부', '옥상', '굴착', '토공', '비계'])
    ) {
      level = '조정 필요'
      reason = '우천 조건에서 외부 품질 공정과 작업면 확보가 어렵습니다.'
      suggestion = '실내 마감·자재 검수·양생 준비 작업으로 우선 전환하는 편이 안전합니다.'
    } else if (
      isWindy(analysis) &&
      includesAny(taskText, ['철골', '양중', '고소', '패널', '유리', '거푸집', '외부'])
    ) {
      level = '재검토'
      reason = '강풍 조건에서 양중 및 외부 설치 작업의 위험도가 상승합니다.'
      suggestion = '지상 조립, 자재 선별, 안전시설 보강 작업을 우선 편성하세요.'
    } else if (
      isHot(analysis) &&
      includesAny(taskText, ['옥외', '외부', '철근', '토목', '도로', '배수로'])
    ) {
      level = '시간 조정'
      reason = '고온 시간대 집중 시 작업 생산성과 안전성이 모두 떨어질 수 있습니다.'
      suggestion = '오전 선시공 후 오후는 실내 보조 작업으로 분산 배치하는 것이 좋습니다.'
    } else if (
      isCold(analysis) &&
      includesAny(taskText, ['타설', '콘크리트', '방수', '배관', '외부'])
    ) {
      level = '품질 주의'
      reason = '저온 조건에서는 양생과 부착 품질 확보가 어렵습니다.'
      suggestion = '보양 계획을 먼저 확보하고, 필요 시 일정 순연을 검토하세요.'
    }

    results.push({
      id: plan.id || `monthly-${index}`,
      dateRange: `${String(target.m).padStart(2, '0')}.${String(plan.planStart).padStart(2, '0')} - ${String(target.m).padStart(2, '0')}.${String(plan.planEnd).padStart(2, '0')}`,
      tradeLabel: plan.tradeLabel || '공정',
      task: plan.task || '계획 작업',
      level,
      reason,
      suggestion,
    })
  })

  return results
}

function buildForecastLabel(day, index) {
  if (index === 0) return '오늘'
  if (index === 1) return '내일'
  if (index === 2) return '모레'
  return day?.dayLabel || '-'
}

const dashboard = ref(createEmptyDashboard())
const loading = ref(false)
const reportDate = ref(getTodayDateText())
const linkedPlanSegments = ref([])
const monthlyPlanSegments = ref([])

const todayHeadline = computed(() => dashboard.value.today?.headlineTemp || '--°C / --°C')
const todaySummary = computed(() => dashboard.value.today?.summary || '기상 정보 없음')
const rainValue = computed(() =>
  formatPercent(firstNonEmpty(dashboard.value.rain?.value, dashboard.value.analysis?.precipitationProbability)),
)
const fineDustCard = computed(() => buildFineDustCard(dashboard.value))
const derivedAnalysis = computed(() => buildAnalysisFromDashboard(dashboard.value))
const riskLevel = computed(() => buildRiskLevel(derivedAnalysis.value))

const linkedPlanRisks = computed(() =>
  buildLinkedPlanRisks(linkedPlanSegments.value, derivedAnalysis.value),
)

const equipmentPrimary = computed(() => {
  const risky = (dashboard.value.equipmentRisks || []).find((item) => item.level && item.level !== '안정')
  return risky || buildFallbackEquipmentRisk(derivedAnalysis.value)
})

const planPrimary = computed(() => {
  const linked = linkedPlanRisks.value[0]
  if (linked) {
    return {
      title: T.row3Title,
      level: linked.level,
      reason: linked.reason,
      action: '외부 공정은 실내 선행 작업 또는 자재 준비 작업으로 전환 검토가 필요합니다.',
    }
  }

  const risky = (dashboard.value.planRisks || []).find((item) => item.level && item.level !== '안정')
  if (risky) {
    return {
      title: T.row3Title,
      level: risky.level,
      reason: `${risky.reason || ''}`.trim(),
      action: `${risky.action || ''}`.trim(),
    }
  }

  return buildFallbackPlanRisk(derivedAnalysis.value, linked)
})

const equipmentSummary = computed(() => {
  return `${equipmentPrimary.value.reason} ${equipmentPrimary.value.action || ''}`.trim()
})

const planSummary = computed(() => {
  return `${planPrimary.value.reason} ${planPrimary.value.action || ''}`.trim()
})

const briefingItems = computed(() =>
  buildBriefingItems(dashboard.value, derivedAnalysis.value, riskLevel.value, fineDustCard.value),
)

const riskFlags = computed(() => {
  const linked = linkedPlanRisks.value.map((item) => ({
    id: item.id,
    label: item.label,
    level: item.level,
    reason: item.reason,
  }))

  const equipment = (dashboard.value.equipmentRisks || [])
    .filter((item) => item.level && item.level !== '안정')
    .map((item, index) => ({
      id: `eq-${index}`,
      label: item.title,
      level: item.level,
      reason: item.subtitle || item.reason,
    }))

  const plans = (dashboard.value.planRisks || [])
    .filter((item) => item.level && item.level !== '안정')
    .map((item, index) => ({
      id: `pl-${index}`,
      label: item.title,
      level: item.level,
      reason: item.subtitle || item.reason,
    }))

  const fallback = buildLiveControlFallbacks(derivedAnalysis.value, equipmentPrimary.value, planPrimary.value)
  const merged = [...linked, ...equipment, ...plans, ...fallback]
  const seen = new Set()

  return merged.filter((item) => {
    const key = `${item.label}-${item.reason}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 4)
})

const threeDayForecast = computed(() => {
  const serverDays = Array.isArray(dashboard.value.forecastDays) ? dashboard.value.forecastDays.slice(0, 3) : []

  if (serverDays.length > 0) {
    return serverDays.map((day, index) => ({
      ...day,
      dayLabel: buildForecastLabel(day, index),
    }))
  }

  const analysis = derivedAnalysis.value
  const baseRain = Number(analysis?.precipitationProbability || 20)
  const baseWind = Number(analysis?.maxWindSpeed || 3)
  const maxTemp = Number(analysis?.maxTemperature || 23)
  const minTemp = Number(analysis?.minTemperature || 14)

  return [
    {
      dayLabel: '오늘',
      weatherLabel: isRainy(analysis) ? '비 가능성 높음' : isWindy(analysis) ? '강풍 주의' : '대체로 맑음',
      maxTemp,
      minTemp,
      precipitationProbability: baseRain,
      windSpeed: baseWind,
    },
    {
      dayLabel: '내일',
      weatherLabel: baseRain >= 60 ? '흐리고 비' : '구름 많음',
      maxTemp: maxTemp - 1,
      minTemp: minTemp - 1,
      precipitationProbability: Math.max(20, baseRain - 10),
      windSpeed: Math.max(2, baseWind - 1),
    },
    {
      dayLabel: '모레',
      weatherLabel: baseRain >= 70 ? '비 뒤 갬' : '작업 가능',
      maxTemp: maxTemp + 1,
      minTemp,
      precipitationProbability: Math.max(10, baseRain - 20),
      windSpeed: Math.max(2, baseWind - 1),
    },
  ]
})

const monthlyRecommendations = computed(() =>
  buildMonthlyPlanRecommendations(monthlyPlanSegments.value, derivedAnalysis.value, reportDate.value),
)

async function loadDashboard() {
  loading.value = true
  try {
    linkedPlanSegments.value = getPlanSegmentsByDate(reportDate.value)
    monthlyPlanSegments.value = getMonthlyPlanSegments(reportDate.value)

    const response = await fetch(`${API_BASE_URL}/weather/dashboard?reportDate=${reportDate.value}`)
    if (!response.ok) {
      throw new Error('기상 관제 조회 실패')
    }

    const data = await response.json()
    dashboard.value = {
      ...createEmptyDashboard(),
      ...data,
      airQuality: buildFineDustCard(data),
    }
  } catch (error) {
    console.error(error)
    dashboard.value = createEmptyDashboard()
    linkedPlanSegments.value = getPlanSegmentsByDate(reportDate.value)
    monthlyPlanSegments.value = getMonthlyPlanSegments(reportDate.value)
  } finally {
    loading.value = false
  }
}

watch(reportDate, loadDashboard)
onMounted(loadDashboard)
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-sky-50/40 to-flare-50/20 p-6 shadow-card">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-forena-500 to-flare-500" />
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-forena-700 text-white shadow-md">
            <CloudSun class="h-5 w-5" />
          </span>
          <div>
            <h1 class="text-gradient-brand text-2xl font-bold tracking-tight">{{ T.title }}</h1>
            <p class="mt-1 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
          </div>
        </div>

        <div class="rounded-2xl border border-forena-100/80 bg-white/90 p-3 shadow-sm">
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-bold uppercase tracking-wide text-forena-500">기준 날짜</span>
            <input v-model="reportDate" type="date"
              class="rounded-xl border border-forena-200 px-3 py-2 text-sm text-forena-800 focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" />
          </label>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <article class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-bold text-forena-500">{{ T.demoToday }}</p>
            <p class="mt-2 text-2xl font-bold tabular-nums text-forena-900">{{ todayHeadline }}</p>
          </div>
          <span class="rounded-full border px-2.5 py-1 text-[11px] font-bold" :class="riskLevel.tone">
            위험 {{ riskLevel.label }}
          </span>
        </div>
        <p class="mt-3 text-sm leading-relaxed text-slate-600">{{ todaySummary }}</p>
      </article>

      <article class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
        <p class="text-[11px] font-bold text-forena-500">{{ T.demoWeek }}</p>
        <p class="mt-2 flex items-center gap-2 text-base font-bold text-amber-800">
          <Wind class="h-5 w-5 shrink-0" />
          {{ dashboard.week?.summary || '기상 영향 분석 준비 중' }}
        </p>
        <p class="mt-2 text-sm leading-relaxed text-slate-500">
          {{ dashboard.week?.subSummary || `최대 풍속 ${formatWindSpeed(derivedAnalysis?.maxWindSpeed)} 기준으로 주요 외부 공정을 점검하세요.` }}
        </p>
      </article>

      <article class="rounded-2xl border border-sky-100/90 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 shadow-card">
        <div class="flex items-center justify-between gap-3">
          <p class="text-[11px] font-bold tracking-wide text-sky-800">{{ T.demoRain }}</p>
          <Droplets class="h-5 w-5 text-sky-600" />
        </div>
        <p class="mt-3 text-3xl font-extrabold tracking-tight text-sky-900">{{ rainValue }}</p>
        <p class="mt-2 text-sm leading-relaxed text-sky-800/80">
          {{ Number(derivedAnalysis?.precipitationProbability || 0) >= 70 ? '외부 공정 순연 검토 필요' : Number(derivedAnalysis?.precipitationProbability || 0) >= 40 ? '외부 작업면 상태 사전 점검 권장' : '기본 우천 대비 수준 유지' }}
        </p>
      </article>

      <article class="rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 shadow-card">
        <div class="flex items-center justify-between gap-3">
          <p class="text-[11px] font-bold tracking-wide text-violet-800">{{ T.fineDustTitle }}</p>
          <Wind class="h-5 w-5 text-violet-600" />
        </div>
        <p class="mt-3 text-3xl font-extrabold tracking-tight text-violet-900">{{ fineDustCard.value }}</p>
        <p class="mt-2 text-sm leading-relaxed text-violet-800/80">{{ fineDustCard.label }}</p>
      </article>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-forena-50/50 px-5 py-3">
        <h2 class="text-sm font-bold text-forena-900">{{ T.catRisk }}</h2>
      </div>

      <div class="space-y-3 p-4">
        <div class="grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/45 p-4 md:grid-cols-[126px_1fr] md:items-start">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-800">{{ T.badgeAi }}</span>
            <Sparkles class="h-4 w-4 text-violet-600" />
          </div>
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-bold text-forena-900">{{ T.row2Title }}</h3>
              <span class="rounded-md px-2 py-0.5 text-[10px] font-bold"
                :class="levelBadgeClass(equipmentPrimary.level)">
                {{ equipmentPrimary.level }}
              </span>
            </div>
            <p class="text-sm leading-relaxed text-slate-700">{{ equipmentSummary }}</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="item in equipmentPrimary.equipment || []" :key="item"
                class="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-800">
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid gap-3 rounded-2xl border border-rose-100 bg-rose-50/45 p-4 md:grid-cols-[126px_1fr] md:items-start">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">{{ T.badgePlan }}</span>
            <AlertTriangle class="h-4 w-4 text-rose-600" />
          </div>
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-bold text-forena-900">{{ T.row3Title }}</h3>
              <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="levelBadgeClass(planPrimary.level)">
                {{ planPrimary.level }}
              </span>
            </div>
            <p class="text-sm leading-relaxed text-slate-700">{{ planSummary }}</p>
            <div class="flex flex-wrap gap-2">
              <span
                class="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-800">
                당일 연동 공정 {{ linkedPlanSegments.length }}건
              </span>
              <span v-if="linkedPlanRisks.length > 0"
                class="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800">
                즉시 조정 후보 {{ linkedPlanRisks.length }}건
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-rose-100/80 bg-rose-50/30 p-5 shadow-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="flex items-center gap-2 text-sm font-bold text-rose-900">
          <AlertTriangle class="h-4 w-4" />
          {{ T.liveRisk }}
        </h3>
        <span class="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700">
          기준 {{ reportDate }}
        </span>
      </div>

      <div v-if="loading" class="mt-3 rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-600">
        기상 관제 데이터를 불러오는 중입니다...
      </div>

      <ul v-else class="mt-4 grid gap-3 lg:grid-cols-2">
        <li v-for="r in riskFlags" :key="r.id"
          class="rounded-xl border border-rose-200/60 bg-white px-4 py-4 text-sm shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-semibold text-forena-900">{{ r.label }}</span>
            <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="levelBadgeClass(r.level)">
              {{ r.level }}
            </span>
          </div>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ r.reason }}</p>
        </li>

        <li v-if="riskFlags.length === 0"
          class="rounded-xl border border-rose-200/60 bg-white px-4 py-4 text-sm text-slate-600">
          현재 기준 표시할 위험 통제 추천이 없습니다.
        </li>
      </ul>
    </div>

    <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
      <div class="flex items-center justify-between gap-3 border-b border-forena-100 pb-3">
        <h2 class="text-sm font-bold text-forena-900">{{ T.threeDayTitle }}</h2>
        <span class="text-xs font-medium text-forena-500">{{ dashboard.locationLabel }}</span>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <article v-for="day in threeDayForecast" :key="day.date || day.dayLabel"
          class="rounded-xl border border-forena-100 bg-forena-50/40 p-4">
          <p class="text-xs font-bold text-forena-600">{{ day.dayLabel }}</p>
          <p class="mt-2 text-base font-bold text-forena-900">{{ day.weatherLabel }}</p>
          <p class="mt-2 text-sm text-slate-700">
            {{ day.maxTemp ?? '--' }}°C / {{ day.minTemp ?? '--' }}°C
          </p>
          <div class="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>강수 {{ day.precipitationProbability ?? 0 }}%</span>
            <span>풍속 {{ formatWindSpeed(day.windSpeed) }}</span>
          </div>
        </article>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-forena-50/50 px-5 py-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-sm font-bold text-forena-900">{{ T.monthPlanTitle }}</h2>
          <span class="text-xs font-medium text-forena-500">기상 조건 반영 대체 작업 추천</span>
        </div>
      </div>

      <div class="space-y-3 p-4">
        <article v-for="plan in monthlyRecommendations" :key="plan.id"
          class="rounded-2xl border border-forena-100 bg-forena-50/30 p-4">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full border border-forena-200 bg-white px-2.5 py-1 text-[11px] font-bold text-forena-700">
                  {{ plan.dateRange }}
                </span>
                <span class="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                  {{ plan.tradeLabel }}
                </span>
              </div>
              <h3 class="text-base font-bold text-forena-900">{{ plan.task }}</h3>
              <p class="text-sm leading-relaxed text-slate-700">{{ plan.reason }}</p>
              <p class="text-sm leading-relaxed text-forena-700"><span class="font-bold">AI 추천:</span> {{ plan.suggestion }}</p>
            </div>

            <span class="inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold" :class="
              plan.level === '조정 필요' || plan.level === '재검토'
                ? 'bg-rose-100 text-rose-800'
                : plan.level === '시간 조정' || plan.level === '품질 주의'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
            ">
              {{ plan.level }}
            </span>
          </div>
        </article>

        <div v-if="monthlyRecommendations.length === 0"
          class="rounded-2xl border border-forena-100 bg-forena-50/30 px-4 py-5 text-sm text-slate-600">
          업로드된 작업 계획이 없어서 추천할 1개월 계획 데이터가 없습니다.
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
      <div class="flex items-center gap-2 border-b border-forena-100 pb-3">
        <CheckCircle2 class="h-4 w-4 text-emerald-600" />
        <h2 class="text-sm font-bold text-forena-900">현장 브리핑 포인트</h2>
      </div>

      <div class="mt-4 grid gap-3 lg:grid-cols-3">
        <article v-for="item in briefingItems" :key="item.id"
          class="rounded-xl border border-forena-100 bg-forena-50/30 p-4">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-bold text-forena-900">{{ item.title }}</h3>
            <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="levelBadgeClass(item.level)">
              {{ item.level }}
            </span>
          </div>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ item.detail }}</p>
        </article>
      </div>
    </div>
  </div>
</template>
