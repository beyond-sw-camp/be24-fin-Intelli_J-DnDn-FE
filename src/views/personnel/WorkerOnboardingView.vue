<script setup>
import { computed, ref } from 'vue'
import {
  UserPlus,
  Search,
  FileSpreadsheet,
  Plus,
  X,
  UploadCloud,
  AlertTriangle,
  Save,
  Users,
  FileWarning,
  Clock,
  UserCheck,
  Edit3,
  Upload,
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  ShieldCheck,
  FileText,
  ChevronRight,
  HardHat,
} from 'lucide-vue-next'

const currentView = ref('list')
const selectedWorker = ref(null)

const T = {
  kicker: '인사 관리',
  pageTitle: '작업자 인력 온보딩',
  heroDesc:
    '신규 인력 온보딩, 안전교육 · 필수 서류, 투입 가능 여부를 한 화면에서 관리합니다.',
  searchPh: '이름, 연락처, 직종 검색',
  partnerAll: '전체 협력사',
  excelBulk: '엑셀 파일 업로드',
  fileUpload: '파일 업로드',
  directEdit: '직접 수정',
  newWorker: '직접 등록',
  tabAll: '전체',
  tabDeploy: '투입 가능',
  tabReview: '검토 중',
  tabNoDoc: '서류 미제출',
  tabLimit: '투입 제한',
  colName: '이름 / 연락처',
  colAffil: '소속 / 직종',
  colSafety: '안전교육',
  colDocs: '필수 서류',
  colStatus: '현재 상태',
  modalEditTitle: '작업자 정보 직접 수정',
  saveChanges: '변경 저장',
  secEditStatus: '안전교육 · 서류 · 온보딩 상태',
  labelBirth: '생년월일',
  labelJoinDate: '투입 시작일',
  labelSafetyState: '안전교육 표기',
  labelDocsState: '필수 서류 표기',
  labelBadgeTone: '뱃지 톤',
  labelOnboardStatus: '온보딩 상태',
  alertEditRequired: '이름과 본인 연락처는 필수입니다.',
  alertEditOk: '작업자 정보가 저장되었습니다.',
  empty: '조건에 맞는 작업자가 없습니다.',
  modalTitle: '신규 작업자 온보딩 등록',
  secBasic: '1. 기본 인적 사항',
  secAffil: '2. 소속 및 서류 제출',
  labelName: '이름',
  phName: '이름 입력',
  labelBlood: '혈액형',
  labelPhone: '본인 연락처',
  phPhone: '010-0000-0000',
  labelEmergency: '비상 연락망',
  phEmergency: '가족 등 비상연락처',
  labelPartner: '소속 협력사',
  phPartner: '선택 (또는 직영)',
  labelJob: '담당 공종/직종',
  phJob: '예: 형틀, 보통인부',
  labelUpload: '안전교육 이수 및 신분증 (필수 서류)',
  uploadHint: '클릭하거나 파일을 드래그하여 업로드',
  uploadFormats: 'PDF, JPG, PNG 형식 지원 (최대 10MB)',
  chkEdu: '기초안전보건교육 이수 여부를 확인했습니다.',
  submit: '등록 및 서류 검토 요청',
  cancel: '취소',
  alertRequired: '필수 항목을 모두 입력하고, 교육 이수 확인에 체크해주세요.',
  alertOk: '온보딩 등록 요청이 접수되었습니다. 검토 중 상태로 등록되었습니다.',
  excelSoon: '엑셀 일괄 등록 기능을 준비 중입니다.',
}

const partnerFilterOptions = [
  { value: '', label: T.partnerAll },
  { value: '태양건설', label: '태양건설' },
  { value: '우주산업', label: '우주산업' },
  { value: '개인', label: '개인' },
]

const bloodOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

const workerStatusOptions = [
  { key: 'deployable', label: '투입 가능' },
  { key: 'review', label: '검토 중' },
  { key: 'nodoc', label: '서류 미제출' },
  { key: 'limit', label: '투입 제한' },
]

const badgeToneOptions = [
  { value: 'success', label: '성공(녹색)' },
  { value: 'danger', label: '위험(적색)' },
  { value: 'warning', label: '경고(황색)' },
  { value: 'info', label: '정보(청색)' },
  { value: 'neutral', label: '중립(회색)' },
]

function statusMetaFromKey(key) {
  const map = {
    deployable: { text: '투입 가능', tone: 'success' },
    review: { text: '검토 중', tone: 'info' },
    nodoc: { text: '서류 미제출', tone: 'warning' },
    limit: { text: '투입 제한', tone: 'danger' },
  }
  return map[key] || map.review
}

