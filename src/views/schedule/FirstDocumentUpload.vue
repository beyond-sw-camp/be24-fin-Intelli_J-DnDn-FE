<script setup>
import { ref, computed } from 'vue'

import router from '@/router/index.js'
import { parseFromApi } from '@/utils/ganttParser.js'
import { useGanttStore } from '@/stores/ganttStore.js'
const ganttStore = useGanttStore()

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
]

const API_BASE = 'http://localhost:8081'

// =====================================================
// 상태
// =====================================================
const uploads = ref({
  master: { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
  milestone: { file: null, fileName: '', status: 'idle', progress: 0, result: null, error: '' },
  // trade는 여러 파일 지원 → files 배열로 관리 (fileName은 호환성 유지용)
  trade: { files: [], fileName: '', status: 'idle', progress: 0, result: null, error: '' },
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

// API 분석 결과 (실제 데이터)
const previewTasks = ref([])
const previewMilestones = ref([])
// DB 저장용 원본 API 응답 보관
const apiRawData = ref([])

// 로딩/에러 상태
const isAnalyzing = ref(false)
const analyzeError = ref('')

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
}

const hasAnyUpload = computed(() =>
  uploads.value.master.fileName ||
  uploads.value.milestone.fileName ||
  uploads.value.trade.files.length > 0
)
const hasMaster = computed(() => !!uploads.value.master.fileName)
// trade 파일이 1개 이상 있는지
const hasTradeFiles = computed(() => uploads.value.trade.files.length > 0)

const allDone = computed(() => {
  const masterDone = !uploads.value.master.fileName || uploads.value.master.status === 'done'
  const milestoneDone = !uploads.value.milestone.fileName || uploads.value.milestone.status === 'done'
  const tradeDone = uploads.value.trade.files.length === 0 || uploads.value.trade.status === 'done'
  return (
    uploads.value.master.status === 'done' &&
    masterDone && milestoneDone && tradeDone
  )
})

const hasAnyDone = computed(() =>
  uploads.value.master.status === 'done' ||
  uploads.value.milestone.status === 'done' ||
  uploads.value.trade.status === 'done'
)

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
  if (typeKey === 'trade') {
    // trade는 여러 파일 추가 (중복 파일명 제외)
    const newFiles = Array.from(event.target.files ?? [])
    const existingNames = new Set(uploads.value.trade.files.map((f) => f.name))
    newFiles.forEach((f) => {
      if (!existingNames.has(f.name)) uploads.value.trade.files.push(f)
    })
    uploads.value.trade.fileName = uploads.value.trade.files.length > 0 ? 'multi' : ''
    uploads.value.trade.status = 'idle'
    uploads.value.trade.error = ''
  } else {
    const f = event.target.files?.[0]
    if (!f) return
    uploads.value[typeKey].file = f
    uploads.value[typeKey].fileName = f.name
    uploads.value[typeKey].status = 'idle'
    uploads.value[typeKey].error = ''
  }
  event.target.value = ''
}

// 드래그 앤 드롭
function onDrop(typeKey, event) {
  event.preventDefault()
  if (typeKey === 'trade') {
    const newFiles = Array.from(event.dataTransfer.files ?? [])
    const existingNames = new Set(uploads.value.trade.files.map((f) => f.name))
    newFiles.forEach((f) => {
      if (!existingNames.has(f.name)) uploads.value.trade.files.push(f)
    })
    uploads.value.trade.fileName = uploads.value.trade.files.length > 0 ? 'multi' : ''
    uploads.value.trade.status = 'idle'
    uploads.value.trade.error = ''
  } else {
    const f = event.dataTransfer.files?.[0]
    if (!f) return
    uploads.value[typeKey].file = f
    uploads.value[typeKey].fileName = f.name
    uploads.value[typeKey].status = 'idle'
    uploads.value[typeKey].error = ''
  }
}
function onDragOver(event) {
  event.preventDefault()
}

// 파일 삭제
function removeFile(typeKey) {
  if (typeKey === 'trade') {
    uploads.value.trade = { files: [], fileName: '', status: 'idle', progress: 0, result: null, error: '' }
  } else {
    uploads.value[typeKey] = {
      file: null,
      fileName: '',
      status: 'idle',
      progress: 0,
      result: null,
      error: '',
    }
  }
}

// trade 파일 개별 삭제
function removeTradeFile(index) {
  uploads.value.trade.files.splice(index, 1)
  uploads.value.trade.fileName = uploads.value.trade.files.length > 0 ? 'multi' : ''
  if (uploads.value.trade.files.length === 0) {
    uploads.value.trade.status = 'idle'
  }
}

// =====================================================
// 개별 카드 "AI 분석 실행" 버튼 - 전체 분석을 트리거
// (백엔드가 3개 파일을 한 번에 받는 구조이므로 단독 분석 불가)
// 파일이 1개만 있을 때도 일단 전체 호출 흐름으로 연결
// =====================================================
function runAnalysis(typeKey) {
  // 개별 버튼을 눌러도 전체 분석으로 위임
  handleReviewClick()
}

// =====================================================
// 실제 API 호출: /work-plan/upload-pdf
// masterSchedule, subSchedule, workPlans(배열) 전송
// =====================================================
async function callUploadApi() {
  const formData = new FormData()

  // 백엔드 파라미터명: masterSchedule, subSchedule, workPlans
  if (uploads.value.master.file) {
    formData.append('masterSchedule', uploads.value.master.file)
  }
  if (uploads.value.milestone.file) {
    formData.append('subSchedule', uploads.value.milestone.file)
  }
  // trade는 여러 파일 → 같은 키 'workPlans'로 여러 번 append
  uploads.value.trade.files.forEach((f) => {
    formData.append('workPlans', f)
  })

  // 진행 상태 UI: 모든 파일을 uploading으로
  DOC_TYPES.forEach((dt) => {
    if (uploads.value[dt.key].fileName) {
      uploads.value[dt.key].status = 'uploading'
      uploads.value[dt.key].progress = 0
    }
  })

  // 가상 프로그레스 바 (fetch는 업로드 진행률을 직접 알 수 없음)
  const progressInterval = setInterval(() => {
    DOC_TYPES.forEach((dt) => {
      const u = uploads.value[dt.key]
      if (u.status === 'uploading' || u.status === 'analyzing') {
        u.progress = Math.min(u.progress + Math.random() * 10, 88)
      }
    })
  }, 300)

  try {
    // uploading → analyzing 전환
    setTimeout(() => {
      DOC_TYPES.forEach((dt) => {
        if (uploads.value[dt.key].status === 'uploading') {
          uploads.value[dt.key].status = 'analyzing'
        }
      })
    }, 1500)

    const res = await fetch(`${API_BASE}/work-plan/upload-pdf`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `HTTP ${res.status}`)
    }

    const json = await res.json()

    // 백엔드 응답: { code, message, data: [...WorkPlanDto.Res], success }
    const dataList = json.data ?? json

    if (!Array.isArray(dataList) || dataList.length === 0) {
      throw new Error('AI 분석 결과가 비어 있습니다. 문서를 확인해주세요.')
    }

    // 원본 API 데이터 보관 (확정 시 DB 저장용)
    apiRawData.value = dataList

    // parseFromApi로 간트차트 형식 변환
    const parsed = parseFromApi(dataList)
    previewTasks.value = parsed.tasks
    previewMilestones.value = parsed.milestones

    // 각 카드 상태를 done으로 + result 요약 생성
    const tradeSet = new Set(dataList.map((d) => d.trade).filter(Boolean))
    uploads.value.master.status = 'done'
    uploads.value.master.progress = 100
    uploads.value.master.result = {
      tasks: parsed.tasks.length,
      cpTasks: parsed.tasks.filter((t) => t.isCritical).length,
      dateRange: `${parsed.projectInfo.startDate} ~ ${parsed.projectInfo.endDate}`,
      confidence: 88,
    }
    uploads.value.milestone.status = 'done'
    uploads.value.milestone.progress = 100
    uploads.value.milestone.result = {
      milestones: parsed.milestones.length,
      firstDate: parsed.projectInfo.startDate,
      lastDate: parsed.projectInfo.endDate,
      confidence: 85,
    }
    uploads.value.trade.status = 'done'
    uploads.value.trade.progress = 100
    uploads.value.trade.result = {
      trades: tradeSet.size,
      tasks: parsed.tasks.length,
      lowestConf: 80,
      confidence: 82,
    }

    currentStep.value = 3
    return true
  } catch (err) {
    // 에러 처리
    DOC_TYPES.forEach((dt) => {
      if (['uploading', 'analyzing'].includes(uploads.value[dt.key].status)) {
        uploads.value[dt.key].status = 'error'
        uploads.value[dt.key].progress = 0
        uploads.value[dt.key].error = err.message
      }
    })
    analyzeError.value = err.message
    return false
  } finally {
    clearInterval(progressInterval)
  }
}

