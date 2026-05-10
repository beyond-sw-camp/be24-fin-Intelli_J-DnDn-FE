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
import { getEsgDashboard, saveEsgSnapshot } from '@/api/esgDashboard.js'
import { getProjectList } from '@/api/project.js'
import { getReportsByDate } from '@/api/report.js'
import { fetchWeatherDashboard } from '@/api/weatherControl.js'
import { getStaffingWorkerPool } from '@/api/staffing.js'
import { getGateEquipments } from '@/api/workOrder.js'
import { fetchWorkPlansByProject } from '@/api/workplan.js'
import { fetchWorkerList } from '@/api/worker.js'
import { useAuthStore } from '@/stores/authStore.js'
import {
  buildDashboardZones,
  buildEsgBreakdown,
  buildMissions,
  buildProjectSiteItems,
  buildSnapshotPayload,
  buildZoneMetricCards,
  calculateOperatingRiskCount,
  calculateSafetyDays,
  LEVEL_THRESHOLDS,
  resolveLevel,
} from '@/utils/esgDashboardMapper.js'

const authStore = useAuthStore()

const reportDate = ref(getTodayDateText())
const loading = ref(false)
const lastUpdatedAt = ref('')
const dashboard = ref(null)
const selectedProjectId = ref(authStore.projectId ?? null)
const selectedZoneId = ref('')
const activeEsgKey = ref('E')
let refreshTimer = null

const projects = ref([])
const backendRankings = ref([])
const backendCurrentProject = ref(null)
const backendCurrentSnapshot = ref(null)
const sites = ref([])

const equipmentsData = ref([])
const workPlansData = ref([])
const reportsData = ref([])
const workersData = ref([])
const staffingWorkersData = ref([])

const selectedSiteId = computed(() => String(selectedProjectId.value ?? currentProject.value?.idx ?? ''))
const currentProject = computed(() => {
  return projects.value.find((project) => String(project.idx) === String(selectedProjectId.value))
    ?? backendCurrentProject.value
    ?? projects.value[0]
    ?? null
})
const currentProjectId = computed(() => currentProject.value?.idx ?? selectedProjectId.value ?? null)

const weatherToday = computed(() => dashboard.value?.today ?? null)
const weatherAnalysis = computed(() => dashboard.value?.analysis ?? null)
const airQuality = computed(() => dashboard.value?.airQuality ?? null)
const equipmentRisks = computed(() => normalizeArray(dashboard.value?.equipmentRisks))
const planRisks = computed(() => normalizeArray(dashboard.value?.planRisks))

const weatherRiskCount = computed(() =>
  (equipmentRisks.value?.length ?? 0) + (planRisks.value?.length ?? 0)
)

const gateEquipmentsForCurrentProject = computed(() => {
  return equipmentsData.value.filter((equipment) => {
    const dateMatched = normalizeDateText(equipment.workDate) === reportDate.value
    if (!dateMatched) return false

    if (equipment.siteIdx != null && currentProjectId.value != null) {
      return String(equipment.siteIdx) === String(currentProjectId.value)
    }

    return authStore.projectId != null
  })
})

const workPlanEquipmentsForCurrentProject = computed(() => {
  if (!currentProjectId.value) return []
  return buildWorkPlanEquipmentRows(workPlansData.value, reportDate.value)
})

const filteredEquipments = computed(() => {
  if (gateEquipmentsForCurrentProject.value.length) {
    return gateEquipmentsForCurrentProject.value
  }
  return workPlanEquipmentsForCurrentProject.value
})

const realMissionRate = computed(() => {
  const equipments = filteredEquipments.value
  if (!equipments.length) return 0
  const working = equipments.filter((equipment) => equipment.statusLabel === '작업중').length
  return Math.round((working / equipments.length) * 100)
})

const safetyDays = computed(() => {
  return backendCurrentProject.value?.safetyDays
    ?? backendCurrentSnapshot.value?.safetyDays
    ?? calculateSafetyDays(currentProject.value, reportDate.value)
})

const dashboardContext = computed(() => ({
  weatherAnalysis: weatherAnalysis.value,
  airQuality: airQuality.value,
  weatherRiskCount: weatherRiskCount.value,
  missionRate: realMissionRate.value,
  reports: reportsData.value,
  workOrders: filteredEquipments.value,
  workers: workersData.value,
  staffingWorkers: staffingWorkersData.value,
  safetyDays: safetyDays.value,
  currentProjectId: currentProjectId.value,
}))

const siteZones = computed(() => {
  return buildDashboardZones(filteredEquipments.value, dashboardContext.value)
})

