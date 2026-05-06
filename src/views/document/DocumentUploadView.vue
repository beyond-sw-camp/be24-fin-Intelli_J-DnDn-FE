<script setup>
import { ref, computed } from 'vue'
import {
  Upload,
  Search,
  Download,
  Filter,
  FileText,
  FileSpreadsheet,
  File,
  X,
  ChevronDown,
  Eye,
  Trash2,
  Clock,
  Building2,
  Handshake,
  CalendarDays,
  Hash,
  AlertTriangle,
  CircleCheck,
  Loader2,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Pin,
  RefreshCw,
} from 'lucide-vue-next'

/* ───── 한국어 라벨 ───── */
const L = {
  kicker: '문서 관리',
  title: '업로드 문서 관리',
  desc: '관리자 및 협력사에서 업로드한 작업 문서를 일괄 조회·관리합니다. 문서 유형별 필터와 검색으로 빠르게 원하는 문서를 찾을 수 있습니다.',

  statTotal: '전체 문서',
  statHq: '본사 문서',
  statPartner: '협력사 문서',
  statPending: '검토 대기',
  unit: '건',

  searchPh: '문서코드, 파일명, 협력사명 검색',
  excel: '엑셀 다운로드',
  upload: '문서 업로드',
  filterLabel: '유형 필터',
  resetFilter: '필터 초기화',

  tabAll: '전체',
  tabWorkInstruction: '작업지시서',
  tabDailyReport: '작업 일보',
  tabMasterSchedule: '마스터 공정표',
  tabSubSchedule: '보할 공정표',
  tabMilestone: '마일스톤 공정표',
  tabConstructionPlan: '시공 계획서',

  colDocCode: '문서 코드',
  colDocType: '문서 유형',
  colFileName: '파일명',
  colOrigin: '작성 주체',
  colDocDate: '문서 일자',
  colUploadDate: '업로드 일자',
  colUploader: '업로드자',
  colStatus: '상태',
  colVersion: '버전',
  colSize: '파일 크기',
  colActions: '',

  originHq: '본사',
  originPartner: '협력사',

  statusApproved: '승인',
  statusPending: '검토 대기',
  statusRejected: '반려',
  statusDraft: '임시저장',

  empty: '조건에 맞는 문서가 없습니다.',

  drawerTitle: '문서 업로드',
  labelDocType: '문서 유형 *',
  labelDocDate: '문서 일자 *',
  labelOrigin: '작성 주체 *',
  labelPartnerName: '협력사명 *',
  labelPartnerSelect: '협력사를 선택하세요',
  labelVersion: '버전',
  labelMemo: '비고',
  labelFile: '파일 업로드 *',
  fileHint: 'PDF, Excel, Word, 한글 파일을 드래그하거나 클릭하여 업로드',
  fileFormats: '.pdf .xlsx .xls .docx .hwp .hwpx',
  submit: '업로드 완료',
  alertFields: '필수 정보를 모두 입력해주세요.',
  alertOk: '문서가 성공적으로 업로드되었습니다.',

  pageInfo: '총 {total}건 중 {start}-{end}건',
  rowsPerPage: '페이지당',
}

/* ───── 문서 유형 목록 ───── */
const docTypes = [
  L.tabWorkInstruction,
  L.tabDailyReport,
  L.tabMasterSchedule,
  L.tabSubSchedule,
  L.tabMilestone,
  L.tabConstructionPlan,
]

/* ── 문서 유형 → 기본 작성 주체 매핑 ── */
const defaultOriginMap = {
  [L.tabWorkInstruction]: 'hq',
  [L.tabDailyReport]: 'hq',
  [L.tabMasterSchedule]: 'hq',
  [L.tabSubSchedule]: 'hq',
  [L.tabMilestone]: 'hq',
  [L.tabConstructionPlan]: 'partner',
}

/* ── 협력사 목록 (실제로는 API에서 불러올 것) ── */
const partnerList = [
  '대한건설(주)',
  '스마트안전(주)',
  '한빛전기공사',
  '성우E&C',
  '명진토건(주)',
  '삼호중기',
  '태양산업개발',
]

