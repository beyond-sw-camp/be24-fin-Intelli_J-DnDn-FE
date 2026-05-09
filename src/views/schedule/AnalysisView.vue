<script setup>
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { fetchProgressList, fetchDelayRiskTasks } from '@/api/analysis.js'
import {
  createAiScheduleRecommendation,
  fetchAiScheduleRecommendation,
} from '@/api/aischedulerecommendation.js'
import {
  createScheduleChange,
  fetchScheduleChangeList,
  fetchScheduleChangeHistory,
  approveScheduleChange,
  rejectScheduleChange,
  applyScheduleChange,
} from '@/api/schedulechange.js'
import api from '@/api/index'
import {
  AlertTriangle,
  Sparkles,
  Pencil,
  X,
  Check,
  ShieldCheck,
  UserCog,
  Eye,
  Send,
  CheckCircle2,
  Clock,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Paperclip,
  RefreshCw,
  Layers,
  BarChart3,
  Activity,
  ListChecks,
  History,
  Search,
  LoaderCircle,
} from 'lucide-vue-next'

// ─── 권한 / 역할 ──────────────────────────────────────────────────────────
// 공종(trade) = 백엔드 fetchProgressList 응답의 각 항목 (예: "공통/가설", "토공사", "골조공사" ...)
// 권한은 공종 단위로 부여됨. 'all' 은 현장 총 책임자(전체 공종 권한)
// currentTrade 값: 'all' | tradeProcessId(number)
const currentTrade = ref('all')

const isSupervisor = computed(() => currentTrade.value === 'all')

// 권한 선택은 세부 공정이 아니라 대표 공종 단위로만 노출
const tradeAuthorityOptions = computed(() => {
  const names = new Set()
  processes.value.forEach((p) => {
    const tradeName = inferRepresentativeTradeName(p)
    if (tradeName && tradeName !== '기타') names.add(tradeName)
  })
  return Array.from(names).map((name) => ({ id: `trade:${name}`, name }))
})

// 현재 선택된 공종 (현장 총 책임자면 null)
const currentTradeItem = computed(() => {
  if (isSupervisor.value) return null
  return { id: `trade:${currentTrade.value}`, name: currentTrade.value }
})

const currentTradeLabel = computed(() => {
  if (isSupervisor.value) return '현장 총 책임자'
  return currentTradeItem.value ? `${currentTradeItem.value.name} 공종 책임자` : '공종 책임자'
})

watch(currentTrade, () => {
  filterProcess.value = '전체'
})

// ─── 필터 ────────────────────────────────────────────────────────────────
const selectedTradeId = ref(null)
const filterPeriod = ref('2026-05')
const filterProcess = ref('전체')
const filterStatus = ref('전체')
const filterRisk = ref('전체')
watch([currentTrade, filterProcess], () => {
  if (processes.value.length > 0) {
    loadDelayRiskTasks()
  }
})

watch(selectedTradeId, () => {
  if (processes.value.length > 0) {
    loadDelayRiskTasks()
  }
})

// ─── 탭 ──────────────────────────────────────────────────────────────────
// 5개 → 3개로 통합. 워크플로우(현황 → AI 추천/작업 → 승인/이력) 순서 반영
const activeTab = ref('overview')
const tabs = computed(() => [
  { key: 'overview', label: '현황 분석', icon: BarChart3 },
  { key: 'ai', label: '지연 위험 작업', icon: Activity },
  {
    key: 'change',
    label: isSupervisor.value ? '변경 승인 · 이력' : '변경 요청 · 이력',
    icon: ClipboardList,
  },
])

// 변경 관리 탭 내부 서브뷰
const changeSubView = ref('active') // 'active' (요청/승인) | 'history' (이력)

function selectMainTab(key) {
  activeTab.value = key
  if (key === 'change' && !['active', 'history'].includes(changeSubView.value)) {
    changeSubView.value = 'active'
  }
}

function selectChangeSubView(view) {
  activeTab.value = 'change'
  changeSubView.value = view
}

// ─── 백엔드 연동 데이터 ───────────────────────────────────────────────────
const PROJECT_ID = 1

const processes = ref([])
const delayTasks = ref([])

// 지연 위험 추천에서 일정 재분배는 공종 전체가 아니라
// 선택된 월간 세부계획의 하위 주간/일일 세부일정만 대상으로 한다.
const monthlyWorkPlans = ref([])
const weeklyWorkPlans = ref([])
const todayReports = ref([])

const loading = ref(false)
const errorMessage = ref('')

const ALL_PROCESSES = computed(() => {
  return processes.value.map((p) => p.name)
})

function mapProgressItem(item) {
  return {
    id: item.tradeProcessId,
    name: item.name,
    tradeName: item.tradeName ?? item.trade ?? item.tradeProcessTradeName ?? '',
    plannedPct: item.plannedPct ?? 0,
    actualPct: item.actualPct ?? 0,
    plannedStart: item.plannedStart ?? '',
    plannedEnd: item.plannedEnd ?? '',
    actualStart: item.actualStart ?? '',
    forecastEnd: item.forecastEnd ?? '',
    actualSource: item.actualSource ?? 'NONE',
    latestReportDate: item.latestReportDate ?? '',
    analysisDate: item.analysisDate ?? item.latestReportDate ?? '',
    status: item.status ?? '정상',
    risk: item.risk ?? '낮음',
    partner: item.partner ?? '-',
    actualWorkers: item.actualWorkers ?? 0,
  }
}

function progressSourceLabel(source) {
  return source === 'DAILY_REPORT' ? '공사일보 기준' : '공사일보 미작성'
}

function hasDailyReportProgress(item) {
  return item?.actualSource === 'DAILY_REPORT' || item?.hasReport === true
}

function inferRepresentativeTradeName(record) {
  const explicit = String(record?.tradeName ?? '').trim()
  if (explicit && explicit !== '기타' && explicit !== 'ETC') return explicit

  const text = [record?.name, record?.tradeProcessName, record?.processName, record?.trade]
    .filter(Boolean)
    .join(' ')

  if (/현장 개설|가설|타워크레인|리프트|양중/.test(text)) return '공통/가설'
  if (/지장물|부지정리|흙막이|터파기|토사|되메우기|굴착/.test(text)) return '토공사'
  if (/PHC|파일|지반보강|기초/.test(text)) return '지정/기초'
  if (/골조|철근콘크리트|철근|거푸집|콘크리트|지하층|지상/.test(text)) return '골조공사'
  if (
    /방수|조적|미장|단열|창호|유리|석공|금속|잡철|타일|수장|도장|목공|가구|내장|인테리어|마감/.test(
      text,
    )
  )
    return '건축마감'
  if (/위생|급수|배수|난방|환기|공조|소방기계|기계실|자동제어|BMS|설비/.test(text))
    return '기계/설비'
  if (/수변전|간선|전기|조명|통신|홈네트워크|CCTV|소방전기|비상방송|수전/.test(text))
    return '전기/통신'
  if (/부대토목|우오수|상하수도|도로|주차장|포장|조경|식재|놀이터/.test(text)) return '토목/조경'
  if (/커미셔닝|품질점검|사용승인|준공|검사|시운전/.test(text)) return '준공/검사'

  return '기타'
}

const DAY_MS = 24 * 60 * 60 * 1000

function parseDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateKey(value = new Date()) {
  const d = value instanceof Date ? value : parseDate(value)
  if (!d) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function addDays(dateValue, days) {
  const d = parseDate(dateValue)
  if (!d) return null
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function daysInclusive(startDate, endDate) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (!start || !end) return 1
  return Math.max(1, Math.round((end - start) / DAY_MS) + 1)
}

function clampPct(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function roundPct(value, digits = 1) {
  const scale = 10 ** digits
  return Math.round(clampPct(value) * scale) / scale
}

function riskFromDiff(diff, ended, actualPct) {
  // 차이 = 실제 진척률 - 계획 진척률
  // 차이 >= 0%p: 정상
  // -3%p < 차이 < 0%p: 낮음/주의
  // 차이 <= -3%p: 지연 위험
  // 종료일 초과 + 미완료: 지연 발생
  if (ended && actualPct < 100) return '매우 높음'
  if (diff <= -3) return '높음'
  if (diff < 0) return '보통'
  return '낮음'
}

function statusFromDiff(diff, ended, actualPct, startDate, baseDate = new Date()) {
  const start = parseDate(startDate)
  const base = parseDate(baseDate)
  if (start && base && base < start) return '시작 전'
  if (actualPct >= 100) return '완료'
  if (ended && actualPct < 100) return '지연'
  if (diff <= -3) return '지연 위험'
  if (diff < 0) return '주의'
  return '정상'
}

function calcExpectedDelayDays(startDate, endDate, plannedPct, actualPct) {
  const lack = Math.max(0, Number(plannedPct || 0) - Number(actualPct || 0))
  if (lack <= 0) return 0
  const dailyAllocation = 100 / daysInclusive(startDate, endDate)
  return Math.max(1, Math.ceil(lack / dailyAllocation))
}

function normalizeListResponse(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

async function loadWorkPlanDetails() {
  const [monthlyRes, weeklyRes] = await Promise.all([
    api.get('/work-plan', { params: { planType: '월간' } }).catch(() => ({ data: [] })),
    api.get('/work-plan', { params: { planType: '주간' } }).catch(() => ({ data: [] })),
  ])

  monthlyWorkPlans.value = normalizeListResponse(monthlyRes)
  weeklyWorkPlans.value = normalizeListResponse(weeklyRes)
}

async function loadTodayReports() {
  const today = toDateKey(new Date())
  const res = await api.get('/report/', { params: { date: today } }).catch(() => ({ data: [] }))
  todayReports.value = normalizeListResponse(res)
}

function getPlanId(plan) {
  return Number(plan?.idx ?? plan?.id ?? plan?.workPlanId ?? 0)
}

function findMonthlyPlanForTask(item) {
  const targetId = Number(item?.workPlanId ?? item?.idx ?? item?.id ?? 0)
  const byId = monthlyWorkPlans.value.find((p) => getPlanId(p) === targetId)
  if (byId) return byId

  const targetName = String(item?.name ?? '').trim()
  if (targetName) {
    const byName = monthlyWorkPlans.value.find((p) => String(p.name ?? '').trim() === targetName)
    if (byName) return byName
  }

  return null
}

function findDetailSchedulesForMonthly(monthlyPlanId) {
  const id = Number(monthlyPlanId)
  if (!id) return []
  return weeklyWorkPlans.value
    .filter((p) => Number(p.parentWorkPlanId ?? p.parent_work_plan_id ?? p.parentId ?? 0) === id)
    .sort((a, b) => String(a.startDate ?? '').localeCompare(String(b.startDate ?? '')))
}

function isActionableDetailSchedule(schedule) {
  const id = getPlanId(schedule)
  const requiredCount = Number(schedule?.requiredCount ?? 0)
  const date = schedule?.startDate || schedule?.date
  return !!id && !!date && requiredCount > 0
}

function isSameOrAfter(dateValue, baseValue) {
  const d = parseDate(dateValue)
  const b = parseDate(baseValue)
  if (!d || !b) return false
  return d >= b
}

function hasTodayReportForDetailSchedule(schedule) {
  const scheduleId = getPlanId(schedule)
  if (!scheduleId) return false
  return todayReports.value.some((r) => Number(r.workPlanId ?? r.work_plan_id ?? 0) === scheduleId)
}

function hasTodayReportForMonthlyTask(detailSchedules) {
  return Array.isArray(detailSchedules) && detailSchedules.some(hasTodayReportForDetailSchedule)
}

const DEFAULT_WORK_START_TIME = '07:00'
const DEFAULT_WORK_END_TIME = '17:00'
const REST_HOURS = 2 // 07:00~17:00을 실작업 8시간으로 보기 위한 휴게시간
const MAX_WORK_HOURS = 10 // 하루 실작업 최대 권장 시간
const MAX_EXTRA_WORKERS_RATIO = 0.3 // 기존 인력 대비 최대 30% 증원 권장

function parseWorkTimeFromNote(note = '') {
  const text = String(note || '')

  const match = text.match(/\[작업시간\]\s*(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)

  if (!match) {
    return {
      startTime: DEFAULT_WORK_START_TIME,
      endTime: DEFAULT_WORK_END_TIME,
      workHours: calcWorkHours(DEFAULT_WORK_START_TIME, DEFAULT_WORK_END_TIME),
      source: 'DEFAULT',
    }
  }

  const startTime = match[1]
  const endTime = match[2]

  return {
    startTime,
    endTime,
    workHours: calcWorkHours(startTime, endTime),
    source: 'NOTE',
  }
}

function calcWorkHours(startTime, endTime) {
  const [sh, sm] = String(startTime).split(':').map(Number)
  const [eh, em] = String(endTime).split(':').map(Number)

  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  const diffHours = Math.max(0, (endMinutes - startMinutes) / 60)

  // 예: 07:00~17:00 = 10시간 체류 - 휴게 2시간 = 실작업 8시간
  return Math.max(1, diffHours - REST_HOURS)
}

function addWorkHoursToStartTime(startTime, workHours) {
  const [sh, sm] = String(startTime).split(':').map(Number)

  // 실작업시간 + 휴게시간을 포함해서 종료 시각 계산
  const totalMinutes = sh * 60 + sm + Math.round((workHours + REST_HOURS) * 60)

  const hh = Math.floor(totalMinutes / 60)
  const mm = totalMinutes % 60

  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function calcManHours(workerCount, workHours) {
  return Number((Number(workerCount || 0) * Number(workHours || 0)).toFixed(1))
}

function parseWorkTimeRange(timeRange = '') {
  const text = String(timeRange || '')
  const match = text.match(/(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)

  if (!match) {
    return {
      startTime: DEFAULT_WORK_START_TIME,
      endTime: DEFAULT_WORK_END_TIME,
      workHours: calcWorkHours(DEFAULT_WORK_START_TIME, DEFAULT_WORK_END_TIME),
    }
  }

  return {
    startTime: match[1],
    endTime: match[2],
    workHours: calcWorkHours(match[1], match[2]),
  }
}

function refreshProposalManHours(proposal) {
  if (!proposal) return

  const originalRange = parseWorkTimeRange(proposal.originalWorkTime)
  const recommendedRange = parseWorkTimeRange(proposal.recommendedWorkTime)
  const originalWorkers = Number(proposal.originalRequiredCount || 0)
  const recommendedWorkers = Number(proposal.recommendedRequiredCount || 0)

  proposal.originalWorkHours = originalRange.workHours
  proposal.recommendedWorkHours = recommendedRange.workHours
  proposal.originalManHours = calcManHours(originalWorkers, originalRange.workHours)
  proposal.recommendedManHours = calcManHours(recommendedWorkers, recommendedRange.workHours)
  proposal.additionalManHours = Number(
    Math.max(0, proposal.recommendedManHours - proposal.originalManHours).toFixed(1),
  )
  proposal.addedWorkers = Math.max(0, recommendedWorkers - originalWorkers)
  proposal.addedWorkHours = Number(
    Math.max(0, proposal.recommendedWorkHours - proposal.originalWorkHours).toFixed(1),
  )
}

function buildManHourAdjustment(schedule, targetRatio) {
  const currentWorkers = Number(schedule?.requiredCount ?? 0)
  const workTime = parseWorkTimeFromNote(schedule?.note || '')

  const originalWorkHours = workTime.workHours
  const originalManHours = calcManHours(currentWorkers, originalWorkHours)

  if (!currentWorkers || targetRatio <= 1) {
    return {
      originalWorkTime: `${workTime.startTime} ~ ${workTime.endTime}`,
      recommendedWorkTime: `${workTime.startTime} ~ ${workTime.endTime}`,
      originalWorkHours,
      recommendedWorkHours: originalWorkHours,
      originalManHours,
      recommendedManHours: originalManHours,
      additionalManHours: 0,
      recommendedRequiredCount: currentWorkers,
      addedWorkers: 0,
      addedWorkHours: 0,
      adjustmentReason: '추가 공수 조정 없이 기존 계획 유지가 가능합니다.',
    }
  }

  const requiredManHours = originalManHours * targetRatio
  const shortageManHours = Math.max(0, requiredManHours - originalManHours)

  let recommendedWorkers = currentWorkers
  let recommendedWorkHours = originalWorkHours

  // 1순위: 작업시간을 먼저 소폭 늘림
  if (targetRatio <= 1.15) {
    recommendedWorkHours = Math.min(MAX_WORK_HOURS, originalWorkHours + 1)
  }
  // 2순위: 인력 소폭 추가 + 작업시간 연장
  else if (targetRatio <= 1.35) {
    recommendedWorkers = currentWorkers + 1
    recommendedWorkHours = Math.min(MAX_WORK_HOURS, originalWorkHours + 1)
  }
  // 3순위: 인력 1~2명 추가 + 작업시간 1.5~2시간 연장
  else {
    const maxExtraWorkers = Math.max(1, Math.ceil(currentWorkers * MAX_EXTRA_WORKERS_RATIO))
    const estimatedExtraWorkers = Math.ceil(currentWorkers * Math.min(0.3, (targetRatio - 1) * 0.5))

    recommendedWorkers = currentWorkers + Math.min(maxExtraWorkers, estimatedExtraWorkers)
    recommendedWorkHours = Math.min(MAX_WORK_HOURS, originalWorkHours + 1.5)
  }

  const recommendedEndTime = addWorkHoursToStartTime(workTime.startTime, recommendedWorkHours)
  const recommendedManHours = calcManHours(recommendedWorkers, recommendedWorkHours)

  return {
    originalWorkTime: `${workTime.startTime} ~ ${workTime.endTime}`,
    recommendedWorkTime: `${workTime.startTime} ~ ${recommendedEndTime}`,
    originalWorkHours,
    recommendedWorkHours,
    originalManHours,
    recommendedManHours,
    additionalManHours: Number((recommendedManHours - originalManHours).toFixed(1)),
    shortageManHours: Number(shortageManHours.toFixed(1)),
    recommendedRequiredCount: recommendedWorkers,
    addedWorkers: Math.max(0, recommendedWorkers - currentWorkers),
    addedWorkHours: Number((recommendedWorkHours - originalWorkHours).toFixed(1)),
    adjustmentReason:
      targetRatio > 1.35
        ? '미달분이 커서 인력 소폭 증원과 작업시간 연장을 함께 검토하는 방식이 적절합니다.'
        : targetRatio > 1.15
          ? '작업시간 연장만으로는 부족할 수 있어 인력 1명 추가와 작업시간 연장을 함께 검토합니다.'
          : '미달분이 크지 않아 인력 증원보다 작업시간 소폭 연장 중심의 만회가 적절합니다.',
  }
}

function buildRedistributionPlan(task) {
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const start = parseDate(task?.plannedStart)
  const end = parseDate(task?.plannedEnd || task?.originalEnd)
  const plannedPct = clampPct(task?.plannedPct ?? 0)
  const actualPct = clampPct(task?.actualPct ?? 0)
  const detailSchedules = (Array.isArray(task?.detailSchedules) ? task.detailSchedules : []).filter(
    isActionableDetailSchedule,
  )

  const hasTodayReport = hasTodayReportForMonthlyTask(detailSchedules)
  const beforeWorkEnd = now.getHours() < 17

  // 금일 공사일보가 이미 있으면 오늘 실적은 반영된 것으로 보고, 만회 대상은 내일부터 시작한다.
  // 공사일보가 아직 없고 작업 종료 전이면 오늘 일정도 아직 진행 중이므로 대상에 포함한다.
  const redistributionBaseDate = hasTodayReport ? addDays(today, 1) : today
  const remainingSchedules = detailSchedules.filter((s) =>
    isSameOrAfter(s.startDate || s.date, redistributionBaseDate),
  )

  const emptyResult = (overrides = {}) => ({
    level: '계산 불가',
    remainingProgress: roundPct(100 - actualPct, 1),
    delayedProgress: roundPct(Math.max(0, plannedPct - actualPct), 1),
    remainingDays: 0,
    remainingScheduleCount: 0,
    catchUpScheduleCount: 0,
    normalDailyRate: 0,
    requiredDailyRate: 0,
    requiredPerScheduleRate: 0,
    catchUpPerScheduleRate: 0,
    focusedTargetRate: 0,
    ratio: 0,
    recommendedWorkers: 0,
    extensionDays: 0,
    hasTodayReport,
    beforeWorkEnd,
    carryOverFromToday: false,
    normalReturnDate: '',
    action: '월간 세부계획의 시작일과 종료일을 확인해야 일정 재분배를 계산할 수 있습니다.',
    days: [],
    ...overrides,
  })

  if (!start || !end) return emptyResult()

  const totalDays = daysInclusive(start, end)
  const normalDailyRate = 100 / totalDays
  const remainingProgress = Math.max(0, 100 - actualPct)
  const delayedProgress = Math.max(0, plannedPct - actualPct)
  const remainingDays = Math.max(0, Math.round((end - redistributionBaseDate) / DAY_MS) + 1)
  const carryOverFromToday = hasTodayReport && delayedProgress > 0

  if (actualPct >= 100 || remainingProgress <= 0) {
    return emptyResult({
      level: '완료',
      remainingProgress: 0,
      delayedProgress: 0,
      remainingDays,
      remainingScheduleCount: remainingSchedules.length,
      normalDailyRate: roundPct(normalDailyRate, 1),
      action: '월간 세부계획 진척률이 100%에 도달했습니다. 후속 공정 착수 가능 여부를 확인하세요.',
    })
  }

  if (remainingDays <= 0) {
    return emptyResult({
      level: '일정 변경 검토',
      remainingProgress: roundPct(remainingProgress, 1),
      delayedProgress: roundPct(delayedProgress, 1),
      remainingDays: 0,
      remainingScheduleCount: remainingSchedules.length,
      normalDailyRate: roundPct(normalDailyRate, 1),
      requiredDailyRate: roundPct(remainingProgress, 1),
      requiredPerScheduleRate: remainingSchedules.length
        ? roundPct(remainingProgress / remainingSchedules.length, 1)
        : 0,
      ratio: 999,
      extensionDays: Math.max(1, calcExpectedDelayDays(start, end, 100, actualPct)),
      carryOverFromToday,
      action: hasTodayReport
        ? '금일 공사일보는 반영되었지만 종료일까지 남은 하위 세부일정이 없습니다. 미완료분에 대한 일정 변경 요청을 검토하세요.'
        : '계획 종료일이 지났으므로 납기 내 만회가 어렵습니다. 지연 사유 확인 후 일정 변경 요청을 검토하세요.',
    })
  }

  if (!remainingSchedules.length) {
    return emptyResult({
      level: '세부일정 확인 필요',
      remainingProgress: roundPct(remainingProgress, 1),
      delayedProgress: roundPct(delayedProgress, 1),
      remainingDays,
      remainingScheduleCount: 0,
      normalDailyRate: roundPct(normalDailyRate, 1),
      requiredDailyRate: roundPct(remainingProgress / remainingDays, 1),
      action: hasTodayReport
        ? '금일 공사일보가 제출되어 오늘 일정은 실적에 반영했습니다. 미완료분을 이어받을 다음 하위 세부일정 매핑을 확인하세요.'
        : '남은 기간에 연결된 하위 세부일정이 없습니다. 월간 세부계획 아래의 주간/일일 계획 매핑을 먼저 확인하세요.',
    })
  }

  const requiredDailyRate = remainingProgress / remainingDays

  // 핵심: 남은 전체 작업량을 모든 일정에 균등 분배하지 않고,
  // 계획 대비 밀린 양(delayedProgress)만 1~3개의 가까운 하위 세부일정에 집중 만회한다.
  // 이후 일정은 기존 일일 목표 수준으로 복귀하는 것을 기본 목표로 한다.
  let targetCatchUpCount = 0
  if (delayedProgress > 0) {
    if (delayedProgress <= normalDailyRate * 0.5) targetCatchUpCount = 1
    else if (delayedProgress <= normalDailyRate * 1.0) targetCatchUpCount = 2
    else if (delayedProgress <= normalDailyRate * 1.5) targetCatchUpCount = 3
    else targetCatchUpCount = 3
  }

  const catchUpSchedules = remainingSchedules.slice(
    0,
    Math.min(targetCatchUpCount, remainingSchedules.length),
  )
  const catchUpScheduleCount = catchUpSchedules.length
  const catchUpPerScheduleRate =
    catchUpScheduleCount > 0 ? delayedProgress / catchUpScheduleCount : 0
  const focusedTargetRate =
    catchUpScheduleCount > 0 ? normalDailyRate + catchUpPerScheduleRate : normalDailyRate
  const ratio = normalDailyRate > 0 ? focusedTargetRate / normalDailyRate : 0

  let level = '기존 세부일정 유지 가능'
  let action = hasTodayReport
    ? '금일 공사일보는 이미 반영했습니다. 계획 대비 미달분이 없어 남은 하위 세부일정은 기존 목표대로 진행하면 됩니다.'
    : beforeWorkEnd
      ? '금일 작업이 아직 진행 중입니다. 현재 기준으로는 기존 세부일정 흐름을 유지하며 공사일보 제출 후 재분석하세요.'
      : '금일 공사일보가 아직 제출되지 않았습니다. 공사일보 제출 후 미달분 발생 여부를 기준으로 재분배를 확정하세요.'
  let extensionDays = 0

  if (delayedProgress > 0) {
    if (ratio > 1.5) {
      level = '집중 만회 고위험'
      action = hasTodayReport
        ? `금일 실적 반영 후 계획 대비 ${roundPct(delayedProgress, 1)}%p가 부족합니다. ${catchUpScheduleCount}개 하위 세부일정에 미완료분을 집중 반영하되, 작업 간섭이 크면 공수 조정 또는 일정 변경 검토가 필요합니다.`
        : `계획 대비 ${roundPct(delayedProgress, 1)}%p가 부족합니다. 가까운 ${catchUpScheduleCount}개 하위 세부일정에 집중 만회 계획을 배치하고, 인력과 작업시간 조정을 검토하세요.`
      extensionDays = Math.max(
        1,
        Math.ceil(delayedProgress / normalDailyRate - catchUpScheduleCount),
      )
    } else if (ratio > 1.2) {
      level = '집중 만회 추가 공수 필요'
      action = hasTodayReport
        ? `금일 미완료분 ${roundPct(delayedProgress, 1)}%p를 내일 이후 ${catchUpScheduleCount}개 하위 세부일정에 집중 반영하면 정상 일정 복귀가 가능합니다. 인력과 작업시간을 함께 조정하세요.`
        : `계획 대비 미달분 ${roundPct(delayedProgress, 1)}%p를 가까운 ${catchUpScheduleCount}개 하위 세부일정에 집중 반영하고, 인력과 작업시간 조정을 검토하세요.`
    } else if (ratio > 1.0) {
      level = '집중 만회 가능'
      action = hasTodayReport
        ? `금일 미완료분 ${roundPct(delayedProgress, 1)}%p를 다음 ${catchUpScheduleCount}개 하위 세부일정에 소폭 추가하면 정상 일정으로 복귀할 수 있습니다.`
        : `계획 대비 미달분 ${roundPct(delayedProgress, 1)}%p를 가까운 하위 세부일정에 소폭 반영하면 종료일 변경 없이 만회 가능합니다.`
    }
  }

  const days = catchUpSchedules.map((schedule) => {
    const currentRequiredCount = Number(schedule.requiredCount ?? 0)
    const manHourAdjustment = buildManHourAdjustment(schedule, ratio)

    return {
      id: getPlanId(schedule),
      date: toDateKey(schedule.startDate || schedule.date),
      name: schedule.name || schedule.processName || '세부일정',
      location: schedule.location || schedule.zone || '',
      targetPct: roundPct(focusedTargetRate, 1),
      normalTargetPct: roundPct(normalDailyRate, 1),
      catchUpPct: roundPct(catchUpPerScheduleRate, 1),
      carryOver: carryOverFromToday || delayedProgress > 0,
      note: delayedProgress > 0 ? '미완료분 집중 반영' : '',

      currentRequiredCount,
      recommendedRequiredCount: manHourAdjustment.recommendedRequiredCount,

      originalWorkTime: manHourAdjustment.originalWorkTime,
      recommendedWorkTime: manHourAdjustment.recommendedWorkTime,
      originalWorkHours: manHourAdjustment.originalWorkHours,
      recommendedWorkHours: manHourAdjustment.recommendedWorkHours,
      originalManHours: manHourAdjustment.originalManHours,
      recommendedManHours: manHourAdjustment.recommendedManHours,
      additionalManHours: manHourAdjustment.additionalManHours,
      shortageManHours: manHourAdjustment.shortageManHours,
      addedWorkers: manHourAdjustment.addedWorkers,
      addedWorkHours: manHourAdjustment.addedWorkHours,
      manHourAdjustmentReason: manHourAdjustment.adjustmentReason,

      originalNote: schedule.note || '',
      trade: schedule.trade || '',
      partner: schedule.partner || '',
      manager: schedule.manager || '',
      contact: schedule.contact || '',
      parentWorkPlanId:
        schedule.parentWorkPlanId || schedule.parent_work_plan_id || schedule.parentId || null,
      tradeProcessId: schedule.tradeProcessId || schedule.trade_process_id || null,
    }
  })

  const normalReturnDate = remainingSchedules[catchUpScheduleCount]
    ? toDateKey(
        remainingSchedules[catchUpScheduleCount].startDate ||
          remainingSchedules[catchUpScheduleCount].date,
      )
    : ''

  const maxAddedWorkers = days.length
    ? Math.max(...days.map((d) => Number(d.addedWorkers || 0)))
    : 0

  return {
    level,
    remainingProgress: roundPct(remainingProgress, 1),
    delayedProgress: roundPct(delayedProgress, 1),
    remainingDays,
    remainingScheduleCount: remainingSchedules.length,
    catchUpScheduleCount,
    normalDailyRate: roundPct(normalDailyRate, 1),
    requiredDailyRate: roundPct(requiredDailyRate, 1),
    requiredPerScheduleRate: roundPct(focusedTargetRate, 1),
    catchUpPerScheduleRate: roundPct(catchUpPerScheduleRate, 1),
    focusedTargetRate: roundPct(focusedTargetRate, 1),
    ratio: Math.round(ratio * 100) / 100,
    recommendedWorkers: maxAddedWorkers,
    extensionDays,
    hasTodayReport,
    beforeWorkEnd,
    carryOverFromToday,
    normalReturnDate,
    action,
    days,
  }
}
function mapDelayTaskItem(item) {
  const monthlyPlan = findMonthlyPlanForTask(item)
  const monthlyPlanId =
    getPlanId(monthlyPlan) || Number(item.workPlanId ?? item.idx ?? item.id ?? 0)
  const detailSchedules = findDetailSchedulesForMonthly(monthlyPlanId)

  const plannedPct = roundPct(item.plannedPct ?? 0, 1)
  const actualPct = roundPct(item.actualPct ?? 0, 1)
  const diff = Math.round((actualPct - plannedPct) * 10) / 10
  const plannedStart =
    monthlyPlan?.startDate ?? item.plannedStart ?? item.startDate ?? item.originalStart ?? ''
  const plannedEnd =
    monthlyPlan?.endDate ??
    item.plannedEnd ??
    item.endDate ??
    item.originalEnd ??
    item.effectiveEnd ??
    ''
  const analysisDate = item.analysisDate ?? item.latestReportDate ?? ''
  const statusBaseDate = analysisDate || new Date()
  const ended = !!(
    parseDate(plannedEnd) &&
    parseDate(statusBaseDate) > parseDate(plannedEnd) &&
    actualPct < 100
  )
  const risk = riskFromDiff(diff, ended, actualPct)
  const status = statusFromDiff(diff, ended, actualPct, plannedStart, statusBaseDate)

  const mapped = {
    id: item.workPlanId,
    workPlanId: item.workPlanId,
    process:
      inferRepresentativeTradeName(monthlyPlan || item) ||
      item.process ||
      item.tradeName ||
      '세부 작업',
    name: item.name ?? '',
    location: item.location ?? '',
    partner: item.partner ?? '-',
    plannedPct,
    actualPct,
    actualSource: item.actualSource ?? 'NONE',
    latestReportDate: item.latestReportDate ?? '',
    analysisDate,
    dailyReportId: item.dailyReportId ?? null,
    diff,
    status,
    expectedDelayDays:
      item.expectedDelayDays ??
      calcExpectedDelayDays(plannedStart, plannedEnd, plannedPct, actualPct),
    risk: item.risk ?? risk,
    cause: item.cause || '공사일보 기준 진척률 미달',
    followEffect: item.followEffect || '후속 공정 영향 검토 필요',
    isCritical: item.isCritical ?? false,
    originalEnd: plannedEnd,
    effectiveEnd: item.effectiveEnd ?? plannedEnd,
    plannedStart,
    plannedEnd,
    actualWorkers: item.actualWorkers ?? 0,
    hasReport: item.hasReport ?? item.actualSource === 'DAILY_REPORT',
    monthlyWorkPlanId: monthlyPlanId || null,
    detailSchedules,
  }

  mapped.redistribution = buildRedistributionPlan(mapped)

  ensureAiRecommendation(mapped)

  return mapped
}

// 지연 위험 작업을 가져올 때 기준이 되는 공종 ID
// 사용자가 AI 탭에서 공종 카드를 클릭하면 우선 적용, 없으면 권한의 공종 ID

function getSelectedTradeProcessId() {
  // 공종 카드가 대표 공종명(trade:토공사)으로 선택된 경우에는 백엔드 공정 ID 필터를 쓰지 않는다.
  if (typeof selectedTradeId.value === 'number') return selectedTradeId.value
  if (typeof selectedTradeId.value === 'string' && !selectedTradeId.value.startsWith('trade:')) {
    const n = Number(selectedTradeId.value)
    if (Number.isFinite(n)) return n
  }
  // 2) 공종 책임자는 대표 공종 단위 권한이므로 백엔드 공정 ID 필터를 쓰지 않고
  //    전체를 받은 뒤 프론트에서 대표 공종명으로 필터링한다.
  if (!isSupervisor.value && currentTradeItem.value) {
    return null
  }
  // 3) 그 외 (총 책임자 + 미선택) → null = 전체
  return null
}

function getSelectedProcessName() {
  if (typeof selectedTradeId.value === 'string' && selectedTradeId.value.startsWith('trade:')) {
    return selectedTradeId.value.replace('trade:', '')
  }
  if (selectedTradeId.value) {
    const found = processes.value.find((p) => p.id === selectedTradeId.value)
    if (found) return inferRepresentativeTradeName(found)
  }
  if (!isSupervisor.value && currentTradeItem.value) return currentTradeItem.value.name
  // 총 책임자: 필터에 단일 공종이 지정되어 있으면 그것
  return filterProcess.value === '전체' ? null : filterProcess.value
}

async function loadProgressList() {
  const data = await fetchProgressList(PROJECT_ID)
  processes.value = data.map(mapProgressItem)
}

async function loadDelayRiskTasks() {
  const tradeProcessId = getSelectedTradeProcessId()
  const processName = getSelectedProcessName()

  const data = await fetchDelayRiskTasks(PROJECT_ID, tradeProcessId)
  const mappedTasks = data.map((item) => mapDelayTaskItem(item))
  delayTasks.value = processName
    ? mappedTasks.filter((task) => task.process === processName)
    : mappedTasks

  if (!selectedTaskId.value && delayTasks.value.length > 0) {
    selectedTaskId.value = delayTasks.value[0].id
  }
  if (selectedTaskId.value && !delayTasks.value.some((t) => t.id === selectedTaskId.value)) {
    selectedTaskId.value = delayTasks.value[0]?.id ?? null
  }
}

async function loadAnalysisData() {
  try {
    loading.value = true
    errorMessage.value = ''
    await Promise.all([
      loadProgressList(),
      loadWorkPlanDetails(),
      loadTodayReports(),
      loadScheduleChangeData(),
    ])
    await loadDelayRiskTasks()
  } catch (e) {
    errorMessage.value = e.message || '공정 분석 데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnalysisData()
})

// ─── AI 추천안 ──────────────────────────────────────────────────────────
const aiRecs = reactive({})
const aiRecommendationPollers = new Map()

onBeforeUnmount(() => {
  aiRecommendationPollers.forEach((timer) => clearInterval(timer))
  aiRecommendationPollers.clear()
})

function buildDetailScheduleEditProposals(redistribution) {
  if (!redistribution?.days?.length) return []

  return redistribution.days
    .filter((d) => d.id)
    .map((d) => {
      const originalName = d.name || '세부일정'
      const hasCarryOver = d.carryOver || Number(d.catchUpPct || 0) > 0
      const recommendedName = hasCarryOver ? `${originalName} 및 전일 미완료분 보완` : originalName

      const baseNote = String(d.originalNote || '').trim()
      const aiNoteLines = [
        baseNote,
        hasCarryOver ? `전일 미완료분을 반영하여 ${d.date} 작업에서 우선 처리합니다.` : '',
        d.recommendedWorkTime && d.originalWorkTime !== d.recommendedWorkTime
          ? `작업시간 ${d.originalWorkTime} → ${d.recommendedWorkTime} 조정 검토.`
          : '',
      ].filter(Boolean)

      return {
        workPlanId: d.id,
        date: d.date,
        location: d.location || '',
        originalName,
        recommendedName,
        originalRequiredCount: Number(d.currentRequiredCount || 0),
        recommendedRequiredCount: Number(d.recommendedRequiredCount || d.currentRequiredCount || 0),
        normalTargetPct: d.normalTargetPct,
        targetPct: d.targetPct,
        catchUpPct: d.catchUpPct,
        carryOver: hasCarryOver,
        originalNote: baseNote,
        recommendedNote: aiNoteLines.join('\n'),
        originalWorkTime: d.originalWorkTime,
        recommendedWorkTime: d.recommendedWorkTime,
        originalWorkHours: d.originalWorkHours,
        recommendedWorkHours: d.recommendedWorkHours,
        originalManHours: d.originalManHours,
        recommendedManHours: d.recommendedManHours,
        additionalManHours: d.additionalManHours,
        addedWorkers: d.addedWorkers,
        addedWorkHours: d.addedWorkHours,
        manHourAdjustmentReason: d.manHourAdjustmentReason,
        trade: d.trade || '',
        partner: d.partner || '',
        manager: d.manager || '',
        contact: d.contact || '',
        parentWorkPlanId: d.parentWorkPlanId || null,
        tradeProcessId: d.tradeProcessId || null,
        isEditing: false,
        isUserEdited: false,
      }
    })
}

function startEditProposal(proposal) {
  if (!proposal) return
  proposal._backup = {
    recommendedName: proposal.recommendedName,
    recommendedRequiredCount: proposal.recommendedRequiredCount,
    recommendedWorkTime: proposal.recommendedWorkTime,
    recommendedWorkHours: proposal.recommendedWorkHours,
    recommendedManHours: proposal.recommendedManHours,
    additionalManHours: proposal.additionalManHours,
    addedWorkers: proposal.addedWorkers,
    addedWorkHours: proposal.addedWorkHours,
    recommendedNote: proposal.recommendedNote,
  }
  proposal.isEditing = true
}

function cancelEditProposal(proposal) {
  if (!proposal) return
  if (proposal._backup) {
    proposal.recommendedName = proposal._backup.recommendedName
    proposal.recommendedRequiredCount = proposal._backup.recommendedRequiredCount
    proposal.recommendedWorkTime = proposal._backup.recommendedWorkTime
    proposal.recommendedWorkHours = proposal._backup.recommendedWorkHours
    proposal.recommendedManHours = proposal._backup.recommendedManHours
    proposal.additionalManHours = proposal._backup.additionalManHours
    proposal.addedWorkers = proposal._backup.addedWorkers
    proposal.addedWorkHours = proposal._backup.addedWorkHours
    proposal.recommendedNote = proposal._backup.recommendedNote
  }
  proposal.isEditing = false
  delete proposal._backup
}

function confirmEditProposal(proposal) {
  if (!proposal) return
  proposal.recommendedRequiredCount = Math.max(0, Number(proposal.recommendedRequiredCount || 0))
  proposal.recommendedName = String(proposal.recommendedName || '').trim() || proposal.originalName
  proposal.recommendedWorkTime = String(
    proposal.recommendedWorkTime || proposal.originalWorkTime || '',
  ).trim()
  refreshProposalManHours(proposal)
  proposal.recommendedNote = String(proposal.recommendedNote || '').trim()
  proposal.isEditing = false
  proposal.isUserEdited = true
  delete proposal._backup
}

function buildDetailedAiRecommendationText(task, redistribution, detailEditProposals = []) {
  const proposal = detailEditProposals[0]
  const delayedProgress = Number(redistribution?.delayedProgress || 0)
  const normalTarget = Number(proposal?.normalTargetPct || redistribution?.normalDailyRate || 0)
  const targetPct = Number(proposal?.targetPct || redistribution?.focusedTargetRate || 0)
  const targetRatio =
    normalTarget > 0 ? targetPct / normalTarget : Number(redistribution?.ratio || 1)

  if (!proposal) {
    return (
      `${task.name} 월간 세부계획은 현재 계획 ${task.plannedPct}% 대비 실제 ${task.actualPct}%로 ` +
      `${Math.abs(Number(task.diff || 0)).toFixed(1)}%p 차이가 있습니다. ` +
      `${redistribution?.action || '공사일보 제출 후 세부일정 기준으로 재분배 가능 여부를 다시 확인하세요.'}`
    )
  }

  const originalWorkers = Number(proposal.originalRequiredCount || 0)
  const recommendedWorkers = Number(proposal.recommendedRequiredCount || originalWorkers)
  const originalWorkHours = Number(proposal.originalWorkHours || 0)
  const recommendedWorkHours = Number(proposal.recommendedWorkHours || originalWorkHours)
  const originalManHours = Number(
    proposal.originalManHours || originalWorkers * originalWorkHours || 0,
  )
  const recommendedManHours = Number(
    proposal.recommendedManHours || recommendedWorkers * recommendedWorkHours || originalManHours,
  )
  const additionalManHours = Number(
    proposal.additionalManHours || Math.max(0, recommendedManHours - originalManHours),
  )
  const estimatedCompletedManHours = Number((originalManHours * (task.actualPct / 100)).toFixed(1))
  const estimatedRemainingManHours = Number(
    Math.max(0, originalManHours - estimatedCompletedManHours).toFixed(1),
  )
  const requiredManHours = Number((originalManHours * targetRatio).toFixed(1))

  return [
    `${task.name}은 현재 계획 ${task.plannedPct}% 대비 실제 ${task.actualPct}%로 ${Math.abs(Number(task.diff || 0)).toFixed(1)}%p 부족합니다.`,
    `선택된 만회 대상 세부일정(${proposal.date} · ${proposal.originalName})은 기존 인력 ${originalWorkers}명, 실작업 ${originalWorkHours}시간 기준으로 계획되어 있어 기본 공수는 ${originalWorkers}명 × ${originalWorkHours}시간 = ${originalManHours}인시입니다.`,
    `현재 실제 진척률 ${task.actualPct}%를 단순 공수 기준으로 환산하면 약 ${estimatedCompletedManHours}인시가 수행된 것으로 볼 수 있고, 기존 계획 공수 기준 약 ${estimatedRemainingManHours}인시가 남아 있는 상태입니다.`,
    `기존 목표 진척률 ${normalTarget}%를 ${targetPct}%로 회복하려면 해당 세부일정의 작업 강도를 약 ${targetRatio.toFixed(2)}배로 높여야 하며, 필요 공수는 약 ${requiredManHours}인시 수준으로 추정됩니다.`,
    `따라서 AI는 인력만 크게 늘리기보다 인력 ${originalWorkers}명 → ${recommendedWorkers}명, 작업시간 ${proposal.originalWorkTime || '-'} → ${proposal.recommendedWorkTime || '-'} 조정을 통해 총 ${recommendedManHours}인시를 확보하는 방안을 추천합니다. 추가 확보 공수는 약 ${additionalManHours}인시입니다.`,
    proposal.manHourAdjustmentReason
      ? `판단 근거: ${proposal.manHourAdjustmentReason}`
      : '판단 근거: 작업 공간과 순서 제약을 고려해 인력 증원과 작업시간 조정을 함께 검토하는 방식이 적절합니다.',
  ].join('\n')
}

function buildOperationalRecommendationText(task, redistribution, proposals = []) {
  const shortage = Math.abs(Number(task.diff || 0)).toFixed(1)
  const latestReportDate = task.latestReportDate || task.analysisDate || '최근 보고일'
  const expectedDelayDays = Number(task.expectedDelayDays || 0)

  if (!proposals.length) {
    return (
      `최신 보고일 ${latestReportDate} 기준 계획 ${task.plannedPct}%, 실제 ${task.actualPct}%로 ` +
      `${shortage}%p 부족합니다. 현재 조정 가능한 하위 세부일정이 없어 월간 세부계획 매핑과 작업지시서 발급 상태를 먼저 확인해야 합니다.`
    )
  }

  const ids = proposals
    .map((proposal) => proposal.workPlanId)
    .filter(Boolean)
    .join(', ')
  const dates = proposals
    .map((proposal) => proposal.date)
    .filter(Boolean)
    .join(', ')
  const targetText = proposals
    .map(
      (proposal) => `${proposal.date || '-'} ${proposal.normalTargetPct}%→${proposal.targetPct}%`,
    )
    .join(', ')

  return [
    `최신 보고일 ${latestReportDate} 기준 계획 ${task.plannedPct}%, 실제 ${task.actualPct}%로 ${shortage}%p 부족하며 예상 지연은 ${expectedDelayDays}일입니다.`,
    `가까운 실행 가능 작업 ${ids ? `${ids}번` : ''}${dates ? `(${dates})` : ''}에 미달분을 분산 반영합니다.`,
    `목표 진척률은 ${targetText} 기준으로 관리하고, 작업명은 기존 세부작업명을 유지한 상태에서 인력·작업시간·비고만 검토합니다.`,
    redistribution?.normalReturnDate
      ? `${redistribution.normalReturnDate} 이후 일정은 기존 목표율로 복귀하는 것을 기준으로 합니다.`
      : '남은 일정은 기존 목표율 복귀를 기준으로 확인합니다.',
  ].join('\n')
}

function ensureAiRecommendation(task) {
  if (!task?.id) return
  if (aiRecs[task.id]) return

  const redistribution = task.redistribution || buildRedistributionPlan(task)
  const detailEditProposals = buildDetailScheduleEditProposals(redistribution)
  const diffText = task.diff < 0 ? `${Math.abs(task.diff)}%p 부족` : `${task.diff}%p 초과`
  const shouldExtend = redistribution.level.includes('일정 변경')

  const catchUpText =
    redistribution.catchUpScheduleCount > 0
      ? `가까운 하위 세부일정 ${redistribution.catchUpScheduleCount}건에 미달분 ${redistribution.delayedProgress}%p를 집중 반영하고, ${redistribution.normalReturnDate ? `${redistribution.normalReturnDate}부터 ` : ''}정상 일정 복귀를 목표로 합니다.`
      : '현재 계획 대비 미달분이 크지 않아 남은 세부일정은 기존 목표 중심으로 관리합니다.'

  aiRecs[task.id] = {
    source: 'RULE_FALLBACK',
    aiStatus: 'READY',
    aiError: '',
    recommendationId: null,
    summary:
      `${task.name} 월간 세부계획은 현재 계획 대비 ${diffText} 상태입니다. ` +
      `종료일(${task.originalEnd || task.plannedEnd || '-'})은 우선 유지하고, 전체 남은 기간에 균등 분산하기보다 ${catchUpText}`,
    recommendation: buildDetailedAiRecommendationText(task, redistribution, detailEditProposals),
    workerSuggestion:
      redistribution.recommendedWorkers > 0
        ? `집중 만회 일정에 한해 최대 ${redistribution.recommendedWorkers}명 추가와 작업시간 조정을 검토하세요.`
        : `추가 인력보다 작업시간 조정 또는 목표 진척률 관리가 우선입니다.`,
    affectedTasks: shouldExtend
      ? ['납기 내 만회 부담 큼', '후속 공정 영향 검토 필요']
      : ['종료일 유지', '가까운 하위 세부일정 집중 만회'],
    redistribution,
    detailEditProposals,
    editedAddDays: redistribution.extensionDays || 0,
    editedWorkers: redistribution.recommendedWorkers || 0,
    expectedEffect: shouldExtend
      ? '우선 집중 만회 계획을 적용하되, 납기 내 완료가 어렵다면 일정 변경 요청을 검토합니다.'
      : '종료일 변경 없이 가까운 하위 세부일정에 미달분을 집중 반영한 뒤 정상 일정 복귀를 우선합니다.',
  }
}

// ─── 일정 변경 요청 ──────────────────────────────────────────────────────
function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function unwrapAiApiData(response) {
  if (!isPlainObject(response)) return response
  if (
    'data' in response &&
    ('success' in response || 'isSuccess' in response || 'code' in response)
  ) {
    return response.data
  }
  return response
}

function pickText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function pickNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function readAiResultParts(record) {
  const result = parseMaybeJson(record?.result ?? record ?? {})
  const resultObject = isPlainObject(result) ? result : {}
  const nestedRecommendation = isPlainObject(resultObject.recommendation)
    ? resultObject.recommendation
    : {}
  const body = { ...resultObject, ...nestedRecommendation }
  const changeSummary = isPlainObject(body.changeSummary)
    ? body.changeSummary
    : isPlainObject(resultObject.changeSummary)
      ? resultObject.changeSummary
      : {}
  const detailChanges = Array.isArray(body.detailChanges)
    ? body.detailChanges
    : Array.isArray(resultObject.detailChanges)
      ? resultObject.detailChanges
      : []

  return {
    result,
    resultObject,
    body,
    changeSummary,
    detailChanges,
  }
}

function findFallbackProposal(task, change, index = 0) {
  const proposals = aiRecs[task.id]?.detailEditProposals || []
  const workPlanId = Number(change?.workPlanId ?? 0)
  if (workPlanId) {
    const byId = proposals.find((proposal) => Number(proposal.workPlanId || 0) === workPlanId)
    if (byId) return byId
  }
  return proposals[index] || {}
}

function normalizeAiDetailProposal(task, change, index = 0) {
  change = isPlainObject(change) ? change : {}
  const fallback = findFallbackProposal(task, change, index)
  const originalRequiredCount = pickNumber(
    change.originalRequiredCount,
    pickNumber(fallback.originalRequiredCount, 0),
  )
  const recommendedRequiredCount = pickNumber(
    change.recommendedRequiredCount,
    pickNumber(fallback.recommendedRequiredCount, originalRequiredCount),
  )

  const proposal = {
    workPlanId: pickNumber(change.workPlanId, pickNumber(fallback.workPlanId, 0)),
    date: pickText(change.date, fallback.date),
    location: pickText(change.location, fallback.location),
    originalName: pickText(change.originalName, fallback.originalName, task.name),
    recommendedName: pickText(
      change.recommendedName,
      fallback.recommendedName,
      change.originalName,
      fallback.originalName,
      task.name,
    ),
    originalRequiredCount,
    recommendedRequiredCount,
    normalTargetPct: change.normalTargetPct ?? fallback.normalTargetPct,
    targetPct: change.targetPct ?? fallback.targetPct,
    catchUpPct: change.catchUpPct ?? fallback.catchUpPct,
    carryOver: Boolean(change.carryOver ?? fallback.carryOver),
    originalNote: pickText(change.originalNote, fallback.originalNote),
    recommendedNote: pickText(
      change.recommendedNote,
      fallback.recommendedNote,
      change.reason,
      change.note,
    ),
    originalWorkTime: pickText(change.originalWorkTime, fallback.originalWorkTime),
    recommendedWorkTime: pickText(
      change.recommendedWorkTime,
      fallback.recommendedWorkTime,
      change.workTime,
    ),
    originalWorkHours: pickNumber(
      change.originalWorkHours,
      pickNumber(fallback.originalWorkHours, 0),
    ),
    recommendedWorkHours: pickNumber(
      change.recommendedWorkHours,
      pickNumber(fallback.recommendedWorkHours, 0),
    ),
    originalManHours: pickNumber(change.originalManHours, pickNumber(fallback.originalManHours, 0)),
    recommendedManHours: pickNumber(
      change.recommendedManHours,
      pickNumber(fallback.recommendedManHours, 0),
    ),
    additionalManHours: pickNumber(
      change.additionalManHours,
      pickNumber(fallback.additionalManHours, 0),
    ),
    addedWorkers: pickNumber(change.addedWorkers, pickNumber(fallback.addedWorkers, 0)),
    addedWorkHours: pickNumber(change.addedWorkHours, pickNumber(fallback.addedWorkHours, 0)),
    manHourAdjustmentReason: pickText(
      change.manHourAdjustmentReason,
      change.reason,
      fallback.manHourAdjustmentReason,
    ),
    trade: pickText(change.trade, fallback.trade, task.process),
    partner: pickText(change.partner, fallback.partner),
    manager: pickText(change.manager, fallback.manager),
    contact: pickText(change.contact, fallback.contact),
    parentWorkPlanId:
      change.parentWorkPlanId ?? fallback.parentWorkPlanId ?? task.monthlyWorkPlanId ?? null,
    tradeProcessId: change.tradeProcessId ?? fallback.tradeProcessId ?? null,
    isEditing: false,
    isUserEdited: false,
  }

  refreshProposalManHours(proposal)
  return proposal
}

function setAiRecommendationError(taskId, message) {
  if (!taskId || !aiRecs[taskId]) return
  aiRecs[taskId].aiStatus = 'FAILED'
  aiRecs[taskId].aiError = message || 'AI 추천 생성에 실패했습니다.'
}

function stopAiRecommendationPolling(taskId) {
  const timer = aiRecommendationPollers.get(taskId)
  if (!timer) return
  clearInterval(timer)
  aiRecommendationPollers.delete(taskId)
}

function applyAiRecommendationRecordToTask(taskId, rawRecord) {
  const task = delayTasks.value.find((item) => item.id === taskId)
  if (!task) return

  ensureAiRecommendation(task)

  const record = unwrapAiApiData(rawRecord) || {}
  const previous = aiRecs[task.id] || {}
  const { resultObject, body, changeSummary, detailChanges } = readAiResultParts(record)
  const fallbackProposals = previous.detailEditProposals || []
  const allowedWorkPlanIds = new Set(
    fallbackProposals.map((proposal) => Number(proposal.workPlanId || 0)).filter(Boolean),
  )
  const aiProposals = detailChanges.length
    ? detailChanges
        .map((change, index) => normalizeAiDetailProposal(task, change, index))
        .filter((proposal) => {
          const workPlanId = Number(proposal.workPlanId || 0)
          if (!workPlanId || !allowedWorkPlanIds.has(workPlanId)) return false
          return Number(proposal.originalRequiredCount || 0) > 0
        })
        .slice(0, Math.max(1, fallbackProposals.length))
    : []
  const aiProposalById = new Map(
    aiProposals.map((proposal) => [Number(proposal.workPlanId || 0), proposal]),
  )
  const normalizedProposals = fallbackProposals.length
    ? fallbackProposals.map((fallback) => {
        const aiProposal = aiProposalById.get(Number(fallback.workPlanId || 0))
        if (!aiProposal) return fallback

        const originalRequiredCount = Number(fallback.originalRequiredCount || 0)
        const maxRecommendedCount =
          originalRequiredCount + Math.max(2, Math.ceil(originalRequiredCount * 0.3))
        const aiRecommendedCount = pickNumber(
          aiProposal.recommendedRequiredCount,
          pickNumber(fallback.recommendedRequiredCount, originalRequiredCount),
        )
        const aiRecommendedName = pickText(aiProposal.recommendedName, fallback.recommendedName)
        const recommendedName =
          aiRecommendedName.includes(fallback.originalName) ||
          aiRecommendedName === fallback.originalName
            ? aiRecommendedName
            : fallback.recommendedName

        const merged = {
          ...fallback,
          recommendedName,
          recommendedRequiredCount: Math.max(
            originalRequiredCount,
            Math.min(maxRecommendedCount, aiRecommendedCount),
          ),
          recommendedWorkTime: pickText(
            aiProposal.recommendedWorkTime,
            fallback.recommendedWorkTime,
          ),
          recommendedNote: pickText(aiProposal.recommendedNote, fallback.recommendedNote),
          manHourAdjustmentReason: pickText(
            aiProposal.manHourAdjustmentReason,
            fallback.manHourAdjustmentReason,
          ),
          isEditing: false,
          isUserEdited: false,
        }
        refreshProposalManHours(merged)
        return merged
      })
    : aiProposals
  const maxAddedWorkers = normalizedProposals.reduce(
    (max, proposal) =>
      Math.max(
        max,
        Number(proposal.recommendedRequiredCount || 0) -
          Number(proposal.originalRequiredCount || 0),
      ),
    0,
  )

  aiRecs[task.id] = {
    ...previous,
    source: 'AI',
    aiStatus: 'SUCCESS',
    aiError: '',
    recommendationId:
      record.idx ?? record.id ?? record.recommendationId ?? previous.recommendationId,
    summary: pickText(body.summary, body.summaryText, changeSummary.summary, previous.summary),
    recommendation: pickText(
      buildOperationalRecommendationText(task, previous.redistribution, normalizedProposals),
      previous.recommendation,
    ),
    workerSuggestion: pickText(
      body.workerSuggestion,
      changeSummary.workerSuggestion,
      previous.workerSuggestion,
    ),
    affectedTasks: Array.isArray(body.affectedTasks)
      ? body.affectedTasks
      : previous.affectedTasks || [],
    redistribution: previous.redistribution,
    detailEditProposals: normalizedProposals,
    editedAddDays: pickNumber(changeSummary.addDays, pickNumber(previous.editedAddDays, 0)),
    editedWorkers: pickNumber(
      body.editedWorkers ?? changeSummary.recommendedWorkers,
      pickNumber(previous.editedWorkers, maxAddedWorkers),
    ),
    expectedEffect: pickText(
      body.expectedEffect,
      changeSummary.expectedEffect,
      previous.expectedEffect,
    ),
  }
}

function startAiRecommendationPolling(taskId, recommendationId) {
  stopAiRecommendationPolling(taskId)

  let attempts = 0
  const timer = setInterval(async () => {
    attempts += 1
    try {
      const record = unwrapAiApiData(await fetchAiScheduleRecommendation(recommendationId))
      const status = String(record?.status || '').toUpperCase()

      if (status === 'SUCCESS') {
        stopAiRecommendationPolling(taskId)
        applyAiRecommendationRecordToTask(taskId, record)
        return
      }

      if (status === 'FAILED') {
        stopAiRecommendationPolling(taskId)
        setAiRecommendationError(taskId, record?.errorMessage || 'AI 추천 생성에 실패했습니다.')
        return
      }

      if (attempts >= 60) {
        stopAiRecommendationPolling(taskId)
        setAiRecommendationError(
          taskId,
          'AI 추천 생성이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.',
        )
      }
    } catch (err) {
      if (attempts >= 60) {
        stopAiRecommendationPolling(taskId)
        setAiRecommendationError(taskId, err?.message || 'AI 추천 상태 조회에 실패했습니다.')
      }
    }
  }, 2500)

  aiRecommendationPollers.set(taskId, timer)
}

async function requestAiRecommendationForSelectedTask() {
  const task = selectedTask.value
  if (!task?.id) return

  ensureAiRecommendation(task)
  const rec = aiRecs[task.id]
  const monthlyWorkPlanId = Number(task.monthlyWorkPlanId || task.workPlanId || task.id || 0)

  if (!monthlyWorkPlanId) {
    setAiRecommendationError(task.id, '월간 세부계획 ID가 없어 AI 추천을 요청할 수 없습니다.')
    return
  }

  try {
    stopAiRecommendationPolling(task.id)
    rec.source = 'AI'
    rec.aiStatus = 'PENDING'
    rec.aiError = ''

    const created = unwrapAiApiData(
      await createAiScheduleRecommendation({
        projectId: PROJECT_ID,
        monthlyWorkPlanId,
      }),
    )
    const recommendationId = Number(created?.idx ?? created?.id ?? created?.recommendationId ?? 0)
    rec.recommendationId = recommendationId || null

    const status = String(created?.status || '').toUpperCase()
    if (status === 'SUCCESS') {
      applyAiRecommendationRecordToTask(task.id, created)
      return
    }

    if (status === 'FAILED') {
      setAiRecommendationError(task.id, created?.errorMessage || 'AI 추천 생성에 실패했습니다.')
      return
    }

    if (!recommendationId) {
      throw new Error('AI 추천 요청 ID를 받지 못했습니다.')
    }

    startAiRecommendationPolling(task.id, recommendationId)
  } catch (err) {
    console.error('AI schedule recommendation failed:', err)
    setAiRecommendationError(task.id, err?.message || 'AI 추천 생성에 실패했습니다.')
  }
}

const changeRequests = ref([])
const changeHistory = ref([])

function normalizeRequestStatus(status = '') {
  const s = String(status || '').trim()
  if (['pending', 'approved', 'applied', 'rejected'].includes(s)) return s

  return (
    {
      '승인 대기': 'pending',
      '승인 완료': 'approved',
      '일정 반영 완료': 'applied',
      반려: 'rejected',
    }[s] || s
  )
}

function mapAttachment(urlOrFile) {
  if (!urlOrFile) return null
  if (typeof urlOrFile === 'object') return urlOrFile

  const text = String(urlOrFile)
  return {
    name: text.split('/').pop() || text,
    url: text,
  }
}

function actionFromStatus(status) {
  return (
    {
      approved: '승인',
      applied: '일정 반영',
      rejected: '반려',
    }[normalizeRequestStatus(status)] || '처리'
  )
}

function mapScheduleChange(item, historyMode = false) {
  const status = normalizeRequestStatus(item.status)
  const attachments = Array.isArray(item.attachmentUrls)
    ? item.attachmentUrls.map(mapAttachment).filter(Boolean)
    : Array.isArray(item.attachments)
      ? item.attachments
      : []

  return {
    id: item.idx ?? item.id,
    process: item.process || item.changeSummary?.process || '',
    task: item.taskName ?? item.task ?? '',
    requester: item.requester || '',
    requestDate: item.requestDate || '',
    oldStart: item.oldStart || '',
    oldEnd: item.oldEnd || '',
    newStart: item.newStart || '',
    newEnd: item.newEnd || '',
    reason:
      historyMode && status === 'rejected'
        ? item.rejectReason || item.reason || ''
        : item.reason || '',
    changeSummary: item.changeSummary || null,
    detailChanges: Array.isArray(item.detailChanges) ? item.detailChanges : [],
    aiApplied: !!item.aiApplied,
    status,
    statusLabel: item.statusLabel || reqStatusLabel(status),
    attachments,
    rejectReason: item.rejectReason || '',
    approver: item.approver || '',
    processedAt: item.processedAt || '',
    action: historyMode ? actionFromStatus(status) : undefined,
    tradeProcessId: item.tradeProcessId ?? null,
    workPlanId: item.workPlanId ?? null,
  }
}

function scheduleChangeDedupeKey(item, includeStatus = false) {
  const detailIds = Array.isArray(item.detailChanges)
    ? item.detailChanges
        .map(
          (detail) =>
            detail.workPlanId || detail.date || detail.originalName || detail.recommendedName,
        )
        .filter(Boolean)
        .join(',')
    : ''

  const targetId =
    item.workPlanId ||
    item.changeSummary?.targetWorkPlanId ||
    item.changeSummary?.workPlanId ||
    item.tradeProcessId ||
    detailIds

  if (!targetId && !item.task && !item.newStart && !item.newEnd) {
    return `id:${item.id}`
  }

  return [
    includeStatus ? item.status : '',
    item.process || '',
    targetId || '',
    item.requester || '',
    item.task || '',
    item.oldStart || '',
    item.oldEnd || '',
    item.newStart || '',
    item.newEnd || '',
  ].join('|')
}

function dedupeScheduleChanges(items, includeStatus = false) {
  const seen = new Set()
  return items.filter((item) => {
    const key = scheduleChangeDedupeKey(item, includeStatus)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function loadScheduleChangeData() {
  const [requests, history] = await Promise.all([
    fetchScheduleChangeList({ projectId: PROJECT_ID }),
    fetchScheduleChangeHistory({ projectId: PROJECT_ID }),
  ])

  const activeStatuses = new Set(['pending', 'approved'])
  const requestItems = Array.isArray(requests)
    ? requests
        .map((item) => mapScheduleChange(item, false))
        .filter((item) => activeStatuses.has(item.status))
    : []
  const historyItems = Array.isArray(history)
    ? history.map((item) => mapScheduleChange(item, true))
    : []

  changeRequests.value = dedupeScheduleChanges(requestItems)
  changeHistory.value = dedupeScheduleChanges(historyItems, true)
}

// ─── 권한 + 필터 적용된 가시 데이터 ───────────────────────────────────────
function passProcessFilter(name) {
  if (filterProcess.value === '전체') return true
  return name === filterProcess.value
}
function passStatusFilter(status) {
  if (filterStatus.value === '전체') return true
  return status === filterStatus.value
}
function passRiskFilter(risk) {
  if (filterRisk.value === '전체') return true
  return risk === filterRisk.value
}

const visibleProcesses = computed(() => {
  let r = processes.value
  if (!isSupervisor.value) {
    // 공종 책임자: 자기 대표 공종에 속한 공정들만
    const myName = currentTradeItem.value?.name
    r = myName ? r.filter((p) => inferRepresentativeTradeName(p) === myName) : []
  } else {
    r = r.filter((p) => passProcessFilter(inferRepresentativeTradeName(p)))
  }
  r = r.filter((p) => passStatusFilter(p.status))
  r = r.filter((p) => passRiskFilter(p.risk))
  return r
})

const visibleTasks = computed(() => {
  let r = delayTasks.value.filter((t) => t.risk !== '낮음')
  if (!isSupervisor.value) {
    // 공종 책임자: 자기 공종 작업만
    const myName = currentTradeItem.value?.name
    r = myName ? r.filter((t) => t.process === myName) : []
  } else {
    r = r.filter((t) => passProcessFilter(t.process))
  }
  r = r.filter((t) => passRiskFilter(t.risk))
  return r
})

const visibleRequests = computed(() => {
  let r = changeRequests.value
  if (!isSupervisor.value) {
    const myName = currentTradeItem.value?.name
    r = myName ? r.filter((req) => req.process === myName) : []
  } else {
    r = r.filter((req) => passProcessFilter(req.process))
  }
  return r
})

const visibleHistory = computed(() => {
  let r = changeHistory.value
  if (!isSupervisor.value) {
    const myName = currentTradeItem.value?.name
    r = myName ? r.filter((h) => h.process === myName) : []
  } else {
    r = r.filter((h) => passProcessFilter(h.process))
  }
  return r
})

// ─── 도넛 차트용 데이터 가공 (메인 화면 핵심) ─────────────────────────────
const noDataYet = computed(() => !loading.value && processes.value.length === 0)

// visibleProcesses → 도넛 카드 데이터로 매핑
const groupProgress = computed(() => {
  const grouped = new Map()

  visibleProcesses.value.forEach((p) => {
    const tradeName = inferRepresentativeTradeName(p)
    if (!tradeName || tradeName === '기타') return

    if (!grouped.has(tradeName)) {
      grouped.set(tradeName, {
        id: `trade:${tradeName}`,
        tradeProcessIds: [],
        group: tradeName,
        planSum: 0,
        actualSum: 0,
        count: 0,
        started: false,
        hasDelayed: false,
        hasWarning: false,
        hasCompleted: false,
        partnerSet: new Set(),
        riskRank: 0,
        plannedEnd: '',
        forecastEnd: '',
      })
    }

    const g = grouped.get(tradeName)
    const plan = Math.max(0, Math.min(100, Number(p.plannedPct ?? 0)))
    const actual = Math.max(0, Math.min(100, Number(p.actualPct ?? 0)))

    g.tradeProcessIds.push(p.id)
    g.planSum += plan
    g.actualSum += actual
    g.count += 1
    g.started = g.started || actual > 0 || !!p.actualStart
    g.hasDelayed = g.hasDelayed || p.status === '지연' || p.status === '지연 위험'
    g.hasWarning = g.hasWarning || p.status === '주의'
    g.hasCompleted = g.hasCompleted || p.status === '완료'
    if (p.partner && p.partner !== '-') g.partnerSet.add(p.partner)
    g.plannedEnd =
      !g.plannedEnd || String(p.plannedEnd ?? '') > g.plannedEnd ? p.plannedEnd : g.plannedEnd
    g.forecastEnd =
      !g.forecastEnd || String(p.forecastEnd ?? '') > g.forecastEnd ? p.forecastEnd : g.forecastEnd

    const rank = p.risk === '매우 높음' ? 3 : p.risk === '높음' ? 2 : p.risk === '보통' ? 1 : 0
    g.riskRank = Math.max(g.riskRank, rank)
  })

  return Array.from(grouped.values()).map((g) => {
    const plan = g.count ? Math.round((g.planSum / g.count) * 10) / 10 : 0
    const actual = g.count ? Math.round((g.actualSum / g.count) * 10) / 10 : 0
    const diff = Math.round((actual - plan) * 10) / 10
    const statusLabel = !g.started
      ? '미착수'
      : g.hasDelayed
        ? '지연 위험'
        : diff < 0
          ? '주의'
          : '정상'

    return {
      id: g.id,
      tradeProcessIds: g.tradeProcessIds,
      group: g.group,
      plan,
      actual,
      diff,
      started: !!g.started,
      isDelayed: g.hasDelayed || diff <= -3,
      statusLabel,
      partner: g.partnerSet.size ? Array.from(g.partnerSet).join(', ') : '협력사 미지정',
      risk:
        g.riskRank === 3
          ? '매우 높음'
          : g.riskRank === 2
            ? '높음'
            : g.riskRank === 1
              ? '보통'
              : '낮음',
      plannedEnd: g.plannedEnd,
      forecastEnd: g.forecastEnd,
    }
  })
})

// SVG 도넛 arc path 생성 (반지름 36, 중심 50,50)
function arcPath(percent) {
  const pct = Math.max(0, Math.min(100, percent))
  if (pct === 0) return ''
  const r = 36
  const cx = 50
  const cy = 50
  // 12시 방향에서 시작하여 시계방향
  const angle = (pct / 100) * 2 * Math.PI
  const endX = cx + r * Math.sin(angle)
  const endY = cy - r * Math.cos(angle)
  const largeArc = pct > 50 ? 1 : 0
  if (pct >= 100) {
    // 100%는 두 개의 호로 나눠 그림 (path가 닫혀버리지 않게)
    const midX = cx + r * Math.sin(Math.PI)
    const midY = cy - r * Math.cos(Math.PI)
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${midX} ${midY} A ${r} ${r} 0 1 1 ${cx} ${cy - r - 0.01}`
  }
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`
}

// ─── KPI ─────────────────────────────────────────────────────────────────
const kpi = computed(() => {
  const src = visibleProcesses.value
  const total = src.length || 1
  const delayCount = src.filter((p) => p.status === '지연').length
  const riskCount = src.filter((p) => p.status === '지연 위험').length
  const completeCount = src.filter((p) => p.status === '완료').length
  const avgPlanned = Math.round(src.reduce((a, p) => a + p.plannedPct, 0) / total)
  const avgActual = Math.round(src.reduce((a, p) => a + p.actualPct, 0) / total)
  const reqCount = visibleRequests.value.length
  const pendingCount = visibleRequests.value.filter((r) => r.status === 'pending').length
  return {
    delayCount,
    riskCount,
    completeCount,
    avgPlanned,
    avgActual,
    diff: avgPlanned - avgActual,
    reqCount,
    pendingCount,
    totalProcesses: src.length,
  }
})

// ─── 일정 변경 요청 데이터 ────────────────────────────────────────────────
// AI 추천 기반 빠른 등록만 지원. requestForm은 임시 데이터 컨테이너로만 사용.
const requestForm = reactive({
  taskId: '',
  process: '',
  task: '',
  oldStart: '',
  oldEnd: '',
  newStart: '',
  newEnd: '',
  reason: '',
  changeSummary: null,
  detailChanges: [],
  aiApplied: false,
  attachments: [],
})

// 권한이 바뀌면 공종도 갱신 (요청 등록 시 requester 정보로 사용)
watch(
  currentTradeItem,
  (item) => {
    if (item) requestForm.process = item.name
  },
  { immediate: true },
)

function resetRequestForm() {
  Object.assign(requestForm, {
    taskId: '',
    process: currentTradeItem.value?.name || '',
    task: '',
    oldStart: '',
    oldEnd: '',
    newStart: '',
    newEnd: '',
    reason: '',
    changeSummary: null,
    detailChanges: [],
    aiApplied: false,
    attachments: [],
  })
}

function clonePlain(value) {
  if (value == null) return value
  return JSON.parse(JSON.stringify(value))
}

async function submitRequest() {
  if (!requestForm.task || !requestForm.newStart || !requestForm.newEnd || !requestForm.reason)
    return

  const detailChanges = clonePlain(requestForm.detailChanges || [])
  const firstDetail = detailChanges[0] || {}

  await createScheduleChange({
    projectId: PROJECT_ID,
    tradeProcessId: firstDetail.tradeProcessId || requestForm.changeSummary?.tradeProcessId || null,
    workPlanId: requestForm.taskId || requestForm.changeSummary?.targetTaskId || null,
    taskName: requestForm.task,
    requester: currentTradeLabel.value,
    process: requestForm.process,
    oldStart: requestForm.oldStart || null,
    oldEnd: requestForm.oldEnd || null,
    newStart: requestForm.newStart,
    newEnd: requestForm.newEnd,
    reason: requestForm.reason,
    cause: requestForm.changeSummary?.cause || '',
    changeSummary: clonePlain(requestForm.changeSummary),
    detailChanges,
    aiApplied: requestForm.aiApplied,
    attachmentUrls: requestForm.attachments.map((file) => file.url || file.name).filter(Boolean),
  })

  await loadScheduleChangeData()
  resetRequestForm()
  activeTab.value = 'change'
  changeSubView.value = 'active'
}

// ─── 승인/반려/반영 ─────────────────────────────────────────────────────
const rejectModal = ref({ show: false, id: null, reason: '' })

async function approveRequest(id) {
  await approveScheduleChange(id, {
    approver: currentTradeLabel.value,
  })
  await loadScheduleChangeData()
}

async function applyToSchedule(id) {
  try {
    await applyScheduleChange(id)
    await Promise.all([loadProgressList(), loadWorkPlanDetails(), loadScheduleChangeData()])
    await loadDelayRiskTasks()
    alert('공정표에 반영했습니다.')
  } catch (err) {
    console.error('공정표 반영 실패:', err)
    alert(err?.response?.data?.message || err?.message || '공정표 반영에 실패했습니다.')
  }
}

function openRejectModal(id) {
  rejectModal.value = { show: true, id, reason: '' }
}
async function confirmReject() {
  if (!rejectModal.value.id || !rejectModal.value.reason.trim()) return

  await rejectScheduleChange(rejectModal.value.id, {
    approver: currentTradeLabel.value,
    rejectReason: rejectModal.value.reason,
  })

  await loadScheduleChangeData()
  rejectModal.value.show = false
}

// ─── AI 추천 수정 ───────────────────────────────────────────────────────
const editRecModal = ref({ show: false, id: null, days: 0, workers: 0 })
function openEditRec(id) {
  editRecModal.value = {
    show: true,
    id,
    days: aiRecs[id].editedAddDays,
    workers: aiRecs[id].editedWorkers,
  }
}
function saveEditRec() {
  const id = editRecModal.value.id
  aiRecs[id].editedAddDays = editRecModal.value.days
  aiRecs[id].editedWorkers = editRecModal.value.workers
  editRecModal.value.show = false
}

// ─── 작업 상세 모달 ─────────────────────────────────────────────────────
const taskDetailModal = ref({ show: false, taskId: null })
function openTaskDetail(taskId) {
  taskDetailModal.value = { show: true, taskId }
}
function closeTaskDetail() {
  taskDetailModal.value = { show: false, taskId: null }
}
function gotoAiFromDetail() {
  if (!detailTask.value) return
  selectedTaskId.value = detailTask.value.id
  activeTab.value = 'ai'
  closeTaskDetail()
}

// 도넛 카드 클릭 → 해당 공종의 지연 위험 작업 탭으로 이동
function onTradeCardClick(tradeProcessId) {
  selectedTradeId.value = tradeProcessId
  activeTab.value = 'ai'
}

// 지연 작업 탭의 "전체 보기" — 선택된 공종 해제
function clearSelectedTrade() {
  selectedTradeId.value = null
}

const currentSelectedTradeName = computed(() => {
  if (!selectedTradeId.value) return null
  if (typeof selectedTradeId.value === 'string' && selectedTradeId.value.startsWith('trade:')) {
    return selectedTradeId.value.replace('trade:', '')
  }
  const found = processes.value.find((p) => p.id === selectedTradeId.value)
  return found ? inferRepresentativeTradeName(found) : null
})
const detailTask = computed(() =>
  taskDetailModal.value.taskId
    ? delayTasks.value.find((t) => t.id === taskDetailModal.value.taskId)
    : null,
)
const detailRec = computed(() =>
  taskDetailModal.value.taskId ? aiRecs[taskDetailModal.value.taskId] : null,
)

// AI 탭 좌측 목록 선택
const selectedTaskId = ref(null)
const selectedTask = computed(
  () => delayTasks.value.find((t) => t.id === selectedTaskId.value) || null,
)
const selectedRec = computed(() => (selectedTaskId.value ? aiRecs[selectedTaskId.value] : null))

// AI 추천안에서 변경 요청 생성
// AI 추천안 → 요청 흐름 (빠른 확인 모달)
const aiQuickConfirm = ref({ show: false })

// 빠른 확인 모달에서 보여줄 변경 요약 (추천 수정안 카드와 동일한 데이터 소스)
const aiQuickSummary = computed(() => {
  const rec = selectedRec.value
  const task = selectedTask.value
  if (!rec || !task) return null

  const proposals = rec.detailEditProposals || []
  const proposalCount = proposals.length

  // 종료일 변경
  const oldEnd = task.originalEnd || task.plannedEnd
  let newEnd = oldEnd
  if (oldEnd && rec.editedAddDays) {
    const d = new Date(oldEnd)
    d.setDate(d.getDate() + rec.editedAddDays)
    newEnd = d.toISOString().slice(0, 10)
  }

  // 작업시간이 변경되는 세부일정만 필터
  const workTimeChanges = proposals.filter(
    (p) =>
      p.originalWorkTime && p.recommendedWorkTime && p.originalWorkTime !== p.recommendedWorkTime,
  )
  // 인력이 변경되는 세부일정만 필터
  const workerChanges = proposals.filter(
    (p) => p.recommendedRequiredCount !== p.originalRequiredCount,
  )
  const totalAdditionalWorkers = workerChanges.reduce(
    (sum, p) =>
      sum +
      Math.max(
        0,
        Number(p.recommendedRequiredCount || 0) - Number(p.originalRequiredCount || 0),
      ),
    0,
  )

  // 대표 변경(첫 proposal) 정보
  const sample = proposals[0] || null

  // 추가 공수(인시) 합계
  const totalAdditionalManHours = proposals.reduce(
    (sum, p) => sum + Number(p.additionalManHours || 0),
    0,
  )

  return {
    proposalCount,
    proposals,
    oldEnd,
    newEnd,
    addDays: rec.editedAddDays || 0,
    workTimeChanges,
    workerChanges,
    totalAdditionalWorkers,
    sample,
    totalAdditionalManHours: Math.round(totalAdditionalManHours * 10) / 10,
  }
})

// AI 추천에 기반한 변경 사유 텍스트 생성 (작업시간 포함)
function buildAiReasonText() {
  const summary = aiQuickSummary.value
  if (!summary) return ''
  const parts = [`AI 추천 반영 — ${summary.proposalCount}건 세부일정 재분배`]

  if (summary.workerChanges.length) {
    const sample = summary.workerChanges[0]
    if (summary.workerChanges.length === 1) {
      parts.push(
        `${sample.date} 인력 ${sample.originalRequiredCount}명 → ${sample.recommendedRequiredCount}명`,
      )
    } else {
      parts.push(
        `인력 조정 ${summary.workerChanges.length}건 (예: ${sample.originalRequiredCount}명 → ${sample.recommendedRequiredCount}명)`,
      )
    }
  }

  if (summary.workTimeChanges.length) {
    const sample = summary.workTimeChanges[0]
    if (summary.workTimeChanges.length === 1) {
      parts.push(`작업시간 ${sample.originalWorkTime} → ${sample.recommendedWorkTime}`)
    } else {
      parts.push(
        `작업시간 조정 ${summary.workTimeChanges.length}건 (예: ${sample.originalWorkTime} → ${sample.recommendedWorkTime})`,
      )
    }
  }

  if (summary.addDays > 0) {
    parts.push(`종료일 ${summary.addDays}일 연장 검토`)
  }

  return parts.join(' · ')
}

function buildAiApprovalData() {
  const summary = aiQuickSummary.value
  const rec = selectedRec.value
  const task = selectedTask.value
  if (!summary || !rec || !task) return { changeSummary: null, detailChanges: [] }

  const proposals = rec.detailEditProposals || []
  const detailChanges = proposals.map((p) => ({
    workPlanId: p.workPlanId,
    date: p.date,
    location: p.location || '',
    originalName: p.originalName,
    recommendedName: p.recommendedName,
    originalRequiredCount: Number(p.originalRequiredCount || 0),
    recommendedRequiredCount: Number(p.recommendedRequiredCount || 0),
    originalWorkTime: p.originalWorkTime || '',
    recommendedWorkTime: p.recommendedWorkTime || '',
    originalWorkHours: Number(p.originalWorkHours || 0),
    recommendedWorkHours: Number(p.recommendedWorkHours || 0),
    originalManHours: Number(p.originalManHours || 0),
    recommendedManHours: Number(p.recommendedManHours || 0),
    additionalManHours: Number(p.additionalManHours || 0),
    normalTargetPct: p.normalTargetPct,
    targetPct: p.targetPct,
    catchUpPct: p.catchUpPct,
    carryOver: !!p.carryOver,
    originalNote: p.originalNote || '',
    recommendedNote: p.recommendedNote || '',
    manHourAdjustmentReason: p.manHourAdjustmentReason || '',
    trade: p.trade || '',
    partner: p.partner || '',
    manager: p.manager || '',
    contact: p.contact || '',
    parentWorkPlanId: p.parentWorkPlanId || null,
    tradeProcessId: p.tradeProcessId || null,
  }))

  return {
    changeSummary: {
      source: 'AI_RECOMMENDATION',
      targetTaskId: task.id,
      targetTaskName: task.name,
      process: task.process,
      location: task.location || '',
      plannedPct: Number(task.plannedPct || 0),
      actualPct: Number(task.actualPct || 0),
      diffPct: Number(task.diff || 0),
      risk: task.risk || '',
      cause: task.cause || '',
      proposalCount: summary.proposalCount,
      oldEnd: summary.oldEnd,
      newEnd: summary.newEnd,
      addDays: summary.addDays,
      workerChangeCount: summary.workerChanges.length,
      workTimeChangeCount: summary.workTimeChanges.length,
      totalAdditionalManHours: summary.totalAdditionalManHours,
      redistributionLevel: rec.redistribution?.level || '',
      normalReturnDate: rec.redistribution?.normalReturnDate || '',
      expectedEffect: rec.expectedEffect || '',
      basis: rec.recommendation || rec.redistribution?.action || '',
    },
    detailChanges,
  }
}

// "재분배 요청 등록" 클릭 시 폼을 바로 열지 않고 빠른 확인 모달을 띄움
function createRequestFromAi() {
  if (!selectedTask.value || !selectedRec.value) return
  if (currentTradeItem.value && selectedTask.value.process !== currentTradeItem.value.name) return
  aiQuickConfirm.value.show = true
}

// AI 추천을 폼에 반영 (모달 / 즉시등록 양쪽에서 공통 사용)
function fillRequestFormFromAi() {
  const baseEnd = selectedTask.value.originalEnd || selectedTask.value.plannedEnd
  const newEndDate = new Date(baseEnd)
  newEndDate.setDate(newEndDate.getDate() + (selectedRec.value.editedAddDays || 0))
  const approvalData = buildAiApprovalData()
  Object.assign(requestForm, {
    taskId: selectedTask.value.id,
    process: selectedTask.value.process,
    task: selectedTask.value.name,
    oldStart: selectedTask.value.plannedStart || '',
    oldEnd: baseEnd,
    newStart: selectedTask.value.plannedStart || '',
    newEnd: newEndDate.toISOString().slice(0, 10),
    reason: buildAiReasonText(),
    changeSummary: approvalData.changeSummary,
    detailChanges: approvalData.detailChanges,
    aiApplied: true,
    attachments: [],
  })
}

// 빠른 확인 모달 — "그대로 요청 보내기"
async function quickSubmitFromAi() {
  if (!selectedTask.value || !selectedRec.value) return
  fillRequestFormFromAi()
  // 폼을 거치지 않고 즉시 요청 등록
  await submitRequest()
  aiQuickConfirm.value.show = false
  // submitRequest가 변경 관리 탭으로 이동시키고 폼은 닫힌 상태가 됨
}

// ─── 유틸 ───────────────────────────────────────────────────────────────
const statusColor = (s) =>
  ({
    정상: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    주의: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    '지연 위험': 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    지연: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    완료: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    미착수: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
  })[s] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'

const riskColor = (r) =>
  ({
    낮음: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    보통: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    높음: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    '매우 높음': 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  })[r] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'

const riskBar = (r) =>
  ({
    낮음: 'bg-sky-400',
    보통: 'bg-amber-400',
    높음: 'bg-orange-500',
    '매우 높음': 'bg-rose-500',
  })[r] || 'bg-slate-400'

const reqStatusColor = (s) =>
  ({
    pending: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    approved: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    applied: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  })[s] || 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'

const reqStatusLabel = (s) =>
  ({
    pending: '승인 대기',
    approved: '승인 완료',
    applied: '일정 반영 완료',
    rejected: '반려',
  })[s] || s

function diffDays(startDate, endDate) {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (!start || !end) return 0
  return Math.round((end - start) / DAY_MS)
}

function formatDayDelta(days) {
  const n = Number(days || 0)
  if (n > 0) return `+${n}일`
  if (n < 0) return `${n}일`
  return '납기 유지'
}

function formatPct(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return `${roundPct(n, 1)}%`
}

function requestDetailChanges(request) {
  return Array.isArray(request?.detailChanges) ? request.detailChanges : []
}

function requestApprovalSummary(request) {
  const details = requestDetailChanges(request)
  const summary = request?.changeSummary || {}
  const workerChanges = details.filter(
    (d) => Number(d.originalRequiredCount || 0) !== Number(d.recommendedRequiredCount || 0),
  )
  const workTimeChanges = details.filter(
    (d) =>
      String(d.originalWorkTime || '') &&
      String(d.recommendedWorkTime || '') &&
      String(d.originalWorkTime || '') !== String(d.recommendedWorkTime || ''),
  )
  const totalAdditionalManHours = details.reduce(
    (sum, d) => sum + Number(d.additionalManHours || 0),
    0,
  )
  const addDays =
    summary.addDays ??
    diffDays(summary.oldEnd || request?.oldEnd, summary.newEnd || request?.newEnd)

  return {
    proposalCount: summary.proposalCount ?? details.length,
    oldEnd: summary.oldEnd || request?.oldEnd || '',
    newEnd: summary.newEnd || request?.newEnd || '',
    addDays,
    workerChangeCount: summary.workerChangeCount ?? workerChanges.length,
    workTimeChangeCount: summary.workTimeChangeCount ?? workTimeChanges.length,
    totalAdditionalManHours: Number(summary.totalAdditionalManHours ?? totalAdditionalManHours),
    firstWorkerChange: workerChanges[0] || null,
    firstWorkTimeChange: workTimeChanges[0] || null,
    plannedPct: summary.plannedPct,
    actualPct: summary.actualPct,
    diffPct: summary.diffPct,
    risk: summary.risk || '',
    cause: summary.cause || '',
    redistributionLevel: summary.redistributionLevel || '',
    normalReturnDate: summary.normalReturnDate || '',
    expectedEffect: summary.expectedEffect || '',
    basis: summary.basis || '',
  }
}

function hasApprovalData(request) {
  return !!request?.changeSummary || requestDetailChanges(request).length > 0
}

function addDaysStr(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
</script>

<template>
  <div class="flex flex-col gap-5 pb-10">
    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 1. 헤더 — 타이틀 + 권한 토글                                       -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">공정 분석</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <!-- 공종별 권한 선택 -->
        <div class="flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white pl-2.5">
          <Layers class="h-3.5 w-3.5 text-forena-400" />
          <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400">공종</span>
          <select
            v-model="currentTrade"
            class="cursor-pointer rounded-r-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white outline-none transition hover:bg-forena-900"
          >
            <option value="all">현장 총 책임자 (전체)</option>
            <option v-for="p in tradeAuthorityOptions" :key="p.id" :value="p.name">
              {{ p.name }} 책임자
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 2. 권한 안내 배너 (작게)                                          -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div
      v-if="!isSupervisor"
      class="flex items-center gap-2 rounded-lg border border-flare-200 bg-flare-50/60 px-3 py-2 text-xs text-forena-800"
    >
      <UserCog class="h-3.5 w-3.5 shrink-0 text-flare-600" />
      <span>
        <strong class="text-flare-700">{{ currentTradeLabel }}</strong> 계정 —
        {{ currentTradeItem?.name || '선택된 공종' }} 공종만 조회 및 일정 변경 요청 가능
      </span>
    </div>
    <div
      v-else
      class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-forena-800"
    >
      <ShieldCheck class="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      <span>
        <strong class="text-emerald-700">현장 총 책임자</strong> 계정 — 전체 공종 조회 및 변경 요청
        승인·반려·반영 가능
      </span>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 3. KPI 요약 카드                                                  -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <div class="rounded-xl border border-orange-200 bg-white p-3.5">
        <p class="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-orange-600">
          지연 위험
        </p>
        <p class="text-2xl font-bold tabular-nums text-orange-700">{{ kpi.riskCount }}</p>
        <p class="mt-0.5 text-[10px] text-orange-400">건</p>
      </div>
      <div class="rounded-xl border border-rose-200 bg-white p-3.5">
        <p class="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-500">지연 발생</p>
        <p class="text-2xl font-bold tabular-nums text-rose-700">{{ kpi.delayCount }}</p>
        <p class="mt-0.5 text-[10px] text-rose-400">건</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-3.5">
        <p class="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">변경 요청</p>
        <p class="text-2xl font-bold tabular-nums text-amber-700">{{ kpi.reqCount }}</p>
        <p class="mt-0.5 text-[10px] text-amber-500">건</p>
      </div>
      <div class="rounded-xl border border-forena-200 bg-white p-3.5">
        <p class="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-forena-400">
          승인 대기
        </p>
        <p class="text-2xl font-bold tabular-nums text-forena-900">{{ kpi.pendingCount }}</p>
        <p class="mt-0.5 text-[10px] text-forena-400">건</p>
      </div>
    </div>

    <!-- 로딩 / 에러 상태 -->
    <div
      v-if="loading"
      class="rounded-xl border border-forena-200 bg-white px-4 py-3 text-sm text-forena-500"
    >
      공정 분석 데이터를 불러오는 중입니다...
    </div>
    <div
      v-if="errorMessage"
      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
    >
      {{ errorMessage }}
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 5. 탭 (3개)                                                      -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div class="flex gap-1 rounded-xl border border-forena-200 bg-forena-50/60 p-1">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        @click.prevent.stop="selectMainTab(t.key)"
        class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition"
        :class="
          activeTab === t.key
            ? 'bg-white text-forena-900 shadow-sm'
            : 'text-forena-400 hover:text-forena-700'
        "
      >
        <component :is="t.icon" class="h-3.5 w-3.5" />
        {{ t.label }}
        <span
          v-if="t.key === 'change' && kpi.pendingCount > 0"
          class="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] text-white"
          >{{ kpi.pendingCount }}</span
        >
      </button>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- TAB 1: 현황 분석 — 도넛 차트 메인 + 상세 테이블                    -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'overview'" class="space-y-5">
      <!-- ──────────────────────────────────────────────────────────── -->
      <!-- 🟠 메인 — 공종별 진척률 도넛 차트 그리드                       -->
      <!-- ──────────────────────────────────────────────────────────── -->
      <div
        v-if="!noDataYet"
        class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card"
      >
        <!-- 카드 헤더 -->
        <div class="mb-4 flex flex-wrap items-center gap-2 border-b border-forena-100 pb-3">
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-flare-50">
            <BarChart3 class="h-4 w-4 text-flare-600" />
          </div>
          <h2 class="text-sm font-bold text-forena-900">공종별 진척률</h2>
          <span class="hidden text-[11px] text-forena-400 sm:inline"
            >계획 vs 실제 — 도넛 차트로 한눈에 확인</span
          >
          <div class="ml-auto flex items-center gap-3 text-[10px] text-forena-500">
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-forena-400/60"></span>계획율
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-flare-500"></span>실제율
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span>지연
            </span>
          </div>
        </div>

        <!-- 도넛 그리드: 최대 3열 반응형 -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="g in groupProgress"
            :key="g.id"
            @click="onTradeCardClick(g.id)"
            class="group relative cursor-pointer overflow-hidden rounded-xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            :class="[
              g.isDelayed ? 'border-rose-200 bg-rose-50/20' : 'border-forena-100',
              selectedTradeId === g.id ? 'ring-2 ring-flare-400' : '',
            ]"
          >
            <!-- 상태 뱃지 -->
            <span
              class="absolute right-3 top-3 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
              :class="statusColor(g.statusLabel)"
            >
              {{ g.statusLabel }}
            </span>

            <!-- 공종명 + 협력사 -->
            <div class="mb-3 pr-16">
              <p class="text-base font-extrabold leading-tight text-forena-900">
                {{ g.group }}
              </p>
              <p class="mt-1 text-[10px] text-forena-400">{{ g.partner || '협력사 미지정' }}</p>
            </div>

            <!-- SVG 도넛 -->
            <div class="flex items-center justify-center py-1">
              <svg viewBox="0 0 100 100" class="h-32 w-32">
                <!-- 배경 트랙 -->
                <circle cx="50" cy="50" r="36" fill="none" stroke="#f1f5f9" stroke-width="10" />
                <!-- 계획율 (반투명 forena 톤) -->
                <path
                  v-if="g.plan > 0"
                  :d="arcPath(g.plan)"
                  fill="none"
                  stroke="#94a3b8"
                  stroke-opacity="0.5"
                  stroke-width="10"
                  stroke-linecap="round"
                />
                <!-- 실제율 (정상이면 flare, 지연이면 rose) -->
                <path
                  v-if="g.actual > 0"
                  :d="arcPath(g.actual)"
                  fill="none"
                  :stroke="g.isDelayed ? '#f43f5e' : '#f59e0b'"
                  stroke-width="10"
                  stroke-linecap="round"
                />
                <!-- 중앙 실제율 텍스트 -->
                <text
                  x="50"
                  y="48"
                  text-anchor="middle"
                  class="fill-forena-900"
                  font-size="18"
                  font-weight="700"
                >
                  {{ g.actual }}%
                </text>
                <text x="50" y="62" text-anchor="middle" class="fill-forena-400" font-size="8">
                  실제율
                </text>
              </svg>
            </div>

            <!-- 하단: 계획 / 실제 / 차이 -->
            <div
              class="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-forena-50/60 p-2 text-center text-[11px]"
            >
              <div>
                <p class="text-forena-500">계획</p>
                <p class="font-bold tabular-nums text-forena-700">{{ g.plan }}%</p>
              </div>
              <div>
                <p class="text-forena-500">실제</p>
                <p
                  class="font-bold tabular-nums"
                  :class="
                    g.isDelayed
                      ? 'text-rose-600'
                      : g.started
                        ? 'text-emerald-600'
                        : 'text-forena-500'
                  "
                >
                  {{ g.actual }}%
                </p>
              </div>
              <div>
                <p class="text-forena-500">차이</p>
                <p
                  class="font-bold tabular-nums"
                  :class="
                    g.diff < 0
                      ? 'text-rose-600'
                      : g.diff > 0
                        ? 'text-emerald-600'
                        : 'text-forena-500'
                  "
                >
                  {{ g.diff > 0 ? '+' : '' }}{{ g.diff }}%
                </p>
              </div>
            </div>

            <!-- 위험도 + 종료 예정 (작게) -->
            <div class="mt-2 flex items-center justify-between text-[10px] text-forena-400">
              <span class="inline-flex items-center gap-1">
                위험도
                <span class="rounded px-1 py-0.5 font-bold" :class="riskColor(g.risk)">{{
                  g.risk
                }}</span>
              </span>
              <span class="tabular-nums">~{{ g.forecastEnd || g.plannedEnd || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 데이터 없음 상태 -->
      <div
        v-else
        class="flex h-60 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-forena-200 bg-white text-sm text-forena-400"
      >
        <Layers class="h-8 w-8 text-forena-300" />
        <p>표시할 공정 데이터가 없습니다</p>
        <p class="text-[11px]">필터를 조정하거나 데이터를 다시 불러와주세요</p>
      </div>

      <!-- ──────────────────────────────────────────────────────────── -->
      <!-- 지연 감지 기준 안내 (컴팩트)                                    -->
      <!-- ──────────────────────────────────────────────────────────── -->
      <div v-if="!noDataYet" class="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
        <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
          <AlertTriangle class="h-3.5 w-3.5" /> 지연 감지 기준
        </p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-amber-800">
          <span class="flex items-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>계획 대비 실제 진척률 차이
            10% 이상
          </span>
          <span class="flex items-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full bg-orange-400"></span>예정 종료일 3일 이내인데
            실제 진척률 70% 미만
          </span>
          <span class="flex items-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full bg-rose-400"></span>선행 공정 지연으로 후속 공정
            영향 발생
          </span>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- TAB 2: 지연 위험 작업                                              -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'ai'" class="space-y-3">
      <!-- 선택된 공종 안내 / 전체 보기 토글 -->
      <div
        v-if="selectedTradeId && currentSelectedTradeName"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-flare-200 bg-flare-50/60 px-3 py-2 text-xs"
      >
        <span class="text-forena-700">
          <Layers class="mr-1 inline h-3.5 w-3.5 text-flare-600" />
          <strong class="text-flare-700">{{ currentSelectedTradeName }}</strong> 공종의 지연 위험
          작업만 표시 중
        </span>
        <button
          v-if="isSupervisor"
          @click="clearSelectedTrade"
          class="inline-flex items-center gap-1 rounded-md border border-flare-300 bg-white px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-50"
        >
          <X class="h-3 w-3" /> 전체 공종 보기
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <!-- 좌측: 지연 위험 작업 목록 -->
        <div class="overflow-hidden rounded-xl border border-forena-200 bg-white lg:col-span-5">
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/60 px-4 py-2.5"
          >
            <div>
              <p class="flex items-center gap-1.5 text-sm font-bold text-forena-900">
                <Activity class="h-4 w-4 text-rose-500" />
                지연 위험 작업
              </p>
              <p class="text-[11px] text-forena-400">선택하면 AI 추천안을 우측에 표시합니다</p>
            </div>
            <span
              class="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200"
              >{{ visibleTasks.length }}건</span
            >
          </div>
          <div class="max-h-[640px] divide-y divide-forena-50 overflow-y-auto">
            <div
              v-for="t in visibleTasks"
              :key="t.id"
              class="cursor-pointer p-4 transition-colors hover:bg-forena-50/60"
              :class="
                selectedTaskId === t.id
                  ? 'border-l-2 border-l-flare-500 bg-flare-50/50'
                  : 'border-l-2 border-l-transparent'
              "
              @click="selectedTaskId = t.id"
            >
              <div class="mb-2 flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <p class="truncate text-sm font-semibold text-forena-900">{{ t.name }}</p>
                    <span
                      v-if="t.isCritical"
                      class="shrink-0 rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold text-rose-700"
                      >CP</span
                    >
                  </div>
                  <p class="mt-0.5 text-[10px] text-forena-400">
                    <span
                      v-if="t.process"
                      class="rounded bg-flare-50 px-1 py-0.5 font-bold text-flare-700 ring-1 ring-flare-200"
                      >{{ t.process }}</span
                    >
                    <span v-if="t.location"> · {{ t.location }}</span>
                  </p>
                </div>
                <span
                  class="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                  :class="riskColor(t.risk)"
                  >{{ t.risk }}</span
                >
              </div>

              <!-- 미니 진척 막대 -->
              <div class="mt-2 space-y-1">
                <div class="flex items-center justify-between text-[10px] text-forena-400">
                  <span>계획 {{ t.plannedPct }}% / 실제 {{ t.actualPct }}%</span>
                  <span
                    class="rounded px-1.5 py-0.5 font-bold"
                    :class="
                      hasDailyReportProgress(t)
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    "
                  >
                    {{ progressSourceLabel(t.actualSource) }}
                  </span>
                  <span class="font-bold" :class="t.diff < 0 ? 'text-rose-500' : 'text-emerald-600'"
                    >차이 {{ t.diff }}%p</span
                  >
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-forena-100">
                  <div
                    class="h-full rounded-full"
                    :class="riskBar(t.risk)"
                    :style="{ width: t.actualPct + '%' }"
                  />
                </div>
              </div>

              <div class="mt-2 flex items-center gap-2">
                <button
                  @click.stop="openTaskDetail(t.id)"
                  class="inline-flex items-center gap-1 rounded-md border border-forena-200 bg-white px-2 py-1 text-[10px] font-bold text-forena-600 hover:bg-forena-50"
                >
                  <Eye class="h-2.5 w-2.5" /> 상세
                </button>
                <span class="text-[10px] text-forena-400">
                  예상 지연 <strong class="text-rose-600">{{ t.expectedDelayDays }}일</strong>
                </span>
              </div>
            </div>
            <div v-if="!visibleTasks.length" class="py-12 text-center text-xs text-slate-400">
              지연 위험 작업이 없습니다
            </div>
          </div>
        </div>

        <!-- 우측: AI 추천안 상세 -->
        <div class="lg:col-span-7">
          <div
            v-if="selectedTask && selectedRec"
            class="overflow-hidden rounded-xl border border-forena-200 bg-white"
          >
            <div
              class="flex items-center justify-between border-b border-forena-100 bg-forena-50/70 px-4 py-2.5"
            >
              <div class="flex items-center gap-2">
                <Sparkles class="h-4 w-4 text-flare-600" />
                <p class="text-sm font-bold text-forena-900">
                  작업 일정 조정 — {{ selectedTask.name }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  :disabled="selectedRec.aiStatus === 'PENDING'"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-[11px] font-bold text-cyan-700 transition-colors hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                  @click="requestAiRecommendationForSelectedTask"
                >
                  <LoaderCircle
                    v-if="selectedRec.aiStatus === 'PENDING'"
                    class="h-3.5 w-3.5 animate-spin"
                  />
                  <Sparkles v-else class="h-3.5 w-3.5" />
                  {{ selectedRec.source === 'AI' ? 'AI 재생성' : 'AI 추천 생성' }}
                </button>
                <button
                  @click="selectedTaskId = null"
                  class="text-forena-400 hover:text-forena-700"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div class="space-y-4 p-4">
              <!-- 핵심 지표 요약 -->
              <div class="grid gap-2 sm:grid-cols-4">
                <div class="rounded-lg border border-forena-100 bg-white px-3.5 py-2.5">
                  <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">계획</p>
                  <p class="mt-1 text-lg font-extrabold tabular-nums text-forena-800">
                    {{ selectedTask.plannedPct }}%
                  </p>
                </div>
                <div class="rounded-lg border border-forena-100 bg-white px-3.5 py-2.5">
                  <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">실제</p>
                  <p class="mt-1 text-lg font-extrabold tabular-nums text-forena-800">
                    {{ selectedTask.actualPct }}%
                  </p>
                  <p class="mt-0.5 text-[10px] font-semibold text-forena-400">
                    {{ progressSourceLabel(selectedTask.actualSource) }}
                  </p>
                </div>
                <div class="rounded-lg border border-forena-100 bg-white px-3.5 py-2.5">
                  <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">차이</p>
                  <p
                    class="mt-1 text-lg font-extrabold tabular-nums"
                    :class="
                      selectedTask.actualPct - selectedTask.plannedPct < 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    "
                  >
                    {{ Number((selectedTask.actualPct - selectedTask.plannedPct).toFixed(1)) }}%p
                  </p>
                </div>
                <div class="rounded-lg border border-forena-100 bg-white px-3.5 py-2.5">
                  <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                    예상 지연
                  </p>
                  <p
                    class="mt-1 text-lg font-extrabold tabular-nums"
                    :class="
                      selectedTask.expectedDelayDays > 0 ? 'text-rose-600' : 'text-forena-800'
                    "
                  >
                    {{ selectedTask.expectedDelayDays }}일
                  </p>
                </div>
              </div>

              <!-- 가장 중요한 영역: 실제 수정안 -->
              <div
                v-if="selectedRec.aiStatus === 'PENDING'"
                class="flex items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50 px-3.5 py-3 text-xs font-semibold text-cyan-800"
              >
                <LoaderCircle class="h-4 w-4 animate-spin" />
                OpenAI 추천안을 생성하는 중입니다. 완료되면 아래 수정안이 AI 결과로 갱신됩니다.
              </div>

              <div
                v-if="selectedRec.aiError"
                class="rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-3 text-xs font-semibold text-rose-700"
              >
                {{ selectedRec.aiError }}
              </div>

              <div
                v-if="selectedRec.detailEditProposals?.length"
                class="rounded-xl border border-cyan-200 bg-cyan-50/30 p-4"
              >
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="flex items-center gap-1.5 text-xs font-extrabold text-cyan-700">
                      <ListChecks class="h-3.5 w-3.5" /> AI 추천 작업 수정안
                    </p>
                    <p class="mt-0.5 text-[11px] text-forena-500">
                      실제 일자별 작업에 반영될 내용을 먼저 검토하세요.
                    </p>
                  </div>
                  <span
                    class="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-cyan-700 ring-1 ring-cyan-200"
                  >
                    {{ selectedRec.detailEditProposals.length }}건 검토
                  </span>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="proposal in selectedRec.detailEditProposals"
                    :key="proposal.workPlanId"
                    class="rounded-xl border border-cyan-100 bg-white p-3.5 shadow-sm"
                  >
                    <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p class="text-[10px] font-bold text-forena-400">
                          {{ proposal.date }} · work_plan #{{ proposal.workPlanId }}
                          <span
                            v-if="proposal.isUserEdited"
                            class="ml-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-extrabold text-violet-700 ring-1 ring-violet-200"
                            >관리자 수정됨</span
                          >
                        </p>
                        <p class="mt-1 text-base font-extrabold text-forena-900">
                          {{ proposal.originalName }}
                        </p>
                        <p v-if="proposal.location" class="mt-0.5 text-[11px] text-forena-400">
                          {{ proposal.location }}
                        </p>
                      </div>
                      <div class="flex flex-wrap items-start gap-2">
                        <div
                          class="rounded-lg bg-emerald-50 px-3 py-2 text-right ring-1 ring-emerald-100"
                        >
                          <p class="text-[10px] font-bold text-emerald-600">목표 진척률</p>
                          <p class="text-sm font-extrabold text-emerald-700">
                            {{ proposal.normalTargetPct }}% → {{ proposal.targetPct }}%
                          </p>
                          <p class="mt-0.5 text-[9px] font-bold text-emerald-500">
                            자동 계산값 · 수정 불가
                          </p>
                        </div>
                        <button
                          v-if="!proposal.isEditing"
                          type="button"
                          class="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-cyan-700 hover:bg-cyan-50"
                          @click="startEditProposal(proposal)"
                        >
                          <Pencil class="h-3 w-3" /> 수정
                        </button>
                        <div v-else class="flex items-center gap-1">
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-cyan-700"
                            @click="confirmEditProposal(proposal)"
                          >
                            <Check class="h-3 w-3" /> 확정
                          </button>
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
                            @click="cancelEditProposal(proposal)"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
                      <div class="rounded-lg bg-forena-50 px-3 py-3">
                        <p class="mb-1 text-[10px] font-bold text-forena-400">기존 작업</p>
                        <p class="text-sm font-bold text-forena-800">{{ proposal.originalName }}</p>
                        <p class="mt-1 text-[11px] text-forena-500">
                          인력 {{ proposal.originalRequiredCount }}명
                        </p>
                        <p class="mt-0.5 text-[11px] text-forena-500">
                          작업시간 {{ proposal.originalWorkTime || '-' }}
                        </p>
                        <p class="mt-0.5 text-[11px] text-forena-500">
                          공수 {{ proposal.originalManHours || 0 }}인시
                        </p>
                      </div>
                      <div class="hidden items-center justify-center md:flex">
                        <ChevronRight class="h-5 w-5 text-cyan-500" />
                      </div>
                      <div class="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-3">
                        <p class="mb-1 text-[10px] font-bold text-cyan-700">추천 수정안</p>
                        <template v-if="!proposal.isEditing">
                          <p class="text-sm font-extrabold text-cyan-900">
                            {{ proposal.recommendedName }}
                          </p>
                          <p class="mt-1 text-[11px] text-cyan-700">
                            인력 {{ proposal.originalRequiredCount }}명 →
                            {{ proposal.recommendedRequiredCount }}명
                          </p>
                          <p class="mt-0.5 text-[11px] text-cyan-700">
                            작업시간 {{ proposal.originalWorkTime || '-' }} →
                            {{ proposal.recommendedWorkTime || '-' }}
                          </p>
                          <p class="mt-0.5 text-[11px] font-bold text-cyan-800">
                            공수 {{ proposal.originalManHours || 0 }} →
                            {{ proposal.recommendedManHours || 0 }}인시
                            <span
                              v-if="Number(proposal.additionalManHours || 0) > 0"
                              class="font-extrabold text-emerald-600"
                            >
                              (+{{ proposal.additionalManHours }}인시)
                            </span>
                          </p>
                        </template>
                        <div v-else class="space-y-2">
                          <label class="block text-[10px] font-bold text-cyan-700">작업명</label>
                          <input
                            v-model="proposal.recommendedName"
                            class="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-cyan-900 outline-none focus:border-cyan-500"
                          />
                          <label class="block text-[10px] font-bold text-cyan-700">추천 인력</label>
                          <div class="flex items-center gap-2 text-xs text-cyan-700">
                            <span>기존 {{ proposal.originalRequiredCount }}명 →</span>
                            <input
                              v-model.number="proposal.recommendedRequiredCount"
                              type="number"
                              min="0"
                              class="w-20 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-right text-xs font-bold outline-none focus:border-cyan-500"
                            />
                            <span>명</span>
                          </div>

                          <label class="block text-[10px] font-bold text-cyan-700"
                            >추천 작업시간</label
                          >
                          <div class="flex items-center gap-2 text-xs text-cyan-700">
                            <span>기존 {{ proposal.originalWorkTime || '-' }} →</span>
                            <input
                              v-model="proposal.recommendedWorkTime"
                              placeholder="07:00 ~ 18:30"
                              class="w-36 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-cyan-500"
                            />
                          </div>
                          <p class="text-[10px] leading-relaxed text-cyan-600">
                            확정 시 입력한 작업시간과 추천 인력 기준으로 공수가 다시 계산됩니다.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="mt-3 rounded-lg border border-cyan-100 bg-cyan-50/60 px-3 py-2.5">
                      <p class="mb-1 text-[10px] font-bold text-cyan-700">추천 비고</p>
                      <p
                        v-if="!proposal.isEditing"
                        class="whitespace-pre-line text-[11px] leading-relaxed text-cyan-900"
                      >
                        {{ proposal.recommendedNote }}
                      </p>
                      <textarea
                        v-else
                        v-model="proposal.recommendedNote"
                        rows="4"
                        class="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-cyan-900 outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI 권고사항 -->
              <div class="rounded-lg border border-forena-100 bg-forena-50/40 px-3.5 py-3">
                <p class="mb-1.5 text-[11px] font-bold text-forena-400">AI 권고사항</p>
                <p class="whitespace-pre-line text-xs leading-relaxed text-forena-800">
                  {{ selectedRec.recommendation }}
                </p>
              </div>

              <!-- 책임자: 변경 요청 등록 -->
              <div
                v-if="
                  !isSupervisor &&
                  currentTradeItem &&
                  selectedTask.process === currentTradeItem.name
                "
                class="rounded-lg border border-flare-100 bg-flare-50/40 p-3"
              >
                <p class="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold text-flare-700">
                  <Sparkles class="h-3 w-3" /> 이 추천안을 그대로 총책임자에게 요청
                </p>
                <button
                  @click="createRequestFromAi"
                  class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-flare-500 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-flare-600"
                >
                  <Send class="h-4 w-4" />
                  세부일정 재분배 요청 등록
                </button>
              </div>
              <div
                v-else-if="!isSupervisor"
                class="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-500"
              >
                <Eye class="mr-1 inline h-3 w-3" />
                {{ selectedTask.process }} 공정은 본인 담당이 아니므로 조회만 가능합니다.
              </div>

              <div
                v-if="false"
                class="rounded-lg border border-forena-100 bg-forena-50/60 px-3.5 py-3 text-xs text-forena-500"
              >
                AI 추천안은 참고용입니다. 일정 변경은 공정 책임자 요청 → 총 책임자 승인 → 일정 반영
                순으로 처리됩니다.
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex h-72 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-forena-200 bg-white text-sm text-forena-400"
          >
            <Sparkles class="h-8 w-8 text-forena-300" />
            <p>왼쪽 목록에서 작업을 선택하세요</p>
            <p class="text-[11px]">선택한 작업의 AI 추천안이 여기에 표시됩니다</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- TAB 3: 변경 관리 — 요청/승인 + 이력 (서브 토글)                   -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'change'" class="space-y-4">
      <!-- 서브 토글 -->
      <div class="flex items-center justify-between">
        <div class="inline-flex rounded-lg border border-forena-200 bg-white p-0.5">
          <button
            type="button"
            @click.prevent.stop="selectChangeSubView('active')"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition"
            :class="
              changeSubView === 'active'
                ? 'bg-forena-800 text-white'
                : 'text-forena-500 hover:text-forena-800'
            "
          >
            <ClipboardList class="h-3.5 w-3.5" />
            {{ isSupervisor ? '승인 처리' : '요청 등록' }}
            <span
              v-if="kpi.pendingCount > 0 && isSupervisor"
              class="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] text-white"
              >{{ kpi.pendingCount }}</span
            >
          </button>
          <button
            type="button"
            @click.prevent.stop="selectChangeSubView('history')"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition"
            :class="
              changeSubView === 'history'
                ? 'bg-forena-800 text-white'
                : 'text-forena-500 hover:text-forena-800'
            "
          >
            <History class="h-3.5 w-3.5" /> 변경 이력
          </button>
        </div>
      </div>

      <!-- ────────────────────────── 요청/승인 뷰 ─────────────────── -->
      <div v-if="changeSubView === 'active'" class="space-y-4">
        <!-- 변경 요청 목록 -->
        <div>
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-bold text-forena-900">
              {{ isSupervisor ? '전체 일정 변경 요청 목록' : '내 요청 목록' }}
            </p>
            <span class="text-xs text-forena-400">
              총 {{ visibleRequests.length }}건 · 승인 대기 {{ kpi.pendingCount }}건
            </span>
          </div>
          <div class="space-y-3">
            <div
              v-for="r in visibleRequests"
              :key="r.id"
              class="overflow-hidden rounded-xl border border-forena-200 bg-white"
            >
              <div
                class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 bg-forena-50/60 px-4 py-3"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <p class="flex items-center gap-1.5 font-semibold text-forena-900">
                    <span
                      class="rounded bg-flare-50 px-1.5 py-0.5 text-[10px] font-bold text-flare-700 ring-1 ring-flare-200"
                      >{{ r.process }}</span
                    >
                    {{ r.task }}
                  </p>
                  <span
                    class="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                    :class="reqStatusColor(r.status)"
                    >{{ reqStatusLabel(r.status) }}</span
                  >
                  <span
                    v-if="r.aiApplied"
                    class="rounded bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700 ring-1 ring-flare-200"
                    >AI 반영</span
                  >
                </div>
                <div class="flex items-center gap-2 text-[11px] text-forena-400">
                  <span>{{ r.requester }}</span
                  ><span>·</span><span>{{ r.requestDate }}</span>
                </div>
              </div>
              <div class="space-y-4 p-4 text-xs">
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p class="mb-1 text-[10px] font-bold text-forena-400">기존 일정</p>
                    <p class="tabular-nums text-forena-600">
                      {{ r.oldStart || '-' }} ~ {{ r.oldEnd || '-' }}
                    </p>
                  </div>
                  <div>
                    <p class="mb-1 text-[10px] font-bold text-flare-600">변경 요청 일정</p>
                    <p class="font-semibold tabular-nums text-forena-800">
                      {{ r.newStart || '-' }} ~ {{ r.newEnd || '-' }}
                    </p>
                  </div>
                  <div>
                    <p class="mb-1 text-[10px] font-bold text-forena-400">변경 규모</p>
                    <p class="font-semibold text-forena-800">
                      {{
                        requestApprovalSummary(r).proposalCount
                          ? `세부일정 ${requestApprovalSummary(r).proposalCount}건`
                          : '일정 변경'
                      }}
                      <span class="ml-1 tabular-nums text-flare-600">
                        {{ formatDayDelta(requestApprovalSummary(r).addDays) }}
                      </span>
                    </p>
                  </div>
                  <div v-if="hasApprovalData(r)">
                    <p class="mb-1 text-[10px] font-bold text-forena-400">진척 근거</p>
                    <p class="font-semibold text-forena-800">
                      계획 {{ formatPct(requestApprovalSummary(r).plannedPct) }} · 실제
                      {{ formatPct(requestApprovalSummary(r).actualPct) }}
                    </p>
                  </div>
                </div>

                <div v-if="hasApprovalData(r)" class="border-t border-forena-100 pt-4">
                  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p class="text-[11px] font-extrabold text-forena-900">승인 검토 데이터</p>
                    <span
                      v-if="requestApprovalSummary(r).redistributionLevel"
                      class="rounded bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 ring-1 ring-cyan-100"
                    >
                      {{ requestApprovalSummary(r).redistributionLevel }}
                    </span>
                  </div>

                  <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-lg border border-forena-100 bg-forena-50/40 px-3 py-2.5">
                      <p class="mb-1 text-[10px] font-bold text-forena-400">투입 인력</p>
                      <template v-if="requestApprovalSummary(r).firstWorkerChange">
                        <p class="font-extrabold tabular-nums text-forena-900">
                          {{ requestApprovalSummary(r).firstWorkerChange.originalRequiredCount }}명
                          <ChevronRight class="mx-0.5 inline h-3 w-3 text-flare-400" />
                          {{
                            requestApprovalSummary(r).firstWorkerChange.recommendedRequiredCount
                          }}명
                        </p>
                        <p
                          v-if="requestApprovalSummary(r).workerChangeCount > 1"
                          class="mt-0.5 text-[10px] text-forena-400"
                        >
                          외 {{ requestApprovalSummary(r).workerChangeCount - 1 }}건
                        </p>
                      </template>
                      <p v-else class="font-semibold text-forena-500">변경 없음</p>
                    </div>

                    <div class="rounded-lg border border-forena-100 bg-forena-50/40 px-3 py-2.5">
                      <p class="mb-1 text-[10px] font-bold text-forena-400">작업시간</p>
                      <template v-if="requestApprovalSummary(r).firstWorkTimeChange">
                        <p class="font-extrabold tabular-nums text-forena-900">
                          {{ requestApprovalSummary(r).firstWorkTimeChange.originalWorkTime }}
                          <ChevronRight class="mx-0.5 inline h-3 w-3 text-flare-400" />
                          {{ requestApprovalSummary(r).firstWorkTimeChange.recommendedWorkTime }}
                        </p>
                        <p
                          v-if="requestApprovalSummary(r).workTimeChangeCount > 1"
                          class="mt-0.5 text-[10px] text-forena-400"
                        >
                          외 {{ requestApprovalSummary(r).workTimeChangeCount - 1 }}건
                        </p>
                      </template>
                      <p v-else class="font-semibold text-forena-500">변경 없음</p>
                    </div>

                    <div class="rounded-lg border border-forena-100 bg-forena-50/40 px-3 py-2.5">
                      <p class="mb-1 text-[10px] font-bold text-forena-400">추가 공수</p>
                      <p class="font-extrabold tabular-nums text-flare-700">
                        +{{ requestApprovalSummary(r).totalAdditionalManHours }}인시
                      </p>
                    </div>

                    <div class="rounded-lg border border-forena-100 bg-forena-50/40 px-3 py-2.5">
                      <p class="mb-1 text-[10px] font-bold text-forena-400">검토 포인트</p>
                      <p class="font-semibold text-forena-800">
                        {{ requestApprovalSummary(r).normalReturnDate || '즉시 만회 계획' }}
                      </p>
                    </div>
                  </div>

                  <div
                    v-if="requestDetailChanges(r).length"
                    class="mt-3 overflow-hidden rounded-lg border border-forena-100"
                  >
                    <div class="bg-forena-50/70 px-3 py-2">
                      <p class="text-[10px] font-bold text-forena-500">변경 대상 세부일정</p>
                    </div>
                    <div class="divide-y divide-forena-50 bg-white">
                      <div
                        v-for="detail in requestDetailChanges(r).slice(0, 3)"
                        :key="`${r.id}-${detail.workPlanId || detail.date || detail.originalName}`"
                        class="px-3 py-3"
                      >
                        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p class="font-extrabold text-forena-900">
                            <span class="mr-1 tabular-nums text-forena-500">{{ detail.date }}</span>
                            {{ detail.originalName }}
                          </p>
                          <span
                            v-if="detail.carryOver"
                            class="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-100"
                          >
                            미완료분 반영
                          </span>
                        </div>
                        <div class="grid gap-2 text-[11px] sm:grid-cols-2 lg:grid-cols-4">
                          <div v-if="detail.originalName !== detail.recommendedName">
                            <p class="mb-0.5 font-bold text-forena-400">작업명</p>
                            <p class="text-forena-600 line-through">{{ detail.originalName }}</p>
                            <p class="font-semibold text-forena-900">
                              {{ detail.recommendedName }}
                            </p>
                          </div>
                          <div>
                            <p class="mb-0.5 font-bold text-forena-400">인력</p>
                            <p class="font-semibold tabular-nums text-forena-800">
                              {{ detail.originalRequiredCount }}명
                              <ChevronRight class="mx-0.5 inline h-3 w-3 text-flare-400" />
                              {{ detail.recommendedRequiredCount }}명
                            </p>
                          </div>
                          <div>
                            <p class="mb-0.5 font-bold text-forena-400">작업시간</p>
                            <p class="font-semibold tabular-nums text-forena-800">
                              {{ detail.originalWorkTime || '-' }}
                              <ChevronRight class="mx-0.5 inline h-3 w-3 text-flare-400" />
                              {{ detail.recommendedWorkTime || '-' }}
                            </p>
                          </div>
                          <div>
                            <p class="mb-0.5 font-bold text-forena-400">공수</p>
                            <p class="font-semibold tabular-nums text-forena-800">
                              {{ detail.originalManHours || 0 }} →
                              {{ detail.recommendedManHours || 0 }}인시
                            </p>
                          </div>
                        </div>
                        <p
                          v-if="detail.recommendedNote"
                          class="mt-2 whitespace-pre-line rounded-md bg-cyan-50/60 px-2.5 py-2 text-[11px] leading-relaxed text-cyan-900"
                        >
                          {{ detail.recommendedNote }}
                        </p>
                      </div>
                    </div>
                    <div
                      v-if="requestDetailChanges(r).length > 3"
                      class="border-t border-forena-50 bg-forena-50/40 px-3 py-2 text-[10px] font-semibold text-forena-500"
                    >
                      외 {{ requestDetailChanges(r).length - 3 }}건은 동일 기준으로 변경됩니다.
                    </div>
                  </div>

                  <div
                    v-if="
                      requestApprovalSummary(r).basis || requestApprovalSummary(r).expectedEffect
                    "
                    class="mt-3 grid gap-3 lg:grid-cols-2"
                  >
                    <div v-if="requestApprovalSummary(r).basis">
                      <p class="mb-1 text-[10px] font-bold text-forena-400">AI 판단 근거</p>
                      <p
                        class="max-h-24 overflow-y-auto whitespace-pre-line rounded-lg bg-forena-50/60 px-3 py-2 text-[11px] leading-relaxed text-forena-700"
                      >
                        {{ requestApprovalSummary(r).basis }}
                      </p>
                    </div>
                    <div v-if="requestApprovalSummary(r).expectedEffect">
                      <p class="mb-1 text-[10px] font-bold text-forena-400">승인 시 기대 효과</p>
                      <p
                        class="rounded-lg bg-emerald-50/60 px-3 py-2 text-[11px] leading-relaxed text-emerald-800"
                      >
                        {{ requestApprovalSummary(r).expectedEffect }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="r.attachments?.length" class="mx-4 mb-3 flex flex-wrap gap-1.5">
                <span
                  v-for="(f, i) in r.attachments"
                  :key="i"
                  class="inline-flex items-center gap-1 rounded-md bg-forena-50 px-2 py-0.5 text-[10px] font-semibold text-forena-700"
                >
                  <Paperclip class="h-3 w-3" />{{ f.name }}
                </span>
              </div>

              <!-- 반려 사유 -->
              <div
                v-if="r.status === 'rejected' && r.rejectReason"
                class="mx-4 mb-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs"
              >
                <p class="mb-0.5 font-bold text-rose-600">반려 사유</p>
                <p class="text-rose-800">{{ r.rejectReason }}</p>
              </div>

              <!-- 책임자 액션 -->
              <div
                v-if="isSupervisor && (r.status === 'pending' || r.status === 'approved')"
                class="flex justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-4 py-3"
              >
                <button
                  v-if="r.status === 'pending'"
                  @click="openRejectModal(r.id)"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <X class="h-3.5 w-3.5" /> 반려
                </button>
                <button
                  v-if="r.status === 'pending'"
                  @click="approveRequest(r.id)"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
                >
                  <Check class="h-3.5 w-3.5" /> 승인
                </button>
                <button
                  v-if="r.status === 'approved'"
                  @click="applyToSchedule(r.id)"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-flare-600"
                >
                  <Send class="h-3.5 w-3.5" /> 공정표 반영
                </button>
              </div>
            </div>

            <div
              v-if="!visibleRequests.length"
              class="flex h-32 items-center justify-center rounded-xl border border-dashed border-forena-200 bg-white text-sm text-forena-400"
            >
              일정 변경 요청이 없습니다
            </div>
          </div>
        </div>
      </div>

      <!-- ────────────────────────── 변경 이력 뷰 ─────────────────── -->
      <div
        v-if="changeSubView === 'history'"
        class="overflow-hidden rounded-xl border border-forena-200 bg-white"
      >
        <div class="border-b border-forena-100 bg-forena-50/60 px-4 py-2.5">
          <p class="flex items-center gap-1.5 text-sm font-bold text-forena-900">
            <History class="h-4 w-4 text-forena-500" /> 변경 이력
          </p>
          <p class="text-[11px] text-forena-400">
            일정 변경 요청 승인 · 반려 · 일정 반영 처리 이력
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="border-b border-forena-100 bg-forena-50/30">
              <tr>
                <th class="px-4 py-3 text-left text-[10px] font-bold text-forena-400">처리</th>
                <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">
                  공정 · 작업
                </th>
                <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">
                  변경 전 종료
                </th>
                <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">
                  변경 후 종료
                </th>
                <th class="px-4 py-3 text-left text-[10px] font-bold text-forena-400">사유</th>
                <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">처리자</th>
                <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">
                  AI 추천 반영
                </th>
                <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">처리일</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-forena-50">
              <tr
                v-for="h in visibleHistory"
                :key="h.id"
                class="transition-colors hover:bg-forena-50/40"
              >
                <td class="px-4 py-3.5">
                  <span
                    class="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                    :class="
                      h.action === '승인'
                        ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                        : h.action === '일정 반영'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                    "
                    >{{ h.action }}</span
                  >
                </td>
                <td class="px-3 py-3.5 font-semibold text-forena-800">
                  <span
                    class="mr-1 rounded bg-flare-50 px-1 py-0.5 text-[9px] font-bold text-flare-700 ring-1 ring-flare-200"
                    >{{ h.process }}</span
                  >
                  {{ h.task }}
                </td>
                <td class="px-3 py-3.5 tabular-nums text-forena-500 line-through">
                  {{ h.oldEnd }}
                </td>
                <td class="px-3 py-3.5 font-semibold tabular-nums text-forena-800">
                  {{ h.newEnd }}
                </td>
                <td class="max-w-[180px] truncate px-4 py-3.5 text-forena-600">{{ h.reason }}</td>
                <td class="px-3 py-3.5 text-forena-500">{{ h.approver }}</td>
                <td class="px-3 py-3.5">
                  <span
                    v-if="h.aiApplied"
                    class="rounded bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700 ring-1 ring-flare-200"
                    >반영</span
                  >
                  <span v-else class="text-forena-300">–</span>
                </td>
                <td class="px-3 py-3.5 tabular-nums text-forena-400">{{ h.processedAt }}</td>
              </tr>
              <tr v-if="!visibleHistory.length">
                <td colspan="8" class="px-4 py-12 text-center text-sm text-forena-400">
                  변경 이력이 없습니다
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- 모달: AI 추천 수정                                                -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="editRecModal.show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="editRecModal.show = false"
      >
        <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-flare-50/60 px-5 py-4"
          >
            <div class="flex items-center gap-2">
              <Pencil class="h-4 w-4 text-flare-600" />
              <p class="font-bold text-forena-900">AI 추천 수치 수정</p>
            </div>
            <button
              @click="editRecModal.show = false"
              class="text-forena-400 hover:text-forena-700"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-5 p-5">
            <p class="text-[11px] text-forena-500">
              AI 추천 수치를 현장 상황에 맞게 조정할 수 있습니다.
            </p>
            <div>
              <label class="mb-2 block text-[11px] font-bold text-forena-400">변경 검토 일수</label>
              <div class="flex items-center gap-3">
                <input
                  type="range"
                  v-model.number="editRecModal.days"
                  min="0"
                  max="30"
                  step="1"
                  class="flex-1 accent-flare-600"
                />
                <span class="w-16 text-right font-bold tabular-nums text-flare-700"
                  >+{{ editRecModal.days }}일</span
                >
              </div>
              <div class="mt-0.5 flex justify-between text-[10px] text-forena-400">
                <span>0일</span><span>30일</span>
              </div>
            </div>
            <div>
              <label class="mb-2 block text-[11px] font-bold text-forena-400">추가 인력 (명)</label>
              <div class="flex items-center gap-3">
                <input
                  type="range"
                  v-model.number="editRecModal.workers"
                  min="0"
                  max="20"
                  step="1"
                  class="flex-1 accent-flare-600"
                />
                <span class="w-16 text-right font-bold tabular-nums text-flare-700"
                  >+{{ editRecModal.workers }}명</span
                >
              </div>
              <div class="mt-0.5 flex justify-between text-[10px] text-forena-400">
                <span>0명</span><span>20명</span>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-forena-100 bg-forena-50/60 px-5 py-3">
            <button
              @click="editRecModal.show = false"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-600 transition-colors hover:bg-forena-50"
            >
              취소
            </button>
            <button
              @click="saveEditRec"
              class="rounded-lg bg-flare-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-flare-700"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- 모달: AI 추천안 빠른 요청 확인                                    -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="aiQuickConfirm.show && selectedTask && selectedRec"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="aiQuickConfirm.show = false"
      >
        <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
          <!-- 헤더 -->
          <div
            class="flex items-center justify-between border-b border-flare-100 bg-flare-50/40 px-5 py-4"
          >
            <div class="flex items-center gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-flare-200"
              >
                <Sparkles class="h-4 w-4 text-flare-600" />
              </div>
              <div>
                <p class="text-sm font-extrabold text-forena-900">AI 추천안 요청</p>
                <p class="mt-0.5 text-[11px] text-forena-500">
                  추천안 그대로 총책임자에게 보내거나, 수정 후 보낼 수 있습니다
                </p>
              </div>
            </div>
            <button
              @click="aiQuickConfirm.show = false"
              class="text-forena-400 transition-colors hover:text-forena-700"
              aria-label="닫기"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- 본문: 요청 내용 미리보기 -->
          <div class="space-y-3 p-5">
            <!-- 작업 정보 -->
            <div class="rounded-lg border border-forena-200 bg-forena-50/40 px-3.5 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">대상 작업</p>
              <p class="mt-1 text-sm font-extrabold text-forena-900">{{ selectedTask.name }}</p>
              <p v-if="selectedTask.location" class="mt-0.5 text-[11px] text-forena-500">
                {{ selectedTask.process }} · {{ selectedTask.location }}
              </p>
            </div>

            <!-- 변경 요약 -->
            <div
              v-if="aiQuickSummary"
              class="overflow-hidden rounded-lg border-2 border-flare-200 bg-flare-50/30"
            >
              <div
                class="flex items-center justify-between border-b border-flare-100 bg-white/60 px-3.5 py-2"
              >
                <p class="text-[10px] font-bold uppercase tracking-wide text-flare-700">
                  변경 내용
                </p>
                <span
                  class="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-flare-700 ring-1 ring-flare-200"
                >
                  세부일정 {{ aiQuickSummary.proposalCount }}건 변경
                </span>
              </div>

              <div class="space-y-2 px-3.5 py-3">
                <!-- 종료일 변경 -->
                <div v-if="aiQuickSummary.addDays !== 0" class="flex items-center gap-2 text-xs">
                  <Clock class="h-3.5 w-3.5 shrink-0 text-flare-600" />
                  <span class="w-16 shrink-0 font-bold text-forena-500">종료일</span>
                  <span
                    class="tabular-nums text-forena-500"
                    :class="
                      aiQuickSummary.addDays !== 0 ? 'line-through decoration-forena-300' : ''
                    "
                  >
                    {{ aiQuickSummary.oldEnd || '—' }}
                  </span>
                  <template v-if="aiQuickSummary.addDays !== 0">
                    <ChevronRight class="h-3 w-3 text-flare-400" />
                    <span class="font-extrabold tabular-nums text-flare-700">
                      {{ aiQuickSummary.newEnd }}
                    </span>
                  </template>
                  <span
                    v-if="aiQuickSummary.addDays > 0"
                    class="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-flare-700 ring-1 ring-flare-300"
                  >
                    +{{ aiQuickSummary.addDays }}일
                  </span>
                  <span
                    v-else
                    class="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-300"
                  >
                    납기 유지
                  </span>
                </div>

                <!-- 인력 변경 -->
                <div
                  v-if="aiQuickSummary.workerChanges.length > 1"
                  class="flex items-center gap-2 text-xs"
                >
                  <UserCog class="h-3.5 w-3.5 shrink-0 text-flare-600" />
                  <span class="w-16 shrink-0 font-bold text-forena-500">투입 인력</span>
                  <span class="font-extrabold text-forena-800">
                    세부일정 {{ aiQuickSummary.workerChanges.length }}건 변경
                  </span>
                  <span
                    class="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-flare-700 ring-1 ring-flare-300"
                  >
                    +{{ aiQuickSummary.totalAdditionalWorkers }}명
                  </span>
                </div>
                <div
                  v-if="aiQuickSummary.workerChanges.length === 1"
                  class="flex items-center gap-2 text-xs"
                >
                  <UserCog class="h-3.5 w-3.5 shrink-0 text-flare-600" />
                  <span class="w-16 shrink-0 font-bold text-forena-500">투입 인력</span>
                  <span class="tabular-nums text-forena-500 line-through decoration-forena-300">
                    {{ aiQuickSummary.workerChanges[0].originalRequiredCount }}명
                  </span>
                  <ChevronRight class="h-3 w-3 text-flare-400" />
                  <span class="font-extrabold tabular-nums text-flare-700">
                    {{ aiQuickSummary.workerChanges[0].recommendedRequiredCount }}명
                  </span>
                  <span
                    v-if="aiQuickSummary.workerChanges.length > 1"
                    class="ml-1 text-[10px] text-forena-400"
                  >
                    외 {{ aiQuickSummary.workerChanges.length - 1 }}건
                  </span>
                  <span
                    class="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-flare-700 ring-1 ring-flare-300"
                  >
                    +{{
                      aiQuickSummary.workerChanges[0].recommendedRequiredCount -
                      aiQuickSummary.workerChanges[0].originalRequiredCount
                    }}명
                  </span>
                </div>

                <!-- 작업시간 변경 -->
                <div
                  v-if="aiQuickSummary.workTimeChanges.length > 1"
                  class="flex items-center gap-2 text-xs"
                >
                  <Activity class="h-3.5 w-3.5 shrink-0 text-flare-600" />
                  <span class="w-16 shrink-0 font-bold text-forena-500">작업시간</span>
                  <span class="font-extrabold text-forena-800">
                    세부일정 {{ aiQuickSummary.workTimeChanges.length }}건 변경
                  </span>
                </div>
                <div
                  v-if="aiQuickSummary.workTimeChanges.length === 1"
                  class="flex items-center gap-2 text-xs"
                >
                  <Activity class="h-3.5 w-3.5 shrink-0 text-flare-600" />
                  <span class="w-16 shrink-0 font-bold text-forena-500">작업시간</span>
                  <span class="tabular-nums text-forena-500 line-through decoration-forena-300">
                    {{ aiQuickSummary.workTimeChanges[0].originalWorkTime }}
                  </span>
                  <ChevronRight class="h-3 w-3 text-flare-400" />
                  <span class="font-extrabold tabular-nums text-flare-700">
                    {{ aiQuickSummary.workTimeChanges[0].recommendedWorkTime }}
                  </span>
                  <span
                    v-if="aiQuickSummary.workTimeChanges.length > 1"
                    class="ml-1 text-[10px] text-forena-400"
                  >
                    외 {{ aiQuickSummary.workTimeChanges.length - 1 }}건
                  </span>
                </div>

                <!-- 추가 공수 합계 -->
                <div
                  v-if="aiQuickSummary.totalAdditionalManHours > 0"
                  class="flex items-center gap-2 text-xs"
                >
                  <TrendingUp class="h-3.5 w-3.5 shrink-0 text-flare-600" />
                  <span class="w-16 shrink-0 font-bold text-forena-500">추가 공수</span>
                  <span class="font-extrabold tabular-nums text-flare-700">
                    +{{ aiQuickSummary.totalAdditionalManHours }}인시
                  </span>
                </div>
              </div>

              <!-- 대표 세부일정 정보 -->
              <div
                v-if="aiQuickSummary.proposals && aiQuickSummary.proposals.length"
                class="border-t border-flare-100 bg-white/70 px-3.5 py-3"
              >
                <p class="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-forena-500">
                  변경 대상 세부일정
                </p>
                <div class="space-y-2">
                  <div
                    v-for="(proposal, index) in aiQuickSummary.proposals"
                    :key="proposal.workPlanId || `${proposal.date}-${index}`"
                    class="rounded-lg border border-forena-100 bg-white px-3 py-2"
                  >
                    <div class="flex items-start gap-2">
                      <span
                        class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-flare-50 text-[10px] font-extrabold tabular-nums text-flare-700 ring-1 ring-flare-200"
                      >
                        {{ index + 1 }}
                      </span>
                      <div class="min-w-0">
                        <p class="truncate text-xs font-extrabold text-forena-900">
                          {{ proposal.date }} · {{ proposal.originalName }}
                        </p>
                        <p class="mt-0.5 truncate text-[10px] text-forena-500">
                          {{ proposal.location || selectedTask.location || '-' }}
                        </p>
                      </div>
                    </div>
                    <div class="mt-2 grid grid-cols-1 gap-1.5 text-[11px] sm:grid-cols-3">
                      <p class="tabular-nums text-forena-600">
                        인력
                        <span class="font-bold text-forena-800">
                          {{ proposal.originalRequiredCount }}명 → {{ proposal.recommendedRequiredCount }}명
                        </span>
                      </p>
                      <p class="tabular-nums text-forena-600">
                        시간
                        <span class="font-bold text-forena-800">
                          {{ proposal.originalWorkTime || '-' }} → {{ proposal.recommendedWorkTime || '-' }}
                        </span>
                      </p>
                      <p class="tabular-nums text-forena-600">
                        공수
                        <span class="font-bold text-flare-700">
                          +{{ Math.round(Number(proposal.additionalManHours || 0) * 10) / 10 }}인시
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="false"
                class="border-t border-flare-100 bg-white/60 px-3.5 py-2"
              >
                <p class="text-[10px] text-forena-500">
                  <span class="font-bold text-forena-600">대표 일정:</span>
                  {{ aiQuickSummary.sample.date }} {{ aiQuickSummary.sample.originalName }}
                </p>
              </div>
            </div>

            <p class="text-[11px] leading-relaxed text-forena-500">
              <span class="font-bold text-forena-700">전송하기</span>를 선택하면 위 내용으로 요청이
              즉시 등록되고, 총책임자의 승인 후 일정에 반영됩니다.
            </p>
          </div>

          <!-- 푸터 -->
          <div
            class="flex flex-wrap justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-5 py-3"
          >
            <button
              @click="aiQuickConfirm.show = false"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-600 transition-colors hover:bg-forena-50"
            >
              취소
            </button>
            <button
              @click="quickSubmitFromAi"
              class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-flare-600"
            >
              <Send class="h-3 w-3" />
              전송하기
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- 모달: 반려 사유 입력                                              -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="rejectModal.show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="rejectModal.show = false"
      >
        <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div
            class="flex items-center justify-between border-b border-rose-100 bg-rose-50/60 px-5 py-4"
          >
            <div class="flex items-center gap-2">
              <AlertTriangle class="h-4 w-4 text-rose-600" />
              <p class="font-bold text-rose-800">일정 변경 요청 반려</p>
            </div>
            <button @click="rejectModal.show = false" class="text-rose-400 hover:text-rose-700">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-3 p-5">
            <p class="text-xs text-forena-600">
              반려 사유를 입력해주세요. 입력한 내용은 공정 책임자에게 전달됩니다.
            </p>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold text-forena-400">
                반려 사유 <span class="text-rose-500">*</span>
              </label>
              <textarea
                v-model="rejectModal.reason"
                rows="4"
                placeholder="예: 제출된 근거 자료 미흡, 추가 현장 확인 필요, 다른 공정 일정과 충돌 등"
                class="w-full resize-none rounded-lg border border-forena-200 px-3 py-2.5 text-xs outline-none transition-colors focus:border-rose-400"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-forena-100 bg-forena-50/60 px-5 py-3">
            <button
              @click="rejectModal.show = false"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-600 transition-colors hover:bg-forena-50"
            >
              취소
            </button>
            <button
              @click="confirmReject"
              :disabled="!rejectModal.reason.trim()"
              class="rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
              :class="rejectModal.reason.trim() ? 'bg-rose-600 hover:bg-rose-700' : ''"
            >
              반려 확인
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- 모달: 작업 상세                                                   -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="taskDetailModal.show && detailTask"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeTaskDetail"
      >
        <div
          class="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-forena-100 px-6 py-4"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-flare-50">
                <ClipboardList class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">지연 위험 작업 상세</p>
                <p class="mt-0.5 text-xs text-forena-500">
                  {{ detailTask.process }} 공정 · {{ detailTask.partner }}
                </p>
              </div>
            </div>
            <button @click="closeTaskDetail" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <!-- 타이틀 + 위험도 -->
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-lg font-bold text-forena-900">{{ detailTask.name }}</h2>
              <span
                v-if="detailTask.isCritical"
                class="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700"
                >CP · 임계공정</span
              >
              <span
                class="rounded-lg px-2 py-0.5 text-[11px] font-bold"
                :class="riskColor(detailTask.risk)"
                >위험도 {{ detailTask.risk }}</span
              >
            </div>
            <p class="mt-1 text-xs text-forena-500">
              <ChevronRight class="inline h-3 w-3" />작업 위치:
              <strong class="text-forena-700">{{ detailTask.location }}</strong>
            </p>

            <!-- 진척률 박스 -->
            <div class="mt-4 grid grid-cols-3 gap-2.5">
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3">
                <p class="text-[10px] font-bold uppercase text-forena-400">계획</p>
                <p class="mt-0.5 text-2xl font-bold tabular-nums text-forena-700">
                  {{ detailTask.plannedPct }}%
                </p>
              </div>
              <div class="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                <p class="text-[10px] font-bold uppercase text-rose-500">실제</p>
                <p class="mt-0.5 text-2xl font-bold tabular-nums text-rose-700">
                  {{ detailTask.actualPct }}%
                </p>
                <p class="mt-0.5 text-[10px] text-rose-500">차이 {{ detailTask.diff }}%p</p>
                <p class="mt-0.5 text-[10px] font-semibold text-rose-500">
                  {{ progressSourceLabel(detailTask.actualSource) }}
                </p>
              </div>
              <div class="rounded-xl border border-orange-200 bg-orange-50/40 p-3">
                <p class="text-[10px] font-bold uppercase text-orange-600">예상 지연</p>
                <p class="mt-0.5 text-2xl font-bold tabular-nums text-orange-700">
                  {{ detailTask.expectedDelayDays }}일
                </p>
              </div>
            </div>

            <!-- 정보 -->
            <div class="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div class="rounded-xl border border-forena-100 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  지연 원인
                </p>
                <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ detailTask.cause }}</p>
              </div>
              <div class="rounded-xl border border-rose-100 bg-rose-50/30 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-rose-500">
                  후속 공정 영향
                </p>
                <p class="mt-1 text-xs leading-relaxed text-rose-800">
                  {{ detailTask.followEffect }}
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  현재 투입 인력
                </p>
                <p class="mt-1 text-sm font-bold text-forena-900">
                  {{ detailTask.actualWorkers }}명
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  계획 종료일
                </p>
                <p class="mt-1 text-sm font-bold tabular-nums text-forena-900">
                  {{ detailTask.originalEnd }}
                </p>
              </div>
            </div>

            <!-- AI 요약 미리보기 -->
            <div
              v-if="detailRec"
              class="mt-3 rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3"
            >
              <p class="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                <Sparkles class="h-3.5 w-3.5" />AI 분석 요약
              </p>
              <p class="mt-1 text-xs leading-relaxed text-amber-900">{{ detailRec.summary }}</p>
            </div>
          </div>

          <div
            class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3"
          >
            <button
              @click="closeTaskDetail"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50"
            >
              닫기
            </button>
            <button
              @click="gotoAiFromDetail"
              class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600"
            >
              <Sparkles class="h-3.5 w-3.5" /> AI 추천안 보기
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