const selectedZone = computed(() => {
  return siteZones.value.find((zone) => zone.id === selectedZoneId.value) ?? siteZones.value[0]
})

const esgBreakdown = computed(() => {
  const iconMap = {
    E: Leaf,
    S: ShieldCheck,
    G: Gauge,
  }
  return buildEsgBreakdown(selectedZone.value, {
    airQuality: airQuality.value,
    safetyDays: safetyDays.value,
  }).map((item) => ({
    ...item,
    icon: iconMap[item.key],
  }))
})

const currentSiteSummary = computed(() => {
  const zones = siteZones.value
  if (!zones.length) {
    return {
      score: backendCurrentSnapshot.value?.totalScore ?? 0,
      level: resolveLevel(backendCurrentSnapshot.value?.totalScore ?? 0),
      carbon: backendCurrentSnapshot.value?.carbonKg ?? 0,
      powerSaving: backendCurrentSnapshot.value?.powerSavingKwh ?? 0,
      riskCount: backendCurrentSnapshot.value?.riskCount ?? 0,
      missionRate: backendCurrentSnapshot.value?.missionRate ?? 0,
    }
  }

  const avgScore = Math.round((zones.reduce((sum, zone) => sum + zone.score, 0) / zones.length) * 10) / 10
  return {
    score: avgScore,
    level: resolveLevel(avgScore),
    carbon: zones.reduce((sum, zone) => sum + Number(zone.carbon || 0), 0),
    powerSaving: zones.reduce((sum, zone) => sum + Number(zone.powerSaving || 0), 0),
    riskCount: calculateOperatingRiskCount(filteredEquipments.value, weatherRiskCount.value),
    missionRate: realMissionRate.value,
  }
})

const currentSite = computed(() => {
  const fallback = sites.value.find((site) => site.id === selectedSiteId.value) ?? sites.value[0]
  return {
    ...fallback,
    id: selectedSiteId.value || fallback?.id || 'current-site',
    projectId: currentProjectId.value,
    name: backendCurrentProject.value?.name ?? fallback?.name ?? currentProject.value?.name ?? '현장명 미지정',
    shortName: fallback?.shortName ?? backendCurrentProject.value?.name ?? '현장',
    address: backendCurrentProject.value?.location ?? fallback?.address ?? currentProject.value?.location ?? '',
    snapshotSaved: backendCurrentSnapshot.value?.snapshotSaved ?? fallback?.snapshotSaved ?? false,
    startDate: backendCurrentProject.value?.startDate ?? fallback?.startDate ?? currentProject.value?.startDate ?? null,
    endDate: backendCurrentProject.value?.endDate ?? fallback?.endDate ?? currentProject.value?.endDate ?? null,
    ...currentSiteSummary.value,
  }
})

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

const zoneMetricCards = computed(() => buildZoneMetricCards(
  selectedZone.value,
  activeEsgKey.value,
  { AlertTriangle, Droplets, Factory, Gauge, HardHat, Leaf, Medal, ShieldCheck, Users, Zap },
  { safetyDays: safetyDays.value },
))

const missions = computed(() => buildMissions(selectedZone.value, currentSite.value))

const siteRankingItems = computed(() => {
  const current = currentSite.value
  const merged = sites.value.map((site) => {
    if (String(site.id) !== String(current.id)) return site
    return {
      ...site,
      ...current,
    }
  })

  if (!merged.find((site) => String(site.id) === String(current.id))) {
    merged.push(current)
  }

  return merged.sort((a, b) => {
    if (a.snapshotSaved !== b.snapshotSaved) return a.snapshotSaved ? -1 : 1
    return b.score - a.score
  })
})
const siteLeader = computed(() => siteRankingItems.value[0])
const currentSiteRank = computed(() => {
  return siteRankingItems.value.findIndex((site) => String(site.id) === String(selectedSiteId.value)) + 1
})
const scoreGapToLeader = computed(() => {
  return Math.max(0, (siteLeader.value?.score ?? currentSite.value.score) - currentSite.value.score).toFixed(1)
})
const rankingComparison = computed(() => {
  if (!siteRankingItems.value.length) return '현장 ESG 스냅샷을 불러오는 중입니다.'
  if (currentSiteRank.value <= 1) return '현재 선택 현장이 ESG 순위 1위입니다.'
  return `${siteLeader.value?.name ?? '상위 현장'}까지 ${scoreGapToLeader.value}점 부족`
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
      detail: '장비 대기시간과 세척수·전력 피크 관리 미션 중심으로 운영하면 됩니다.',
      level: '양호',
    },
  ]
})