/* ───── Mock 데이터 ───── */
const documents = ref([
  {
    id: 1,
    docCode: 'WI-2026-0501-001',
    docType: '작업지시서',
    fileName: '5월_1주차_작업지시서_골조.pdf',
    fileExt: 'pdf',
    origin: 'hq',
    partnerName: null,
    docDate: '2026-05-01',
    uploadDate: '2026-05-01',
    uploader: '김현장',
    status: '승인',
    version: 'v1.0',
    fileSize: '2.4 MB',
  },
  {
    id: 2,
    docCode: 'DR-2026-0501-001',
    docType: '작업 일보',
    fileName: '20260501_작업일보_A공구.xlsx',
    fileExt: 'xlsx',
    origin: 'hq',
    partnerName: null,
    docDate: '2026-05-01',
    uploadDate: '2026-05-01',
    uploader: '박관리',
    status: '승인',
    version: 'v1.0',
    fileSize: '580 KB',
  },
  {
    id: 3,
    docCode: 'MS-2026-0430-001',
    docType: '마스터 공정표',
    fileName: '2026_마스터공정표_전체.xlsx',
    fileExt: 'xlsx',
    origin: 'hq',
    partnerName: null,
    docDate: '2026-04-30',
    uploadDate: '2026-04-30',
    uploader: '김현장',
    status: '승인',
    version: 'v3.2',
    fileSize: '4.1 MB',
  },
  {
    id: 4,
    docCode: 'CP-2026-0502-001',
    docType: '시공 계획서',
    fileName: '전기공사_시공계획서_5월.pdf',
    fileExt: 'pdf',
    origin: 'partner',
    partnerName: '한빛전기공사',
    docDate: '2026-05-02',
    uploadDate: '2026-05-02',
    uploader: '이기사',
    status: '검토 대기',
    version: 'v1.0',
    fileSize: '8.7 MB',
  },
  {
    id: 5,
    docCode: 'SS-2026-0428-001',
    docType: '보할 공정표',
    fileName: '보할공정표_형틀_4월.xlsx',
    fileExt: 'xlsx',
    origin: 'hq',
    partnerName: null,
    docDate: '2026-04-28',
    uploadDate: '2026-04-29',
    uploader: '박관리',
    status: '승인',
    version: 'v2.1',
    fileSize: '1.2 MB',
  },
  {
    id: 6,
    docCode: 'ML-2026-0425-001',
    docType: '마일스톤 공정표',
    fileName: '2026_마일스톤_Q2.pdf',
    fileExt: 'pdf',
    origin: 'hq',
    partnerName: null,
    docDate: '2026-04-25',
    uploadDate: '2026-04-26',
    uploader: '김현장',
    status: '승인',
    version: 'v1.0',
    fileSize: '3.5 MB',
  },
  {
    id: 7,
    docCode: 'CP-2026-0503-001',
    docType: '시공 계획서',
    fileName: '비계공사_시공계획서_5월.hwp',
    fileExt: 'hwp',
    origin: 'partner',
    partnerName: '대한건설(주)',
    docDate: '2026-05-03',
    uploadDate: '2026-05-03',
    uploader: '최안전',
    status: '검토 대기',
    version: 'v1.0',
    fileSize: '5.3 MB',
  },
  {
    id: 8,
    docCode: 'WI-2026-0504-001',
    docType: '작업지시서',
    fileName: '5월_2주차_작업지시서_설비.docx',
    fileExt: 'docx',
    origin: 'hq',
    partnerName: null,
    docDate: '2026-05-04',
    uploadDate: '2026-05-04',
    uploader: '김현장',
    status: '임시저장',
    version: 'v0.1',
    fileSize: '1.8 MB',
  },
  {
    id: 9,
    docCode: 'DR-2026-0502-001',
    docType: '작업 일보',
    fileName: '20260502_작업일보_B공구.xlsx',
    fileExt: 'xlsx',
    origin: 'hq',
    partnerName: null,
    docDate: '2026-05-02',
    uploadDate: '2026-05-02',
    uploader: '박관리',
    status: '승인',
    version: 'v1.0',
    fileSize: '620 KB',
  },
  {
    id: 10,
    docCode: 'CP-2026-0505-001',
    docType: '시공 계획서',
    fileName: '토공사_시공계획서_5월.pdf',
    fileExt: 'pdf',
    origin: 'partner',
    partnerName: '명진토건(주)',
    docDate: '2026-05-05',
    uploadDate: '2026-05-05',
    uploader: '정기술',
    status: '반려',
    version: 'v1.0',
    fileSize: '6.2 MB',
  },
  {
    id: 11,
    docCode: 'MS-2026-0505-001',
    docType: '마스터 공정표',
    fileName: '2026_마스터공정표_수정.xlsx',
    fileExt: 'xlsx',
    origin: 'hq',
    partnerName: null,
    docDate: '2026-05-05',
    uploadDate: '2026-05-06',
    uploader: '김현장',
    status: '검토 대기',
    version: 'v3.3',
    fileSize: '4.3 MB',
  },
  {
    id: 12,
    docCode: 'CP-2026-0504-001',
    docType: '시공 계획서',
    fileName: '중장비_시공계획서_5월.pdf',
    fileExt: 'pdf',
    origin: 'partner',
    partnerName: '삼호중기',
    docDate: '2026-05-04',
    uploadDate: '2026-05-04',
    uploader: '한중장',
    status: '검토 대기',
    version: 'v1.0',
    fileSize: '7.1 MB',
  },
])

/* ───── 상태 관리 ───── */
const searchQuery = ref('')
const currentTab = ref(L.tabAll)
const showUploadDrawer = ref(false)
const isSubmitting = ref(false)
const selectedRows = ref(new Set())
const sortField = ref('uploadDate')
const sortDir = ref('desc')
const currentPage = ref(1)
const rowsPerPage = ref(10)

// 아래 리스트 탭: 마스터/보할/마일스톤 공정표는 공정표 현황에서만 표시
const SCHEDULE_TYPES = [L.tabMasterSchedule, L.tabSubSchedule, L.tabMilestone]
const tabs = [L.tabAll, ...docTypes.filter((t) => !SCHEDULE_TYPES.includes(t))]

/* ───── 새 문서 업로드 폼 ───── */
const newDoc = ref({
  docType: '',
  docDate: '',
  origin: 'hq',
  partnerName: '',
  version: 'v1.0',
  memo: '',
  file: null,
  fileName: '',
})

/* ───── 통계 ───── */
const summary = computed(() => ({
  total: documents.value.length,
  hq: documents.value.filter((d) => d.origin === 'hq').length,
  partner: documents.value.filter((d) => d.origin === 'partner').length,
  pending: documents.value.filter((d) => d.status === '검토 대기').length,
}))

