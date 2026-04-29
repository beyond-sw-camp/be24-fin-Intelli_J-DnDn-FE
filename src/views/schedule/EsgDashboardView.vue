<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Leaf,
  Users,
  ShieldCheck,
  Truck,
  CloudSun,
  Wind,
  Droplets,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
  Gauge,
  Factory,
  HardHat,
  ClipboardList,
  RefreshCw,
} from 'lucide-vue-next'

// ─── 기본 설정 ─────────────────────────────────────────────────────────────────
const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081').replace(/\/$/, '')

function getTodayDateText() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const T = {
  title: 'ESG · 기상 통합 대시보드',
  desc: '환경(E)·사회(S)·지배구조(G) 지표를 실시간 기상 관제 및 중장비 입출차 데이터와 연계해 한 화면에서 보여줍니다.',
  refresh: '새로고침',
  liveTag: '실시간',
  cycleTag: '30분 주기 갱신',
}

// ─── 상태 ─────────────────────────────────────────────────────────────────────
const reportDate = ref(getTodayDateText())
const loading = ref(false)
const lastUpdatedAt = ref('')

const weather = ref(null)
const workLogList = ref([])
const workLogHistory = ref([])

// 중장비 입출차 (현재 백엔드 API 미연동 상태이므로 UI 데모 데이터 유지)
const equipments = ref([
  { id: 1, name: 'CAT 320 굴착기', type: '굴착기', status: '작업중', gate: 'Gate 5 (토목)', partner: '동남건기', powered: true },
  { id: 2, name: 'HYUNDAI 25T 덤프', type: '덤프트럭', status: '대기', gate: 'Gate 4 (자재)', partner: '한빛로지스', powered: false },
  { id: 3, name: 'VOLVO 휠로더 L90', type: '휠로더', status: '작업중', gate: 'Gate 2 (서측)', partner: '서진중기', powered: true },
  { id: 4, name: 'KOBELCO 50T 크레인', type: '크레인', status: '입차예정', gate: 'Gate 1 (정문)', partner: '대흥크레인', powered: false },
  { id: 5, name: 'DOOSAN 5T 지게차', type: '지게차', status: '작업중', gate: 'Gate 3 (동측)', partner: '대성중기', powered: true },
])

// ─── 데이터 로드 ─────────────────────────────────────────────────────────────
async function loadWeather() {
  try {
    const response = await fetch(`${API_BASE_URL}/weather/dashboard?reportDate=${reportDate.value}`)
    if (!response.ok) throw new Error('기상 관제 조회 실패')
    weather.value = await response.json()
  } catch (error) {
    console.error(error)
    weather.value = null
  }
}

async function loadWorkLogList() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/worklog/list?reportDate=${reportDate.value}`)
    if (!response.ok) throw new Error('작업 일보 조회 실패')
    const data = await response.json()
    workLogList.value = Array.isArray(data.workList) ? data.workList : []
  } catch (error) {
    console.error(error)
    workLogList.value = []
  }
}

async function loadWorkLogHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/worklog/history?reportDate=${reportDate.value}`)
    if (!response.ok) throw new Error('작업 이력 조회 실패')
    const data = await response.json()
    workLogHistory.value = Array.isArray(data.history) ? data.history : []
  } catch (error) {
    console.error(error)
    workLogHistory.value = []
  }
}

async function loadAll() {
  loading.value = true
  try {
    await Promise.all([loadWeather(), loadWorkLogList(), loadWorkLogHistory()])
    const now = new Date()
    lastUpdatedAt.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  } finally {
    loading.value = false
  }
}

// 30분 주기 자동 갱신
let refreshTimer = null
onMounted(() => {
  loadAll()
  refreshTimer = setInterval(loadAll, 30 * 60 * 1000)
})
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

watch(reportDate, loadAll)