async function loadAll() {
  loading.value = true
  try {
    await loadEsgDashboardMeta()
    await Promise.all([
      loadDashboard(),
      loadEquipments(),
      loadWorkPlans(),
      loadReports(),
      loadWorkers(),
    ])
    await persistCurrentSnapshot()
    await loadEsgDashboardMeta(false)
    lastUpdatedAt.value = formatTime(new Date())
  } finally {
    loading.value = false
  }
}

async function loadEsgDashboardMeta(useCurrentSelection = true) {
  try {
    const response = await getEsgDashboard({
      reportDate: reportDate.value,
      projectId: useCurrentSelection ? selectedProjectId.value : currentProjectId.value,
    })
    const payload = unwrapPayload(response)
    backendCurrentProject.value = payload?.currentProject ?? null
    backendCurrentSnapshot.value = payload?.currentSnapshot ?? null
    projects.value = normalizeArray(payload?.projects)
    backendRankings.value = normalizeArray(payload?.rankings)

    if (!selectedProjectId.value) {
      selectedProjectId.value = backendCurrentProject.value?.idx ?? authStore.projectId ?? projects.value[0]?.idx ?? null
    }

    sites.value = buildProjectSiteItems(projects.value, backendRankings.value, selectedProjectId.value)
  } catch {
    projects.value = await loadProjectFallback()
    sites.value = buildProjectSiteItems(projects.value, [], selectedProjectId.value)
  }
}

async function loadProjectFallback() {
  try {
    return normalizeArray(await getProjectList())
  } catch {
    return []
  }
}

async function loadDashboard() {
  try {
    const response = await fetchWeatherDashboard(reportDate.value)
    dashboard.value = unwrapPayload(response)
  } catch {
    dashboard.value = null
  }
}

async function loadEquipments() {
  try {
    const response = await getGateEquipments(reportDate.value)
    equipmentsData.value = normalizeArray(response)
  } catch {
    equipmentsData.value = []
  }
}

async function loadWorkPlans() {
  if (!currentProjectId.value) {
    workPlansData.value = []
    return
  }

  try {
    const response = await fetchWorkPlansByProject(currentProjectId.value, { includeAllTrades: true })
    workPlansData.value = normalizeArray(response)
  } catch {
    workPlansData.value = []
  }
}

async function loadReports() {
  try {
    const response = await getReportsByDate(reportDate.value)
    reportsData.value = normalizeArray(response)
  } catch {
    reportsData.value = []
  }
}

async function loadWorkers() {
  const [workerResponse, staffingResponse] = await Promise.allSettled([
    fetchWorkerList(reportDate.value),
    getStaffingWorkerPool({ rosterDate: reportDate.value }),
  ])

  workersData.value = workerResponse.status === 'fulfilled'
    ? normalizeArray(workerResponse.value?.rows ?? workerResponse.value)
    : []
  staffingWorkersData.value = staffingResponse.status === 'fulfilled'
    ? normalizeArray(staffingResponse.value?.rows ?? staffingResponse.value)
    : []
}

async function persistCurrentSnapshot() {
  if (!currentProjectId.value || !siteZones.value.length) return

  try {
    const payload = buildSnapshotPayload({
      reportDate: reportDate.value,
      currentSite: currentSite.value,
      siteZones: siteZones.value,
      esgBreakdown: esgBreakdown.value,
      safetyDays: safetyDays.value,
    })
    backendCurrentSnapshot.value = await saveEsgSnapshot(payload)
  } catch {
    // ESG 스냅샷 저장 실패는 화면 표시를 막지 않는다.
  }
}


