<script setup>
import { ref, computed } from 'vue'

import router from '@/router/index.js'
import { parseGanttJSON } from '@/utils/ganttParser.js'
import { useGanttStore } from '@/stores/ganttStore.js'
import { uploadAndExtractSchedule, updateTradeProcess } from '@/api/masterSchedule.js'
import { buildGanttData, isTaskDirty, taskToReqBody } from '@/utils/scheduleMapper.js'
const ganttStore = useGanttStore()

// =====================================================
// Props
// =====================================================
// 상위 라우트/페이지에서 현재 프로젝트(현장) ID를 내려줌.
// 추후 실제 라우팅과 연결하면 fallback 값(1)은 제거 예정.
const props = defineProps({
  projectId: {
    type: [Number, String],
    default: 1,
  },
})

import {
  Upload,
  FileText,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Flag,
  Layers,
  X,
  Eye,
  Download,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  Clock,
  Users,
  ShieldCheck,
  Info,
  FilePlus2,
  Trash2,
  FileWarning,
  Loader2,
  BarChart3,
  Calendar,
  AlertCircle,
  CalendarRange,
  ZoomIn,
  ZoomOut,
  Locate,
  Diamond,
  Pencil,
} from 'lucide-vue-next'

// =====================================================
// 상수
// =====================================================
const DOC_TYPES = [
  {
    key: 'master',
    label: '마스터 공정표',
    desc: '전체 공사 일정을 담은 마스터 공정표입니다. AI가 작업 항목, 기간, 선후행 관계를 자동으로 추출합니다.',
    icon: 'spreadsheet',
    required: true,
    acceptedFormats: ['.xlsx', '.xls', '.pdf', '.mpp'],
    color: 'blue',
    aiCapabilities: ['작업 항목 자동 추출', '기간 산정', '선행/후속 관계 파악', 'CP 공정 식별'],
  },
  {
    key: 'milestone',
    label: '마일스톤 공정표',
    desc: '착공, 골조완료, 준공 등 주요 마일스톤 일정을 담은 문서입니다. AI가 마일스톤 목록과 기준일을 추출합니다.',
    icon: 'flag',
    required: false,
    acceptedFormats: ['.xlsx', '.xls', '.pdf', '.pptx'],
    color: 'amber',
    aiCapabilities: ['마일스톤 일자 추출', '영향도 분석', '연관 공정 매핑'],
  },
  {
    key: 'trade',
    label: '공종별 시공계획서',
    desc: '골조, 전기, 설비 등 공종별 상세 시공계획서입니다. AI가 공종별 세부 일정과 인원/장비 계획을 추출합니다.',
    icon: 'layers',
    required: false,
    acceptedFormats: ['.pdf', '.hwp', '.docx', '.xlsx'],
    color: 'teal',
    aiCapabilities: ['공종별 세부 일정', '인원/장비 계획', '위험 요소 식별'],
  },
  {
    key: 'bohal',
    label: '보할 공정표',
    desc: '월/주차별 보할율(가중치)을 담은 공정표입니다. AI가 보할 분포로 각 공정의 시작/종료 시점을 자동으로 추정합니다.',
    icon: 'spreadsheet',
    required: false,
    acceptedFormats: ['.xlsx', '.xls', '.pdf'],
    color: 'violet',
    aiCapabilities: ['보할율 추출', '월/주차별 분포 분석', '공정 시작·종료일 추정'],
  },
]

