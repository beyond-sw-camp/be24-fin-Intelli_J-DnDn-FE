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

const reportDate = ref(getTodayDateText())
const loading = ref(false)
const lastUpdatedAt = ref('')
const dashboard = ref(null)
const selectedSiteId = ref('mokdong')
const selectedZoneId = ref('zone-a')
const activeEsgKey = ref('E')
let refreshTimer = null

const LEVEL_THRESHOLDS = [0, 30, 50, 65, 78, 88, 95, 100]

const sites = ref([
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
])

const zones = ref([
  {
    id: 'zone-a',
    siteId: 'mokdong',
    name: 'A 게이트',
    type: '차량 대기 동선',
    score: 62.0,
    level: 3,
    rank: 1,
    carbon: 18,
    powerSaving: 74,
    risk: 3,
    missionRate: 62,
    lead: 0,
    status: '시공',
  },
  {
    id: 'zone-b',
    siteId: 'mokdong',
    name: '골조 구역',
    type: '양중 작업 가능',
    score: 58.5,
    level: 3,
    rank: 2,
    carbon: 14,
    powerSaving: 61,
    risk: 5,
    missionRate: 58,
    lead: -3.5,
    status: '관리',
  },
  {
    id: 'zone-c',
    siteId: 'mokdong',
    name: '세척장',
    type: '전력 절감 강화',
    score: 66.3,
    level: 3,
    rank: 3,
    carbon: 22,
    powerSaving: 86,
    risk: 4,
    missionRate: 66,
    lead: 4.3,
    status: '우수',
  },
  {
    id: 'zone-d',
    siteId: 'mokdong',
    name: '민원 구역',
    type: '소음/먼지 감시',
    score: 55.8,
    level: 2,
    rank: 4,
    carbon: 11,
    powerSaving: 45,
    risk: 8,
    missionRate: 52,
    lead: -6.2,
    status: '위험',
  },
  {
    id: 'deungchon-a',
    siteId: 'deungchon',
    name: 'A 동 골조',
    type: '양중 작업 집중',
    score: 78.2,
    level: 3,
    rank: 1,
    carbon: 34,
    powerSaving: 98,
    risk: 5,
    missionRate: 70,
    lead: 2.4,
    status: '관리',
  },
  {
    id: 'deungchon-b',
    siteId: 'deungchon',
    name: 'B 동 외부',
    type: '비산먼지 관리',
    score: 72.6,
    level: 3,
    rank: 2,
    carbon: 24,
    powerSaving: 73,
    risk: 8,
    missionRate: 59,
    lead: -1.2,
    status: '주의',
  },
  {
    id: 'sindaebang-a',
    siteId: 'sindaebang',
    name: '업무동 코어',
    type: '전력 사용 집중',
    score: 74.9,
    level: 3,
    rank: 1,
    carbon: 30,
    powerSaving: 76,
    risk: 6,
    missionRate: 64,
    lead: 1.9,
    status: '관리',
  },
  {
    id: 'sindaebang-b',
    siteId: 'sindaebang',
    name: '지하 굴착',
    type: '배수·안전 통제',
    score: 68.4,
    level: 2,
    rank: 2,
    carbon: 21,
    powerSaving: 58,
    risk: 9,
    missionRate: 55,
    lead: -2.8,
    status: '위험',
  },
])

