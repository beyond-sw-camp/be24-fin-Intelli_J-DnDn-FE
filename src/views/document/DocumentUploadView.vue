<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
  unit: '건',

  searchPh: '문서코드, 파일명, 협력사명 검색',
  excel: '종합 공사일보 PDF 다운로드',
  upload: '문서 업로드',
  filterLabel: '유형 필터',
  resetFilter: '필터 초기화',

  tabAll: '전체',
  tabWorkInstruction: '작업지시서',
  tabDailyReport: '작업 일보',
  tabMasterSchedule: '마스터 공정표',
  tabSubSchedule: '보할 공정표',
  tabMilestone: '마일스톤 공정표',
  tabConstructionPlan: '공종별 시공계획서',

  colDocCode: '문서 코드',
  colDocType: '문서 유형',
  colFileName: '파일명',
  colOrigin: '작성 주체',
  colUploadDate: '업로드 일자',
  colUploader: '업로드자',
  colStatus: '상태',
  colVersion: '버전',
  colSize: '파일 크기',
  colActions: '',

  originHq: '본사',
  originPartner: '협력사',

  statusApproved: '승인',
  statusRejected: '반려',
  statusDraft: '임시저장',

  empty: '조건에 맞는 문서가 없습니다.',

  drawerTitle: '문서 업로드',
  labelDocType: '문서 유형 *',
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
  L.tabConstructionPlan,
]

