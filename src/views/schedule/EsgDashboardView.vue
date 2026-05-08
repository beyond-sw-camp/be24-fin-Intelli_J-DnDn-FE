<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Droplets,
  Factory,
  Gauge,
  HardHat,
  Leaf,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-vue-next'
import api from '@/api/index.js'
import { getGateEquipments } from '@/api/workOrder.js'
import {
  BASE_SITES,
  EMPTY_WORK_ZONE,
  LEVEL_THRESHOLDS,
  buildDashboardZones,
  buildRankingItems,
  buildZoneMissions,
  calculateOperatingRiskCount,
  getZoneFocusMetric,
  getZoneGrowthTitle,
  getZoneStage,
  resolveLevel,
} from '@/utils/esgDashboardMapper.js'

const reportDate = ref(getTodayDateText())
const loading = ref(false)
const lastUpdatedAt = ref('')
const dashboard = ref(null)
const selectedSiteId = ref('mokdong')
const selectedZoneId = ref('zone-a')
const activeEsgKey = ref('E')
let refreshTimer = null

// feat: 작업지시서 연동 데이터
const equipmentsData = ref([])  // GET /work-order/gate-equipments
const reportsData = ref([])     // GET /report - 금일 공사일보 데이터
const workOrdersData = ref([])  // GET /work-order

const sites = ref(BASE_SITES.map((site) => ({ ...site })))

const currentSite = computed(() => sites.value.find((site) => site.id === selectedSiteId.value) ?? sites.value[0])

// feat: 날씨 AI 위험 건수 (equipmentRisks + planRisks)
const weatherRiskCount = computed(() =>
  (equipmentRisks.value?.length ?? 0) + (planRisks.value?.length ?? 0)
)

// feat: 작업지시서 + 공사일보 기반 미션 달성률
const realMissionRate = computed(() => {
  // 1차: 공사일보 진행률 사용 (실제 데이터)
  if (reportsData.value.length > 0) {
    const totalProgress = reportsData.value.reduce((sum, r) => sum + (r.processProgress || 0), 0)
    const avgProgress = Math.round(totalProgress / reportsData.value.length)
    return Math.min(100, avgProgress)
  }

  // 2차: 작업 장비 상태 기반 (fallback)
  const equips = equipmentsData.value
  if (!equips.length) return 62
  const working = equips.filter((e) => e.statusLabel === '작업중').length
  return Math.round((working / equips.length) * 100)
})

// feat: 세척장/민원 구역 + 작업지시서의 작업 위치를 ESG 관리구역으로 변환
const realDashboardZones = computed(() =>
  buildDashboardZones(equipmentsData.value, {
    missionRate: realMissionRate.value,
    weatherRiskCount: weatherRiskCount.value,
    weatherAnalysis: weatherAnalysis.value,
    airQuality: airQuality.value,
  })
)

const operatingRiskCount = computed(() =>
  calculateOperatingRiskCount(equipmentsData.value, weatherRiskCount.value)
)

// feat: 현장 기준으로 zones 결정 — 목동(현재 현장)은 세척장/민원 구역 + 작업지시서 작업구역을 함께 표시
const siteZones = computed(() => {
  if (realDashboardZones.value.length && currentSite.value.id === 'mokdong') {
    return realDashboardZones.value
  }
  return [{ ...EMPTY_WORK_ZONE, siteId: currentSite.value.id }]
})

const selectedZone = computed(() => {
  return siteZones.value.find((zone) => zone.id === selectedZoneId.value) ?? siteZones.value[0]
})

const weatherToday = computed(() => dashboard.value?.today ?? null)
const weatherAnalysis = computed(() => dashboard.value?.analysis ?? null)
const airQuality = computed(() => dashboard.value?.airQuality ?? null)
const equipmentRisks = computed(() => normalizeArray(dashboard.value?.equipmentRisks))
const planRisks = computed(() => normalizeArray(dashboard.value?.planRisks))

