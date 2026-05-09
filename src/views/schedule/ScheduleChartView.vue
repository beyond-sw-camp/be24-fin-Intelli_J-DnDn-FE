<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue' // ← 맨 위로
import { useGanttStore } from '@/stores/ganttStore.js'
import { parseFromApi } from '@/utils/ganttParser.js'
import { listTradeProcessesRaw } from '@/api/tradeProcess.js'
import { buildGanttData } from '@/utils/scheduleMapper.js'
import { fetchWorkPlansByProject } from '@/api/workplan.js'
import { useCurrentProject } from '@/composables/useCurrentProject.js'

const ganttStore = useGanttStore() // ← import 다 끝난 후에
const { currentProjectId } = useCurrentProject()
import {
  CalendarRange,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Upload,
  FileText,
  BrainCircuit,
  Pencil,
  X,
  Eye,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Locate,
  Search,
  GitBranch,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  MessagesSquare,
  Layers,
  BarChart3,
  Clock,
  Users,
  Wrench,
  MapPin,
  Diamond,
  Sparkles,
  FilePlus2,
  MoveRight,
} from 'lucide-vue-next'
import { parseGanttJSON } from '@/utils/ganttParser.js'

const projectInfo = ref(ganttStore.projectInfo ?? {})
const aiTasks = ref(ganttStore.tasks ?? [])
const milestones = ref(ganttStore.milestones ?? [])
const workPlans = ref([])

function getWorkPlanStart(wp) {
  return wp.actualStart || wp.start
}

function getWorkPlanEnd(wp) {
  return wp.effectiveEnd || wp.end
}

function getWorkPlanDoneEnd(wp) {
  const start = getWorkPlanStart(wp)
  const end = getWorkPlanEnd(wp)
  const today = todayIso.value

  if (!start || !end) return null
  if (today < start) return null
  if (today > end) return end

  return today
}

function getWorkPlanRemainStart(wp) {
  const start = getWorkPlanStart(wp)
  const end = getWorkPlanEnd(wp)
  const today = todayIso.value

  if (!start || !end) return null
  if (today < start) return start
  if (today >= end) return null

  return today
}

// 스토어 데이터 변경 시 자동 반영
watch(
  () => ganttStore.tasks,
  (val) => {
    aiTasks.value = val ?? []
  },
)
watch(
  () => ganttStore.milestones,
  (val) => {
    milestones.value = val ?? []
  },
)
watch(
  () => ganttStore.projectInfo,
  (val) => {
    projectInfo.value = val ?? {}
  },
)

// 아래는 다른 기능용 — 건드리지 않아도 됨
const uploadedDocs = ref([])
const changeRequests = ref([])
const changeLog = ref([])

// ======================================================
// 상태/UI 토글
// ======================================================
const ganttScale = ref('month') // year | month | week
const ganttZoom = ref(1) // 0.6 ~ 1.6
const onlyCp = ref(false)
const onlyMilestone = ref(false)
const highlightDelayed = ref(true)

const groupOpen = ref({})

function isDateInRange(start, end, date = new Date().toISOString().slice(0, 10)) {
  if (!start || !end) return false
  return start <= date && date <= end
}

function isTaskInProgress(task) {
  if (isDateInRange(task?.start, task?.end)) return true

  const plans = task?.workPlans
  if (!Array.isArray(plans)) return false

  return plans.some((plan) => isDateInRange(getWorkPlanStart(plan), getWorkPlanEnd(plan)))
}

function resetGroupOpenByCurrentTasks(tasks = aiTasks.value) {
  const groups = [...new Set((tasks ?? []).map((t) => t.group).filter(Boolean))]
  groupOpen.value = Object.fromEntries(
    groups.map((group) => [
      group,
      (tasks ?? []).some((task) => task.group === group && isTaskInProgress(task)),
    ]),
  )
}

watch(
  aiTasks,
  (tasks) => {
    resetGroupOpenByCurrentTasks(tasks)
  },
  { immediate: true },
)

const filterGroup = ref('')
const filterReview = ref('')
const filterCp = ref('')
const searchKey = ref('')

const selectedTaskId = ref(null)
const selectedTask = computed(
  () => aiTasks.value.find((t) => t.id === selectedTaskId.value) ?? null,
)
function attachWorkPlansToTasks(tasks, plans) {
  const workPlanMap = new Map()

  plans.forEach((plan) => {
    if (!plan.tradeProcessId) return

    if (!workPlanMap.has(plan.tradeProcessId)) {
      workPlanMap.set(plan.tradeProcessId, [])
    }

    workPlanMap.get(plan.tradeProcessId).push(plan)
  })

  return tasks.map((task) => {
    const taskId = Number(task.id)

    return {
      ...task,
      workPlans: workPlanMap.get(taskId) || [],
    }
  })
}

/**
 * task 에 연결된 WorkPlan 들을 합쳐서 빨간 막대 좌표 산출.
 *
 * 디자인:
 *   - 연한 빨강 (배경): planStart ~ planEnd (WorkPlan 기간 전체)
 *   - 진한 빨강 (오버레이): actualStart ~ min(today, planEnd) (실제 진행한 부분)
 *
 * 반환: { planStart, planEnd, actualStart, hasStarted } | null
 *  - 연결된 WorkPlan 이 하나도 없으면 null (빨간 막대 안 그림)
 *  - planStart: WorkPlan 들 중 가장 빠른 start
 *  - planEnd: WorkPlan 들 중 가장 늦은 effectiveEnd (또는 end)
 *  - actualStart: WorkPlan 들 중 가장 빠른 actualStart. 없으면 null.
 *  - hasStarted: 어느 한 plan 이라도 actualStart 가 있으면 true
 */
function workPlanProgress(task) {
  const plans = task?.workPlans
  if (!Array.isArray(plans) || plans.length === 0) return null

  let planStart = null
  let planEnd = null
  let actualStart = null

  for (const p of plans) {
    if (p.start && (!planStart || p.start < planStart)) planStart = p.start
    const e = p.effectiveEnd ?? p.end
    if (e && (!planEnd || e > planEnd)) planEnd = e
    if (p.actualStart && (!actualStart || p.actualStart < actualStart)) {
      actualStart = p.actualStart
    }
  }

  // 어떤 좌표도 못 잡으면 그릴 게 없음
  if (!planStart || !planEnd) return null

  return {
    planStart,
    planEnd,
    actualStart,
    hasStarted: !!actualStart,
  }
}

/**
 * 진한 빨강(진행된 구간) 의 [시작, 끝] 좌표.
 * 그릴 게 없으면 null.
 *
 * 원본 동작과 호환: actualStart 가 없어도 planStart 부터 today 까지 채움.
 * (실측 시작일이 안 들어와도 "오늘까지 진행된 것으로 간주"하던 기존 로직 유지)
 */
function progressBarRange(task) {
  const wp = workPlanProgress(task)
  if (!wp || !wp.planStart || !wp.planEnd) return null

  const today = new Date().toISOString().slice(0, 10)

  // 시작점: actualStart 우선, 없으면 planStart
  const fillStart = wp.actualStart ?? wp.planStart

  // 오늘이 아직 시작 전이면 진행된 것 없음
  if (today < fillStart) return null

  // 끝점: 오늘 vs planEnd 중 빠른 쪽
  const fillEnd = today < wp.planEnd ? today : wp.planEnd

  if (fillStart > fillEnd) return null

  return { start: fillStart, end: fillEnd }
}

/**
 * 빨간 막대의 진한 부분(오버레이) 너비를 % 로 계산.
 * 전체 막대(planStart ~ planEnd) 기준 actualStart 또는 planStart ~ min(today, planEnd) 의 비율.
 */
function progressFillWidthPct(task) {
  const wp = workPlanProgress(task)
  if (!wp || !wp.planStart || !wp.planEnd) return 0

  const today = new Date().toISOString().slice(0, 10)
  // 진한 부분 시작점: actualStart 가 있으면 그 값, 없으면 0% (안 그림)
  const fillStart = wp.actualStart ?? null
  if (!fillStart) return 0

  // 진한 부분 끝점: today vs planEnd 중 작은 값
  const fillEnd = today < wp.planEnd ? today : wp.planEnd

  // fillStart 가 planEnd 보다 미래면 진행 0
  if (fillStart > wp.planEnd) return 0
  // fillEnd 가 fillStart 이전이면 진행 0
  if (fillEnd < fillStart) return 0

  const totalMs = new Date(wp.planEnd) - new Date(wp.planStart)
  const elapsedMs = new Date(fillEnd) - new Date(wp.planStart)
  if (totalMs <= 0) return 0

  // 진한 부분의 시작점도 planStart 가 아닐 수 있지만,
  // 디자인적으로 "왼쪽부터 채워지는" 형태가 자연스러우므로
  // 시작점을 planStart 로 보고 fillEnd 까지만 채움.
  const pct = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100))
  return Math.round(pct * 10) / 10
}

// WorkPlanView와 동일하게 빨간 진행 점이 진행률/오늘 위치를 따라가도록 계산
function workPlanProgressDotStyle(task) {
  const wp = workPlanProgress(task)
  const range = progressBarRange(task)
  if (!wp || !range) return { display: 'none' }

  const full = barStyle(wp.planStart, wp.planEnd)
  const fill = barStyle(wp.planStart, range.end)
  if (!full || !fill) return { display: 'none' }

  const fullLeft = parseFloat(full.left)
  const fullWidth = parseFloat(full.width)
  const fillLeft = parseFloat(fill.left)
  const fillWidth = parseFloat(fill.width)
  const width = Math.max(0, Math.min(fullWidth, fillLeft + fillWidth - fullLeft))

  if (!Number.isFinite(width) || width <= 0) return { display: 'none' }
  return { left: `${Math.max(0, width - 4)}px` }
}
// 다이아몬드 버튼 누르면 토글 한 번에 접히고 열림
function toggleAllGroups() {
  const allOpen = Object.values(groupOpen.value).every((v) => v)
  Object.keys(groupOpen.value).forEach((k) => (groupOpen.value[k] = !allOpen))
  onlyMilestone.value = !onlyMilestone.value
}

// 모달
const editModalOpen = ref(false)
const editForm = ref(null)
const confirmModalOpen = ref(false)
const changeModalOpen = ref(false)
const changeRequestFormOpen = ref(false)
const newChangeReq = ref(null)
const selectedChangeId = ref(null)
const selectedChange = computed(
  () => changeRequests.value.find((c) => c.id === selectedChangeId.value) ?? null,
)

// 업로드 폼
const uploadForm = ref({ docType: '마스터 공정표', desc: '', fileName: '' })
const showUploadSection = ref(false)
const aiAnalyzing = ref(false)

