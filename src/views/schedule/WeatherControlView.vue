<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  CloudSun,
  Sparkles,
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  CalendarDays,
  CalendarRange,
  ShieldAlert,
  ChevronRight,
  Siren,
  Umbrella,
  Snowflake,
  Sun,
  CheckCircle2,
  Clock,
} from 'lucide-vue-next'

// ─── 환경 ─────────────────────────────────────────────────────────────────────
const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081').replace(/\/$/, '')

const T = {
  title: '기상 관제',
  desc: '기상 변화에 따른 위험 공정 통제와 작업 계획 조정 포인트를 한 화면에서 확인합니다.',
  catRisk: 'AI 위험 통제 추천',
  catRiskSub: '오늘 날씨와 작업 계획·중장비를 비교해 AI가 우선 검토 항목을 제안합니다.',
  row2Title: '위험 장비 통제',
  row3Title: '계획 대비 위험 경고',
  demoToday: '오늘 현장 요약',
  demoWeek: '기상 영향도',
  demoRain: '강수 확률',
  fineDustTitle: '금일 미세먼지',
  liveRisk: '현장 즉시 조치 체크리스트',
  liveRiskSub: '오늘 기상 기준 안전관리자가 지금 바로 진행해야 할 액션입니다.',
  forecastTitle: '기상 예보',
  tabWeek: '주간 7일',
  tabMonth: '월간',
}

// ─── 날짜 헬퍼 ────────────────────────────────────────────────────────────────
function getTodayDateText() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// ─── 상태 ─────────────────────────────────────────────────────────────────────
const reportDate = ref(getTodayDateText())
const loading = ref(false)
const dashboard = ref(null)
const forecastTab = ref('week')
const selectedMonthWeekId = ref(null)

