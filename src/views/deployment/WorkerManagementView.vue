<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Clock,
  UserCheck,
  LogOut,
  UserX,
  Eye,
  RefreshCw,
  Timer,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Zap,
  History,
} from 'lucide-vue-next'
import {
  employmentKindDisplay,
  displayWorkerTradeLine,
  deriveAttendanceTag,
  attendanceTagBadgeClass,
} from '@/utils/workerUi'
import { syncWorkforce, syncAllSites, fetchWorkerList, seedDemoAttendanceHistory, bulkOverrideAttendance } from '@/api/worker.js'
import { useAuthStore } from '@/stores/authStore.js'

const router = useRouter()
const authStore = useAuthStore()
const isDataLoading = ref(false)
const isTriggerLoading = ref(false)
const isSeedLoading = ref(false)
const isBulkLoading = ref(false)
const lastDataRefreshAt = ref(null)

const BULK_STATUS_OPTIONS = [
  { label: '미출근', value: 'PENDING' },
  { label: '출근',   value: 'PRESENT' },
  { label: '지각',   value: 'LATE' },
  { label: '조퇴',   value: 'EARLY_LEAVE' },
  { label: '퇴근',   value: 'LEAVE' },
]
const selectedBulkStatus = ref('PRESENT')

/** 상단 헤더 (근무자 관리) */
const WM = {
  pageTitle: '근무자 관리',
  heroDesc:
    '본사 직영과 협력사 소속 작업자를 동일 현장에서 관리할 수 있도록, 출입·근태 및 공수 현황을 조회하고 보정합니다.',
  sectionAttendance: '작업자 근태 현황',
  dataLoad: '데이터 불러오기',
  dataLoadLoading: '불러오는 중...',
  triggerSync: '전체 동기화',
  triggerSyncLoading: '동기화 중...',
  seedHistory: '이전 출결내역 불러오기',
  seedHistoryLoading: '적용 중...',
  bulkOverride: '일괄 적용',
  bulkOverrideLoading: '적용 중...',
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
  datePrevAria: '어제 명단 보기',
  dateNextAria: '내일 명단 보기',
  filterAffil: '공종 구분',
  filterSearch: '작업자 이름',
  filterSearchPh: '이름을 입력하세요',
  colContact: '이름 / 연락처',
  colAffil: '소속',
  colEmployment: '상용 / 일용',
  colRank: '직급',
  colTrade: '공종',
  colTime: '출·퇴근',
  colStatus: '상태',
  empty: '조회된 근태 내역이 없습니다.',
  manSuffix: '공수',
  colDetail: '상세보기',
  listFilteredStats: '목록 집계',
  employmentFilterHint: '고용',
  attendanceFilterHint: '근태',
  todayWorkerTotal: '금일 작업자',
  countPeople: '명',
  calDialogLabel: '조회 날짜 선택',
  calPrevMonth: '이전 달',
  calNextMonth: '다음 달',
}

const JOB_RANK_SITE_DIRECTOR = '현장 총 책임자'
const JOB_RANK_SECTION_LEADER = '공종 책임자'
const JOB_RANK_FIELD_SUPERVISOR = '현장 관리자'
const JOB_RANK_WORKER = '작업자'

function jobRankBadgeClass(rank) {
  if (rank === JOB_RANK_SITE_DIRECTOR) return 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/80'
  if (rank === JOB_RANK_SECTION_LEADER) return 'bg-purple-50 text-purple-900 ring-1 ring-purple-200/80'
  if (rank === JOB_RANK_FIELD_SUPERVISOR) return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80'
  return 'bg-slate-50 text-slate-800 ring-1 ring-slate-200/80'
}

/** 공종 구분: 서버에서 받은 현장+날짜 기준 전체 공종 목록 */
const tradeFilterOptions = computed(() => {
  const trades = availableTradesFromServer.value
  return [{ value: '', label: '전체 공종' }, ...trades.map((t) => ({ value: t, label: t }))]
})