const currentSite = computed(() => sites.value.find((site) => site.id === selectedSiteId.value) ?? sites.value[0])
const siteZones = computed(() => zones.value.filter((zone) => zone.siteId === currentSite.value.id))
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
  const index = LEVEL_THRESHOLDS.findLastIndex((score) => activeScore.value >= score)
  return Math.max(1, Math.min(7, index + 1))
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
  const idleMinutes = Math.max(8, 24 - zone.level * 3)
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
      id: 'gate',
      title: zone.name,
      subtitle: zone.type,
      value: `대기 ${idleMinutes}분`,
      badge: zone.status,
      icon: HardHat,
      iconClass: 'bg-emerald-50 text-emerald-700',
      valueClass: 'text-emerald-800',
    },
    {
      id: 'wash',
      title: '세척장',
      subtitle: '전력 절감 강화',
      value: `-${currentSite.value.powerSaving}kWh`,
      badge: '우수',
      icon: Droplets,
      iconClass: 'bg-emerald-50 text-emerald-700',
      valueClass: 'text-emerald-800',
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

const missions = computed(() => [
  {
    id: 'idle',
    title: '장비 대기시간 20% 줄이기',
    description: '입출차 대기 흐름 개선',
    progress: selectedZone.value.missionRate,
    color: 'emerald',
  },
  {
    id: 'power',
    title: '세척장 전력 절감 25% 달성',
    description: '세척 설비 가동 최적화',
    progress: Math.min(100, Math.round(currentSite.value.powerSaving / 1.55)),
    color: 'lime',
  },
  {
    id: 'complaint',
    title: '민원 경고 이하 유지',
    description: '소음·먼지 기준 관리',
    progress: Math.max(40, 100 - selectedZone.value.risk * 8),
    color: 'sky',
  },
])

const siteRankingItems = computed(() => [...sites.value].sort((a, b) => b.score - a.score))
const siteLeader = computed(() => siteRankingItems.value[0])
const currentSiteRank = computed(() => {
  return siteRankingItems.value.findIndex((site) => site.id === selectedSiteId.value) + 1
})
const scoreGapToLeader = computed(() => {
  return Math.max(0, (siteLeader.value?.score ?? currentSite.value.score) - currentSite.value.score).toFixed(1)
})

const riskActions = computed(() => {
  const risks = [...equipmentRisks.value, ...planRisks.value].slice(0, 3)
  if (risks.length) {
    return risks.map((risk, index) => ({
      id: `risk-${index}`,
      title: risk.title || risk.reason || '기상 연동 위험 항목',
      detail: risk.action || risk.subtitle || '작업 계획과 장비 운용 조건을 다시 확인하세요.',
      level: risk.level || '주의',
    }))
  }

  if (weatherImpact.value.score >= 2) {
    return [
      {
        id: 'weather',
        title: '기상 조건에 따른 작업 순서 조정',
        detail: '강수·풍속·미세먼지 기준을 반영해 외부 작업 우선순위를 조정하세요.',
        level: weatherImpact.value.score >= 4 ? '경고' : '주의',
      },
    ]
  }

  return [
    {
      id: 'stable',
      title: '현재 기상 조건은 평시 운용 범위',
      detail: '장비 대기시간과 세척 전력 절감 미션 중심으로 관리하면 됩니다.',
      level: '양호',
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
  loadDashboard()
  refreshTimer = setInterval(loadDashboard, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

watch(reportDate, loadDashboard)
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
              @click="loadDashboard"
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
              운영 리스크
            </p>
            <p class="mt-2 text-4xl font-black tabular-nums">{{ currentSite.riskCount }}<span class="text-lg text-emerald-100">건</span></p>
            <p class="mt-1 text-xs text-emerald-100">기상 기반 자동 검출</p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)_380px]">
      <article class="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-card">
        <div class="flex items-start justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Field Level · 현장 빌딩</p>
            <h2 class="mt-1 text-xl font-black text-forena-900">ESG 빌딩 성장</h2>
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
            <h3 class="text-xl font-black text-forena-900">시공 단계</h3>
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
              중장비 공회전을 낮추고 탄소 배출을 줄이면 다음 층이 올라갑니다.
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
              작업구역 기준
            </span>
            <div class="relative min-w-[170px]">
              <label class="sr-only" for="zone-select">작업구역 선택</label>
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
            <h2 class="mt-1 text-xl font-black text-forena-900">현장 ESG 순위</h2>
          </div>
          <span class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
            임시 데이터
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
            {{ siteLeader.name }}까지 {{ scoreGapToLeader }}점 부족
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
            <h2 class="mt-1 text-xl font-black text-forena-900">이번 주 ESG 미션</h2>
          </div>
          <Target class="h-6 w-6 text-emerald-600" />
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

      <article class="rounded-2xl border border-forena-100 bg-white p-5 shadow-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wide text-rose-700">Action</p>
            <h2 class="mt-1 text-xl font-black text-forena-900">기상 기반 즉시 조치</h2>
          </div>
          <Zap class="h-6 w-6 text-rose-500" />
        </div>

        <div class="mt-4 space-y-3">
          <div
            v-for="action in riskActions"
            :key="action.id"
            class="rounded-2xl border border-forena-100 bg-forena-50/40 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-black text-forena-900">{{ action.title }}</p>
                <p class="mt-1 text-xs leading-5 text-forena-500">{{ action.detail }}</p>
              </div>
              <span class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold" :class="levelTone(action.level)">
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