// ─── 파생값 ─────────────────────────────────────────────────────────────────
const analysis = computed(() => weather.value?.analysis ?? null)
const airQuality = computed(() => weather.value?.airQuality ?? null)
const todayCard = computed(() => weather.value?.today ?? null)
const equipmentRisks = computed(() => weather.value?.equipmentRisks ?? [])
const planRisks = computed(() => weather.value?.planRisks ?? [])

// 환경(E) - 기상 기반 탄소·분진 저감 지표
const environmentMetrics = computed(() => {
  const fineDust = airQuality.value?.value ?? null
  const rainProb = analysis.value?.precipitationProbability ?? 0
  const wind = analysis.value?.maxWindSpeed ?? 0

  // 우천/강풍 시 운휴 장비 비율 (탄소 절감 환산)
  const idleEquipments = equipments.value.filter((eq) => !eq.powered).length
  const carbonReduction = Math.round((idleEquipments / Math.max(1, equipments.value.length)) * 100)

  // 분진 저감 권장 살수 횟수 (PM10 기반)
  const sprayCount = fineDust == null ? 0 : fineDust >= 80 ? 6 : fineDust >= 50 ? 4 : 2

  // 우천 폐기물 유출 방지 점수
  const wasteScore = rainProb >= 70 ? 75 : rainProb >= 40 ? 88 : 95

  return {
    carbonReduction,
    carbonLabel: idleEquipments > 0
      ? `${idleEquipments}대 자율 운휴 적용`
      : '전체 가동 중 (절감 없음)',
    sprayCount,
    spraySource: fineDust == null ? 'PM10 미수신' : `PM10 ${fineDust}㎍/㎥ 기준`,
    wasteScore,
    wasteSource: rainProb >= 70 ? '우천 시 유출 위험 점검 강화' : '강수 영향 낮음',
    wind,
  }
})

// 사회(S) - 근로자 안전·보호 지표
const socialMetrics = computed(() => {
  const heatRisk = analysis.value?.heatRisk ?? false
  const coldRisk = analysis.value?.coldRisk ?? false
  const fineDust = airQuality.value?.value ?? null

  const timeShiftActive = heatRisk || coldRisk
  const ppeRate = fineDust != null && fineDust >= 80 ? 100 : 92
  const ppeNote = fineDust != null && fineDust >= 80 ? 'KF94 이상 전원 지급' : '일반 보호구 운영'

  // 무사고 일수 (작업이력 기반 — 데모용 고정값에 history 길이 반영)
  const safeDays = 87 + Math.min(workLogHistory.value.length, 7)

  return {
    timeShiftActive,
    timeShiftLabel: heatRisk ? '폭염 시간대 작업 분산' : coldRisk ? '한파 시간대 작업 분산' : '정상 시간대 운영',
    ppeRate,
    ppeNote,
    safeDays,
    eduRate: 94,
  }
})

// 지배구조(G) - 기록·투명성 지표
const governanceMetrics = computed(() => {
  const totalLogs = workLogList.value.length
  const completedLogs = workLogList.value.filter((log) => log.workStatus === '완료').length
  const completionRate = totalLogs === 0 ? 0 : Math.round((completedLogs / totalLogs) * 100)

  const aiRiskCount = (equipmentRisks.value?.length ?? 0) + (planRisks.value?.length ?? 0)

  return {
    autoRecordRate: totalLogs === 0 ? 0 : 98,
    completionRate,
    totalLogs,
    completedLogs,
    aiRiskCount,
    historyDays: workLogHistory.value.length,
  }
})