// =====================================================
// 최초 등록 페이지 (등록된 공정표 데이터가 없을 때)
// =====================================================
const firstSetup = ref({
  master: {
    name: '마스터 공정표',
    desc: '전체 공정의 큰 줄기를 담은 마스터 일정',
    file: null,
    status: 'idle',
  }, // idle | uploading | done
  milestone: {
    name: '마일스톤 공정표',
    desc: '주요 마일스톤(착공, 골조 완료, 준공 등) 일자',
    file: null,
    status: 'idle',
  },
  plan: {
    name: '공종별 시공계획서',
    desc: '공종별 상세 일정 — 골조, 전기, 설비 등',
    file: null,
    status: 'idle',
  },
})
const setupAnalyzing = ref(false)
const setupDone = ref(false)
function pickSetupFile(key, e) {
  const f = e.target.files?.[0]
  if (!f) return
  firstSetup.value[key].file = { name: f.name, size: f.size }
  firstSetup.value[key].status = 'uploading'
  setTimeout(() => {
    firstSetup.value[key].status = 'done'
  }, 700)
  e.target.value = ''
}
function handleSetupDrop(key, e) {
  const f = e.dataTransfer.files?.[0]
  if (!f) return
  firstSetup.value[key].file = { name: f.name, size: f.size }
  firstSetup.value[key].status = 'uploading'
  setTimeout(() => {
    firstSetup.value[key].status = 'done'
  }, 700)
}
function clearSetupFile(key) {
  firstSetup.value[key].file = null
  firstSetup.value[key].status = 'idle'
}
const setupReady = computed(() => Object.values(firstSetup.value).every((d) => d.status === 'done'))
function runSetupAnalysis() {
  if (!setupReady.value) return
  setupAnalyzing.value = true
  setTimeout(() => {
    setupAnalyzing.value = false
    setupDone.value = true
    setTimeout(() => {
      noDataYet.value = false
      setupDone.value = false
      projectInfo.value.status = '검토 중'
    }, 900)
  }, 1600)
}
function fmtFileSize(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

// AI 분석 결과 모달
const aiAnalysisModalOpen = ref(false)

// 마일스톤 칩/리스트 클릭 시 해당 항목 강조
const highlightedMilestoneId = ref(null)

// 오늘 날짜 (yyyy-MM-dd) — 템플릿에서 빨간 막대 진행/예정 구간 분기에 사용
const todayIso = computed(() => new Date().toISOString().slice(0, 10))

// 인라인 핸들러를 메서드로 추출 (포매터가 multi-line 으로 펼쳐도 안전하게)
function toggleMilestoneHighlight(id) {
  highlightedMilestoneId.value = highlightedMilestoneId.value === id ? null : id
  selectedTaskId.value = null
}
function selectTask(id) {
  selectedTaskId.value = id
  highlightedMilestoneId.value = null
}
function clearMilestoneHighlight() {
  highlightedMilestoneId.value = null
}

// ======================================================
// 헬퍼
// ======================================================
const isConfirmed = computed(() =>
  ['확정', '변경 요청 중', '변경 승인 완료'].includes(projectInfo.value.status),
)

const reviewStatusClass = (s) =>
  ({
    승인: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    미검토: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    '검토 중': 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    '수정 요청': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    제외: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  })[s] ?? 'bg-slate-100 text-slate-500'

const docStatusClass = (s) =>
  ({
    미등록: 'bg-slate-100 text-slate-500',
    'AI 분석 중': 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    '검토 중': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    확정: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    '변경 요청 중': 'bg-flare-50 text-flare-700 ring-1 ring-flare-200',
    '변경 승인 완료': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  })[projectInfo.value.status] ?? 'bg-slate-100 text-slate-500'

const milestoneStatusClass = (s) =>
  ({
    예정: 'bg-slate-100 text-slate-500',
    정상: 'bg-emerald-50 text-emerald-700',
    '지연 위험': 'bg-rose-50 text-rose-700',
    완료: 'bg-flare-50 text-flare-700',
  })[s] ?? 'bg-slate-100'

const crStatusClass = (s) =>
  ({
    요청됨: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    '검토 중': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    승인: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    반려: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    '반영 완료': 'bg-flare-50 text-flare-700 ring-1 ring-flare-200',
  })[s] ?? 'bg-slate-100'

const confidenceClass = (n) =>
  n >= 90 ? 'text-emerald-600' : n >= 80 ? 'text-forena-600' : 'text-amber-600'

// 필터링된 작업 (테이블/간트차트 공용)
const filteredTasks = computed(() => {
  let r = aiTasks.value
  if (filterGroup.value) r = r.filter((t) => t.group === filterGroup.value)
  if (filterReview.value) r = r.filter((t) => t.reviewStatus === filterReview.value)
  if (filterCp.value === 'cp') r = r.filter((t) => t.isCritical)
  if (filterCp.value === 'noncp') r = r.filter((t) => !t.isCritical)
  if (onlyCp.value) r = r.filter((t) => t.isCritical)
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase()
    r = r.filter(
      (t) =>
        t.name.toLowerCase().includes(k) ||
        t.group.toLowerCase().includes(k) ||
        t.sub.toLowerCase().includes(k),
    )
  }
  return r
})

// 공종 그룹별 묶기
const groupedTasks = computed(() => {
  const map = new Map()
  for (const t of filteredTasks.value) {
    if (!map.has(t.group)) map.set(t.group, [])
    map.get(t.group).push(t)
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }))
})


// 검증 (확정 전 / 후 모두 화면에 노출)
const validation = computed(() => {
  const issues = []
  const unreviewed = aiTasks.value.filter((t) => t.reviewStatus === '미검토').length
  if (unreviewed) issues.push({ level: 'warn', msg: `미검토 항목이 ${unreviewed}건 있습니다.` })

  const noDate = aiTasks.value.filter((t) => !t.start || !t.end).length
  if (noDate)
    issues.push({ level: 'error', msg: `시작일/종료일 누락 작업이 ${noDate}건 있습니다.` })

  const reverse = aiTasks.value.filter((t) => t.start && t.end && t.start > t.end).length
  if (reverse)
    issues.push({ level: 'error', msg: `시작일이 종료일보다 늦은 작업이 ${reverse}건 있습니다.` })

  const wsum = aiTasks.value.reduce((a, t) => a + (Number(t.weight) || 0), 0)
  if (wsum !== 100) issues.push({ level: 'warn', msg: `보할 합계가 ${wsum}% 입니다 (100% 권장).` })

  const lowConf = aiTasks.value.filter((t) => t.confidence < 80).length
  if (lowConf)
    issues.push({ level: 'info', msg: `AI 신뢰도 80% 미만 항목이 ${lowConf}건 있습니다.` })

  const noLink = aiTasks.value.filter((t) => !t.prev && !t.next).length
  if (noLink)
    issues.push({ level: 'info', msg: `선행/후속 작업이 모두 누락된 항목이 ${noLink}건 있습니다.` })

  const pendingChanges = changeRequests.value.filter((c) =>
    ['요청됨', '검토 중'].includes(c.status),
  ).length
  if (pendingChanges)
    issues.push({
      level: 'warn',
      msg: `확정된 공정표에 변경 요청 ${pendingChanges}건이 대기 중입니다.`,
    })

  return issues
})

const validationCounts = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  // isDelayed 와 동일한 로직 (호이스팅 회피용 인라인)
  const isDelayedInline = (t) => {
    if (!t.start || !t.end) return false
    if (today < t.start) return false
    if (today > t.end && t.reviewStatus !== '승인') return true
    return t.confidence < 85
  }
  return {
    unreviewed: aiTasks.value.filter((t) => t.reviewStatus === '미검토').length,
    delayed: aiTasks.value.filter(isDelayedInline).length,
    pendingChanges: changeRequests.value.filter((c) => ['요청됨', '검토 중'].includes(c.status))
      .length,
    weightSum: aiTasks.value.reduce((a, t) => a + (Number(t.weight) || 0), 0),
  }
})

// ======================================================
// 간트차트 — 라인형
// ======================================================
const projStart = computed(() => projectInfo.value.startDate)
const projEnd = computed(() => projectInfo.value.endDate)
const projTotalDays = computed(() => {
  const a = new Date(projStart.value),
    b = new Date(projEnd.value)
  return Math.round((b - a) / 86400000) + 1
})
function dayOffset(dateStr) {
  const a = new Date(projStart.value),
    b = new Date(dateStr)
  return Math.max(0, Math.round((b - a) / 86400000))
}
function rangeDays(s, e) {
  return Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000) + 1)
}

// 스케일별 셀 너비(px)
const cellW = computed(() => {
  const base = ganttScale.value === 'year' ? 1.2 : ganttScale.value === 'month' ? 3 : 14
  return base * ganttZoom.value
})
const ganttPxWidth = computed(() => projTotalDays.value * cellW.value)

// 헤더 라벨 — year(분기), month(월), week(주)
const ganttHeader = computed(() => {
  const out = []
  const a = new Date(projStart.value)
  const total = projTotalDays.value
  if (ganttScale.value === 'year') {
    // 분기 단위
    let y = a.getFullYear(),
      q = Math.floor(a.getMonth() / 3) + 1
    let cursor = new Date(a)
    while (cursor < new Date(projEnd.value)) {
      const qStart = new Date(y, (q - 1) * 3, 1)
      const qEndMonth = (q - 1) * 3 + 3
      const qEnd = new Date(y, qEndMonth, 0)
      const start = qStart < a ? a : qStart
      const end = qEnd > new Date(projEnd.value) ? new Date(projEnd.value) : qEnd
      out.push({ label: `${y}년 ${q}Q`, days: Math.round((end - start) / 86400000) + 1 })
      q += 1
      if (q > 4) {
        q = 1
        y += 1
      }
      cursor = new Date(y, (q - 1) * 3, 1)
    }
  } else if (ganttScale.value === 'month') {
    let cur = new Date(a.getFullYear(), a.getMonth(), 1)
    const last = new Date(projEnd.value)
    while (cur <= last) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const start = cur < a ? a : cur
      const end = next > last ? last : next
      out.push({
        label: `${cur.getFullYear()}.${String(cur.getMonth() + 1).padStart(2, '0')}`,
        days: Math.round((end - start) / 86400000) + 1,
      })
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
  } else {
    // 주간 — 7일씩
    let cursor = new Date(a)
    let weekIdx = 1
    while (cursor <= new Date(projEnd.value)) {
      const next = new Date(cursor)
      next.setDate(next.getDate() + 7)
      const end = next > new Date(projEnd.value) ? new Date(projEnd.value) : next
      out.push({ label: `${weekIdx}주`, days: Math.round((end - cursor) / 86400000) + 1 })
      cursor = next
      weekIdx += 1
      if (weekIdx > 200) break // 안전장치
    }
  }
  return out
})

// 막대 위치 계산
function barStyle(start, end) {
  if (!start || !end) return null
  const left = dayOffset(start) * cellW.value
  const width = rangeDays(start, end) * cellW.value
  return { left: `${left}px`, width: `${width - 4}px` }
}

function toDateOnly(value) {
  if (!value) return null
  return String(value).slice(0, 10)
}

function daysInclusive(start, end) {
  const s = new Date(start)
  const e = new Date(end)

  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return 0
  }

  return Math.floor((e - s) / 86400000) + 1
}

function getRawWeight(task) {
  const raw = task?._src?.weightPct ?? task?.weight
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function calcPlannedProgressByToday(tasks) {
  const today = new Date().toISOString().slice(0, 10)

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return 0
  }

  // 전체 보할 합계로 단위 판단
  // 합계가 1 근처면 0.00726 같은 비율값
  // 합계가 100 근처면 이미 퍼센트값
  const rawWeightSum = tasks.reduce((sum, task) => {
    return sum + getRawWeight(task)
  }, 0)

  const weightMultiplier = rawWeightSum <= 1.5 ? 100 : 1

  const total = tasks.reduce((sum, task) => {
    const start = toDateOnly(task.start)
    const end = toDateOnly(task.end)
    const weightPct = getRawWeight(task) * weightMultiplier

    if (!start || !end || weightPct <= 0) {
      return sum
    }

    if (today < start) {
      return sum
    }

    if (today >= end) {
      return sum + weightPct
    }

    const totalDays = daysInclusive(start, end)
    const elapsedDays = daysInclusive(start, today)

    if (totalDays <= 0) {
      return sum
    }

    return sum + weightPct * (elapsedDays / totalDays)
  }, 0)

  console.log('보할 원본 합계:', rawWeightSum)
  console.log('보할 변환 배수:', weightMultiplier)
  console.log('계획 공정률 원본 계산값:', total)

  return Math.floor(total)
}

// 오늘 라인
const todayLineStyle = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  if (today < projStart.value || today > projEnd.value) return null
  return { left: `${dayOffset(today) * cellW.value + cellW.value / 2}px` }
})

// 마일스톤 마커 위치
function milestoneStyle(date) {
  return { left: `${dayOffset(date) * cellW.value + cellW.value / 2 - 6}px` }
}

// 그룹별 마일스톤 (간트 그룹 헤더라인에 표시)
function milestonesOfGroup(groupName) {
  return milestones.value.filter((m) => m.group === groupName)
}

// 현재일 근접 판단 (±14일 이내 이고 미완료 상태일 때 pulse)
function isMilestoneSoon(m) {
  if (m.status === '완료') return false
  const today = new Date()
  const ms = new Date(m.date)
  const diffDays = Math.abs((ms - today) / 86400000)
  return diffDays <= 14
}

// 마일스톤 색상 (다이아몬드 채움색)
function milestoneFill(m) {
  if (m.status === '완료') return '#10b981' // emerald-500
  if (m.status === '지연 위험') return '#f43f5e' // rose-500
  return '#3b82f6' // blue-500 (예정)
}
function milestoneStroke(m) {
  if (m.status === '완료') return '#047857' // emerald-700
  if (m.status === '지연 위험') return '#be123c' // rose-700
  return '#1d4ed8' // blue-700
}

// 데이터 미등록 (최초 등록 화면 노출 조건)
const noDataYet = ref(false) // true 로 두면 최초 등록 화면 노출
function enterFirstSetup() {
  noDataYet.value = true
}
function exitFirstSetup() {
  noDataYet.value = false
}

