<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users,
  Search,
  Trash2,
  X,
  AlertTriangle,
  Clock,
  UserCheck,
  Eye,
  RefreshCw,
} from 'lucide-vue-next'
import { getAffiliationKind, formatAffiliationDisplay } from '@/utils/workerAffiliation'

const router = useRouter()

/** 상단 히어로 (작업자 관리) */
const WM = {
  pageTitle: '작업자 관리',
  kicker: '인사',
  heroDesc:
    '본사 직영과 협력사 소속 작업자를 동일 현장에서 관리할 수 있도록, 출입·근태 및 공수 현황을 조회하고 보정합니다.',
  sectionAttendance: '출입 / 근태 현황',
  dataLoad: '데이터 불러오기',
  dataLoadDemo: '최신 근태 데이터를 불러왔습니다. (데모)',
}

/** 출입·근태 테이블 구역 */
const T = {
  kicker: '현장 운영',
  title: '출입 / 근태 관리',
  desc: '작업자 출퇴근과 공수 산정 현황을 일일별로 조회하고 보정할 수 있습니다.',
  breadcrumb: '현장 관리 / 출입·근태',
  statTotal: '출근 작업자 수',
  statWorking: '작업 중',
  statDone: '퇴근 완료',
  statTodayScope: '당일 기준',
  statWorkingBadge: '진행',
  filterDate: '조회 날짜',
  filterAffil: '소속 구분',
  filterSearch: '작업자 이름',
  filterSearchPh: '이름을 입력하세요',
  colContact: '이름 / 연락처',
  colEmergency: '비상 연락망 / 관계',
  colAffil: '소속',
  colTime: '출·퇴근',
  colRank: '직급',
  colTag: '태그',
  colStatus: '상태',
  colDel: '삭제',
  empty: '조회된 근태 내역이 없습니다.',
  drawerTitle: '근태 기록 보정',
  drawerWorker: '대상 작업자',
  affilChange: '소속 변경',
  clockIn: '출근 시간',
  clockOut: '퇴근 시간',
  manDays: '산정 공수',
  reasonTitle: '보정 사유 (필수)',
  reasonPh: '시간 오류, 시스템 누락 등 사유를 입력하세요.',
  cancel: '취소',
  save: '보정 및 승인',
  closedWarn: '이미 마감된 현장의 근태는 수정할 수 없습니다.',
  deleteConfirm: '해당 작업자의 근태 기록을 삭제하시겠습니까?',
  deleted: '삭제가 완료되었습니다.',
  reasonRequired: '보정 사유를 반드시 입력해야 합니다.',
  manDaysAutoHint:
    '점심(12:00) 이전 퇴근 0.5 · 기본 퇴근(18:00) 이전 1 · 연장 시 1.5로 자동 산정됩니다.',
  manDaysInvalid: '출근·퇴근 시간을 입력해 주세요. (퇴근은 출근 이후 시각이어야 합니다)',
  saved: '근태 정보가 성공적으로 보정되었습니다.',
  closedTag: '마감됨',
  manSuffix: '공수',
  statHint: '기준',
  colDetail: '상세보기',
  affilDetailPartner: '협력사 지정',
  affilPartnerAll: '전체 협력사',
  listFilteredStats: '목록 집계',
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

const editAffiliationOptions = [
  { value: '본사 소속', label: '본사 소속 직원' },
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

const filteredAttendance = computed(() => preKindAttendance.value)

function countAttendanceStats(rows) {
  return {
    total: rows.length,
    working: rows.filter((r) => r.status.includes('작업 중')).length,
    done: rows.filter((r) => r.status.includes('퇴근 완료')).length,
  }
}

/** 소속·검색 필터와 무관 — 출입/근태 KPI 카드용 */
const statCounts = computed(() => countAttendanceStats(attendanceList.value))

/** 테이블에 표시되는 행 기준 (필터·검색 반영) */
const filteredStatCounts = computed(() => countAttendanceStats(filteredAttendance.value))

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

const deleteAttendance = (id, event) => {
  event.stopPropagation()
  if (confirm(T.deleteConfirm)) {
    attendanceList.value = attendanceList.value.filter((a) => a.id !== id)
    alert(T.deleted)
  }
}

/** 산정 공수: 점심 전 퇴근 0.5 / 기본 퇴근 시각 이전 1 / 연장 1.5 */
const MAN_DAYS_LUNCH = '12:00'
const MAN_DAYS_STANDARD_LEAVE = '18:00'

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

function manDaysFromAttendanceTimes(clockIn, clockOut) {
  const inM = timeStrToMinutes(clockIn)
  const outM = timeStrToMinutes(clockOut)
  if (inM == null || outM == null) return null
  if (outM < inM) return null
  const lunchM = timeStrToMinutes(MAN_DAYS_LUNCH)
  const endM = timeStrToMinutes(MAN_DAYS_STANDARD_LEAVE)
  if (lunchM == null || endM == null) return null
  if (outM < lunchM) return 0.5
  if (outM <= endM) return 1
  return 1.5
}

const showEditDrawer = ref(false)
const editForm = ref({
  id: null,
  affiliationType: '',
  clockIn: '',
  clockOut: '',
  reason: '',
})
const selectedWorkerName = ref('')

const drawerManDays = computed(() =>
  manDaysFromAttendanceTimes(editForm.value.clockIn, editForm.value.clockOut),
)

const openEditDrawer = (record) => {
  if (record.isClosed) {
    alert(T.closedWarn)
    return
  }
  selectedWorkerName.value = record.name

  editForm.value = {
    id: record.id,
    affiliationType: record.affiliationType,
    clockIn: record.clockIn === '-' ? '' : record.clockIn,
    clockOut: record.clockOut === '-' ? '' : record.clockOut,
    reason: '',
  }
  showEditDrawer.value = true
}

const saveEdit = () => {
  if (!editForm.value.reason.trim()) {
    alert(T.reasonRequired)
    return
  }
  const md = drawerManDays.value
  if (md == null) {
    alert(T.manDaysInvalid)
    return
  }
  const index = attendanceList.value.findIndex((a) => a.id === editForm.value.id)
  if (index !== -1) {
    const prev = attendanceList.value[index]
    attendanceList.value[index] = {
      ...prev,
      affiliationType: editForm.value.affiliationType,
      clockIn: editForm.value.clockIn,
      clockOut: editForm.value.clockOut || '-',
      manDays: md,
      jobRank: prev.jobRank,
      monthTotalMan: prev.monthTotalMan,
      clockHistory: prev.clockHistory,
    }
    alert(T.saved)
    showEditDrawer.value = false
  }
}

function goWorkerProfile(record, event) {
  event.stopPropagation()
  router.push({ name: 'siteWorkerProfile', params: { id: String(record.id) } })
}

const getStatusBadge = (status) => {
  if (status.includes('퇴근')) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
  if (status.includes('작업 중')) return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80'
  if (status.includes('조퇴') || status.includes('겸근'))
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80'
  if (status.includes('결근')) return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/90'
  return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80'
}

function onDataLoad() {
  window.alert(WM.dataLoadDemo)
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-wrap items-start gap-4">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
          >
            <Users class="h-5 w-5" />
          </span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">{{ WM.kicker }}</p>
            <h1 class="text-gradient-brand text-xl font-bold tracking-tight">{{ WM.pageTitle }}</h1>
            <p class="mt-2 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ WM.heroDesc }}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
            @click="onDataLoad"
          >
            <RefreshCw class="h-4 w-4" />
            {{ WM.dataLoad }}
          </button>
        </div>
      </div>
    </div>

    <div>
      <div class="mb-3">
        <h2 class="text-sm font-bold text-forena-900">{{ WM.sectionAttendance }}</h2>
      </div>

      <div class="space-y-6">
        <!-- KPI 카드: 공정 지표보고 탭과 동일 톤 -->
        <div class="grid gap-3 sm:grid-cols-3">
          <div
            class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card ring-1 ring-forena-50"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">
                {{ T.statTotal }}
              </p>
              <span
                class="rounded-lg bg-forena-50 px-2 py-0.5 text-[10px] font-bold text-forena-600"
              >
                {{ T.statTodayScope }}
              </span>
            </div>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{ statCounts.total }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <Users class="mb-1 h-5 w-5 text-flare-600" />
            </div>
            <p class="mt-2 text-[10px] font-medium text-slate-400">{{ T.filterDate }} {{ T.statHint }}</p>
          </div>
          <div
            class="rounded-2xl border border-amber-100/90 bg-gradient-to-br from-amber-50/35 to-white p-4 shadow-card ring-1 ring-amber-100/60"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] font-bold uppercase tracking-wider text-amber-800/90">
                {{ T.statWorking }}
              </p>
              <span
                class="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900"
              >
                {{ T.statWorkingBadge }}
              </span>
            </div>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{ statCounts.working }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <Clock class="mb-1 h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div
            class="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/35 to-white p-4 shadow-card ring-1 ring-emerald-100/60"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-800/90">
                {{ T.statDone }}
              </p>
              <span
                class="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
              >
                {{ T.statTodayScope }}
              </span>
            </div>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{ statCounts.done }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <UserCheck class="mb-1 h-5 w-5 text-emerald-600" />
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
            class="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-forena-100 bg-forena-50/55 px-4 py-3 text-xs text-forena-700 sm:px-6 sm:text-sm"
          >
            <span class="font-bold text-forena-900">{{ T.listFilteredStats }}</span>
            <span class="select-none text-forena-300" aria-hidden="true">·</span>
            <span class="tabular-nums">
              {{ T.statTotal }}
              <strong class="font-bold text-forena-900">{{ filteredStatCounts.total }}</strong>{{ T.countPeople }}
            </span>
            <span class="select-none text-forena-300" aria-hidden="true">·</span>
            <span class="tabular-nums">
              {{ T.statWorking }}
              <strong class="font-bold text-amber-800">{{ filteredStatCounts.working }}</strong>{{ T.countPeople }}
            </span>
            <span class="select-none text-forena-300" aria-hidden="true">·</span>
            <span class="tabular-nums">
              {{ T.statDone }}
              <strong class="font-bold text-emerald-800">{{ filteredStatCounts.done }}</strong>{{ T.countPeople }}
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[960px] text-left text-sm whitespace-nowrap">
              <thead
                class="border-b border-forena-100 bg-forena-50/60 text-[11px] font-bold uppercase tracking-wider text-forena-500"
              >
                <tr>
                  <th class="px-6 py-4 font-semibold">{{ T.colContact }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colEmergency }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colTag }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colAffil }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colRank }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colTime }}</th>
                  <th class="px-6 py-4 text-center font-semibold">{{ T.colStatus }}</th>
                  <th class="px-6 py-4 text-center font-semibold">{{ T.colDetail }}</th>
                  <th class="px-6 py-4 text-center font-semibold">{{ T.colDel }}</th>
                </tr>
              </thead>
              <tbody class="text-forena-800">
                <tr v-if="filteredAttendance.length === 0">
                  <td colspan="9" class="px-6 py-14 text-center text-sm text-slate-400">
                    {{ T.empty }}
                  </td>
                </tr>
                <tr
                  v-else
                  v-for="record in filteredAttendance"
                  :key="record.id"
                  class="cursor-pointer border-b border-forena-50 transition hover:bg-flare-50/40"
                  @click="openEditDrawer(record)"
                >
                  <td class="px-6 py-4">
                    <div class="font-semibold text-forena-900">{{ record.name }}</div>
                    <div class="text-[11px] text-slate-500">{{ record.phone }}</div>
                  </td>
                  <td class="px-6 py-4 text-xs font-medium text-rose-600/90">
                    <span class="tabular-nums">{{ formatEmergencyDisplayCell(record.emergency) }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold"
                      :class="attendanceTagBadgeClass(deriveAttendanceTag(record))"
                    >
                      {{ deriveAttendanceTag(record) }}
                    </span>
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
                      :class="getStatusBadge(record.status)"
                      >{{ record.status }}</span
                    >
                    <span v-if="record.isClosed" class="mt-1 block text-[9px] font-bold text-slate-400">{{
                      T.closedTag
                    }}</span>
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
                  <td class="px-6 py-4 text-center">
                    <button
                      type="button"
                      class="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      :title="T.colDel"
                      @click="(e) => deleteAttendance(record.id, e)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showEditDrawer"
        class="fixed inset-0 z-50 flex justify-end bg-forena-900/20 backdrop-blur-[2px]"
        @click.self="showEditDrawer = false"
      >
        <aside
          class="flex h-full w-full max-w-md flex-col border-l border-forena-100 bg-white shadow-2xl animate-[slideIn_0.25s_ease-out]"
          @click.stop
        >
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-4"
          >
            <h2 class="text-lg font-bold text-forena-900">{{ T.drawerTitle }}</h2>
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-400 transition hover:text-forena-700"
              @click="showEditDrawer = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="flex-1 space-y-6 overflow-y-auto p-6 text-sm">
            <div class="rounded-xl border border-forena-100 bg-white p-4 shadow-sm">
              <p class="mb-1 text-[11px] font-bold uppercase tracking-wide text-forena-400">
                {{ T.drawerWorker }}
              </p>
              <p class="text-lg font-bold text-forena-900">{{ selectedWorkerName }}</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.affilChange }}</label>
                <select
                  v-model="editForm.affiliationType"
                  class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                >
                  <option v-for="opt in editAffiliationOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.clockIn }}</label>
                  <input
                    v-model="editForm.clockIn"
                    type="time"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.clockOut }}</label>
                  <input
                    v-model="editForm.clockOut"
                    type="time"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.manDays }}</label>
                <input
                  :value="drawerManDays != null ? String(drawerManDays) : ''"
                  type="text"
                  readonly
                  disabled
                  :placeholder="drawerManDays == null ? '—' : ''"
                  class="w-full cursor-not-allowed rounded-xl border border-forena-200 bg-forena-50/90 px-3 py-2.5 text-forena-900 outline-none"
                />
                <p class="mt-1.5 text-[10px] leading-relaxed text-slate-500">{{ T.manDaysAutoHint }}</p>
              </div>

              <div class="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                <h3 class="mb-2 flex items-center gap-2 text-[11px] font-bold text-rose-700">
                  <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
                  {{ T.reasonTitle }}
                </h3>
                <textarea
                  v-model="editForm.reason"
                  rows="3"
                  :placeholder="T.reasonPh"
                  class="w-full resize-none rounded-lg border border-rose-200/80 bg-white p-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15"
                />
              </div>
            </div>
          </div>

          <div class="flex shrink-0 justify-end gap-3 border-t border-forena-100 bg-forena-50/30 px-6 py-4">
            <button
              type="button"
              class="rounded-xl border border-forena-200 bg-white px-5 py-2.5 text-sm font-bold text-forena-600 transition hover:bg-forena-50"
              @click="showEditDrawer = false"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
              @click="saveEdit"
            >
              {{ T.save }}
            </button>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
