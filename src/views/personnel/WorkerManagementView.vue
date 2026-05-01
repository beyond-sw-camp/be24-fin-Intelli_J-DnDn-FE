<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Clock,
  UserCheck,
  LogOut,
  UserX,
  Eye,
  RefreshCw,
} from 'lucide-vue-next'
import { getAffiliationKind, formatAffiliationDisplay } from '@/utils/workerAffiliation'

const router = useRouter()
const isDataLoading = ref(false)
const lastDataRefreshAt = ref(null)

/** 상단 헤더 (근무자 관리) */
const WM = {
  pageTitle: '근무자 관리',
  heroDesc:
    '본사 직영과 협력사 소속 작업자를 동일 현장에서 관리할 수 있도록, 출입·근태 및 공수 현황을 조회하고 보정합니다.',
  sectionAttendance: '작업자 근태 현황',
  dataLoad: '데이터 불러오기',
  dataLoadLoading: '불러오는 중...',
  dataLoadCaption: '30분 주기로 갱신',
  lastRefreshLabel: '최종 갱신',
}

const lastRefreshDisplay = computed(() => {
  const d = lastDataRefreshAt.value
  if (!d) return `${WM.lastRefreshLabel}: —`
  return `${WM.lastRefreshLabel}: ${new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d)}`
})

/** 출입·근태 테이블 구역 */
const T = {
  kicker: '현장 운영',
  title: '출입 / 근태 관리',
  desc: '작업자 출퇴근과 공수 산정 현황을 일일별로 조회하고 보정할 수 있습니다.',
  breadcrumb: '현장 관리 / 출입·근태',
  filterDate: '조회 날짜',
  filterAffil: '소속 구분',
  filterSearch: '작업자 이름',
  filterSearchPh: '이름을 입력하세요',
  colContact: '이름 / 연락처',
  colEmergency: '비상 연락망 / 관계',
  colAffil: '소속',
  colTime: '출·퇴근',
  colRank: '직급',
  colStatus: '상태',
  empty: '조회된 근태 내역이 없습니다.',
  manSuffix: '공수',
  colDetail: '상세보기',
  affilDetailPartner: '협력사 지정',
  affilPartnerAll: '전체 협력사',
  listFilteredStats: '목록 집계',
  todayWorkerTotal: '금일 작업자',
  countPeople: '명',
}

/** 직급 표시 (현장 총 책임자 · 현장 관리자 · 작업자) */
const JOB_RANK_CHIEF = '현장 총 책임자'
const JOB_RANK_MANAGER = '현장 관리자'
const JOB_RANK_WORKER = '작업자'

function jobRankBadgeClass(rank) {
  if (rank === JOB_RANK_CHIEF) return 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/80'
  if (rank === JOB_RANK_MANAGER) return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80'
  return 'bg-slate-50 text-slate-800 ring-1 ring-slate-200/80'
}

/** 소속 구분 1단계: 본사 / 협력사 */
const affiliationCategoryOptions = [
  { value: '', label: '전체' },
  { value: 'direct', label: '본사 소속 직원' },
  { value: 'partner', label: '협력사 소속' },
]

/** 협력사 소속 선택 시 특정 협력사 (value는 데이터와 일치, label은 표시명만) */
const partnerDetailOptions = [
  { value: '', label: '전체 협력사' },
  { value: '협력사 (태양건설)', label: '태양건설' },
  { value: '협력사 (대한건설)', label: '대한건설' },
]

/** 표시용: `번호 / 관계`, `번호 (관계)`(기존), 또는 번호만 */
function parseEmergencyForTable(raw) {
  if (!raw || raw === '—') return { phone: '—', relation: '—' }
  const s = String(raw).trim()
  const slash = s.match(/^(.+?)\s*\/\s*(.+)$/)
  if (slash) {
    return { phone: slash[1].trim(), relation: slash[2].trim() }
  }
  const m = s.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (m) {
    return { phone: m[1].trim(), relation: m[2].trim() }
  }
  return { phone: s, relation: '—' }
}

function formatEmergencyDisplayCell(raw) {
  const em = parseEmergencyForTable(raw)
  if (em.phone === '—' && em.relation === '—') return '—'
  if (em.relation === '—' || !em.relation) return em.phone
  return `${em.phone} / ${em.relation}`
}

const filters = ref({
  date: new Date().toISOString().split('T')[0],
  /** '' | 'direct' | 'partner' */
  affiliationCategory: '',
  /** 협력사 세부 (해당 소속일 때만 사용) */
  affiliationDetail: '',
  searchName: '',
})

function onAffiliationCategoryChange() {
  filters.value.affiliationDetail = ''
}