/* ── 문서 유형 → 기본 작성 주체 매핑 ── */
const defaultOriginMap = {
  [L.tabWorkInstruction]:  'hq',
  [L.tabDailyReport]:      'hq',
  [L.tabMasterSchedule]:   'hq',
  [L.tabMilestone]:        'hq',
  [L.tabSubSchedule]:      'hq',
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

/* ───── 문서 목록 (DB에서 로드) ───── */
const documents = ref([])
const pinnedDocuments = ref([])   // 고정 영역 데이터

/* ═══════════════════════════════════════════════════════════════
 * 백엔드 → 프론트 필드 매핑
 * ──────────────────────────────────────────────────────────────
 * 나중에 백엔드 JSON 형식이 바뀌면 이 함수만 수정하면 됩니다.
 * 프론트 필드에 매핑되지 않는 항목은 자동으로 빈 값 처리됩니다.
 * ═══════════════════════════════════════════════════════════════ */

/* ── docType enum → 프론트 라벨 매핑 (백엔드 DocType enum 기준) ── */
const DOC_TYPE_MAP = {
  'MASTER':      '마스터 공정표',
  'MILESTONE':   '마일스톤 공정표',
  'WEIGHT':      '보할 공정표',
  'TRADE_PLAN':  '공종별 시공계획서',
}

function mapApiToFront(apiDoc) {
  // DTO 필드: fileName → 파일명 추출
  const fileName = apiDoc.fileName || ''
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : ''

  // DTO 필드: createAt → 업로드 일자 (YYYY-MM-DD 형식으로 변환)
  const createAt = apiDoc.createAt || ''
  const uploadDate = createAt ? createAt.substring(0, 10) : ''

  // DTO 필드: isPartner (true: 협력사, false: 본사) → origin 변환
  const isPartner = apiDoc.isPartner ?? false
  const origin = isPartner ? 'partner' : 'hq'

  // DTO 필드: affiliationName → partnerName (협력사일 때만)
  const affiliationName = apiDoc.affiliationName || ''
  const partnerName = isPartner ? affiliationName : null

  return {
    id:          apiDoc.idx        ?? Date.now(),
    docCode:     '',  // DTO에 없음 - 백엔드에서 추가 예정이면 여기 수정
    docType:     DOC_TYPE_MAP[apiDoc.docType] ?? apiDoc.docType ?? '',
    fileName:    fileName,
    fileExt:     ext,
    fileUrl:     '',  // DTO에 없음 - 필요하면 백엔드에서 추가
    origin:      origin,
    partnerName: partnerName,
    uploadDate:  uploadDate,
    uploader:    apiDoc.name       ?? '',  // DTO 필드: name → 업로드자
    version:     'v1.0',       // DTO에 없으므로 기본값
    fileSize:    '',           // DTO에 없으므로 비워둠
  }
}

/* ── 백엔드 응답 배열 → 프론트 배열 변환 ── */
function mapApiListToFront(apiList) {
  return (apiList || []).map(mapApiToFront)
}

/* ── API 호출 (마운트 시 + 수동 새로고침) ── */
const API_BASE = 'http://localhost:8080'
const isLoading = ref(false)
const apiError = ref('')

async function fetchDocuments() {
  isLoading.value = true
  apiError.value = ''
  try {
    // 백엔드는 page를 0부터 시작 → currentPage(1부터) - 1
    const page = currentPage.value - 1
    const size = rowsPerPage.value

    const res = await fetch(
        `${API_BASE}/document-management/${currentProjectId.value}?page=${page}&size=${size}`
    )
    const json = await res.json()
    console.log('[API 응답]', json)

    if (json.success && json.data) {
      // 페이징 응답: { content: [...], totalElements, totalPages, ... }
      documents.value = mapApiListToFront(json.data.content)
      totalElementsFromServer.value = json.data.totalElements
      totalPagesFromServer.value = json.data.totalPages
    } else {
      documents.value = []
      totalElementsFromServer.value = 0
      totalPagesFromServer.value = 0
    }
  } catch (e) {
    apiError.value = '서버 연결 실패 — 데이터를 불러올 수 없습니다.'
    console.warn('[DocumentUpload] API fetch failed:', e)
    documents.value = []
  } finally {
    isLoading.value = false
  }
}

// 고정 영역(공정표 현황) 데이터 가져오기
async function fetchPinnedSchedules() {
  try {
    const res = await fetch(
        `${API_BASE}/document-management/${currentProjectId.value}/pinned`
    )
    const json = await res.json()
    console.log('[고정 영역 응답]', json)

    if (json.success && json.data) {
      pinnedDocuments.value = mapApiListToFront(json.data)
    } else {
      pinnedDocuments.value = []
    }
  } catch (e) {
    console.warn('[Pinned] API fetch failed:', e)
    pinnedDocuments.value = []
  }
}

onMounted(() => {
  fetchDocuments()
  fetchPinnedSchedules()
})

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
const totalElementsFromServer = ref(0)
const totalPagesFromServer = ref(0)


// 페이지 또는 페이지당 개수 변경 시 다시 불러오기
watch([currentPage, rowsPerPage], () => {
  fetchDocuments()
})


// 공정표 3종: 위쪽 고정 섹션에만 표시, 아래 테이블 탭에서는 제외
const SCHEDULE_TYPES = [L.tabMasterSchedule, L.tabSubSchedule, L.tabMilestone]
// 아래 테이블 탭: 공정표 3종 제외 (작업지시서·작업일보·공종별 시공계획서)
const TABLE_DOC_TYPES = [L.tabWorkInstruction, L.tabDailyReport, L.tabConstructionPlan]
const tabs = [L.tabAll, ...TABLE_DOC_TYPES]

/* ───── 새 문서 업로드 폼 ───── */
const newDoc = ref({
  docType: '',
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
}))

/* ───── 아래 테이블 전용: 공정표 3종 제외 ───── */
const tableDocuments = computed(() =>
    documents.value.filter((d) => !SCHEDULE_TYPES.includes(d.docType))
)

/* ───── 필터링 + 정렬 (공정표 3종 제외된 tableDocuments 기준) ───── */
const filteredDocuments = computed(() => {
  let result = [...tableDocuments.value]

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

  // 협력사 필터 (공종별 시공계획서 탭에서만)
  if (showPartnerFilter.value && partnerFilter.value) {
    result = result.filter((d) => d.partnerName === partnerFilter.value)
  }

  result.sort((a, b) => {
    const aVal = a[sortField.value] || ''
    const bVal = b[sortField.value] || ''
    const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    return sortDir.value === 'asc' ? cmp : -cmp
  })

  return result
})