/* ───── 필터링 + 정렬 ───── */
const filteredDocuments = computed(() => {
  let result = [...documents.value]

  if (currentTab.value !== L.tabAll) {
    result = result.filter((d) => d.docType === currentTab.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
        (d) =>
            d.docCode.toLowerCase().includes(q) ||
            d.fileName.toLowerCase().includes(q) ||
            (d.partnerName && d.partnerName.toLowerCase().includes(q)) ||
            d.uploader.toLowerCase().includes(q),
    )
  }

  // 날짜 범위 필터 (작업지시서·작업일보 탭에서만)
  if (showDateFilter.value && (dateFilterStart.value || dateFilterEnd.value)) {
    result = result.filter((d) => {
      if (dateFilterStart.value && d.docDate < dateFilterStart.value) return false
      if (dateFilterEnd.value && d.docDate > dateFilterEnd.value) return false
      return true
    })
  }

  result.sort((a, b) => {
    const aVal = a[sortField.value] || ''
    const bVal = b[sortField.value] || ''
    const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    return sortDir.value === 'asc' ? cmp : -cmp
  })

  return result
})

/* ───── 페이지네이션 ───── */
const totalPages = computed(() => Math.ceil(filteredDocuments.value.length / rowsPerPage.value))
const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return filteredDocuments.value.slice(start, start + rowsPerPage.value)
})
const pageStart = computed(() => (currentPage.value - 1) * rowsPerPage.value + 1)
const pageEnd = computed(() =>
    Math.min(currentPage.value * rowsPerPage.value, filteredDocuments.value.length),
)

/* ───── 핸들러 ───── */
const toggleSort = (field) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'desc'
  }
}

const toggleSelectAll = () => {
  if (selectedRows.value.size === paginatedDocuments.value.length) {
    selectedRows.value.clear()
  } else {
    paginatedDocuments.value.forEach((d) => selectedRows.value.add(d.id))
  }
}

const toggleRow = (id) => {
  if (selectedRows.value.has(id)) {
    selectedRows.value.delete(id)
  } else {
    selectedRows.value.add(id)
  }
}

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    newDoc.value.file = file
    newDoc.value.fileName = file.name
  }
}

const handleFileDrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    newDoc.value.file = file
    newDoc.value.fileName = file.name
  }
}

const onDocTypeChange = () => {
  const dt = newDoc.value.docType
  if (dt && defaultOriginMap[dt]) {
    newDoc.value.origin = defaultOriginMap[dt]
    if (newDoc.value.origin === 'hq') {
      newDoc.value.partnerName = ''
    }
  }
}

const submitUpload = () => {
  if (!newDoc.value.docType || !newDoc.value.docDate || !newDoc.value.file) {
    alert(L.alertFields)
    return
  }
  if (newDoc.value.origin === 'partner' && !newDoc.value.partnerName) {
    alert(L.alertFields)
    return
  }

  isSubmitting.value = true
  setTimeout(() => {
    const prefixMap = {
      [L.tabWorkInstruction]: 'WI',
      [L.tabDailyReport]: 'DR',
      [L.tabMasterSchedule]: 'MS',
      [L.tabSubSchedule]: 'SS',
      [L.tabMilestone]: 'ML',
      [L.tabConstructionPlan]: 'CP',
    }
    const prefix = prefixMap[newDoc.value.docType] || 'DC'
    const dateStr = newDoc.value.docDate.replace(/-/g, '').substring(2)
    const seq = String(documents.value.length + 1).padStart(3, '0')

    documents.value.unshift({
      id: Date.now(),
      docCode: `${prefix}-${newDoc.value.docDate.substring(0, 4)}-${dateStr.substring(2)}-${seq}`,
      docType: newDoc.value.docType,
      fileName: newDoc.value.fileName,
      fileExt: newDoc.value.fileName.split('.').pop().toLowerCase(),
      origin: newDoc.value.origin,
      partnerName: newDoc.value.origin === 'partner' ? newDoc.value.partnerName : null,
      docDate: newDoc.value.docDate,
      uploadDate: new Date().toISOString().substring(0, 10),
      uploader: '김현장',
      status: '검토 대기',
      version: newDoc.value.version || 'v1.0',
      fileSize: `${(Math.random() * 9 + 1).toFixed(1)} MB`,
    })

    isSubmitting.value = false
    showUploadDrawer.value = false
    alert(L.alertOk)

    newDoc.value = {
      docType: '',
      docDate: '',
      origin: 'hq',
      partnerName: '',
      version: 'v1.0',
      memo: '',
      file: null,
      fileName: '',
    }
  }, 800)
}

/* ───── 날짜 필터 (작업지시서·작업일보 탭 전용) ───── */
const dateFilterStart = ref('')
const dateFilterEnd = ref('')

const DATE_FILTER_TABS = [L.tabWorkInstruction, L.tabDailyReport]
const showDateFilter = computed(() => DATE_FILTER_TABS.includes(currentTab.value))