const attendanceList = ref([
  {
    id: 1,
    name: '김동석',
    phone: '010-1234-5678',
    emergency: '010-9999-1111 (배우자)',
    jobRank: JOB_RANK_WORKER,
    affiliationType: '협력사 (태양건설)',
    primaryContractor: '태양건설',
    affiliationSubLabel: '인력',
    site: '강남구 재건축 A공구',
    clockIn: '06:50',
    clockOut: '17:10',
    manDays: 1.0,
    status: '퇴근 완료',
    isClosed: false,
    monthTotalMan: 18.5,
    clockHistory: [
      { date: '2025-10-14', clockIn: '06:50', clockOut: '17:10', manDays: 1.0 },
      { date: '2025-10-13', clockIn: '06:48', clockOut: '17:05', manDays: 1.0 },
      { date: '2025-10-12', clockIn: '06:52', clockOut: '17:00', manDays: 1.0 },
      { date: '2025-10-11', clockIn: '06:55', clockOut: '12:30', manDays: 0.5 },
    ],
  },
  {
    id: 2,
    name: '이목수',
    phone: '010-8888-7777',
    emergency: '010-7777-6666 (자녀)',
    jobRank: JOB_RANK_WORKER,
    affiliationType: '협력사 (태양건설)',
    primaryContractor: '태양건설',
    affiliationSubLabel: '목수',
    site: '강남구 재건축 A공구',
    clockIn: '07:05',
    clockOut: '-',
    manDays: 0,
    status: '작업 중',
    isClosed: false,
    monthTotalMan: 14.0,
    clockHistory: [
      { date: '2025-10-14', clockIn: '07:05', clockOut: '-', manDays: 0 },
      { date: '2025-10-13', clockIn: '07:00', clockOut: '17:15', manDays: 1.0 },
      { date: '2025-10-12', clockIn: '07:02', clockOut: '17:00', manDays: 1.0 },
    ],
  },
  {
    id: 3,
    name: '박반장',
    phone: '010-5555-4444',
    emergency: '010-4444-3333 (형제)',
    jobRank: JOB_RANK_MANAGER,
    affiliationType: '본사 소속',
    primaryContractor: '한화건설',
    affiliationSubLabel: '직영',
    site: '판교 데이터센터',
    clockIn: '06:45',
    clockOut: '16:00',
    manDays: 0.5,
    status: '조퇴',
    isClosed: true,
    monthTotalMan: 10.5,
    clockHistory: [
      { date: '2025-10-14', clockIn: '06:45', clockOut: '16:00', manDays: 0.5 },
      { date: '2025-10-13', clockIn: '-', clockOut: '-', manDays: 0 },
      { date: '2025-10-12', clockIn: '06:40', clockOut: '17:10', manDays: 1.0 },
    ],
  },
  {
    id: 4,
    name: '최철수',
    phone: '010-2222-3333',
    emergency: '010-3333-2222 (부)',
    jobRank: JOB_RANK_CHIEF,
    affiliationType: '협력사 (대한건설)',
    primaryContractor: '대한건설',
    affiliationSubLabel: '목수',
    site: '강남구 재건축 A공구',
    clockIn: '07:00',
    clockOut: '17:00',
    manDays: 1.0,
    status: '퇴근 완료',
    isClosed: false,
    monthTotalMan: 12.0,
    clockHistory: [],
  },
  {
    id: 5,
    name: '정미도',
    phone: '010-1010-2020',
    emergency: '010-2020-3030 / 배우자',
    jobRank: JOB_RANK_WORKER,
    affiliationType: '협력사 (대한건설)',
    primaryContractor: '대한건설',
    affiliationSubLabel: '인력',
    site: '강남구 재건축 A공구',
    clockIn: '-',
    clockOut: '-',
    manDays: 0,
    status: '결근',
    isClosed: false,
    monthTotalMan: 9.0,
    clockHistory: [],
  },
])

const preKindAttendance = computed(() => {
  let result = attendanceList.value
  if (filters.value.searchName)
    result = result.filter((a) => a.name.includes(filters.value.searchName))

  const cat = filters.value.affiliationCategory
  const detail = filters.value.affiliationDetail
  if (cat === 'direct') {
    result = result.filter((a) => getAffiliationKind(a.affiliationType) === 'direct')
  } else if (cat === 'partner') {
    result = result.filter((a) => getAffiliationKind(a.affiliationType) === 'partner')
    if (detail) result = result.filter((a) => a.affiliationType === detail)
  }

  return result
})

const ATTENDANCE_STATE_LABELS = ['출근', '지각', '조퇴', '결근']

const listStatusFilter = ref('')

const filteredAttendance = computed(() => {
  let result = preKindAttendance.value
  if (listStatusFilter.value) {
    result = result.filter((r) => deriveAttendanceTag(r) === listStatusFilter.value)
  }
  return result
})