/* ───── 페이지네이션 (서버 페이징 기준) ───── */
const totalPages = computed(() => totalPagesFromServer.value)
const paginatedDocuments = computed(() => filteredDocuments.value)  // 그대로 사용 (서버에서 이미 잘라옴)
const pageStart = computed(() =>
    totalElementsFromServer.value === 0
        ? 0
        : (currentPage.value - 1) * rowsPerPage.value + 1
)
const pageEnd = computed(() =>
    Math.min(currentPage.value * rowsPerPage.value, totalElementsFromServer.value)
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

/* ── 프론트 라벨 → 백엔드 enum 역매핑 ── */
const DOC_TYPE_REVERSE_MAP = {
  '마스터 공정표':       'MASTER',
  '마일스톤 공정표':     'MILESTONE',
  '보할 공정표':         'WEIGHT',
  '공종별 시공계획서':   'TRADE_PLAN',
}

/* ───── 현재 프로젝트 ID (실제로는 라우터 파라미터나 store에서 가져올 것) ───── */
const currentProjectId = ref(1)   // TODO: 실제 프로젝트 ID로 교체

const submitUpload = async () => {
  if (!newDoc.value.docType || !newDoc.value.file) {
    alert(L.alertFields)
    return
  }
  if (newDoc.value.origin === 'partner' && !newDoc.value.partnerName) {
    alert(L.alertFields)
    return
  }

  isSubmitting.value = true

  try {
    const formData = new FormData()

    // ★ 추가: projectId (백엔드 필수 파라미터)
    formData.append('projectId', currentProjectId.value)

    // file: 파일
    formData.append('file', newDoc.value.file)

    // docType: MASTER, MILESTONE, WEIGHT, TRADE_PLAN
    formData.append('docType', DOC_TYPE_REVERSE_MAP[newDoc.value.docType] || newDoc.value.docType)

    // isPartner: true(협력사) / false(본사)
    formData.append('isPartner', newDoc.value.origin === 'partner')

    // affiliationName: 본사 or 협력사명
    const affiliationName = newDoc.value.origin === 'hq' ? '본사' : newDoc.value.partnerName
    formData.append('affiliationName', affiliationName)

    // name: 작성자 이름 (추후 로그인 정보에서 가져올 것)
    formData.append('name', '김현장')

    // ※ docName 제거: 백엔드는 file.getOriginalFilename()으로 자동 추출

    const res = await fetch(`${API_BASE}/document-management/upload`, {
      method: 'POST',
      body: formData,
      // ※ Content-Type 은 직접 설정하지 않습니다.
      //    FormData 사용 시 브라우저가 boundary 까지 포함해 자동으로 설정해줍니다.
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      // 백엔드의 친절한 에러 메시지 표시
      throw new Error(json.message || `업로드 실패: ${res.status}`)
    }

    console.log('[업로드 응답]', json)

    // 업로드 성공 후 1페이지로 이동 + 목록 새로고침
    currentPage.value = 1
    await fetchDocuments()
    await fetchPinnedSchedules()

    showUploadDrawer.value = false
    alert(L.alertOk)

    // 폼 초기화
    newDoc.value = {
      docType: '',
      origin: 'hq',
      partnerName: '',
      version: 'v1.0',
      memo: '',
      file: null,
      fileName: '',
    }
  } catch (e) {
    console.error('[업로드 오류]', e)
    alert(`업로드 중 오류가 발생했습니다.\n${e.message}`)
  } finally {
    isSubmitting.value = false
  }
}

/* ───── 파일 다운로드 ───── */
const downloadFile = async (id, fileName) => {
  try {
    const res = await fetch(`${API_BASE}/document-management/download/${id}`)

    if (!res.ok) {
      throw new Error(`다운로드 실패: ${res.status}`)
    }

    // 응답을 Blob(바이너리)으로 받기
    const blob = await res.blob()

    // 임시 다운로드 링크 생성 후 자동 클릭
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'download'
    document.body.appendChild(a)
    a.click()

    // 정리
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (e) {
    console.error('[다운로드 오류]', e)
    alert(`다운로드 중 오류가 발생했습니다.\n${e.message}`)
  }
}

/* ───── 날짜 필터 (작업지시서·작업일보 탭 전용) ───── */
const dateFilterStart = ref('')
const dateFilterEnd = ref('')

const DATE_FILTER_TABS = [L.tabWorkInstruction, L.tabDailyReport]
const showDateFilter = computed(() => DATE_FILTER_TABS.includes(currentTab.value))

/* ───── 협력사 필터 (공종별 시공계획서 탭 전용) ───── */
const partnerFilter = ref('')
const showPartnerFilter = computed(() => currentTab.value === L.tabConstructionPlan)

const clearPartnerFilter = () => {
  partnerFilter.value = ''
  currentPage.value = 1
}

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
const PINNED_TYPES = [L.tabMasterSchedule, L.tabMilestone, L.tabSubSchedule]

const pinnedSchedules = computed(() =>
    PINNED_TYPES.map((type) => {
      const latest = pinnedDocuments.value
          .filter((d) => d.docType === type)
          .sort((a, b) => (b.docDate > a.docDate ? 1 : -1))[0] ?? null
      return { type, doc: latest }
    })
)




const pinnedStatusClass = (status) => {
  if (!status) return ''
  if (status === '승인')      return 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200/80'
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
  if (status === '반려')
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
}

const statusIcon = (status) => {
  if (status === '승인') return CircleCheck
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
    '작업지시서':        'bg-forena-50 text-forena-700 ring-forena-200/70',
    '작업 일보':         'bg-flare-50 text-flare-600 ring-flare-200/70',
    '마스터 공정표':     'bg-violet-50 text-violet-700 ring-violet-200/70',
    '마일스톤 공정표':   'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200/70',
    '보할 공정표':       'bg-indigo-50 text-indigo-700 ring-indigo-200/70',
    '공종별 시공계획서': 'bg-amber-50 text-amber-700 ring-amber-200/70',
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
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 ">
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
      <div class="grid grid-cols-[200px_minmax(200px,1fr)_160px_140px_140px] border-b border-forena-100 bg-forena-50/60 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-forena-500">
        <span class="text-left">문서 유형</span>
        <span class="text-left">파일명</span>
        <span class="text-center">문서 코드</span>
        <span class="text-center">업로드 일자</span>
        <span class="text-center">액션</span>
      </div>

      <!-- 리스트 행 -->
      <div
          v-for="item in pinnedSchedules"
          :key="item.type"
          class="group grid grid-cols-[200px_minmax(200px,1fr)_160px_140px_140px] items-center border-b border-forena-50 px-6 py-3.5 last:border-b-0 transition hover:bg-flare-50/40"
      >
        <!-- 문서 유형 -->
        <div class="flex items-center gap-2 text-left">
          <span class="flex h-6 w-6 shrink-0 items-center text-center justify-center rounded-lg bg-forena-50 text-forena-500">
            <FileText class="h-3.5 w-3.5" />
          </span>
          <span class="text-xs font-bold text-forena-800">{{ item.type }}</span>
        </div>

        <!-- 파일명 (없을 때) -->
        <div v-if="!item.doc" class="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <span class="italic">등록된 문서 없음</span>
        </div>

        <!-- 파일명 (있을 때) -->
        <div v-else class="flex min-w-0 items-center  gap-2 pr-4">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" :class="fileIconColor(item.doc.fileExt)">
            <component :is="fileIcon(item.doc.fileExt)" class="h-3 w-3" />
          </span>
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold text-forena-900">{{ item.doc.fileName }}</p>
            <p class="text-[10px] text-slate-400">{{ item.doc.fileSize }}</p>
          </div>
        </div>

        <!-- 문서 코드 -->
        <span class="text-center font-mono text-[11px] font-semibold text-forena-600">{{ item.doc?.docCode ?? '—' }}</span>

        <!-- 업로드 일자 -->
        <span class="text-center text-xs text-slate-500">{{ item.doc ? formatDate(item.doc.uploadDate) : '—' }}</span>

        <!-- 액션 -->
        <div class="flex items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button type="button"
                  class="rounded-lg p-1.5 text-slate-400 transition hover:bg-forena-50 hover:text-forena-700"
                  title="목록 보기" @click="jumpToTab(item.type)">
            <Eye class="h-5 w-5" />
          </button>
          <button v-if="item.doc" type="button"
                  class="rounded-lg p-2.5 text-slate-400 transition hover:bg-flare-50 hover:text-forena-700" title="다운로드"
                  @click="downloadFile(item.doc.id, item.doc.fileName)">
            <Download class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ 테이블 카드 ═══ -->
    <div
        class="relative overflow-hidden rounded-2xl border border-white/90 bg-white/90 shadow-card backdrop-blur-sm"
    >
      <div
          class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-forena-500 text-center to-flare-400 opacity-90"
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
            @click="currentTab = tab; currentPage = 1; clearDateFilter(); clearPartnerFilter()"
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

      <!-- 협력사 필터 (공종별 시공계획서 탭 전용) -->
      <div
          v-if="showPartnerFilter"
          class="flex flex-wrap items-center gap-2 border-b border-forena-50 bg-forena-50/40 px-6 py-3"
      >
        <Handshake class="h-3.5 w-3.5 shrink-0 text-forena-400" />
        <span class="text-[11px] font-bold text-forena-500 shrink-0">협력사 필터</span>
        <select
            v-model="partnerFilter"
            class="rounded-lg border border-forena-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
            @change="currentPage = 1"
        >
          <option value="">전체</option>
          <option v-for="pn in partnerList" :key="pn" :value="pn">{{ pn }}</option>
        </select>
        <button
            v-if="partnerFilter"
            type="button"
            class="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500 transition hover:bg-slate-50"
            @click="clearPartnerFilter"
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
            <th class="w-10 px-4 py-3.5 items-center text-center">
              <input
                  type="checkbox"
                  class="h-3.5 w-3.5 rounded border-forena-300 text-forena-600 accent-forena-600"
                  :checked="selectedRows.size === paginatedDocuments.length && paginatedDocuments.length > 0"
                  @change="toggleSelectAll"
              />
            </th>
            <th
                class="cursor-pointer px-4 py-3.5 font-semibold select-none text-center"
                @click="toggleSort('docCode')"
            >
                <span class="flex items-center justify-center gap-1">
                  {{ L.colDocCode }}
                  <ArrowUpDown class="h-3 w-3 text-slate-400" />
                </span>
            </th>
            <th class="px-4 py-3.5 font-semibold text-center">{{ L.colDocType }}</th>
            <th class="px-4 py-3.5 font-semibold text-left">{{ L.colFileName }}</th>
            <th class="px-4 py-3.5 font-semibold text-left">{{ L.colOrigin }}</th>
            <th
                class="cursor-pointer px-4 py-3.5 font-semibold select-none text-center"
                @click="toggleSort('uploadDate')"
            >
                <span class="flex items-center justify-center gap-1">
                  {{ L.colUploadDate }}
                  <ArrowUpDown class="h-3 w-3 text-slate-400" />
                </span>
            </th>
            <th class="px-4 py-3.5 font-semibold text-center">{{ L.colUploader }}</th>
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
            <td class="px-4 py-3.5 text-center">
              <input
                  type="checkbox"
                  class="h-3.5 w-3.5 rounded border-forena-300 text-forena-600 accent-forena-600"
                  :checked="selectedRows.has(doc.id)"
                  @change="toggleRow(doc.id)"
              />
            </td>

            <!-- 문서 코드 -->
            <td class="px-4 py-3.5 text-center">
              <span class="font-mono text-xs font-semibold text-forena-700">{{ doc.docCode }}</span>
            </td>

            <!-- 문서 유형 -->
            <td class="px-4 py-3.5 text-center">
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

            <!-- 업로드 일자 -->
            <td class="px-4 py-3.5 text-center text-xs text-slate-500">
              {{ formatDate(doc.uploadDate) }}
            </td>

            <!-- 업로드자 -->
            <td class="px-4 py-3.5 text-center text-xs text-slate-600">{{ doc.uploader }}</td>

            <!-- 액션 -->
            <td class="px-4 py-3.5 text-center">
              <div class="flex items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                    type="button"
                    class="rounded-lg p-2.5 text-slate-400 transition hover:bg-forena-50 hover:text-forena-700"
                    title="미리보기"
                >
                  <Eye class="h-5 w-5" />
                </button>
                <button
                    type="button"
                    class="rounded-lg p-2.5 text-slate-400 transition hover:bg-flare-50 hover:text-forena-700"
                    title="다운로드"
                    @click="downloadFile(doc.id, doc.fileName)"
                >
                  <Download class="h-5 w-5" />
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
                .replace('{total}', totalElementsFromServer)
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
            <div>
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