/**
 * 지연 위험 판단.
 *  - 시작 전 작업 (today < start) → 지연 아님
 *  - 종료 후인데 검토 미완료 → 지연
 *  - 진행 중 작업 → 신뢰도 < 85 면 지연 위험 (실제 진척률 컬럼이 추가되면 그걸로 교체)
 */
function isDelayed(task) {
  if (!task.start || !task.end) return false
  const today = new Date().toISOString().slice(0, 10)
  // 시작 전: 지연 아님
  if (today < task.start) return false
  // 종료 지났는데 아직 미완료(승인되지 않음) → 지연
  if (today > task.end && task.reviewStatus !== '승인') return true
  // 진행 중: 신뢰도 기반 임시 판단
  return task.confidence < 85
}

// ======================================================
// 액션 핸들러 — 모두 mock
// ======================================================
function onUploadFile(e) {
  const f = e.target.files?.[0]
  if (f) uploadForm.value.fileName = f.name
  e.target.value = ''
}
function runAiAnalysis() {
  if (!uploadForm.value.fileName) {
    alert('파일을 먼저 업로드하세요.')
    return
  }
  aiAnalyzing.value = true
  projectInfo.value.status = 'AI 분석 중'
  setTimeout(() => {
    aiAnalyzing.value = false
    projectInfo.value.status = '검토 중'
    uploadedDocs.value.unshift({
      id: Date.now(),
      name: uploadForm.value.fileName,
      type: uploadForm.value.docType,
      uploadedAt: new Date().toLocaleString('ko-KR'),
      uploadedBy: '관리자',
      aiAnalyzed: true,
      reflectStatus: '검토 중',
      desc: uploadForm.value.desc,
    })
    uploadForm.value = { docType: '마스터 공정표', desc: '', fileName: '' }
    showUploadSection.value = false
    aiAnalysisModalOpen.value = true
  }, 1400)
}
function loadExistingDoc() {
  alert('기존 문서 불러오기 (데모)')
}
function manualInput() {
  alert('직접 입력 모드 (데모)')
}
function reanalyze(docId) {
  const doc = uploadedDocs.value.find((d) => d.id === docId)
  if (doc) {
    doc.reflectStatus = '검토 중'
    alert(`"${doc.name}" 재분석 시작 (데모)`)
  }
}
function viewDoc(doc) {
  alert(`원본 문서 보기: ${doc.name} (데모)`)
}
function downloadDoc(doc) {
  alert(`다운로드: ${doc.name} (데모)`)
}

// 검토 상태 빠른 변경
function setReview(task, status) {
  task.reviewStatus = status
}
// 검증 경고 갯수에 따라 한 줄에 몇 개할지 설정
const gridClass = computed(() => {
  const count = validation.value.length

  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count === 3) return 'grid-cols-3'
  // 4개 이상일 때는 무조건 4열로 고정 (나머지는 다음 줄로 넘어감)
  return 'grid-cols-4'
})

// 일괄 처리
function bulkApprove() {
  aiTasks.value.forEach((t) => {
    if (t.checked) t.reviewStatus = '승인'
  })
  aiTasks.value.forEach((t) => (t.checked = false))
}
function bulkExclude() {
  aiTasks.value.forEach((t) => {
    if (t.checked) t.reviewStatus = '제외'
  })
  aiTasks.value.forEach((t) => (t.checked = false))
}

// 수정 모달
function openEdit(task) {
  if (isConfirmed.value) {
    // 확정 후에는 변경 요청 모달
    openChangeRequestForm(task)
    return
  }
  editForm.value = JSON.parse(JSON.stringify(task))
  editForm.value._original = JSON.parse(JSON.stringify(task)) // 변경 비교용
  editModalOpen.value = true
}
function saveEdit() {
  const idx = aiTasks.value.findIndex((t) => t.id === editForm.value.id)
  if (idx !== -1) {
    const { _original, ...payload } = editForm.value
    Object.assign(aiTasks.value[idx], payload)
    aiTasks.value[idx].reviewStatus = '검토 중'
  }
  editModalOpen.value = false
  editForm.value = null
}

// 기준 공정표 확정
function openConfirm() {
  if (!canConfirm.value) {
    alert('기준 공정표 확정 권한이 없습니다.')
    return
  }
  confirmModalOpen.value = true
}
function confirmBaseline() {
  projectInfo.value.status = '확정'
  projectInfo.value.lastModified = new Date().toISOString().slice(0, 10)
  changeLog.value.unshift({
    id: Date.now(),
    at: new Date().toLocaleString('ko-KR'),
    who: '박현수',
    action: '기준 공정표 확정',
    target: `v${changeLog.value.length + 1}`,
    detail: `전체 ${aiTasks.value.length}건 / CP ${aiTasks.value.filter((t) => t.isCritical).length}건`,
  })
  confirmModalOpen.value = false
  alert('기준 공정표가 확정되었습니다. 이후 수정은 변경 요청을 통해 처리됩니다.')
}

// 변경 요청
function openChangeManagement() {
  changeModalOpen.value = true
}
function openChangeRequestForm(task) {
  newChangeReq.value = {
    taskId: task.id,
    taskName: task.name,
    group: task.group,
    changeType: '시작일 변경',
    oldStart: task.start,
    oldEnd: task.end,
    newStart: task.start,
    newEnd: task.end,
    oldCp: task.isCritical,
    newCp: task.isCritical,
    oldWeight: task.weight,
    newWeight: task.weight,
    oldPrev: task.prev,
    newPrev: task.prev,
    reason: '',
  }
  changeRequestFormOpen.value = true
}
function submitChangeRequest() {
  if (!newChangeReq.value.reason.trim()) {
    alert('변경 사유를 입력하세요.')
    return
  }
  const cp = newChangeReq.value.oldCp || newChangeReq.value.newCp
  const delayDays = Math.max(
    0,
    Math.round(
      (new Date(newChangeReq.value.newEnd) - new Date(newChangeReq.value.oldEnd)) / 86400000,
    ),
  )
  changeRequests.value.unshift({
    id: Date.now(),
    requestedAt: new Date().toISOString().slice(0, 10),
    ...newChangeReq.value,
    requester: '관리자',
    affectedTasks: [],
    milestoneImpact: cp ? '관련 마일스톤 영향 가능' : '없음',
    cpImpact: cp,
    expectedDelayDays: delayDays,
    aiSummary: cp
      ? `CP 공정 변경 요청. ${delayDays}일 지연 시 후속 작업과 마일스톤에 영향 가능. 현장 총책임자 승인 권장.`
      : `비CP 공정. 일정 영향 제한적.`,
    status: '요청됨',
    approver: '',
    approvedAt: '',
  })
  projectInfo.value.status = '변경 요청 중'
  changeRequestFormOpen.value = false
  alert('변경 요청이 등록되었습니다.')
}
function approveChange(cr) {
  if (!canConfirm.value) {
    alert('변경 승인 권한이 없습니다.')
    return
  }
  cr.status = '승인'
  cr.approver = '박현수'
  cr.approvedAt = new Date().toISOString().slice(0, 10)
  // 실제 작업 데이터에 반영
  const t = aiTasks.value.find((x) => x.id === cr.taskId)
  if (t) {
    t.start = cr.newStart
    t.end = cr.newEnd
    t.isCritical = cr.newCp
    t.weight = cr.newWeight
    t.prev = cr.newPrev
    t.durDays = rangeDays(cr.newStart, cr.newEnd)
  }
  cr.status = '반영 완료'
  projectInfo.value.status = '변경 승인 완료'
  changeLog.value.unshift({
    id: Date.now(),
    at: new Date().toLocaleString('ko-KR'),
    who: '박현수',
    action: '승인',
    target: cr.taskName,
    detail: `${cr.changeType}: ${cr.oldStart}~${cr.oldEnd} → ${cr.newStart}~${cr.newEnd}`,
  })
}
function rejectChange(cr) {
  if (!canConfirm.value) {
    alert('변경 반려 권한이 없습니다.')
    return
  }
  cr.status = '반려'
  cr.approver = '박현수'
  cr.approvedAt = new Date().toISOString().slice(0, 10)
  changeLog.value.unshift({
    id: Date.now(),
    at: new Date().toLocaleString('ko-KR'),
    who: '박현수',
    action: '반려',
    target: cr.taskName,
    detail: cr.reason,
  })
}
function reviewChange(cr) {
  cr.status = '검토 중'
}

// 줌
function zoomIn() {
  ganttZoom.value = Math.min(1.6, +(ganttZoom.value + 0.2).toFixed(1))
}

// 춤 아웃 설정 마지막 마일스톤까지만 축소 되도록 설정
function zoomOut() {
  const el = document.getElementById('gantt-scroll')
  if (!el) return
  // 이제 gantt-scroll이 차트 영역만 감싸므로 그대로 사용
  const availableWidth = el.clientWidth
  const base = ganttScale.value === 'year' ? 1.2 : ganttScale.value === 'month' ? 3 : 14
  const minZoom = availableWidth / (projTotalDays.value * base)
  const newZoom = Math.max(+minZoom.toFixed(2), +(ganttZoom.value - 0.2).toFixed(1))
  ganttZoom.value = Math.min(1.6, newZoom)
}

const isLoading = ref(false)
const loadError = ref('')

async function loadGanttFromApi() {
  // 1) 스토어에 이미 데이터가 있으면 그대로 사용 (FirstDocumentUpload 에서 넘어온 경우)
  if (ganttStore.tasks && ganttStore.tasks.length > 0) {
    projectInfo.value = ganttStore.projectInfo ?? {}
    aiTasks.value = ganttStore.tasks ?? []
    milestones.value = ganttStore.milestones ?? []
    resetGroupOpenByCurrentTasks(aiTasks.value)
    return
  }

  // 2) 스토어가 비어 있으면 (새로고침 등) 백엔드에서 다시 로드
  isLoading.value = true
  loadError.value = ''
  try {
    const rows = await listTradeProcessesRaw({ projectId: currentProjectId.value })

    console.log(
      'TradeProcess 원본 rows:',
      rows.map((r) => ({
        idx: r.idx,
        tradeName: r.tradeName,
        processName: r.processName,
      })),
    )
    const plans = await fetchWorkPlansByProject(currentProjectId.value)

    console.log('WorkPlan 데이터:', plans)
    console.log(
      'WorkPlan tradeProcessId 목록:',
      plans.map((p) => p.tradeProcessId),
    )
    if (!rows.length) {
      // 데이터가 아예 없는 현장 — 일단 빈 상태로 두고 사용자가 등록 페이지에서 업로드하도록
      projectInfo.value = {}
      aiTasks.value = []
      milestones.value = []
      return
    }

    // master 키 하나로 묶어 buildGanttData 에 전달 (FirstDocumentUpload 와 동일한 매핑 경로)
    const { tasks, milestones: ms, projectInfo: pi } = buildGanttData({ master: rows })

    const tasksWithWorkPlans = attachWorkPlansToTasks(tasks, plans)

    const plannedProgress = calcPlannedProgressByToday(tasksWithWorkPlans)

    const updatedProjectInfo = {
      ...pi,
      plannedProgress,
    }

    projectInfo.value = updatedProjectInfo
    aiTasks.value = tasksWithWorkPlans
    milestones.value = ms

    ganttStore.setData(tasksWithWorkPlans, ms, updatedProjectInfo)
  } catch (err) {
    console.error('공정표 로드 실패:', err)
    loadError.value = err?.message || '공정표를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

// 마우스 휠로 좌우로 움직일 수 있도록 설정
function onGanttWheel(e) {
  const el = document.getElementById('gantt-scroll')
  if (el) el.scrollLeft += e.deltaY
}

function scrollToToday() {
  const today = new Date().toISOString().slice(0, 10)
  if (today < projStart.value || today > projEnd.value) {
    alert('오늘 날짜가 공사 기간 밖입니다.')
    return
  }
  const el = document.getElementById('gantt-scroll')
  if (el) el.scrollLeft = Math.max(0, dayOffset(today) * cellW.value - 200)
}

onMounted(async () => {
  await loadGanttFromApi()
  await nextTick()
  scrollToToday()
})
</script>

<style scoped>
.slide-detail-enter-active,
.slide-detail-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-detail-enter-from,
.slide-detail-leave-to {
  opacity: 0;
  width: 0;
  min-width: 0;
}
.slide-detail-enter-to,
.slide-detail-leave-from {
  opacity: 1;
  width: 320px;
}

/* 마일스톤 — 현재일 근접 시 pulse */
@keyframes ms-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(244, 63, 94, 0));
  }
  50% {
    transform: scale(1.18);
    filter: drop-shadow(0 0 4px rgba(244, 63, 94, 0.55));
  }
}
.ms-pulse {
  animation: ms-pulse 1.6s ease-in-out infinite;
  transform-origin: center;
}

