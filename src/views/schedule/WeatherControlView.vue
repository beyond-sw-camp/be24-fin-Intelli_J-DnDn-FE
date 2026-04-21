<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { CloudSun, Sparkles, AlertTriangle, CalendarRange, Wind, Droplets } from 'lucide-vue-next'
import { getPlanSegmentsByDate } from '@/utils/weatherPlanStorage'

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081').replace(/\/$/, '')

const T = {
  kicker: '일정',
  title: '기상 관제',
  desc: '당일·3일 기상 브리핑과 위험 장비 통제, 공정과의 연동을 한 화면에서 지원합니다.',
  catInfo: '기상 정보 관리',
  catControl: '기상 관제',
  catRisk: '위험 통제',
  row1Title: '기상 브리핑 및 자동화',
  row2Title: 'AI 위험 장비 통제',
  row3Title: '계획 대비 위험 경고',
  demoToday: '오늘 요약',
  demoWeek: '3일 요약',
  demoRain: '강수확률',
  badgeAi: 'AI',
  badgePlan: '계획 연동',
  liveRisk: '실시간 위험 통제 추천',
  linkedPlanCount: '연동된 계획 작업',
  threeDayTitle: '오늘 · 내일 · 모레 저장 예보',
  dot: '·',
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
    briefing: {
      title: '기상 브리핑 및 자동화',
      description: '기상 브리핑 정보가 없습니다.',
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

function parseNumber(value) {
  const matched = String(value || '').match(/-?\d+(?:\.\d+)?/)
  return matched ? Number(matched[0]) : null
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
        reason: `우천/강수확률 조건에서 "${taskName}" 작업은 품질 저하 또는 미끄럼 위험이 커집니다.`,
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
        reason: `강풍 조건에서 "${taskName}" 작업은 추락·낙하·자재 흔들림 위험이 증가합니다.`,
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
        reason: `적설/결빙 조건에서 "${taskName}" 작업은 이동성 저하와 미끄럼 위험이 큽니다.`,
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
        reason: `고온 조건에서 "${taskName}" 작업은 열 스트레스와 집중력 저하를 함께 유발할 수 있습니다.`,
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
        reason: `저온 조건에서 "${taskName}" 작업은 양생·동결·부착 품질 확보에 주의가 필요합니다.`,
        title: '저온 연동 위험',
      })
    }
  })

  return result
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

const dashboard = ref(createEmptyDashboard())
const loading = ref(false)
const reportDate = ref(getTodayDateText())
const linkedPlanSegments = ref([])

const todayHeadline = computed(() => dashboard.value.today?.headlineTemp || '--°C / --°C')
const todaySummary = computed(() => dashboard.value.today?.summary || '기상 정보 없음')
const weekSummary = computed(() => dashboard.value.week?.summary || '3일 특이 기상 정보 없음')
const rainValue = computed(() => dashboard.value.rain?.value || '0%')
const briefingDescription = computed(() => dashboard.value.briefing?.description || '기상 브리핑 정보가 없습니다.')
const threeDayForecast = computed(() => (dashboard.value.forecastDays || []).slice(0, 3))
const derivedAnalysis = computed(() => buildAnalysisFromDashboard(dashboard.value))

const linkedPlanRisks = computed(() =>
  buildLinkedPlanRisks(linkedPlanSegments.value, derivedAnalysis.value),
)

const equipmentPrimary = computed(() => {
  const risky = (dashboard.value.equipmentRisks || []).find((item) => item.level && item.level !== '안정')
  return risky || null
})

const planPrimary = computed(() => {
  const linked = linkedPlanRisks.value[0]
  if (linked) {
    return {
      title: T.row3Title,
      level: linked.level,
      reason: linked.reason,
    }
  }

  const risky = (dashboard.value.planRisks || []).find((item) => item.level && item.level !== '안정')
  return risky
    ? {
      title: T.row3Title,
      level: risky.level,
      reason: `${risky.reason} ${risky.action || ''}`.trim(),
    }
    : null
})

const equipmentSummary = computed(() => {
  if (!equipmentPrimary.value) {
    return '현재 기준 경고할 위험 장비 통제가 없습니다.'
  }
  return `${equipmentPrimary.value.reason} ${equipmentPrimary.value.action || ''}`.trim()
})