// =====================================================
// 유효성 검사 & 공정표 검토 버튼
// =====================================================
async function handleReviewClick() {
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
  if (!uploads.value.master.fileName)
    errors.push({ field: '마스터 공정표', msg: '마스터 공정표 파일을 업로드해주세요.' })
  if (!uploads.value.milestone.fileName)
    errors.push({ field: '마일스톤 공정표', msg: '마일스톤 공정표 파일을 업로드해주세요.' })
  if (uploads.value.trade.files.length === 0)
    errors.push({ field: '공종별 시공계획서', msg: '공종별 시공계획서 파일을 1개 이상 업로드해주세요.' })

  if (errors.length > 0) {
    validationErrors.value = errors
    validationModal.value = true
    return
  }

  // 이미 분석 완료된 경우 바로 모달 오픈
  if (
    uploads.value.master.status === 'done' &&
    uploads.value.milestone.status === 'done' &&
    uploads.value.trade.status === 'done' &&
    previewTasks.value.length > 0
  ) {
    ganttPreviewModal.value = true
    return
  }

  // API 호출
  isAnalyzing.value = true
  analyzeError.value = ''
  currentStep.value = 2

  const ok = await callUploadApi()
  isAnalyzing.value = false

  if (ok) {
    ganttPreviewModal.value = true
  } else {
    // 에러는 각 카드에 표시됨
    validationErrors.value = [{ field: 'AI 분석', msg: analyzeError.value || 'API 호출에 실패했습니다.' }]
    validationModal.value = true
    currentStep.value = 1
  }
}