const applyQuickDate = (preset) => {
  const today = new Date()
  const fmt = (d) => d.toISOString().substring(0, 10)
  if (preset === 'today') {
    dateFilterStart.value = fmt(today)
    dateFilterEnd.value = fmt(today)
  } else if (preset === 'yesterday') {
    const y = new Date(today); y.setDate(today.getDate() - 1)
    dateFilterStart.value = fmt(y)
    dateFilterEnd.value = fmt(y)
  } else if (preset === 'thisWeek') {
    const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    dateFilterStart.value = fmt(mon)
    dateFilterEnd.value = fmt(today)
  } else if (preset === 'lastWeek') {
    const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    dateFilterStart.value = fmt(mon)
    dateFilterEnd.value = fmt(sun)
  } else if (preset === 'thisMonth') {
    dateFilterStart.value = fmt(new Date(today.getFullYear(), today.getMonth(), 1))
    dateFilterEnd.value = fmt(today)
  } else if (preset === 'lastMonth') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const last  = new Date(today.getFullYear(), today.getMonth(), 0)
    dateFilterStart.value = fmt(first)
    dateFilterEnd.value = fmt(last)
  }
  currentPage.value = 1
}

const clearDateFilter = () => {
  dateFilterStart.value = ''
  dateFilterEnd.value = ''
  currentPage.value = 1
}

const activeDatePreset = computed(() => {
  const today = new Date()
  const fmt = (d) => d.toISOString().substring(0, 10)
  const s = dateFilterStart.value
  const e = dateFilterEnd.value
  if (!s && !e) return ''
  const todayStr = fmt(today)
  const yStr = fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))
  if (s === todayStr && e === todayStr) return 'today'
  if (s === yStr && e === yStr) return 'yesterday'
  const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const monStr = fmt(mon)
  if (s === monStr && e === todayStr) return 'thisWeek'
  const lmon = new Date(today); lmon.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7)
  const lsun = new Date(lmon); lsun.setDate(lmon.getDate() + 6)
  if (s === fmt(lmon) && e === fmt(lsun)) return 'lastWeek'
  if (s === fmt(new Date(today.getFullYear(), today.getMonth(), 1)) && e === todayStr) return 'thisMonth'
  const lf = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const ll = new Date(today.getFullYear(), today.getMonth(), 0)
  if (s === fmt(lf) && e === fmt(ll)) return 'lastMonth'
  return 'custom'
})
const PINNED_TYPES = [L.tabMasterSchedule, L.tabSubSchedule, L.tabMilestone]

const pinnedSchedules = computed(() =>
    PINNED_TYPES.map((type) => {
      const latest = documents.value
          .filter((d) => d.docType === type)
          .sort((a, b) => (b.docDate > a.docDate ? 1 : -1))[0] ?? null
      return { type, doc: latest }
    })
)




const pinnedStatusClass = (status) => {
  if (!status) return ''
  if (status === '승인')      return 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200/80'
  if (status === '검토 대기') return 'text-amber-600 bg-amber-50 ring-1 ring-amber-200/80'
  if (status === '반려')      return 'text-rose-600 bg-rose-50 ring-1 ring-rose-200/80'
  return 'text-slate-500 bg-slate-50 ring-1 ring-slate-200/80'
}

const jumpToTab = (type) => {
  currentTab.value = type
  currentPage.value = 1
}

const downloadExcel = () => {
  alert('문서 목록 엑셀 다운로드를 시작합니다.')
}

/* ───── 유틸 ───── */
const fileIcon = (ext) => {
  if (ext === 'pdf') return FileText
  if (['xlsx', 'xls', 'csv'].includes(ext)) return FileSpreadsheet
  return File
}

const fileIconColor = (ext) => {
  if (ext === 'pdf') return 'text-rose-500 bg-rose-50'
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'text-emerald-600 bg-emerald-50'
  if (['docx', 'doc'].includes(ext)) return 'text-blue-600 bg-blue-50'
  if (['hwp', 'hwpx'].includes(ext)) return 'text-sky-600 bg-sky-50'
  return 'text-slate-500 bg-slate-50'
}

const statusBadge = (status) => {
  if (status === '승인')
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
  if (status === '검토 대기')
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80'
  if (status === '반려')
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
}