const activeScore = computed(() => selectedZone.value?.score ?? currentSite.value.score)
const activeLevel = computed(() => {
  return resolveLevel(activeScore.value)
})
const levelProgress = computed(() => {
  const current = LEVEL_THRESHOLDS[activeLevel.value - 1] ?? 0
  const next = LEVEL_THRESHOLDS[activeLevel.value] ?? 100
  return Math.min(100, Math.max(0, Math.round(((activeScore.value - current) / Math.max(1, next - current)) * 100)))
})
const nextLevelPoint = computed(() => {
  const next = LEVEL_THRESHOLDS[activeLevel.value] ?? 100
  return Math.max(0, next - activeScore.value).toFixed(1)
})
const buildingFloors = computed(() => Array.from({ length: 8 }, (_, index) => index + 1))
const zoneGrowthTitle = computed(() => getZoneGrowthTitle(selectedZone.value))
const zoneStage = computed(() => getZoneStage(selectedZone.value))
const zoneFocusMetric = computed(() =>
  getZoneFocusMetric(selectedZone.value, {
    weatherAnalysis: weatherAnalysis.value,
    airQuality: airQuality.value,
  })
)

const weatherImpact = computed(() => {
  const analysis = weatherAnalysis.value
  if (!analysis) {
    return { label: '기상 데이터 연결 대기', tone: 'text-slate-700 bg-slate-100 border-slate-200', score: 0 }
  }

  let score = 0
  if (analysis.hasRain || (analysis.precipitationProbability ?? 0) >= 60) score += 2
  if (analysis.windRisk || (analysis.maxWindSpeed ?? 0) >= 8) score += 2
  if (analysis.hasSnow) score += 2
  if (analysis.heatRisk) score += 1
  if (analysis.coldRisk) score += 1
  if (analysis.fineDustRisk) score += 1

  if (score >= 4) return { label: '통제 필요', tone: 'text-rose-700 bg-rose-50 border-rose-200', score }
  if (score >= 2) return { label: '주의 관찰', tone: 'text-amber-700 bg-amber-50 border-amber-200', score }
  return { label: '정상 운영', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', score }
})

const esgBreakdown = computed(() => {
  const zone = selectedZone.value
  const rain = weatherAnalysis.value?.precipitationProbability ?? 30
  const wind = weatherAnalysis.value?.maxWindSpeed ?? 2.4
  const fineDust = airQuality.value?.value ?? 37

  const environment = clampScore(zone.score - rain * 0.05 - fineDust * 0.03 + zone.powerSaving * 0.04)
  const social = clampScore(zone.score + zone.missionRate * 0.12 - zone.risk * 1.4)
  const governance = clampScore(zone.score + (100 - zone.risk * 5) * 0.1 - wind * 0.8)

  return [
    {
      key: 'E',
      title: 'Environment',
      subtitle: '탄소 저감 · 세척 전력 · 비산먼지',
      score: environment,
      color: 'emerald',
      icon: Leaf,
      description: '장비 공회전, 세척 전력, 미세먼지 대응을 합산한 환경 점수입니다.',
      details: [
        { label: '탄소 저감량', value: `${zone.carbon}kg`, caption: '대기 장비 공회전 감소 기준' },
        { label: '세척 전력 절감', value: `-${zone.powerSaving}kWh`, caption: '세척장 전력 사용 최적화' },
        { label: '비산먼지 대응', value: `${airQuality.value?.value ?? 36}㎍/㎥`, caption: 'PM10 기준 살수/차폐 대응' },
      ],
      guide: '중장비 공회전을 줄이고 세척장 전력 피크를 낮추면 다음 레벨에 가장 빠르게 도달합니다.',
    },
    {
      key: 'S',
      title: 'Social',
      subtitle: '무사고 · 안전 교육 · 민원 대응',
      score: social,
      color: 'sky',
      icon: ShieldCheck,
      description: '근로자 안전, 민원 리스크, 보호구 지급 상태를 반영한 사회 점수입니다.',
      details: [
        { label: '안전 무사고', value: '87일', caption: '목표 90일 임박' },
        { label: '보호구 지급률', value: `${Math.max(72, zone.missionRate + 18)}%`, caption: '구역 투입 인원 기준' },
        { label: '민원 리스크', value: `${zone.risk}건`, caption: '소음/분진/동선 신고 포함' },
      ],
      guide: '보행 동선과 장비 진입 동선을 분리하고 민원 구역 모니터링을 유지하면 S 점수가 안정적으로 오릅니다.',
    },
    {
      key: 'G',
      title: 'Governance',
      subtitle: '작업일보 · 위험 추적 · 점검 기록',
      score: governance,
      color: 'violet',
      icon: Gauge,
      description: '작업 기록의 투명성, 위험 조치 추적, 점검 누락 여부를 반영한 거버넌스 점수입니다.',
      details: [
        { label: '작업일보 기록률', value: `${Math.min(98, Math.round(zone.score + 24))}%`, caption: '금일 공정 기록 기준' },
        { label: '위험 조치 완료', value: `${Math.max(0, 10 - zone.risk)}/10`, caption: 'AI 추천 조치 추적' },
        { label: '점검 누락', value: `${Math.max(0, zone.risk - 3)}건`, caption: '최근 7일 기준' },
      ],
      guide: '위험 조치 결과를 작업일보와 함께 남기면 현장 간 비교에서 G 점수가 크게 올라갑니다.',
    },
  ]
})

const zoneMetricCards = computed(() => {
  const zone = selectedZone.value
  const protectionRate = Math.max(72, zone.missionRate + 18)

  if (activeEsgKey.value === 'S') {
    return [
      {
        id: 'safe-days',
        title: '무사고 일수',
        subtitle: '목표 90일 임박',
        value: '87일',
        badge: '우수',
        icon: ShieldCheck,
        iconClass: 'bg-sky-50 text-sky-700',
        valueClass: 'text-sky-800',
      },
      {
        id: 'protection',
        title: '근로자 보호',
        subtitle: '안전 교육/보호구',
        value: `${protectionRate}%`,
        badge: '관리',
        icon: Users,
        iconClass: 'bg-emerald-50 text-emerald-700',
        valueClass: 'text-emerald-800',
      },
      {
        id: 'complaint',
        title: '민원 리스크',
        subtitle: '소음/분진 신고',
        value: `${zone.risk}건`,
        badge: zone.risk >= 7 ? '위험' : '관리',
        icon: AlertTriangle,
        iconClass: zone.risk >= 7 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
        valueClass: zone.risk >= 7 ? 'text-rose-700' : 'text-amber-700',
      },
      {
        id: 'education',
        title: '안전 교육',
        subtitle: '구역 투입 인원 기준',
        value: `${Math.min(98, zone.missionRate + 24)}%`,
        badge: '관리',
        icon: Medal,
        iconClass: 'bg-violet-50 text-violet-700',
        valueClass: 'text-violet-800',
      },
    ]
  }

  if (activeEsgKey.value === 'G') {
    return [
      {
        id: 'daily-log',
        title: '작업일보 기록률',
        subtitle: '금일 공정 기록',
        value: `${Math.min(98, Math.round(zone.score + 24))}%`,
        badge: '관리',
        icon: Gauge,
        iconClass: 'bg-violet-50 text-violet-700',
        valueClass: 'text-violet-800',
      },
      {
        id: 'action-done',
        title: '위험 조치 완료',
        subtitle: 'AI 추천 조치 추적',
        value: `${Math.max(0, 10 - zone.risk)}/10`,
        badge: zone.risk >= 7 ? '주의' : '우수',
        icon: ShieldCheck,
        iconClass: 'bg-emerald-50 text-emerald-700',
        valueClass: 'text-emerald-800',
      },
      {
        id: 'missing-check',
        title: '점검 누락',
        subtitle: '최근 7일 기준',
        value: `${Math.max(0, zone.risk - 3)}건`,
        badge: zone.risk >= 7 ? '위험' : '관리',
        icon: AlertTriangle,
        iconClass: zone.risk >= 7 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
        valueClass: zone.risk >= 7 ? 'text-rose-700' : 'text-amber-700',
      },
      {
        id: 'evidence',
        title: '증빙 이력',
        subtitle: '사진/점검표 업로드',
        value: `${Math.min(96, zone.missionRate + 30)}%`,
        badge: '관리',
        icon: Medal,
        iconClass: 'bg-sky-50 text-sky-700',
        valueClass: 'text-sky-800',
      },
    ]
  }

  return [
    {
      id: 'work-zone',
      title: zone.name,
      subtitle: zone.equipmentSummary || zone.type,
      value: `${zone.equipmentCount ?? 0}대`,
      badge: zone.status,
      icon: HardHat,
      iconClass: 'bg-emerald-50 text-emerald-700',
      valueClass: 'text-emerald-800',
    },
    {
      id: 'idle',
      title: '장비 공회전 영향',
      subtitle: zone.gateSummary || '게이트 배정 장비 기준',
      value: zone.equipmentCount ? `${zone.equipmentCount}대` : '연동 대기',
      badge: zone.risk >= 7 ? '위험' : zone.risk >= 4 ? '관리' : '정상',
      icon: Droplets,
      iconClass: zone.risk >= 7 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700',
      valueClass: zone.risk >= 7 ? 'text-rose-700' : 'text-emerald-800',
    },
    {
      id: 'process-risk',
      title: '공정 리스크',
      subtitle: '기상 영향 가능',
      value: `${zone.risk}건`,
      badge: zone.risk >= 7 ? '위험' : '관리',
      icon: AlertTriangle,
      iconClass: zone.risk >= 7 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
      valueClass: zone.risk >= 7 ? 'text-rose-700' : 'text-emerald-800',
    },
    {
      id: 'carbon',
      title: '탄소 저감량',
      subtitle: '공회전 감소 기준',
      value: `${zone.carbon}kg`,
      badge: '개선',
      icon: Leaf,
      iconClass: 'bg-emerald-50 text-emerald-700',
      valueClass: 'text-emerald-800',
    },
  ]
})

const missions = computed(() => buildZoneMissions(selectedZone.value, currentSite.value))

const rankingSummary = computed(() => buildRankingItems(sites.value, selectedSiteId.value))
const siteRankingItems = computed(() => rankingSummary.value.items)
const currentSiteRank = computed(() => rankingSummary.value.currentRank)
const rankComparison = computed(() => rankingSummary.value.comparison)

// feat: 누적 무사고 일수
const riskActions = computed(() => {
  const safeDays = 87
  
  return [
    {
      id: 'safety-days',
      title: '누적 무사고 일수',
      detail: `${safeDays}일 누적 무재해 운영 중`,
      level: '우수',
    },
  ]
})

async function loadDashboard() {
  loading.value = true
  try {
    const response = await api.get('/weather/dashboard', {
      params: { reportDate: reportDate.value },
    })
    dashboard.value = unwrapPayload(response)
    lastUpdatedAt.value = formatTime(new Date())
  } catch (error) {
    dashboard.value = null
  } finally {
    loading.value = false
  }
}

// feat: 오늘 투입 장비 로드 — 작업 지시서 기준 미션 달성률 계산용
async function loadEquipments() {
  try {
    const res = await getGateEquipments(reportDate.value)
    equipmentsData.value = Array.isArray(res) ? res : []
  } catch {
    equipmentsData.value = []
  }
}

// feat: 금일 공사일보 로드 — 공사 진행률 및 위험 항목 파악
async function loadReports() {
  try {
    const res = await api.get('/report/', { params: { date: reportDate.value } })
    const dbReports = Array.isArray(res) ? res : (res.data?.data || res.data || [])
    reportsData.value = dbReports.map(db => ({
      id: db.idx,
      workPlanId: db.workPlanId,
      date: db.reportDate,
      process: db.tradeType || '공정',
      workers: db.actualWorkerCount || 0,
      todayWork: db.todayWork || '',
      tomorrowPlan: db.tomorrowPlan || '',
      progress: db.todayProgress || 0,
      processProgress: db.actualProgress || 0,
      notes: db.issue || '',
      status: '제출 완료',
    }))
  } catch {
    reportsData.value = []
  }
}

// feat: 금일 작업지시 로드
async function loadWorkOrders() {
  try {
    const res = await api.get('/work-order', { params: { date: reportDate.value } })
    const dbWorkOrders = Array.isArray(res) ? res : (res.data?.data || res.data || [])
    workOrdersData.value = dbWorkOrders
  } catch {
    workOrdersData.value = []
  }
}


function refreshAll() {
  loadDashboard()
  loadEquipments()
  loadReports()
  loadWorkOrders()
}

function getTodayDateText() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function unwrapPayload(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload && ('success' in payload || 'isSuccess' in payload)) {
    return payload.data
  }
  return payload
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}