// =====================================================
// 간트차트 계산용 - projectMeta 기준
// =====================================================
const projStart = computed(() => {
  if (previewTasks.value.length > 0) {
    // API 데이터가 있으면 실제 작업 시작일 기준
    return [...previewTasks.value].sort((a, b) => a.start.localeCompare(b.start))[0].start
  }
  return projectMeta.value.startDate || '2026-01-01'
})
const projEnd = computed(() => {
  if (previewTasks.value.length > 0) {
    return [...previewTasks.value].sort((a, b) => b.end.localeCompare(a.end))[0].end
  }
  return projectMeta.value.endDate || '2027-01-31'
})
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

// 그룹별 태스크 묶기 (실제 데이터 기반)
const groupedGanttTasks = computed(() => {
  const map = new Map()
  for (const t of previewTasks.value) {
    if (!map.has(t.group)) map.set(t.group, [])
    map.get(t.group).push(t)
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }))
})

// =====================================================
// 확정 버튼: DB 저장 후 간트차트 화면으로 이동
// =====================================================
const isConfirming = ref(false)
const confirmError = ref('')

async function confirmAndNavigate() {
  isConfirming.value = true
  confirmError.value = ''

  try {
    // 각 WorkPlan 항목을 /work-plan POST로 저장
    const saveResults = []
    for (const item of apiRawData.value) {
      const payload = {
        name: item.name,
        trade: item.trade,
        location: item.location,
        planType: item.planType,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
        partner: item.partner,
        manager: item.manager,
        contact: item.contact,
        note: item.note,
        workers: item.workers ?? [],
        equipment: item.equipment ?? [],
      }

      const res = await fetch(`${API_BASE}/work-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`저장 실패 (${item.name}): ${text}`)
      }
      const json = await res.json()
      saveResults.push(json.data)
    }

    // ganttStore에 간트차트 데이터 저장
    ganttStore.setData(previewTasks.value, previewMilestones.value, {
      siteName: projectMeta.value.siteName,
      projectName: projectMeta.value.projectName,
      startDate: projStart.value,
      endDate: projEnd.value,
      finalApprover: projectMeta.value.manager,
    })

    ganttPreviewModal.value = false
    router.push('/site/schedule')
  } catch (err) {
    confirmError.value = err.message
  } finally {
    isConfirming.value = false
  }
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
              ② <strong>마스터 공정표 · 마일스톤 공정표 · 공종별 시공계획서</strong> 3가지 파일을
              모두 업로드해주세요.
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
                  <!-- 미업로드 경고 표시 -->
                  <span
                    v-if="dt.key !== 'trade' ? !uploads[dt.key].fileName : uploads.trade.files.length === 0"
                    class="rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold text-rose-600"
                  >필수</span
                  >
                </div>
              </td>
              <td class="px-4 py-2.5 text-center">
                <!-- trade: 파일 개수 표시 -->
                <span v-if="dt.key === 'trade' && uploads.trade.files.length > 0" class="text-forena-700 font-medium">
                    {{ uploads.trade.files.length }}개 파일
                  </span>
                <span v-else-if="dt.key !== 'trade' && uploads[dt.key].fileName" class="text-forena-700 font-medium">{{
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
                    v-if="(dt.key !== 'trade' ? uploads[dt.key].fileName : uploads.trade.files.length > 0) && uploads[dt.key].status === 'idle'"
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
                    v-if="dt.key !== 'trade' ? uploads[dt.key].fileName : uploads.trade.files.length > 0"
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
              :class="(dt.key !== 'trade' ? uploads[dt.key].fileName : uploads.trade.files.length > 0) ? 'text-emerald-600 font-bold' : 'text-slate-400'"
            >
              <CheckCircle2
                v-if="dt.key !== 'trade' ? uploads[dt.key].fileName : uploads.trade.files.length > 0"
                class="inline h-3 w-3 mr-0.5"
              />
              {{
                dt.key !== 'trade'
                  ? (uploads[dt.key].fileName ? dt.label + ' 등록됨' : dt.label + ' 미등록')
                  : (uploads.trade.files.length > 0 ? dt.label + ' ' + uploads.trade.files.length + '개 등록됨' : dt.label + ' 미등록')
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 문서 업로드 카드 3종                                            -->
    <!-- ============================================================ -->
    <div class="grid gap-4 lg:grid-cols-3">
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
              <span class="rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold text-rose-600"
              >필수</span
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
            v-if="dt.key !== 'trade' && !uploads[dt.key].fileName"
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

          <!-- trade: 다중 파일 업로드 영역 -->
          <div
            v-if="dt.key === 'trade'"
            class="flex flex-col gap-2"
          >
            <!-- 드롭존 (항상 표시, 파일 추가 가능) -->
            <div
              class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition cursor-pointer"
              :class="colorMap[dt.color].dragBorder"
              @dragover="onDragOver"
              @drop="(e) => onDrop(dt.key, e)"
            >
              <Upload class="h-5 w-5 mb-1" :class="colorMap[dt.color].icon" />
              <p class="text-xs font-semibold text-forena-700">
                {{ uploads.trade.files.length > 0 ? '파일 추가' : '파일을 끌어다 놓거나' }}
              </p>
              <label class="mt-1.5 cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition bg-emerald-600 hover:bg-emerald-700">
                {{ uploads.trade.files.length > 0 ? '+ 파일 추가' : '파일 선택' }}
                <input
                  type="file"
                  class="sr-only"
                  multiple
                  :accept="dt.acceptedFormats.join(',')"
                  @change="(e) => onFileSelect('trade', e)"
                />
              </label>
              <p class="mt-1.5 text-[11px] text-forena-400">{{ dt.acceptedFormats.join(' · ') }} · 여러 개 선택 가능</p>
            </div>

            <!-- 업로드된 파일 목록 -->
            <div
              v-if="uploads.trade.files.length > 0"
              class="rounded-xl border border-forena-100 bg-forena-50/30 p-3 flex flex-col gap-1.5"
            >
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-[10px] font-bold text-forena-500 uppercase">
                  업로드된 파일 {{ uploads.trade.files.length }}개
                </span>
                <button
                  @click="removeFile('trade')"
                  class="text-[10px] text-rose-400 hover:text-rose-600 font-bold"
                >
                  전체 삭제
                </button>
              </div>

              <!-- 파일 하나씩 -->
              <div
                v-for="(f, i) in uploads.trade.files"
                :key="f.name"
                class="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 border border-forena-100"
              >
                <FileText class="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span class="flex-1 min-w-0 truncate text-[11px] font-semibold text-forena-800">{{ f.name }}</span>
                <span class="text-[10px] text-forena-400 shrink-0">{{ (f.size / 1024).toFixed(0) }}KB</span>
                <button
                  @click="removeTradeFile(i)"
                  :disabled="['uploading','analyzing'].includes(uploads.trade.status)"
                  class="rounded p-0.5 text-slate-300 hover:text-rose-500 disabled:opacity-30"
                >
                  <X class="h-3 w-3" />
                </button>
              </div>

              <!-- 프로그레스 바 -->
              <div v-if="['uploading', 'analyzing'].includes(uploads.trade.status)" class="mt-1">
                <div class="flex items-center justify-between mb-1 text-[10px] text-forena-500">
                  <span>{{ uploads.trade.status === 'uploading' ? '업로드 중…' : 'AI 분석 중…' }}</span>
                  <span class="tabular-nums font-bold">{{ Math.round(uploads.trade.progress) }}%</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-forena-100">
                  <div
                    class="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    :style="{ width: uploads.trade.progress + '%' }"
                  />
                </div>
              </div>

              <!-- 완료 결과 -->
              <div
                v-if="uploads.trade.status === 'done' && uploads.trade.result"
                class="grid grid-cols-2 gap-1.5 text-[10px] mt-1"
              >
                <div class="rounded bg-white px-2 py-1 text-center border border-forena-100">
                  <p class="text-forena-400">공종 수</p>
                  <p class="font-bold text-forena-800">{{ uploads.trade.result.trades }}종</p>
                </div>
                <div class="rounded bg-white px-2 py-1 text-center border border-forena-100">
                  <p class="text-forena-400">세부 작업</p>
                  <p class="font-bold text-forena-800">{{ uploads.trade.result.tasks }}건</p>
                </div>
                <div class="col-span-2 rounded bg-white px-2 py-1 flex items-center justify-between border border-forena-100">
                  <span class="text-forena-400">AI 신뢰도</span>
                  <span class="font-bold text-amber-600">{{ uploads.trade.result.confidence }}%</span>
                </div>
              </div>

              <!-- 오류 -->
              <div
                v-if="uploads.trade.status === 'error'"
                class="rounded bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700"
              >
                {{ uploads.trade.error || '분석 중 오류가 발생했습니다.' }}
              </div>
            </div>
          </div>

          <!-- 파일 등록 후 (master / milestone) -->
          <div v-if="dt.key !== 'trade' && uploads[dt.key].fileName" class="rounded-xl border border-forena-100 bg-forena-50/30 p-3">
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
              전체 {{ previewTasks.length }}개 공정
            </span>
            <span
              class="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200"
            >
              CP {{ previewTasks.filter((t) => t.isCritical).length }}개
            </span>
            <span
              class="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200"
            >
              마일스톤 {{ previewMilestones.length }}개
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
            AI가 업로드하신 3가지 문서를 분석하여 공정표를 생성했습니다. 내용을 검토 후 이상이
            없으면 <strong>공정표 확정하기</strong>를 눌러주세요. 확정 이후에도 변경 요청을 통해
            수정할 수 있습니다.
          </p>
        </div>

        <!-- 줌 컨트롤 -->
        <div class="flex items-center gap-2 border-b border-forena-100 bg-white px-6 py-2">
          <Diamond class="h-3.5 w-3.5 text-flare-600" />
          <span class="text-[11px] font-bold text-forena-700 mr-2">마일스톤</span>
          <div class="flex gap-1.5 mr-4">
            <span
              v-for="m in previewMilestones"
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
                  class="flex h-12 flex-col justify-center border-b border-forena-50 px-4 hover:bg-forena-50/60"
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
                    보할 {{ t.weight }}% · 신뢰도
                    <span :class="confidenceClass(t.confidence)">{{ t.confidence }}%</span>
                  </p>
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
                      v-for="m in previewMilestones.filter((ms) =>
                        previewTasks.find((t) => t.group === grp.group && t.isCritical),
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
          <div class="flex flex-col gap-1">
            <div class="text-[11px] text-forena-500">
              <CheckCircle2 class="inline h-3.5 w-3.5 text-emerald-500 mr-1" />
              공정표 확정 후에도 변경 요청을 통해 수정이 가능합니다.
            </div>
            <div v-if="confirmError" class="text-[11px] text-rose-600 font-semibold">
              <AlertTriangle class="inline h-3 w-3 mr-1" />{{ confirmError }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="ganttPreviewModal = false"
              :disabled="isConfirming"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50 disabled:opacity-40"
            >
              다시 검토하기
            </button>
            <button
              @click="confirmAndNavigate"
              :disabled="isConfirming"
              class="inline-flex items-center gap-2 rounded-lg bg-forena-800 px-5 py-2 text-xs font-bold text-white hover:bg-forena-900 shadow-sm disabled:opacity-60"
            >
              <Loader2 v-if="isConfirming" class="h-3.5 w-3.5 animate-spin" />
              <ShieldCheck v-else class="h-3.5 w-3.5" />
              {{ isConfirming ? 'DB 저장 중…' : '공정표 확정하기' }}
              <ArrowRight v-if="!isConfirming" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>