function emptyEditForm() {
  return {
    id: null,
    name: '',
    phone: '',
    company: '',
    job: '',
    bloodType: 'A+',
    birth: '',
    joinDate: '',
    emergency: '',
    safetyText: '',
    safetyTone: 'success',
    docsText: '',
    docsTone: 'neutral',
    statusKey: 'review',
  }
}

const workers = ref([
  {
    id: 1,
    name: '김동석',
    phone: '010-1234-5678',
    company: '태양건설',
    job: '형틀목수',
    bloodType: 'A+',
    birth: '1982.05.12',
    joinDate: '2024.03.10',
    emergency: '010-1111-2222 (배우자)',
    safety: { text: '이수완료', tone: 'success' },
    docs: { text: '완료', tone: 'neutral' },
    status: { text: '투입 가능', tone: 'success' },
    statusKey: 'deployable',
  },
  {
    id: 2,
    name: '이만수',
    phone: '010-9876-5432',
    company: '우주산업',
    job: '철근공',
    bloodType: 'B+',
    birth: '1975.11.20',
    joinDate: '2024.03.15',
    emergency: '010-3333-4444 (자녀)',
    safety: { text: '미이수', tone: 'danger' },
    docs: { text: '검토 중', tone: 'warning' },
    status: { text: '검토 중', tone: 'info' },
    statusKey: 'review',
  },
  {
    id: 3,
    name: '박지훈',
    phone: '010-5555-4444',
    company: '개인',
    job: '보통인부',
    bloodType: 'O+',
    birth: '1990.01.05',
    joinDate: '2024.03.20',
    emergency: '010-9999-8888 (모친)',
    safety: { text: '이수완료', tone: 'success' },
    docs: { text: '미제출', tone: 'warning' },
    status: { text: '서류 미제출', tone: 'warning' },
    statusKey: 'nodoc',
  },
  {
    id: 4,
    name: '최용호',
    phone: '010-1111-2222',
    company: '태양건설',
    job: '비계공',
    bloodType: 'AB+',
    birth: '1988.07.22',
    joinDate: '2024.04.01',
    emergency: '010-7777-8888 (형)',
    safety: { text: '이수완료', tone: 'success' },
    docs: { text: '완료', tone: 'neutral' },
    status: { text: '투입 제한', tone: 'danger' },
    statusKey: 'limit',
  },
])

const searchQuery = ref('')
const partnerFilter = ref('')
const statusTab = ref('all')

const filteredWorkers = computed(() => {
  let list = workers.value
  if (partnerFilter.value) {
    list = list.filter((w) => w.company === partnerFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim()
    const qn = q.replace(/-/g, '')
    list = list.filter(
      (w) =>
        w.name.includes(q) ||
        w.phone.replace(/-/g, '').includes(qn) ||
        w.job.includes(q) ||
        w.company.includes(q),
    )
  }
  if (statusTab.value === 'deployable') list = list.filter((w) => w.statusKey === 'deployable')
  if (statusTab.value === 'review') list = list.filter((w) => w.statusKey === 'review')
  if (statusTab.value === 'nodoc') list = list.filter((w) => w.statusKey === 'nodoc')
  if (statusTab.value === 'limit') list = list.filter((w) => w.statusKey === 'limit')
  return list
})

const tabCounts = computed(() => {
  const base = workers.value.filter((w) => {
    if (partnerFilter.value && w.company !== partnerFilter.value) return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim()
      const qn = q.replace(/-/g, '')
      if (
        !w.name.includes(q) &&
        !w.phone.replace(/-/g, '').includes(qn) &&
        !w.job.includes(q) &&
        !w.company.includes(q)
      ) {
        return false
      }
    }
    return true
  })
  return {
    all: base.length,
    deployable: base.filter((w) => w.statusKey === 'deployable').length,
    review: base.filter((w) => w.statusKey === 'review').length,
    nodoc: base.filter((w) => w.statusKey === 'nodoc').length,
    limit: base.filter((w) => w.statusKey === 'limit').length,
  }
})

const statusTabs = computed(() => [
  { key: 'all', label: `${T.tabAll} (${tabCounts.value.all})` },
  { key: 'deployable', label: `${T.tabDeploy} (${tabCounts.value.deployable})` },
  { key: 'review', label: `${T.tabReview} (${tabCounts.value.review})` },
  { key: 'nodoc', label: `${T.tabNoDoc} (${tabCounts.value.nodoc})` },
  { key: 'limit', label: `${T.tabLimit} (${tabCounts.value.limit})` },
])

