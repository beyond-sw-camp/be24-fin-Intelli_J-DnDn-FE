<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  CalendarDays, ChevronLeft, ChevronRight, FileText, Plus, Save, Upload,
  Image as ImageIcon, Paperclip, X, Users, Wrench, MapPin, ClipboardList,
  CheckCircle2, AlertTriangle, Clock, Send, Eye, Pencil, FileCheck2, Layers,
  ShieldCheck, UserCog, Trash2, Download
} from 'lucide-vue-next'

// =========================================================
// 권한 / 사용자 (데모용 토글)
// =========================================================
const ROLES = {
  MANAGER: 'site_manager',   // 현장 총 책임자
  WORKER:  'process_owner',  // 공정별 담당자
}
const currentRole = ref(ROLES.WORKER)
// 공정 담당자가 책임지는 공정 (담당자 시점에서만 의미 있음)
const myProcess = ref('철근')

const ALL_PROCESSES = ['토공', '골조', '철근', '전기', '설비', '마감']

const equipmentList = {
  '굴착·토공': ['굴삭기', '미니굴삭기', '백호', '드래그라인'],
  '운반': ['덤프트럭', '트럭 믹서', '트랙터', '트레일러', '스크레이퍼'],
  '하역·양중': ['타워크레인', '모바일 크레인', '크롤러 크레인', '지게차', '리프트'],
  '정지·다짐': ['불도저', '모터 그레이더', '롤러', '콤팩터'],
  '도로·포장': ['아스팔트 피니셔', '밀링 머신', '살수차', '노면 절단기'],
  '기초·파일': ['파일 드라이버', '보링머신', '어스오거', 'RCD'],
  '콘크리트': ['콘크리트 펌프카', '배치 플랜트', '바이브레이터'],
  '철거·특수': ['브레이커', '니블러', '크러셔', '고소작업차', 'TBM'],
}