// ESG 종합 점수 산정 (간단 가중치)
const esgOverall = computed(() => {
  const e = (environmentMetrics.value.wasteScore + (environmentMetrics.value.sprayCount >= 4 ? 90 : 75)) / 2
  const s = (socialMetrics.value.ppeRate + socialMetrics.value.eduRate) / 2
  const g = (governanceMetrics.value.autoRecordRate + governanceMetrics.value.completionRate) / 2
  const total = Math.round(e * 0.35 + s * 0.35 + g * 0.3)

  let grade = 'C'
  if (total >= 92) grade = 'A+'
  else if (total >= 85) grade = 'A'
  else if (total >= 78) grade = 'B+'
  else if (total >= 70) grade = 'B'
  else if (total >= 60) grade = 'C+'

  return { e: Math.round(e), s: Math.round(s), g: Math.round(g), total, grade }
})

// 기상 영향도 종합
const weatherImpactLevel = computed(() => {
  if (!analysis.value) return { label: '데이터 없음', tone: 'text-slate-600 bg-slate-100 border-slate-200' }

  let score = 0
  if (analysis.value.hasRain || analysis.value.precipitationProbability >= 60) score += 2
  if (analysis.value.windRisk || analysis.value.maxWindSpeed >= 8) score += 2
  if (analysis.value.hasSnow) score += 2
  if (analysis.value.heatRisk) score += 1
  if (analysis.value.coldRisk) score += 1
  if (analysis.value.fineDustRisk) score += 1

  if (score >= 4) return { label: '높음', tone: 'text-rose-700 bg-rose-50 border-rose-200' }
  if (score >= 2) return { label: '보통', tone: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { label: '낮음', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
})

// 등급별 색상
function gradeTone(grade) {
  if (grade === 'A+' || grade === 'A') return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (grade === 'B+' || grade === 'B') return 'text-sky-700 bg-sky-50 border-sky-200'
  if (grade === 'C+' || grade === 'C') return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-rose-700 bg-rose-50 border-rose-200'
}

function levelBadgeClass(level) {
  if (level === '경고' || level === '제한') return 'bg-rose-600 text-white'
  if (level === '주의') return 'bg-amber-100 text-amber-900'
  return 'bg-emerald-100 text-emerald-900'
}

function progressBarClass(rate) {
  if (rate >= 90) return 'bg-emerald-500'
  if (rate >= 70) return 'bg-sky-500'
  if (rate >= 50) return 'bg-amber-400'
  return 'bg-rose-400'
}

// 장비 가동 현황 집계
const equipmentSummary = computed(() => {
  const total = equipments.value.length
  const powered = equipments.value.filter((eq) => eq.powered).length
  const idle = total - powered
  return { total, powered, idle, idleRatio: Math.round((idle / Math.max(1, total)) * 100) }
})
</script>

<template>
  <div class="space-y-5 pb-10">
    <!-- 헤더 -->
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-emerald-50/40 to-flare-50/30 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-flare-500 to-forena-500"
      />
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-flare-600 text-white shadow-md"
          >
            <Leaf class="h-5 w-5" />
          </span>
          <div>
            <h1 class="text-gradient-brand text-2xl font-bold tracking-tight">{{ T.title }}</h1>
            <p class="mt-1 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm"
          >
            <span class="relative flex h-2 w-2">
              <span class="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span class="relative h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {{ T.liveTag }}
          </span>
          <span class="text-xs font-medium text-forena-500">{{ T.cycleTag }}</span>
          <span v-if="lastUpdatedAt" class="text-xs text-forena-400">갱신 {{ lastUpdatedAt }}</span>

          <label class="flex items-center gap-2 rounded-xl border border-forena-200 bg-white px-3 py-1.5 shadow-sm">
            <span class="text-[10px] font-bold uppercase tracking-wide text-forena-500">기준</span>
            <input
              v-model="reportDate"
              type="date"
              class="text-sm text-forena-800 focus:outline-none"
            />
          </label>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-1.5 text-xs font-bold text-forena-700 shadow-sm transition hover:bg-forena-50"
            :disabled="loading"
            @click="loadAll"
          >
            <RefreshCw class="h-3.5 w-3.5" :class="loading ? 'animate-spin' : ''" />
            {{ T.refresh }}
          </button>
        </div>
      </div>
    </div>

    <!-- ESG 종합 + 기상 요약 KPI -->
    <div class="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
      <!-- ESG 종합 점수 카드 -->
      <article
        class="relative overflow-hidden rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-flare-50/40 p-6 shadow-card"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wide text-emerald-700">ESG 종합 점수</p>
            <p class="mt-1 text-xs leading-relaxed text-forena-600">기상·장비·작업기록 통합 산정</p>
          </div>
          <span
            class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold"
            :class="gradeTone(esgOverall.grade)"
          >
            <Sparkles class="h-3 w-3" />
            {{ esgOverall.grade }}
          </span>
        </div>

        <div class="mt-4 flex items-baseline gap-3">
          <p class="text-5xl font-extrabold tabular-nums text-forena-900">{{ esgOverall.total }}</p>
          <p class="text-base font-bold text-forena-500">/ 100</p>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2">
          <div class="rounded-lg border border-emerald-200/70 bg-white px-3 py-2 text-center">
            <p class="text-[10px] font-bold text-emerald-700">E · 환경</p>
            <p class="mt-0.5 tabular-nums text-lg font-bold text-emerald-900">{{ esgOverall.e }}</p>
          </div>
          <div class="rounded-lg border border-sky-200/70 bg-white px-3 py-2 text-center">
            <p class="text-[10px] font-bold text-sky-700">S · 사회</p>
            <p class="mt-0.5 tabular-nums text-lg font-bold text-sky-900">{{ esgOverall.s }}</p>
          </div>
          <div class="rounded-lg border border-violet-200/70 bg-white px-3 py-2 text-center">
            <p class="text-[10px] font-bold text-violet-700">G · 지배</p>
            <p class="mt-0.5 tabular-nums text-lg font-bold text-violet-900">{{ esgOverall.g }}</p>
          </div>
        </div>
      </article>

      <!-- 기상 요약 4분할 -->
      <div class="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4">
        <article class="flex flex-col rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card">
          <div class="flex items-center gap-2">
            <CloudSun class="h-4 w-4 text-forena-400" />
            <p class="text-[11px] font-bold text-forena-500">기상 영향도</p>
          </div>
          <p class="mt-3 text-2xl font-bold text-forena-900">{{ weatherImpactLevel.label }}</p>
          <span
            class="mt-2 w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold"
            :class="weatherImpactLevel.tone"
          >
            현장 운영 영향
          </span>
        </article>

        <article class="flex flex-col rounded-2xl border border-sky-100/90 bg-gradient-to-br from-sky-50 to-cyan-50 p-4 shadow-card">
          <div class="flex items-center gap-2">
            <Droplets class="h-4 w-4 text-sky-500" />
            <p class="text-[11px] font-bold text-sky-800">강수 확률</p>
          </div>
          <p class="mt-3 tabular-nums text-2xl font-extrabold text-sky-900">
            {{ analysis?.precipitationProbability ?? 0 }}%
          </p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
            <div
              class="h-full rounded-full bg-sky-400 transition-all duration-500"
              :style="{ width: `${Math.min(100, analysis?.precipitationProbability ?? 0)}%` }"
            />
          </div>
        </article>

        <article class="flex flex-col rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 shadow-card">
          <div class="flex items-center gap-2">
            <Factory class="h-4 w-4 text-violet-500" />
            <p class="text-[11px] font-bold text-violet-800">미세먼지 PM10</p>
          </div>
          <p class="mt-3 tabular-nums text-2xl font-extrabold text-violet-900">
            <template v-if="airQuality?.value != null">{{ airQuality.value }}<span class="text-sm font-normal">㎍/㎥</span></template>
            <template v-else>–</template>
          </p>
          <p class="mt-1 text-xs text-violet-700/80">{{ airQuality?.label || 'API 미수신' }}</p>
        </article>

        <article class="flex flex-col rounded-2xl border border-amber-100/90 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-card">
          <div class="flex items-center gap-2">
            <Wind class="h-4 w-4 text-amber-600" />
            <p class="text-[11px] font-bold text-amber-800">최대 풍속</p>
          </div>
          <p class="mt-3 tabular-nums text-2xl font-extrabold text-amber-900">
            {{ Number(analysis?.maxWindSpeed ?? 0).toFixed(1) }}<span class="text-sm font-normal">m/s</span>
          </p>
          <p class="mt-1 text-xs text-amber-700/80">
            {{ (analysis?.maxWindSpeed ?? 0) >= 10 ? '강풍 양중 제한' : (analysis?.maxWindSpeed ?? 0) >= 8 ? '고소 작업 주의' : '정상 운용 범위' }}
          </p>
        </article>
      </div>
    </div>

    <!-- E · S · G 3-column 메인 영역 -->
    <div class="grid gap-4 xl:grid-cols-3">
      <!-- 환경 (E) -->
      <article class="overflow-hidden rounded-2xl border border-emerald-100/90 bg-white/95 shadow-card">
        <div class="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-flare-50/40 px-5 py-3">
          <div class="flex items-center justify-between">
            <h2 class="flex items-center gap-2 text-sm font-extrabold text-emerald-900">
              <Leaf class="h-4 w-4 text-emerald-600" />
              E · 환경 Environment
            </h2>
            <span class="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              기상 연동
            </span>
          </div>
          <p class="mt-1 text-[11px] text-emerald-700/70">날씨·장비 가동 기반 환경 영향도</p>
        </div>

        <div class="space-y-3 p-4">
          <!-- 탄소 배출 절감 -->
          <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold text-emerald-900">탄소 배출 절감 (장비 운휴)</p>
                <p class="mt-0.5 text-[10px] text-emerald-700/80">{{ environmentMetrics.carbonLabel }}</p>
              </div>
              <p class="tabular-nums text-lg font-extrabold text-emerald-900">{{ environmentMetrics.carbonReduction }}%</p>
            </div>
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
              <div
                class="h-full rounded-full bg-emerald-500"
                :style="{ width: `${environmentMetrics.carbonReduction}%` }"
              />
            </div>
          </div>

          <!-- 분진 저감 살수 -->
          <div class="rounded-xl border border-violet-100 bg-violet-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold text-violet-900">분진 저감 살수 권장</p>
                <p class="mt-0.5 text-[10px] text-violet-700/80">{{ environmentMetrics.spraySource }}</p>
              </div>
              <p class="tabular-nums text-lg font-extrabold text-violet-900">{{ environmentMetrics.sprayCount }}<span class="text-xs font-bold">회/일</span></p>
            </div>
          </div>

          <!-- 우천 폐기물 유출 방지 -->
          <div class="rounded-xl border border-sky-100 bg-sky-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold text-sky-900">우천 폐기물 유출 방지</p>
                <p class="mt-0.5 text-[10px] text-sky-700/80">{{ environmentMetrics.wasteSource }}</p>
              </div>
              <p class="tabular-nums text-lg font-extrabold text-sky-900">{{ environmentMetrics.wasteScore }}점</p>
            </div>
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
              <div
                class="h-full rounded-full"
                :class="progressBarClass(environmentMetrics.wasteScore)"
                :style="{ width: `${environmentMetrics.wasteScore}%` }"
              />
            </div>
          </div>
        </div>
      </article>

      <!-- 사회 (S) -->
      <article class="overflow-hidden rounded-2xl border border-sky-100/90 bg-white/95 shadow-card">
        <div class="border-b border-sky-100 bg-gradient-to-r from-sky-50/80 to-cyan-50/40 px-5 py-3">
          <div class="flex items-center justify-between">
            <h2 class="flex items-center gap-2 text-sm font-extrabold text-sky-900">
              <Users class="h-4 w-4 text-sky-600" />
              S · 사회 Social
            </h2>
            <span class="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-bold text-sky-700">
              근로자 안전
            </span>
          </div>
          <p class="mt-1 text-[11px] text-sky-700/70">기상 위험에 따른 근로자 보호 적용</p>
        </div>

        <div class="space-y-3 p-4">
          <!-- 폭염/한파 시간대 작업 분산 -->
          <div class="rounded-xl border border-amber-100 bg-amber-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold text-amber-900">기상 시간대 작업 분산</p>
                <p class="mt-0.5 text-[10px] text-amber-700/80">{{ socialMetrics.timeShiftLabel }}</p>
              </div>
              <span
                class="rounded-md px-2 py-1 text-[10px] font-bold"
                :class="socialMetrics.timeShiftActive ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'"
              >
                {{ socialMetrics.timeShiftActive ? '적용 중' : '평시 운영' }}
              </span>
            </div>
          </div>

          <!-- 보호구 지급률 -->
          <div class="rounded-xl border border-sky-100 bg-sky-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold text-sky-900">보호구 지급률 (KF94 이상)</p>
                <p class="mt-0.5 text-[10px] text-sky-700/80">{{ socialMetrics.ppeNote }}</p>
              </div>
              <p class="tabular-nums text-lg font-extrabold text-sky-900">{{ socialMetrics.ppeRate }}%</p>
            </div>
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
              <div
                class="h-full rounded-full bg-sky-500"
                :style="{ width: `${socialMetrics.ppeRate}%` }"
              />
            </div>
          </div>

          <!-- 무사고 일수 -->
          <div class="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <ShieldCheck class="h-4 w-4 text-emerald-600" />
                <p class="text-xs font-bold text-emerald-900">안전 무사고 일수</p>
              </div>
              <p class="tabular-nums text-lg font-extrabold text-emerald-900">{{ socialMetrics.safeDays }}<span class="text-xs">일</span></p>
            </div>
          </div>

          <!-- 협력사 안전교육 -->
          <div class="rounded-xl border border-violet-100 bg-violet-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <p class="text-xs font-bold text-violet-900">협력사 안전교육 이수율</p>
              <p class="tabular-nums text-lg font-extrabold text-violet-900">{{ socialMetrics.eduRate }}%</p>
            </div>
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
              <div
                class="h-full rounded-full bg-violet-500"
                :style="{ width: `${socialMetrics.eduRate}%` }"
              />
            </div>
          </div>
        </div>
      </article>

      <!-- 지배구조 (G) -->
      <article class="overflow-hidden rounded-2xl border border-violet-100/90 bg-white/95 shadow-card">
        <div class="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/40 px-5 py-3">
          <div class="flex items-center justify-between">
            <h2 class="flex items-center gap-2 text-sm font-extrabold text-violet-900">
              <Gauge class="h-4 w-4 text-violet-600" />
              G · 지배구조 Governance
            </h2>
            <span class="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-700">
              투명성·기록
            </span>
          </div>
          <p class="mt-1 text-[11px] text-violet-700/70">작업일보·AI 위험통제 의사결정 추적</p>
        </div>

        <div class="space-y-3 p-4">
          <!-- 작업일보 자동기록률 -->
          <div class="rounded-xl border border-violet-100 bg-violet-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold text-violet-900">작업일보 자동 기록률</p>
                <p class="mt-0.5 text-[10px] text-violet-700/80">금일 {{ governanceMetrics.totalLogs }}건 등록</p>
              </div>
              <p class="tabular-nums text-lg font-extrabold text-violet-900">{{ governanceMetrics.autoRecordRate }}%</p>
            </div>
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
              <div
                class="h-full rounded-full bg-violet-500"
                :style="{ width: `${governanceMetrics.autoRecordRate}%` }"
              />
            </div>
          </div>

          <!-- 공정 완료율 -->
          <div class="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-bold text-emerald-900">금일 공정 완료율</p>
                <p class="mt-0.5 text-[10px] text-emerald-700/80">{{ governanceMetrics.completedLogs }} / {{ governanceMetrics.totalLogs }} 건</p>
              </div>
              <p class="tabular-nums text-lg font-extrabold text-emerald-900">{{ governanceMetrics.completionRate }}%</p>
            </div>
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
              <div
                class="h-full rounded-full"
                :class="progressBarClass(governanceMetrics.completionRate)"
                :style="{ width: `${governanceMetrics.completionRate}%` }"
              />
            </div>
          </div>

          <!-- AI 위험통제 추적 -->
          <div class="rounded-xl border border-rose-100 bg-rose-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <ClipboardList class="h-4 w-4 text-rose-600" />
                <p class="text-xs font-bold text-rose-900">AI 위험통제 의사결정 추적</p>
              </div>
              <p class="tabular-nums text-lg font-extrabold text-rose-900">{{ governanceMetrics.aiRiskCount }}건</p>
            </div>
            <p class="mt-1 text-[10px] text-rose-700/80">기상 기반 자동 추천 항목 (장비 + 계획)</p>
          </div>

          <!-- 14일 작업 이력 -->
          <div class="rounded-xl border border-sky-100 bg-sky-50/30 p-3">
            <div class="flex items-start justify-between gap-2">
              <p class="text-xs font-bold text-sky-900">최근 14일 작업 이력 보존</p>
              <p class="tabular-nums text-lg font-extrabold text-sky-900">{{ governanceMetrics.historyDays }}<span class="text-xs">일</span></p>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- 중장비 입출차 ESG 연동 패널 -->
    <article class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-gradient-to-r from-amber-50/40 via-white to-emerald-50/40 px-5 py-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 class="flex items-center gap-2 text-sm font-extrabold text-forena-900">
              <Truck class="h-4 w-4 text-forena-600" />
              중장비 입출차 · ESG 운용 현황
            </h2>
            <p class="mt-1 text-xs text-forena-500">기상 위험도와 연동된 자율 운휴 / 가동 결정</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              가동 {{ equipmentSummary.powered }}대
            </span>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
              운휴 {{ equipmentSummary.idle }}대
            </span>
            <span class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              운휴율 {{ equipmentSummary.idleRatio }}%
            </span>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr class="border-b border-forena-100">
                <th class="py-2 pr-3 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">장비명</th>
                <th class="py-2 pr-3 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">유형</th>
                <th class="py-2 pr-3 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">협력사</th>
                <th class="py-2 pr-3 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">게이트</th>
                <th class="py-2 pr-3 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">상태</th>
                <th class="py-2 text-right text-[11px] font-bold uppercase tracking-wide text-forena-500">ESG 영향</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="eq in equipments"
                :key="eq.id"
                class="border-b border-forena-50 transition-colors hover:bg-forena-50/30"
              >
                <td class="py-3 pr-3">
                  <span class="text-xs font-bold text-forena-800">{{ eq.name }}</span>
                </td>
                <td class="py-3 pr-3 text-xs text-slate-600">{{ eq.type }}</td>
                <td class="py-3 pr-3 text-xs text-slate-600">{{ eq.partner }}</td>
                <td class="py-3 pr-3 text-xs text-slate-600">{{ eq.gate }}</td>
                <td class="py-3 pr-3">
                  <span
                    class="rounded-md px-2 py-0.5 text-[11px] font-bold"
                    :class="eq.status === '작업중' ? 'bg-emerald-100 text-emerald-800' : eq.status === '대기' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ eq.status }}
                  </span>
                </td>
                <td class="py-3 text-right">
                  <span
                    v-if="eq.powered"
                    class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800"
                  >
                    <Activity class="h-3 w-3" />
                    탄소 배출
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
                  >
                    <Leaf class="h-3 w-3" />
                    절감 기여
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>

    <!-- AI 위험통제 추천 + 작업이력 2분할 -->
    <div class="grid gap-4 xl:grid-cols-2">
      <!-- AI 위험통제 추천 (기상 연동) -->
      <article class="overflow-hidden rounded-2xl border border-rose-100/90 bg-white/95 shadow-card">
        <div class="border-b border-rose-100 bg-gradient-to-r from-rose-50/60 via-white to-rose-50/30 px-5 py-3">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-rose-900">
            <AlertTriangle class="h-4 w-4 text-rose-600" />
            AI 위험통제 추천 (기상 연동)
          </h2>
          <p class="mt-1 text-[11px] text-rose-700/70">실시간 기상 기반 장비·공정 위험 자동 분석</p>
        </div>

        <div class="space-y-2 p-4">
          <div
            v-if="(equipmentRisks.length + planRisks.length) === 0"
            class="rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-center"
          >
            <CheckCircle2 class="mx-auto mb-1 h-5 w-5 text-emerald-600" />
            <p class="text-xs font-bold text-emerald-800">현재 활성 위험 없음</p>
            <p class="mt-0.5 text-[10px] text-emerald-700/80">장비·공정 모두 정상 운영 가능 범위</p>
          </div>

          <div
            v-for="(risk, idx) in [...equipmentRisks, ...planRisks].slice(0, 4)"
            :key="`risk-${idx}`"
            class="rounded-xl border border-rose-100 bg-white p-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-800">{{ risk.badge || 'AI' }}</span>
                  <span class="text-xs font-bold text-forena-900">{{ risk.title }}</span>
                </div>
                <p class="mt-1 text-[11px] text-slate-600">{{ risk.subtitle }}</p>
                <p class="mt-1 text-[10px] leading-relaxed text-slate-500">{{ risk.action || risk.reason }}</p>
              </div>
              <span
                class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
                :class="levelBadgeClass(risk.level)"
              >
                {{ risk.level }}
              </span>
            </div>
          </div>
        </div>
      </article>

      <!-- 14일 작업 이력 (지배구조 추적) -->
      <article class="overflow-hidden rounded-2xl border border-violet-100/90 bg-white/95 shadow-card">
        <div class="border-b border-violet-100 bg-gradient-to-r from-violet-50/60 via-white to-fuchsia-50/30 px-5 py-3">
          <h2 class="flex items-center gap-2 text-sm font-extrabold text-violet-900">
            <FileText class="h-4 w-4 text-violet-600" />
            최근 14일 작업 이력 (G · 추적)
          </h2>
          <p class="mt-1 text-[11px] text-violet-700/70">투명한 의사결정 추적을 위한 일자별 기록</p>
        </div>

        <div class="p-4">
          <div
            v-if="workLogHistory.length === 0"
            class="rounded-xl border border-violet-100 bg-violet-50/30 px-4 py-6 text-center text-xs text-violet-700/70"
          >
            저장된 작업 이력이 없습니다.
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="history in workLogHistory.slice(0, 7)"
              :key="history.reportDate"
              class="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50/20 px-3 py-2"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                  <HardHat class="h-4 w-4 text-violet-700" />
                </div>
                <div>
                  <p class="text-xs font-bold text-violet-900">{{ history.reportDate }}</p>
                  <p class="text-[10px] text-violet-700/70">
                    작업 {{ history.workCount }}건 · 완료 {{ history.completedCount }}건 · 인원 {{ history.totalPersonnel }}명
                  </p>
                </div>
              </div>
              <span
                class="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-bold tabular-nums"
                :class="history.workCount === history.completedCount ? 'text-emerald-700 border-emerald-200' : 'text-amber-700 border-amber-200'"
              >
                {{ history.workCount === 0 ? 0 : Math.round((history.completedCount / history.workCount) * 100) }}%
              </span>
            </li>
          </ul>
        </div>
      </article>
    </div>
  </div>
</template>