const stats = computed(() => ({
  total: workers.value.length,
  noDoc: workers.value.filter((w) => w.statusKey === 'nodoc').length,
  review: workers.value.filter((w) => w.statusKey === 'review').length,
  deploying: workers.value.filter((w) => w.statusKey === 'deployable').length,
  available: workers.value.filter((w) => w.statusKey === 'deployable' || w.statusKey === 'review')
    .length,
}))

function goProfile(worker) {
  selectedWorker.value = worker
  currentView.value = 'profile'
}

function goList() {
  currentView.value = 'list'
  selectedWorker.value = null
}

function badgeToneClass(tone) {
  if (tone === 'success') return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
  if (tone === 'danger') return 'bg-rose-50 text-rose-800 ring-rose-200/80'
  if (tone === 'warning') return 'bg-amber-50 text-amber-900 ring-amber-200/80'
  if (tone === 'info') return 'bg-sky-50 text-sky-800 ring-sky-200/80'
  return 'bg-slate-100 text-slate-700 ring-slate-200/80'
}

function initialFromName(name) {
  return name ? name.charAt(0) : '?'
}

function onExcelBulk() {
  window.alert(T.excelSoon)
}

const showOnboardModal = ref(false)
const onboardForm = ref({
  name: '',
  bloodType: 'A+',
  phone: '',
  emergency: '',
  partner: '',
  job: '',
  confirmEducation: false,
})
const onboardFileName = ref('')

function openOnboardModal() {
  showOnboardModal.value = true
  onboardFileName.value = ''
}

function closeOnboardModal() {
  showOnboardModal.value = false
}

function resetOnboardForm() {
  onboardForm.value = {
    name: '',
    bloodType: 'A+',
    phone: '',
    emergency: '',
    partner: '',
    job: '',
    confirmEducation: false,
  }
  onboardFileName.value = ''
}

function onOnboardFileChange(e) {
  const f = e.target.files?.[0]
  onboardFileName.value = f ? f.name : ''
}

function todayJoinDate() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const showEditModal = ref(false)
const editForm = ref(emptyEditForm())