// =====================================================
// 상태
// =====================================================
const uploads = ref({
  master: { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
  milestone: { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
  trade: { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
  bohal: { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
})

const projectMeta = ref({
  siteName: '강남 복합개발 1공구',
  projectName: '강남 복합개발 1공구 신축공사',
  startDate: '2025-01-01',
  endDate: '2027-01-31',
  manager: '박현수',
})

const currentStep = ref(1)
const analyzeAll = ref(false)

// 유효성 검사 알림 모달
const validationModal = ref(false)
const validationErrors = ref([])

// 간트차트 미리보기 모달
const ganttPreviewModal = ref(false)
const ganttZoom = ref(1)

// =====================================================
// 헬퍼
// =====================================================
const colorMap = {
  blue: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    ring: 'ring-sky-200',
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    icon: 'text-sky-600',
    dragBorder: 'border-sky-400 bg-sky-50/40',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    icon: 'text-amber-600',
    dragBorder: 'border-amber-400 bg-amber-50/40',
  },
  teal: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: 'text-emerald-600',
    dragBorder: 'border-emerald-400 bg-emerald-50/40',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    ring: 'ring-violet-200',
    dot: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
    icon: 'text-violet-600',
    dragBorder: 'border-violet-400 bg-violet-50/40',
  },
}

const hasAnyUpload = computed(() => Object.values(uploads.value).some((u) => u.fileName))
const hasMaster = computed(() => !!uploads.value.master.fileName)

const allDone = computed(() =>
  Object.values(uploads.value)
    .filter((u) => u.fileName)
    .every((u) => u.status === 'done'),
)

const hasAnyDone = computed(() => Object.values(uploads.value).some((u) => u.status === 'done'))

function getStatusLabel(status) {
  return (
    {
      idle: '대기',
      uploading: '업로드 중',
      analyzing: 'AI 분석 중',
      done: '분석 완료',
      error: '오류',
    }[status] ?? '대기'
  )
}
function getStatusClass(status) {
  return (
    {
      idle: 'bg-slate-100 text-slate-500',
      uploading: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
      analyzing: 'bg-flare-50 text-flare-700 ring-1 ring-flare-200',
      done: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      error: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    }[status] ?? 'bg-slate-100 text-slate-500'
  )
}

// 파일 선택
function onFileSelect(typeKey, event) {
  const f = event.target.files?.[0]
  if (!f) return
  uploads.value[typeKey].file = f
  uploads.value[typeKey].fileName = f.name
  uploads.value[typeKey].status = 'idle'
  uploads.value[typeKey].error = ''
  event.target.value = ''
}

// 드래그 앤 드롭
function onDrop(typeKey, event) {
  event.preventDefault()
  const f = event.dataTransfer.files?.[0]
  if (!f) return
  uploads.value[typeKey].file = f
  uploads.value[typeKey].fileName = f.name
  uploads.value[typeKey].status = 'idle'
  uploads.value[typeKey].error = ''
}
function onDragOver(event) {
  event.preventDefault()
}

// 파일 삭제
function removeFile(typeKey) {
  uploads.value[typeKey] = {
    file: null,
    fileName: '',
    status: 'idle',
    progress: 0,
    result: null,
    error: '',
  }
}

// AI 분석 실행 — 백엔드 업로드 + OpenAI 추출 호출
async function runAnalysis(typeKey) {
  const u = uploads.value[typeKey]
  if (!u.file) return

  // DOC_TYPES에서 한글 라벨을 가져와 백엔드 DocType.fromLabel()에 매칭
  const docType = DOC_TYPES.find((dt) => dt.key === typeKey)
  if (!docType) {
    u.status = 'error'
    u.error = '알 수 없는 문서 유형입니다.'
    return
  }

  u.status = 'uploading'
  u.progress = 0
  u.error = ''
  u.result = null

  try {
    const tradeProcesses = await uploadAndExtractSchedule({
      projectId: props.projectId,
      docType: docType.label, // 한글 라벨 그대로 전달
      file: u.file,
      onUploadProgress: (percent) => {
        // 100%에 도달하면 서버에서 OpenAI 분석이 시작됨 → analyzing 상태로 전환
        if (percent >= 100) {
          u.status = 'analyzing'
          u.progress = 100
        } else {
          u.progress = percent
        }
      },
    })

    // 응답: TradeProcessDto.Res[] (axios 인터셉터가 BaseResponse.data 까서 반환)
    // ─── 진단 로그 (보할 단위, 마일스톤 group 확인용) ─────────────
    console.group(`[분석 결과 ${typeKey}]`)
    console.log('총 행 수:', tradeProcesses.length)
    console.log('첫 3건 샘플:', tradeProcesses.slice(0, 3))
    console.log(
      '마일스톤(isMilestone=true):',
      tradeProcesses
        .filter((r) => r.isMilestone)
        .map((r) => ({
          idx: r.idx,
          tradeName: r.tradeName,
          processName: r.processName,
          plannedStart: r.plannedStart,
          plannedEnd: r.plannedEnd,
        })),
    )
    console.log(
      'weightPct 분포:',
      tradeProcesses.map((r) => r.weightPct).filter((v) => v != null),
    )
    console.log('tradeName 종류:', [...new Set(tradeProcesses.map((r) => r.tradeName))])
    console.groupEnd()
    // ────────────────────────────────────────────────────────────

    u.status = 'done'
    u.progress = 100
    u.result = summarizeResult(typeKey, tradeProcesses)

    // 모든 업로드된 파일이 분석 완료면 단계 진행
    if (
      Object.values(uploads.value)
        .filter((x) => x.fileName)
        .every((x) => x.status === 'done')
    ) {
      currentStep.value = 3
    }
  } catch (e) {
    u.status = 'error'
    u.progress = 0
    u.error = e?.message || '분석 중 오류가 발생했습니다.'
  }
}

function runAllAnalysis() {
  analyzeAll.value = true
  currentStep.value = 2
  // 각 파일을 독립적으로 호출 (병렬). 한 파일 실패가 다른 파일에 영향 없음.
  DOC_TYPES.forEach((dt) => {
    if (uploads.value[dt.key].fileName && uploads.value[dt.key].status === 'idle') {
      runAnalysis(dt.key)
    }
  })
}

/**
 * 백엔드 응답(TradeProcessDto.Res[])을 카드별 요약 데이터로 변환.
 * - tasks: 추출 작업 수
 * - cpTasks: 마일스톤 표기된 작업 수 (간이 추정. CP 공정 정식 산출은 후속 작업에서)
 * - milestones: isMilestone=true 작업 수
 * - trades: 고유 공종 수
 * - dateRange: 가장 빠른 시작일 ~ 가장 늦은 종료일
 * - confidence: 임시값 (서버 응답에 신뢰도 필드가 추가되면 교체)
 * - rows: 원본 응답 배열 그대로 보관 (다음 단계 — 간트차트 생성에서 사용)
 */
function summarizeResult(typeKey, rows) {
  const list = Array.isArray(rows) ? rows : []
  const milestones = list.filter((r) => r.isMilestone).length
  const trades = new Set(list.map((r) => r.tradeName).filter(Boolean)).size

  const startDates = list
    .map((r) => r.plannedStart)
    .filter(Boolean)
    .sort()
  const endDates = list
    .map((r) => r.plannedEnd)
    .filter(Boolean)
    .sort()
  const firstDate = startDates[0] ?? null
  const lastDate = endDates[endDates.length - 1] ?? null
  const dateRange = firstDate && lastDate ? `${firstDate} ~ ${lastDate}` : ''

  // 신뢰도 — 서버 응답에 아직 필드 없음. 임시 placeholder.
  const confidence = list.length > 0 ? 90 : 0

  const base = {
    tasks: list.length,
    milestones,
    trades,
    dateRange,
    firstDate,
    lastDate,
    confidence,
    rows, // 다음 단계(간트차트)에서 그대로 사용
  }

  if (typeKey === 'master') {
    return { ...base, cpTasks: milestones }
  }
  if (typeKey === 'milestone') {
    return base
  }
  if (typeKey === 'trade') {
    return base
  }
  if (typeKey === 'bohal') {
    return base
  }
  return base
}

// =====================================================
// 유효성 검사 & 공정표 검토 버튼
// =====================================================
function handleReviewClick() {
  const errors = []

  // 프로젝트 기본 정보 검사
  if (!projectMeta.value.siteName.trim())
    errors.push({ field: '현장명', msg: '현장명을 입력해주세요.' })
  if (!projectMeta.value.projectName.trim())
    errors.push({ field: '공사명', msg: '공사명을 입력해주세요.' })
  if (!projectMeta.value.startDate)
    errors.push({ field: '공사 시작일', msg: '공사 시작일을 선택해주세요.' })
  if (!projectMeta.value.endDate)
    errors.push({ field: '공사 종료일', msg: '공사 종료일을 선택해주세요.' })
  if (!projectMeta.value.manager.trim())
    errors.push({ field: '현장 총책임자', msg: '현장 총책임자를 입력해주세요.' })

  // 날짜 논리 검사
  if (
    projectMeta.value.startDate &&
    projectMeta.value.endDate &&
    projectMeta.value.startDate >= projectMeta.value.endDate
  ) {
    errors.push({ field: '공사 기간', msg: '공사 종료일은 시작일보다 늦어야 합니다.' })
  }

  // 파일 업로드 검사
  // ※ 테스트 단계: 마스터 공정표만 등록되어 있으면 미리보기 진행 가능.
  //   다른 3종(마일스톤/공종별/보할)은 본 운영 시 필수로 전환 예정.
  if (!uploads.value.master.fileName)
    errors.push({ field: '마스터 공정표', msg: '마스터 공정표 파일을 업로드해주세요.' })

  if (errors.length > 0) {
    validationErrors.value = errors
    validationModal.value = true
    return
  }

  // AI 분석이 완료되지 않은 파일이 있으면 먼저 분석 실행
  const needsAnalysis = DOC_TYPES.some(
    (dt) => uploads.value[dt.key].fileName && uploads.value[dt.key].status === 'idle',
  )
  if (needsAnalysis) {
    runAllAnalysis()
    // 분석 완료 후 모달 열기 (polling)
    const checkDone = setInterval(() => {
      const allComplete = DOC_TYPES.filter((dt) => uploads.value[dt.key].fileName).every(
        (dt) => uploads.value[dt.key].status === 'done',
      )
      if (allComplete) {
        clearInterval(checkDone)
        rebuildGanttFromResults()
        ganttPreviewModal.value = true
      }
    }, 500)
    return
  }

  // 이미 분석 완료된 경우 바로 모달 오픈
  rebuildGanttFromResults()
  ganttPreviewModal.value = true
}

// =====================================================
// 간트차트 미리보기 모달 - 분석 결과 기반 데이터
// =====================================================
// 분석 결과(uploads.value.{key}.result.rows)를 모아서 변환.
// 미리보기 모달이 열릴 때 한 번 로드한 뒤,
// 사용자가 모달 안에서 수정한 내용은 ganttTasks/ganttMilestones에 직접 반영된다.
const ganttTasks = ref([])
const ganttMilestones = ref([])
const ganttProjectInfo = ref(null)

// 인라인 편집 상태
const editingTaskId = ref(null)
const editDraft = ref(null)
// 확정 시 일괄 저장 진행 중 플래그
const savingChanges = ref(false)
const saveError = ref('')

/**
 * 미리보기 모달 열기 직전에 호출.
 * 각 분석 결과의 rows 를 모아 간트 데이터로 매핑한다.
 */
function rebuildGanttFromResults() {
  const buckets = {}
  for (const dt of DOC_TYPES) {
    const rows = uploads.value[dt.key]?.result?.rows
    if (Array.isArray(rows)) buckets[dt.key] = rows
  }
  const { tasks, milestones, projectInfo } = buildGanttData(buckets)
  ganttTasks.value = tasks
  ganttMilestones.value = milestones
  ganttProjectInfo.value = projectInfo
}

const projStart = computed(() => projectMeta.value.startDate || '2025-03-01')
const projEnd = computed(() => projectMeta.value.endDate || '2026-09-30')
const projTotalDays = computed(() => {
  const a = new Date(projStart.value),
    b = new Date(projEnd.value)
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
})

function dayOffset(dateStr) {
  const a = new Date(projStart.value),
    b = new Date(dateStr)
  return Math.max(0, Math.round((b - a) / 86400000))
}
function rangeDays(s, e) {
  return Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000) + 1)
}