// ─── 데이터 로드 ──────────────────────────────────────────────────────────────
async function loadDashboard() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/weather/dashboard?reportDate=${reportDate.value}`)
    if (!response.ok) throw new Error('기상 관제 조회 실패')
    dashboard.value = await response.json()
  } catch (error) {
    console.error(error)
    dashboard.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
watch(reportDate, loadDashboard)

// ─── 파생값 (백엔드 응답 그대로 사용) ──────────────────────────────────────────
const today = computed(() => dashboard.value?.today ?? null)
const week = computed(() => dashboard.value?.week ?? null)
const rain = computed(() => dashboard.value?.rain ?? null)
const airQuality = computed(() => dashboard.value?.airQuality ?? null)
const analysis = computed(() => dashboard.value?.analysis ?? null)
const equipmentRisks = computed(() => dashboard.value?.equipmentRisks ?? [])
const planRisks = computed(() => dashboard.value?.planRisks ?? [])
const forecastDays = computed(() => dashboard.value?.forecastDays ?? [])
const locationLabel = computed(() => dashboard.value?.locationLabel || '현장')

// 종합 위험도 (analysis 플래그 카운트)
const riskLevel = computed(() => {
  const a = analysis.value
  if (!a) return { label: '데이터 없음', tone: 'text-slate-600 bg-slate-100 border-slate-200' }

  let score = 0
  if (a.hasRain || (a.precipitationProbability ?? 0) >= 60) score += 2
  if (a.windRisk || (a.maxWindSpeed ?? 0) >= 8) score += 2
  if (a.hasSnow) score += 2
  if (a.heatRisk) score += 1
  if (a.coldRisk) score += 1
  if (a.fineDustRisk) score += 1

  if (score >= 4) return { label: '높음', tone: 'text-rose-700 bg-rose-100 border-rose-200' }
  if (score >= 2) return { label: '보통', tone: 'text-amber-700 bg-amber-100 border-amber-200' }
  return { label: '낮음', tone: 'text-emerald-700 bg-emerald-100 border-emerald-200' }
})

// 대표 위험 (백엔드 RiskItem 리스트에서 첫 번째)
const equipmentPrimary = computed(() => equipmentRisks.value[0] ?? null)
const planPrimary = computed(() => planRisks.value[0] ?? null)

// 실시간 위험 통제 — '지금 현장에서 즉시 해야 하는 액션' 체크리스트
// (AI 위험 통제 추천이 '분석/판단'이라면, 여기는 '액션/타임라인' 관점)
const liveRiskActions = computed(() => {
  const a = analysis.value
  if (!a) return []

  const actions = []
  const rain = a.precipitationProbability ?? 0
  const wind = a.maxWindSpeed ?? 0
  const fineDust = a.fineDustValue ?? 0
  const alerts = dashboard.value?.alerts ?? []
  const nowHour = new Date().getHours()

  // 활성 특보 → 즉시 액션
  alerts.forEach((alert, i) => {
    actions.push({
      id: `alert-${i}`,
      icon: 'siren',
      label: '특보 활성 — 작업 책임자 즉시 공유',
      detail: alert.title || alert.message || '특보 내용 확인',
      level: alert.level || '경고',
      timing: '지금 즉시',
    })
  })

  // 풍속 — 양중·고소 작업 통제
  if (wind >= 10) {
    actions.push({
      id: 'wind-stop',
      icon: 'wind',
      label: '양중·고소 작업 일시 중지',
      detail: `현재 풍속 ${Number(wind).toFixed(1)}m/s · 풍속계 1시간 단위 재측정`,
      level: '경고',
      timing: '지금 즉시',
    })
  } else if (wind >= 8) {
    actions.push({
      id: 'wind-watch',
      icon: 'wind',
      label: '양중 신호수 추가 배치',
      detail: `풍속 ${Number(wind).toFixed(1)}m/s · 자재 결속 상태 점검`,
      level: '주의',
      timing: '작업 시작 전',
    })
  }

  // 강수 — 배수·미끄럼 / 실내 전환
  if (rain >= 70 || a.hasRain) {
    actions.push({
      id: 'rain-indoor',
      icon: 'umbrella',
      label: '외부 공정 → 실내 작업 전환',
      detail: `강수확률 ${rain}% · 타설/도장/방수 순연 검토`,
      level: '경고',
      timing: '오전 회의 시',
    })
  } else if (rain >= 40) {
    actions.push({
      id: 'rain-drain',
      icon: 'umbrella',
      label: '작업면 배수·미끄럼 점검',
      detail: `강수확률 ${rain}% · 통로/슬래브/경사로 확인`,
      level: '주의',
      timing: '작업 시작 전',
    })
  }

  // 적설/결빙
  if (a.hasSnow) {
    actions.push({
      id: 'snow-clear',
      icon: 'snow',
      label: '제설·제빙 후 출입 동선 확보',
      detail: '경사 구간 장비 진입 통제, 안전화 미끄럼 방지 장구 지급',
      level: '경고',
      timing: '오전 출근 전',
    })
  }

  // 폭염 — 시간대 분산
  if (a.heatRisk) {
    const isAfternoon = nowHour >= 12
    actions.push({
      id: 'heat',
      icon: 'sun',
      label: isAfternoon ? '폭염 시간대 옥외 작업 단축' : '12~14시 옥외 작업 휴식 편성',
      detail: `최고 ${a.maxTemperature ?? '--'}°C · 그늘막/얼음물 비치 점검`,
      level: '주의',
      timing: '12:00 ~ 14:00',
    })
  }

  // 한파
  if (a.coldRisk) {
    actions.push({
      id: 'cold',
      icon: 'thermometer',
      label: '저온 민감 공정 보양 점검',
      detail: `최저 ${a.minTemperature ?? '--'}°C · 콘크리트 양생/배관 동결 보호`,
      level: '주의',
      timing: '오전 작업 전',
    })
  }

  // 미세먼지
  if (a.fineDustRisk || fineDust >= 80) {
    actions.push({
      id: 'dust',
      icon: 'mask',
      label: 'KF94 보호구 지급 + 살수 빈도 강화',
      detail: `PM10 ${fineDust}㎍/㎥ · 옥외 도장/용접/절단 작업자 우선`,
      level: fineDust >= 150 ? '경고' : '주의',
      timing: '작업 시작 전',
    })
  }

  return actions
})

const liveRiskCount = computed(() => liveRiskActions.value.length)

// 3일 예보 (forecastDays 의 오늘부터 3개)
const threeDayForecast = computed(() => {
  const todayText = getTodayDateText()
  return forecastDays.value
    .filter((d) => d.date && d.date >= todayText)
    .slice(0, 3)
})

// 주간 7일 예보
const weeklyForecast = computed(() => {
  const todayText = getTodayDateText()
  return forecastDays.value
    .filter((d) => d.date && d.date >= todayText)
    .slice(0, 7)
})

// 월간 — 현재 주차(이번 주)부터 4주만 표시 (지난 주차 제외)
// 주차 기준: 일요일 시작 ~ 토요일 끝 (KMA 일자 그룹핑)
function getWeekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - d.getDay()) // 그 주 일요일로 정렬
  return d
}

function formatMD(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

const monthlyForecast = computed(() => {
  if (forecastDays.value.length === 0) return []

  // 일자별 인덱스
  const dayMap = new Map()
  forecastDays.value.forEach((d) => {
    if (d.date) dayMap.set(d.date, d)
  })

  // 이번 주 시작 (일요일) 부터 4주 윈도우
  const now = new Date()
  const startOfWeek = getWeekStart(now)
  const weeks = []

  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(startOfWeek)
    weekStart.setDate(weekStart.getDate() + w * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    // 이 주차의 7일 데이터 수집
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      const key = dateKey(d)
      const source = dayMap.get(key)

      days.push({
        id: key,
        date: key,
        shortDate: formatMD(d),
        weekday: KOREAN_WEEKDAYS[d.getDay()],
        weatherLabel: source?.weatherLabel || '예보 범위 외',
        maxTemp: source?.maxTemp ?? null,
        minTemp: source?.minTemp ?? null,
        precipitationProbability: source?.precipitationProbability ?? 0,
        windSpeed: source?.windSpeed ?? 0,
        hasData: Boolean(source),
      })
    }

    // 데이터가 있는 일자만으로 통계 산출
    const dataDays = days.filter((d) => d.hasData)
    const validMax = dataDays.map((d) => d.maxTemp).filter((v) => v != null)
    const validMin = dataDays.map((d) => d.minTemp).filter((v) => v != null)
    const maxTemp = validMax.length ? Math.max(...validMax) : null
    const minTemp = validMin.length ? Math.min(...validMin) : null
    const avgRain = dataDays.length
      ? Math.round(dataDays.reduce((sum, d) => sum + d.precipitationProbability, 0) / dataDays.length)
      : 0
    const maxWind = dataDays.length ? Math.max(...dataDays.map((d) => d.windSpeed)) : 0

    let weatherSummary = '대체로 안정'
    const hasRain = dataDays.some((d) => /비|소나기/.test(d.weatherLabel))
    const hasSnow = dataDays.some((d) => /눈/.test(d.weatherLabel))
    if (!dataDays.length) weatherSummary = '예보 데이터 없음'
    else if (hasSnow) weatherSummary = '적설 가능'
    else if (avgRain >= 60) weatherSummary = '비 예보 포함'
    else if (avgRain >= 40) weatherSummary = '흐린 날 있음'
    else if (hasRain) weatherSummary = '강수 일부'

    const risk =
      !dataDays.length
        ? '정보 없음'
        : avgRain >= 60 || maxWind >= 10
        ? '주의'
        : avgRain >= 40 || maxWind >= 8
        ? '보통'
        : '양호'
    const riskClass =
      risk === '주의'
        ? 'text-rose-700 bg-rose-50 border-rose-200'
        : risk === '보통'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : risk === '양호'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : 'text-slate-600 bg-slate-50 border-slate-200'

    weeks.push({
      id: `week-${dateKey(weekStart)}`,
      label: w === 0 ? '이번 주' : w === 1 ? '다음 주' : `${w + 1}주차`,
      dateRange: `${formatMD(weekStart)} — ${formatMD(weekEnd)}`,
      weatherSummary,
      maxTemp,
      minTemp,
      precipitationProbability: avgRain,
      windSpeed: maxWind,
      risk,
      riskClass,
      isCurrentWeek: w === 0,
      days,
    })
  }

  return weeks
})

watch(monthlyForecast, (weeks) => {
  if (!weeks.length) {
    selectedMonthWeekId.value = null
    return
  }
  if (selectedMonthWeekId.value && !weeks.some((w) => w.id === selectedMonthWeekId.value)) {
    selectedMonthWeekId.value = null
  }
})

function selectMonthWeek(weekId) {
  selectedMonthWeekId.value = selectedMonthWeekId.value === weekId ? null : weekId
}

// ─── 표시 헬퍼 ────────────────────────────────────────────────────────────────
function levelBadgeClass(level) {
  if (level === '경고' || level === '제한') return 'bg-rose-600 text-white'
  if (level === '주의') return 'bg-amber-100 text-amber-900'
  return 'bg-emerald-100 text-emerald-900'
}

function rainBarClass(rainPercent) {
  if (rainPercent >= 70) return 'bg-rose-500'
  if (rainPercent >= 40) return 'bg-amber-400'
  return 'bg-sky-400'
}

function weatherEmoji(label, rainPercent) {
  const k = String(label || '').replace(/\s/g, '')
  if (k.includes('눈')) return '❄️'
  if (k.includes('비') || rainPercent >= 70) return '🌧'
  if (k.includes('흐림') || k.includes('흐리고') || rainPercent >= 40) return '☁️'
  if (k.includes('강풍')) return '💨'
  if (k.includes('구름')) return '⛅'
  return '☀️'
}

function formatWindSpeed(value) {
  if (value == null) return '-'
  const num = Number(value)
  return `${num.toFixed(num % 1 === 0 ? 0 : 1)}m/s`
}

function fineDustDisplay(card) {
  if (!card || card.value == null) return '-'
  return `${card.value}㎍/㎥`
}

function rainNote(value) {
  const v = Number(value || 0)
  if (v >= 70) return '외부 공정 순연 검토 필요'
  if (v >= 40) return '외부 작업면 상태 사전 점검 권장'
  return '기본 우천 대비 수준 유지'
}
</script>

<template>
  <div class="space-y-5 pb-10">
    <!-- 헤더 -->
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-sky-50/40 to-flare-50/20 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-forena-700 text-white shadow-md"
          >
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
            <input
              v-model="reportDate"
              type="date"
              class="rounded-xl border border-forena-200 px-3 py-2 text-sm text-forena-800 focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
            />
          </label>
        </div>
      </div>
    </div>

    <!-- 좌측: 요약 카드 4개 + 실시간 위험 / 우측: AI 위험 통제 추천 -->
    <div class="grid gap-4 xl:grid-cols-[540px_minmax(0,1fr)] xl:items-stretch">
      <div class="flex h-full flex-col gap-4">
        <div class="grid auto-rows-fr gap-4 sm:grid-cols-2">
          <article class="flex h-full min-h-[160px] flex-col rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2">
                <Thermometer class="h-4 w-4 shrink-0 text-forena-400" />
                <p class="text-[11px] font-bold text-forena-500">{{ T.demoToday }}</p>
              </div>
              <span class="whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold" :class="riskLevel.tone">
                위험 {{ riskLevel.label }}
              </span>
            </div>
            <p class="mt-3 text-2xl font-bold tabular-nums text-forena-900">
              {{ today?.headlineTemp || '--°C / --°C' }}
            </p>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              {{ today?.summary || '기상 정보 없음' }}
            </p>
          </article>

          <article class="flex h-full min-h-[160px] flex-col rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
            <div class="flex items-center gap-2">
              <Wind class="h-4 w-4 shrink-0 text-forena-400" />
              <p class="text-[11px] font-bold text-forena-500">{{ T.demoWeek }}</p>
            </div>
            <p class="mt-3 text-base font-bold text-amber-800">
              {{ week?.summary || '기상 영향 분석 준비 중' }}
            </p>
            <p class="mt-2 text-sm leading-relaxed text-slate-500">
              {{ week?.subSummary || '-' }}
            </p>
          </article>

          <article class="flex h-full min-h-[160px] flex-col rounded-2xl border border-sky-100/90 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 shadow-card">
            <div class="flex items-center gap-2">
              <Droplets class="h-4 w-4 text-sky-500" />
              <p class="text-[11px] font-bold tracking-wide text-sky-800">{{ T.demoRain }}</p>
            </div>
            <p class="mt-3 text-3xl font-extrabold tracking-tight text-sky-900">
              {{ rain?.value || '0%' }}
            </p>
            <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="rainBarClass(Number(analysis?.precipitationProbability || 0))"
                :style="{ width: `${Math.min(100, Number(analysis?.precipitationProbability || 0))}%` }"
              />
            </div>
            <p class="mt-2 text-xs leading-relaxed text-sky-800/80">
              {{ rainNote(analysis?.precipitationProbability) }}
            </p>
          </article>

          <article class="flex h-full min-h-[160px] flex-col rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 shadow-card">
            <div class="flex items-center gap-2">
              <Eye class="h-4 w-4 text-violet-500" />
              <p class="text-[11px] font-bold tracking-wide text-violet-800">{{ T.fineDustTitle }}</p>
            </div>
            <p class="mt-3 text-3xl font-extrabold tracking-tight text-violet-900">
              {{ fineDustDisplay(airQuality) }}
            </p>
            <p class="mt-2 text-sm leading-relaxed text-violet-800/80">
              {{ airQuality?.label || '정보 없음' }}
            </p>
          </article>
        </div>

        <article class="flex flex-1 flex-col rounded-2xl border border-rose-100/90 bg-gradient-to-br from-rose-50/85 via-white to-rose-50/40 p-4 shadow-card">
          <div class="flex items-start justify-between gap-2.5">
            <div class="flex items-start gap-2.5 min-w-0 flex-1">
              <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div class="min-w-0 flex-1">
                <h3 class="text-[18px] font-extrabold tracking-tight text-rose-900">{{ T.liveRisk }}</h3>
                <p class="mt-1 text-[11px] leading-6 text-rose-700/75">{{ T.liveRiskSub }}</p>
              </div>
            </div>
            <span
              class="shrink-0 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700"
            >
              {{ liveRiskCount }}건
            </span>
          </div>

          <div v-if="loading" class="mt-4 rounded-xl border border-rose-100 bg-white px-5 py-4 text-[15px] font-medium text-slate-600">
            기상 관제 데이터를 불러오는 중입니다...
          </div>

          <ul v-else-if="liveRiskActions.length > 0" class="mt-4 flex flex-1 flex-col space-y-2">
            <li
              v-for="action in liveRiskActions"
              :key="action.id"
              class="flex items-start gap-3 rounded-xl border border-rose-200/70 bg-white p-3 shadow-sm"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                :class="action.level === '경고' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'"
              >
                <Siren v-if="action.icon === 'siren'" class="h-4 w-4" />
                <Wind v-else-if="action.icon === 'wind'" class="h-4 w-4" />
                <Umbrella v-else-if="action.icon === 'umbrella'" class="h-4 w-4" />
                <Snowflake v-else-if="action.icon === 'snow'" class="h-4 w-4" />
                <Sun v-else-if="action.icon === 'sun'" class="h-4 w-4" />
                <Thermometer v-else-if="action.icon === 'thermometer'" class="h-4 w-4" />
                <Eye v-else-if="action.icon === 'mask'" class="h-4 w-4" />
                <AlertTriangle v-else class="h-4 w-4" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[14px] font-extrabold leading-5 text-forena-900">{{ action.label }}</p>
                  <span
                    class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
                    :class="levelBadgeClass(action.level)"
                  >
                    {{ action.level }}
                  </span>
                </div>
                <p class="mt-1 text-[12px] leading-5 text-slate-600">{{ action.detail }}</p>
                <p class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-rose-700">
                  <Clock class="h-3 w-3" />
                  {{ action.timing }}
                </p>
              </div>
            </li>
          </ul>

          <div
            v-else
            class="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-emerald-200/60 bg-white px-5 py-6"
          >
            <CheckCircle2 class="h-6 w-6 text-emerald-500" />
            <p class="mt-2 text-[14px] font-bold text-emerald-700">즉시 조치할 항목이 없습니다</p>
            <p class="mt-1 text-[11px] text-emerald-600/80">현재 기상 조건은 평시 운용 범위입니다.</p>
          </div>
        </article>
      </div>

      <div class="flex h-full flex-col overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="border-b border-forena-100 bg-gradient-to-r from-violet-50/70 via-white to-rose-50/60 px-5 py-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 class="flex items-center gap-2 text-base font-extrabold text-forena-900">
                <ShieldAlert class="h-4 w-4 text-forena-600" />
                {{ T.catRisk }}
              </h2>
              <p class="mt-1 text-xs leading-relaxed text-forena-500">{{ T.catRiskSub }}</p>
            </div>
            <span class="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-bold text-violet-700 shadow-sm">
              <Sparkles class="mr-1 inline h-3 w-3" />
              AI 추천
            </span>
          </div>
        </div>

        <div class="flex flex-1 flex-col gap-4 p-4 md:p-5">
          <!-- 계획 대비 위험 -->
          <div
            class="relative flex flex-1 flex-col overflow-hidden rounded-2xl border-2 border-rose-200/80 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/50 p-6 shadow-sm"
          >
            <span class="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-rose-400 to-rose-600" />
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
              <div class="flex min-w-[86px] items-center gap-3 md:pt-1">
                <span class="rounded-lg bg-rose-100 px-3.5 py-2 text-sm font-extrabold text-rose-800">AI</span>
                <AlertTriangle class="h-5 w-5 text-rose-600" />
              </div>

              <div class="min-w-0 flex-1 space-y-3">
                <div class="flex flex-wrap items-center gap-2.5">
                  <h3 class="text-[20px] font-extrabold tracking-tight text-forena-900">{{ T.row3Title }}</h3>
                  <span
                    v-if="planPrimary"
                    class="rounded-md px-3 py-1 text-[12px] font-extrabold uppercase tracking-wider"
                    :class="levelBadgeClass(planPrimary.level)"
                  >
                    {{ planPrimary.level }}
                  </span>
                </div>

                <p v-if="planPrimary" class="text-[16px] font-semibold leading-8 text-slate-800">
                  {{ planPrimary.reason }}
                </p>
                <p v-if="planPrimary?.action" class="rounded-lg border border-rose-100 bg-white/60 px-3 py-2 text-sm leading-7 text-rose-900">
                  <span class="font-bold">권장 조치 </span>· {{ planPrimary.action }}
                </p>
                <p v-if="!planPrimary" class="text-sm font-medium text-slate-600">
                  현재 계획 연동 위험은 감지되지 않았습니다.
                </p>
              </div>
            </div>
          </div>

          <!-- 장비 통제 -->
          <div
            class="relative flex flex-1 flex-col overflow-hidden rounded-2xl border-2 border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/40 p-6 shadow-sm"
          >
            <span class="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-violet-400 to-violet-600" />
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
              <div class="flex min-w-[86px] items-center gap-3 md:pt-1">
                <span class="rounded-lg bg-violet-100 px-3.5 py-2 text-sm font-extrabold text-violet-800">AI</span>
                <Sparkles class="h-5 w-5 text-violet-600" />
              </div>

              <div class="min-w-0 flex-1 space-y-3">
                <div class="flex flex-wrap items-center gap-2.5">
                  <h3 class="text-[20px] font-extrabold tracking-tight text-forena-900">{{ T.row2Title }}</h3>
                  <span
                    v-if="equipmentPrimary"
                    class="rounded-md px-3 py-1 text-[12px] font-extrabold uppercase tracking-wider"
                    :class="levelBadgeClass(equipmentPrimary.level)"
                  >
                    {{ equipmentPrimary.level }}
                  </span>
                </div>

                <p v-if="equipmentPrimary" class="text-[16px] font-semibold leading-8 text-slate-800">
                  {{ equipmentPrimary.reason }}
                </p>
                <p v-if="equipmentPrimary?.action" class="rounded-lg border border-violet-100 bg-white/60 px-3 py-2 text-sm leading-7 text-violet-900">
                  <span class="font-bold">권장 조치 </span>· {{ equipmentPrimary.action }}
                </p>
                <p v-if="!equipmentPrimary" class="text-sm font-medium text-slate-600">
                  현재 장비 통제 위험은 감지되지 않았습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3일 예보 -->
    <div class="rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-3">
        <h2 class="flex items-center gap-2 text-sm font-bold text-forena-900">
          <CalendarDays class="h-4 w-4 text-forena-500" />
          오늘 · 내일 · 모레 예보
        </h2>
        <span class="text-xs font-medium text-forena-400">{{ locationLabel }}</span>
      </div>

      <div class="p-5">
        <div class="grid gap-3 md:grid-cols-3">
          <article
            v-for="day in threeDayForecast"
            :key="day.date"
            class="rounded-xl border border-forena-100 bg-forena-50/40 p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-forena-600">{{ day.dayLabel }}</p>
              <span class="text-2xl leading-none">
                {{ weatherEmoji(day.weatherLabel, day.precipitationProbability) }}
              </span>
            </div>

            <p class="mt-2 text-sm font-semibold text-forena-900">{{ day.weatherLabel }}</p>

            <p class="mt-1 tabular-nums text-base font-bold text-forena-800">
              {{ day.maxTemp ?? '--' }}°C
              <span class="text-sm font-normal text-slate-500">/ {{ day.minTemp ?? '--' }}°C</span>
            </p>

            <div class="my-3 border-t border-forena-100" />

            <div class="flex items-center justify-between text-xs text-slate-600">
              <span class="flex items-center gap-1">
                <Droplets class="h-3.5 w-3.5 text-sky-500" />
                {{ day.precipitationProbability ?? 0 }}%
              </span>
              <span class="flex items-center gap-1">
                <Wind class="h-3.5 w-3.5 text-slate-400" />
                {{ formatWindSpeed(day.windSpeed) }}
              </span>
            </div>

            <div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full"
                :class="rainBarClass(day.precipitationProbability ?? 0)"
                :style="{ width: `${Math.min(100, day.precipitationProbability ?? 0)}%` }"
              />
            </div>
          </article>

          <p v-if="threeDayForecast.length === 0" class="col-span-3 py-6 text-center text-sm text-forena-500">
            예보 데이터를 불러오는 중입니다.
          </p>
        </div>
      </div>
    </div>

    <!-- 주간 / 월간 탭 -->
    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-0">
        <div class="flex">
          <button
            v-for="tab in [
              { key: 'week', label: T.tabWeek },
              { key: 'month', label: T.tabMonth },
            ]"
            :key="tab.key"
            type="button"
            class="flex items-center gap-1.5 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors"
            :class="forecastTab === tab.key ? 'border-forena-700 text-forena-900' : 'border-transparent text-forena-500 hover:text-forena-700'"
            @click="forecastTab = tab.key"
          >
            <CalendarDays v-if="tab.key === 'week'" class="h-3.5 w-3.5" />
            <CalendarRange v-else class="h-3.5 w-3.5" />
            {{ tab.label }}
          </button>
        </div>
        <span class="pr-4 text-xs font-medium text-forena-400">{{ locationLabel }}</span>
      </div>

      <!-- 주간 -->
      <div v-if="forecastTab === 'week'" class="p-5">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr class="border-b border-forena-100">
                <th class="w-16 py-2 pr-3 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">날짜</th>
                <th class="py-2 pr-3 text-left text-[11px] font-bold uppercase tracking-wide text-forena-500">날씨</th>
                <th class="w-24 py-2 pr-3 text-right text-[11px] font-bold uppercase tracking-wide text-forena-500">최고/최저</th>
                <th class="w-24 py-2 pr-3 text-right text-[11px] font-bold uppercase tracking-wide text-forena-500">강수</th>
                <th class="w-20 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-forena-500">풍속</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(day, idx) in weeklyForecast"
                :key="day.date"
                class="border-b border-forena-50 transition-colors hover:bg-forena-50/30"
                :class="idx === 0 ? 'bg-sky-50/40' : ''"
              >
                <td class="py-3 pr-3">
                  <span class="text-xs font-bold" :class="idx === 0 ? 'text-sky-700' : 'text-forena-700'">
                    {{ day.dayLabel }}
                  </span>
                </td>
                <td class="py-3 pr-3">
                  <span class="flex items-center gap-2">
                    <span class="text-lg leading-none">{{ weatherEmoji(day.weatherLabel, day.precipitationProbability) }}</span>
                    <span class="text-xs text-slate-700">{{ day.weatherLabel }}</span>
                  </span>
                </td>
                <td class="py-3 pr-3 text-right tabular-nums">
                  <span class="font-semibold text-forena-800">{{ day.maxTemp ?? '--' }}°</span>
                  <span class="text-xs text-slate-400"> / {{ day.minTemp ?? '--' }}°</span>
                </td>
                <td class="py-3 pr-3">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs font-medium tabular-nums text-slate-700">{{ day.precipitationProbability ?? 0 }}%</span>
                    <div class="h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full"
                        :class="rainBarClass(day.precipitationProbability ?? 0)"
                        :style="{ width: `${Math.min(100, day.precipitationProbability ?? 0)}%` }"
                      />
                    </div>
                  </div>
                </td>
                <td class="py-3 text-right text-xs tabular-nums text-slate-600">
                  {{ formatWindSpeed(day.windSpeed) }}
                </td>
              </tr>
              <tr v-if="weeklyForecast.length === 0">
                <td colspan="5" class="py-6 text-center text-sm text-forena-500">예보 데이터를 불러오는 중입니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 월간 -->
      <div v-else-if="forecastTab === 'month'" class="p-5">
        <p class="mb-4 text-xs text-forena-500">
          월간 예보는 기상청 단기·중기 예보를 주차 단위로 묶어 표시합니다. 주차를 누르면 해당 주의 일별 상세가 펼쳐집니다.
        </p>

        <div class="space-y-3">
          <article
            v-for="weekItem in monthlyForecast"
            :key="weekItem.id"
            role="button"
            tabindex="0"
            class="relative cursor-pointer overflow-hidden rounded-xl border bg-white/95 p-4 transition"
            :class="[
              selectedMonthWeekId === weekItem.id
                ? weekItem.risk === '주의'
                  ? 'border-rose-300 bg-rose-50/60 shadow-md ring-2 ring-rose-100'
                  : weekItem.risk === '보통'
                  ? 'border-amber-300 bg-amber-50/50 shadow-md ring-2 ring-amber-100'
                  : 'border-forena-200 bg-sky-50/40 shadow-md ring-2 ring-sky-100'
                : weekItem.risk === '주의'
                ? 'border-rose-200 bg-rose-50/40 shadow-sm hover:bg-rose-50/60'
                : weekItem.risk === '보통'
                ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/50'
                : 'border-forena-100 bg-forena-50/30 hover:bg-forena-50/50',
            ]"
            @click="selectMonthWeek(weekItem.id)"
            @keyup.enter="selectMonthWeek(weekItem.id)"
          >
            <span
              class="pointer-events-none absolute left-0 top-0 h-full w-1"
              :class="[
                weekItem.risk === '주의'
                  ? 'bg-gradient-to-b from-rose-400 to-rose-600'
                  : weekItem.risk === '보통'
                  ? 'bg-gradient-to-b from-amber-300 to-amber-500'
                  : 'bg-gradient-to-b from-emerald-300 to-emerald-500',
              ]"
            />

            <div class="md:flex md:items-center md:justify-between">
              <div class="flex items-center gap-4 pl-2">
                <div class="w-24 shrink-0">
                  <p class="text-xs font-bold text-forena-700">{{ weekItem.label }}</p>
                  <p class="mt-0.5 text-[10px] text-forena-500">{{ weekItem.dateRange }}</p>
                </div>
                <div class="h-8 w-px bg-forena-100" />
                <div class="flex items-center gap-2">
                  <span class="text-2xl leading-none">{{ weatherEmoji(weekItem.weatherSummary, weekItem.precipitationProbability) }}</span>
                  <div>
                    <p class="text-sm font-semibold text-forena-900">{{ weekItem.weatherSummary }}</p>
                    <p class="mt-0.5 tabular-nums text-xs text-slate-500">
                      {{ weekItem.maxTemp ?? '--' }}°C / {{ weekItem.minTemp ?? '--' }}°C &nbsp;·&nbsp; 강수 {{ weekItem.precipitationProbability }}%
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between gap-3 md:mt-0">
                <div class="flex flex-col items-end gap-1">
                  <span class="text-[10px] font-bold text-slate-500">강수</span>
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full"
                      :class="rainBarClass(weekItem.precipitationProbability ?? 0)"
                      :style="{ width: `${Math.min(100, weekItem.precipitationProbability ?? 0)}%` }"
                    />
                  </div>
                </div>
                <span class="inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold" :class="weekItem.riskClass">
                  <AlertTriangle v-if="weekItem.risk === '주의'" class="h-3 w-3" />
                  {{ weekItem.risk }}
                </span>
                <ChevronRight
                  class="h-4 w-4 transition"
                  :class="selectedMonthWeekId === weekItem.id ? 'rotate-90 text-forena-800' : 'text-forena-300'"
                />
              </div>
            </div>

            <!-- 일별 상세 펼침 -->
            <div
              v-if="selectedMonthWeekId === weekItem.id"
              class="mt-4 overflow-hidden rounded-2xl border border-forena-100 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 shadow-sm"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 px-5 py-3">
                <div>
                  <h3 class="text-sm font-bold text-forena-900">{{ weekItem.label }} 상세 예보</h3>
                  <p class="mt-0.5 text-[11px] text-forena-500">{{ weekItem.dateRange }} · 기상청 기준 일별 날씨</p>
                </div>
                <span class="rounded-full border border-forena-200 bg-white px-3 py-1 text-xs font-semibold text-forena-700">
                  {{ weekItem.weatherSummary }}
                </span>
              </div>

              <div class="p-4">
                <div class="grid gap-2 md:grid-cols-7">
                  <article
                    v-for="day in weekItem.days"
                    :key="day.id"
                    class="rounded-xl border border-forena-100 bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <p class="text-sm font-bold text-forena-900">{{ day.shortDate }}</p>
                        <p class="text-[11px] text-forena-500">{{ day.weekday }}</p>
                      </div>
                      <span class="text-xl leading-none">{{ weatherEmoji(day.weatherLabel, day.precipitationProbability) }}</span>
                    </div>

                    <p class="mt-3 text-xs font-semibold text-slate-700">{{ day.weatherLabel }}</p>

                    <p class="mt-2 tabular-nums text-sm font-bold text-forena-800">
                      {{ day.maxTemp ?? '--' }}°
                      <span class="font-normal text-slate-400"> / {{ day.minTemp ?? '--' }}°</span>
                    </p>

                    <div class="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>강수 {{ day.precipitationProbability }}%</span>
                      <span>{{ formatWindSpeed(day.windSpeed) }}</span>
                    </div>

                    <div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full"
                        :class="rainBarClass(day.precipitationProbability ?? 0)"
                        :style="{ width: `${Math.min(100, day.precipitationProbability ?? 0)}%` }"
                      />
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </article>

          <p v-if="monthlyForecast.length === 0" class="py-6 text-center text-sm text-forena-500">
            월간 예보 데이터를 불러오는 중입니다.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