function openEditWorkerModal(worker) {
  editForm.value = {
    id: worker.id,
    name: worker.name,
    phone: worker.phone,
    company: worker.company,
    job: worker.job,
    bloodType: worker.bloodType,
    birth: worker.birth,
    joinDate: worker.joinDate,
    emergency: worker.emergency,
    safetyText: worker.safety.text,
    safetyTone: worker.safety.tone,
    docsText: worker.docs.text,
    docsTone: worker.docs.tone,
    statusKey: worker.statusKey,
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

function submitEditWorker() {
  const f = editForm.value
  if (!f.id || !f.name.trim() || !f.phone.trim()) {
    window.alert(T.alertEditRequired)
    return
  }
  const st = statusMetaFromKey(f.statusKey)
  const updated = {
    id: f.id,
    name: f.name.trim(),
    phone: f.phone.trim(),
    company: (f.company || '').trim(),
    job: f.job.trim(),
    bloodType: f.bloodType,
    birth: (f.birth || '').trim() || '—',
    joinDate: (f.joinDate || '').trim() || '—',
    emergency: (f.emergency || '').trim() || '—',
    safety: { text: (f.safetyText || '').trim() || '—', tone: f.safetyTone },
    docs: { text: (f.docsText || '').trim() || '—', tone: f.docsTone },
    status: { text: st.text, tone: st.tone },
    statusKey: f.statusKey,
  }
  workers.value = workers.value.map((w) => (w.id === f.id ? updated : w))
  if (selectedWorker.value?.id === f.id) {
    selectedWorker.value = updated
  }
  window.alert(T.alertEditOk)
  closeEditModal()
}

function submitOnboard() {
  const f = onboardForm.value
  if (!f.name.trim() || !f.phone.trim() || !f.emergency.trim() || !f.partner || !f.job.trim()) {
    window.alert(T.alertRequired)
    return
  }
  if (!f.confirmEducation) {
    window.alert(T.alertRequired)
    return
  }
  const companyLabel =
    f.partner === 'direct'
      ? '직영'
      : (partnerFilterOptions.find((p) => p.value === f.partner)?.label ?? f.partner)
  const nextId = Math.max(0, ...workers.value.map((w) => w.id)) + 1
  workers.value = [
    ...workers.value,
    {
      id: nextId,
      name: f.name.trim(),
      phone: f.phone.trim(),
      company: companyLabel,
      job: f.job.trim(),
      bloodType: f.bloodType,
      birth: '—',
      joinDate: todayJoinDate(),
      emergency: f.emergency.trim(),
      safety: { text: '이수완료', tone: 'success' },
      docs: { text: '검토 중', tone: 'warning' },
      status: { text: '검토 중', tone: 'info' },
      statusKey: 'review',
    },
  ]
  window.alert(T.alertOk)
  closeOnboardModal()
  resetOnboardForm()
}
</script>

<template>
  <div class="mx-auto max-w-[1600px] px-4 pb-20">
    <div
      v-if="currentView === 'list'"
      class="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500"
    >
      <div
        class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
        />
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
            >
              <UserPlus class="h-5 w-5" />
            </span>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">
                {{ T.kicker }}
              </p>
              <h1 class="text-xl font-bold tracking-tight text-forena-900">{{ T.pageTitle }}</h1>
              <p class="mt-2 max-w-3xl text-sm leading-relaxed text-forena-700/80">
                {{ T.heroDesc }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 sm:justify-end">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-200/60 transition hover:bg-emerald-100"
              @click="onExcelBulk"
            >
              <FileSpreadsheet class="h-4 w-4" /> {{ T.excelBulk }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-[13px] font-bold text-sky-700 shadow-sm ring-1 ring-sky-200/60 transition hover:bg-sky-100"
            >
              <Upload class="h-4 w-4" /> {{ T.fileUpload }}
            </button>
            <div class="mx-1 hidden h-8 w-px bg-forena-200/60 sm:block" />
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-forena-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-forena-800"
              @click="openOnboardModal"
            >
              <Plus class="h-4 w-4" /> {{ T.newWorker }}
            </button>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flare-500/80"
            />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="T.searchPh"
              class="w-full rounded-xl border border-forena-200 bg-white py-2.5 pr-4 pl-9 text-sm outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
            />
          </div>
          <select
            v-model="partnerFilter"
            class="rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm font-semibold text-forena-900 sm:w-44"
          >
            <option v-for="opt in partnerFilterOptions" :key="opt.value || 'all'" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div
          class="group relative overflow-hidden rounded-2xl border border-forena-100/90 bg-white p-5 shadow-card transition-all hover:translate-y-[-2px]"
        >
          <div class="absolute inset-x-0 top-0 h-[2px] bg-forena-500/10" />
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-forena-50 to-forena-100 text-forena-600 shadow-sm"
            >
              <Users class="h-5 w-5" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-forena-400">
                전체 작업자
              </p>
              <p class="mt-0.5 text-2xl font-black tracking-tight text-forena-900">
                {{ stats.total }}<span class="ml-1 text-xs font-semibold text-slate-400">명</span>
              </p>
            </div>
          </div>
        </div>
        <div
          class="relative overflow-hidden rounded-2xl border border-rose-100/80 bg-rose-50/20 p-5 shadow-card transition-all hover:translate-y-[-2px]"
        >
          <div class="absolute inset-x-0 top-0 h-[2px] bg-rose-500/20" />
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/80 text-rose-600 shadow-sm"
            >
              <FileWarning class="h-5 w-5" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-rose-500/70">
                서류 미제출
              </p>
              <p class="mt-0.5 text-2xl font-black tracking-tight text-rose-700">
                {{ stats.noDoc }}<span class="ml-1 text-xs font-semibold text-rose-300">명</span>
              </p>
            </div>
          </div>
        </div>
        <div
          class="relative overflow-hidden rounded-2xl border border-amber-100/80 bg-amber-50/20 p-5 shadow-card transition-all hover:translate-y-[-2px]"
        >
          <div class="absolute inset-x-0 top-0 h-[2px] bg-amber-500/20" />
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/80 text-amber-600 shadow-sm"
            >
              <Clock class="h-5 w-5" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-amber-600/70">
                승인 대기중
              </p>
              <p class="mt-0.5 text-2xl font-black tracking-tight text-amber-700">
                {{ stats.review }}<span class="ml-1 text-xs font-semibold text-amber-300">명</span>
              </p>
            </div>
          </div>
        </div>
        <div
          class="relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-emerald-50/20 p-5 shadow-card transition-all hover:translate-y-[-2px]"
        >
          <div class="absolute inset-x-0 top-0 h-[2px] bg-emerald-500/20" />
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 text-emerald-600 shadow-sm"
            >
              <UserCheck class="h-5 w-5" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">
                현장 투입인원
              </p>
              <p class="mt-0.5 text-2xl font-black tracking-tight text-emerald-700">
                {{ stats.deploying
                }}<span class="ml-1 text-xs font-semibold text-emerald-300">명</span>
              </p>
            </div>
          </div>
        </div>
        <div
          class="relative overflow-hidden rounded-2xl border border-flare-100/80 bg-flare-50/20 p-5 shadow-card transition-all hover:translate-y-[-2px]"
        >
          <div class="absolute inset-x-0 top-0 h-[2px] bg-flare-400/20" />
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-50 to-flare-100/80 text-flare-600 shadow-sm"
            >
              <UserPlus class="h-5 w-5" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-flare-600/70">
                투입 가능인원
              </p>
              <p class="mt-0.5 text-2xl font-black tracking-tight text-flare-700">
                {{ stats.available
                }}<span class="ml-1 text-xs font-semibold text-flare-300">명</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white shadow-card">
        <div class="border-b border-forena-100 bg-forena-50/40 px-4 py-3 sm:px-5">
          <div
            class="flex flex-wrap gap-1 rounded-xl bg-forena-100/50 p-1 ring-1 ring-forena-200/60"
            role="tablist"
          >
            <button
              v-for="tab in statusTabs"
              :key="tab.key"
              type="button"
              role="tab"
              :aria-selected="statusTab === tab.key"
              class="min-w-0 shrink-0 rounded-lg px-3 py-2 text-center text-xs font-semibold transition sm:px-4 sm:text-sm"
              :class="
                statusTab === tab.key
                  ? 'bg-white text-forena-900 shadow-sm ring-1 ring-forena-200/80'
                  : 'text-slate-600 hover:bg-white/70 hover:text-forena-900'
              "
              @click="statusTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead
              class="border-b border-forena-100 bg-forena-50/60 text-[11px] font-bold uppercase tracking-wider text-forena-500"
            >
              <tr>
                <th class="px-5 py-3.5 font-semibold">{{ T.colName }}</th>
                <th class="px-5 py-3.5 font-semibold">{{ T.colAffil }}</th>
                <th class="px-5 py-3.5 text-center font-semibold">{{ T.colSafety }}</th>
                <th class="px-5 py-3.5 text-center font-semibold">{{ T.colDocs }}</th>
                <th class="px-5 py-3.5 text-center font-semibold">{{ T.colStatus }}</th>
                <th class="px-5 py-3.5 text-center font-semibold">{{ T.directEdit }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-forena-50">
              <tr v-if="filteredWorkers.length === 0">
                <td colspan="6" class="px-5 py-14 text-center text-sm text-slate-400">
                  {{ T.empty }}
                </td>
              </tr>
              <tr
                v-for="w in filteredWorkers"
                :key="w.id"
                class="transition hover:bg-flare-50/40"
              >
                <td class="px-5 py-4">
                  <button
                    type="button"
                    class="flex w-full max-w-md cursor-pointer items-center gap-3 rounded-xl text-left transition hover:bg-forena-50/80"
                    @click="goProfile(w)"
                  >
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forena-600 to-forena-800 text-sm font-bold text-white"
                      >{{ initialFromName(w.name) }}</span
                    >
                    <div class="min-w-0">
                      <p class="font-semibold text-forena-900">{{ w.name }}</p>
                      <p class="text-[11px] text-slate-500">{{ w.phone }}</p>
                    </div>
                  </button>
                </td>
                <td class="px-5 py-4">
                  <p class="font-medium text-forena-900">{{ w.company }}</p>
                  <p class="text-xs font-semibold text-flare-700">{{ w.job }}</p>
                </td>
                <td class="px-5 py-4 text-center">
                  <span
                    class="inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold ring-1"
                    :class="badgeToneClass(w.safety.tone)"
                    >{{ w.safety.text }}</span
                  >
                </td>
                <td class="px-5 py-4 text-center">
                  <span
                    class="inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold ring-1"
                    :class="badgeToneClass(w.docs.tone)"
                    >{{ w.docs.text }}</span
                  >
                </td>
                <td class="px-5 py-4 text-center">
                  <span
                    class="inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold ring-1"
                    :class="badgeToneClass(w.status.tone)"
                    >{{ w.status.text }}</span
                  >
                </td>
                <td class="px-5 py-4 text-center">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-[11px] font-bold text-forena-700 shadow-sm transition hover:border-flare-300 hover:bg-flare-50/50"
                    @click="openEditWorkerModal(w)"
                  >
                    <Edit3 class="h-3.5 w-3.5" />
                    {{ T.directEdit }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-else-if="currentView === 'profile' && selectedWorker"
      class="animate-in fade-in slide-in-from-right-4 space-y-6 pt-8 duration-500"
    >
      <div class="flex items-center justify-between">
        <button
          type="button"
          class="group flex items-center gap-2 rounded-xl border border-forena-200 bg-white px-4 py-2 text-sm font-bold text-forena-700 shadow-sm transition hover:bg-forena-50 active:scale-95"
          @click="goList"
        >
          <ArrowLeft class="h-4 w-4 transition group-hover:-translate-x-1" /> 목록으로 돌아가기
        </button>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-xl border border-forena-200 bg-white px-4 py-2 text-sm font-bold text-forena-600 transition hover:bg-forena-50"
          >
            인쇄
          </button>
          <button
            type="button"
            class="rounded-xl bg-forena-900 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-forena-800"
            @click="openEditWorkerModal(selectedWorker)"
          >
            정보 수정
          </button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-1">
          <div class="rounded-2xl border border-forena-100 bg-white p-6 text-center shadow-card">
            <div
              class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-forena-700 to-forena-900 text-3xl font-black text-white shadow-lg ring-4 ring-forena-50"
            >
              {{ selectedWorker.name.charAt(0) }}
            </div>
            <h2 class="mt-4 text-2xl font-bold text-forena-900">{{ selectedWorker.name }}</h2>
            <p class="text-sm font-bold text-flare-600">{{ selectedWorker.job }}</p>
            <div class="mt-2 flex justify-center">
              <span
                class="rounded-full px-3 py-1 text-[11px] font-bold ring-1"
                :class="badgeToneClass(selectedWorker.status.tone)"
                >{{ selectedWorker.status.text }}</span
              >
            </div>

            <div class="mt-8 grid grid-cols-2 gap-4 border-t border-forena-50 pt-6 text-left">
              <div class="space-y-1">
                <p class="text-[10px] font-bold uppercase tracking-wider text-forena-400">혈액형</p>
                <p class="text-sm font-bold text-forena-800">{{ selectedWorker.bloodType }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-[10px] font-bold uppercase tracking-wider text-forena-400">생년월일</p>
                <p class="text-sm font-bold text-forena-800">{{ selectedWorker.birth }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4 rounded-2xl border border-forena-100 bg-white p-6 shadow-card">
            <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
              <Phone class="h-4 w-4 text-flare-500" /> 연락처 정보
            </h3>
            <div class="space-y-3">
              <div class="rounded-xl bg-forena-50 p-3">
                <p class="text-[10px] font-bold uppercase text-forena-400">본인 연락처</p>
                <p class="text-sm font-bold text-forena-800">{{ selectedWorker.phone }}</p>
              </div>
              <div class="rounded-xl bg-rose-50/50 p-3 ring-1 ring-rose-100">
                <p class="text-[10px] font-bold uppercase text-rose-400">비상 연락망</p>
                <p class="text-sm font-bold text-rose-800">{{ selectedWorker.emergency }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6 lg:col-span-2">
          <div class="overflow-hidden rounded-2xl border border-forena-100 bg-white shadow-card">
            <div class="border-b border-forena-50 bg-forena-50/30 px-6 py-4">
              <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
                <HardHat class="h-4 w-4 text-forena-600" /> 투입 및 소속 상세
              </h3>
            </div>
            <div class="grid gap-6 p-6 sm:grid-cols-2">
              <div class="flex items-start gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forena-50 text-forena-600"
                >
                  <MapPin class="h-5 w-5" />
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase text-forena-400">소속 협력사</p>
                  <p class="text-sm font-bold text-forena-900">{{ selectedWorker.company }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forena-50 text-forena-600"
                >
                  <Calendar class="h-5 w-5" />
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase text-forena-400">투입 시작일</p>
                  <p class="text-sm font-bold text-forena-900">{{ selectedWorker.joinDate }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="overflow-hidden rounded-2xl border border-forena-100 bg-white shadow-card">
            <div class="border-b border-forena-50 bg-forena-50/30 px-6 py-4">
              <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
                <ShieldCheck class="h-4 w-4 text-emerald-600" /> 안전교육 및 필수 서류
              </h3>
            </div>
            <div class="divide-y divide-forena-50">
              <div class="flex items-center justify-between p-6">
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                  >
                    <FileText class="h-6 w-6" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-forena-900">기초안전보건교육 이수증</p>
                    <p class="text-xs text-slate-500">2024.03.10일 확인됨</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="flex items-center gap-1 text-xs font-bold text-flare-600 hover:underline"
                >
                  보기 <ChevronRight class="h-3 w-3" />
                </button>
              </div>
              <div class="flex items-center justify-between p-6">
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600"
                  >
                    <FileText class="h-6 w-6" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-forena-900">신분증 사본</p>
                    <p class="text-xs text-slate-500">주민등록증 앞면</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="flex items-center gap-1 text-xs font-bold text-flare-600 hover:underline"
                >
                  보기 <ChevronRight class="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showOnboardModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-forena-900/40 p-4 backdrop-blur-[2px]"
        @click.self="closeOnboardModal"
      >
        <div
          class="flex max-h-[min(92vh,880px)] w-full max-w-3xl animate-in zoom-in-95 flex-col overflow-hidden rounded-2xl border border-forena-100 bg-white shadow-2xl duration-200"
          @click.stop
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-4"
          >
            <h2 class="text-base font-bold text-forena-900 sm:text-lg">{{ T.modalTitle }}</h2>
            <button
              type="button"
              class="rounded-xl border border-forena-200 bg-white p-2 text-forena-500 transition hover:bg-forena-50 hover:text-forena-800"
              @click="closeOnboardModal"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="scrollbar-hide min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-8 md:grid-cols-2">
              <div class="space-y-4">
                <h3 class="text-xs font-bold uppercase tracking-wide text-forena-500">
                  {{ T.secBasic }}
                </h3>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelName
                  }}</label>
                  <input
                    v-model="onboardForm.name"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    :placeholder="T.phName"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelBlood
                  }}</label>
                  <select
                    v-model="onboardForm.bloodType"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                  >
                    <option v-for="b in bloodOptions" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelPhone
                  }}</label>
                  <input
                    v-model="onboardForm.phone"
                    type="tel"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    :placeholder="T.phPhone"
                  />
                </div>
                <div>
                  <label
                    class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-forena-600"
                  >
                    <AlertTriangle class="h-3.5 w-3.5 text-rose-500" />
                    {{ T.labelEmergency }}
                  </label>
                  <input
                    v-model="onboardForm.emergency"
                    type="tel"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    :placeholder="T.phEmergency"
                  />
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-xs font-bold uppercase tracking-wide text-forena-500">
                  {{ T.secAffil }}
                </h3>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelPartner
                  }}</label>
                  <select
                    v-model="onboardForm.partner"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                  >
                    <option value="">{{ T.phPartner }}</option>
                    <option value="태양건설">태양건설</option>
                    <option value="우주산업">우주산업</option>
                    <option value="개인">개인</option>
                    <option value="direct">직영</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelJob
                  }}</label>
                  <input
                    v-model="onboardForm.job"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    :placeholder="T.phJob"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelUpload
                  }}</label>
                  <label
                    class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-flare-300/80 bg-flare-50/40 px-4 py-8 transition hover:border-flare-500 hover:bg-flare-50/70"
                  >
                    <UploadCloud class="h-8 w-8 text-flare-600" />
                    <span class="text-center text-xs font-semibold text-forena-800">{{
                      T.uploadHint
                    }}</span>
                    <span class="text-[10px] text-slate-500">{{ T.uploadFormats }}</span>
                    <span v-if="onboardFileName" class="text-[10px] font-medium text-flare-700">{{
                      onboardFileName
                    }}</span>
                    <input
                      type="file"
                      class="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      @change="onOnboardFileChange"
                    />
                  </label>
                </div>
                <label
                  class="flex cursor-pointer items-start gap-3 rounded-xl border border-forena-100 bg-white p-4 shadow-sm"
                >
                  <input
                    v-model="onboardForm.confirmEducation"
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 shrink-0 rounded border-forena-300 text-flare-600 focus:ring-flare-500"
                  />
                  <span class="text-xs leading-relaxed text-forena-800">{{ T.chkEdu }}</span>
                </label>
              </div>
            </div>
          </div>

          <div
            class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/30 px-5 py-4"
          >
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-bold text-forena-600 transition hover:bg-forena-100"
              @click="closeOnboardModal"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-flare-500 to-forena-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-flare-600 hover:to-forena-700"
              @click="submitOnboard"
            >
              <Save class="h-4 w-4" />
              {{ T.submit }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-forena-900/40 p-4 backdrop-blur-[2px]"
        @click.self="closeEditModal"
      >
        <div
          class="flex max-h-[min(92vh,880px)] w-full max-w-3xl animate-in zoom-in-95 flex-col overflow-hidden rounded-2xl border border-forena-100 bg-white shadow-2xl duration-200"
          @click.stop
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-4"
          >
            <h2 class="text-base font-bold text-forena-900 sm:text-lg">{{ T.modalEditTitle }}</h2>
            <button
              type="button"
              class="rounded-xl border border-forena-200 bg-white p-2 text-forena-500 transition hover:bg-forena-50 hover:text-forena-800"
              @click="closeEditModal"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="scrollbar-hide min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div class="grid gap-8 md:grid-cols-2">
              <div class="space-y-4">
                <h3 class="text-xs font-bold uppercase tracking-wide text-forena-500">
                  {{ T.secBasic }}
                </h3>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelName
                  }}</label>
                  <input
                    v-model="editForm.name"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    :placeholder="T.phName"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelBlood
                  }}</label>
                  <select
                    v-model="editForm.bloodType"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                  >
                    <option v-for="b in bloodOptions" :key="b" :value="b">{{ b }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelBirth
                  }}</label>
                  <input
                    v-model="editForm.birth"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    placeholder="예: 1990.01.05"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelPhone
                  }}</label>
                  <input
                    v-model="editForm.phone"
                    type="tel"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    :placeholder="T.phPhone"
                  />
                </div>
                <div>
                  <label
                    class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-forena-600"
                  >
                    <AlertTriangle class="h-3.5 w-3.5 text-rose-500" />
                    {{ T.labelEmergency }}
                  </label>
                  <input
                    v-model="editForm.emergency"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    :placeholder="T.phEmergency"
                  />
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-xs font-bold uppercase tracking-wide text-forena-500">
                  {{ T.secAffil }}
                </h3>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelPartner
                  }}</label>
                  <input
                    v-model="editForm.company"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    placeholder="소속 협력사 또는 직영"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelJob
                  }}</label>
                  <input
                    v-model="editForm.job"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    :placeholder="T.phJob"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelJoinDate
                  }}</label>
                  <input
                    v-model="editForm.joinDate"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    placeholder="예: 2024.03.10"
                  />
                </div>

                <h3 class="pt-2 text-xs font-bold uppercase tracking-wide text-forena-500">
                  {{ T.secEditStatus }}
                </h3>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                    T.labelOnboardStatus
                  }}</label>
                  <select
                    v-model="editForm.statusKey"
                    class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                  >
                    <option v-for="s in workerStatusOptions" :key="s.key" :value="s.key">
                      {{ s.label }}
                    </option>
                  </select>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                      T.labelSafetyState
                    }}</label>
                    <input
                      v-model="editForm.safetyText"
                      type="text"
                      class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                      T.labelBadgeTone
                    }}</label>
                    <select
                      v-model="editForm.safetyTone"
                      class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    >
                      <option v-for="t in badgeToneOptions" :key="t.value" :value="t.value">
                        {{ t.label }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                      T.labelDocsState
                    }}</label>
                    <input
                      v-model="editForm.docsText"
                      type="text"
                      class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-[11px] font-bold text-forena-600">{{
                      T.labelBadgeTone
                    }}</label>
                    <select
                      v-model="editForm.docsTone"
                      class="w-full rounded-xl border border-forena-200 bg-forena-50/30 px-3 py-2.5 text-sm font-semibold text-forena-900 outline-none focus:border-flare-400 focus:bg-white focus:ring-2 focus:ring-flare-400/20"
                    >
                      <option v-for="t in badgeToneOptions" :key="t.value" :value="t.value">
                        {{ t.label }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/30 px-5 py-4"
          >
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-bold text-forena-600 transition hover:bg-forena-100"
              @click="closeEditModal"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-flare-500 to-forena-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-flare-600 hover:to-forena-700"
              @click="submitEditWorker"
            >
              <Save class="h-4 w-4" />
              {{ T.saveChanges }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.shadow-card {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px -1px rgba(0, 0, 0, 0.01);
}
.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slide-in-from-bottom {
  from {
    transform: translateY(1rem);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes slide-in-from-right {
  from {
    transform: translateX(1rem);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes zoom-in-95 {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.fade-in {
  animation-name: fade-in;
}
.slide-in-from-bottom-4 {
  animation-name: slide-in-from-bottom;
}
.slide-in-from-right-4 {
  animation-name: slide-in-from-right;
}
.zoom-in-95 {
  animation-name: zoom-in-95;
}
</style>