/** 소속·검색 반영 후, 상태 칩 필터 전 기준 명수 */
const listBaseForStats = computed(() => preKindAttendance.value)

const todayWorkerCount = computed(() => listBaseForStats.value.length)

const attendanceStateCounts = computed(() => {
  const rows = listBaseForStats.value
  const acc = { 출근: 0, 지각: 0, 조퇴: 0, 결근: 0 }
  for (const r of rows) {
    const s = deriveAttendanceTag(r)
    if (s in acc) acc[s]++
  }
  return acc
})

function toggleListStatusFilter(state) {
  listStatusFilter.value = listStatusFilter.value === state ? '' : state
}

/** 근무 시작 기준시각(이후 출근 = 지각) */
const ATTENDANCE_ON_TIME_END = '07:00'

function formatAffiliationRow(record) {
  const kind = getAffiliationKind(record.affiliationType)
  const sub = record.affiliationSubLabel || '인력'
  if (kind === 'direct') {
    const corp = record.primaryContractor || '한화건설'
    return `${corp} / ${sub}`
  }
  if (kind === 'agency') {
    const name = formatAffiliationDisplay(record.affiliationType)
    return `${name} / 파견`
  }
  const company = formatAffiliationDisplay(record.affiliationType)
  return `${company} / ${sub}`
}

function attendanceTagBadgeClass(tag) {
  if (tag === '출근') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
  if (tag === '지각') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
  if (tag === '조퇴') return 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/90'
}