/** KPI 서버 카운트 → 프론트 태그 매핑 */
function kpiTagCounts(kpi) {
  if (!kpi) return { '출근 전': 0, 출근: 0, 지각: 0, 조퇴: 0, 퇴근: 0, 결근: 0 }
  return {
    '출근 전': kpi.pending ?? 0,
    출근: kpi.present ?? 0,
    지각: kpi.late ?? 0,
    조퇴: kpi.earlyLeave ?? 0,
    퇴근: kpi.leave ?? 0,
    결근: kpi.absent ?? 0,
  }
}

/** 브라우저 로컬 기준 YYYY-MM-DD (`toISOString` 은 UTC라 한국에서 하루 어긋날 수 있음) */
function localTodayISODate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISODateLocal(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? '').trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  if (Number.isNaN(dt.getTime())) return null
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return dt
}

function formatISODateLocal(d) {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

/** MANAGEMENT_001 동기화 시 서버에 넘기는 현장 코드 — 로그인한 계정의 siteCode 사용 */
const SYNC_SITE_CODE = computed(() => authStore.siteCode)

const filters = ref({
  date: localTodayISODate(),
  selectedTrade: '',
})
const searchNameInput = ref('')
let searchNameDebounceTimer = null

// 페이징
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

// 서버 KPI
const globalKpiData = ref(null)   // 전체 근무자 (필터 무관)
const listKpiData = ref(null)     // 공종+이름 필터 적용 후 전체
const availableTradesFromServer = ref([])

/** 필터용 인라인 달력 — 요일 헤더 */
const filterCalWeekDays = ['일', '월', '화', '수', '목', '금', '토']

const filterCalendarOpen = ref(false)
const datePickerRootRef = ref(null)
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth() + 1)

function toggleFilterCalendar() {
  if (!filterCalendarOpen.value) {
    const dt = parseISODateLocal(filters.value.date)
    if (dt) {
      calYear.value = dt.getFullYear()
      calMonth.value = dt.getMonth() + 1
    } else {
      const now = new Date()
      calYear.value = now.getFullYear()
      calMonth.value = now.getMonth() + 1
    }
  }
  filterCalendarOpen.value = !filterCalendarOpen.value
}