const cellW = computed(() => 3 * ganttZoom.value)
const ganttPxWidth = computed(() => projTotalDays.value * cellW.value)

// 월별 헤더
const ganttHeader = computed(() => {
  const out = []
  const a = new Date(projStart.value)
  const last = new Date(projEnd.value)
  let cur = new Date(a.getFullYear(), a.getMonth(), 1)
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
  return out
})

function barStyle(start, end) {
  if (!start || !end) return null
  const left = dayOffset(start) * cellW.value
  const width = rangeDays(start, end) * cellW.value
  return { left: `${left}px`, width: `${width - 2}px` }
}

const todayLineStyle = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  if (today < projStart.value || today > projEnd.value) return null
  return { left: `${dayOffset(today) * cellW.value + cellW.value / 2}px` }
})

function milestoneFill(m) {
  if (m.status === '완료') return '#10b981'
  if (m.status === '지연 위험') return '#f43f5e'
  return '#3b82f6'
}
function milestoneStroke(m) {
  if (m.status === '완료') return '#047857'
  if (m.status === '지연 위험') return '#be123c'
  return '#1d4ed8'
}

const confidenceClass = (n) =>
  n >= 90 ? 'text-emerald-600' : n >= 80 ? 'text-forena-600' : 'text-amber-600'

// 그룹별 태스크 묶기
const groupedGanttTasks = computed(() => {
  const map = new Map()
  for (const t of ganttTasks.value) {
    if (!map.has(t.group)) map.set(t.group, [])
    map.get(t.group).push(t)
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }))
})

// 변경된 항목 수 (확정 버튼 옆 표시용)
const dirtyCount = computed(() => ganttTasks.value.filter(isTaskDirty).length)

// =====================================================
// 인라인 편집 (미리보기 모달 안에서)
// =====================================================
function startEdit(task) {
  editingTaskId.value = task.id
  editDraft.value = {
    name: task.name,
    group: task.group,
    start: task.start,
    end: task.end,
    weight: task.weight,
  }
}

function cancelEdit() {
  editingTaskId.value = null
  editDraft.value = null
}

function commitEdit(task) {
  if (!editDraft.value) return
  // 날짜 역전 방지
  if (editDraft.value.start && editDraft.value.end && editDraft.value.start > editDraft.value.end) {
    alert('종료일은 시작일보다 같거나 늦어야 합니다.')
    return
  }
  task.name = editDraft.value.name?.trim() || task.name
  task.group = editDraft.value.group?.trim() || task.group
  task.start = editDraft.value.start
  task.end = editDraft.value.end
  // 보할 소수점 둘째자리 반올림 (mapper 정책과 일치)
  const w = Number(editDraft.value.weight)
  task.weight = Number.isFinite(w) ? Math.round(w * 100) / 100 : 0
  task.reviewStatus = '검토 중'

  cancelEdit()
}

// =====================================================
// 확정 → 변경분 일괄 PUT → store 저장 → 라우팅
// =====================================================
async function confirmAndNavigate() {
  saveError.value = ''

  // 1) 변경된 항목만 추출
  const dirty = ganttTasks.value.filter(isTaskDirty)

  if (dirty.length > 0) {
    savingChanges.value = true
    try {
      // 백엔드 단건 PUT을 병렬로 호출.
      // 일부 실패해도 나머지는 저장 — Promise.allSettled 사용.
      const results = await Promise.allSettled(
        dirty.map((t) => updateTradeProcess(t.id, taskToReqBody(t))),
      )
      const failed = results
        .map((r, i) => ({ r, t: dirty[i] }))
        .filter(({ r }) => r.status === 'rejected')

      if (failed.length > 0) {
        const names = failed
          .map(({ t }) => t.name)
          .slice(0, 3)
          .join(', ')
        saveError.value =
          `${failed.length}건 저장에 실패했습니다 (${names}${failed.length > 3 ? ' 외' : ''}). ` +
          `다시 시도해주세요.`
        savingChanges.value = false
        return
      }

      // 저장 성공한 항목들은 _src를 현재 값으로 갱신 → dirty 상태 해제
      for (const t of dirty) {
        if (t._src) {
          t._src.tradeName = t.group
          t._src.processName = t.name
          t._src.plannedStart = t.start
          t._src.plannedEnd = t.end
          t._src.weightPct = t.weight
          // isMilestone 은 task 가 마일스톤이 아님이 보장되므로 그대로 두거나 false 유지
        }
      }
    } catch (e) {
      saveError.value = e?.message || '변경 사항 저장 중 오류가 발생했습니다.'
      savingChanges.value = false
      return
    }
    savingChanges.value = false
  }

  // 2) store에 데이터 저장
  //    mapper 가 만든 projectInfo 베이스 위에 사용자 입력 값을 얹는다.
  const projectInfoForStore = {
    ...(ganttProjectInfo.value ?? {}),
    siteName: projectMeta.value.siteName,
    projectName: projectMeta.value.projectName || ganttProjectInfo.value?.projectName || '공정표',
    finalApprover: projectMeta.value.manager,
    // 사용자가 입력한 공사 기간이 있으면 우선 사용
    startDate: projectMeta.value.startDate || ganttProjectInfo.value?.startDate,
    endDate: projectMeta.value.endDate || ganttProjectInfo.value?.endDate,
    status: '확정',
    lastModified: new Date().toISOString().slice(0, 10),
  }
  ganttStore.setData(ganttTasks.value, ganttMilestones.value, projectInfoForStore)

  // 3) 라우팅
  ganttPreviewModal.value = false
  router.push('/site/schedule')
}