function colorClass(color, type) {
  const map = {
    emerald: {
      icon: 'bg-emerald-100 text-emerald-700',
      text: 'text-emerald-800',
      bar: 'bg-emerald-500',
      soft: 'bg-emerald-50 border-emerald-100',
    },
    sky: {
      icon: 'bg-sky-100 text-sky-700',
      text: 'text-sky-800',
      bar: 'bg-sky-500',
      soft: 'bg-sky-50 border-sky-100',
    },
    violet: {
      icon: 'bg-violet-100 text-violet-700',
      text: 'text-violet-800',
      bar: 'bg-violet-500',
      soft: 'bg-violet-50 border-violet-100',
    },
    lime: {
      icon: 'bg-lime-100 text-lime-700',
      text: 'text-lime-800',
      bar: 'bg-lime-500',
      soft: 'bg-lime-50 border-lime-100',
    },
  }
  return map[color]?.[type] ?? map.emerald[type]
}

function levelTone(level) {
  if (level === '경고' || level === '위험') return 'bg-rose-100 text-rose-800 border-rose-200'
  if (level === '주의' || level === '관리') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border-emerald-200'
}

onMounted(() => {
  refreshAll()
  refreshTimer = setInterval(() => {
    refreshAll()
  }, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

watch(reportDate, () => {
  refreshAll()
})

// feat: 실 작업구역 zones 로드 시 selectedZoneId 초기화 + 목동 현장 점수 갱신
watch(siteZones, (zones) => {
  if (!zones.length) return

  if (!zones.find((zone) => zone.id === selectedZoneId.value)) {
    selectedZoneId.value = zones[0].id
  }
}, { immediate: true })

watch(realDashboardZones, (zones) => {
  if (!zones.length) return

  // 목동 현장 점수를 관리구역 실데이터 평균으로 갱신
  const avgScore = Math.round(
    (zones.reduce((sum, z) => sum + z.score, 0) / zones.length) * 10
  ) / 10

  const mokIdx = sites.value.findIndex((s) => s.id === 'mokdong')
  if (mokIdx >= 0) {
    sites.value[mokIdx] = {
      ...sites.value[mokIdx],
      score: avgScore,
      level: resolveLevel(avgScore),
      powerSaving: zones.reduce((sum, z) => sum + z.powerSaving, 0),
      carbon: zones.reduce((sum, z) => sum + z.carbon, 0),
      riskCount: operatingRiskCount.value,
      missionRate: realMissionRate.value,
    }
  }
})
</script>

<template>
  <div class="min-h-screen space-y-5 bg-gradient-to-br from-slate-50 via-emerald-50/50 to-sky-50/50 p-5 pb-10">
    <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white shadow-card">
      <div class="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-300/10" />
      <div class="pointer-events-none absolute bottom-0 left-1/3 h-24 w-72 rounded-full bg-teal-200/10 blur-2xl" />

      <div class="relative flex flex-col gap-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="flex items-start gap-4">
            <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Leaf class="h-7 w-7" />
            </span>
            <div>
              <h1 class="text-3xl font-black tracking-tight">공사현장 ESG 대시보드</h1>
              <p class="mt-2 text-sm font-semibold text-emerald-100">
                {{ currentSite.shortName }} 현장 · 마지막 갱신 {{ lastUpdatedAt || '대기 중' }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <p class="text-[10px] font-bold text-emerald-100">현장</p>
              <p class="mt-1 text-sm font-black">{{ currentSite.shortName }} 현장</p>
            </div>
            <label class="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <div>
                <p class="text-[10px] font-bold text-emerald-100">기준 일자</p>
                <input v-model="reportDate" type="date" class="mt-1 bg-transparent text-sm font-black text-white focus:outline-none" />
              </div>
              <CalendarDays class="h-4 w-4 text-emerald-100" />
            </label>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-black ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-60"
              :disabled="loading"
              @click="refreshAll"
            >
              <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
              새로고침
            </button>
          </div>
        </div>

        <div class="grid gap-3 lg:grid-cols-4">
          <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
              <Trophy class="h-3.5 w-3.5 text-amber-300" />
              ESG 현장 점수
            </p>
            <p class="mt-2 text-4xl font-black tabular-nums">{{ currentSite.score }}<span class="text-lg text-emerald-100">/100</span></p>
            <p class="mt-1 text-xs text-emerald-100">Lv.{{ currentSite.level }} 시공 단계</p>
          </div>

          <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
              <Factory class="h-3.5 w-3.5 text-sky-200" />
              미세먼지 PM10
            </p>
            <p class="mt-2 text-4xl font-black tabular-nums">{{ airQuality?.value ?? 36 }}<span class="text-lg text-emerald-100">㎍/㎥</span></p>
            <p class="mt-1 text-xs text-emerald-100">{{ airQuality?.label || '보통' }}</p>
          </div>

          <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
              <ShieldCheck class="h-3.5 w-3.5 text-sky-200" />
              안전 무사고 일수
            </p>
            <p class="mt-2 text-4xl font-black tabular-nums">87<span class="text-lg text-emerald-100">일</span></p>
            <p class="mt-1 text-xs text-emerald-100">목표 90일 임박</p>
          </div>

          <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
              <AlertTriangle class="h-3.5 w-3.5 text-amber-200" />
              {{ zoneFocusMetric.title }}
            </p>
            <p class="mt-2 text-4xl font-black tabular-nums">{{ zoneFocusMetric.value }}<span class="text-lg text-emerald-100">{{ zoneFocusMetric.unit }}</span></p>
            <p class="mt-1 text-xs text-emerald-100">{{ zoneFocusMetric.caption }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)_380px]">
      <article class="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-card">
        <div class="flex items-start justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Field Level · 현장 빌딩</p>
            <h2 class="mt-1 text-xl font-black text-forena-900">{{ zoneGrowthTitle }}</h2>
          </div>
          <span class="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-black text-emerald-700">
            Lv.{{ activeLevel }}
          </span>
        </div>

        <div class="p-5">
          <div class="relative mx-auto h-72 max-w-[300px] overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 via-white to-emerald-50">
            <div class="absolute inset-x-8 top-8 h-px border-t border-dashed border-slate-200" />
            <div class="absolute inset-x-10 top-20 h-px border-t border-dashed border-slate-200" />
            <div class="absolute inset-x-12 top-32 h-px border-t border-dashed border-slate-200" />
            <span class="absolute right-7 top-6 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-center text-sm font-black leading-4 text-white shadow-xl ring-4 ring-white">
              Lv.<br />{{ activeLevel }}
            </span>

            <div class="absolute bottom-8 left-1/2 w-44 -translate-x-1/2">
              <div class="mx-auto flex h-52 w-32 flex-col-reverse justify-start gap-1.5">
                <div
                  v-for="floor in buildingFloors"
                  :key="floor"
                  class="relative h-6 transition-all duration-500"
                  :class="[
                    floor <= activeLevel
                      ? 'border-x-[5px] border-emerald-950 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-sm'
                      : 'border border-dashed border-slate-200 bg-white/45',
                    floor === activeLevel ? 'border-t-[5px] border-emerald-950' : '',
                    floor === 1 && floor <= activeLevel ? 'rounded-b-sm' : '',
                  ]"
                >
                  <div class="absolute inset-x-2 top-1.5 grid grid-cols-3 gap-1">
                    <span
                      v-for="window in 3"
                      :key="window"
                      class="h-2.5 rounded-[2px]"
                      :class="floor <= activeLevel ? 'bg-emerald-100' : 'bg-slate-100/80'"
                    />
                  </div>
                </div>
              </div>
              <div class="mx-auto mt-1 h-3 w-32 rounded-sm bg-forena-900" />
              <div class="mx-auto h-1.5 w-44 rounded-full bg-slate-400" />
              <div class="mx-auto mt-1 h-1 w-36 rounded-full bg-slate-300" />
            </div>
          </div>

          <div class="mt-5 text-center">
            <h3 class="text-xl font-black text-forena-900">{{ zoneStage.title }}</h3>
            <p class="mt-2 text-sm font-medium text-forena-600">
              현재 점수 <span class="font-black text-emerald-700">{{ activeScore }}</span>점 · 다음 레벨까지
              <span class="font-black text-emerald-700">{{ nextLevelPoint }}</span>점 남음
            </p>
          </div>

          <div class="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${levelProgress}%` }" />
          </div>

          <div class="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p class="flex items-center gap-2 text-sm font-black text-emerald-900">
              <Sparkles class="h-4 w-4" />
              레벨업 가이드
            </p>
            <p class="mt-1 text-xs leading-6 text-emerald-700">
              {{ zoneStage.guide }}
            </p>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-forena-100 bg-white p-6 shadow-card">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wide text-forena-700">ESG Score</p>
            <h2 class="mt-1 text-2xl font-black text-forena-900">{{ selectedZone.name }} 점수 분해</h2>
            <p class="mt-1 text-xs font-semibold text-forena-500">{{ selectedZone.type }} · {{ selectedZone.status }} 단계</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
              관리구역 기준
            </span>
            <div class="relative min-w-[170px]">
              <label class="sr-only" for="zone-select">관리구역 선택</label>
              <select
                id="zone-select"
                v-model="selectedZoneId"
                class="h-9 w-full appearance-none rounded-full border border-forena-200 bg-white px-3 pr-9 text-xs font-black text-forena-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option v-for="zone in siteZones" :key="zone.id" :value="zone.id">
                  {{ zone.name }}
                </option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forena-500" />
            </div>
          </div>
        </div>

        <div
          v-if="selectedZone?.isEmpty"
          class="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800"
        >
          금일 작업지시서 장비·게이트 데이터가 아직 연결되지 않았습니다. work_order와 work_order_equipment가 연결되면 작업위치 기준으로 자동 전환됩니다.
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-3">
          <button
            v-for="item in esgBreakdown"
            :key="item.key"
            type="button"
            class="min-h-[150px] rounded-2xl border p-5 text-left transition"
            :class="activeEsgKey === item.key ? `${colorClass(item.color, 'soft')} shadow-sm ring-2 ring-emerald-100` : `${colorClass(item.color, 'soft')} opacity-85 hover:opacity-100`"
            @click="activeEsgKey = item.key"
          >
            <div class="flex items-start justify-between">
              <span class="flex h-12 w-12 items-center justify-center rounded-xl" :class="colorClass(item.color, 'icon')">
                <component :is="item.icon" class="h-5 w-5" />
              </span>
              <p class="text-3xl font-black tabular-nums" :class="colorClass(item.color, 'text')">{{ item.score }}</p>
            </div>
            <p class="mt-4 text-base font-black text-forena-900">{{ item.key }} · {{ item.title }}</p>
            <p class="mt-1 text-[11px] leading-5 text-forena-500">{{ item.subtitle }}</p>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
              <div class="h-full rounded-full" :class="colorClass(item.color, 'bar')" :style="{ width: `${item.score}%` }" />
            </div>
          </button>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div
            v-for="card in zoneMetricCards"
            :key="card.id"
            class="rounded-2xl border border-forena-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-start gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" :class="card.iconClass">
                  <component :is="card.icon" class="h-5 w-5" />
                </span>
                <div class="min-w-0">
                  <p class="truncate text-base font-black text-forena-900">{{ card.title }}</p>
                  <p class="mt-0.5 text-xs font-semibold text-forena-500">{{ card.subtitle }}</p>
                </div>
              </div>
              <span class="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black" :class="levelTone(card.badge)">
                {{ card.badge }}
              </span>
            </div>
            <p class="mt-4 text-3xl font-black tabular-nums" :class="card.valueClass">{{ card.value }}</p>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-amber-100 bg-white p-5 shadow-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wide text-amber-600">Rival · 현장 대결</p>
            <h2 class="mt-1 text-xl font-black text-forena-900">공사현장 ESG 순위</h2>
          </div>
          <span class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
            공사현장 비교
          </span>
        </div>

        <div class="mt-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-lg">
          <div class="flex items-center justify-between gap-3">
            <p class="flex items-center gap-2 text-sm font-black text-emerald-100">
              <Target class="h-4 w-4" />
              내 순위
            </p>
            <p class="text-3xl font-black tabular-nums">{{ currentSiteRank }}위</p>
          </div>
          <p class="mt-3 text-sm font-black">
            {{ rankComparison }}
          </p>
        </div>

        <div class="mt-4 space-y-3">
          <div
            v-for="(item, index) in siteRankingItems"
            :key="item.id"
            class="rounded-2xl border p-3 transition"
            :class="item.id === selectedSiteId ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100' : 'border-forena-100 bg-white'"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                :class="index === 0 ? 'bg-amber-100 text-amber-700' : item.id === selectedSiteId ? 'bg-sky-100 text-sky-700' : 'bg-forena-100 text-forena-700'"
              >
                <Trophy v-if="index === 0" class="h-4 w-4" />
                <span v-else>{{ index + 1 }}</span>
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-2">
                  <p class="truncate text-sm font-black text-forena-900">{{ item.name }}</p>
                  <span
                    v-if="item.id === selectedSiteId"
                    class="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white"
                  >
                    현재
                  </span>
                </div>
                <p class="mt-0.5 text-[11px] text-forena-500">{{ item.address }}</p>
              </div>
              <p class="text-lg font-black tabular-nums text-emerald-800">{{ item.score }}</p>
            </div>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-forena-100">
              <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${item.score}%` }" />
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <article class="rounded-2xl border border-forena-100 bg-white p-5 shadow-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Mission</p>
            <h2 class="mt-1 text-xl font-black text-forena-900">{{ selectedZone.name }} ESG 미션</h2>
          </div>
          <Target class="h-6 w-6 text-emerald-600" />
        </div>

        <div
          v-if="selectedZone?.isEmpty"
          class="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800"
        >
          금일 작업지시서 장비·게이트 데이터가 아직 연결되지 않았습니다. work_order와 work_order_equipment가 연결되면 작업위치 기준으로 자동 전환됩니다.
        </div>

        <div class="mt-5 grid gap-3 lg:grid-cols-3">
          <div
            v-for="mission in missions"
            :key="mission.id"
            class="rounded-2xl border p-4"
            :class="colorClass(mission.color, 'soft')"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-black text-forena-900">{{ mission.title }}</p>
                <p class="mt-1 text-[11px] text-forena-500">{{ mission.description }}</p>
              </div>
              <p class="text-lg font-black tabular-nums" :class="colorClass(mission.color, 'text')">{{ mission.progress }}%</p>
            </div>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-white">
              <div class="h-full rounded-full" :class="colorClass(mission.color, 'bar')" :style="{ width: `${mission.progress}%` }" />
            </div>
          </div>
        </div>
      </article>

      <article class="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-card ring-1 ring-emerald-100">
        <div class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/30 blur-xl" />
        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Safety</p>
            <h2 class="mt-1 text-xl font-black text-forena-900">누적 무사고 일수</h2>
          </div>
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
            <ShieldCheck class="h-6 w-6" />
          </span>
        </div>

        <div class="relative mt-5 space-y-3">
          <div
            v-for="action in riskActions"
            :key="action.id"
            class="rounded-2xl border border-emerald-200 bg-white/85 p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-black text-emerald-900">{{ action.title }}</p>
                <p class="mt-2 text-5xl font-black tracking-tight text-emerald-700 tabular-nums">87<span class="text-xl text-emerald-600">일</span></p>
                <p class="mt-2 text-xs leading-5 text-emerald-700/80">{{ action.detail }}</p>
              </div>
              <span class="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold" :class="levelTone(action.level)">
                {{ action.level }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-2xl border border-forena-100 bg-white p-5 shadow-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wide text-forena-500">Competition Log</p>
          <h2 class="mt-1 text-xl font-black text-forena-900">현장 ESG 성과 요약</h2>
        </div>
        <span class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <ArrowUpRight class="h-3.5 w-3.5" />
          {{ currentSite.shortName }} 현장 {{ currentSite.trend }}점 상승
        </span>
      </div>

      <div class="mt-5 overflow-x-auto">
        <table class="w-full min-w-[760px] text-sm">
          <thead>
            <tr class="border-b border-forena-100 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">
              <th class="py-3 pr-4">구분</th>
              <th class="py-3 pr-4">대상</th>
              <th class="py-3 pr-4">ESG 점수</th>
              <th class="py-3 pr-4">레벨</th>
              <th class="py-3 pr-4">주요 기여</th>
              <th class="py-3 text-right">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="zone in siteZones"
              :key="zone.id"
              class="border-b border-forena-50 transition hover:bg-forena-50/40"
            >
              <td class="py-3 pr-4">
                <span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                  <Medal class="h-3 w-3" />
                  {{ zone.rank }}위
                </span>
              </td>
              <td class="py-3 pr-4">
                <p class="font-bold text-forena-900">{{ zone.name }}</p>
                <p class="mt-0.5 text-[11px] text-forena-500">{{ zone.type }}</p>
              </td>
              <td class="py-3 pr-4 font-black tabular-nums text-emerald-800">{{ zone.score }}</td>
              <td class="py-3 pr-4">
                <span class="rounded-full border border-forena-200 bg-white px-2 py-0.5 text-[11px] font-bold text-forena-700">
                  Lv.{{ zone.level }}
                </span>
              </td>
              <td class="py-3 pr-4 text-xs text-forena-600">
                탄소 {{ zone.carbon }}kg · 전력 {{ zone.powerSaving }}kWh · 리스크 {{ zone.risk }}건
              </td>
              <td class="py-3 text-right">
                <span class="rounded-full border px-2.5 py-1 text-[11px] font-bold" :class="levelTone(zone.status)">
                  {{ zone.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>