const statusIcon = (status) => {
  if (status === '승인') return CircleCheck
  if (status === '검토 대기') return Clock
  if (status === '반려') return AlertTriangle
  return File
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const docTypeBadgeClass = (type) => {
  const map = {
    '작업지시서': 'bg-forena-50 text-forena-700 ring-forena-200/70',
    '작업 일보': 'bg-flare-50 text-flare-600 ring-flare-200/70',
    '마스터 공정표': 'bg-violet-50 text-violet-700 ring-violet-200/70',
    '보할 공정표': 'bg-indigo-50 text-indigo-700 ring-indigo-200/70',
    '마일스톤 공정표': 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200/70',
    '시공 계획서': 'bg-amber-50 text-amber-700 ring-amber-200/70',
  }
  return map[type] || 'bg-slate-50 text-slate-600 ring-slate-200/70'
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <!-- ═══ 헤더 ═══ -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">{{ L.kicker }}</p>
        <h1 class="text-xl font-bold text-forena-900">{{ L.title }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50"
            @click="downloadExcel"
        >
          <Download class="h-3.5 w-3.5 text-forena-400" />
          {{ L.excel }}
        </button>
        <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 hover:bg-flare-100"
            @click="showUploadDrawer = true"
        >
          <Plus class="h-3.5 w-3.5 text-flare-600" />
          {{ L.upload }}
        </button>
      </div>
    </div>

    <!-- ═══ 통계 카드 ═══ -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ">
      <!-- 전체 -->
      <article
          class="relative flex h-[110px] flex-col justify-between overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
      >
        <div
            class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-forena-500 to-flare-400 opacity-90"
        />
        <div class="flex items-start justify-between">
          <h3 class="text-sm font-semibold text-forena-800">{{ L.statTotal }}</h3>
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-forena-50 text-forena-600">
            <FileText class="h-4 w-4" />
          </span>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-3xl font-light tabular-nums text-forena-900">{{ summary.total }}</span>
          <span class="text-sm font-medium text-slate-400">{{ L.unit }}</span>
        </div>
      </article>

      <!-- 본사 -->
      <article
          class="relative flex h-[110px] flex-col justify-between overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
      >
        <div
            class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-forena-500 to-forena-300"
        />
        <div class="flex items-start justify-between">
          <h3 class="text-sm font-semibold text-forena-800">{{ L.statHq }}</h3>
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-flare-50 text-flare-600">
            <Building2 class="h-4 w-4" />
          </span>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-3xl font-light tabular-nums text-forena-900">{{ summary.hq }}</span>
          <span class="text-sm font-medium text-slate-400">{{ L.unit }}</span>
        </div>
      </article>

      <!-- 협력사 -->
      <article
          class="relative flex h-[110px] flex-col justify-between overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
      >
        <div
            class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-flare-400 to-emerald-400"
        />
        <div class="flex items-start justify-between">
          <h3 class="text-sm font-semibold text-forena-800">{{ L.statPartner }}</h3>
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Handshake class="h-4 w-4" />
          </span>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-3xl font-light tabular-nums text-forena-900">{{ summary.partner }}</span>
          <span class="text-sm font-medium text-slate-400">{{ L.unit }}</span>
        </div>
      </article>

      <!-- 검토 대기 -->
      <article
          class="relative flex h-[110px] flex-col justify-between overflow-hidden rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/80 to-white/90 p-5 shadow-card"
      >
        <div class="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-amber-200/20" />
        <div class="relative z-10 flex items-start justify-between">
          <h3 class="text-sm font-semibold text-amber-900">{{ L.statPending }}</h3>
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Clock class="h-4 w-4" />
          </span>
        </div>
        <div class="relative z-10 flex items-baseline gap-1">
          <span class="text-3xl font-light tabular-nums text-forena-900">{{ summary.pending }}</span>
          <span class="text-sm font-medium text-slate-400">{{ L.unit }}</span>
        </div>
      </article>
    </div>

    <!-- ═══ 고정 공정표 섹션 ═══ -->
    <div class="relative overflow-hidden rounded-2xl border border-white/90 bg-white/90 shadow-card backdrop-blur-sm">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-forena-500 to-flare-400 opacity-90" />
      <!-- 섹션 헤더 -->
      <div class="flex items-center gap-2 border-b border-forena-50 px-6 py-3.5">
        <Pin class="h-3.5 w-3.5 text-forena-400" />
        <span class="text-xs font-bold text-forena-700">공정표 현황</span>
        <span class="text-[11px] text-slate-400">— 유형별 최신 1건 고정</span>
      </div>
      <!-- 리스트 헤더 -->
      <div class="grid grid-cols-[180px_1fr_130px_110px_110px_72px] border-b border-forena-100 bg-forena-50/60 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-forena-500">
        <span>문서 유형</span>
        <span>파일명</span>
        <span>문서 코드</span>
        <span>문서 일자</span>
        <span>업로드 일자</span>
        <span class="text-center">액션</span>
      </div>
      <!-- 리스트 행 -->
      <div
          v-for="item in pinnedSchedules"
          :key="item.type"
          class="group grid grid-cols-[180px_1fr_130px_110px_110px_72px] items-center border-b border-forena-50 px-6 py-3.5 last:border-b-0 transition hover:bg-flare-50/40"
      >
        <!-- 문서 유형 -->
        <div class="flex items-center gap-2">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-forena-50 text-forena-500">
            <FileText class="h-3.5 w-3.5" />
          </span>
          <span class="text-xs font-bold text-forena-800">{{ item.type }}</span>
        </div>

        <!-- 파일명 (없을 때) -->
        <div v-if="!item.doc" class="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span class="italic">등록된 문서 없음</span>
        </div>

        <!-- 파일명 (있을 때) -->
        <div v-else class="flex min-w-0 items-center gap-2 pr-4">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" :class="fileIconColor(item.doc.fileExt)">
            <component :is="fileIcon(item.doc.fileExt)" class="h-3 w-3" />
          </span>
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold text-forena-900">{{ item.doc.fileName }}</p>
            <p class="text-[10px] text-slate-400">{{ item.doc.fileSize }}</p>
          </div>
        </div>

        <!-- 문서 코드 -->
        <span class="font-mono text-[11px] font-semibold text-forena-600">{{ item.doc?.docCode ?? '—' }}</span>

        <!-- 문서 일자 -->
        <span class="text-xs text-slate-600">{{ item.doc ? formatDate(item.doc.docDate) : '—' }}</span>

        <!-- 업로드 일자 -->
        <span class="text-xs text-slate-500">{{ item.doc ? formatDate(item.doc.uploadDate) : '—' }}</span>

        <!-- 액션 -->
        <div class="flex items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button v-if="item.doc" type="button"
                  class="rounded-lg p-1.5 text-slate-400 transition hover:bg-flare-50 hover:text-flare-700" title="다운로드">
            <Download class="h-3.5 w-3.5" />
          </button>
          <button type="button"
                  class="rounded-lg p-1.5 text-slate-400 transition hover:bg-forena-50 hover:text-forena-700"
                  title="목록 보기" @click="jumpToTab(item.type)">
            <Eye class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ 테이블 카드 ═══ -->
    <div
        class="relative overflow-hidden rounded-2xl border border-white/90 bg-white/90 shadow-card backdrop-blur-sm"
    >
      <div
          class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-forena-500 to-flare-400 opacity-90"
      />

      <!-- 검색 + 필터 바 -->
      <div class="flex flex-col gap-3 border-b border-forena-50 px-6 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative w-full max-w-sm">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
              v-model="searchQuery"
              type="text"
              :placeholder="L.searchPh"
              class="w-full rounded-xl border border-forena-200/80 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
          />
        </div>
        <div v-if="selectedRows.size > 0" class="flex items-center gap-2 text-xs text-forena-600">
          <span class="font-bold">{{ selectedRows.size }}건 선택</span>
          <button
              type="button"
              class="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <Trash2 class="h-3 w-3" />
            삭제
          </button>
          <button
              type="button"
              class="flex items-center gap-1 rounded-lg border border-forena-200 bg-forena-50 px-3 py-1.5 text-[11px] font-bold text-forena-700 transition hover:bg-forena-100"
          >
            <Download class="h-3 w-3" />
            다운로드
          </button>
        </div>
      </div>

      <!-- 탭 -->
      <div class="scrollbar-hide flex items-center gap-1 overflow-x-auto border-b border-forena-50 px-6 py-2">
        <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition"
            :class="
            currentTab === tab
              ? 'bg-forena-500 text-white shadow-sm'
              : 'text-slate-500 hover:bg-forena-50 hover:text-forena-700'
          "
            @click="currentTab = tab; currentPage = 1; clearDateFilter()"
        >
          {{ tab }}
        </button>
        <button
            v-if="currentTab !== L.tabAll"
            type="button"
            class="ml-1 flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            @click="currentTab = L.tabAll"
        >
          <RotateCcw class="h-3 w-3" />
          {{ L.resetFilter }}
        </button>
      </div>

      <!-- 날짜 빠른 선택 (작업지시서·작업일보 탭 전용) -->
      <div
          v-if="showDateFilter"
          class="flex flex-wrap items-center gap-2 border-b border-forena-50 bg-forena-50/40 px-6 py-3"
      >
        <CalendarDays class="h-3.5 w-3.5 shrink-0 text-forena-400" />
        <span class="text-[11px] font-bold text-forena-500 shrink-0">날짜 필터</span>
        <!-- 빠른 선택 프리셋 -->
        <div class="flex flex-wrap gap-1">
          <button
              v-for="preset in [
                { key: 'today', label: '오늘' },
                { key: 'yesterday', label: '어제' },
                { key: 'thisWeek', label: '이번 주' },
                { key: 'lastWeek', label: '지난 주' },
                { key: 'thisMonth', label: '이번 달' },
                { key: 'lastMonth', label: '지난 달' },
              ]"
              :key="preset.key"
              type="button"
              class="rounded-md px-2.5 py-1 text-[11px] font-bold transition"
              :class="
                activeDatePreset === preset.key
                  ? 'bg-forena-500 text-white shadow-sm'
                  : 'border border-forena-200 bg-white text-slate-600 hover:border-forena-300 hover:bg-forena-50'
              "
              @click="applyQuickDate(preset.key)"
          >{{ preset.label }}</button>
        </div>
        <!-- 직접 입력 -->
        <div class="ml-1 flex items-center gap-1.5">
          <input
              v-model="dateFilterStart"
              type="date"
              class="rounded-md border border-forena-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              @change="currentPage = 1"
          />
          <span class="text-[11px] text-slate-400">~</span>
          <input
              v-model="dateFilterEnd"
              type="date"
              class="rounded-md border border-forena-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              @change="currentPage = 1"
          />
        </div>
        <!-- 초기화 -->
        <button
            v-if="dateFilterStart || dateFilterEnd"
            type="button"
            class="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500 transition hover:bg-slate-50"
            @click="clearDateFilter"
        >
          <X class="h-3 w-3" />
          초기화
        </button>
      </div>

      <!-- 테이블 -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[960px] text-left text-sm whitespace-nowrap">
          <thead class="border-b border-forena-100 bg-forena-50/60 text-[11px] font-bold uppercase tracking-wider text-forena-500">
          <tr>
            <th class="w-10 px-4 py-3.5">
              <input
                  type="checkbox"
                  class="h-3.5 w-3.5 rounded border-forena-300 text-forena-600 accent-forena-600"
                  :checked="selectedRows.size === paginatedDocuments.length && paginatedDocuments.length > 0"
                  @change="toggleSelectAll"
              />
            </th>
            <th
                class="cursor-pointer px-4 py-3.5 font-semibold select-none"
                @click="toggleSort('docCode')"
            >
                <span class="flex items-center gap-1">
                  {{ L.colDocCode }}
                  <ArrowUpDown class="h-3 w-3 text-slate-400" />
                </span>
            </th>
            <th class="px-4 py-3.5 font-semibold">{{ L.colDocType }}</th>
            <th class="px-4 py-3.5 font-semibold">{{ L.colFileName }}</th>
            <th class="px-4 py-3.5 font-semibold">{{ L.colOrigin }}</th>
            <th
                class="cursor-pointer px-4 py-3.5 font-semibold select-none"
                @click="toggleSort('docDate')"
            >
                <span class="flex items-center gap-1">
                  {{ L.colDocDate }}
                  <ArrowUpDown class="h-3 w-3 text-slate-400" />
                </span>
            </th>
            <th
                class="cursor-pointer px-4 py-3.5 font-semibold select-none"
                @click="toggleSort('uploadDate')"
            >
                <span class="flex items-center gap-1">
                  {{ L.colUploadDate }}
                  <ArrowUpDown class="h-3 w-3 text-slate-400" />
                </span>
            </th>
            <th class="px-4 py-3.5 font-semibold">{{ L.colUploader }}</th>
            <th class="w-20 px-4 py-3.5 text-center font-semibold">{{ L.colActions }}</th>
          </tr>
          </thead>
          <tbody class="text-forena-800">
          <tr v-if="filteredDocuments.length === 0">
            <td colspan="10" class="px-6 py-14 text-center text-sm text-slate-400">
              {{ L.empty }}
            </td>
          </tr>
          <tr
              v-else
              v-for="doc in paginatedDocuments"
              :key="doc.id"
              class="group border-b border-forena-50 transition hover:bg-flare-50/40"
              :class="{ 'bg-forena-50/30': selectedRows.has(doc.id) }"
          >
            <!-- 체크 -->
            <td class="px-4 py-3.5">
              <input
                  type="checkbox"
                  class="h-3.5 w-3.5 rounded border-forena-300 text-forena-600 accent-forena-600"
                  :checked="selectedRows.has(doc.id)"
                  @change="toggleRow(doc.id)"
              />
            </td>

            <!-- 문서 코드 -->
            <td class="px-4 py-3.5">
              <span class="font-mono text-xs font-semibold text-forena-700">{{ doc.docCode }}</span>
            </td>

            <!-- 문서 유형 -->
            <td class="px-4 py-3.5">
                <span
                    class="inline-flex rounded-lg px-2 py-0.5 text-[11px] font-bold ring-1"
                    :class="docTypeBadgeClass(doc.docType)"
                >
                  {{ doc.docType }}
                </span>
            </td>

            <!-- 파일명 -->
            <td class="px-4 py-3.5">
              <div class="flex items-center gap-2">
                  <span
                      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      :class="fileIconColor(doc.fileExt)"
                  >
                    <component :is="fileIcon(doc.fileExt)" class="h-3.5 w-3.5" />
                  </span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-forena-900">{{ doc.fileName }}</p>
                  <p class="text-[10px] text-slate-400">{{ doc.fileSize }}</p>
                </div>
              </div>
            </td>

            <!-- 작성 주체 -->
            <td class="px-4 py-3.5">
              <div class="flex items-center gap-1.5">
                <template v-if="doc.origin === 'hq'">
                    <span class="flex h-5 w-5 items-center justify-center rounded bg-forena-100 text-forena-600">
                      <Building2 class="h-3 w-3" />
                    </span>
                  <span class="text-xs font-semibold text-forena-800">{{ L.originHq }}</span>
                </template>
                <template v-else>
                    <span class="flex h-5 w-5 items-center justify-center rounded bg-flare-100 text-flare-600">
                      <Handshake class="h-3 w-3" />
                    </span>
                  <span class="text-xs font-semibold text-flare-700">{{ doc.partnerName }}</span>
                </template>
              </div>
            </td>

            <!-- 문서 일자 -->
            <td class="px-4 py-3.5 text-xs text-slate-600">
              {{ formatDate(doc.docDate) }}
            </td>

            <!-- 업로드 일자 -->
            <td class="px-4 py-3.5 text-xs text-slate-500">
              {{ formatDate(doc.uploadDate) }}
            </td>

            <!-- 업로드자 -->
            <td class="px-4 py-3.5 text-xs text-slate-600">{{ doc.uploader }}</td>

            <!-- 액션 -->
            <td class="px-4 py-3.5 text-center">
              <div class="flex items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                    type="button"
                    class="rounded-lg p-1.5 text-slate-400 transition hover:bg-forena-50 hover:text-forena-700"
                    title="미리보기"
                >
                  <Eye class="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    class="rounded-lg p-1.5 text-slate-400 transition hover:bg-flare-50 hover:text-flare-700"
                    title="다운로드"
                >
                  <Download class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div class="flex flex-col items-center justify-between gap-3 border-t border-forena-50 px-6 py-4 sm:flex-row">
        <p class="text-xs text-slate-500">
          {{
            L.pageInfo
                .replace('{total}', filteredDocuments.length)
                .replace('{start}', pageStart)
                .replace('{end}', pageEnd)
          }}
        </p>
        <div class="flex items-center gap-1">
          <button
              type="button"
              class="rounded-lg border border-forena-200 p-2 text-forena-600 transition hover:bg-forena-50 disabled:opacity-40"
              :disabled="currentPage <= 1"
              @click="currentPage--"
          >
            <ChevronLeft class="h-3.5 w-3.5" />
          </button>
          <template v-for="p in totalPages" :key="p">
            <button
                type="button"
                class="h-8 w-8 rounded-lg text-xs font-bold transition"
                :class="
                p === currentPage
                  ? 'bg-forena-500 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-forena-50 hover:text-forena-800'
              "
                @click="currentPage = p"
            >
              {{ p }}
            </button>
          </template>
          <button
              type="button"
              class="rounded-lg border border-forena-200 p-2 text-forena-600 transition hover:bg-forena-50 disabled:opacity-40"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
          >
            <ChevronRight class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ 업로드 Drawer ═══ -->
    <Teleport to="body">
      <div
          v-if="showUploadDrawer"
          class="fixed inset-0 z-50 flex justify-end bg-forena-900/20 backdrop-blur-[2px]"
          @click.self="showUploadDrawer = false"
      >
        <aside
            class="flex h-full w-full max-w-md flex-col border-l border-forena-100 bg-white shadow-2xl animate-[drawerIn_0.25s_ease-out]"
            @click.stop
        >
          <div class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-4">
            <h2 class="text-lg font-bold text-forena-900">{{ L.drawerTitle }}</h2>
            <button
                type="button"
                class="rounded-lg border border-forena-200 bg-white p-2 text-forena-400 transition hover:text-forena-700"
                @click="showUploadDrawer = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="scrollbar-hide flex-1 space-y-5 overflow-y-auto p-6 text-sm">
            <!-- 파일 드롭존 -->
            <div
                class="relative rounded-xl border-2 border-dashed border-forena-200 p-6 text-center transition hover:border-flare-400/60"
                @dragover.prevent
                @drop="handleFileDrop"
            >
              <input
                  type="file"
                  class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  accept=".pdf,.xlsx,.xls,.docx,.hwp,.hwpx"
                  @change="handleFileChange"
              />
              <template v-if="!newDoc.fileName">
                <Upload class="mx-auto mb-2 h-8 w-8 text-flare-600" />
                <p class="font-bold text-forena-900">{{ L.labelFile }}</p>
                <p class="mt-1 text-[11px] text-slate-500">{{ L.fileHint }}</p>
                <p class="mt-1 text-[10px] font-medium text-slate-400">{{ L.fileFormats }}</p>
              </template>
              <template v-else>
                <div class="flex items-center justify-center gap-2">
                  <span
                      class="flex h-8 w-8 items-center justify-center rounded-lg"
                      :class="fileIconColor(newDoc.fileName.split('.').pop())"
                  >
                    <component :is="fileIcon(newDoc.fileName.split('.').pop())" class="h-4 w-4" />
                  </span>
                  <div class="text-left">
                    <p class="text-sm font-semibold text-forena-900">{{ newDoc.fileName }}</p>
                    <p class="text-[10px] text-slate-400">파일 선택 완료 — 다시 클릭하여 변경</p>
                  </div>
                </div>
              </template>
            </div>

            <!-- 문서 유형 -->
            <div>
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ L.labelDocType }}</label>
              <select
                  v-model="newDoc.docType"
                  class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  @change="onDocTypeChange"
              >
                <option value="" disabled>문서 유형을 선택하세요</option>
                <option v-for="dt in docTypes" :key="dt" :value="dt">{{ dt }}</option>
              </select>
            </div>

            <!-- 문서 일자 -->
            <div>
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ L.labelDocDate }}</label>
              <input
                  v-model="newDoc.docDate"
                  type="date"
                  class="w-full rounded-xl border border-forena-200 px-3 py-2.5 text-sm outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              />
            </div>

            <!-- 작성 주체 -->
            <div>
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ L.labelOrigin }}</label>
              <div class="flex gap-2">
                <button
                    type="button"
                    class="flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition"
                    :class="
                    newDoc.origin === 'hq'
                      ? 'border-forena-500 bg-forena-500 text-white shadow-sm'
                      : 'border-forena-200 text-slate-600 hover:border-forena-300 hover:bg-forena-50'
                  "
                    @click="newDoc.origin = 'hq'; newDoc.partnerName = ''"
                >
                  <div class="flex items-center justify-center gap-1.5">
                    <Building2 class="h-3.5 w-3.5" />
                    {{ L.originHq }}
                  </div>
                </button>
                <button
                    type="button"
                    class="flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition"
                    :class="
                    newDoc.origin === 'partner'
                      ? 'border-flare-500 bg-flare-500 text-white shadow-sm'
                      : 'border-forena-200 text-slate-600 hover:border-flare-300 hover:bg-flare-50'
                  "
                    @click="newDoc.origin = 'partner'"
                >
                  <div class="flex items-center justify-center gap-1.5">
                    <Handshake class="h-3.5 w-3.5" />
                    {{ L.originPartner }}
                  </div>
                </button>
              </div>
            </div>

            <!-- 협력사 선택 -->
            <div v-if="newDoc.origin === 'partner'">
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ L.labelPartnerName }}</label>
              <select
                  v-model="newDoc.partnerName"
                  class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              >
                <option value="" disabled>{{ L.labelPartnerSelect }}</option>
                <option v-for="pn in partnerList" :key="pn" :value="pn">{{ pn }}</option>
              </select>
            </div>

            <!-- 버전 + 비고 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ L.labelVersion }}</label>
                <input
                    v-model="newDoc.version"
                    type="text"
                    placeholder="v1.0"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 text-sm outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ L.labelMemo }}</label>
                <input
                    v-model="newDoc.memo"
                    type="text"
                    placeholder="비고 입력"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 text-sm outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                />
              </div>
            </div>

            <!-- 제출 -->
            <button
                type="button"
                :disabled="isSubmitting"
                class="w-full rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 py-3 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950 disabled:opacity-60"
                @click="submitUpload"
            >
              <span v-if="!isSubmitting">{{ L.submit }}</span>
              <Loader2 v-else class="mx-auto h-4 w-4 animate-spin" />
            </button>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes drawerIn {
  from {
    transform: translateX(100%);
    opacity: 0.96;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>