function timeStrToMinutes(s) {
  if (!s || s === '-' || typeof s !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return null
  const h = Number(m[1])
  const mi = Number(m[2])
  if (Number.isNaN(h) || Number.isNaN(mi)) return null
  return h * 60 + mi
}

function deriveAttendanceTag(record) {
  const st = String(record.status ?? '')
  const cin = record.clockIn
  if (!cin || cin === '-') return '결근'
  if (st.includes('조퇴')) return '조퇴'
  const inM = timeStrToMinutes(cin)
  const limitM = timeStrToMinutes(ATTENDANCE_ON_TIME_END)
  if (inM != null && limitM != null && inM > limitM) return '지각'
  return '출근'
}

function goWorkerProfile(record, event) {
  event.stopPropagation()
  router.push({ name: 'siteWorkerProfile', params: { id: String(record.id) } })
}

function onDataLoad() {
  if (isDataLoading.value) return
  isDataLoading.value = true
  window.setTimeout(() => {
    isDataLoading.value = false
    lastDataRefreshAt.value = new Date()
  }, 1200)
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">투입 관리</p>
          <h1 class="text-xl font-bold text-forena-900">{{ WM.pageTitle }}</h1>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="rounded-lg border border-forena-100 bg-forena-50/60 px-3 py-1.5 text-right">
          <p class="text-[10px] font-bold text-forena-600">{{ WM.dataLoadCaption }}</p>
          <p class="mt-0.5 text-[10px] tabular-nums text-forena-500">{{ lastRefreshDisplay }}</p>
        </div>
        <button
          type="button"
          :disabled="isDataLoading"
          class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 transition hover:bg-flare-100 disabled:cursor-not-allowed disabled:opacity-60"
          @click="onDataLoad"
        >
          <RefreshCw class="h-3.5 w-3.5 shrink-0" :class="{ 'animate-spin': isDataLoading }" />
          {{ isDataLoading ? WM.dataLoadLoading : WM.dataLoad }}
        </button>
      </div>
    </div>

    <div>
      <div class="mb-3">
        <h2 class="text-sm font-bold text-forena-900">{{ WM.sectionAttendance }}</h2>
      </div>

      <div class="space-y-6">
        <!-- KPI: 출근 / 지각 / 조퇴 / 결근 (목록 필터와 동일 기준) -->
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            class="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/35 to-white p-4 shadow-card ring-1 ring-emerald-100/60"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-800/90">출근</p>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{
                attendanceStateCounts['출근']
              }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <UserCheck class="mb-1 h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div
            class="rounded-2xl border border-amber-100/90 bg-gradient-to-br from-amber-50/35 to-white p-4 shadow-card ring-1 ring-amber-100/60"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-amber-800/90">지각</p>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{
                attendanceStateCounts['지각']
              }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <Clock class="mb-1 h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div
            class="rounded-2xl border border-rose-100/90 bg-gradient-to-br from-rose-50/35 to-white p-4 shadow-card ring-1 ring-rose-100/60"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-rose-800/90">조퇴</p>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{
                attendanceStateCounts['조퇴']
              }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <LogOut class="mb-1 h-5 w-5 text-rose-600" />
            </div>
          </div>
          <div
            class="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/80 to-white p-4 shadow-card ring-1 ring-slate-200/70"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-600">결근</p>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{
                attendanceStateCounts['결근']
              }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <UserX class="mb-1 h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        <div
          class="rounded-2xl border border-forena-100/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
        >
          <div class="flex flex-wrap items-end gap-4">
            <div>
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.filterDate }}</label>
              <input
                v-model="filters.date"
                type="date"
                class="w-40 rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.filterAffil }}</label>
              <select
                v-model="filters.affiliationCategory"
                class="min-w-[11rem] rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                @change="onAffiliationCategoryChange"
              >
                <option v-for="opt in affiliationCategoryOptions" :key="opt.value || 'all'" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div v-if="filters.affiliationCategory === 'partner'">
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.affilDetailPartner }}</label>
              <select
                v-model="filters.affiliationDetail"
                class="min-w-[12rem] rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              >
                <option v-for="opt in partnerDetailOptions" :key="opt.value || 'p-all'" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="relative min-w-[200px] flex-1">
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.filterSearch }}</label>
              <Search
                class="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-flare-500/80"
                aria-hidden="true"
              />
              <input
                v-model="filters.searchName"
                type="text"
                :placeholder="T.filterSearchPh"
                class="w-full rounded-xl border border-forena-200 bg-white py-2.5 pr-4 pl-9 text-sm text-forena-900 outline-none transition placeholder:text-slate-400 focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              />
            </div>
          </div>
        </div>

        <div
          class="flex flex-col overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-forena-100 bg-forena-50/55 px-4 py-3 text-xs text-forena-700 sm:px-6 sm:text-sm"
          >
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="font-bold text-forena-900">{{ T.listFilteredStats }}</span>
              <span class="tabular-nums text-forena-600">
                {{ T.todayWorkerTotal }}
                <strong class="font-bold text-forena-900">{{ todayWorkerCount }}</strong>{{ T.countPeople }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="st in ATTENDANCE_STATE_LABELS"
                :key="st"
                type="button"
                class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-flare-400/50"
                :class="
                  listStatusFilter === st
                    ? 'border-forena-600 bg-white text-forena-900 shadow-sm ring-1 ring-forena-200/80'
                    : 'border-forena-200/90 bg-white/90 text-forena-700 hover:border-forena-300 hover:bg-white'
                "
                @click="toggleListStatusFilter(st)"
              >
                {{ st }}
                <span class="tabular-nums font-semibold text-forena-600/90">{{
                  attendanceStateCounts[st]
                }}</span>
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[960px] text-left text-sm whitespace-nowrap">
              <thead
                class="border-b border-forena-100 bg-forena-50/60 text-[11px] font-bold uppercase tracking-wider text-forena-500"
              >
                <tr>
                  <th class="px-6 py-4 font-semibold">{{ T.colContact }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colEmergency }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colAffil }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colRank }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colTime }}</th>
                  <th class="px-6 py-4 text-center font-semibold">{{ T.colStatus }}</th>
                  <th class="px-6 py-4 text-center font-semibold">{{ T.colDetail }}</th>
                </tr>
              </thead>
              <tbody class="text-forena-800">
                <tr v-if="filteredAttendance.length === 0">
                  <td colspan="7" class="px-6 py-14 text-center text-sm text-slate-400">
                    {{ T.empty }}
                  </td>
                </tr>
                <tr
                  v-else
                  v-for="record in filteredAttendance"
                  :key="record.id"
                  class="border-b border-forena-50 transition hover:bg-flare-50/40"
                >
                  <td class="px-6 py-4">
                    <div class="font-semibold text-forena-900">{{ record.name }}</div>
                    <div class="text-[11px] text-slate-500">{{ record.phone }}</div>
                  </td>
                  <td class="px-6 py-4 text-xs font-medium text-rose-600/90">
                    <span class="tabular-nums">{{ formatEmergencyDisplayCell(record.emergency) }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-xs font-semibold text-forena-800">
                      {{ formatAffiliationRow(record) }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold"
                      :class="jobRankBadgeClass(record.jobRank)"
                    >
                      {{ record.jobRank }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-xs">
                    <span class="font-semibold text-flare-700">{{ record.clockIn }}</span>
                    <span class="text-slate-400"> — </span>
                    <span class="text-slate-600">{{ record.clockOut }}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      class="inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold"
                      :class="attendanceTagBadgeClass(deriveAttendanceTag(record))"
                      >{{ deriveAttendanceTag(record) }}</span
                    >
                  </td>
                  <td class="px-6 py-4 text-center">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-[11px] font-bold text-forena-700 shadow-sm transition hover:border-flare-300 hover:bg-flare-50/50"
                      :title="T.colDetail"
                      @click="(e) => goWorkerProfile(record, e)"
                    >
                      <Eye class="h-3.5 w-3.5" />
                      {{ T.colDetail }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