/* 마일스톤 hover 시 살짝 확대 */
.ms-marker {
  transition: transform 0.15s ease;
}
.ms-marker:hover {
  transform: scale(1.25);
}

/* 마일스톤 표 ↔ 간트 강조 */
.ms-highlight {
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.85));
}

/* 마일스톤 가로 스크롤 (간트 상단 영역) */
.ms-row {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: thin;
}
.ms-row::-webkit-scrollbar {
  height: 4px;
}
.ms-row::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.15);
  border-radius: 999px;
}
.ms-row::-webkit-scrollbar-track {
  background: transparent;
}

/* 간트 차트 스크롤 설정 */
#gantt-scroll::-webkit-scrollbar {
  height: 8px;
}
#gantt-scroll::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.15);
  border-radius: 999px;
}
#gantt-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>

<template>
  <div class="flex flex-col gap-5 pb-8">
    <!-- ============================================================ -->
    <!-- 1. 상단: 페이지 제목 + 현장 요약 + 주요 액션                       -->
    <!-- ============================================================ -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">전체 공정표</h1>
        <p class="mt-1 text-xs text-forena-500">
          {{ projectInfo.projectName }} &nbsp | &nbsp {{ projectInfo.startDate }} ~
          {{ projectInfo.endDate }}
        </p>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 2. 검증 경고                                                  -->
    <!-- ============================================================ -->
    <!-- <div v-if="validation.length"
         class="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/30 p-4 shadow-card">
      <div class="flex items-center gap-2 mb-2">
        <AlertTriangle class="h-4 w-4 text-amber-600" />
        <h2 class="text-sm font-bold text-amber-800">공정표 검증 경고 ({{ validation.length }}건)</h2>
      </div>
      <ul class="grid gap-1.5" :class="gridClass">
        <li v-for="(v, i) in validation" :key="i"
            class="flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs"
            :class="v.level === 'error' ? 'text-rose-700 ring-1 ring-rose-200'
                : v.level === 'warn' ? 'text-amber-800 ring-1 ring-amber-200'
                : 'text-sky-700 ring-1 ring-sky-200'">
          <span class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                :class="v.level === 'error' ? 'bg-rose-500' : v.level === 'warn' ? 'bg-amber-500' : 'bg-sky-500'"></span>
          {{ v.msg }}
        </li>
      </ul>
    </div>
    -->

    <!-- ============================================================ -->
    <!-- 0. 최초 등록 페이지 (등록된 공정표 없을 때)                       -->
    <!-- ============================================================ -->
    <div v-if="noDataYet" class="space-y-5">
      <!-- 안내 헤더 -->
      <div
        class="overflow-hidden rounded-2xl border border-flare-200 bg-gradient-to-br from-flare-50/70 to-white p-6 shadow-card"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-flare-500/10 ring-1 ring-flare-300"
          >
            <FilePlus2 class="h-6 w-6 text-flare-600" />
          </div>
          <div class="flex-1">
            <p class="text-[11px] font-bold uppercase tracking-wider text-flare-600">
              공정표 최초 세팅
            </p>
            <h2 class="mt-1 text-lg font-bold text-forena-900">아직 등록된 공정표가 없습니다</h2>
            <p class="mt-1.5 text-xs leading-relaxed text-forena-600">
              현장의 공정 일정을 시작하려면 마스터 공정표 · 마일스톤 공정표 · 공종별 시공계획서를
              차례로 등록해주세요. 업로드 후 AI 분석을 통해 공정 데이터가 생성되며 전체 공정표
              화면이 활성화됩니다.
            </p>

            <!-- 단계 흐름 -->
            <div class="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
              <div
                class="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 ring-1 ring-flare-200"
              >
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-flare-500 text-[10px] font-bold text-white"
                  >1</span
                >
                <span class="font-bold text-forena-800">문서 업로드</span>
              </div>
              <MoveRight class="h-3.5 w-3.5 text-flare-400" />
              <div
                class="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 ring-1 ring-forena-200"
              >
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-forena-300 text-[10px] font-bold text-white"
                  >2</span
                >
                <span class="font-bold text-forena-700">AI 분석</span>
              </div>
              <MoveRight class="h-3.5 w-3.5 text-flare-400" />
              <div
                class="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 ring-1 ring-forena-200"
              >
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-forena-300 text-[10px] font-bold text-white"
                  >3</span
                >
                <span class="font-bold text-forena-700">공정 데이터 생성</span>
              </div>
              <MoveRight class="h-3.5 w-3.5 text-flare-400" />
              <div
                class="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 ring-1 ring-forena-200"
              >
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-forena-300 text-[10px] font-bold text-white"
                  >4</span
                >
                <span class="font-bold text-forena-700">전체 공정표 확인</span>
              </div>
            </div>
          </div>
          <button
            @click="exitFirstSetup"
            class="shrink-0 rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-forena-600 hover:bg-forena-50"
          >
            건너뛰기
          </button>
        </div>
      </div>

      <!-- 3개 업로드 카드 -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(doc, key) in firstSetup"
          :key="key"
          class="overflow-hidden rounded-2xl border bg-white shadow-card transition"
          :class="doc.status === 'done' ? 'border-emerald-300' : 'border-forena-200'"
        >
          <!-- 카드 헤더 -->
          <div class="flex items-center justify-between border-b border-forena-100 px-4 py-3">
            <div class="flex items-center gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg"
                :class="doc.status === 'done' ? 'bg-emerald-50' : 'bg-flare-50'"
              >
                <FileText
                  class="h-4 w-4"
                  :class="doc.status === 'done' ? 'text-emerald-600' : 'text-flare-600'"
                />
              </div>
              <p class="text-sm font-bold text-forena-900">{{ doc.name }}</p>
            </div>
            <span
              class="rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
              :class="
                doc.status === 'done'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : doc.status === 'uploading'
                    ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : 'bg-slate-100 text-slate-500 ring-slate-200'
              "
            >
              {{
                doc.status === 'done'
                  ? '업로드 완료'
                  : doc.status === 'uploading'
                    ? '업로드 중...'
                    : '대기'
              }}
            </span>
          </div>

          <div class="p-4">
            <p class="text-[11px] leading-relaxed text-forena-500">{{ doc.desc }}</p>

            <!-- 드래그 앤 드롭 / 클릭 영역 -->
            <div
              v-if="!doc.file"
              class="mt-3 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-forena-200 bg-forena-50/30 px-4 py-6 text-center transition hover:border-flare-300 hover:bg-flare-50/30"
              @dragover.prevent
              @drop.prevent="handleSetupDrop(key, $event)"
            >
              <Upload class="h-6 w-6 text-forena-300" />
              <p class="text-[11px] font-semibold text-forena-600">파일을 끌어다 놓거나 클릭</p>
              <p class="text-[10px] text-forena-400">Excel · PDF · Word · HWP</p>
              <label
                class="cursor-pointer rounded-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-forena-900"
              >
                파일 선택
                <input
                  type="file"
                  class="sr-only"
                  accept=".xlsx,.xls,.pdf,.doc,.docx,.hwp"
                  @change="(e) => pickSetupFile(key, e)"
                />
              </label>
            </div>

            <!-- 업로드된 파일 -->
            <div
              v-else
              class="mt-3 flex items-center gap-2 rounded-lg border bg-white p-2.5"
              :class="doc.status === 'done' ? 'border-emerald-200' : 'border-forena-200'"
            >
              <FileText
                class="h-4 w-4 shrink-0"
                :class="doc.status === 'done' ? 'text-emerald-600' : 'text-flare-600'"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[11px] font-bold text-forena-800">{{ doc.file.name }}</p>
                <p class="text-[10px] tabular-nums text-forena-400">
                  {{ fmtFileSize(doc.file.size) }}
                </p>
              </div>
              <CheckCircle2
                v-if="doc.status === 'done'"
                class="h-4 w-4 shrink-0 text-emerald-500"
              />
              <RefreshCw
                v-else-if="doc.status === 'uploading'"
                class="h-4 w-4 shrink-0 animate-spin text-amber-500"
              />
              <button
                @click="clearSetupFile(key)"
                class="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 분석 실행 + 진행 상태 -->
      <div class="overflow-hidden rounded-2xl border border-forena-200 bg-white p-5 shadow-card">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-flare-50">
            <BrainCircuit class="h-5 w-5 text-flare-600" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-forena-900">AI 분석 실행</p>
            <p class="mt-0.5 text-[11px] text-forena-500">
              <span v-if="setupDone" class="font-bold text-emerald-600"
                >분석 완료 — 공정 데이터 생성됨. 전체 공정표로 이동합니다...</span
              >
              <span v-else-if="setupAnalyzing" class="font-bold text-flare-600"
                >AI가 문서를 분석하고 있습니다...</span
              >
              <span v-else-if="setupReady"
                >3개 문서 모두 업로드됨. AI 분석을 시작할 수 있습니다.</span
              >
              <span v-else>3개 문서를 모두 업로드하면 AI 분석을 시작할 수 있습니다.</span>
            </p>
          </div>
          <button
            @click="runSetupAnalysis"
            :disabled="!setupReady || setupAnalyzing || setupDone"
            class="inline-flex items-center gap-1.5 rounded-lg bg-flare-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-flare-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Sparkles class="h-3.5 w-3.5" />
            {{ setupAnalyzing ? '분석 중...' : setupDone ? '완료' : 'AI 분석 시작' }}
          </button>
        </div>

        <!-- 진행 단계 표시 -->
        <div v-if="setupAnalyzing || setupDone" class="mt-4 grid grid-cols-4 gap-2">
          <div
            v-for="(step, i) in ['문서 인식', '구조 추출', '관계 분석', '공정 생성']"
            :key="i"
            class="rounded-lg border bg-white p-2 text-center"
            :class="
              setupDone || (setupAnalyzing && i < 2)
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-forena-100'
            "
          >
            <p
              class="text-[10px] font-bold"
              :class="
                setupDone || (setupAnalyzing && i < 2) ? 'text-emerald-700' : 'text-forena-400'
              "
            >
              {{ step }}
            </p>
            <CheckCircle2
              v-if="setupDone || (setupAnalyzing && i < 2)"
              class="mx-auto mt-1 h-3.5 w-3.5 text-emerald-500"
            />
            <RefreshCw
              v-else-if="setupAnalyzing && i === 2"
              class="mx-auto mt-1 h-3.5 w-3.5 animate-spin text-amber-500"
            />
            <Clock v-else class="mx-auto mt-1 h-3.5 w-3.5 text-slate-300" />
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 3. 요약 카드 (5개 핵심 지표)                                    -->
    <!-- ============================================================ -->
    <div v-if="!noDataYet" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <!-- 계획 공정률 — 핵심 강조 -->
      <div
        class="rounded-2xl border border-forena-200 bg-gradient-to-br from-white to-forena-50/40 p-4 shadow-card"
      >
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">계획 공정률</p>
        <p class="mt-1.5 text-3xl font-bold tabular-nums text-forena-900">
          {{ projectInfo.plannedProgress }}<span class="text-base text-forena-500">%</span>
        </p>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-forena-100">
          <div
            class="h-full rounded-full bg-forena-700"
            :style="{ width: projectInfo.plannedProgress + '%' }"
          />
        </div>
      </div>
      <!-- 실제 공정률 — 핵심 강조 -->
      <div
        class="rounded-2xl border border-flare-200 bg-gradient-to-br from-white to-flare-50/40 p-4 shadow-card"
      >
        <p class="text-[11px] font-bold uppercase tracking-wider text-flare-600">실제 공정률</p>
        <p class="mt-1.5 text-3xl font-bold tabular-nums text-flare-700">
          {{ projectInfo.actualProgress }}<span class="text-base">%</span>
        </p>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-flare-100">
          <div
            class="h-full rounded-full bg-flare-500"
            :style="{ width: projectInfo.actualProgress + '%' }"
          />
        </div>
        <p
          class="mt-1 text-[10px] tabular-nums"
          :class="
            projectInfo.actualProgress < projectInfo.plannedProgress
              ? 'text-rose-600'
              : 'text-emerald-600'
          "
        >
          계획 대비 {{ projectInfo.actualProgress < projectInfo.plannedProgress ? '-' : '+'
          }}{{ Math.abs(projectInfo.actualProgress - projectInfo.plannedProgress) }}%
        </p>
      </div>
      <!-- 지연 위험 — 경고성 -->
      <div
        class="rounded-2xl border p-4 shadow-card"
        :class="
          validationCounts.delayed
            ? 'border-amber-200 bg-amber-50/40'
            : 'border-forena-100/90 bg-white/95'
        "
      >
        <p
          class="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
          :class="validationCounts.delayed ? 'text-amber-700' : 'text-forena-500'"
        >
          <AlertTriangle v-if="validationCounts.delayed" class="h-3 w-3" />
          지연 위험
        </p>
        <p
          class="mt-1.5 text-3xl font-bold tabular-nums"
          :class="validationCounts.delayed ? 'text-amber-700' : 'text-forena-900'"
        >
          {{ validationCounts.delayed
          }}<span class="text-sm font-normal text-slate-400 ml-1">건</span>
        </p>
        <p class="mt-1 text-[10px] text-forena-400">전체 {{ aiTasks.length }}건</p>
      </div>
      <!-- 변경 요청 대기 — 경고성 -->
      <div
        class="rounded-2xl border p-4 shadow-card"
        :class="
          validationCounts.pendingChanges
            ? 'border-flare-200 bg-flare-50/40'
            : 'border-forena-100/90 bg-white/95'
        "
      >
        <p
          class="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
          :class="validationCounts.pendingChanges ? 'text-flare-700' : 'text-forena-500'"
        >
          <GitBranch v-if="validationCounts.pendingChanges" class="h-3 w-3" />
          변경 요청 대기
        </p>
        <p
          class="mt-1.5 text-3xl font-bold tabular-nums"
          :class="validationCounts.pendingChanges ? 'text-flare-700' : 'text-forena-900'"
        >
          {{ validationCounts.pendingChanges
          }}<span class="text-sm font-normal text-slate-400 ml-1">건</span>
        </p>
      </div>
      <!-- 보할 합계 -->
      <div
        class="rounded-2xl border p-4 shadow-card"
        :class="
          validationCounts.weightSum === 100
            ? 'border-forena-100/90 bg-white/95'
            : 'border-amber-200 bg-amber-50/40'
        "
      >
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">보할 합계</p>
        <p
          class="mt-1.5 text-3xl font-bold tabular-nums"
          :class="validationCounts.weightSum === 100 ? 'text-emerald-600' : 'text-amber-700'"
        >
          {{ validationCounts.weightSum }}<span class="text-base">%</span>
        </p>
        <p
          class="mt-1 text-[10px]"
          :class="validationCounts.weightSum === 100 ? 'text-emerald-500' : 'text-amber-500'"
        >
          {{ validationCounts.weightSum === 100 ? '정상 (100%)' : '100% 권장' }}
        </p>
      </div>
    </div>
    <!-- /KPI grid wrapper -->

    <!-- ============================================================ -->
    <!-- 4. 문서 등록 모달                                              -->
    <!-- ============================================================ -->
    <div
      v-if="showUploadSection"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="showUploadSection = false"
    >
      <div class="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <!-- 헤더 -->
        <div class="flex items-center gap-2 border-b border-forena-100 px-6 py-4">
          <FileText class="h-4 w-4 text-flare-600" />
          <h3 class="text-sm font-bold text-forena-900">문서 등록</h3>
          <span class="ml-1 text-[11px] text-forena-400"
            >기준 공정표를 만들 원본 문서를 업로드하고 AI 분석을 실행합니다.</span
          >
          <button
            @click="showUploadSection = false"
            class="ml-auto rounded-lg p-1 hover:bg-forena-50"
          >
            <X class="h-4 w-4 text-slate-400 hover:text-forena-700" />
          </button>
        </div>

        <!-- 본문 -->
        <div class="grid gap-4 p-6 lg:grid-cols-12">
          <!-- 업로드 폼 -->
          <div class="lg:col-span-5 space-y-3">
            <div
              class="rounded-xl border-2 border-dashed border-forena-200 bg-forena-50/40 p-5 text-center"
            >
              <Upload class="mx-auto h-8 w-8 text-forena-300" />
              <p class="mt-2 text-sm font-semibold text-forena-700">
                파일을 끌어 놓거나 클릭하여 업로드
              </p>
              <p class="mt-0.5 text-[10px] text-forena-400">Excel · PDF · Image · Word · HWP</p>
              <label
                class="mt-3 inline-block cursor-pointer rounded-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-forena-900"
              >
                파일 선택
                <input
                  type="file"
                  class="sr-only"
                  accept=".xlsx,.xls,.pdf,.png,.jpg,.jpeg,.doc,.docx,.hwp"
                  @change="onUploadFile"
                />
              </label>
              <p v-if="uploadForm.fileName" class="mt-2 text-xs font-bold text-flare-700">
                📎 {{ uploadForm.fileName }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] font-bold uppercase text-forena-400">문서 유형</label>
                <select
                  v-model="uploadForm.docType"
                  class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400"
                >
                  <option>마스터 공정표</option>
                  <option>마일스톤 공정표</option>
                  <option>공종별 시공계획서</option>
                  <option>기타 공정 자료</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold uppercase text-forena-400">문서 설명</label>
                <input
                  v-model="uploadForm.desc"
                  type="text"
                  placeholder="간단 설명 (선택)"
                  class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs text-forena-800 outline-none focus:border-flare-400"
                />
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                @click="runAiAnalysis"
                :disabled="aiAnalyzing"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-flare-600 px-3 py-2 text-xs font-bold text-white hover:bg-flare-700 disabled:opacity-60"
              >
                <BrainCircuit class="h-3.5 w-3.5" />
                {{ aiAnalyzing ? '분석 중…' : 'AI 분석 실행' }}
              </button>
              <button
                @click="loadExistingDoc"
                class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50"
              >
                기존 문서 불러오기
              </button>
              <button
                @click="manualInput"
                class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50"
              >
                직접 입력
              </button>
            </div>
          </div>

          <!-- 문서 이력 -->
          <div class="lg:col-span-7">
            <p class="mb-2 text-[11px] font-bold text-forena-500">
              업로드 문서 ({{ uploadedDocs.length }})
            </p>
            <div class="overflow-hidden rounded-xl border border-forena-100">
              <table class="w-full text-xs">
                <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
                  <tr>
                    <th class="px-3 py-2 text-left">문서명</th>
                    <th class="px-3 py-2 text-left">유형</th>
                    <th class="px-3 py-2 text-left">업로드</th>
                    <th class="px-3 py-2 text-left">상태</th>
                    <th class="px-3 py-2 text-right">액션</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-forena-50">
                  <tr v-for="d in uploadedDocs" :key="d.id" class="hover:bg-forena-50/40">
                    <td class="px-3 py-2 font-semibold text-forena-800">{{ d.name }}</td>
                    <td class="px-3 py-2 text-forena-600">{{ d.type }}</td>
                    <td class="px-3 py-2 tabular-nums text-slate-500">{{ d.uploadedAt }}</td>
                    <td class="px-3 py-2">
                      <span
                        class="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        :class="
                          d.reflectStatus === '반영 완료'
                            ? 'bg-emerald-50 text-emerald-700'
                            : d.reflectStatus === '검토 중'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                        "
                      >
                        {{ d.reflectStatus }}
                      </span>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          @click="viewDoc(d)"
                          title="원본 보기"
                          class="rounded p-1 text-forena-500 hover:bg-forena-100"
                        >
                          <Eye class="h-3.5 w-3.5" />
                        </button>
                        <button
                          @click="downloadDoc(d)"
                          title="다운로드"
                          class="rounded p-1 text-forena-500 hover:bg-forena-100"
                        >
                          <Download class="h-3.5 w-3.5" />
                        </button>
                        <button
                          @click="reanalyze(d.id)"
                          title="재분석"
                          class="rounded p-1 text-flare-600 hover:bg-flare-50"
                        >
                          <RefreshCw class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 푸터 -->
        <div class="flex justify-end gap-2 border-t border-forena-100 px-6 py-4">
          <button
            @click="showUploadSection = false"
            class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 7. 간트차트 + 작업 상세 패널 (좌/우)                            -->
    <!-- ============================================================ -->
    <div v-if="!noDataYet" class="flex gap-4 transition-all duration-300">
      <!-- 간트차트 -->
      <div
        class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card transition-all duration-300"
        :class="selectedTask ? 'flex-1 min-w-0' : 'w-full'"
      >
        <!-- 차트 헤더: 제목 + 우상단 버튼군 -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-forena-100 px-5 py-3"
        >
          <div class="flex items-center gap-2">
            <CalendarRange class="h-4 w-4 text-flare-600" />
            <h2 class="text-sm font-bold text-forena-900">전체 간트차트</h2>
            <span
              class="rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-600 tabular-nums"
            >
              {{ aiTasks.length }}공정 · CP {{ aiTasks.filter((t) => t.isCritical).length }}
            </span>
          </div>

          <!-- 우상단: 토글 + 줌 + 오늘 (아이콘 위주, 작은 토글) -->
          <div class="flex items-center gap-1.5">
            <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
              <button
                @click="onlyCp = !onlyCp"
                :title="onlyCp ? 'CP만 표시 ON' : 'CP만 표시 OFF'"
                class="px-2 py-1 text-[10px] font-bold transition"
                :class="onlyCp ? 'bg-rose-50 text-rose-700' : 'text-forena-600 hover:bg-forena-50'"
              >
                CP
              </button>
              <button
                @click="toggleAllGroups"
                :title="onlyMilestone ? '마일스톤만' : '마일스톤 토글'"
                class="border-l border-forena-200 px-2 py-1 text-[10px] font-bold transition"
                :class="
                  onlyMilestone
                    ? 'bg-flare-50 text-flare-700'
                    : 'text-forena-600 hover:bg-forena-50'
                "
              >
                <Diamond class="inline h-3 w-3" />
              </button>
              <button
                @click="highlightDelayed = !highlightDelayed"
                :title="highlightDelayed ? '지연 강조 ON' : '지연 강조 OFF'"
                class="border-l border-forena-200 px-2 py-1 text-[10px] font-bold transition"
                :class="
                  highlightDelayed
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-forena-600 hover:bg-forena-50'
                "
              >
                <AlertTriangle class="inline h-3 w-3" />
              </button>
            </div>

            <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
              <button @click="zoomOut" class="p-1.5 hover:bg-forena-50" title="축소">
                <ZoomOut class="h-3.5 w-3.5 text-forena-600" />
              </button>
              <span
                class="border-x border-forena-200 px-2 text-[10px] font-bold tabular-nums text-forena-600 leading-[28px]"
                >{{ ganttZoom }}x</span
              >
              <button @click="zoomIn" class="p-1.5 hover:bg-forena-50" title="확대">
                <ZoomIn class="h-3.5 w-3.5 text-forena-600" />
              </button>
            </div>

            <button
              @click="scrollToToday"
              class="inline-flex items-center gap-1 rounded-lg border border-flare-200 bg-flare-50 px-2 py-1 text-[10px] font-bold text-flare-700 hover:bg-flare-100"
            >
              <Locate class="h-3 w-3" /> 오늘
            </button>
          </div>
        </div>

        <!-- 마일스톤 요약 (가로 스크롤, 한 줄 유지) -->
        <div class="border-b border-forena-100 bg-forena-50/30 px-5 py-2.5">
          <div class="flex items-center gap-2">
            <Diamond class="h-3.5 w-3.5 shrink-0 text-flare-600" />
            <span class="shrink-0 pr-2 text-[11px] font-bold text-forena-700">마일스톤</span>
            <div class="ms-row flex flex-1 items-center gap-1.5">
              <button
                v-for="m in milestones"
                :key="m.id"
                @click="toggleMilestoneHighlight(m.id)"
                class="group flex shrink-0 items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-[10px] transition hover:border-flare-300"
                :class="
                  highlightedMilestoneId === m.id
                    ? 'border-flare-400 bg-flare-50 ring-2 ring-flare-200'
                    : 'border-forena-100'
                "
                :title="`${m.name} · ${m.date} · ${m.relatedTask} · ${m.status}`"
              >
                <!-- 다이아몬드 SVG -->
                <svg
                  class="h-3 w-3"
                  :class="isMilestoneSoon(m) ? 'ms-pulse' : ''"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M6 1 L11 6 L6 11 L1 6 Z"
                    :fill="milestoneFill(m)"
                    :stroke="milestoneStroke(m)"
                    stroke-width="1"
                  />
                </svg>
                <span class="font-bold text-forena-700">{{ m.name }}</span>
                <span class="tabular-nums text-slate-400">{{ m.date.slice(5) }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 간트차트 본체 -->
        <div class="flex">
          <div class="flex min-w-full">
            <!-- 좌측: 작업명 sticky -->
            <div class="sticky left-0 z-10 w-44 shrink-0 border-r border-forena-200 bg-white">
              <div
                class="flex h-9 items-center border-b border-forena-200 bg-forena-50/60 px-4 text-[10px] font-bold text-forena-500"
              >
                공정명 / 공종
              </div>
              <template v-for="(grp, gi) in groupedTasks" :key="grp.group">
                <!-- 공종 그룹 헤더 -->
                <div
                  class="flex h-9 cursor-pointer items-center justify-between border-b border-forena-200 bg-gradient-to-r from-forena-100 to-forena-50 px-3 text-[11px] font-bold text-forena-800 transition hover:from-flare-50 hover:to-flare-50/30"
                  @click="groupOpen[grp.group] = !groupOpen[grp.group]"
                >
                  <div class="flex items-center gap-1.5">
                    <ChevronDown v-if="groupOpen[grp.group]" class="h-3.5 w-3.5 text-forena-600" />
                    <ChevronRight v-else class="h-3.5 w-3.5 text-forena-600" />
                    <Layers class="h-3 w-3 text-flare-600" />
                    <span>{{ grp.group }}</span>
                  </div>
                  <span
                    class="rounded bg-white/70 px-1.5 py-0.5 text-[9px] tabular-nums text-forena-500"
                    >{{ grp.items.length }}</span
                  >
                </div>
                <template v-if="groupOpen[grp.group]">
                  <div
                    v-for="t in grp.items"
                    :key="t.id"
                    class="flex h-12 cursor-pointer flex-col justify-center border-b border-forena-50 px-4 transition hover:bg-forena-50/60"
                    :class="
                      selectedTaskId === t.id ? 'bg-flare-50/60 border-l-2 border-l-flare-500' : ''
                    "
                    @click="selectTask(t.id)"
                  >
                    <div class="flex items-center gap-1">
                      <span
                        v-if="t.isCritical"
                        class="rounded bg-rose-100 px-1 py-0.5 text-[8px] font-bold text-rose-700"
                        >CP</span
                      >
                      <p class="truncate text-xs font-semibold text-forena-800">{{ t.name }}</p>
                    </div>
                    <p class="truncate text-[10px] text-slate-400">
                      {{ t.sub }} · 보할 {{ t.weight }}%
                    </p>
                  </div>
                </template>
              </template>
            </div>

            <!-- 우측: 차트 -->
            <div id="gantt-scroll" class="overflow-x-auto flex-1" @wheel.prevent="onGanttWheel">
              <div class="relative" :style="{ width: ganttPxWidth + 'px', minWidth: '100%' }">
                <!-- 헤더 -->
                <div
                  class="sticky top-0 z-[10] flex h-9 border-b border-forena-200 bg-white shadow-[0_1px_0_0_rgb(226,232,240)]"
                >
                  <div
                    v-for="(h, i) in ganttHeader"
                    :key="i"
                    class="flex items-center justify-center border-r border-forena-100 text-[10px] font-bold text-forena-500"
                    :style="{ width: h.days * cellW + 'px' }"
                  >
                    {{ h.label }}
                  </div>
                </div>

                <!-- 본문 -->
                <div class="relative">
                  <!-- 오늘 라인 -->
                  <div
                    v-if="todayLineStyle"
                    class="pointer-events-none absolute top-0 z-[3] h-full w-px bg-flare-500/70"
                    :style="todayLineStyle"
                  >
                    <div
                      class="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-flare-500 px-1 text-[8px] font-bold text-white"
                    >
                      오늘
                    </div>
                  </div>

                  <!-- 행: 그룹 헤더 라인 (해당 그룹의 마일스톤만 표시) + 작업 행 -->
                  <template v-for="(grp, gi) in groupedTasks" :key="`grow-${grp.group}`">
                    <!-- 그룹 헤더 라인 -->
                    <div
                      class="relative h-9 border-b border-forena-200 bg-gradient-to-r from-forena-100 to-forena-50"
                    >
                      <!-- 이 그룹에 속한 마일스톤 -->
                      <div
                        v-for="m in milestonesOfGroup(grp.group)"
                        :key="`gms-${m.id}`"
                        class="ms-marker pointer-events-auto absolute top-1/2 z-[4] -translate-y-1/2"
                        :class="[
                          isMilestoneSoon(m) ? 'ms-pulse' : '',
                          highlightedMilestoneId === m.id ? 'ms-highlight' : '',
                        ]"
                        :style="{ left: dayOffset(m.date) * cellW + cellW / 2 - 8 + 'px' }"
                        :title="`${m.name} · ${m.date} · ${m.relatedTask} · ${m.status}`"
                        @click="toggleMilestoneHighlight(m.id)"
                      >
                        <svg class="h-4 w-4 cursor-pointer drop-shadow-sm" viewBox="0 0 16 16">
                          <path
                            d="M8 1 L15 8 L8 15 L1 8 Z"
                            :fill="milestoneFill(m)"
                            :stroke="milestoneStroke(m)"
                            stroke-width="1.5"
                          />
                        </svg>
                      </div>
                    </div>

                    <template v-if="groupOpen[grp.group]">
                      <div
                        v-for="t in grp.items"
                        :key="`row-${t.id}`"
                        class="relative flex h-12 border-b border-forena-50"
                        :class="selectedTaskId === t.id ? 'bg-flare-50/40' : ''"
                        @click="selectedTaskId = t.id"
                      >
                        <!-- 라인: 계획 (파란) -->
                        <div
                          v-if="barStyle(t.start, t.end)"
                          class="absolute z-[2] flex items-center"
                          :style="{ ...barStyle(t.start, t.end), top: '14px', height: '4px' }"
                          :title="`계획: ${t.start} ~ ${t.end}`"
                        >
                          <span
                            class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                            :class="t.isCritical ? 'h-3 w-3' : ''"
                          ></span>
                          <span
                            class="absolute -right-[3px] h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                            :class="t.isCritical ? 'h-3 w-3' : ''"
                          ></span>
                          <span
                            class="h-1 w-full rounded-full"
                            :class="t.isCritical ? 'bg-blue-700 h-1.5' : 'bg-blue-600'"
                          ></span>
                        </div>
                        <!-- 라인: 연간 실행/진행 (WorkPlan 통합 빨간선) -->
                        <template v-if="workPlanProgress(t)">
                          <!-- 전체 계획 구간: 연한 빨강 (배경) -->
                          <div
                            v-if="
                              barStyle(workPlanProgress(t).planStart, workPlanProgress(t).planEnd)
                            "
                            class="absolute z-[2] flex items-center"
                            :style="{
                              ...barStyle(
                                workPlanProgress(t).planStart,
                                workPlanProgress(t).planEnd,
                              ),
                              top: '28px',
                              height: '4px',
                            }"
                            :title="`연간 계획: ${workPlanProgress(t).planStart} ~ ${workPlanProgress(t).planEnd}`"
                          >
                            <span
                              class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                            ></span>
                            <span class="h-1 w-full rounded-full bg-rose-200"></span>
                            <span
                              class="absolute top-1/2 z-[3] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-rose-500 ring-2 ring-white"
                              :style="workPlanProgressDotStyle(t)"
                            ></span>
                          </div>

                          <!-- 진행된 구간: 진한 빨강 (오버레이, 점 없음) -->
                          <div
                            v-if="
                              progressBarRange(t) &&
                              barStyle(progressBarRange(t).start, progressBarRange(t).end)
                            "
                            class="absolute z-[3] flex items-center"
                            :style="{
                              ...barStyle(progressBarRange(t).start, progressBarRange(t).end),
                              top: '28px',
                              height: '4px',
                            }"
                            :title="`진행됨: ${progressBarRange(t).start} ~ ${progressBarRange(t).end}`"
                          >
                            <span class="h-1 w-full rounded-full bg-rose-500"></span>
                          </div>
                        </template>
                      </div>
                    </template>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 범례 (다이아몬드 아이콘 통일) -->
        <div
          class="flex flex-wrap items-center gap-3 border-t border-forena-100 bg-forena-50/40 px-5 py-2 text-[10px] text-slate-600"
        >
          <span class="inline-flex items-center gap-1.5"
            ><span class="h-1 w-5 rounded-full bg-blue-600" />계획선</span
          >
          <span class="inline-flex items-center gap-1.5"
            ><span class="h-1 w-5 rounded-full bg-rose-500" />실제 진행</span
          >
          <span class="inline-flex items-center gap-1.5"
            ><span class="h-1 w-5 rounded-full bg-rose-200" />진행 예정</span
          >
          <span class="inline-flex items-center gap-1.5">
            <svg class="h-3 w-3" viewBox="0 0 12 12">
              <path d="M6 1 L11 6 L6 11 L1 6 Z" fill="#10b981" stroke="#047857" stroke-width="1" />
            </svg>
            완료
          </span>
          <span class="inline-flex items-center gap-1.5">
            <svg class="h-3 w-3" viewBox="0 0 12 12">
              <path d="M6 1 L11 6 L6 11 L1 6 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1" />
            </svg>
            예정
          </span>
          <span class="inline-flex items-center gap-1.5">
            <svg class="h-3 w-3" viewBox="0 0 12 12">
              <path d="M6 1 L11 6 L6 11 L1 6 Z" fill="#f43f5e" stroke="#be123c" stroke-width="1" />
            </svg>
            지연 위험
          </span>
          <span class="inline-flex items-center gap-1.5"
            ><span class="h-3 w-px bg-flare-500" /> 오늘</span
          >
          <span class="ml-auto text-forena-400">스크롤하여 전체 보기</span>
        </div>
      </div>

      <!-- 작업 상세 패널 -->
      <transition name="slide-detail">
        <div
          v-if="selectedTask"
          class="w-80 shrink-0 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card"
        >
          <div class="flex items-center justify-between border-b border-forena-100 px-4 py-3">
            <h2 class="text-sm font-bold text-forena-900">작업 상세</h2>
            <button @click="selectedTaskId = null" class="rounded-lg p-1 hover:bg-forena-50">
              <X class="h-4 w-4 text-slate-400 hover:text-forena-700" />
            </button>
          </div>
          <div class="overflow-y-auto" style="max-height: calc(100vh - 200px)">
            <div class="space-y-4 p-4">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <p class="text-base font-bold text-forena-900">{{ selectedTask.name }}</p>
                  <span
                    v-if="selectedTask.isCritical"
                    class="shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700"
                    >CP</span
                  >
                </div>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ selectedTask.group }} · {{ selectedTask.sub }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-lg bg-forena-50/40 p-2">
                  <p class="text-[10px] font-bold text-forena-400">시작일</p>
                  <p class="font-semibold tabular-nums text-forena-800">{{ selectedTask.start }}</p>
                </div>
                <div class="rounded-lg bg-forena-50/40 p-2">
                  <p class="text-[10px] font-bold text-forena-400">종료일</p>
                  <p class="font-semibold tabular-nums text-forena-800">{{ selectedTask.end }}</p>
                </div>
                <div class="rounded-lg bg-forena-50/40 p-2">
                  <p class="text-[10px] font-bold text-forena-400">기간</p>
                  <p class="font-semibold tabular-nums text-forena-800">
                    {{ selectedTask.durDays }}일
                  </p>
                </div>
                <div class="rounded-lg bg-forena-50/40 p-2">
                  <p class="text-[10px] font-bold text-forena-400">보할</p>
                  <p class="font-semibold tabular-nums text-forena-800">
                    {{ selectedTask.weight }}%
                  </p>
                </div>
              </div>

              <!-- 선행/후속 -->
              <div>
                <p class="text-[10px] font-bold uppercase text-forena-400 mb-1.5">선행 / 후속</p>
                <div class="flex items-center gap-2 text-xs">
                  <span class="flex-1 truncate rounded bg-slate-50 px-2 py-1.5 text-slate-700">{{
                    selectedTask.prev || '없음'
                  }}</span>
                  <ArrowRight class="h-3.5 w-3.5 shrink-0 text-forena-400" />
                  <span class="flex-1 truncate rounded bg-flare-50/60 px-2 py-1.5 text-flare-700">{{
                    selectedTask.next || '없음'
                  }}</span>
                </div>
              </div>

              <!-- 인원/장비 -->
              <div class="rounded-lg border border-forena-100 p-3 text-xs">
                <p class="text-[10px] font-bold uppercase text-forena-400 mb-1.5">
                  담당 / 인원 / 장비
                </p>
                <div class="flex items-center gap-1.5 mb-1">
                  <Users class="h-3 w-3 text-forena-500" />{{ selectedTask.responsible }} ·
                  {{ selectedTask.requiredCount }}명
                </div>
                <div class="flex items-center gap-1.5 mb-1">
                  <MapPin class="h-3 w-3 text-forena-500" />{{ selectedTask.location }}
                </div>
                <div v-if="selectedTask.equipment.length" class="flex items-center gap-1.5">
                  <Wrench class="h-3 w-3 text-forena-500" />{{ selectedTask.equipment.join(', ') }}
                </div>
              </div>

              <!-- AI 신뢰도 / 검토 -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-lg border border-forena-100 p-2.5">
                  <p class="text-[10px] font-bold text-forena-400 mb-1">AI 신뢰도</p>
                  <p
                    class="text-lg font-bold tabular-nums"
                    :class="confidenceClass(selectedTask.confidence)"
                  >
                    {{ selectedTask.confidence }}%
                  </p>
                </div>
                <div class="rounded-lg border border-forena-100 p-2.5">
                  <p class="text-[10px] font-bold text-forena-400 mb-1">검토 상태</p>
                  <span
                    class="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                    :class="reviewStatusClass(selectedTask.reviewStatus)"
                    >{{ selectedTask.reviewStatus }}</span
                  >
                </div>
              </div>

              <!-- 출처 문서 -->
              <div
                v-if="selectedTask.sourceDocId"
                class="rounded-lg border border-flare-100 bg-flare-50/30 p-3"
              >
                <p class="text-[10px] font-bold uppercase text-flare-700 mb-1.5">출처 문서</p>
                <p class="text-xs font-semibold text-forena-800">
                  {{
                    uploadedDocs.find((d) => d.id === selectedTask.sourceDocId)?.name ||
                    '연결된 문서 없음'
                  }}
                </p>
                <div class="mt-2 flex gap-1.5">
                  <button
                    class="rounded border border-forena-200 bg-white px-2 py-0.5 text-[10px] font-bold text-forena-600 hover:bg-forena-50"
                  >
                    <Eye class="inline h-2.5 w-2.5 mr-0.5" />보기
                  </button>
                  <button
                    class="rounded border border-forena-200 bg-white px-2 py-0.5 text-[10px] font-bold text-forena-600 hover:bg-forena-50"
                  >
                    <Download class="inline h-2.5 w-2.5 mr-0.5" />다운로드
                  </button>
                  <button
                    class="rounded border border-flare-200 bg-flare-50 px-2 py-0.5 text-[10px] font-bold text-flare-700 hover:bg-flare-100"
                  >
                    <RefreshCw class="inline h-2.5 w-2.5 mr-0.5" />재분석
                  </button>
                </div>
              </div>

              <!-- 메모 -->
              <div
                v-if="selectedTask.memo"
                class="rounded-lg bg-amber-50/40 p-2.5 text-[11px] text-amber-800 ring-1 ring-amber-100"
              >
                <strong class="block text-[10px] uppercase">메모</strong>
                {{ selectedTask.memo }}
              </div>
            </div>
            <!-- /space-y-4 p-4 -->
          </div>
          <!-- /overflow-y-auto -->
        </div>
        <!-- /w-80 shrink-0 -->
      </transition>
    </div>
    <!-- /flex gap-4 -->

    <!-- ============================================================ -->
    <!-- 5. AI 분석 결과 — 검토 테이블 모달                             -->
    <!-- ============================================================ -->
    <div
      v-if="aiAnalysisModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="aiAnalysisModalOpen = false"
    >
      <div
        class="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style="max-height: 90vh"
      >
        <!-- 모달 헤더 -->
        <div class="flex flex-wrap items-center gap-3 border-b border-forena-100 px-6 py-4">
          <BrainCircuit class="h-4 w-4 text-flare-600 shrink-0" />
          <h3 class="text-sm font-bold text-forena-900">AI 분석 결과 — 검토 테이블</h3>
          <span class="rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-600"
            >{{ filteredTasks.length }}건</span
          >
          <span
            v-if="isConfirmed"
            class="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200"
            >확정 — 직접 수정 불가</span
          >

          <!-- 필터 영역 -->
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <div class="relative">
              <Search
                class="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-forena-400"
              />
              <input
                v-model="searchKey"
                type="text"
                placeholder="작업/공종 검색"
                class="w-40 rounded-lg border border-forena-200 bg-white pl-7 pr-2 py-1.5 text-xs outline-none focus:border-flare-400"
              />
            </div>
            <select
              v-model="filterGroup"
              class="rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none"
            >
              <option value="">전체 공종</option>
              <option v-for="g in [...new Set(aiTasks.map((t) => t.group))]" :key="g">
                {{ g }}
              </option>
            </select>
            <select
              v-model="filterReview"
              class="rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none"
            >
              <option value="">전체 상태</option>
              <option>미검토</option>
              <option>검토 중</option>
              <option>승인</option>
              <option>수정 요청</option>
              <option>제외</option>
            </select>
            <select
              v-model="filterCp"
              class="rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none"
            >
              <option value="">CP 전체</option>
              <option value="cp">CP만</option>
              <option value="noncp">CP 제외</option>
            </select>
            <div v-if="canEdit && !isConfirmed" class="flex gap-1">
              <button
                @click="bulkApprove"
                class="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
              >
                일괄 승인
              </button>
              <button
                @click="bulkExclude"
                class="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
              >
                일괄 제외
              </button>
            </div>
            <button
              @click="aiAnalysisModalOpen = false"
              class="ml-1 rounded-lg p-1 hover:bg-forena-50"
            >
              <X class="h-4 w-4 text-slate-400 hover:text-forena-700" />
            </button>
          </div>
        </div>

        <!-- 테이블 본문 (스크롤) -->
        <div class="overflow-auto flex-1">
          <table class="w-full min-w-[1100px] text-xs">
            <thead
              class="sticky top-0 bg-forena-50/95 text-[10px] font-bold uppercase text-forena-500 shadow-sm"
            >
              <tr>
                <th class="w-8 px-3 py-2.5"><input type="checkbox" disabled /></th>
                <th class="px-3 py-2.5 text-center">공종</th>
                <th class="px-3 py-2.5 text-center">작업명</th>
                <th class="px-3 py-2.5 text-center">시작일</th>
                <th class="px-3 py-2.5 text-center">종료일</th>
                <th class="px-3 py-2.5 text-center">기간</th>
                <th class="px-3 py-2.5 text-center">선행</th>
                <th class="px-3 py-2.5 text-center">후속</th>
                <th class="px-3 py-2.5 text-center">CP</th>
                <th class="px-3 py-2.5 text-center">보할</th>
                <th class="px-3 py-2.5 text-center">신뢰도</th>
                <th class="px-3 py-2.5 text-center">상태</th>
                <th class="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-forena-50">
              <tr
                v-for="t in filteredTasks"
                :key="t.id"
                class="cursor-pointer transition hover:bg-forena-50/40"
                :class="selectedTaskId === t.id ? 'bg-flare-50/50' : ''"
              >
                <td class="px-5 py-2" @click.stop>
                  <input type="checkbox" v-model="t.checked" :disabled="isConfirmed" />
                </td>
                <td class="px-3 py-2 text-center">
                  <p class="font-semibold text-forena-700">{{ t.group }}</p>
                  <p class="text-[10px] text-slate-400">{{ t.sub }}</p>
                </td>
                <td class="px-3 py-2 text-center font-semibold text-forena-900">{{ t.name }}</td>
                <td class="px-3 py-2 text-center tabular-nums text-slate-600">{{ t.start }}</td>
                <td class="px-3 py-2 text-center tabular-nums text-slate-600">{{ t.end }}</td>
                <td class="px-3 py-2 text-center tabular-nums text-slate-500">{{ t.durDays }}일</td>
                <td class="px-3 py-2 text-center text-[11px] text-slate-500">
                  {{ t.prev || '-' }}
                </td>
                <td class="px-3 py-2 text-center text-[11px] text-slate-500">
                  {{ t.next || '-' }}
                </td>
                <td class="px-3 py-2 text-center">
                  <span
                    v-if="t.isCritical"
                    class="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700"
                    >CP</span
                  >
                  <span v-else class="text-slate-300">—</span>
                </td>
                <td class="px-3 py-2 text-center tabular-nums font-bold text-forena-700">
                  {{ t.weight }}%
                </td>
                <td
                  class="px-3 py-2 text-center tabular-nums font-bold"
                  :class="confidenceClass(t.confidence)"
                >
                  {{ t.confidence }}%
                </td>
                <td class="px-3 py-2 flex items-center justify-center">
                  <span
                    class="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                    :class="reviewStatusClass(t.reviewStatus)"
                    >{{ t.reviewStatus }}</span
                  >
                </td>
              </tr>
              <tr v-if="!filteredTasks.length">
                <td colspan="13" class="px-3 py-12 text-center text-sm text-slate-400">
                  조회된 작업이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 모달 푸터 -->
        <div class="flex items-center justify-between border-t border-forena-100 px-6 py-3">
          <p class="text-[11px] text-forena-400">
            전체 {{ aiTasks.length }}건 중 {{ filteredTasks.length }}건 표시
          </p>
          <button
            @click="aiAnalysisModalOpen = false"
            class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>



    <!-- ============================================================ -->
    <!-- 모달: 기준 공정표 확정 — 검증 미리보기                          -->
    <!-- ============================================================ -->
    <div
      v-if="confirmModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="confirmModalOpen = false"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center gap-2 border-b border-forena-100 px-5 py-3">
          <ShieldCheck class="h-4 w-4 text-emerald-600" />
          <h3 class="text-sm font-bold text-forena-900">기준 공정표 확정</h3>
        </div>
        <div class="space-y-3 p-5">
          <p class="text-xs text-slate-600">
            기준 공정표를 확정하면 이후 수정은 변경 요청을 통해서만 가능합니다.
          </p>

          <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3">
            <p class="mb-2 text-[10px] font-bold uppercase text-forena-500">확정 전 검증</p>
            <ul class="space-y-1.5 text-xs">
              <li v-for="(v, i) in validation" :key="i" class="flex items-start gap-2">
                <span
                  class="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  :class="
                    v.level === 'error'
                      ? 'bg-rose-500'
                      : v.level === 'warn'
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                  "
                ></span>
                <span
                  :class="
                    v.level === 'error'
                      ? 'text-rose-700'
                      : v.level === 'warn'
                        ? 'text-amber-800'
                        : 'text-sky-700'
                  "
                  >{{ v.msg }}</span
                >
              </li>
              <li v-if="!validation.length" class="text-emerald-700">
                <CheckCircle2 class="inline h-3.5 w-3.5 mr-1" />검증 항목 모두 통과
              </li>
            </ul>
          </div>

          <div
            class="rounded-lg bg-amber-50/40 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-100"
          >
            확정 후에는 본 페이지의 테이블/간트차트에서 직접 수정이 불가능하며, 변경 요청 절차를
            따라야 합니다.
          </div>
        </div>
        <div class="flex justify-end gap-2 border-t border-forena-100 px-5 py-3">
          <button
            @click="confirmModalOpen = false"
            class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50"
          >
            취소
          </button>
          <button
            @click="confirmBaseline"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <ShieldCheck class="inline h-3.5 w-3.5 mr-1" />확정
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 변경 요청 폼 (확정 후 작업 수정 시)                        -->
    <!-- ============================================================ -->
    <div
      v-if="changeRequestFormOpen && newChangeReq"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="changeRequestFormOpen = false"
    >
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
          <h3 class="text-sm font-bold text-forena-900">변경 요청 — {{ newChangeReq.taskName }}</h3>
          <button @click="changeRequestFormOpen = false">
            <X class="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3 p-5">
          <div class="col-span-2">
            <label class="text-[10px] font-bold uppercase text-forena-400">변경 유형</label>
            <select
              v-model="newChangeReq.changeType"
              class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400"
            >
              <option>시작일 변경</option>
              <option>종료일 변경</option>
              <option>기간 연장</option>
              <option>기간 단축</option>
              <option>작업명 변경</option>
              <option>CP 변경</option>
              <option>보할 변경</option>
              <option>선행/후속 작업 변경</option>
            </select>
          </div>

          <div class="col-span-2 grid grid-cols-2 gap-3 rounded-xl bg-forena-50/40 p-3">
            <div class="col-span-2 text-[10px] font-bold uppercase text-forena-500">
              변경 전 → 변경 후
            </div>
            <div>
              <label class="text-[10px] text-forena-400">기존 시작일</label>
              <input
                :value="newChangeReq.oldStart"
                disabled
                class="mt-1 w-full rounded border border-forena-200 bg-slate-50 px-2 py-1 text-xs text-slate-500"
              />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">새 시작일</label>
              <input
                v-model="newChangeReq.newStart"
                type="date"
                class="mt-1 w-full rounded border border-flare-300 bg-white px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">기존 종료일</label>
              <input
                :value="newChangeReq.oldEnd"
                disabled
                class="mt-1 w-full rounded border border-forena-200 bg-slate-50 px-2 py-1 text-xs text-slate-500"
              />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">새 종료일</label>
              <input
                v-model="newChangeReq.newEnd"
                type="date"
                class="mt-1 w-full rounded border border-flare-300 bg-white px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">기존 보할</label>
              <input
                :value="newChangeReq.oldWeight + '%'"
                disabled
                class="mt-1 w-full rounded border border-forena-200 bg-slate-50 px-2 py-1 text-xs text-slate-500"
              />
            </div>
            <div>
              <label class="text-[10px] text-forena-400">새 보할 (%)</label>
              <input
                v-model.number="newChangeReq.newWeight"
                type="number"
                class="mt-1 w-full rounded border border-flare-300 bg-white px-2 py-1 text-xs"
              />
            </div>
          </div>

          <div class="col-span-2">
            <label class="text-[10px] font-bold uppercase text-forena-400">변경 사유 (필수)</label>
            <textarea
              v-model="newChangeReq.reason"
              rows="3"
              placeholder="현장 사유를 구체적으로 기재해 주세요"
              class="mt-1 w-full rounded-lg border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 border-t border-forena-100 px-5 py-3">
          <button
            @click="changeRequestFormOpen = false"
            class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50"
          >
            취소
          </button>
          <button
            @click="submitChangeRequest"
            class="rounded-lg bg-flare-600 px-4 py-2 text-xs font-bold text-white hover:bg-flare-700"
          >
            <GitBranch class="inline h-3.5 w-3.5 mr-1" />변경 요청 등록
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 변경 요청 관리 — 큰 패널                                  -->
    <!-- ============================================================ -->
    <div
      v-if="changeModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="changeModalOpen = false"
    >
      <div
        class="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
          <div class="flex items-center gap-2">
            <GitBranch class="h-4 w-4 text-flare-600" />
            <h3 class="text-sm font-bold text-forena-900">변경 요청 관리</h3>
            <span
              class="rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-600"
              >{{ changeRequests.length }}건</span
            >
          </div>
          <button @click="changeModalOpen = false"><X class="h-4 w-4 text-slate-400" /></button>
        </div>

        <div class="flex min-h-0 flex-1">
          <!-- 좌: 요청 테이블 -->
          <div class="flex-1 overflow-auto border-r border-forena-100">
            <table class="w-full text-xs">
              <thead
                class="sticky top-0 z-10 bg-forena-50/95 text-[10px] font-bold uppercase text-forena-500 backdrop-blur"
              >
                <tr>
                  <th class="px-3 py-2 text-left">요청일</th>
                  <th class="px-3 py-2 text-left">작업명</th>
                  <th class="px-3 py-2 text-left">공종</th>
                  <th class="px-3 py-2 text-left">변경 유형</th>
                  <th class="px-3 py-2 text-left">기존 기간</th>
                  <th class="px-3 py-2 text-left">변경 요청</th>
                  <th class="px-3 py-2 text-left">요청자</th>
                  <th class="px-3 py-2 text-center">상태</th>
                  <th class="px-3 py-2 text-center">영향</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-forena-50">
                <tr
                  v-for="cr in changeRequests"
                  :key="cr.id"
                  class="cursor-pointer hover:bg-forena-50/40"
                  :class="selectedChangeId === cr.id ? 'bg-flare-50/40' : ''"
                  @click="selectedChangeId = cr.id"
                >
                  <td class="px-3 py-2 tabular-nums text-slate-500">{{ cr.requestedAt }}</td>
                  <td class="px-3 py-2 font-semibold text-forena-800">{{ cr.taskName }}</td>
                  <td class="px-3 py-2 text-slate-600">{{ cr.group }}</td>
                  <td class="px-3 py-2 text-slate-600">{{ cr.changeType }}</td>
                  <td class="px-3 py-2 tabular-nums text-[11px] text-slate-500">
                    {{ cr.oldStart.slice(5) }}~{{ cr.oldEnd.slice(5) }}
                  </td>
                  <td class="px-3 py-2 tabular-nums text-[11px] text-flare-700">
                    {{ cr.newStart.slice(5) }}~{{ cr.newEnd.slice(5) }}
                  </td>
                  <td class="px-3 py-2 text-slate-600">{{ cr.requester }}</td>
                  <td class="px-3 py-2 text-center">
                    <span
                      class="rounded px-1.5 py-0.5 text-[10px] font-bold"
                      :class="crStatusClass(cr.status)"
                      >{{ cr.status }}</span
                    >
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span
                      v-if="cr.cpImpact"
                      class="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700"
                      >CP</span
                    >
                    <span v-else class="text-slate-300">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 우: 변경 요청 상세 -->
          <div class="flex w-[420px] shrink-0 flex-col bg-white">
            <div
              v-if="!selectedChange"
              class="flex h-full items-center justify-center text-sm text-slate-400"
            >
              왼쪽 목록에서 변경 요청을 선택하세요
            </div>
            <div v-else class="flex min-h-0 flex-1 flex-col">
              <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
                <p class="text-sm font-bold text-forena-900">변경 요청 상세</p>
                <span
                  class="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  :class="crStatusClass(selectedChange.status)"
                  >{{ selectedChange.status }}</span
                >
              </div>

              <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <!-- 작업 기본 -->
                <div>
                  <p class="text-base font-bold text-forena-900">{{ selectedChange.taskName }}</p>
                  <p class="text-xs text-slate-500">
                    {{ selectedChange.group }} · {{ selectedChange.changeType }}
                  </p>
                </div>

                <!-- 변경 전/후 비교 -->
                <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3">
                  <p class="mb-2 text-[10px] font-bold uppercase text-forena-500">
                    변경 전 → 변경 후
                  </p>
                  <div class="space-y-2 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="text-forena-500">시작일</span>
                      <div class="flex items-center gap-1.5 tabular-nums">
                        <span class="text-slate-500 line-through">{{
                          selectedChange.oldStart
                        }}</span>
                        <ArrowRight class="h-3 w-3 text-flare-600" />
                        <span class="font-bold text-flare-700">{{ selectedChange.newStart }}</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-forena-500">종료일</span>
                      <div class="flex items-center gap-1.5 tabular-nums">
                        <span class="text-slate-500 line-through">{{ selectedChange.oldEnd }}</span>
                        <ArrowRight class="h-3 w-3 text-flare-600" />
                        <span class="font-bold text-flare-700">{{ selectedChange.newEnd }}</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-forena-500">CP 여부</span>
                      <div class="flex items-center gap-1.5">
                        <span class="text-slate-500">{{
                          selectedChange.oldCp ? 'CP' : '비CP'
                        }}</span>
                        <ArrowRight class="h-3 w-3 text-flare-600" />
                        <span class="font-bold text-flare-700">{{
                          selectedChange.newCp ? 'CP' : '비CP'
                        }}</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-forena-500">보할</span>
                      <div class="flex items-center gap-1.5 tabular-nums">
                        <span class="text-slate-500 line-through"
                          >{{ selectedChange.oldWeight }}%</span
                        >
                        <ArrowRight class="h-3 w-3 text-flare-600" />
                        <span class="font-bold text-flare-700"
                          >{{ selectedChange.newWeight }}%</span
                        >
                      </div>
                    </div>
                    <div class="flex items-start justify-between gap-2">
                      <span class="text-forena-500">선행 작업</span>
                      <div class="flex items-center gap-1.5 text-right">
                        <span class="text-slate-500 line-through">{{
                          selectedChange.oldPrev || '없음'
                        }}</span>
                        <ArrowRight class="h-3 w-3 shrink-0 text-flare-600" />
                        <span class="font-bold text-flare-700">{{
                          selectedChange.newPrev || '없음'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 변경 사유 -->
                <div class="rounded-xl border border-forena-100 p-3">
                  <p class="mb-1 text-[10px] font-bold uppercase text-forena-500">변경 사유</p>
                  <p class="text-xs leading-relaxed text-forena-800">{{ selectedChange.reason }}</p>
                  <p class="mt-2 text-[10px] text-slate-400">
                    {{ selectedChange.requester }} · {{ selectedChange.requestedAt }}
                  </p>
                </div>

                <!-- AI 영향 분석 -->
                <div class="rounded-xl border border-flare-100 bg-flare-50/30 p-3">
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <BrainCircuit class="h-3.5 w-3.5 text-flare-600" />
                    <p class="text-[10px] font-bold uppercase text-flare-700">AI 영향 분석</p>
                  </div>
                  <p class="text-xs leading-relaxed text-forena-800">
                    {{ selectedChange.aiSummary }}
                  </p>
                </div>

                <!-- 영향도 -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div
                    class="rounded-lg p-2.5"
                    :class="
                      selectedChange.cpImpact
                        ? 'bg-rose-50 ring-1 ring-rose-100'
                        : 'bg-forena-50/40'
                    "
                  >
                    <p class="text-[10px] font-bold text-forena-500 mb-1">CP 영향</p>
                    <p
                      class="font-bold"
                      :class="selectedChange.cpImpact ? 'text-rose-700' : 'text-slate-500'"
                    >
                      {{ selectedChange.cpImpact ? '있음' : '없음' }}
                    </p>
                  </div>
                  <div
                    class="rounded-lg p-2.5"
                    :class="
                      selectedChange.expectedDelayDays > 0
                        ? 'bg-amber-50 ring-1 ring-amber-100'
                        : 'bg-forena-50/40'
                    "
                  >
                    <p class="text-[10px] font-bold text-forena-500 mb-1">예상 지연</p>
                    <p
                      class="font-bold tabular-nums"
                      :class="
                        selectedChange.expectedDelayDays > 0 ? 'text-amber-700' : 'text-emerald-600'
                      "
                    >
                      {{
                        selectedChange.expectedDelayDays > 0
                          ? `+${selectedChange.expectedDelayDays}일`
                          : '없음'
                      }}
                    </p>
                  </div>
                </div>

                <!-- 후속 영향 -->
                <div v-if="selectedChange.affectedTasks?.length">
                  <p class="text-[10px] font-bold uppercase text-forena-500 mb-1.5">
                    영향 받는 후속 공정
                  </p>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(t, i) in selectedChange.affectedTasks"
                      :key="i"
                      class="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-100"
                      >{{ t }}</span
                    >
                  </div>
                </div>

                <!-- 마일스톤 영향 -->
                <div class="text-xs">
                  <p class="text-[10px] font-bold uppercase text-forena-500 mb-1">마일스톤 영향</p>
                  <p class="text-forena-700">{{ selectedChange.milestoneImpact }}</p>
                </div>

                <!-- 승인자 정보 -->
                <div
                  v-if="selectedChange.approver"
                  class="rounded-lg bg-emerald-50/40 px-3 py-2 text-[11px] text-emerald-800 ring-1 ring-emerald-100"
                >
                  처리자: <strong>{{ selectedChange.approver }}</strong> ·
                  {{ selectedChange.approvedAt }}
                </div>
              </div>

              <!-- 액션 -->
              <div class="border-t border-forena-100 p-3">
                <div
                  v-if="['요청됨', '검토 중'].includes(selectedChange.status)"
                  class="grid grid-cols-3 gap-2"
                >
                  <button
                    @click="reviewChange(selectedChange)"
                    class="flex items-center justify-center gap-1 rounded-lg border border-forena-200 bg-white py-2 text-xs font-bold text-forena-700 hover:bg-forena-50"
                  >
                    <MessagesSquare class="h-3.5 w-3.5" />검토
                  </button>
                  <button
                    @click="approveChange(selectedChange)"
                    :disabled="!canConfirm"
                    class="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <ThumbsUp class="h-3.5 w-3.5" />승인
                  </button>
                  <button
                    @click="rejectChange(selectedChange)"
                    :disabled="!canConfirm"
                    class="flex items-center justify-center gap-1 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    <ThumbsDown class="h-3.5 w-3.5" />반려
                  </button>
                </div>
                <div
                  v-else
                  class="rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500"
                >
                  처리 완료 — {{ selectedChange.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