function shiftCalendarMonth(delta) {
  let y = calYear.value
  let m = calMonth.value + delta
  while (m > 12) {
    m -= 12
    y += 1
  }
  while (m < 1) {
    m += 12
    y -= 1
  }
  calYear.value = y
  calMonth.value = m
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function pickFilterCalendarDay(day) {
  if (day == null) return
  filters.value.date = `${calYear.value}-${pad2(calMonth.value)}-${pad2(day)}`
  filterCalendarOpen.value = false
}

const filterCalendarWeeks = computed(() => {
  const y = calYear.value
  const m = calMonth.value
  const mi = m - 1
  const first = new Date(y, mi, 1)
  const lastDay = new Date(y, mi + 1, 0).getDate()
  const pad = first.getDay()
  const weeks = []
  let week = []
  for (let i = 0; i < pad; i++) week.push(null)
  for (let d = 1; d <= lastDay; d++) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  while (week.length > 0 && week.length < 7) week.push(null)
  if (week.length) weeks.push(week)
  return weeks
})

function filterCalendarDayKey(day) {
  if (day == null) return ''
  return `${calYear.value}-${pad2(calMonth.value)}-${pad2(day)}`
}

function closeFilterCalendarIfOutside(e) {
  if (!filterCalendarOpen.value) return
  const root = datePickerRootRef.value
  if (root && e.target instanceof Node && !root.contains(e.target)) {
    filterCalendarOpen.value = false
  }
}

function shiftFilterDate(deltaDays) {
  filterCalendarOpen.value = false
  const cur = parseISODateLocal(filters.value.date)
  const base = cur ? new Date(cur) : new Date()
  base.setDate(base.getDate() + deltaDays)
  filters.value.date = formatISODateLocal(base)
}

const filterDateDisplay = computed(() => {
  const dt = parseISODateLocal(filters.value.date)
  if (!dt) return filters.value.date || '—'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(dt)
})

/** MANAGEMENT_003 — 현재 페이지 근무자 (50개) */
const attendanceList = ref([])

const ATTENDANCE_STATE_LABELS = ['출근 전', '출근', '지각', '조퇴', '퇴근', '결근']
const EMPLOYMENT_FILTER_LABELS = ['상용', '일용']

const listStatusFilter = ref('')
const listEmploymentFilter = ref('')

/** 상단 KPI 카드 — 전체 근무자 (서버 globalKpi, 필터 무관) */
const kpAttendanceCounts = computed(() => kpiTagCounts(globalKpiData.value))

/** 목록 집계 근태 칩 — 공종+이름 필터 기준 전체 (서버 listKpi) */
const attendanceStateCounts = computed(() => kpiTagCounts(listKpiData.value))

/** 금일 작업자 수 — 필터 적용 후 전체 인원 */
const todayWorkerCount = computed(() => listKpiData.value?.total ?? 0)

/** 상용/일용 표시 필터 (현재 페이지 기준) */
const employmentFilteredRows = computed(() => {
  let rows = attendanceList.value
  const emp = listEmploymentFilter.value
  if (emp === '상용') rows = rows.filter((r) => r.employmentClass === '상용')
  else if (emp === '일용') rows = rows.filter((r) => r.employmentClass === '일용')
  return rows
})

/** 테이블 표시 행 — 현재 페이지에서 고용·근태 클라이언트 필터 적용 */
const filteredAttendance = computed(() => {
  let result = employmentFilteredRows.value
  if (listStatusFilter.value) {
    result = result.filter((r) => deriveAttendanceTag(r) === listStatusFilter.value)
  }
  return result
})

/** 고용 칩 카운트 — 현재 페이지 기준 */
const employmentCounts = computed(() => {
  const rows = attendanceList.value
  let sang = 0, il = 0
  for (const r of rows) {
    if (r.employmentClass === '일용') il++
    else sang++
  }
  return { 상용: sang, 일용: il }
})

function toggleListStatusFilter(state) {
  listStatusFilter.value = listStatusFilter.value === state ? '' : state
}

function toggleListEmploymentFilter(kind) {
  listEmploymentFilter.value = listEmploymentFilter.value === kind ? '' : kind
}

function employmentBadgeClass(c) {
  if (c === '상용') return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80'
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
}

function goWorkerProfile(record, event) {
  event.stopPropagation()
  router.push({ name: 'siteWorkerProfile', params: { id: String(record.id) } })
}

/** API LocalTime → 표시용 HH:mm */
function formatApiTime(t) {
  if (t == null || t === '') return '-'
  const s = String(t)
  if (s === '-') return '-'
  const m = /^(\d{1,2}):(\d{2})/.exec(s)
  if (!m) return '-'
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

function mapJobRankFromApi(rank) {
  const r = String(rank ?? '').toUpperCase()
  if (r === 'SITE_DIRECTOR') return JOB_RANK_SITE_DIRECTOR
  if (r === 'SECTION_LEADER') return JOB_RANK_SECTION_LEADER
  if (r === 'FIELD_SUPERVISOR') return JOB_RANK_FIELD_SUPERVISOR
  return JOB_RANK_WORKER
}

function buildAffiliationFromApi(row) {
  const kind = String(row.affiliationKind ?? '').toUpperCase()
  if (kind === 'DIRECT') {
    return { affiliationType: '본사 소속', primaryContractor: '본사' }
  }
  const company = (row.partnerCompany && String(row.partnerCompany).trim()) || '협력사'
  return {
    affiliationType: `협력사 (${company})`,
    primaryContractor: company,
  }
}

function deriveStatusLabel(attendanceStatus, clockInStr, clockOutStr) {
  const st = String(attendanceStatus ?? '').toUpperCase()
  if (st === 'PENDING') return '출근 전'
  if (st === 'ABSENT' || clockInStr === '-') return '결근'
  if (st === 'EARLY_LEAVE') return '조퇴'
  if (clockOutStr && clockOutStr !== '-') return '퇴근'
  return '작업 중'
}

function estimateManDays(clockInStr, clockOutStr, statusUpper) {
  if (statusUpper === 'PENDING') return 0
  if (clockInStr === '-' || statusUpper === 'ABSENT') return 0
  if (statusUpper === 'EARLY_LEAVE') return 0.5
  if (clockOutStr && clockOutStr !== '-') return 1.0
  return 0
}

/** Backend.md `WorkerDto.WorkerRes` JSON → 테이블 행 모양 */
function mapWorkerResToAttendance(row) {
  const clockInStr = formatApiTime(row.clockIn)
  const clockOutStr = formatApiTime(row.clockOut)
  const statusUpper = String(row.attendanceStatus ?? '').toUpperCase()
  const { affiliationType, primaryContractor } = buildAffiliationFromApi(row)
  const tradeLabel = displayWorkerTradeLine(row)

  const manDays =
    row.manDays != null && row.manDays !== ''
      ? Number(row.manDays)
      : estimateManDays(clockInStr, clockOutStr, statusUpper)

  return {
    id: row.idx,
    name: row.name ?? '',
    phone: row.phone ?? '—',
    jobRank: mapJobRankFromApi(row.jobRank),
    employmentClass: employmentKindDisplay(row.employmentKind),
    affiliationType,
    primaryContractor,
    affiliationKindApi: row.affiliationKind,
    partnerCompanyApi: row.partnerCompany,
    affiliationSubLabel: tradeLabel,
    site: row.site || '—',
    clockIn: clockInStr,
    clockOut: clockOutStr,
    manDays,
    attendanceStatus: statusUpper,
    status: deriveStatusLabel(row.attendanceStatus, clockInStr, clockOutStr),
    isClosed: false,
    monthTotalMan: 0,
    clockHistory: [],
  }
}

/** MANAGEMENT_003 — 현재 필터+페이지 기준 목록 갱신 */
async function refreshWorkerListFromApi(pageOverride) {
  const pg = pageOverride !== undefined ? pageOverride : currentPage.value
  const listRes = await fetchWorkerList(SYNC_SITE_CODE.value, filters.value.date, {
    tradeName: filters.value.selectedTrade || undefined,
    searchName: searchNameInput.value.trim() || undefined,
    page: pg,
    size: 20,
  })
  const rows = listRes?.rows
  if (Array.isArray(rows)) {
    attendanceList.value = rows.map(mapWorkerResToAttendance)
  }
  if (listRes) {
    globalKpiData.value = listRes.globalKpi ?? null
    listKpiData.value = listRes.listKpi ?? null
    availableTradesFromServer.value = listRes.availableTrades ?? []
    currentPage.value = listRes.page ?? 0
    totalPages.value = listRes.totalPages ?? 0
    totalElements.value = listRes.totalElements ?? 0
  }
}

function goToPage(pg) {
  if (pg < 0 || pg >= totalPages.value || pg === currentPage.value) return
  refreshWorkerListFromApi(pg).catch((e) =>
    console.warn('[WorkerManagement] 페이지 이동 실패', e),
  )
}

watch(
  () => filters.value.date,
  () => {
    currentPage.value = 0
    listStatusFilter.value = ''
    listEmploymentFilter.value = ''
    refreshWorkerListFromApi(0).catch((e) =>
      console.warn('[WorkerManagement] 조회일 변경 후 목록 갱신 실패', e),
    )
  },
)

watch(
  () => filters.value.selectedTrade,
  () => {
    currentPage.value = 0
    listStatusFilter.value = ''
    refreshWorkerListFromApi(0).catch((e) =>
      console.warn('[WorkerManagement] 공종 필터 변경 후 목록 갱신 실패', e),
    )
  },
)

watch(searchNameInput, () => {
  clearTimeout(searchNameDebounceTimer)
  searchNameDebounceTimer = setTimeout(() => {
    currentPage.value = 0
    refreshWorkerListFromApi(0).catch((e) =>
      console.warn('[WorkerManagement] 이름 검색 후 목록 갱신 실패', e),
    )
  }, 300)
})

onMounted(() => {
  document.addEventListener('pointerdown', closeFilterCalendarIfOutside, true)
  refreshWorkerListFromApi().catch((e) => console.warn('[WorkerManagement] 초기 목록 로드 실패', e))
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', closeFilterCalendarIfOutside, true)
})

async function onTriggerSync() {
  if (isTriggerLoading.value) return
  isTriggerLoading.value = true
  try {
    const bulkResult = await syncAllSites(filters.value.date)
    await refreshWorkerListFromApi()
    lastDataRefreshAt.value = new Date()
    const lines = (bulkResult.results ?? []).map((r) =>
      r.success
        ? `✓ ${r.siteCode}: 신규 ${r.detail?.created ?? 0}명 · 갱신 ${r.detail?.updated ?? 0}명`
        : `✗ ${r.siteCode}: ${r.errorMessage ?? '실패'}`,
    )
    window.alert(
      `전체 현장 동기화 완료 (${bulkResult.siteCount}개 현장)\n\n${lines.join('\n')}`,
    )
  } catch (err) {
    window.alert(err?.message || '전체 동기화에 실패했습니다.')
  } finally {
    isTriggerLoading.value = false
  }
}

async function onDataLoad() {
  if (isDataLoading.value) return
  isDataLoading.value = true
  try {
    const syncResult = await syncWorkforce(SYNC_SITE_CODE.value, filters.value.date)
    await refreshWorkerListFromApi()
    lastDataRefreshAt.value = new Date()
    window.alert(
      `인력 데이터를 불러왔습니다.\n신규 ${syncResult.created}명 · 갱신 ${syncResult.updated}명 · 처리 ${syncResult.total}건` +
        (syncResult.documentsSynced != null
          ? `\n서류 ${syncResult.documentsSynced} · 제재 ${syncResult.sanctionsSynced ?? 0} · 사고 ${syncResult.accidentsSynced ?? 0} · 근태 ${syncResult.attendanceRecordsSynced ?? 0}`
          : ''),
    )
  } catch (err) {
    window.alert(err?.message || '데이터 불러오기에 실패했습니다.')
  } finally {
    isDataLoading.value = false
  }
}

async function onSeedHistory() {
  if (isSeedLoading.value) return
  isSeedLoading.value = true
  try {
    const result = await seedDemoAttendanceHistory(SYNC_SITE_CODE.value)
    await refreshWorkerListFromApi()
    lastDataRefreshAt.value = new Date()
    window.alert(
      `이전 출결내역 적용 완료\n근무자 ${result.workers}명 · 출결 레코드 ${result.records}건 · 구역배치 이력 ${result.staffingLogs}건 · 사고 이력 ${result.accidents}건\n(근무자별 피로도 점수가 재산정됩니다.)`,
    )
  } catch (err) {
    window.alert(err?.message || '이전 출결내역 불러오기에 실패했습니다.')
  } finally {
    isSeedLoading.value = false
  }
}

async function onBulkOverride() {
  if (isBulkLoading.value) return
  const statusLabel = BULK_STATUS_OPTIONS.find((o) => o.value === selectedBulkStatus.value)?.label ?? selectedBulkStatus.value
  const confirmMsg = `${filters.value.date} · ${SYNC_SITE_CODE.value} 현장의\n모든 근무자를 [${statusLabel}] 상태로 일괄 변경합니다.\n계속하시겠습니까?`
  if (!window.confirm(confirmMsg)) return
  isBulkLoading.value = true
  try {
    const result = await bulkOverrideAttendance(SYNC_SITE_CODE.value, filters.value.date, selectedBulkStatus.value)
    await refreshWorkerListFromApi()
    lastDataRefreshAt.value = new Date()
    window.alert(`일괄 변경 완료: ${result.total}명 → [${statusLabel}]`)
  } catch (err) {
    window.alert(err?.message || '일괄 변경에 실패했습니다.')
  } finally {
    isBulkLoading.value = false
  }
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
      <div class="flex flex-col items-end gap-1">
        <div class="flex items-center gap-2">
          <!-- 근태 일괄 변경 -->
          <div class="flex items-center gap-1">
            <select
              v-model="selectedBulkStatus"
              class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-forena-800 focus:outline-none focus:ring-2 focus:ring-flare-300"
            >
              <option v-for="opt in BULK_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <button
              type="button"
              :disabled="isBulkLoading"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              @click="onBulkOverride"
            >
              <CircleCheck
                class="h-3.5 w-3.5 shrink-0 text-slate-500"
                :class="{ 'animate-spin': isBulkLoading }"
              />
              {{ isBulkLoading ? WM.bulkOverrideLoading : WM.bulkOverride }}
            </button>
          </div>
          <button
            type="button"
            :disabled="isSeedLoading"
            class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            @click="onSeedHistory"
          >
            <History
              class="h-3.5 w-3.5 shrink-0 text-emerald-600"
              :class="{ 'animate-spin': isSeedLoading }"
            />
            {{ isSeedLoading ? WM.seedHistoryLoading : WM.seedHistory }}
          </button>
          <button
            type="button"
            :disabled="isTriggerLoading"
            class="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            @click="onTriggerSync"
          >
            <Zap
              class="h-3.5 w-3.5 shrink-0 text-violet-600"
              :class="{ 'animate-pulse': isTriggerLoading }"
            />
            {{ isTriggerLoading ? WM.triggerSyncLoading : WM.triggerSync }}
          </button>
          <button
            type="button"
            :disabled="isDataLoading"
            class="inline-flex items-center gap-1.5 rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 hover:bg-flare-100 disabled:cursor-not-allowed disabled:opacity-60"
            @click="onDataLoad"
          >
            <RefreshCw
              class="h-3.5 w-3.5 shrink-0 text-flare-600"
              :class="{ 'animate-spin': isDataLoading }"
            />
            {{ isDataLoading ? WM.dataLoadLoading : WM.dataLoad }}
          </button>
        </div>
        <p
          class="text-right text-[10px] leading-tight font-medium whitespace-nowrap tabular-nums text-forena-500"
        >
          {{ lastRefreshDisplay }}
        </p>
      </div>
    </div>

    <div>
      <div class="mb-3">
        <h2 class="text-sm font-bold text-forena-900">{{ WM.sectionAttendance }}</h2>
      </div>

      <div class="space-y-6">
        <!-- KPI: 출근 전 / 출근 / 지각 / 조퇴 / 퇴근 / 결근 -->
        <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <div
            class="rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50/35 to-white p-4 shadow-card ring-1 ring-violet-100/60"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-violet-800/90">출근 전</p>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{
                kpAttendanceCounts['출근 전']
              }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <Timer class="mb-1 h-5 w-5 text-violet-600" />
            </div>
          </div>
          <div
            class="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/35 to-white p-4 shadow-card ring-1 ring-emerald-100/60"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-800/90">출근</p>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{
                kpAttendanceCounts['출근']
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
                kpAttendanceCounts['지각']
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
                kpAttendanceCounts['조퇴']
              }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <LogOut class="mb-1 h-5 w-5 text-rose-600" />
            </div>
          </div>
          <div
            class="rounded-2xl border border-sky-100/90 bg-gradient-to-br from-sky-50/35 to-white p-4 shadow-card ring-1 ring-sky-100/60"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-sky-800/90">퇴근</p>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{
                kpAttendanceCounts['퇴근']
              }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <CircleCheck class="mb-1 h-5 w-5 text-sky-600" />
            </div>
          </div>
          <div
            class="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/80 to-white p-4 shadow-card ring-1 ring-slate-200/70"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-600">결근</p>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-bold tabular-nums text-forena-900">{{
                kpAttendanceCounts['결근']
              }}</span>
              <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countPeople }}</span>
              <UserX class="mb-1 h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        <div
          class="rounded-2xl border border-forena-100/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
        >
          <div ref="datePickerRootRef" class="relative border-b border-forena-100 pb-5">
            <p class="mb-2 text-[11px] font-bold text-forena-500">{{ T.filterDate }}</p>
            <div class="flex w-full items-center gap-1 sm:gap-2">
              <button
                type="button"
                class="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-forena-600 transition-colors hover:bg-slate-200/70 hover:text-forena-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-flare-400/45"
                :aria-label="T.datePrevAria"
                @click="shiftFilterDate(-1)"
              >
                <ChevronLeft class="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                id="wm-attendance-date-trigger"
                type="button"
                class="min-w-0 flex-1 rounded-lg px-3 py-2 text-center text-sm font-bold tabular-nums text-forena-900 transition-colors hover:bg-slate-200/70 sm:px-4 sm:text-base"
                :aria-expanded="filterCalendarOpen"
                :aria-label="T.filterDate"
                @click.stop="toggleFilterCalendar"
              >
                {{ filterDateDisplay }}
              </button>
              <button
                type="button"
                class="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-forena-600 transition-colors hover:bg-slate-200/70 hover:text-forena-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-flare-400/45"
                :aria-label="T.dateNextAria"
                @click="shiftFilterDate(1)"
              >
                <ChevronRight class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div
              v-show="filterCalendarOpen"
              class="absolute left-1/2 top-full z-40 mt-2 w-[272px] max-w-[calc(100%-0.5rem)] -translate-x-1/2 rounded-xl border border-forena-200 bg-white p-2.5 shadow-xl shadow-forena-900/10 ring-1 ring-black/5"
              role="dialog"
              :aria-label="T.calDialogLabel"
              @click.stop
            >
              <div
                class="mb-3 flex items-center justify-between gap-2 border-b border-forena-100 pb-2"
              >
                <button
                  type="button"
                  class="inline-flex rounded-lg p-1.5 text-forena-600 transition-colors hover:bg-slate-100 hover:text-forena-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-flare-400/45"
                  :aria-label="T.calPrevMonth"
                  @click.stop="shiftCalendarMonth(-1)"
                >
                  <ChevronLeft class="h-4 w-4" aria-hidden="true" />
                </button>
                <span class="text-sm font-bold tabular-nums text-forena-900"
                  >{{ calYear }}년 {{ calMonth }}월</span
                >
                <button
                  type="button"
                  class="inline-flex rounded-lg p-1.5 text-forena-600 transition-colors hover:bg-slate-100 hover:text-forena-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-flare-400/45"
                  :aria-label="T.calNextMonth"
                  @click.stop="shiftCalendarMonth(1)"
                >
                  <ChevronRight class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div class="grid grid-cols-7 gap-0.5 text-center">
                <span
                  v-for="(wd, wi) in filterCalWeekDays"
                  :key="wi"
                  class="py-1 text-[10px] font-bold text-forena-400"
                  >{{ wd }}</span
                >
              </div>
              <div
                v-for="(week, wwi) in filterCalendarWeeks"
                :key="wwi"
                class="mt-0.5 grid grid-cols-7 gap-0.5"
              >
                <template v-for="(day, ddi) in week" :key="ddi">
                  <button
                    v-if="day !== null"
                    type="button"
                    class="min-h-9 rounded-lg text-xs font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-flare-400/50"
                    :class="
                      filterCalendarDayKey(day) === filters.date
                        ? 'bg-flare-600 text-white hover:bg-flare-700'
                        : filterCalendarDayKey(day) === localTodayISODate()
                          ? 'text-forena-900 ring-1 ring-flare-400/55 hover:bg-slate-100'
                          : 'text-forena-800 hover:bg-slate-100'
                    "
                    @click.stop="pickFilterCalendarDay(day)"
                  >
                    {{ day }}
                  </button>
                  <div v-else class="min-h-9" aria-hidden="true" />
                </template>
              </div>
            </div>
          </div>
          <div class="mt-5 flex flex-wrap items-end gap-4">
            <div>
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                T.filterAffil
              }}</label>
              <select
                v-model="filters.selectedTrade"
                class="min-w-[11rem] rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              >
                <option
                  v-for="opt in tradeFilterOptions"
                  :key="opt.value || 'all'"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="relative min-w-[200px] flex-1">
              <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                T.filterSearch
              }}</label>
              <Search
                class="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-flare-500/80"
                aria-hidden="true"
              />
              <input
                v-model="searchNameInput"
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
                <strong class="font-bold text-forena-900">{{ todayWorkerCount }}</strong
                >{{ T.countPeople }}
              </span>
              <span v-if="totalPages > 1" class="text-[11px] text-forena-400 tabular-nums">
                ({{ currentPage + 1 }}&nbsp;/&nbsp;{{ totalPages }}&nbsp;페이지)
              </span>
            </div>
            <div
              class="flex w-full flex-wrap items-center justify-end gap-x-2 gap-y-1.5 sm:w-auto lg:max-w-[75%]"
            >
              <span class="text-[10px] font-bold uppercase tracking-wide text-forena-400">{{
                T.employmentFilterHint
              }}</span>
              <button
                v-for="ek in EMPLOYMENT_FILTER_LABELS"
                :key="ek"
                type="button"
                class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                :class="
                  listEmploymentFilter === ek
                    ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm ring-1 ring-sky-200/90'
                    : 'border-forena-200/90 bg-white/90 text-forena-700 hover:border-sky-300 hover:bg-white'
                "
                @click="toggleListEmploymentFilter(ek)"
              >
                {{ ek }}
                <span class="tabular-nums font-semibold text-forena-600/90">{{
                  employmentCounts[ek]
                }}</span>
              </button>
              <span
                class="mx-0.5 hidden h-4 w-px shrink-0 bg-forena-200 sm:inline-block"
                aria-hidden="true"
              />
              <span class="text-[10px] font-bold uppercase tracking-wide text-forena-400">{{
                T.attendanceFilterHint
              }}</span>
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
            <table class="w-full min-w-[980px] text-left text-sm whitespace-nowrap">
              <thead
                class="border-b border-forena-100 bg-forena-50/60 text-[11px] font-bold uppercase tracking-wider text-forena-500"
              >
                <tr>
                  <th class="px-6 py-4 font-semibold">{{ T.colContact }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colTrade }}</th>
                  <th class="px-6 py-4 font-semibold">{{ T.colEmployment }}</th>
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
                  <td class="px-6 py-4 text-xs font-semibold text-forena-800">
                    {{ record.affiliationSubLabel }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold"
                      :class="employmentBadgeClass(record.employmentClass)"
                    >
                      {{ record.employmentClass }}
                    </span>
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
          <!-- 페이지네이션 -->
          <div
            v-if="totalPages > 1"
            class="flex items-center justify-center gap-3 border-t border-forena-100 px-4 py-3"
          >
            <button
              type="button"
              :disabled="currentPage === 0"
              class="inline-flex items-center justify-center rounded-lg p-1.5 text-forena-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goToPage(currentPage - 1)"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <span class="text-xs font-semibold tabular-nums text-forena-700">
              {{ currentPage + 1 }} / {{ totalPages }}
              <span class="font-normal text-forena-400">({{ totalElements }}명)</span>
            </span>
            <button
              type="button"
              :disabled="currentPage >= totalPages - 1"
              class="inline-flex items-center justify-center rounded-lg p-1.5 text-forena-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goToPage(currentPage + 1)"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