function zoomIn() {
  ganttZoom.value = Math.min(2.0, +(ganttZoom.value + 0.2).toFixed(1))
}
function zoomOut() {
  ganttZoom.value = Math.max(0.5, +(ganttZoom.value - 0.2).toFixed(1))
}
</script>

<template>
  <div class="flex flex-col gap-5 pb-8">
    <!-- ============================================================ -->
    <!-- 상단: 페이지 헤더 + 단계 표시                                   -->
    <!-- ============================================================ -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">최초 공정표 문서 등록</h1>
        <p class="mt-1 text-xs text-forena-500">
          마스터 공정표, 마일스톤 공정표, 공종별 시공계획서를 업로드하면 AI가 자동으로 분석하여 기준
          공정표를 생성합니다.
        </p>
      </div>

      <!-- 단계 표시 -->
      <div class="flex items-center gap-1.5">
        <div
          v-for="(step, i) in ['문서 등록', 'AI 분석', '검토 확인']"
          :key="i"
          class="flex items-center gap-1.5"
        >
          <div
            class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
            :class="
              currentStep === i + 1
                ? 'bg-forena-800 text-white'
                : currentStep > i + 1
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-forena-50 text-forena-400'
            "
          >
            <CheckCircle2 v-if="currentStep > i + 1" class="h-3 w-3" />
            <span
              v-else
              class="h-4 w-4 flex items-center justify-center rounded-full text-[9px]"
              :class="currentStep === i + 1 ? 'bg-white/20' : 'bg-forena-200 text-forena-500'"
            >
              {{ i + 1 }}
            </span>
            {{ step }}
          </div>
          <ChevronRight v-if="i < 2" class="h-3.5 w-3.5 text-forena-300" />
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 안내 박스                                                      -->
    <!-- ============================================================ -->
    <div
      class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50">
          <Info class="h-5 w-5 text-flare-600" />
        </div>
        <div>
          <p class="text-sm font-bold text-forena-900 mb-1">공정표 문서 등록 안내</p>
          <div class="text-[11px] leading-relaxed text-forena-600 space-y-1">
            <p>
              ① <strong>프로젝트 기본 정보</strong>(현장명, 공사명, 공사 기간, 책임자)를 먼저
              입력해주세요.
            </p>
            <p>
              ② <strong>마스터 공정표 · 마일스톤 공정표 · 공종별 시공계획서 · 보할 공정표</strong>
              4가지 파일을 모두 업로드해주세요.
            </p>
            <p>
              ③ <strong>AI 공정표 생성하기</strong> 버튼을 클릭하면 AI가 분석 후 간트차트를
              미리보기로 보여드립니다.
            </p>
            <p>
              ④ 내용을 확인하고 <strong>공정표 확정하기</strong>를 누르면 대시보드로 이동합니다.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 프로젝트 기본 정보 + 등록 현황                                   -->
    <!-- ============================================================ -->
    <div class="gap-4 grid lg:grid-cols-2">
      <!-- 프로젝트 기본 정보 -->
      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex items-center gap-2 border-b border-forena-100 px-5 py-3">
          <BarChart3 class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">프로젝트 기본 정보</h2>
          <span class="ml-1 text-[11px] text-forena-400">필수 항목을 모두 입력해주세요</span>
        </div>
        <div class="grid gap-3 p-5 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <!-- 현장명 -->
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">
              현장명 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="projectMeta.siteName"
              type="text"
              placeholder="예) 강남 복합개발 1공구"
              value="강남 복합개발 1공구"
              :class="[
                'mt-1 w-full rounded-lg border px-2.5 py-2 text-xs text-forena-800 outline-none transition',
                !projectMeta.siteName.trim()
                  ? 'border-forena-200 focus:border-flare-400'
                  : 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-400',
              ]"
            />
          </div>
          <!-- 공사명 -->
          <div class="sm:col-span-1 lg:col-span-2">
            <label class="text-[10px] font-bold uppercase text-forena-400">
              공사명 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="projectMeta.projectName"
              type="text"
              placeholder="예) 강남 복합개발 1공구 신축공사"
              value="강남 복합개발 1공구 신축공사"
              :class="[
                'mt-1 w-full rounded-lg border px-2.5 py-2 text-xs text-forena-800 outline-none transition',
                !projectMeta.projectName.trim()
                  ? 'border-forena-200 focus:border-flare-400'
                  : 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-400',
              ]"
            />
          </div>
          <!-- 시작일 -->
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">
              공사 시작일 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="projectMeta.startDate"
              type="date"
              value="2025-01-01"
              :class="[
                'mt-1 w-full rounded-lg border px-2.5 py-2 text-xs text-forena-800 outline-none transition',
                !projectMeta.startDate
                  ? 'border-forena-200 focus:border-flare-400'
                  : 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-400',
              ]"
            />
          </div>
          <!-- 종료일 -->
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">
              공사 종료일 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="projectMeta.endDate"
              type="date"
              value="2027-01-31"
              :class="[
                'mt-1 w-full rounded-lg border px-2.5 py-2 text-xs text-forena-800 outline-none transition',
                !projectMeta.endDate
                  ? 'border-forena-200 focus:border-flare-400'
                  : 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-400',
              ]"
            />
          </div>
          <!-- 책임자 -->
          <div>
            <label class="text-[10px] font-bold uppercase text-forena-400">
              현장 총책임자 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="projectMeta.manager"
              type="text"
              placeholder="예) 박현수"
              value="박현수"
              :class="[
                'mt-1 w-full rounded-lg border px-2.5 py-2 text-xs text-forena-800 outline-none transition',
                !projectMeta.manager.trim()
                  ? 'border-forena-200 focus:border-flare-400'
                  : 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-400',
              ]"
            />
          </div>
        </div>
        <!-- 입력 완료 상태 요약 -->
        <div class="border-t border-forena-100 bg-forena-50/30 px-5 py-3">
          <div class="flex flex-wrap gap-3 text-[11px]">
            <span
              :class="
                projectMeta.siteName &&
                projectMeta.projectName &&
                projectMeta.startDate &&
                projectMeta.endDate &&
                projectMeta.manager
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-400'
              "
            >
              <CheckCircle2
                v-if="
                  projectMeta.siteName &&
                  projectMeta.projectName &&
                  projectMeta.startDate &&
                  projectMeta.endDate &&
                  projectMeta.manager
                "
                class="inline h-3 w-3 mr-0.5"
              />
              {{
                projectMeta.siteName &&
                projectMeta.projectName &&
                projectMeta.startDate &&
                projectMeta.endDate &&
                projectMeta.manager
                  ? '기본 정보 완료'
                  : '기본 정보 미완료'
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- 등록 현황 + 액션 -->
      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-forena-100 px-5 py-3"
        >
          <div class="flex items-center gap-2">
            <BrainCircuit class="h-4 w-4 text-flare-600" />
            <h2 class="text-sm font-bold text-forena-900">등록 현황</h2>
          </div>
        </div>

        <!-- 현황 테이블 -->
        <div class="overflow-x-auto">
          <table class="w-full min-w-[580px] text-xs">
            <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
              <tr>
                <th class="px-4 py-2 text-left">문서 유형</th>
                <th class="px-4 py-2 text-center">파일명</th>
                <th class="px-4 py-2 text-center">분석 상태</th>
                <th class="px-4 py-2 text-center">AI 신뢰도</th>
                <th class="px-4 py-2 text-center">액션</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-forena-50">
              <tr v-for="dt in DOC_TYPES" :key="dt.key" class="hover:bg-forena-50/30">
                <td class="px-4 py-2.5">
                  <div class="flex items-center gap-2">
                    <FileSpreadsheet
                      v-if="dt.icon === 'spreadsheet'"
                      class="h-3.5 w-3.5"
                      :class="colorMap[dt.color].icon"
                    />
                    <Flag
                      v-else-if="dt.icon === 'flag'"
                      class="h-3.5 w-3.5"
                      :class="colorMap[dt.color].icon"
                    />
                    <Layers v-else class="h-3.5 w-3.5" :class="colorMap[dt.color].icon" />
                    <span class="font-semibold text-forena-800">{{ dt.label }}</span>
                    <!-- 미업로드 경고 표시 (필수 항목만) -->
                    <span
                      v-if="dt.required && !uploads[dt.key].fileName"
                      class="rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold text-rose-600"
                      >필수</span
                    >
                  </div>
                </td>
                <td class="px-4 py-2.5 text-center">
                  <span v-if="uploads[dt.key].fileName" class="text-forena-700 font-medium">{{
                    uploads[dt.key].fileName
                  }}</span>
                  <span v-else class="text-slate-400 italic">미등록</span>
                </td>
                <td class="px-4 py-2.5 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <Loader2
                      v-if="['uploading', 'analyzing'].includes(uploads[dt.key].status)"
                      class="h-3 w-3 animate-spin text-sky-600"
                    />
                    <CheckCircle2
                      v-else-if="uploads[dt.key].status === 'done'"
                      class="h-3 w-3 text-emerald-500"
                    />
                    <FileWarning
                      v-else-if="uploads[dt.key].status === 'error'"
                      class="h-3 w-3 text-rose-500"
                    />
                    <span
                      class="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                      :class="getStatusClass(uploads[dt.key].status)"
                    >
                      {{ getStatusLabel(uploads[dt.key].status) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-2.5 text-center tabular-nums font-bold">
                  <span
                    v-if="uploads[dt.key].result"
                    :class="
                      uploads[dt.key].result.confidence >= 90
                        ? 'text-emerald-600'
                        : uploads[dt.key].result.confidence >= 80
                          ? 'text-forena-700'
                          : 'text-amber-600'
                    "
                  >
                    {{ uploads[dt.key].result.confidence }}%
                  </span>
                  <span v-else class="text-slate-300">—</span>
                </td>
                <td class="px-4 py-2.5 text-center">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="uploads[dt.key].fileName && uploads[dt.key].status === 'idle'"
                      @click="runAnalysis(dt.key)"
                      class="rounded px-2 py-1 text-[10px] font-bold bg-flare-50 text-flare-700 hover:bg-flare-100"
                    >
                      분석 실행
                    </button>
                    <button
                      v-if="uploads[dt.key].status === 'done'"
                      @click="runAnalysis(dt.key)"
                      class="rounded p-1 text-forena-500 hover:bg-forena-100"
                    >
                      <RefreshCw class="h-3.5 w-3.5" />
                    </button>
                    <button
                      v-if="uploads[dt.key].fileName"
                      @click="removeFile(dt.key)"
                      class="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 입력 완료 상태 요약 -->
        <div class="border-t border-forena-100 bg-forena-50/30 px-5 py-3">
          <div class="flex flex-wrap gap-3 text-[11px]">
            <span
              v-for="dt in DOC_TYPES"
              :key="dt.key"
              :class="uploads[dt.key].fileName ? 'text-emerald-600 font-bold' : 'text-slate-400'"
            >
              <CheckCircle2 v-if="uploads[dt.key].fileName" class="inline h-3 w-3 mr-0.5" />
              {{ uploads[dt.key].fileName ? dt.label + ' 등록됨' : dt.label + ' 미등록' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 문서 업로드 카드 4종                                            -->
    <!-- ============================================================ -->
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="dt in DOC_TYPES"
        :key="dt.key"
        class="overflow-hidden rounded-2xl border bg-white/95 shadow-card flex flex-col transition"
        :class="uploads[dt.key].fileName ? 'border-forena-100/90' : 'border-rose-200'"
      >
        <!-- 카드 헤더 -->
        <div
          class="flex items-center gap-2.5 border-b border-forena-100 px-4 py-3"
          :class="colorMap[dt.color].bg"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-xl"
            :class="
              dt.color === 'blue'
                ? 'bg-sky-100'
                : dt.color === 'amber'
                  ? 'bg-amber-100'
                  : dt.color === 'violet'
                    ? 'bg-violet-100'
                    : 'bg-emerald-100'
            "
          >
            <FileSpreadsheet
              v-if="dt.icon === 'spreadsheet'"
              class="h-4 w-4"
              :class="colorMap[dt.color].icon"
            />
            <Flag v-else-if="dt.icon === 'flag'" class="h-4 w-4" :class="colorMap[dt.color].icon" />
            <Layers v-else class="h-4 w-4" :class="colorMap[dt.color].icon" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-bold text-forena-900">{{ dt.label }}</p>
              <span
                v-if="dt.required"
                class="rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold text-rose-600"
                >필수</span
              >
              <span
                v-else
                class="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-500"
                >선택</span
              >
            </div>
          </div>
          <span
            class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
            :class="getStatusClass(uploads[dt.key].status)"
          >
            {{ getStatusLabel(uploads[dt.key].status) }}
          </span>
        </div>

        <div class="flex flex-1 flex-col p-4 gap-3">
          <p class="text-[11px] leading-relaxed text-forena-500">{{ dt.desc }}</p>

          <!-- 업로드 영역 -->
          <div
            v-if="!uploads[dt.key].fileName"
            class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition cursor-pointer"
            :class="colorMap[dt.color].dragBorder"
            @dragover="onDragOver"
            @drop="(e) => onDrop(dt.key, e)"
          >
            <Upload class="h-6 w-6 mb-1.5" :class="colorMap[dt.color].icon" />
            <p class="text-xs font-semibold text-forena-700">파일을 끌어다 놓거나</p>
            <label
              class="mt-2 cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition"
              :class="
                dt.color === 'blue'
                  ? 'bg-sky-600 hover:bg-sky-700'
                  : dt.color === 'amber'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : dt.color === 'violet'
                      ? 'bg-violet-600 hover:bg-violet-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
              "
            >
              파일 선택
              <input
                type="file"
                class="sr-only"
                :accept="dt.acceptedFormats.join(',')"
                @change="(e) => onFileSelect(dt.key, e)"
              />
            </label>
            <p class="mt-2 text-[11px] text-forena-400">{{ dt.acceptedFormats.join(' · ') }}</p>
          </div>

          <!-- 파일 등록 후 -->
          <div v-else class="rounded-xl border border-forena-100 bg-forena-50/30 p-3">
            <div class="flex items-center gap-2 mb-2">
              <FileText class="h-4 w-4 text-forena-500 shrink-0" />
              <p class="flex-1 min-w-0 truncate text-xs font-semibold text-forena-800">
                {{ uploads[dt.key].fileName }}
              </p>
              <button
                @click="removeFile(dt.key)"
                class="rounded p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- 프로그레스 바 -->
            <div v-if="['uploading', 'analyzing'].includes(uploads[dt.key].status)" class="mb-2">
              <div class="flex items-center justify-between mb-1 text-[10px] text-forena-500">
                <span>{{
                  uploads[dt.key].status === 'uploading' ? '업로드 중…' : 'AI 분석 중…'
                }}</span>
                <span class="tabular-nums font-bold"
                  >{{ Math.round(uploads[dt.key].progress) }}%</span
                >
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-forena-100">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="
                    dt.color === 'blue'
                      ? 'bg-sky-500'
                      : dt.color === 'amber'
                        ? 'bg-amber-500'
                        : dt.color === 'violet'
                          ? 'bg-violet-500'
                          : 'bg-emerald-500'
                  "
                  :style="{ width: uploads[dt.key].progress + '%' }"
                />
              </div>
            </div>

            <!-- 완료 결과 요약 -->
            <div
              v-if="uploads[dt.key].status === 'done' && uploads[dt.key].result"
              class="grid grid-cols-2 gap-1.5 text-[10px]"
            >
              <template v-if="dt.key === 'master'">
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">추출 작업</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.tasks }}건</p>
                </div>
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">CP 공정</p>
                  <p class="font-bold text-rose-700">{{ uploads[dt.key].result.cpTasks }}건</p>
                </div>
                <div
                  class="col-span-2 rounded bg-white px-2 py-1 flex items-center justify-between"
                >
                  <span class="text-forena-400">AI 신뢰도</span>
                  <span
                    class="font-bold"
                    :class="
                      uploads[dt.key].result.confidence >= 90
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    "
                  >
                    {{ uploads[dt.key].result.confidence }}%
                  </span>
                </div>
              </template>
              <template v-else-if="dt.key === 'milestone'">
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">마일스톤</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.milestones }}개</p>
                </div>
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">AI 신뢰도</p>
                  <p class="font-bold text-emerald-600">{{ uploads[dt.key].result.confidence }}%</p>
                </div>
              </template>
              <template v-else-if="dt.key === 'trade'">
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">공종 수</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.trades }}종</p>
                </div>
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">세부 작업</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.tasks }}건</p>
                </div>
                <div
                  class="col-span-2 rounded bg-white px-2 py-1 flex items-center justify-between"
                >
                  <span class="text-forena-400">AI 신뢰도</span>
                  <span class="font-bold text-amber-600"
                    >{{ uploads[dt.key].result.confidence }}%</span
                  >
                </div>
              </template>
              <template v-else-if="dt.key === 'bohal'">
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">추출 작업</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.tasks }}건</p>
                </div>
                <div class="rounded bg-white px-2 py-1 text-center">
                  <p class="text-forena-400">공종 수</p>
                  <p class="font-bold text-forena-800">{{ uploads[dt.key].result.trades }}종</p>
                </div>
                <div
                  class="col-span-2 rounded bg-white px-2 py-1 flex items-center justify-between"
                >
                  <span class="text-forena-400">기간 추정</span>
                  <span class="font-bold text-violet-700 text-[10px] tabular-nums">
                    {{ uploads[dt.key].result.dateRange || '—' }}
                  </span>
                </div>
              </template>
            </div>

            <!-- 오류 -->
            <div
              v-if="uploads[dt.key].status === 'error'"
              class="rounded bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700"
            >
              {{ uploads[dt.key].error || '분석 중 오류가 발생했습니다.' }}
            </div>

            <!-- 액션 버튼 -->
            <div class="flex gap-1.5 mt-2">
              <button
                v-if="uploads[dt.key].status === 'idle'"
                @click="runAnalysis(dt.key)"
                class="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold text-white"
                :class="
                  dt.color === 'blue'
                    ? 'bg-sky-600 hover:bg-sky-700'
                    : dt.color === 'amber'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : dt.color === 'violet'
                        ? 'bg-violet-600 hover:bg-violet-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                "
              >
                <BrainCircuit class="h-3 w-3" /> AI 분석 실행
              </button>
              <button
                v-if="uploads[dt.key].status === 'done'"
                @click="runAnalysis(dt.key)"
                class="flex items-center justify-center gap-1 rounded-lg border border-forena-200 bg-white px-2 py-1.5 text-[11px] font-bold text-forena-600 hover:bg-forena-50"
              >
                <RefreshCw class="h-3 w-3" /> 재분석
              </button>
            </div>
          </div>

          <!-- AI 기능 설명 -->
          <div class="mt-auto">
            <p class="text-[10px] font-bold uppercase text-forena-400 mb-1.5">AI 분석 항목</p>
            <div class="flex flex-col gap-1">
              <div
                v-for="cap in dt.aiCapabilities"
                :key="cap"
                class="flex items-center gap-1.5 text-[11px] text-forena-600"
              >
                <span class="h-1 w-1 shrink-0 rounded-full" :class="colorMap[dt.color].dot"></span>
                {{ cap }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 하단 CTA: AI 공정표 생성하기                                    -->
    <!-- ============================================================ -->
    <div
      class="overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-r from-forena-800 to-forena-900 p-5 shadow-card"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="text-white">
          <p class="text-base font-bold">준비가 완료되면 AI 공정표를 생성해보세요</p>
          <p class="mt-1 text-xs text-forena-300">
            기본 정보와 3가지 문서가 모두 등록되어야 AI 분석이 시작됩니다. 빠진 항목이 있으면
            안내해드립니다.
          </p>
        </div>
        <button
          @click="handleReviewClick"
          class="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-forena-900 shadow-md hover:bg-forena-50 transition"
        >
          <CalendarRange class="h-4 w-4 text-flare-600" />
          AI 공정표 생성하기
          <ArrowRight class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 유효성 검사 오류                                          -->
    <!-- ============================================================ -->
    <div
      v-if="validationModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="validationModal = false"
    >
      <div class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <!-- 헤더 -->
        <div class="flex items-center gap-3 border-b border-forena-100 bg-amber-50 px-5 py-4">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <AlertCircle class="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-forena-900">입력 내용을 확인해주세요</h3>
            <p class="text-[11px] text-amber-700">
              {{ validationErrors.length }}가지 항목이 누락되었습니다.
            </p>
          </div>
          <button
            @click="validationModal = false"
            class="ml-auto rounded-lg p-1 hover:bg-amber-100"
          >
            <X class="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <!-- 오류 목록 -->
        <div class="p-5">
          <ul class="space-y-2">
            <li
              v-for="(err, i) in validationErrors"
              :key="i"
              class="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3"
            >
              <span
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600"
              >
                {{ i + 1 }}
              </span>
              <div class="min-w-0">
                <p class="text-[11px] font-bold text-rose-700">{{ err.field }}</p>
                <p class="text-[11px] text-rose-600">{{ err.msg }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 간트차트 미리보기                                          -->
    <!-- ============================================================ -->
    <div
      v-if="ganttPreviewModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="ganttPreviewModal = false"
    >
      <div
        class="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style="max-height: 92vh"
      >
        <!-- 모달 헤더 -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-forena-100 bg-gradient-to-r from-forena-50 to-white px-6 py-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-100"
            >
              <CalendarRange class="h-5 w-5 text-flare-600" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-forena-900">AI 생성 공정표 미리보기</h3>
              <p class="text-[11px] text-forena-500">
                {{ projectMeta.siteName }} · {{ projectMeta.startDate }} ~ {{ projectMeta.endDate }}
              </p>
            </div>
          </div>

          <!-- AI 분석 요약 뱃지 -->
          <div class="flex flex-wrap gap-2">
            <span
              class="rounded-lg bg-forena-100 px-2.5 py-1 text-[11px] font-bold text-forena-700"
            >
              전체 {{ ganttTasks.length }}개 공정
            </span>
            <span
              class="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200"
            >
              마일스톤 {{ ganttMilestones.length }}개
            </span>
            <span
              v-if="ganttProjectInfo"
              class="rounded-lg bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 ring-1 ring-flare-200"
              :title="'100% 권장'"
            >
              보할 합계 {{ ganttProjectInfo.weightSum }}%
            </span>
          </div>

          <button @click="ganttPreviewModal = false" class="rounded-lg p-1.5 hover:bg-forena-100">
            <X class="h-4 w-4 text-slate-400 hover:text-forena-700" />
          </button>
        </div>

        <!-- 안내 배너 -->
        <div class="flex items-start gap-2 border-b border-forena-100 bg-flare-50/50 px-6 py-3">
          <BrainCircuit class="h-4 w-4 shrink-0 text-flare-600 mt-0.5" />
          <p class="text-[11px] leading-relaxed text-flare-800">
            AI가 업로드된 문서를 분석하여 공정표를 생성했습니다. 좌측 공정명에
            <Pencil class="inline h-3 w-3 mx-0.5" />아이콘을 눌러 직접 수정할 수 있으며,
            <strong>공정표 확정하기</strong>를 누르면 변경 사항이 일괄 저장됩니다. 확정 이후에도
            변경 요청을 통해 수정이 가능합니다.
          </p>
        </div>

        <!-- 줌 컨트롤 -->
        <div class="flex items-center gap-2 border-b border-forena-100 bg-white px-6 py-2">
          <Diamond class="h-3.5 w-3.5 text-flare-600" />
          <span class="text-[11px] font-bold text-forena-700 mr-2">마일스톤</span>
          <div class="flex gap-1.5 mr-4">
            <span
              v-for="m in ganttMilestones"
              :key="m.id"
              class="flex items-center gap-1 rounded-md border border-forena-100 bg-white px-2 py-0.5 text-[10px] font-bold text-forena-700"
            >
              <svg class="h-2.5 w-2.5" viewBox="0 0 12 12">
                <path
                  d="M6 1 L11 6 L6 11 L1 6 Z"
                  :fill="milestoneFill(m)"
                  :stroke="milestoneStroke(m)"
                  stroke-width="1"
                />
              </svg>
              {{ m.name }}
              <span class="tabular-nums text-slate-400">{{ m.date.slice(5) }}</span>
            </span>
          </div>
          <div class="ml-auto flex items-center gap-1.5">
            <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
              <button @click="zoomOut" class="p-1.5 hover:bg-forena-50">
                <ZoomOut class="h-3.5 w-3.5 text-forena-600" />
              </button>
              <span
                class="border-x border-forena-200 px-2 text-[10px] font-bold tabular-nums text-forena-600 leading-[28px]"
                >{{ ganttZoom }}x</span
              >
              <button @click="zoomIn" class="p-1.5 hover:bg-forena-50">
                <ZoomIn class="h-3.5 w-3.5 text-forena-600" />
              </button>
            </div>
          </div>
        </div>

        <!-- 간트차트 본체 -->
        <div id="gantt-scroll" class="overflow-x-auto">
          <div class="flex min-w-full">
            <!-- 좌측 고정: 작업명 -->
            <div class="sticky left-0 z-10 w-44 shrink-0 border-r border-forena-200 bg-white">
              <div
                class="flex h-9 items-center border-b border-forena-200 bg-forena-50/60 px-4 text-[10px] font-bold text-forena-500"
              >
                공정명 / 공종
              </div>
              <template v-for="grp in groupedGanttTasks" :key="grp.group">
                <!-- 공종 헤더 -->
                <div
                  class="flex h-9 items-center gap-1.5 border-b border-forena-200 bg-gradient-to-r from-forena-100 to-forena-50 px-3 text-[11px] font-bold text-forena-800"
                >
                  <Layers class="h-3 w-3 text-flare-600" />
                  <span>{{ grp.group }}</span>
                  <span
                    class="ml-auto rounded bg-white/70 px-1.5 py-0.5 text-[9px] tabular-nums text-forena-500"
                    >{{ grp.items.length }}</span
                  >
                </div>
                <!-- 각 작업 -->
                <div
                  v-for="t in grp.items"
                  :key="t.id"
                  class="group/task relative flex h-12 flex-col justify-center border-b border-forena-50 px-4 hover:bg-forena-50/60"
                >
                  <!-- 보기 모드 -->
                  <template v-if="editingTaskId !== t.id">
                    <div class="flex items-center gap-1">
                      <span
                        v-if="t.isCritical"
                        class="rounded bg-rose-100 px-1 py-0.5 text-[8px] font-bold text-rose-700"
                        >CP</span
                      >
                      <p class="truncate text-xs font-semibold text-forena-800">{{ t.name }}</p>
                      <span
                        v-if="isTaskDirty(t)"
                        class="ml-auto rounded bg-flare-100 px-1 py-0.5 text-[8px] font-bold text-flare-700"
                        title="변경됨"
                        >수정</span
                      >
                      <button
                        @click.stop="startEdit(t)"
                        class="opacity-0 group-hover/task:opacity-100 ml-1 rounded p-0.5 text-forena-400 hover:bg-forena-100 hover:text-forena-700 transition"
                        title="편집"
                      >
                        <Pencil class="h-3 w-3" />
                      </button>
                    </div>
                    <p class="truncate text-[10px] text-slate-400">
                      보할 {{ t.weight }}% · 신뢰도
                      <span :class="confidenceClass(t.confidence)">{{ t.confidence }}%</span>
                    </p>
                  </template>

                  <!-- 편집 모드 -->
                  <template v-else>
                    <input
                      v-model="editDraft.name"
                      class="rounded border border-flare-300 px-1.5 py-0.5 text-[11px] font-semibold text-forena-800 outline-none focus:border-flare-500"
                      placeholder="공정명"
                    />
                    <div class="mt-0.5 flex items-center gap-1">
                      <input
                        v-model="editDraft.start"
                        type="date"
                        class="w-[88px] rounded border border-forena-200 px-1 py-0.5 text-[9px] text-forena-700 outline-none"
                      />
                      <span class="text-[9px] text-forena-400">~</span>
                      <input
                        v-model="editDraft.end"
                        type="date"
                        class="w-[88px] rounded border border-forena-200 px-1 py-0.5 text-[9px] text-forena-700 outline-none"
                      />
                      <input
                        v-model.number="editDraft.weight"
                        type="number"
                        min="0"
                        step="0.01"
                        class="w-12 rounded border border-forena-200 px-1 py-0.5 text-[9px] text-forena-700 outline-none"
                        title="보할율"
                      />
                      <span class="text-[9px] text-forena-400">%</span>
                      <button
                        @click.stop="commitEdit(t)"
                        class="ml-auto rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-emerald-700"
                      >
                        저장
                      </button>
                      <button
                        @click.stop="cancelEdit"
                        class="rounded border border-forena-200 px-1.5 py-0.5 text-[9px] font-bold text-forena-600 hover:bg-forena-50"
                      >
                        취소
                      </button>
                    </div>
                  </template>
                </div>
              </template>
            </div>

            <!-- 우측: 차트 -->
            <div class="relative" :style="{ width: ganttPxWidth + 'px' }">
              <!-- 월 헤더 -->
              <div class="sticky top-0 z-[5] flex h-9 border-b border-forena-200 bg-forena-50/30">
                <div
                  v-for="(h, i) in ganttHeader"
                  :key="i"
                  class="flex items-center justify-center border-r border-forena-100 text-[10px] font-bold text-forena-500"
                  :style="{ width: h.days * cellW + 'px' }"
                >
                  {{ h.label }}
                </div>
              </div>

              <!-- 차트 행 -->
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

                <template v-for="grp in groupedGanttTasks" :key="`grow-${grp.group}`">
                  <!-- 그룹 헤더 행 (마일스톤 표시) -->
                  <div
                    class="relative h-9 border-b border-forena-200 bg-gradient-to-r from-forena-100 to-forena-50"
                  >
                    <div
                      v-for="m in ganttMilestones.filter((ms) =>
                        ganttTasks.find((t) => t.group === grp.group && t.isCritical),
                      )"
                      :key="`ms-${m.id}-${grp.group}`"
                      class="pointer-events-auto absolute top-1/2 z-[4] -translate-y-1/2"
                      :style="{ left: dayOffset(m.date) * cellW + cellW / 2 - 8 + 'px' }"
                      :title="`${m.name} · ${m.date}`"
                    ></div>
                  </div>
                  <!-- 작업 행 -->
                  <div
                    v-for="t in grp.items"
                    :key="`row-${t.id}`"
                    class="relative flex h-12 border-b border-forena-50"
                  >
                    <!-- 계획 바 -->
                    <div
                      v-if="barStyle(t.start, t.end)"
                      class="absolute z-[2] flex items-center"
                      :style="{ ...barStyle(t.start, t.end), top: '18px', height: '6px' }"
                    >
                      <span
                        class="absolute -left-[3px] h-2.5 w-2.5 rounded-full ring-2 ring-white"
                        :class="t.isCritical ? 'bg-rose-600 h-3 w-3' : 'bg-blue-600'"
                      ></span>
                      <span
                        class="absolute -right-[3px] h-2.5 w-2.5 rounded-full ring-2 ring-white"
                        :class="t.isCritical ? 'bg-rose-600 h-3 w-3' : 'bg-blue-600'"
                      ></span>
                      <span
                        class="h-full w-full rounded-full"
                        :class="t.isCritical ? 'bg-rose-500' : 'bg-blue-500'"
                      ></span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 범례 -->
        <div
          class="flex flex-wrap items-center gap-4 border-t border-forena-100 bg-forena-50/40 px-6 py-2 text-[10px] text-slate-600"
        >
          <span class="inline-flex items-center gap-1.5"
            ><span class="h-1.5 w-5 rounded-full bg-rose-500" />CP 공정</span
          >
          <span class="inline-flex items-center gap-1.5"
            ><span class="h-1.5 w-5 rounded-full bg-blue-500" />일반 공정</span
          >
          <span class="inline-flex items-center gap-1.5"
            ><span class="h-3 w-px bg-flare-500" />오늘</span
          >
          <span class="ml-auto text-forena-400">가로 스크롤하여 전체 일정 확인</span>
        </div>

        <!-- 모달 푸터 -->
        <div
          class="flex items-center justify-between border-t border-forena-200 bg-white px-6 py-4"
        >
          <div class="flex flex-col gap-1 text-[11px] text-forena-500">
            <div>
              <CheckCircle2 class="inline h-3.5 w-3.5 text-emerald-500 mr-1" />
              공정표 확정 후에도 변경 요청을 통해 수정이 가능합니다.
            </div>
            <div v-if="dirtyCount > 0" class="text-flare-700 font-bold">
              수정된 공정 {{ dirtyCount }}건이 확정 시 저장됩니다.
            </div>
            <div v-if="saveError" class="text-rose-700 font-bold">
              <AlertCircle class="inline h-3.5 w-3.5 mr-1" />
              {{ saveError }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="ganttPreviewModal = false"
              :disabled="savingChanges"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다시 검토하기
            </button>
            <button
              @click="confirmAndNavigate"
              :disabled="savingChanges"
              class="inline-flex items-center gap-2 rounded-lg bg-forena-800 px-5 py-2 text-xs font-bold text-white hover:bg-forena-900 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="savingChanges" class="h-3.5 w-3.5 animate-spin" />
              <ShieldCheck v-else class="h-3.5 w-3.5" />
              {{ savingChanges ? '저장 중...' : '공정표 확정하기' }}
              <ArrowRight v-if="!savingChanges" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