// =========================================================
// 날짜 네비게이션
// =========================================================
function todayStr() { return new Date().toISOString().slice(0, 10) }
function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function fmtKor(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dow = ['일','월','화','수','목','금','토'][d.getDay()]
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${dow})`
}

const selectedDate = ref(todayStr())
const tomorrowDate = computed(() => addDays(selectedDate.value, 1))
function prevDay() { selectedDate.value = addDays(selectedDate.value, -1) }
function nextDay() { selectedDate.value = addDays(selectedDate.value, 1) }
function goToday() { selectedDate.value = todayStr() }
const isToday = computed(() => selectedDate.value === todayStr())

// =========================================================
// 본문 탭
// =========================================================
const activeTab = ref('today') // 'today' | 'tomorrow' | 'consolidated'
const modalTab = ref('today') // 'today' | 'tomorrow' (모달 내 탭)

// 책임자가 아닐 때 종합 탭에 있으면 today로 강제 이동
function switchTab(tab) {
  if (tab === 'consolidated' && currentRole.value !== ROLES.MANAGER) return
  activeTab.value = tab
}

// =========================================================
// 공사일보 데이터 (데모)
// =========================================================
// 상태: '작성 전' | '임시 저장' | '제출 완료' | '검토 중' | '승인 완료' | '반려'
// 완료 여부: '완료' | '미완료'
const reports = ref([
  {
    id: 'r_1', date: todayStr(), process: '토공',
    author: '김토공', location: 'B3층 동측 굴착 구역',
    workers: 14, equipmentCount: 3,
    equipmentList: ['굴삭기 1대', '덤프트럭 2대'],
    todayWork: '동측 토사 반출 80% 진행, 흙막이 변위 점검 완료',
    tomorrowPlan: '잔여 토사 반출 마무리, 굴착 바닥 정리',
    progress: 80, processProgress: 45, completion: '미완료',
    notes: '오후 강우 예보로 오전 집중 작업 예정',
    photos: [], files: [],
    status: '제출 완료', submittedAt: '2026-04-29 17:20',
  },
  {
    id: 'r_2', date: todayStr(), process: '골조',
    author: '박골조', location: '지상 4층 동·서측',
    workers: 22, equipmentCount: 2,
    equipmentList: ['타워크레인 1대', '콘크리트 펌프카 1대'],
    todayWork: '4층 슬라브 콘크리트 타설 완료 (320㎥)',
    tomorrowPlan: '4층 양생 관리, 5층 거푸집 시작',
    progress: 100, processProgress: 68, completion: '완료',
    notes: '타설 후 시험체 6개 채취 완료',
    photos: [], files: [],
    status: '승인 완료', submittedAt: '2026-04-29 16:45',
  },
  {
    id: 'r_3', date: todayStr(), process: '철근',
    author: '이철근', location: '본동 3층 슬라브',
    workers: 12, equipmentCount: 1,
    equipmentList: ['철근 절곡기 1대'],
    todayWork: '3층 슬라브 상부 철근 배근 70% 진행',
    tomorrowPlan: '3층 슬라브 상부 철근 배근 마무리, 검측 요청',
    progress: 70, processProgress: 52, completion: '미완료',
    notes: '',
    photos: [], files: [],
    status: '임시 저장', submittedAt: null,
  },
  {
    id: 'r_4', date: todayStr(), process: '전기',
    author: '최전기', location: 'B2층 전기실',
    workers: 6, equipmentCount: 1,
    equipmentList: ['고소작업대 1대'],
    todayWork: 'B2층 전기 배관 설치 60% 진행',
    tomorrowPlan: 'B2층 잔여 배관 설치, 배관 청소',
    progress: 60, processProgress: 38, completion: '미완료',
    notes: '천장 간섭 구간 1개소 협의 필요',
    photos: [], files: [],
    status: '제출 완료', submittedAt: '2026-04-29 17:05',
  },
  // 설비 / 마감 미제출 (현장 총 책임자가 미제출 확인용)
  // → reports 배열에 없음 = 작성 전
])

const STATUS_META = {
  '작성 전':   { cls: 'bg-slate-100 text-slate-500 ring-slate-200',         icon: Clock },
  '임시 저장': { cls: 'bg-amber-50 text-amber-700 ring-amber-200',          icon: Pencil },
  '제출 완료': { cls: 'bg-sky-50 text-sky-700 ring-sky-200',                icon: Send },
  '검토 중':   { cls: 'bg-violet-50 text-violet-700 ring-violet-200',       icon: Eye },
  '승인 완료': { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',    icon: CheckCircle2 },
  '반려':      { cls: 'bg-rose-50 text-rose-700 ring-rose-200',             icon: AlertTriangle },
}
function statusMeta(s) { return STATUS_META[s] || STATUS_META['작성 전'] }

// =========================================================
// 권한별로 보이는 공정 / 보고서
// =========================================================
const visibleProcesses = computed(() => {
  if (currentRole.value === ROLES.WORKER) return [myProcess.value]
  return ALL_PROCESSES
})

// 선택된 날짜 + 가시 공정 기준 보고서. 없는 공정은 "작성 전" placeholder 생성
function reportsForDate(dateStr) {
  return visibleProcesses.value.map(proc => {
    const found = reports.value.find(r => r.date === dateStr && r.process === proc)
    if (found) return found
    return {
      id: `placeholder_${proc}_${dateStr}`,
      date: dateStr, process: proc,
      author: '-', location: '-', workers: 0, equipmentCount: 0,
      equipmentList: [], todayWork: '', tomorrowPlan: '',
      progress: 0, processProgress: 0, completion: '미완료', notes: '',
      photos: [], files: [],
      status: '작성 전', submittedAt: null,
      _placeholder: true,
    }
  })
}

const todayReports = computed(() => reportsForDate(selectedDate.value))
const tomorrowReports = computed(() => reportsForDate(tomorrowDate.value))

// 책임자 대시보드 통계
const stats = computed(() => {
  const list = todayReports.value
  const total = list.length
  const submitted = list.filter(r => ['제출 완료','검토 중','승인 완료'].includes(r.status)).length
  const pending = list.filter(r => r.status === '작성 전' || r.status === '임시 저장').length
  const completed = list.filter(r => r.completion === '완료' && !r._placeholder).length
  const totalWorkers = list.reduce((s, r) => s + (r.workers || 0), 0)
  const totalEquip = list.reduce((s, r) => s + (r.equipmentCount || 0), 0)
  const avgProgress = total ? Math.round(list.reduce((s, r) => s + (r.progress || 0), 0) / total) : 0
  return { total, submitted, pending, completed, totalWorkers, totalEquip, avgProgress }
})

// =========================================================
// 작성/수정 모달
// =========================================================
const showEditor = ref(false)
const editingReport = ref(null) // 편집 중인 보고서 (drafts)
const isNewReport = ref(false)

function canEdit(report) {
  if (currentRole.value === ROLES.MANAGER) return false // 책임자는 조회만
  if (report.process !== myProcess.value) return false
  // 승인 완료된 건 수정 불가
  if (report.status === '승인 완료') return false
  return true
}

function openEditor(report) {
  // placeholder면 신규로 시작
  if (report._placeholder) {
    isNewReport.value = true
    editingReport.value = {
      id: `r_${Date.now()}`,
      date: report.date,
      process: report.process,
      author: '나(담당자)',
      location: '',
      workers: 0,
      equipmentCount: 0,
      equipmentList: [],
      equipmentInput: '',
      todayWork: '',
      tomorrowPlan: '',
      progress: 0,
      processProgress: 0,
      completion: '미완료',
      notes: '',
      photos: [],
      files: [],
      status: '작성 전',
      submittedAt: null,
    }
  } else {
    isNewReport.value = false
    // deep clone (사진/파일은 참조 유지하지 않도록 복제)
    editingReport.value = {
      ...report,
      equipmentList: [...(report.equipmentList || [])],
      equipmentInput: '',
      photos: (report.photos || []).map(p => ({ ...p })),
      files: (report.files || []).map(f => ({ ...f })),
    }
  }
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingReport.value = null
  modalTab.value = 'today'
}

function addEquipment() {
  const v = (editingReport.value.equipmentInput || '').trim()
  if (!v) return
  editingReport.value.equipmentList.push(v)
  editingReport.value.equipmentInput = ''
}
function removeEquipment(idx) {
  editingReport.value.equipmentList.splice(idx, 1)
}

// =========================================================
// 사진 / 파일 업로드 (FileReader 미리보기)
// =========================================================
const photoInputRef = ref(null)
const fileInputRef = ref(null)

function pickPhotos() { photoInputRef.value?.click() }
function pickFiles()  { fileInputRef.value?.click() }

function onPhotoChange(e) {
  const list = Array.from(e.target.files || [])
  list.forEach(f => {
    if (!f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      editingReport.value.photos.push({
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        name: f.name,
        size: f.size,
        dataUrl: ev.target.result,
      })
    }
    reader.readAsDataURL(f)
  })
  e.target.value = ''
}

function onFileChangeInput(e) {
  const list = Array.from(e.target.files || [])
  list.forEach(f => {
    editingReport.value.files.push({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      name: f.name,
      size: f.size,
      type: f.type,
    })
  })
  e.target.value = ''
}

function removePhoto(idx) { editingReport.value.photos.splice(idx, 1) }
function removeFile(idx)  { editingReport.value.files.splice(idx, 1) }
function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}
function fileBadge(type) {
  if (!type) return '파일'
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('sheet') || type.includes('excel')) return 'XLSX'
  if (type.includes('image')) return 'IMG'
  return '파일'
}

// =========================================================
// 임시저장 / 제출
// =========================================================
function saveDraft() {
  persistEditing('임시 저장')
  closeEditor()
}
function submitReport() {
  // 필수 검증
  const r = editingReport.value
  if (!r.location.trim()) {
    alert('작업 위치는 필수입니다.')
    return
  }
  if (!r.todayWork.trim()) {
    alert('금일 작업 완료 내용은 필수입니다.')
    return
  }
  if (!r.tomorrowPlan.trim()) {
    alert('명일 작업 예정은 필수입니다.')
    return
  }
  r.submittedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  persistEditing('제출 완료')
  closeEditor()
}

function persistEditing(newStatus) {
  const r = editingReport.value
  delete r.equipmentInput
  r.status = newStatus

  const idx = reports.value.findIndex(x => x.id === r.id)
  if (idx >= 0) reports.value.splice(idx, 1, { ...r })
  else reports.value.push({ ...r })
}

// =========================================================
// 책임자: 보고서 상세 보기 (조회 전용)
// =========================================================
const viewingReport = ref(null)
function openViewer(report) {
  if (report._placeholder) return
  viewingReport.value = report
}
function closeViewer() { viewingReport.value = null }

// 책임자 액션 (승인 / 반려 / 검토)
function approveReport() {
  if (!viewingReport.value) return
  const idx = reports.value.findIndex(r => r.id === viewingReport.value.id)
  if (idx >= 0) {
    reports.value[idx].status = '승인 완료'
    viewingReport.value = reports.value[idx]
  }
}
function rejectReport() {
  if (!viewingReport.value) return
  const idx = reports.value.findIndex(r => r.id === viewingReport.value.id)
  if (idx >= 0) {
    reports.value[idx].status = '반려'
    viewingReport.value = reports.value[idx]
  }
}

// ESC 닫기
function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (showEditor.value) closeEditor()
  else if (viewingReport.value) closeViewer()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 pb-6">

    <!-- ========== 헤더 ========== -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">현장 보고</p>
        <h1 class="text-xl font-bold text-forena-900">공사일보</h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- 권한 토글 (데모) -->
        <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="currentRole === ROLES.WORKER ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'"
            @click="currentRole = ROLES.WORKER; activeTab = 'today'">
            <UserCog class="h-3.5 w-3.5" /> 공정 담당자
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="currentRole === ROLES.MANAGER ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'"
            @click="currentRole = ROLES.MANAGER">
            <ShieldCheck class="h-3.5 w-3.5" /> 현장 총 책임자
          </button>
        </div>

        <!-- 담당자일 때만 담당 공정 셀렉트 -->
        <select v-if="currentRole === ROLES.WORKER" v-model="myProcess"
          class="rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400">
          <option v-for="p in ALL_PROCESSES" :key="p" :value="p">{{ p }} 공정</option>
        </select>
      </div>
    </div>

    <!-- ========== 권한 안내 배너 ========== -->
    <div v-if="currentRole === ROLES.WORKER"
      class="flex shrink-0 items-start gap-2.5 rounded-xl border border-flare-200 bg-flare-50/60 px-4 py-3">
      <UserCog class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <span class="font-bold text-flare-700">{{ myProcess }} 공정 담당자</span>입니다.
        담당 공정의 공사일보만 조회 · 작성 · 수정할 수 있습니다.
      </p>
    </div>
    <div v-else
      class="flex shrink-0 items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
      <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <span class="font-bold text-emerald-700">현장 총 책임자</span>입니다.
        전체 공정의 공사일보를 조회하고 종합 공사일보로 취합해 볼 수 있습니다.
      </p>
    </div>

    <!-- ========== 날짜 / 액션 바 ========== -->
    <div class="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-forena-100 bg-white px-4 py-3">
      <div class="flex items-center gap-1.5">
        <CalendarDays class="h-4 w-4 text-flare-600" />
        <span class="text-[11px] font-bold uppercase tracking-wide text-forena-500">조회 일자</span>
      </div>

      <div class="flex items-center gap-1">
        <button @click="prevDay"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 hover:bg-forena-50">
          <ChevronLeft class="h-3.5 w-3.5" />
        </button>
        <input type="date" v-model="selectedDate"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs font-semibold tabular-nums text-forena-800 outline-none focus:border-flare-400" />
        <button @click="nextDay"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 hover:bg-forena-50">
          <ChevronRight class="h-3.5 w-3.5" />
        </button>
        <button @click="goToday"
          class="ml-1 rounded-md border px-2 py-1 text-[10px] font-bold transition"
          :class="isToday ? 'border-flare-200 bg-flare-50 text-flare-700' : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'"
          :disabled="isToday">
          오늘
        </button>
      </div>

      <span class="text-xs font-semibold text-forena-700 tabular-nums">{{ fmtKor(selectedDate) }}</span>

      <div class="ml-auto flex items-center gap-2">
        <!-- 책임자 전용: 미제출 알림 -->
        <span v-if="currentRole === ROLES.MANAGER && stats.pending > 0"
          class="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200">
          <AlertTriangle class="h-3 w-3" />
          미제출 {{ stats.pending }}건
        </span>

        <!-- 담당자 전용: 작성/수정 버튼 -->
        <button v-if="currentRole === ROLES.WORKER"
          @click="openEditor(reportsForDate(selectedDate)[0])"
          class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-flare-600">
          <Plus class="h-3.5 w-3.5" />
          {{ reportsForDate(selectedDate)[0]?._placeholder ? '공사일보 작성' : '공사일보 수정' }}
        </button>
      </div>
    </div>

    <!-- ========== 책임자 전용: 요약 통계 ========== -->
    <div v-if="currentRole === ROLES.MANAGER"
      class="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <div class="rounded-xl border border-forena-100 bg-white p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">전체 공정</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-600">제출 완료</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{{ stats.submitted }}</p>
      </div>
      <div class="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-rose-600">미제출</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-rose-700">{{ stats.pending }}</p>
      </div>
      <div class="rounded-xl border border-forena-100 bg-white p-3.5">
        <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400">
          <Users class="h-3 w-3" /> 총 투입 인력
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">{{ stats.totalWorkers }}<span class="text-sm font-normal text-slate-400 ml-1">명</span></p>
      </div>
      <div class="rounded-xl border border-forena-100 bg-white p-3.5">
        <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400">
          <Wrench class="h-3 w-3" /> 총 투입 장비
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">{{ stats.totalEquip }}<span class="text-sm font-normal text-slate-400 ml-1">대</span></p>
      </div>
      <div class="rounded-xl border border-flare-100 bg-flare-50/40 p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-flare-600">평균 진척률</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-flare-700">{{ stats.avgProgress }}<span class="text-sm font-normal ml-0.5">%</span></p>
      </div>
    </div>

    <!-- ========== 탭 바 ========== -->
    <div class="flex shrink-0 items-center gap-1 border-b border-forena-100">
      <button
        class="border-b-2 px-4 py-2 text-xs font-bold transition"
        :class="activeTab === 'today' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'"
        @click="switchTab('today')">
        금일 공사일보
      </button>
      <button
        class="border-b-2 px-4 py-2 text-xs font-bold transition"
        :class="activeTab === 'tomorrow' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'"
        @click="switchTab('tomorrow')">
        명일 작업 예정
      </button>
      <button v-if="currentRole === ROLES.MANAGER"
        class="inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-bold transition"
        :class="activeTab === 'consolidated' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'"
        @click="switchTab('consolidated')">
        <Layers class="h-3.5 w-3.5" /> 종합 공사일보
      </button>
    </div>

    <!-- ========== 본문 ========== -->
    <div class="min-h-0 flex-1 overflow-y-auto">

      <!-- ============ 금일 공사일보 ============ -->
      <div v-if="activeTab === 'today'" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div v-for="r in todayReports" :key="r.id"
          class="flex flex-col rounded-xl border bg-white transition"
          :class="r._placeholder ? 'border-dashed border-forena-200' : 'border-forena-100 hover:border-flare-200 hover:shadow-sm'">

          <!-- 카드 헤더 -->
          <div class="flex items-start justify-between gap-3 border-b border-forena-100 px-4 py-3">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-bold text-forena-700">{{ r.process }} 공정</span>
                <span class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
                  :class="statusMeta(r.status).cls">
                  <component :is="statusMeta(r.status).icon" class="h-3 w-3" />
                  {{ r.status }}
                </span>
                <span v-if="!r._placeholder" class="rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
                  :class="r.completion === '완료' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'">
                  {{ r.completion }}
                </span>
              </div>
              <p class="mt-1.5 truncate text-sm font-bold text-forena-900">{{ r.location || '작업 위치 미입력' }}</p>
              <p class="mt-0.5 text-[11px] text-forena-400">
                작성자 {{ r.author }}<span v-if="r.submittedAt"> · 제출 {{ r.submittedAt }}</span>
              </p>
            </div>
            <div class="flex shrink-0 gap-1">
              <button v-if="!r._placeholder" @click="openViewer(r)"
                class="rounded-md border border-forena-200 bg-white p-1.5 text-forena-600 hover:bg-forena-50" title="상세 보기">
                <Eye class="h-3.5 w-3.5" />
              </button>
              <button v-if="canEdit(r)" @click="openEditor(r)"
                class="rounded-md border border-flare-200 bg-flare-50 p-1.5 text-flare-700 hover:bg-flare-100" title="수정">
                <Pencil class="h-3.5 w-3.5" />
              </button>
              <button v-if="r._placeholder && currentRole === ROLES.WORKER && r.process === myProcess"
                @click="openEditor(r)"
                class="inline-flex items-center gap-1 rounded-md bg-flare-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-flare-600">
                <Plus class="h-3 w-3" /> 작성
              </button>
            </div>
          </div>

          <!-- 카드 본문 -->
          <div v-if="!r._placeholder" class="flex-1 px-4 py-3">
            <!-- 메트릭 -->
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-lg bg-forena-50/40 px-2.5 py-2">
                <p class="flex items-center gap-1 text-[10px] font-bold text-forena-400">
                  <Users class="h-3 w-3" /> 인력
                </p>
                <p class="mt-0.5 text-base font-bold tabular-nums text-forena-900">
                  {{ r.workers }}<span class="text-[10px] font-normal text-slate-400 ml-0.5">명</span>
                </p>
              </div>
              <div class="rounded-lg bg-forena-50/40 px-2.5 py-2">
                <p class="flex items-center gap-1 text-[10px] font-bold text-forena-400">
                  <Wrench class="h-3 w-3" /> 장비
                </p>
                <p class="mt-0.5 text-base font-bold tabular-nums text-forena-900">
                  {{ r.equipmentCount }}<span class="text-[10px] font-normal text-slate-400 ml-0.5">대</span>
                </p>
              </div>
              <div class="rounded-lg bg-flare-50/60 px-2.5 py-2">
                <p class="text-[10px] font-bold text-flare-600">공정 진척률</p>
                <p class="mt-0.5 text-base font-bold tabular-nums text-flare-700">{{ r.processProgress }}<span class="text-[10px] font-normal ml-0.5">%</span></p>
              </div>
            </div>

            <!-- 진척바 -->
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
              <div class="h-full rounded-full bg-flare-500 transition-all"
                :style="{ width: r.processProgress + '%' }"></div>
            </div>

            <!-- 금일 작업 -->
            <div class="mt-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">금일 작업 완료</p>
              <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ r.todayWork || '—' }}</p>
            </div>
          </div>

          <!-- placeholder 상태 -->
          <div v-else class="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
            <FileText class="h-6 w-6 text-slate-300" />
            <p class="text-xs text-slate-400">
              {{ r.process }} 공정 공사일보가 아직 작성되지 않았습니다.
            </p>
          </div>
        </div>
      </div>

      <!-- ============ 명일 작업 예정 ============ -->
      <div v-else-if="activeTab === 'tomorrow'" class="space-y-3">
        <p class="text-xs text-forena-500">
          <span class="font-bold tabular-nums text-forena-700">{{ fmtKor(tomorrowDate) }}</span>
          기준 공정별 작업 예정 내용입니다.
        </p>
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div v-for="r in todayReports" :key="'tomorrow_' + r.id"
            class="rounded-xl border border-forena-100 bg-white p-4">
            <div class="flex items-center gap-1.5">
              <span class="rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-bold text-forena-700">{{ r.process }} 공정</span>
              <span v-if="r._placeholder" class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">계획 미작성</span>
            </div>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-wide text-forena-400">명일 작업 예정</p>
            <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ r.tomorrowPlan || '—' }}</p>
            <div class="mt-3 flex gap-3 text-[11px] text-forena-500">
              <span class="inline-flex items-center gap-1"><Users class="h-3 w-3" />예정 인력 {{ r.workers }}명</span>
              <span class="inline-flex items-center gap-1"><Wrench class="h-3 w-3" />예정 장비 {{ r.equipmentCount }}대</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 종합 공사일보 (책임자 전용) ============ -->
      <div v-else-if="activeTab === 'consolidated' && currentRole === ROLES.MANAGER" class="space-y-3">
        <div class="rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-3">
          <p class="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <FileCheck2 class="h-4 w-4" />
            {{ fmtKor(selectedDate) }} 종합 공사일보
          </p>
          <p class="mt-1 text-[11px] text-emerald-700">
            전체 {{ stats.total }}개 공정 중 <span class="font-bold">{{ stats.submitted }}건 제출 완료</span>,
            미제출 {{ stats.pending }}건. 평균 진척률 {{ stats.avgProgress }}%.
          </p>
        </div>

        <!-- 공정별 섹션 -->
        <div v-for="r in todayReports" :key="'consol_' + r.id"
          class="overflow-hidden rounded-xl border border-forena-100 bg-white">
          <div class="flex items-center justify-between border-b border-forena-100 bg-forena-50/40 px-4 py-2.5">
            <div class="flex items-center gap-2">
              <span class="rounded-md bg-forena-800 px-2 py-0.5 text-[11px] font-bold text-white">{{ r.process }}</span>
              <span class="text-sm font-bold text-forena-900">{{ r.location || '작업 위치 미입력' }}</span>
              <span class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
                :class="statusMeta(r.status).cls">
                <component :is="statusMeta(r.status).icon" class="h-3 w-3" />{{ r.status }}
              </span>
            </div>
            <span v-if="!r._placeholder" class="rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
              :class="r.completion === '완료' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'">
              {{ r.completion }}
            </span>
          </div>

          <div v-if="r._placeholder" class="px-4 py-6 text-center text-xs text-slate-400">
            아직 제출된 공사일보가 없습니다.
          </div>

          <div v-else class="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-3 md:grid-cols-2">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">금일 작업 완료</p>
              <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ r.todayWork }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">명일 작업 예정</p>
              <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ r.tomorrowPlan }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">투입 인력 / 장비</p>
              <p class="mt-1 text-xs text-forena-800">
                인력 <span class="font-bold tabular-nums">{{ r.workers }}명</span> ·
                장비 <span class="font-bold tabular-nums">{{ r.equipmentCount }}대</span>
                <span v-if="r.equipmentList.length" class="ml-1 text-forena-500">({{ r.equipmentList.join(', ') }})</span>
              </p>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">진척률</p>
              <div class="mt-1.5 flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-forena-100">
                  <div class="h-full rounded-full bg-flare-500" :style="{ width: r.processProgress + '%' }"></div>
                </div>
                <span class="text-xs font-bold tabular-nums text-flare-700">{{ r.processProgress }}%</span>
              </div>
            </div>
            <div v-if="r.notes" class="md:col-span-2">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">특이사항</p>
              <p class="mt-1 text-xs leading-relaxed text-forena-700">{{ r.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- =====================================================
         작성/수정 모달
         ===================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="showEditor && editingReport"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeEditor">
        <div class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <!-- 헤더 -->
          <div class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50">
                <ClipboardList class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">
                  {{ isNewReport ? '공사일보 작성' : '공사일보 수정' }}
                </p>
                <p class="mt-0.5 text-xs text-forena-500">
                  <span class="font-bold text-forena-700">{{ editingReport.process }} 공정</span>
                  · {{ fmtKor(editingReport.date) }} · 작성자 {{ editingReport.author }}
                </p>
              </div>
            </div>
            <button @click="closeEditor" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- 모달 탭 (금일/명일) -->
          <div class="flex shrink-0 items-center gap-1 border-b border-forena-100 bg-forena-50/30 px-6">
            <button
              class="border-b-2 px-3 py-2.5 text-xs font-bold transition"
              :class="modalTab === 'today' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'"
              @click="modalTab = 'today'">
              금일 공사 내용
            </button>
            <button
              class="border-b-2 px-3 py-2.5 text-xs font-bold transition"
              :class="modalTab === 'tomorrow' ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'"
              @click="modalTab = 'tomorrow'">
              명일 작업 예정
            </button>
          </div>

          <!-- 본문 (스크롤) -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <!-- 기본 정보 (모든 탭에서 공통) -->
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="sm:col-span-3">
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  <MapPin class="mr-0.5 inline h-3 w-3" />작업 위치 <span class="text-rose-500">*</span>
                </label>
                <input v-model="editingReport.location" placeholder="예: 본동 3층 슬라브"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  <Users class="mr-0.5 inline h-3 w-3" />작업 인력 수
                </label>
                <input type="number" min="0" v-model.number="editingReport.workers"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400" />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  <Wrench class="mr-0.5 inline h-3 w-3" />중장비 투입 수
                </label>
                <input type="number" min="0" v-model.number="editingReport.equipmentCount"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400" />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">완료 / 미완료</label>
                <select v-model="editingReport.completion"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400">
                  <option>미완료</option>
                  <option>완료</option>
                </select>
              </div>
            </div>

            <!-- 장비 목록 -->
            <div class="mt-4">
              <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">투입 장비 목록</label>
              <div class="flex gap-2">
                <select v-model="editingReport.equipmentInput"
                  class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">장비 선택</option>
                  <optgroup v-for="(items, category) in equipmentList" :key="category" :label="category">
                    <option v-for="equipment in items" :key="`${category}_${equipment}`" :value="equipment">
                      {{ equipment }}
                    </option>
                  </optgroup>
                </select>
                <button @click="addEquipment"
                  class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-xs font-bold text-flare-700 hover:bg-flare-100">
                  <Plus class="h-3 w-3" />추가
                </button>
              </div>
              <div v-if="editingReport.equipmentList.length" class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="(eq, i) in editingReport.equipmentList" :key="i"
                  class="inline-flex items-center gap-1 rounded-md bg-forena-50 px-2 py-0.5 text-[11px] font-semibold text-forena-700">
                  {{ eq }}
                  <button @click="removeEquipment(i)" class="text-slate-400 hover:text-rose-600">
                    <X class="h-3 w-3" />
                  </button>
                </span>
              </div>
            </div>

            <!-- ===== 금일 탭 ===== -->
            <div v-if="modalTab === 'today'" class="mt-6 space-y-4">
              <!-- 금일 작업 내용 -->
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  금일 작업 완료 내용 <span class="text-rose-500">*</span>
                </label>
                <textarea v-model="editingReport.todayWork" rows="4"
                  placeholder="오늘 완료한 작업 내용을 입력하세요"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"></textarea>
              </div>

              <!-- 금일 진척률 -->
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase tracking-wide text-forena-500">금일 진척률</label>
                  <span class="text-xs font-bold tabular-nums text-flare-700">{{ editingReport.progress }}%</span>
                </div>
                <div class="flex items-center gap-3">
                  <input type="range" min="0" max="100" step="1" v-model.number="editingReport.progress"
                    class="flex-1 accent-flare-500" />
                  <input type="number" min="0" max="100" v-model.number="editingReport.progress"
                    class="w-20 rounded-md border border-forena-200 bg-white px-2 py-1 text-xs tabular-nums outline-none focus:border-flare-400" />
                </div>
                <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
                  <div class="h-full rounded-full bg-flare-500 transition-all" :style="{ width: editingReport.progress + '%' }"></div>
                </div>
              </div>

              <!-- 공정 전체 진척률 -->
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase tracking-wide text-forena-500">공정 전체 진척률</label>
                  <span class="text-xs font-bold tabular-nums text-flare-700">{{ editingReport.processProgress }}%</span>
                </div>
                <div class="flex items-center gap-3">
                  <input type="range" min="0" max="100" step="1" v-model.number="editingReport.processProgress"
                    class="flex-1 accent-flare-500" />
                  <input type="number" min="0" max="100" v-model.number="editingReport.processProgress"
                    class="w-20 rounded-md border border-forena-200 bg-white px-2 py-1 text-xs tabular-nums outline-none focus:border-flare-400" />
                </div>
                <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
                  <div class="h-full rounded-full bg-flare-500 transition-all" :style="{ width: editingReport.processProgress + '%' }"></div>
                </div>
              </div>

              <!-- 특이사항 -->
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">특이사항</label>
                <textarea v-model="editingReport.notes" rows="2"
                  placeholder="안전, 기상, 협의사항 등"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"></textarea>
              </div>

              <!-- ====== 사진 첨부 ====== -->
              <div class="rounded-xl border border-forena-100 bg-forena-50/30 p-3.5">
                <div class="mb-2 flex items-center justify-between">
                  <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                    <ImageIcon class="h-3.5 w-3.5 text-flare-600" />
                    현장 사진 ({{ editingReport.photos.length }})
                  </p>
                  <button @click="pickPhotos"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100">
                    <Plus class="h-3 w-3" /> 사진 추가
                  </button>
                  <input ref="photoInputRef" type="file" class="sr-only"
                    accept="image/*" multiple @change="onPhotoChange" />
                </div>

                <!-- 미리보기 그리드 -->
                <div v-if="editingReport.photos.length"
                  class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  <div v-for="(photo, i) in editingReport.photos" :key="photo.id"
                    class="group relative aspect-square overflow-hidden rounded-lg border border-forena-200 bg-white">
                    <img :src="photo.dataUrl" :alt="photo.name"
                      class="h-full w-full object-cover" />
                    <button @click="removePhoto(i)"
                      class="absolute right-1 top-1 rounded-md bg-slate-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600"
                      title="삭제">
                      <Trash2 class="h-3 w-3" />
                    </button>
                    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-1.5 py-1">
                      <p class="truncate text-[9px] font-semibold text-white">{{ photo.name }}</p>
                      <p class="text-[9px] text-white/70">{{ fmtSize(photo.size) }}</p>
                    </div>
                  </div>
                </div>
                <div v-else
                  class="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-forena-200 bg-white py-6 text-center">
                  <ImageIcon class="h-5 w-5 text-slate-300" />
                  <p class="text-[11px] text-slate-400">현장 사진을 업로드하면 여기에 미리보기로 표시됩니다.</p>
                  <button @click="pickPhotos"
                    class="mt-1 inline-flex items-center gap-1 rounded-md bg-flare-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-flare-600">
                    <Upload class="h-3 w-3" /> 사진 선택
                  </button>
                </div>
              </div>

              <!-- ====== 일반 첨부 파일 ====== -->
              <div class="rounded-xl border border-forena-100 bg-forena-50/30 p-3.5">
                <div class="mb-2 flex items-center justify-between">
                  <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                    <Paperclip class="h-3.5 w-3.5 text-flare-600" />
                    첨부 파일 ({{ editingReport.files.length }})
                    <span class="ml-1 text-[10px] font-normal text-forena-400">PDF · Excel · 이미지</span>
                  </p>
                  <button @click="pickFiles"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100">
                    <Plus class="h-3 w-3" /> 파일 추가
                  </button>
                  <input ref="fileInputRef" type="file" class="sr-only"
                    accept=".pdf,.xls,.xlsx,.csv,image/*" multiple @change="onFileChangeInput" />
                </div>

                <ul v-if="editingReport.files.length" class="space-y-1.5">
                  <li v-for="(f, i) in editingReport.files" :key="f.id"
                    class="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-forena-100">
                    <span class="rounded-md bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700">{{ fileBadge(f.type) }}</span>
                    <span class="flex-1 truncate text-xs text-forena-800">{{ f.name }}</span>
                    <span class="shrink-0 text-[10px] text-forena-400 tabular-nums">{{ fmtSize(f.size) }}</span>
                    <button @click="removeFile(i)" class="text-slate-400 hover:text-rose-600">
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </li>
                </ul>
                <p v-else class="text-[11px] text-slate-400">첨부된 파일이 없습니다.</p>
              </div>
            </div>

            <!-- ===== 명일 탭 ===== -->
            <div v-else-if="modalTab === 'tomorrow'" class="mt-6 space-y-4">
              <!-- 명일 작업 예정 -->
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  명일 작업 예정 내용 <span class="text-rose-500">*</span>
                </label>
                <textarea v-model="editingReport.tomorrowPlan" rows="6"
                  placeholder="내일 진행 예정인 작업 내용을 입력하세요"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"></textarea>
              </div>

              <!-- 안내 텍스트 -->
              <div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p class="text-xs text-amber-900">
                  명일 작업 예정은 금일 공사일보 작성 시 입력됩니다. 내일 진행 예정인 작업 내용을 상세히 작성해주세요.
                </p>
              </div>
            </div>
          </div>

          <!-- 푸터 -->
          <div class="flex shrink-0 items-center justify-between gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3">
            <p class="text-[11px] text-forena-500">
              <span class="text-rose-500">*</span> 표시는 필수 입력 항목입니다.
            </p>
            <div class="flex gap-2">
              <button @click="closeEditor"
                class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50">
                취소
              </button>
              <button @click="saveDraft"
                class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">
                <Save class="h-3.5 w-3.5" /> 임시 저장
              </button>
              <button @click="submitReport"
                class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600">
                <Send class="h-3.5 w-3.5" /> 제출
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- =====================================================
         조회 모달 (책임자가 카드 눈 아이콘 누르면)
         ===================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="viewingReport"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeViewer">
        <div class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <!-- 헤더 -->
          <div class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forena-50">
                <FileText class="h-5 w-5 text-forena-700" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">{{ viewingReport.process }} 공정 공사일보</p>
                <p class="mt-0.5 text-xs text-forena-500">
                  {{ fmtKor(viewingReport.date) }} · 작성자 {{ viewingReport.author }}
                  <span v-if="viewingReport.submittedAt"> · 제출 {{ viewingReport.submittedAt }}</span>
                </p>
              </div>
            </div>
            <button @click="closeViewer" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- 본문 -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  <MapPin class="h-3 w-3" />작업 위치
                </p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ viewingReport.location }}</p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  <Users class="h-3 w-3" />작업 인력
                </p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
                  {{ viewingReport.workers }}<span class="text-sm font-normal text-slate-400 ml-1">명</span>
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  <Wrench class="h-3 w-3" />중장비
                </p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
                  {{ viewingReport.equipmentCount }}<span class="text-sm font-normal text-slate-400 ml-1">대</span>
                </p>
                <p v-if="viewingReport.equipmentList.length" class="mt-1 text-[11px] text-forena-500">
                  {{ viewingReport.equipmentList.join(', ') }}
                </p>
              </div>
            </div>

            <div class="mt-4">
              <div class="mb-1 flex items-center justify-between">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">공정 진척률</p>
                <span class="text-xs font-bold tabular-nums text-flare-700">{{ viewingReport.processProgress }}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-forena-100">
                <div class="h-full rounded-full bg-flare-500" :style="{ width: viewingReport.processProgress + '%' }"></div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-forena-100 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">금일 작업 완료</p>
                <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ viewingReport.todayWork }}</p>
              </div>
              <div class="rounded-xl border border-forena-100 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">명일 작업 예정</p>
                <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ viewingReport.tomorrowPlan }}</p>
              </div>
            </div>

            <div v-if="viewingReport.notes" class="mt-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5">
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-700">특이사항</p>
              <p class="mt-1 text-xs leading-relaxed text-amber-900">{{ viewingReport.notes }}</p>
            </div>

            <!-- 사진 -->
            <div v-if="viewingReport.photos?.length" class="mt-4">
              <p class="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                <ImageIcon class="h-3.5 w-3.5 text-flare-600" />
                현장 사진 ({{ viewingReport.photos.length }})
              </p>
              <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                <div v-for="photo in viewingReport.photos" :key="photo.id"
                  class="aspect-square overflow-hidden rounded-lg border border-forena-200 bg-white">
                  <img :src="photo.dataUrl" :alt="photo.name" class="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <!-- 첨부 -->
            <div v-if="viewingReport.files?.length" class="mt-4">
              <p class="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                <Paperclip class="h-3.5 w-3.5 text-flare-600" /> 첨부 파일
              </p>
              <ul class="space-y-1.5">
                <li v-for="f in viewingReport.files" :key="f.id"
                  class="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-forena-100">
                  <span class="rounded-md bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700">{{ fileBadge(f.type) }}</span>
                  <span class="flex-1 truncate text-xs text-forena-800">{{ f.name }}</span>
                  <span class="shrink-0 text-[10px] text-forena-400 tabular-nums">{{ fmtSize(f.size) }}</span>
                  <button class="rounded-md p-1 text-forena-400 hover:bg-forena-50 hover:text-forena-700">
                    <Download class="h-3.5 w-3.5" />
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- 푸터 (책임자 액션) -->
          <div v-if="currentRole === ROLES.MANAGER"
            class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3">
            <button @click="rejectReport"
              class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
              <AlertTriangle class="h-3.5 w-3.5" /> 반려
            </button>
            <button @click="approveReport"
              class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600">
              <CheckCircle2 class="h-3.5 w-3.5" /> 승인
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>