function buildWorkPlanEquipmentRows(workPlans, targetDate) {
  return normalizeArray(workPlans)
    .filter((plan) => isDateInPlanRange(
      targetDate,
      plan.startDate ?? plan.start,
      plan.endDate ?? plan.end ?? plan.effectiveEnd,
    ))
    .flatMap((plan) => {
      const equipmentEntries = parseEquipmentEntries(plan.equipmentDisplay ?? plan.equipmentText, plan.equipment)
      if (!equipmentEntries.length) {
        return [{
          idx: `plan-${plan.idx ?? plan.id}-default`,
          workOrderIdx: null,
          workOrderRef: plan.idx ? `WP-${plan.idx}` : 'WP',
          title: firstText(plan.name, plan.tradeProcessName, '작업 계획'),
          tradeType: firstText(plan.trade, plan.tradeProcessName, ''),
          workDetail: firstText(plan.note, plan.name, ''),
          workDate: targetDate,
          workLocation: firstText(plan.location, plan.zone, '작업구역 미지정'),
          gateIdx: null,
          equipmentName: '장비 미지정',
          equipmentType: '중장비',
          equipmentCount: 1,
          statusLabel: plan.status === '진행 중' ? '작업중' : '입차예정',
        }]
      }

      return equipmentEntries.map((equipment, index) => ({
        idx: `plan-${plan.idx ?? plan.id}-${index}`,
        workOrderIdx: null,
        workOrderRef: plan.idx ? `WP-${plan.idx}` : 'WP',
        title: firstText(plan.name, plan.tradeProcessName, '작업 계획'),
        tradeType: firstText(plan.trade, plan.tradeProcessName, ''),
        workDetail: firstText(plan.note, plan.name, ''),
        workDate: targetDate,
        workLocation: firstText(plan.location, plan.zone, '작업구역 미지정'),
        gateIdx: null,
        equipmentName: equipment.name,
        equipmentType: equipment.name,
        equipmentCount: equipment.count,
        statusLabel: plan.status === '진행 중' ? '작업중' : '입차예정',
      }))
    })
}

function parseEquipmentEntries(displayText, rawEquipment) {
  if (Array.isArray(rawEquipment) && rawEquipment.length) {
    return rawEquipment
      .map((equipment) => {
        if (typeof equipment === 'string') return parseEquipmentText(equipment)
        return {
          name: firstText(equipment.type, equipment.equipmentName, equipment.name, '중장비'),
          count: normalizePositiveNumber(equipment.count ?? equipment.equipmentCount, 1),
        }
      })
      .filter((equipment) => equipment.name)
  }

  return String(displayText ?? '')
    .split(',')
    .map((text) => parseEquipmentText(text))
    .filter((equipment) => equipment.name)
}

function parseEquipmentText(text) {
  const normalized = String(text ?? '').trim()
  if (!normalized) return { name: '', count: 0 }

  const match = normalized.match(/^(.+?)\s*(\d+)\s*대?$/)
  if (!match) return { name: normalized, count: 1 }

  return {
    name: match[1].trim(),
    count: normalizePositiveNumber(match[2], 1),
  }
}

function isDateInPlanRange(targetDate, startDate, endDate) {
  const target = normalizeDateText(targetDate)
  const start = normalizeDateText(startDate)
  const end = normalizeDateText(endDate || startDate)
  if (!target || !start) return false
  return target >= start && target <= (end || start)
}

function firstText(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

function normalizePositiveNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
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
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.list)) return value.list
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.workers)) return value.workers
  return []
}

function normalizeDateText(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
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
  if (level === '주의' || level === '관리' || level === '대기') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border-emerald-200'
}

onMounted(() => {
  loadAll()
  refreshTimer = setInterval(() => {
    loadAll()
  }, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

watch(reportDate, () => {
  loadAll()
})

watch(siteZones, (zones) => {
  if (!zones.length) return
  if (!zones.find((zone) => zone.id === selectedZoneId.value)) {
    selectedZoneId.value = zones[0].id
  }
}, { immediate: true })
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
              <h1 class="text-3xl font-black tracking-tight">ESG 대시보드</h1>
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
              @click="loadAll"
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
            <p class="mt-2 text-4xl font-black tabular-nums">{{ airQuality?.value ?? '-' }}<span class="text-lg text-emerald-100">{{ airQuality?.value != null ? '㎍/㎥' : '' }}</span></p>
            <p class="mt-1 text-xs text-emerald-100">{{ airQuality?.label || '미세먼지 연동 대기' }}</p>
          </div>

          <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
              <ShieldCheck class="h-3.5 w-3.5 text-sky-200" />
              안전 무사고 일수
            </p>
            <p class="mt-2 text-4xl font-black tabular-nums">{{ safetyDays }}<span class="text-lg text-emerald-100">일</span></p>
            <p class="mt-1 text-xs text-emerald-100">현장 시작일 기준</p>
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
            <p class="text-[11px] font-bold uppercase tracking-wide text-amber-600">Site Ranking</p>
            <h2 class="mt-1 text-xl font-black text-forena-900">현장 ESG 순위</h2>
          </div>
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
            {{ rankingComparison }}
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
              <p class="text-lg font-black tabular-nums text-emerald-800">{{ item.snapshotSaved ? item.score : '산정 대기' }}</p>
            </div>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-forena-100">
              <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${item.snapshotSaved ? item.score : 0}%` }" />
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
          {{ currentSite.snapshotSaved ? `${currentSite.shortName} 현장 ESG 스냅샷 반영` : `${currentSite.shortName} 현장 ESG 계산 결과` }}
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