const planSummary = computed(() => {
  if (!planPrimary.value) {
    return '현재 기준 계획 대비 경고할 위험이 없습니다.'
  }
  return planPrimary.value.reason
})

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

  const merged = [...linked, ...equipment, ...plans]
  const seen = new Set()

  return merged.filter((item) => {
    const key = `${item.label}-${item.reason}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

async function loadDashboard() {
  loading.value = true
  try {
    linkedPlanSegments.value = getPlanSegmentsByDate(reportDate.value)

    const response = await fetch(`${API_BASE_URL}/weather/dashboard?reportDate=${reportDate.value}`)
    if (!response.ok) {
      throw new Error('기상 관제 조회 실패')
    }

    dashboard.value = await response.json()
  } catch (error) {
    console.error(error)
    dashboard.value = createEmptyDashboard()
    linkedPlanSegments.value = getPlanSegmentsByDate(reportDate.value)
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
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-sky-50/30 to-flare-50/20 p-6 shadow-card">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-forena-500 to-flare-500" />
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-forena-700 text-white shadow-md">
            <CloudSun class="h-5 w-5" />
          </span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-600">{{ T.kicker }}</p>
            <h1 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.title }}</h1>
            <p class="mt-2 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
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
        <p class="text-[11px] font-bold text-forena-500">{{ T.demoToday }}</p>
        <p class="mt-2 text-2xl font-bold tabular-nums text-forena-900">{{ todayHeadline }}</p>
        <p class="mt-1 text-sm text-slate-600">{{ todaySummary }}</p>
      </article>

      <article class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
        <p class="text-[11px] font-bold text-forena-500">{{ T.demoWeek }}</p>
        <p class="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
          <Wind class="h-4 w-4 shrink-0" />
          {{ weekSummary }}
        </p>
        <p class="mt-2 text-xs text-slate-500">{{ dashboard.week?.subSummary }}</p>
      </article>

      <article class="rounded-2xl border border-sky-100/90 bg-sky-50/50 p-5 shadow-card">
        <p class="text-[11px] font-bold text-sky-800">{{ T.demoRain }}</p>
        <p class="mt-2 flex items-center gap-2 text-sm text-sky-900">
          <Droplets class="h-4 w-4" />
          {{ rainValue }}
        </p>
      </article>

      <article class="rounded-2xl border border-violet-100/90 bg-violet-50/50 p-5 shadow-card">
        <p class="text-[11px] font-bold text-violet-800">{{ T.linkedPlanCount }}</p>
        <p class="mt-2 text-2xl font-bold tabular-nums text-violet-900">{{ linkedPlanSegments.length }}건</p>
        <p class="mt-1 text-xs text-slate-500">작업 계획 업로드 기준 당일 해당 공정</p>
      </article>
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
          <p class="mt-2 text-sm font-bold text-forena-900">{{ day.weatherLabel }}</p>
          <p class="mt-1 text-xs text-slate-600">
            {{ day.maxTemp ?? '--' }}°C / {{ day.minTemp ?? '--' }}°C
          </p>
          <p class="mt-1 text-xs text-sky-700">강수확률 {{ day.precipitationProbability ?? 0 }}%</p>
        </article>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-forena-50/50 px-5 py-3">
        <h2 class="text-sm font-bold text-forena-900">{{ T.catInfo }} {{ T.dot }} {{ T.catControl }}</h2>
      </div>
      <div class="divide-y divide-forena-50">
        <div class="grid gap-1 p-4 md:grid-cols-[200px_1fr] md:items-start">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-lg bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-800">{{ T.catControl }}</span>
            <CalendarRange class="h-4 w-4 text-flare-600" />
          </div>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <h3 class="font-bold text-forena-900">{{ T.row1Title }}</h3>
            <p class="text-slate-600">{{ briefingDescription }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-forena-50/50 px-5 py-3">
        <h2 class="text-sm font-bold text-forena-900">{{ T.catRisk }}</h2>
      </div>

      <div class="divide-y divide-forena-50">
        <div class="grid gap-4 p-5 md:grid-cols-[200px_1fr] md:items-start">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-800">{{ T.badgeAi
            }}</span>
            <Sparkles class="h-4 w-4 text-violet-600" />
          </div>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <h3 class="font-bold text-forena-900">{{ T.row2Title }}</h3>
            <span class="rounded-md px-2 py-0.5 text-[10px] font-bold"
              :class="equipmentPrimary ? levelBadgeClass(equipmentPrimary.level) : 'bg-emerald-100 text-emerald-900'">
              {{ equipmentPrimary ? equipmentPrimary.level : '안정' }}
            </span>
            <p class="text-slate-600">{{ equipmentSummary }}</p>
          </div>
        </div>

        <div class="grid gap-4 p-5 md:grid-cols-[200px_1fr] md:items-start">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-800">{{ T.badgePlan }}</span>
            <AlertTriangle class="h-4 w-4 text-rose-600" />
          </div>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <h3 class="font-bold text-forena-900">{{ T.row3Title }}</h3>
            <span class="rounded-md px-2 py-0.5 text-[10px] font-bold"
              :class="planPrimary ? levelBadgeClass(planPrimary.level) : 'bg-emerald-100 text-emerald-900'">
              {{ planPrimary ? planPrimary.level : '안정' }}
            </span>
            <p class="text-slate-600">{{ planSummary }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-rose-100/80 bg-rose-50/30 p-5 shadow-card">
      <h3 class="flex items-center gap-2 text-sm font-bold text-rose-900">
        <AlertTriangle class="h-4 w-4" />
        {{ T.liveRisk }}
      </h3>

      <div v-if="loading" class="mt-3 rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-600">
        기상 관제 데이터를 불러오는 중입니다...
      </div>

      <ul v-else class="mt-3 space-y-2">
        <li v-for="r in riskFlags" :key="r.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/60 bg-white px-4 py-3 text-sm">
          <span class="font-semibold text-forena-900">{{ r.label }}</span>
          <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="levelBadgeClass(r.level)">
            {{ r.level }}
          </span>
          <p class="w-full text-xs text-slate-600">{{ r.reason }}</p>
        </li>

        <li v-if="riskFlags.length === 0"
          class="rounded-xl border border-rose-200/60 bg-white px-4 py-3 text-sm text-slate-600">
          현재 기준 표시할 위험 통제 추천이 없습니다.
        </li>
      </ul>
    </div>
  </div>
</template>