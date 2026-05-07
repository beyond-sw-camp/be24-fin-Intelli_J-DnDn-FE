<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  Upload,
  X,
  Users,
  Wrench,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  CalendarPlus,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  ClipboardList,
  Save,
} from 'lucide-vue-next'
import { planStore } from '@/data/planStore'
import { fetchTradeProcessList } from '@/api/tradeProcess.js'
import { fetchWorkPlanList, submitWeeklyWorkPlan, createWorkPlan } from '@/api/workplan.js'

const selectedProjectId = ref(1)

const weeklyPlans = ref([]) // 주간 작업 계획
const monthlyPlans = ref([]) // 월간 작업 계획
const annualPlans = ref([]) // 연간 작업 계획
const baselinePlans = ref([]) // 최초 공정표 기반 기준 공정
const loading = ref(false)
const viewMode = ref('weekly')
const filterTrade = ref('')
const filterStatus = ref('')
const selectedPlan = ref(null)
const uploadFileName = ref('')
const uploadCategory = ref('')
const trades = ['형틀', '전기', '방수', '골조', '설비', '철근']
const statuses = ['진행 예정', '진행 중']

// 업로드 메뉴 상태
const showUploadMenu = ref(false)
const uploadMenuRef = ref(null)
const yearlyInputRef = ref(null)
const monthlyInputRef = ref(null)

// 연장 정보 헬퍼 (planStore 기반)
function extOf(p) {
  return planStore.extensions[p.id] ?? null
}
// 화면에 보일 "최종 종료일" — 연장이 있으면 연장된 종료일, 없으면 원래 종료일
function effectiveEnd(p) {
  return extOf(p)?.extendedEnd ?? p.end
}

// viewMode 에 따라 알맞은 데이터셋을 필터링
// - weekly  → weeklyPlans
// - monthly → monthlyPlans
// (yearly는 별도 annualFiltered 사용)
const filtered = computed(() => {
  let r = viewMode.value === 'weekly' ? weeklyPlans.value : monthlyPlans.value
  if (viewMode.value !== 'weekly' && filterTrade.value)
    r = r.filter((p) => p.trade === filterTrade.value)
  if (filterStatus.value) r = r.filter((p) => workPlanStatus(p) === filterStatus.value)
  return r
})

const annualFiltered = computed(() => {
  let r = annualPlans.value
  if (filterTrade.value) r = r.filter((p) => p.trade === filterTrade.value)
  if (filterStatus.value) r = r.filter((p) => workPlanStatus(p) === filterStatus.value)
  return r
})

const statusClass = (s) => {
  if (s === '진행 중') return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
  return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
}

function workPlanStatus(plan) {
  if (!plan?.start) return '진행 예정'
  return formatDateLocal(new Date()) >= plan.start ? '진행 중' : '진행 예정'
}

// =========================
// 주간 캘린더
// =========================
function getWeekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function formatDateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function displayWeekStart(plan) {
  if (plan?.weekStart) return plan.weekStart
  if (!plan?.start) return '-'
  return formatDateLocal(getWeekStart(new Date(plan.start)))
}

const HOLIDAY_DATES = new Set([
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-03-01',
  '2026-03-02',
  '2026-05-01',
  '2026-05-05',
  '2026-05-24',
  '2026-05-25',
  '2026-06-03',
  '2026-06-06',
  '2026-08-15',
  '2026-08-17',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-10-03',
  '2026-10-05',
  '2026-10-09',
  '2026-12-25',
])

function isHolidayDate(dateStr) {
  return HOLIDAY_DATES.has(dateStr)
}

function dayTextClass(day) {
  if (day.isHoliday || day.isSunday) return 'text-rose-600'
  if (day.isSaturday) return 'text-blue-600'
  return 'text-forena-600'
}

function weeklyDayHeaderClass(day) {
  if (day.isHoliday || day.isSunday) return 'bg-rose-50 text-rose-600'
  if (day.isSaturday) return 'bg-blue-50 text-blue-600'
  if (day.isToday) return 'bg-flare-500 text-white'
  return 'bg-forena-50 text-forena-600'
}

function monthlyDayHeaderClass(day) {
  if (day.isHoliday || day.isSunday) return 'bg-rose-50 text-rose-600'
  if (day.isSaturday) return 'bg-blue-50 text-blue-600'
  if (day.isToday) return 'bg-flare-50 text-flare-700'
  return 'text-forena-500'
}

function monthlyDayCellClass(day) {
  if (day.isHoliday || day.isSunday) return 'bg-rose-50/40'
  if (day.isSaturday) return 'bg-blue-50/40'
  return ''
}

const selectedWeekStart = ref(getWeekStart(new Date()))

const weeklyWorkList = computed(() => {
  const start = formatDateLocal(selectedWeekStart.value)
  const endDate = new Date(selectedWeekStart.value)
  endDate.setDate(endDate.getDate() + 13)
  const end = formatDateLocal(endDate)

  return filtered.value
    .filter((p) => p.start <= end && effectiveEnd(p) >= start)
    .slice()
    .sort((a, b) => {
      const startOrder = (a.start || '').localeCompare(b.start || '')
      if (startOrder !== 0) return startOrder
      const endOrder = (effectiveEnd(a) || '').localeCompare(effectiveEnd(b) || '')
      if (endOrder !== 0) return endOrder
      return (a.name || '').localeCompare(b.name || '')
    })
})

const weekDays = computed(() => {
  const today = new Date()
  const start = new Date(selectedWeekStart.value)
  const labels = ['일', '월', '화', '수', '목', '금', '토']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const isToday = d.toDateString() === today.toDateString()
    const dow = d.getDay()
    return {
      label: labels[dow],
      date: formatDateLocal(d),
      day: d.getDate(),
      month: d.getMonth() + 1,
      isToday,
      isHoliday: isHolidayDate(formatDateLocal(d)),
      isSunday: dow === 0,
      isSaturday: dow === 6,
      isWeekend: dow === 0 || dow === 6,
    }
  })
})

const weekHeader = computed(() => {
  const first = weekDays.value[0]
  const last = weekDays.value[6]
  if (!first || !last) return ''
  const [y, m] = first.date.split('-')
  return `${Number(y)}년 ${Number(m)}월 · ${first.month}.${first.day} ~ ${last.month}.${last.day}`
})

// 해당 날짜에 표시할 작업과 연장 여부 함께 반환
const isCurrentWeek = computed(
  () => selectedWeekStart.value.toDateString() === getWeekStart(new Date()).toDateString(),
)

function prevWeek() {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() - 7)
  selectedWeekStart.value = d
}

function nextWeek() {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() + 7)
  selectedWeekStart.value = d
}

function goCurrentWeek() {
  selectedWeekStart.value = getWeekStart(new Date())
}

function plansForDay(dateStr) {
  return filtered.value
    .filter((p) => p.start <= dateStr && effectiveEnd(p) >= dateStr)
    .map((p) => ({
      ...p,
      // 이 날짜가 "연장 구간(원래 end 이후)"에 속하는지
      isExtensionDay: extOf(p) && dateStr > p.end,
    }))
}

// =========================
// 업로드 (연간/월간 → 간트차트 검증 모달)
// =========================
function toggleUploadMenu() {
  showUploadMenu.value = !showUploadMenu.value
}
function pickYearly() {
  showUploadMenu.value = false
  yearlyInputRef.value?.click()
}
function pickMonthly() {
  showUploadMenu.value = false
  monthlyInputRef.value?.click()
}
// 주간은 업로드가 아니라 협력사 작성 모달을 띄움
function openWeeklyComposer() {
  showUploadMenu.value = false
  openWeeklyForm()
}

// 검증 모달 상태
const showVerifyModal = ref(false)
const verifyCategory = ref('') // '연간' | '월간'
const verifyFileName = ref('')
const verifyRows = ref([]) // 파싱된 행 (데모: 모의 데이터)

function onFileChange(e, category) {
  const f = e.target.files?.[0]
  if (!f) {
    e.target.value = ''
    return
  }
  uploadFileName.value = f.name
  uploadCategory.value = category
  // 검증 모달용 모의 파싱 결과 생성 (실제 환경에서는 백엔드 파싱 결과로 교체)
  verifyCategory.value = category
  verifyFileName.value = f.name
  verifyRows.value = generateMockParseRows(category)
  showVerifyModal.value = true
  e.target.value = ''
}

// 데모용: 업로드 파일에서 추출되었다고 가정하는 행
function generateMockParseRows(category) {
  if (category === '연간') {
    return [
      {
        id: 'r1',
        name: '본동 골조 공사',
        trade: '골조',
        location: '본동 1~10층',
        start: '2026-03-01',
        end: '2026-08-31',
        issue: null,
      },
      {
        id: 'r2',
        name: '지하주차장 방수',
        trade: '방수',
        location: '지하 1~3층',
        start: '2026-04-15',
        end: '2026-06-30',
        issue: null,
      },
      {
        id: 'r3',
        name: '전기 간선 설치',
        trade: '전기',
        location: '전 층',
        start: '2026-05-01',
        end: '2026-09-15',
        issue: 'warning',
      },
      {
        id: 'r4',
        name: '외부 마감',
        trade: '형틀',
        location: '외벽',
        start: '',
        end: '2026-10-31',
        issue: 'error',
      },
    ]
  }
  // 월간
  return [
    {
      id: 'm1',
      name: 'B2층 전기 배관 설치',
      trade: '전기',
      location: 'B2층 전기실',
      start: '2026-04-29',
      end: '2026-05-08',
      issue: null,
    },
    {
      id: 'm2',
      name: '본동 3층 슬라브 철근 박·고정',
      trade: '철근',
      location: '본동 3층',
      start: '2026-04-25',
      end: '2026-05-02',
      issue: null,
    },
    {
      id: 'm3',
      name: 'B1층 슬라브 형틀 조립',
      trade: '형틀',
      location: 'B1층 전체',
      start: '2026-04-28',
      end: '2026-05-05',
      issue: null,
    },
    {
      id: 'm4',
      name: '지하주차장 방수 공사',
      trade: '방수',
      location: '지하 주차구역 A',
      start: '2026-05-03',
      end: '',
      issue: 'error',
    },
  ]
}

const verifyStats = computed(() => {
  const total = verifyRows.value.length
  const errors = verifyRows.value.filter((r) => r.issue === 'error').length
  const warnings = verifyRows.value.filter((r) => r.issue === 'warning').length
  const ok = total - errors - warnings
  return { total, ok, warnings, errors }
})

function fixVerifyRow(row) {
  // 데모: 누락된 날짜를 임의의 합리적 값으로 채움
  if (!row.start) row.start = row.end || new Date().toISOString().slice(0, 10)
  if (!row.end) row.end = row.start
  row.issue = null
}
function removeVerifyRow(row) {
  verifyRows.value = verifyRows.value.filter((r) => r.id !== row.id)
}
async function confirmVerifyAndApply() {
  const validRows = verifyRows.value.filter((row) => row.name && row.trade && row.start && row.end)

  if (!validRows.length) {
    alert('저장할 수 있는 작업이 없습니다.')
    return
  }

  try {
    await Promise.all(
      validRows.map((row) =>
        createWorkPlan({
          name: row.name,
          trade: row.trade,
          location: row.location,
          planType: verifyCategory.value, // '연간' 또는 '월간'
          status: '진행 예정',
          start: row.start,
          end: row.end,
          requiredCount: 0,
          workers: [],
          equipment: [],
          partner: '',
          manager: '',
          contact: '',
          weekStart: '',
          note: '',
        }),
      ),
    )

    showVerifyModal.value = false
    alert(`${verifyCategory.value} 계획서 ${validRows.length}건이 저장되었습니다.`)

    await loadPlans()
  } catch (err) {
    console.error(`${verifyCategory.value} 계획서 저장 실패:`, err)
    alert(err.message || '계획서 저장에 실패했습니다.')
  }
}
function cancelVerify() {
  showVerifyModal.value = false
  verifyRows.value = []
  uploadFileName.value = ''
}

// =========================
// 주간 계획서 작성 (협력사/공정 담당자)
// =========================
// 직종 목록 (백엔드 WorkerTrade enum 라벨과 일치)
const WORKER_TRADES = [
  '전공',
  '보통공',
  '철근공',
  '형틀공',
  '목수',
  '미장공',
  '조적공',
  '도장공',
  '방수공',
  '타일공',
  '전기공',
  '배관공',
  '용접공',
  '기타',
]

// 장비 목록 (백엔드 EquipmentType enum 라벨과 일치, optgroup용 그룹 구조)
const EQUIPMENT_GROUPS = [
  { label: '굴착·토공', items: ['굴삭기', '미니굴삭기', '백호', '드래그라인'] },
  {
    label: '운반',
    items: ['덤프트럭', '트럭 믹서', '트랙터', '트레일러', '스크레이퍼'],
  },
  {
    label: '하역·양중',
    items: ['타워크레인', '모바일 크레인', '크롤러 크레인', '지게차', '리프트'],
  },
  { label: '정지·다짐', items: ['불도저', '모터 그레이더', '롤러', '콤팩터'] },
  {
    label: '도로·포장',
    items: ['아스팔트 피니셔', '밀링 머신', '살수차', '노면 절단기'],
  },
  {
    label: '기초·파일',
    items: ['파일 드라이버', '보링머신', '어스오거', 'RCD'],
  },
  { label: '콘크리트', items: ['콘크리트 펌프카', '배치 플랜트', '바이브레이터'] },
  {
    label: '철거·특수',
    items: ['브레이커', '니블러', '크러셔', '고소작업차', 'TBM'],
  },
  { label: '기타', items: ['기타'] },
]

const showWeeklyForm = ref(false)
const weeklyForm = ref(null) // { partner, manager, weekStart, items: [...] }

const monthlyPlanOptions = computed(() => {
  return monthlyPlans.value.map((p) => ({
    id: p.id,
    label: `${p.name} / ${p.location || '-'} / ${p.start} ~ ${p.end}`,
    raw: p,
  }))
})

function openWeeklyForm() {
  // 이번 주 시작일(일요일 기준)
  const t = new Date()
  const ws = new Date(t)
  ws.setDate(t.getDate() - t.getDay())

  const weekStart = ws.toISOString().slice(0, 10)

  weeklyForm.value = {
    // 선택한 월간 계획 정보
    monthlyPlanId: null,
    monthlyPlanName: '',
    tradeProcessId: null,
    trade: '',
    monthlyStart: '',
    monthlyEnd: '',
    monthlyLocation: '',

    // 주간 계획서 공통 정보
    partner: '',
    manager: '',
    contact: '',
    weekStart,

    // 일자별 작업
    items: [makeWeeklyItem(weekStart)],
  }

  showWeeklyForm.value = true
}

function makeWeeklyItem(date, defaults = {}) {
  return {
    id: `wi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date,
    processName: defaults.processName || '',
    zone: defaults.zone || '',
    workers: [makeWorkerEntry()],
    equipment: [makeEquipmentEntry()],
    note: '',
  }
}
function onSelectMonthlyPlan() {
  if (!weeklyForm.value) return

  const selected = monthlyPlans.value.find(
    (p) => String(p.id) === String(weeklyForm.value.monthlyPlanId),
  )

  if (!selected) return

  weeklyForm.value.monthlyPlanName = selected.name || ''
  weeklyForm.value.tradeProcessId = selected.tradeProcessId || null
  weeklyForm.value.trade = selected.trade || ''
  weeklyForm.value.monthlyStart = selected.start || ''
  weeklyForm.value.monthlyEnd = selected.end || ''
  weeklyForm.value.monthlyLocation = selected.location || ''

  weeklyForm.value.partner = selected.partner || ''
  weeklyForm.value.manager = selected.manager || ''
  weeklyForm.value.contact = selected.contact || ''

  weeklyForm.value.weekStart = selected.start || weeklyForm.value.weekStart

  weeklyForm.value.items = [
    makeWeeklyItem(selected.start || weeklyForm.value.weekStart, {
      processName: selected.name || '',
      zone: selected.location || '',
    }),
  ]
}

function makeWorkerEntry() {
  return {
    tradeId: `wt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    trade: '전공',
    count: 1,
  }
}

function addWorker(item) {
  item.workers.push(makeWorkerEntry())
}

function removeWorker(item, idx) {
  if (item.workers.length <= 1) return
  item.workers.splice(idx, 1)
}

// 한 일자 카드의 총 투입 인원
function itemWorkerTotal(item) {
  if (!item || !Array.isArray(item.workers)) return 0
  return item.workers.reduce((sum, w) => sum + (Number(w.count) || 0), 0)
}

function makeEquipmentEntry() {
  return {
    equipId: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: '굴삭기',
    count: 1,
  }
}

function addEquipment(item) {
  item.equipment.push(makeEquipmentEntry())
}

function removeEquipment(item, idx) {
  if (item.equipment.length <= 1) return
  item.equipment.splice(idx, 1)
}

// 한 일자 카드의 총 장비 수
function itemEquipmentTotal(item) {
  if (!item || !Array.isArray(item.equipment)) return 0
  return item.equipment.reduce((sum, e) => sum + (Number(e.count) || 0), 0)
}

function addWeeklyItem() {
  if (!weeklyForm.value) return

  const lastDate = weeklyForm.value.items.at(-1)?.date
  const baseDate = lastDate || weeklyForm.value.weekStart

  weeklyForm.value.items.push(
    makeWeeklyItem(baseDate, {
      processName: weeklyForm.value.monthlyPlanName,
      zone: weeklyForm.value.monthlyLocation,
    }),
  )
}

function removeWeeklyItem(idx) {
  if (weeklyForm.value.items.length <= 1) return
  weeklyForm.value.items.splice(idx, 1)
}

const weeklyFormValid = computed(() => {
  if (!weeklyForm.value) return false

  const w = weeklyForm.value

  if (!w.monthlyPlanId) return false
  if (!w.partner.trim() || !w.manager.trim()) return false

  return w.items.every(
    (it) =>
      it.date &&
      it.processName.trim() &&
      it.zone.trim() &&
      Array.isArray(it.workers) &&
      it.workers.length > 0 &&
      it.workers.every((wk) => wk.trade && wk.trade.trim() && Number(wk.count) > 0) &&
      Array.isArray(it.equipment) &&
      it.equipment.length > 0 &&
      it.equipment.every((eq) => eq.type && eq.type.trim() && Number(eq.count) > 0),
  )
})

async function submitWeeklyForm() {
  if (!weeklyFormValid.value) return
  const w = weeklyForm.value

  try {
    // 백엔드 WeeklySubmitReq 형식으로 매핑
    const payload = {
      // 선택한 월간 계획이 주간 계획의 부모가 됨
      parentWorkPlanId: w.monthlyPlanId,

      // 기준 공정 연결
      tradeProcessId: w.tradeProcessId,

      partner: w.partner,
      manager: w.manager,
      contact: w.contact,
      weekStart: w.weekStart,

      items: w.items.map((it) => ({
        date: it.date,
        processName: it.processName,
        zone: it.zone,
        workers: it.workers.map((wk) => ({
          trade: wk.trade,
          count: Number(wk.count) || 0,
        })),
        equipment: it.equipment.map((eq) => ({
          type: eq.type,
          count: Number(eq.count) || 0,
        })),
        note: it.note,
      })),
    }

    await submitWeeklyWorkPlan(payload)

    showWeeklyForm.value = false
    alert(`${w.partner} (${w.manager}) 주간 계획서 ${w.items.length}건이 제출되었습니다.`)

    // 제출 후 목록 재조회 (서버에 저장된 새 plan들이 반영됨)
    await loadPlans()
  } catch (err) {
    console.error('주간 계획서 제출 실패:', err)
    alert(err.message || '주간 계획서 제출에 실패했습니다.')
  }
}
function cancelWeeklyForm() {
  showWeeklyForm.value = false
  weeklyForm.value = null
}

function handleClickOutside(e) {
  if (uploadMenuRef.value && !uploadMenuRef.value.contains(e.target)) showUploadMenu.value = false
}

// 작업 계획 목록 로드 (주간 + 월간 + 연간 동시 호출)
async function loadPlans() {
  try {
    loading.value = true

    const projectId = selectedProjectId.value || 1

    const [baselineRes, weeklyRes, monthlyRes, yearlyRes] = await Promise.all([
      fetchTradeProcessList({ projectId }),
      fetchWorkPlanList({ planType: '주간' }),
      fetchWorkPlanList({ planType: '월간' }),
      fetchWorkPlanList({ planType: '연간' }),
    ])

    baselinePlans.value = baselineRes
    weeklyPlans.value = weeklyRes
    monthlyPlans.value = monthlyRes
    annualPlans.value = yearlyRes
  } catch (err) {
    console.error('계획 목록 조회 실패:', err)
    alert(err.message || '계획 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

// 필터 변경 시 재조회 (서버 사이드 필터링)
watch([filterTrade, filterStatus], () => {
  loadPlans()
})

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  loadPlans()
})
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

function importAi() {
  alert('AI로 작업계획을 불러옵니다. (데모)')
}

// =========================
// 월간/연간 간트차트
// =========================
const GANTT_DAY_W = 42
const GANTT_MONTH_W = 108
const NAME_COL_W = 240

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth() + 1)

function prevYear() {
  viewYear.value -= 1
}
function nextYear() {
  viewYear.value += 1
}

function prevMonth() {
  if (viewMonth.value === 1) {
    viewMonth.value = 12
    viewYear.value -= 1
  } else viewMonth.value -= 1
}
function nextMonth() {
  if (viewMonth.value === 12) {
    viewMonth.value = 1
    viewYear.value += 1
  } else viewMonth.value += 1
}
function goToday() {
  const t = new Date()
  viewYear.value = t.getFullYear()
  viewMonth.value = t.getMonth() + 1
}

const monthMeta = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value - 1
  const last = new Date(y, m + 1, 0)
  const today = new Date()
  const days = []
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(y, m, d)
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = dt.getDay()
    days.push({
      day: d,
      date: dateStr,
      dow,
      isHoliday: isHolidayDate(dateStr),
      isSunday: dow === 0,
      isSaturday: dow === 6,
      isWeekend: dow === 0 || dow === 6,
      isToday: dt.toDateString() === today.toDateString(),
    })
  }
  return {
    year: y,
    month: m + 1,
    daysInMonth: last.getDate(),
    days,
    firstDate: `${y}-${String(m + 1).padStart(2, '0')}-01`,
    lastDate: `${y}-${String(m + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`,
  }
})

const isCurrentMonth = computed(() => {
  const t = new Date()
  return viewYear.value === t.getFullYear() && viewMonth.value === t.getMonth() + 1
})

const isCurrentYear = computed(() => {
  const t = new Date()
  return viewYear.value === t.getFullYear()
})

// 이번 달과 겹치는 작업 (연장된 종료일까지 고려)
const monthlyGanttSource = computed(() => {
  let r = [...baselinePlans.value, ...monthlyPlans.value]

  if (filterTrade.value) {
    r = r.filter((p) => p.trade === filterTrade.value)
  }

  if (filterStatus.value) {
    r = r.filter((p) => workPlanStatus(p) === filterStatus.value)
  }

  return r
})

const yearlyGanttSource = computed(() => {
  let r = [...baselinePlans.value, ...annualPlans.value]

  if (filterTrade.value) {
    r = r.filter((p) => p.trade === filterTrade.value)
  }

  if (filterStatus.value) {
    r = r.filter((p) => workPlanStatus(p) === filterStatus.value)
  }

  return r
})

const ganttPlans = computed(() => {
  const { firstDate, lastDate } = monthMeta.value

  return monthlyGanttSource.value.filter(
    (p) => !(effectiveEnd(p) < firstDate || p.start > lastDate),
  )
})

const yearlyPlans = computed(() => {
  const { firstDate, lastDate } = yearMeta.value

  return yearlyGanttSource.value.filter((p) => !(effectiveEnd(p) < firstDate || p.start > lastDate))
})

const yearMeta = computed(() => {
  const y = viewYear.value
  return {
    year: y,
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: `${i + 1}월`,
      firstDate: `${y}-${String(i + 1).padStart(2, '0')}-01`,
      lastDate: `${y}-${String(i + 1).padStart(2, '0')}-${String(new Date(y, i + 1, 0).getDate()).padStart(2, '0')}`,
      isCurrent: y === today.getFullYear() && i === today.getMonth(),
    })),
    firstDate: `${y}-01-01`,
    lastDate: `${y}-12-31`,
  }
})

// 막대 위치/너비 계산 — 이번 달 영역 내로 클리핑
function barStyle(startStr, endStr) {
  if (!startStr || !endStr) return null
  const { firstDate, lastDate } = monthMeta.value
  if (endStr < firstDate || startStr > lastDate) return null
  const s = startStr < firstDate ? firstDate : startStr
  const e = endStr > lastDate ? lastDate : endStr
  const sd = Number(s.slice(8, 10))
  const ed = Number(e.slice(8, 10))
  const span = Math.max(1, ed - sd + 1)
  return {
    left: `${(sd - 1) * GANTT_DAY_W + 4}px`,
    width: `${span * GANTT_DAY_W - 8}px`,
  }
}

function monthCellCenterStyle(dateStr) {
  if (!dateStr) return null
  const { firstDate, lastDate } = monthMeta.value
  if (dateStr < firstDate || dateStr > lastDate) return null
  const day = Number(dateStr.slice(8, 10))
  return { left: `${(day - 1) * GANTT_DAY_W + GANTT_DAY_W / 2}px` }
}

function yearBarStyle(startStr, endStr) {
  if (!startStr || !endStr) return null
  const { firstDate, lastDate, year } = yearMeta.value
  if (endStr < firstDate || startStr > lastDate) return null
  const s = startStr < firstDate ? firstDate : startStr
  const e = endStr > lastDate ? lastDate : endStr
  const sm = Number(s.slice(5, 7))
  const em = Number(e.slice(5, 7))
  const span = Math.max(1, em - sm + 1)
  const startDay = Number(s.slice(8, 10))
  const endDay = Number(e.slice(8, 10))
  const startMonthDays = new Date(year, sm, 0).getDate()
  const endMonthDays = new Date(year, em, 0).getDate()
  const leftOffset = ((startDay - 1) / startMonthDays) * GANTT_MONTH_W
  const rightTrim = ((endMonthDays - endDay) / endMonthDays) * GANTT_MONTH_W
  return {
    left: `${(sm - 1) * GANTT_MONTH_W + leftOffset + 4}px`,
    width: `${span * GANTT_MONTH_W - leftOffset - rightTrim - 8}px`,
  }
}

function actualLineRange(p) {
  return {
    start: p.actualStart || p.start,
    end: effectiveEnd(p),
  }
}

function progressFillEnd(p) {
  const range = actualLineRange(p)
  const t = formatDateLocal(new Date())
  if (t < range.start) return null
  return t > range.end ? range.end : t
}

function progressPctOf(p) {
  const raw = p?.raw || p || {}
  const value =
    raw.actualPct ??
    raw.progressPct ??
    raw.progress ??
    raw.processProgress ??
    raw.actualProgress ??
    p?.actualPct ??
    p?.progressPct ??
    p?.progress ??
    p?.processProgress ??
    p?.actualProgress
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null
}

function progressBarStyle(p, styleFn) {
  const full = styleFn(p.start, p.end)
  if (!full) return { width: '0px' }

  const pct = progressPctOf(p)
  if (pct != null) return { width: `${pct}%` }

  const fillEnd = progressFillEnd(p)
  if (!fillEnd) return { width: '0px' }

  const fill = styleFn(p.start, fillEnd)
  if (!fill) return { width: '0px' }

  const fullLeft = parseFloat(full.left)
  const fullWidth = parseFloat(full.width)
  const fillLeft = parseFloat(fill.left)
  const fillWidth = parseFloat(fill.width)
  const width = Math.max(0, Math.min(fullWidth, fillLeft + fillWidth - fullLeft))

  return { width: `${width}px` }
}

function progressDotStyle(p, styleFn) {
  const widthValue = progressBarStyle(p, styleFn).width
  const width = widthValue.endsWith('%')
    ? (parseFloat(widthValue) / 100) * parseFloat(styleFn(p.start, p.end)?.width || 0)
    : parseFloat(widthValue)

  if (!Number.isFinite(width) || width <= 0) return { display: 'none' }
  return { left: `${Math.max(0, width - 4)}px` }
}

// 오늘 라인
const todayLineStyle = computed(() => {
  const t = new Date()
  const { year, month } = monthMeta.value
  if (t.getFullYear() !== year || t.getMonth() + 1 !== month) return null
  const left = (t.getDate() - 1) * GANTT_DAY_W + GANTT_DAY_W / 2
  return { left: `${left}px` }
})

const chartWidth = computed(() => monthMeta.value.daysInMonth * GANTT_DAY_W)
const yearChartWidth = computed(() => 12 * GANTT_MONTH_W)

// 화면 상단/필터 바 — 활성 연장 개수
const extensionCount = computed(() => Object.keys(planStore.extensions).length)

function selectViewMode(mode) {
  viewMode.value = mode
  selectedPlan.value = null
}

// =========================
// 공종 → 공정 → 위치별 실행계획 (3단 그룹핑)
// =========================
// trade_process / work_plan 양쪽 응답 형태가 다양할 수 있어
// 가능한 필드명을 모두 폴백으로 처리한다.
function baseId(b) {
  return b.tradeProcessId ?? b.idx ?? b.id ?? null
}
function baseTradeName(b) {
  return b.tradeName ?? b.trade ?? '미분류'
}
function baseProcessName(b) {
  return b.processName ?? b.name ?? '(공정명 없음)'
}
function baseStart(b) {
  return b.plannedStart ?? b.baselineStart ?? b.start ?? null
}
function baseEnd(b) {
  return b.plannedEnd ?? b.baselineEnd ?? b.end ?? null
}
function baseWeight(b) {
  return b.weightPct ?? b.weight ?? null
}
function baseIsMilestone(b) {
  return b.isMilestone ?? b.milestone ?? false
}
function workPlanTradeProcessId(w) {
  return w.tradeProcessId ?? w.trade_process_id ?? w.baseId ?? null
}

// 공종 그룹핑 공통 함수
// plans: work_plan 목록 (annual 또는 monthly)
// returns: [{ group, items: [{ ...baseline, workPlans: [...] }] }]
function buildGroups(plans) {
  // 공종 → 공정 맵 구성 (baselinePlans 기준)
  const tradeMap = new Map()

  for (const b of baselinePlans.value) {
    if (filterTrade.value && baseTradeName(b) !== filterTrade.value) continue

    const trade = baseTradeName(b)
    if (!tradeMap.has(trade)) tradeMap.set(trade, [])
    tradeMap.get(trade).push({
      id: baseId(b),
      tradeProcessId: baseId(b),
      name: baseProcessName(b),
      trade,
      weightPct: baseWeight(b),
      baselineStart: baseStart(b),
      baselineEnd: baseEnd(b),
      isMilestone: baseIsMilestone(b),
      raw: b,
      workPlans: [],
    })
  }

  // 미연결 work_plan 보관용
  const orphans = []

  // work_plan들을 해당 trade_process에 매칭
  for (const w of plans) {
    const tpid = workPlanTradeProcessId(w)
    if (tpid == null) {
      console.warn('[WorkPlanView] tradeProcessId 없는 work_plan:', w)
      orphans.push(w)
      continue
    }

    let matched = null
    for (const arr of tradeMap.values()) {
      const found = arr.find((it) => String(it.tradeProcessId) === String(tpid))
      if (found) {
        matched = found
        break
      }
    }
    if (!matched) {
      console.warn('[WorkPlanView] 매칭되는 trade_process 없음:', w)
      orphans.push(w)
      continue
    }

    if (filterStatus.value && workPlanStatus(w) !== filterStatus.value) continue

    matched.workPlans.push({
      id: w.id,
      name: w.name,
      location: w.location || '',
      start: w.start,
      end: effectiveEnd(w),
      status: workPlanStatus(w),
      raw: w,
    })
  }

  // work_plan이 없는 공정은 기준 일정을 기본 실행 일정으로 세팅
  for (const arr of tradeMap.values()) {
    for (const item of arr) {
      if (item.workPlans.length === 0 && item.baselineStart && item.baselineEnd) {
        item.workPlans.push({
          id: `__default-${item.id}`,
          name: item.name,
          location: '기본 실행 일정',
          start: item.baselineStart,
          end: item.baselineEnd,
          status: '진행 예정',
          isDefault: true, // 기준 일정에서 복제된 기본값임을 표시
          raw: null,
        })
      }
    }
  }

  // 그룹 배열로 변환
  const groups = []
  for (const [trade, items] of tradeMap.entries()) {
    groups.push({ group: trade, items })
  }

  // 미연결 실행계획 그룹
  if (orphans.length) {
    groups.push({
      group: '미연결 실행계획',
      isOrphan: true,
      items: [
        {
          id: '__orphan__',
          tradeProcessId: null,
          name: '기준 공정에 연결되지 않은 실행계획',
          trade: '미연결',
          weightPct: null,
          baselineStart: null,
          baselineEnd: null,
          isMilestone: false,
          workPlans: orphans.map((w) => ({
            id: w.id,
            name: w.name,
            location: w.location || '',
            start: w.start,
            end: effectiveEnd(w),
            status: workPlanStatus(w),
            raw: w,
          })),
        },
      ],
    })
  }

  return groups
}

// 월간 work_plan에서 "월간계획서 기준 일정"(파란선) 가져오기
// 백엔드 스키마 변경 전: plannedStart/plannedEnd 없으면 실행 start/end로 폴백 (두 선이 겹쳐 보임)
function workPlanPlannedStart(w) {
  return w.plannedStart ?? w.planned_start ?? w.start ?? null
}
function workPlanPlannedEnd(w) {
  return w.plannedEnd ?? w.planned_end ?? effectiveEnd(w) ?? null
}

// 연간 work_plan들에서 공정별 "마일스톤 종료일" 계산
// = 같은 tradeProcessId의 연간 work_plan들 중 가장 늦은 종료일
function buildProcessMilestones() {
  const m = new Map() // tradeProcessId -> { date, source }
  for (const w of annualPlans.value) {
    const tpid = workPlanTradeProcessId(w)
    if (tpid == null) continue
    const end = effectiveEnd(w)
    if (!end) continue
    const prev = m.get(tpid)
    if (!prev || end > prev.date) {
      m.set(tpid, { date: end, source: w })
    }
  }
  return m
}

// 월간 전용: 공종 → 공정 → 세부계획(work_plan) 3단 구조
// 연간 buildGroups와 차이점:
//  - 공정 행: baseline 막대가 아닌 "마일스톤 점"(연간 빨간선 종료일) 표시
//  - 세부계획 행: 파란선(월간계획서 기준 plannedStart/End) + 빨간선(실행 start/end)
function buildMonthlyGroups(plans) {
  const tradeMap = new Map()
  const milestones = buildProcessMilestones()

  // 1) baseline(trade_process) 기준으로 공종 → 공정 골격 생성
  for (const b of baselinePlans.value) {
    if (filterTrade.value && baseTradeName(b) !== filterTrade.value) continue
    const trade = baseTradeName(b)
    const tpid = baseId(b)
    if (!tradeMap.has(trade)) tradeMap.set(trade, [])
    const milestone = milestones.get(tpid)
    tradeMap.get(trade).push({
      id: tpid,
      tradeProcessId: tpid,
      name: baseProcessName(b),
      trade,
      weightPct: baseWeight(b),
      baselineStart: baseStart(b),
      baselineEnd: baseEnd(b),
      // 공정 마일스톤: 연간 work_plan의 가장 늦은 종료일 (없으면 baselineEnd)
      milestoneDate: milestone ? milestone.date : baseEnd(b),
      milestoneFromAnnual: !!milestone,
      isMilestone: baseIsMilestone(b),
      raw: b,
      details: [], // 세부계획(월간 work_plan)들
    })
  }

  // 2) 월간 work_plan들을 세부계획으로 매칭
  const orphans = []
  for (const w of plans) {
    const tpid = workPlanTradeProcessId(w)
    if (tpid == null) {
      orphans.push(w)
      continue
    }
    let matched = null
    for (const arr of tradeMap.values()) {
      const found = arr.find((it) => it.tradeProcessId === tpid)
      if (found) {
        matched = found
        break
      }
    }
    if (!matched) {
      orphans.push(w)
      continue
    }
    if (filterStatus.value && workPlanStatus(w) !== filterStatus.value) continue

    matched.details.push({
      id: w.id,
      name: w.name || '(세부계획명 없음)',
      location: w.location || '',
      // 파란선 = 월간계획서 기준 일정
      plannedStart: workPlanPlannedStart(w),
      plannedEnd: workPlanPlannedEnd(w),
      // 빨간선 = 실행 일정 (주간/지시서/일보로 갱신됨)
      start: w.start,
      end: effectiveEnd(w),
      status: workPlanStatus(w),
      raw: w,
    })
  }

  // 3) 그룹 배열로 변환
  const groups = []
  for (const [trade, items] of tradeMap.entries()) {
    groups.push({ group: trade, items })
  }

  // 4) 미연결 실행계획
  if (orphans.length) {
    groups.push({
      group: '미연결 실행계획',
      isOrphan: true,
      items: [
        {
          id: '__orphan__',
          tradeProcessId: null,
          name: '기준 공정에 연결되지 않은 세부계획',
          trade: '미연결',
          weightPct: null,
          baselineStart: null,
          baselineEnd: null,
          milestoneDate: null,
          milestoneFromAnnual: false,
          isMilestone: false,
          details: orphans.map((w) => ({
            id: w.id,
            name: w.name,
            location: w.location || '',
            plannedStart: workPlanPlannedStart(w),
            plannedEnd: workPlanPlannedEnd(w),
            start: w.start,
            end: effectiveEnd(w),
            status: workPlanStatus(w),
            raw: w,
          })),
        },
      ],
    })
  }

  return groups
}

// 연간: 공종 → 공정 → 위치별 실행계획 (3단)
const yearlyGroups = computed(() => buildGroups(annualPlans.value))
// 월간: 공종 → 공정(마일스톤) → 세부계획(파란/빨간선) (3단)
const monthlyGroups = computed(() => buildMonthlyGroups(monthlyPlans.value))

// 공종 그룹 펼침 상태
const groupOpen = ref({})

// 월간: 공정별 펼침 상태 (공정 ID 기준)
const monthlyProcessOpen = ref({})

watch(
  [yearlyGroups, monthlyGroups],
  () => {
    const all = [...yearlyGroups.value, ...monthlyGroups.value]
    for (const g of all) {
      if (groupOpen.value[g.group] === undefined) {
        groupOpen.value[g.group] = true
      }
    }
    // 월간 공정 펼침 상태 초기화 (기본: 펼쳐짐)
    for (const g of monthlyGroups.value) {
      for (const item of g.items) {
        if (monthlyProcessOpen.value[item.id] === undefined) {
          monthlyProcessOpen.value[item.id] = true
        }
      }
    }
  },
  { immediate: true },
)

// 공정 한 줄의 고정 높이 (좌측 컨텐츠와 우측 차트 행이 정확히 일치하도록)
// 좌측 컨텐츠 실측:
//   - py-2 위아래 = 16px
//   - 공정명 줄 = 20px
//   - 기준기간 줄 = 14px
//   - gap-0.5 = 2px × 2 = 4px
//   - workPlans ul: mt-1 (4px) + 각 wp 14px + space-y-0.5 (2px)
// 우측 차트:
//   - 기준선 top:14, 실행선 top:34부터 20px 간격
function processRowHeight(item) {
  const wp = item.workPlans?.length || 0
  // 헤더부(공정명+기준기간+padding) 약 60px + workPlans 영역
  const wpArea = wp === 0 ? 18 : 4 + wp * 18 // mt-1 + 줄당 약 18px
  const left = 60 + wpArea
  // 우측 차트가 모든 실행선을 보여주려면 (workPlanTop(last) + 6) 이상 필요
  const right = wp === 0 ? 48 : workPlanTop(wp - 1) + 14
  return Math.max(left, right, 56)
}

// 월간: 공정 헤더 행 한 줄 높이 (공정명 + 마일스톤 표시)
const MONTHLY_PROCESS_HEADER_H = 44
// 월간: 세부계획 한 줄 높이 (파란선 + 빨간선 한 쌍 들어갈 공간)
const MONTHLY_DETAIL_ROW_H = 32

function monthlyProcessHeaderHeight() {
  return MONTHLY_PROCESS_HEADER_H
}
function monthlyDetailRowHeight() {
  return MONTHLY_DETAIL_ROW_H
}

// work_plan 실행선의 top 위치
function workPlanTop(idx) {
  return 34 + idx * 20
}

// 기준선 클릭 (수정 불가 안내)
function onClickBaseline(item) {
  selectedPlan.value = {
    __baseline: true,
    id: `base-${item.id}`,
    name: item.name,
    trade: item.trade,
    start: item.baselineStart,
    end: item.baselineEnd,
    weightPct: item.weightPct,
    location: '',
  }
}

// 실행선 클릭 (기존 selectedPlan 동작)
function onClickWorkPlan(wp) {
  if (wp.isDefault) {
    // 기본 실행 일정 = 기준 일정과 동일하므로 baseline 안내로 표시
    selectedPlan.value = {
      __baseline: true,
      id: `default-${wp.id}`,
      name: wp.name,
      trade: '',
      start: wp.start,
      end: wp.end,
      weightPct: null,
      location: wp.location,
    }
    return
  }
  selectedPlan.value = wp.raw
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 pb-6">
    <!-- 헤더 -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">공정 계획</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
          <button
            v-for="m in [
              ['yearly', '연간'],
              ['monthly', '월간'],
              ['weekly', '주간'],
            ]"
            :key="m[0]"
            class="px-3.5 py-1.5 text-xs font-bold transition"
            :class="
              viewMode === m[0] ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'
            "
            @click="selectViewMode(m[0])"
          >
            {{ m[1] }}
          </button>
        </div>

        <div class="relative" ref="uploadMenuRef">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50"
            @click="toggleUploadMenu"
          >
            <Upload class="h-3.5 w-3.5 text-forena-400" />
            계획서 업로드
            <ChevronDown
              class="h-3 w-3 text-forena-400 transition-transform"
              :class="showUploadMenu ? 'rotate-180' : ''"
            />
          </button>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div
              v-if="showUploadMenu"
              class="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-lg border border-forena-200 bg-white shadow-lg"
            >
              <button
                type="button"
                class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-forena-700 hover:bg-flare-50"
                @click="pickYearly"
              >
                <CalendarRange class="h-4 w-4 shrink-0 text-flare-600" />
                <div class="flex flex-col">
                  <span>연간 계획서 업로드</span>
                  <span class="text-[10px] font-normal text-slate-400">연간 공정 목표와 범위</span>
                </div>
              </button>
              <div class="h-px bg-forena-100"></div>
              <button
                v-if="false"
                type="button"
                class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-forena-700 hover:bg-flare-50"
                @click="openWeeklyComposer"
              >
                <ClipboardList class="h-4 w-4 shrink-0 text-flare-600" />
                <div class="flex flex-col">
                  <span>주간 계획서 작성</span>
                  <span class="text-[10px] font-normal text-slate-400"
                    >협력사 담당자가 직접 입력 · 매주 작성</span
                  >
                </div>
              </button>
              <div class="h-px bg-forena-100"></div>
              <button
                type="button"
                class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-forena-700 hover:bg-flare-50"
                @click="pickMonthly"
              >
                <CalendarRange class="h-4 w-4 shrink-0 text-flare-600" />
                <div class="flex flex-col">
                  <span>월간 계획서 업로드</span>
                  <span class="text-[10px] font-normal text-slate-400"
                    >이번 달 공정 목표와 작업 범위 · 매월 작성</span
                  >
                </div>
              </button>
            </div>
          </transition>

          <input
            ref="yearlyInputRef"
            type="file"
            class="sr-only"
            accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
            @change="(e) => onFileChange(e, '연간')"
          />
          <input
            ref="monthlyInputRef"
            type="file"
            class="sr-only"
            accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
            @change="(e) => onFileChange(e, '월간')"
          />
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50"
          @click="openWeeklyForm"
        >
          <ClipboardList class="h-3.5 w-3.5 text-forena-400" /> 주간계획서 작성
        </button>
      </div>
    </div>

    <!-- 필터 바 -->
    <div
      class="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-forena-100 bg-white px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-bold text-forena-400">상태</span>
        <select
          v-model="filterStatus"
          class="rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs text-forena-800 outline-none focus:border-flare-400"
        >
          <option value="">전체</option>
          <option v-for="s in statuses" :key="s">{{ s }}</option>
        </select>
      </div>
      <div v-if="viewMode !== 'weekly'" class="flex items-center gap-2">
        <span class="text-[11px] font-bold text-forena-400">공종</span>
        <select
          v-model="filterTrade"
          class="rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs text-forena-800 outline-none focus:border-flare-400"
        >
          <option value="">전체</option>
          <option v-for="t in trades" :key="t">{{ t }}</option>
        </select>
      </div>

      <!-- 연장 적용 개수 알림 -->
      <span
        v-if="extensionCount"
        class="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200"
      >
        <CalendarPlus class="h-3 w-3" />
        공정 분석으로 일정 연장 {{ extensionCount }}건 반영됨
      </span>

      <span
        v-if="uploadFileName"
        class="ml-auto inline-flex items-center gap-1.5 text-xs text-forena-500"
      >
        <span
          class="rounded-md bg-flare-50 px-2 py-0.5 text-[10px] font-bold text-flare-700 ring-1 ring-flare-200"
          >{{ uploadCategory }}</span
        >
        {{ uploadFileName }}
      </span>
    </div>

    <!-- 메인 -->
    <div class="flex min-h-0 flex-1 gap-4">
      <!-- 작업 목록 -->
      <div
        v-if="viewMode === 'weekly'"
        class="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-forena-200 bg-white"
      >
        <div class="border-b border-forena-100 bg-forena-50/60 px-4 py-2.5">
          <span class="text-sm font-bold text-forena-900">작업 목록</span>
          <span class="ml-2 text-xs text-forena-400">{{ weeklyWorkList.length }}건</span>
          <p class="mt-0.5 text-[10px] text-forena-400">이번 주 · 다음 주</p>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto divide-y divide-forena-50">
          <div
            v-if="!weeklyWorkList.length"
            class="flex items-center justify-center py-16 text-sm text-slate-400"
          >
            조회된 작업이 없습니다.
          </div>
          <div
            v-for="p in weeklyWorkList"
            :key="p.id"
            class="cursor-pointer p-3.5 transition-colors hover:bg-forena-50/60"
            :class="selectedPlan?.id === p.id ? 'bg-flare-50/60 border-l-2 border-l-flare-500' : ''"
            @click="selectedPlan = p"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold leading-snug text-forena-900">{{ p.name }}</p>
              <span
                class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                :class="statusClass(workPlanStatus(p))"
                >{{ workPlanStatus(p) }}</span
              >
            </div>
            <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span class="flex items-center gap-1"
                ><MapPin class="h-3 w-3" />{{ p.location }}</span
              >
              <span class="flex items-center gap-1"
                ><Users class="h-3 w-3" />{{ p.requiredCount }}명</span
              >
            </div>
            <div class="mt-1 flex items-center gap-1.5">
              <p class="text-[11px] tabular-nums text-forena-400">
                {{ p.start.slice(5) }} ~ {{ p.end.slice(5) }}
              </p>
              <span
                v-if="extOf(p)"
                class="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700"
              >
                → {{ extOf(p).extendedEnd.slice(5) }} (+{{ extOf(p).addedDays }}일)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽 -->
      <div
        class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-forena-200 bg-white"
      >
        <!-- 작업 상세 -->
        <template v-if="selectedPlan">
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/60 px-4 py-2.5"
          >
            <p class="text-sm font-bold text-forena-900">작업 상세</p>
            <button @click="selectedPlan = null">
              <X class="h-4 w-4 text-slate-400 hover:text-forena-700" />
            </button>
          </div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <p class="text-lg font-bold text-forena-900">{{ selectedPlan.name }}</p>
                <p class="text-xs text-forena-400 mt-0.5">
                  {{ selectedPlan.trade }} · {{ selectedPlan.start }} ~ {{ selectedPlan.end }}
                </p>
              </div>
              <span
                v-if="!selectedPlan.__baseline"
                class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
                :class="statusClass(workPlanStatus(selectedPlan))"
                >{{ workPlanStatus(selectedPlan) }}</span
              >
              <span
                v-else
                class="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200"
              >
                기준 일정
              </span>
            </div>

            <!-- 기준 일정 (trade_process) 안내 배너 -->
            <div
              v-if="selectedPlan.__baseline"
              class="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3"
            >
              <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div class="text-[12px] leading-5 text-blue-800">
                <p class="font-bold">전체 공정표 기준 일정입니다</p>
                <p class="mt-0.5 text-blue-700">
                  이 일정은 최초 공정표에서 생성된 기준 데이터로, 화면에서 직접 수정할 수 없습니다.
                  실행 일정을 조정하려면 하위의 빨간 실행/진행선(연간/월간 작업계획)을 선택해
                  주세요.
                  <span v-if="selectedPlan.weightPct != null"
                    >· 보할율 {{ selectedPlan.weightPct }}%</span
                  >
                </p>
              </div>
            </div>

            <!-- work_plan 전용 상세 (baseline일 땐 숨김) -->
            <template v-if="!selectedPlan.__baseline">
              <div
                v-if="selectedPlan.planType === '주간'"
                class="mb-4 rounded-xl border border-forena-100 bg-white p-3.5"
              >
                <div class="mb-3 flex items-center gap-1.5">
                  <ClipboardList class="h-3.5 w-3.5 text-flare-600" />
                  <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400"
                    >주간 계획서 정보</span
                  >
                </div>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div class="rounded-lg bg-forena-50/60 px-3 py-2">
                    <p class="text-[10px] font-bold text-forena-400">협력사</p>
                    <p class="mt-1 text-sm font-semibold text-forena-900">
                      {{ selectedPlan.partner || '-' }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-forena-50/60 px-3 py-2">
                    <p class="text-[10px] font-bold text-forena-400">담당자</p>
                    <p class="mt-1 text-sm font-semibold text-forena-900">
                      {{ selectedPlan.manager || '-' }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-forena-50/60 px-3 py-2">
                    <p class="text-[10px] font-bold text-forena-400">연락처</p>
                    <p class="mt-1 text-sm font-semibold text-forena-900">
                      {{ selectedPlan.contact || '-' }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-forena-50/60 px-3 py-2">
                    <p class="text-[10px] font-bold text-forena-400">주 시작일</p>
                    <p class="mt-1 text-sm font-semibold tabular-nums text-forena-900">
                      {{ displayWeekStart(selectedPlan) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- ★ 연장 알림 박스 -->
              <div
                v-if="extOf(selectedPlan)"
                class="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5"
              >
                <CalendarPlus class="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div class="flex-1">
                  <p class="text-xs font-bold text-emerald-700">공정 분석을 통한 일정 연장</p>
                  <p class="mt-1 text-[11px] text-emerald-800">
                    종료일 <span class="font-bold tabular-nums">{{ selectedPlan.end }}</span> →
                    <span class="font-bold tabular-nums">{{
                      extOf(selectedPlan).extendedEnd
                    }}</span>
                    (+{{ extOf(selectedPlan).addedDays }}일)
                  </p>
                  <p
                    v-if="extOf(selectedPlan).reason"
                    class="mt-1 text-[11px] text-emerald-700/80 leading-relaxed"
                  >
                    {{ extOf(selectedPlan).reason }}
                  </p>
                  <p class="mt-1 text-[10px] text-emerald-600">
                    반영 {{ extOf(selectedPlan).decidedAt }}
                  </p>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                  <div class="flex items-center gap-1.5 mb-2">
                    <MapPin class="h-3.5 w-3.5 text-flare-600" />
                    <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400"
                      >작업 위치</span
                    >
                  </div>
                  <p class="text-sm font-semibold text-forena-900">{{ selectedPlan.location }}</p>
                </div>
                <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                  <div class="flex items-center gap-1.5 mb-2">
                    <Users class="h-3.5 w-3.5 text-flare-600" />
                    <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400"
                      >필요 인원</span
                    >
                  </div>
                  <ul v-if="selectedPlan.workers && selectedPlan.workers.length" class="space-y-1">
                    <li
                      v-for="(w, i) in selectedPlan.workers"
                      :key="i"
                      class="flex items-baseline justify-between text-sm"
                    >
                      <span class="font-semibold text-forena-900">{{ w.trade }}</span>
                      <span class="tabular-nums text-forena-700">{{ w.count }}명</span>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-slate-400">해당 없음</p>
                  <div
                    v-if="selectedPlan.requiredCount"
                    class="mt-2 flex items-baseline justify-between border-t border-forena-100 pt-1.5"
                  >
                    <span class="text-[10px] font-bold uppercase text-forena-400">합계</span>
                    <span class="text-xs font-bold tabular-nums text-flare-700">
                      {{ selectedPlan.requiredCount }}명
                    </span>
                  </div>
                </div>
                <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                  <div class="flex items-center gap-1.5 mb-2">
                    <Wrench class="h-3.5 w-3.5 text-flare-600" />
                    <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400"
                      >필요 장비</span
                    >
                  </div>
                  <ul
                    v-if="selectedPlan.equipment && selectedPlan.equipment.length"
                    class="space-y-1"
                  >
                    <li
                      v-for="(eq, i) in selectedPlan.equipment"
                      :key="i"
                      class="flex items-baseline justify-between text-sm"
                    >
                      <span class="font-semibold text-forena-900">{{ eq.type }}</span>
                      <span class="tabular-nums text-forena-700">{{ eq.count }}대</span>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-slate-400">해당 없음</p>
                </div>
              </div>
            </template>
          </div>
        </template>

        <!-- 캘린더 -->
        <template v-else>
          <div
            class="flex shrink-0 items-center justify-between border-b border-forena-100 bg-forena-50/60 px-4 py-2.5"
          >
            <p class="text-sm font-bold text-forena-900">
              {{
                viewMode === 'weekly'
                  ? '주간 일정'
                  : viewMode === 'monthly'
                    ? '월간 계획 (간트차트)'
                    : '연간 계획 (간트차트)'
              }}
            </p>
            <div class="flex items-center gap-3">
              <!-- 간트차트 범례 -->
              <div v-if="viewMode !== 'weekly'" class="flex items-center gap-3 text-[10px]">
                <span class="flex items-center gap-1.5 text-forena-500">
                  <span class="h-[3px] w-5 rounded-full bg-blue-600"></span>전체 공정표 기준
                </span>
                <span class="flex items-center gap-1.5 text-forena-500">
                  <span class="relative h-[3px] w-5 rounded-full bg-red-200">
                    <span class="absolute inset-y-0 left-0 w-1/2 rounded-full bg-red-500"></span>
                  </span>
                  {{ viewMode === 'yearly' ? '연간' : '월간' }} 실행/진행
                </span>
                <span class="flex items-center gap-1.5 text-forena-500">
                  <svg class="h-3 w-3" viewBox="0 0 12 12">
                    <path
                      d="M6 1 L11 6 L6 11 L1 6 Z"
                      fill="#f59e0b"
                      stroke="#b45309"
                      stroke-width="1"
                    />
                  </svg>
                  마일스톤
                </span>
                <span class="flex items-center gap-1.5 text-forena-500">
                  <span class="h-3 w-px bg-flare-500"></span>오늘
                </span>
              </div>

              <!-- 연 이동 네비게이션 -->
              <div v-if="viewMode === 'yearly'" class="flex items-center gap-1">
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="이전 해"
                  @click="prevYear"
                >
                  <ChevronLeft class="h-3.5 w-3.5" />
                </button>
                <p class="min-w-[82px] text-center text-xs font-bold tabular-nums text-forena-700">
                  {{ yearMeta.year }}년
                </p>
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="다음 해"
                  @click="nextYear"
                >
                  <ChevronRight class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="ml-1 rounded-md border px-2 py-1 text-[10px] font-bold transition"
                  :class="
                    isCurrentYear
                      ? 'border-flare-200 bg-flare-50 text-flare-700'
                      : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'
                  "
                  :disabled="isCurrentYear"
                  @click="goToday"
                >
                  올해
                </button>
              </div>

              <!-- 월 이동 네비게이션 -->
              <div v-if="viewMode === 'monthly'" class="flex items-center gap-1">
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="이전 달"
                  @click="prevMonth"
                >
                  <ChevronLeft class="h-3.5 w-3.5" />
                </button>
                <p class="min-w-[110px] text-center text-xs font-bold tabular-nums text-forena-700">
                  {{ monthMeta.year }}년 {{ monthMeta.month }}월
                </p>
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="다음 달"
                  @click="nextMonth"
                >
                  <ChevronRight class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="ml-1 rounded-md border px-2 py-1 text-[10px] font-bold transition"
                  :class="
                    isCurrentMonth
                      ? 'border-flare-200 bg-flare-50 text-flare-700'
                      : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'
                  "
                  :disabled="isCurrentMonth"
                  @click="goToday"
                >
                  오늘
                </button>
              </div>

              <div v-if="viewMode === 'weekly'" class="flex items-center gap-1">
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="이전 주"
                  @click="prevWeek"
                >
                  <ChevronLeft class="h-3.5 w-3.5" />
                </button>
                <p class="min-w-[150px] text-center text-xs font-bold tabular-nums text-forena-700">
                  {{ weekHeader }}
                </p>
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="다음 주"
                  @click="nextWeek"
                >
                  <ChevronRight class="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  class="ml-1 rounded-md border px-2 py-1 text-[10px] font-bold transition"
                  :class="
                    isCurrentWeek
                      ? 'border-flare-200 bg-flare-50 text-flare-700'
                      : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'
                  "
                  :disabled="isCurrentWeek"
                  @click="goCurrentWeek"
                >
                  이번 주
                </button>
              </div>
            </div>
          </div>

          <!-- ========== 주간 ========== -->
          <div v-if="viewMode === 'weekly'" class="min-h-0 flex-1 overflow-auto p-3">
            <div class="grid h-full grid-cols-7 gap-2">
              <div
                v-for="day in weekDays"
                :key="day.date"
                class="flex flex-col overflow-hidden rounded-xl border bg-white"
                :class="
                  day.isToday ? 'border-flare-400 ring-2 ring-flare-200' : 'border-forena-100'
                "
              >
                <div
                  class="flex items-center justify-between px-2.5 py-2"
                  :class="weeklyDayHeaderClass(day)"
                >
                  <span class="text-[11px] font-bold">{{ day.label }}</span>
                  <span
                    class="rounded-md px-1.5 text-base font-bold tabular-nums"
                    :class="day.isToday ? 'bg-white/20' : dayTextClass(day)"
                    >{{ day.day }}</span
                  >
                </div>
                <div class="flex-1 space-y-1 overflow-y-auto p-1.5">
                  <div
                    v-if="!plansForDay(day.date).length"
                    class="py-4 text-center text-[10px] text-slate-300"
                  >
                    —
                  </div>
                  <div
                    v-for="p in plansForDay(day.date)"
                    :key="p.id"
                    class="cursor-pointer rounded-md border-l-[3px] border-l-flare-500 bg-flare-50 px-1.5 py-1 text-[10px] font-semibold text-flare-900 transition hover:bg-flare-100"
                    :class="p.isExtensionDay ? 'ring-1 ring-emerald-300' : ''"
                    @click="selectedPlan = p"
                  >
                    <div class="flex items-center gap-1">
                      <CalendarPlus v-if="p.isExtensionDay" class="h-2.5 w-2.5 shrink-0" />
                      <p class="truncate">{{ p.name }}</p>
                    </div>
                    <p class="mt-0.5 truncate text-[9px] font-normal text-flare-700">
                      <span v-if="p.isExtensionDay">연장 일정</span>
                      <span v-else>{{ p.location }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 연간 (간트차트) ========== -->
          <!-- 구조: 공종 그룹 → 공정(파란 기준선) → 위치별 실행계획(빨간 실행/진행선들) -->
          <div v-else-if="viewMode === 'yearly'" class="min-h-0 flex-1 overflow-auto bg-white">
            <div
              v-if="!yearlyGroups.length"
              class="flex items-center justify-center py-16 text-sm text-slate-400"
            >
              {{ yearMeta.year }}년에 표시할 기준 공정이 없습니다.
            </div>

            <div v-else class="flex min-w-max">
              <!-- 좌측: 공종 그룹 → 공정 → 실행계획 목록 -->
              <div
                class="sticky left-0 z-10 shrink-0 border-r border-forena-200 bg-white"
                :style="{ width: NAME_COL_W + 'px' }"
              >
                <div class="flex h-10 items-center border-b border-forena-200 bg-white px-4">
                  <span class="text-[11px] font-bold text-forena-500">공종 / 공정 / 실행위치</span>
                </div>

                <template v-for="grp in yearlyGroups" :key="`y-grp-${grp.group}`">
                  <!-- 공종 그룹 헤더 (접기/펼치기) -->
                  <div
                    class="flex h-9 cursor-pointer items-center justify-between border-b border-forena-200 bg-gradient-to-r from-forena-100 to-forena-50 px-3 text-[11px] font-bold text-forena-800 transition hover:from-flare-50 hover:to-flare-50/30"
                    @click="groupOpen[grp.group] = !groupOpen[grp.group]"
                  >
                    <div class="flex items-center gap-1.5">
                      <ChevronDown
                        v-if="groupOpen[grp.group]"
                        class="h-3.5 w-3.5 text-forena-600"
                      />
                      <ChevronRight v-else class="h-3.5 w-3.5 text-forena-600" />
                      <span>{{ grp.group }}</span>
                    </div>
                    <span
                      class="rounded bg-white/70 px-1.5 py-0.5 text-[9px] tabular-nums text-forena-500"
                      >{{ grp.items.length }}</span
                    >
                  </div>

                  <template v-if="groupOpen[grp.group]">
                    <div
                      v-for="item in grp.items"
                      :key="`y-item-${item.id}`"
                      class="flex cursor-pointer flex-col justify-start gap-0.5 overflow-hidden border-b border-forena-100 px-4 py-2 transition hover:bg-forena-50/60"
                      :style="{ height: processRowHeight(item) + 'px' }"
                    >
                      <!-- 공정명 + 보할 -->
                      <div class="flex items-center gap-1.5" @click="onClickBaseline(item)">
                        <p class="truncate text-sm font-bold text-forena-900">{{ item.name }}</p>
                        <span
                          v-if="item.weightPct != null"
                          class="rounded bg-blue-50 px-1 py-0.5 text-[9px] font-bold text-blue-700"
                        >
                          보할 {{ item.weightPct }}%
                        </span>
                      </div>
                      <p class="truncate text-[10px] text-slate-400">
                        기준 {{ item.baselineStart || '-' }} ~ {{ item.baselineEnd || '-' }}
                      </p>
                      <!-- 하위 work_plan 위치 목록 -->
                      <ul v-if="item.workPlans.length" class="mt-1 space-y-0.5">
                        <li
                          v-for="wp in item.workPlans"
                          :key="`y-wp-${wp.id}`"
                          class="truncate text-[10px] text-red-600 hover:text-red-700"
                          @click.stop="onClickWorkPlan(wp)"
                        >
                          └ {{ wp.location || wp.name }} 실행
                        </li>
                      </ul>
                      <p v-else class="text-[10px] italic text-slate-300">실행 일정 없음</p>
                    </div>
                  </template>
                </template>
              </div>

              <!-- 우측: 차트 (공종 헤더 라인 + 공정 행마다 파란선 + 빨간 실행/진행선들) -->
              <div class="relative" :style="{ width: yearChartWidth + 'px' }">
                <div class="sticky top-0 z-[5] flex h-10 border-b border-forena-200 bg-white">
                  <div
                    v-for="m in yearMeta.months"
                    :key="m.month"
                    class="flex items-center justify-center border-r border-forena-100 text-[11px] font-semibold tabular-nums"
                    :style="{ width: GANTT_MONTH_W + 'px' }"
                    :class="m.isCurrent ? 'bg-flare-50 text-flare-700' : 'text-forena-500'"
                  >
                    {{ m.label }}
                  </div>
                </div>

                <div class="relative">
                  <template v-for="grp in yearlyGroups" :key="`y-grow-${grp.group}`">
                    <!-- 공종 그룹 헤더 (오른쪽 빈 영역 - 좌측과 높이 매칭) -->
                    <div
                      class="h-9 border-b border-forena-200 bg-gradient-to-r from-forena-100 to-forena-50"
                    ></div>

                    <template v-if="groupOpen[grp.group]">
                      <div
                        v-for="item in grp.items"
                        :key="`y-row-${item.id}`"
                        class="relative flex border-b border-forena-100"
                        :style="{ height: processRowHeight(item) + 'px' }"
                      >
                        <!-- 월 셀 그리드 -->
                        <div
                          v-for="m in yearMeta.months"
                          :key="m.month"
                          class="border-r border-forena-50"
                          :style="{ width: GANTT_MONTH_W + 'px' }"
                        ></div>

                        <!-- 마일스톤 (있을 경우) -->
                        <!-- baseline 시작점에 다이아몬드 표시 -->

                        <!-- 파란색: 기준 일정 (trade_process) -->
                        <div
                          v-if="
                            item.baselineStart &&
                            item.baselineEnd &&
                            yearBarStyle(item.baselineStart, item.baselineEnd)
                          "
                          class="group absolute z-[2] flex cursor-pointer items-center"
                          :style="{
                            ...yearBarStyle(item.baselineStart, item.baselineEnd),
                            top: '14px',
                            height: '4px',
                          }"
                          :title="`기준 일정 (수정 불가): ${item.baselineStart} ~ ${item.baselineEnd}`"
                          @click="onClickBaseline(item)"
                        >
                          <span
                            class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                          ></span>
                          <span
                            class="absolute -right-[3px] h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                          ></span>
                          <span class="h-1 w-full rounded-full bg-blue-600"></span>
                        </div>

                        <!-- 빨간색: 위치별 실행 일정 + 진행률 (work_plan) - 여러 줄 -->
                        <div
                          v-for="(wp, wi) in item.workPlans"
                          :key="`y-wpbar-${wp.id}`"
                          class="group absolute z-[2] cursor-pointer"
                          :style="{
                            ...(yearBarStyle(wp.start, wp.end) || { display: 'none' }),
                            top: workPlanTop(wi) + 'px',
                            height: '4px',
                          }"
                          :title="`${wp.name}${wp.location ? ' · ' + wp.location : ''}\n${wp.start} ~ ${wp.end}`"
                          @click.stop="onClickWorkPlan(wp)"
                        >
                          <!-- 실행 일정 시작점 -->
                          <span
                            class="absolute -left-[3px] top-1/2 z-[3] h-2 w-2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white"
                          ></span>

                          <!-- 실행 일정 종료점 -->
                          <span
                            class="absolute -right-[3px] top-1/2 z-[3] h-2 w-2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white"
                          ></span>

                          <!-- 실행 일정 전체 기간: 연한 빨간색 -->
                          <span class="absolute inset-0 z-0 rounded-full bg-red-200"></span>

                          <!-- 진행률 게이지: 진한 빨간색 -->
                          <span
                            class="absolute inset-y-0 left-0 z-[1] rounded-full bg-red-500 transition group-hover:h-1.5"
                            :style="progressBarStyle(wp, yearBarStyle)"
                          ></span>

                          <!-- 진행률 위치 점 -->
                          <span
                            class="absolute top-1/2 z-[4] h-2 w-2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white"
                            :style="progressDotStyle(wp, yearBarStyle)"
                          ></span>
                        </div>
                      </div>
                    </template>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 월간 (라인형 간트차트) ========== -->
          <!-- 구조: 공종 그룹 → 공정 행(접기/펼치기, 마일스톤) → 세부계획 행들(파란 월간기준선 + 빨간 실행선) -->
          <div v-else class="min-h-0 flex-1 overflow-auto bg-white">
            <div
              v-if="!monthlyGroups.length"
              class="flex items-center justify-center py-16 text-sm text-slate-400"
            >
              {{ monthMeta.year }}년 {{ monthMeta.month }}월에 표시할 기준 공정이 없습니다.
            </div>

            <div v-else class="flex min-w-max">
              <!-- 좌측: 공종 → 공정 → 세부계획 목록 -->
              <div
                class="sticky left-0 z-10 shrink-0 border-r border-forena-200 bg-white"
                :style="{ width: NAME_COL_W + 'px' }"
              >
                <div class="flex h-10 items-center border-b border-forena-200 bg-white px-4">
                  <span class="text-[11px] font-bold text-forena-500">공종 / 공정 / 세부계획</span>
                </div>

                <template v-for="grp in monthlyGroups" :key="`m-grp-${grp.group}`">
                  <!-- 공종 그룹 헤더 -->
                  <div
                    class="flex h-9 cursor-pointer items-center justify-between border-b border-forena-200 bg-gradient-to-r from-forena-100 to-forena-50 px-3 text-[11px] font-bold text-forena-800 transition hover:from-flare-50 hover:to-flare-50/30"
                    @click="groupOpen[grp.group] = !groupOpen[grp.group]"
                  >
                    <div class="flex items-center gap-1.5">
                      <ChevronDown
                        v-if="groupOpen[grp.group]"
                        class="h-3.5 w-3.5 text-forena-600"
                      />
                      <ChevronRight v-else class="h-3.5 w-3.5 text-forena-600" />
                      <span>{{ grp.group }}</span>
                    </div>
                    <span
                      class="rounded bg-white/70 px-1.5 py-0.5 text-[9px] tabular-nums text-forena-500"
                      >{{ grp.items.length }}</span
                    >
                  </div>

                  <template v-if="groupOpen[grp.group]">
                    <template v-for="item in grp.items" :key="`m-item-${item.id}`">
                      <!-- 공정 행 (접기/펼치기) -->
                      <div
                        class="flex cursor-pointer items-center gap-1.5 border-b border-forena-100 bg-slate-50/40 pl-4 pr-3 transition hover:bg-forena-50/60"
                        :style="{ height: monthlyProcessHeaderHeight() + 'px' }"
                        @click="monthlyProcessOpen[item.id] = !monthlyProcessOpen[item.id]"
                      >
                        <ChevronDown
                          v-if="monthlyProcessOpen[item.id]"
                          class="h-3.5 w-3.5 shrink-0 text-slate-500"
                        />
                        <ChevronRight v-else class="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <div class="flex min-w-0 flex-1 flex-col">
                          <div class="flex items-center gap-1.5">
                            <p
                              class="truncate text-sm font-bold text-forena-900"
                              @click.stop="onClickBaseline(item)"
                            >
                              {{ item.name }}
                            </p>
                            <span
                              v-if="item.weightPct != null"
                              class="rounded bg-blue-50 px-1 py-0.5 text-[9px] font-bold text-blue-700"
                            >
                              보할 {{ item.weightPct }}%
                            </span>
                          </div>
                          <p class="truncate text-[10px] text-slate-400">
                            <span
                              v-if="item.milestoneDate"
                              class="inline-flex items-center gap-1"
                              :title="
                                item.milestoneFromAnnual
                                  ? '연간 실행계획 종료일을 마일스톤으로 사용'
                                  : '기준 공정 종료일'
                              "
                            >
                              <span class="inline-block h-1.5 w-1.5 rotate-45 bg-rose-500"></span>
                              마일스톤 {{ item.milestoneDate }}
                            </span>
                            <span v-else class="italic text-slate-300">마일스톤 없음</span>
                          </p>
                        </div>
                        <span
                          class="rounded bg-white/70 px-1.5 py-0.5 text-[9px] tabular-nums text-slate-500"
                          >{{ (item.details && item.details.length) || 0 }}</span
                        >
                      </div>

                      <!-- 세부계획 행들 (공정이 펼쳐져 있을 때만) -->
                      <template v-if="monthlyProcessOpen[item.id]">
                        <div
                          v-for="d in item.details"
                          :key="`m-detail-${d.id}`"
                          class="flex cursor-pointer items-center gap-1.5 border-b border-forena-50 pl-10 pr-3 transition hover:bg-rose-50/40"
                          :style="{ height: monthlyDetailRowHeight() + 'px' }"
                          @click.stop="onClickWorkPlan(d)"
                        >
                          <span class="shrink-0 text-[10px] text-slate-300">└</span>
                          <p class="truncate text-[11px] text-slate-700">
                            {{ d.name
                            }}<span v-if="d.location" class="text-slate-400">
                              · {{ d.location }}</span
                            >
                          </p>
                        </div>
                        <!-- 세부계획이 하나도 없을 때 안내 행 -->
                        <div
                          v-if="!item.details || !item.details.length"
                          class="flex items-center border-b border-forena-50 pl-10 pr-3 text-[10px] italic text-slate-300"
                          :style="{ height: monthlyDetailRowHeight() + 'px' }"
                        >
                          세부계획 없음 (월간 계획서를 업로드하세요)
                        </div>
                      </template>
                    </template>
                  </template>
                </template>
              </div>

              <!-- 우측: 차트 -->
              <div class="relative" :style="{ width: chartWidth + 'px' }">
                <!-- 날짜 헤더 -->
                <div class="sticky top-0 z-[5] flex h-10 border-b border-forena-200 bg-white">
                  <div
                    v-for="d in monthMeta.days"
                    :key="d.date"
                    class="flex items-center justify-center border-r border-forena-100 text-[11px] font-semibold tabular-nums"
                    :style="{ width: GANTT_DAY_W + 'px' }"
                    :class="monthlyDayHeaderClass(d)"
                  >
                    {{ d.day }}
                  </div>
                </div>

                <!-- 차트 본문 -->
                <div class="relative">
                  <div
                    v-if="todayLineStyle"
                    class="pointer-events-none absolute top-0 z-[3] h-full w-px bg-flare-400/60"
                    :style="todayLineStyle"
                  ></div>

                  <template v-for="grp in monthlyGroups" :key="`m-grow-${grp.group}`">
                    <!-- 공종 그룹 헤더 (오른쪽 빈 영역) -->
                    <div
                      class="h-9 border-b border-forena-200 bg-gradient-to-r from-forena-100 to-forena-50"
                    ></div>

                    <template v-if="groupOpen[grp.group]">
                      <template v-for="item in grp.items" :key="`m-row-${item.id}`">
                        <!-- 공정 행: 마일스톤 마커 표시 -->
                        <div
                          class="relative flex border-b border-forena-100 bg-slate-50/40"
                          :style="{ height: monthlyProcessHeaderHeight() + 'px' }"
                        >
                          <div
                            v-for="d in monthMeta.days"
                            :key="d.date"
                            class="border-r border-forena-50"
                            :style="{ width: GANTT_DAY_W + 'px' }"
                            :class="monthlyDayCellClass(d)"
                          ></div>

                          <!-- 마일스톤 마커 (마름모) -->
                          <div
                            v-if="item.milestoneDate && monthCellCenterStyle(item.milestoneDate)"
                            class="absolute z-[2] flex cursor-pointer items-center justify-center"
                            :style="{
                              ...monthCellCenterStyle(item.milestoneDate),
                              top: '50%',
                              width: '14px',
                              height: '14px',
                              transform: 'translate(-7px, -50%)',
                            }"
                            :title="`마일스톤: ${item.milestoneDate}`"
                            @click.stop="onClickBaseline(item)"
                          >
                            <span
                              class="block h-2.5 w-2.5 rotate-45 bg-rose-500 ring-2 ring-white"
                            ></span>
                          </div>
                        </div>

                        <!-- 세부계획 행들 -->
                        <template v-if="monthlyProcessOpen[item.id]">
                          <div
                            v-for="d in item.details"
                            :key="`m-detail-row-${d.id}`"
                            class="relative flex border-b border-forena-50"
                            :style="{ height: monthlyDetailRowHeight() + 'px' }"
                          >
                            <div
                              v-for="dd in monthMeta.days"
                              :key="dd.date"
                              class="border-r border-forena-50"
                              :style="{ width: GANTT_DAY_W + 'px' }"
                              :class="monthlyDayCellClass(dd)"
                            ></div>

                            <!-- 파란선: 월간계획서 기준 (plannedStart/plannedEnd) -->
                            <div
                              v-if="
                                d.plannedStart &&
                                d.plannedEnd &&
                                barStyle(d.plannedStart, d.plannedEnd)
                              "
                              class="group absolute z-[2] flex cursor-pointer items-center"
                              :style="{
                                ...barStyle(d.plannedStart, d.plannedEnd),
                                top: '8px',
                                height: '4px',
                              }"
                              :title="`월간 기준: ${d.plannedStart} ~ ${d.plannedEnd}`"
                              @click.stop="onClickWorkPlan(d)"
                            >
                              <span
                                class="absolute -left-[3px] h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"
                              ></span>
                              <span
                                class="absolute -right-[3px] h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"
                              ></span>
                              <span class="h-1 w-full rounded-full bg-blue-600"></span>
                            </div>

                            <!-- 빨간선: 실행 일정 + 진행률 -->
                            <div
                              v-if="barStyle(d.start, d.end)"
                              class="group absolute z-[2] cursor-pointer"
                              :style="{
                                ...barStyle(d.start, d.end),
                                top: '20px',
                                height: '4px',
                              }"
                              :title="`${d.name}${d.location ? ' · ' + d.location : ''}\n실행: ${d.start} ~ ${d.end}`"
                              @click.stop="onClickWorkPlan(d)"
                            >
                              <span
                                class="absolute -left-[3px] top-1/2 z-[2] h-2 w-2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white"
                              ></span>
                              <span
                                class="absolute top-1/2 z-[2] h-2 w-2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white"
                                :style="progressDotStyle(d, barStyle)"
                              ></span>
                              <span class="absolute inset-0 z-0 rounded-full bg-red-200"></span>
                              <span
                                class="absolute inset-y-0 left-0 z-[1] rounded-full bg-red-500 transition group-hover:h-1.5"
                                :style="progressBarStyle(d, barStyle)"
                              ></span>
                            </div>
                          </div>
                          <!-- 세부계획이 없을 때 빈 행 (좌측과 높이 매칭) -->
                          <div
                            v-if="!item.details || !item.details.length"
                            class="relative flex border-b border-forena-50"
                            :style="{ height: monthlyDetailRowHeight() + 'px' }"
                          >
                            <div
                              v-for="dd in monthMeta.days"
                              :key="dd.date"
                              class="border-r border-forena-50"
                              :style="{ width: GANTT_DAY_W + 'px' }"
                              :class="monthlyDayCellClass(dd)"
                            ></div>
                          </div>
                        </template>
                      </template>
                    </template>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- 연간/월간 업로드 검증 모달                                    -->
    <!-- 업로드된 계획서가 간트차트에 정확히 반영되었는지 확인 후 적용  -->
    <!-- ========================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showVerifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="cancelVerify"
      >
        <div
          class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <!-- 헤더 -->
          <div
            class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50"
              >
                <FileCheck2 class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">
                  {{ verifyCategory }} 계획서 반영 확인
                </p>
                <p class="mt-0.5 text-xs text-forena-500">
                  <span class="font-semibold text-forena-700">{{ verifyFileName }}</span> 에서
                  추출한 작업이 간트차트에 정확히 반영되었는지 확인해주세요.
                </p>
              </div>
            </div>
            <button @click="cancelVerify" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- 요약 통계 -->
          <div
            class="grid shrink-0 grid-cols-4 gap-3 border-b border-forena-100 bg-forena-50/40 px-6 py-3"
          >
            <div class="rounded-lg bg-white px-3 py-2 ring-1 ring-forena-100">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">전체</p>
              <p class="mt-0.5 text-xl font-bold tabular-nums text-forena-900">
                {{ verifyStats.total }}
              </p>
            </div>
            <div class="rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
              <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-600">정상</p>
              <p class="mt-0.5 text-xl font-bold tabular-nums text-emerald-700">
                {{ verifyStats.ok }}
              </p>
            </div>
            <div class="rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-600">경고</p>
              <p class="mt-0.5 text-xl font-bold tabular-nums text-amber-700">
                {{ verifyStats.warnings }}
              </p>
            </div>
            <div class="rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-rose-100">
              <p class="text-[10px] font-bold uppercase tracking-wide text-rose-600">오류</p>
              <p class="mt-0.5 text-xl font-bold tabular-nums text-rose-700">
                {{ verifyStats.errors }}
              </p>
            </div>
          </div>

          <!-- 파싱된 작업 목록 (간트차트 미리보기 + 행별 상세) -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p class="mb-2 text-[11px] font-bold uppercase tracking-wide text-forena-400">
              파싱된 작업 ({{ verifyRows.length }}건)
            </p>
            <div class="overflow-hidden rounded-lg border border-forena-100">
              <table class="w-full text-xs">
                <thead class="bg-forena-50/60 text-forena-500">
                  <tr>
                    <th class="px-3 py-2 text-left font-bold">상태</th>
                    <th class="px-3 py-2 text-left font-bold">공정명</th>
                    <th class="px-3 py-2 text-left font-bold">공종</th>
                    <th class="px-3 py-2 text-left font-bold">위치</th>
                    <th class="px-3 py-2 text-left font-bold tabular-nums">시작일</th>
                    <th class="px-3 py-2 text-left font-bold tabular-nums">종료일</th>
                    <th class="px-3 py-2 text-right font-bold">처리</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-forena-100 bg-white">
                  <tr
                    v-for="row in verifyRows"
                    :key="row.id"
                    :class="
                      row.issue === 'error'
                        ? 'bg-rose-50/40'
                        : row.issue === 'warning'
                          ? 'bg-amber-50/40'
                          : ''
                    "
                  >
                    <td class="px-3 py-2">
                      <span
                        v-if="row.issue === 'error'"
                        class="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700"
                      >
                        <AlertTriangle class="h-3 w-3" /> 오류
                      </span>
                      <span
                        v-else-if="row.issue === 'warning'"
                        class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700"
                      >
                        <AlertTriangle class="h-3 w-3" /> 경고
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
                      >
                        <CheckCircle2 class="h-3 w-3" /> 정상
                      </span>
                    </td>
                    <td class="px-3 py-2 font-semibold text-forena-900">
                      <input
                        v-model="row.name"
                        class="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-forena-200 focus:border-flare-400 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td class="px-3 py-2 text-forena-600">
                      <input
                        v-model="row.trade"
                        class="w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-forena-200 focus:border-flare-400 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td class="px-3 py-2 text-forena-600">
                      <input
                        v-model="row.location"
                        class="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-forena-200 focus:border-flare-400 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td class="px-3 py-2 tabular-nums">
                      <input
                        type="date"
                        v-model="row.start"
                        class="rounded border px-1 py-0.5 text-[11px]"
                        :class="!row.start ? 'border-rose-300 bg-rose-50' : 'border-forena-200'"
                      />
                    </td>
                    <td class="px-3 py-2 tabular-nums">
                      <input
                        type="date"
                        v-model="row.end"
                        class="rounded border px-1 py-0.5 text-[11px]"
                        :class="!row.end ? 'border-rose-300 bg-rose-50' : 'border-forena-200'"
                      />
                    </td>
                    <td class="px-3 py-2 text-right">
                      <button
                        v-if="row.issue"
                        @click="fixVerifyRow(row)"
                        class="rounded-md bg-flare-50 px-2 py-1 text-[10px] font-bold text-flare-700 ring-1 ring-flare-200 hover:bg-flare-100"
                      >
                        자동 수정
                      </button>
                      <button
                        @click="removeVerifyRow(row)"
                        class="ml-1 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p
              v-if="verifyStats.errors > 0"
              class="mt-3 flex items-center gap-1.5 text-[11px] text-rose-600"
            >
              <AlertTriangle class="h-3.5 w-3.5" />
              오류 {{ verifyStats.errors }}건이 있습니다. 자동 수정 또는 직접 수정 후 반영해주세요.
            </p>
          </div>

          <!-- 푸터 -->
          <div
            class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3"
          >
            <button
              @click="cancelVerify"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50"
            >
              취소
            </button>
            <button
              @click="confirmVerifyAndApply"
              :disabled="verifyStats.errors > 0"
              class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CheckCircle2 class="h-3.5 w-3.5" />
              간트차트에 반영
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ========================================================== -->
    <!-- 주간 계획서 작성 모달 (협력사 / 공정 담당자 입력)             -->
    <!-- 일자별: 공정명·작업구역·인력·장비 (필수)                      -->
    <!-- ========================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showWeeklyForm && weeklyForm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="cancelWeeklyForm"
      >
        <div
          class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <!-- 헤더 -->
          <div
            class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50"
              >
                <ClipboardList class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">주간 계획서 작성</p>
                <p class="mt-0.5 text-xs text-forena-500">
                  협력사 담당자가 직접 작성합니다. 일자별
                  <span class="font-bold text-flare-700">공정명·작업구역·인력·장비</span>는 모두
                  필수입니다.
                </p>
              </div>
            </div>
            <button @click="cancelWeeklyForm" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- 월간 계획 선택 -->
          <div class="shrink-0 border-b border-forena-100 bg-white px-6 py-4">
            <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
              월간 계획 선택 <span class="text-rose-500">*</span>
            </label>

            <select
              v-model="weeklyForm.monthlyPlanId"
              @change="onSelectMonthlyPlan"
              class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400"
            >
              <option :value="null">월간 세부계획을 선택하세요</option>
              <option v-for="opt in monthlyPlanOptions" :key="opt.id" :value="opt.id">
                {{ opt.label }}
              </option>
            </select>

            <div
              v-if="weeklyForm.monthlyPlanId"
              class="mt-3 rounded-lg border border-flare-100 bg-flare-50/50 px-3 py-2 text-xs text-forena-700"
            >
              <p class="font-bold text-forena-900">
                {{ weeklyForm.monthlyPlanName }}
              </p>
              <p class="mt-1">
                위치 {{ weeklyForm.monthlyLocation || '-' }} · 기간 {{ weeklyForm.monthlyStart }} ~
                {{ weeklyForm.monthlyEnd }}
              </p>
            </div>
          </div>
          <!-- 협력사 정보 -->
          <div
            class="grid shrink-0 grid-cols-1 gap-3 border-b border-forena-100 bg-forena-50/40 px-6 py-4 sm:grid-cols-4"
          >
            <div>
              <label
                class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                >협력사 <span class="text-rose-500">*</span></label
              >
              <input
                v-model="weeklyForm.partner"
                placeholder="예: (주)대우전기"
                class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
              />
            </div>
            <div>
              <label
                class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                >담당자 <span class="text-rose-500">*</span></label
              >
              <input
                v-model="weeklyForm.manager"
                placeholder="예: 김현수 반장"
                class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
              />
            </div>
            <div>
              <label
                class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                >연락처</label
              >
              <input
                v-model="weeklyForm.contact"
                placeholder="010-0000-0000"
                class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
              />
            </div>
            <div>
              <label
                class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                >주 시작일(일)</label
              >
              <input
                type="date"
                v-model="weeklyForm.weekStart"
                class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
              />
            </div>
          </div>

          <!-- 일자별 작업 입력 -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-[11px] font-bold uppercase tracking-wide text-forena-400">
                일자별 작업 ({{ weeklyForm.items.length }}건)
              </p>
              <button
                @click="addWeeklyItem"
                class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100"
              >
                <Plus class="h-3 w-3" /> 작업 추가
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, idx) in weeklyForm.items"
                :key="item.id"
                class="rounded-xl border border-forena-100 bg-white p-3.5"
              >
                <div class="mb-2.5 flex items-center justify-between">
                  <span
                    class="rounded-md bg-forena-50 px-2 py-0.5 text-[10px] font-bold text-forena-600"
                    >#{{ idx + 1 }}</span
                  >
                  <button
                    v-if="weeklyForm.items.length > 1"
                    @click="removeWeeklyItem(idx)"
                    class="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
                <div class="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label class="mb-1 block text-[10px] font-bold text-forena-500"
                      >작업일자 <span class="text-rose-500">*</span></label
                    >
                    <input
                      type="date"
                      v-model="item.date"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400"
                    />
                  </div>
                  <div class="lg:col-span-2">
                    <label class="mb-1 block text-[10px] font-bold text-forena-500"
                      >일일 작업 내용 <span class="text-rose-500">*</span></label
                    >
                    <input
                      v-model="item.processName"
                      placeholder="예: 타설 전 거푸집 및 철근 상태 점검"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400"
                    />
                  </div>
                  <div class="lg:col-span-2">
                    <label class="mb-1 block text-[10px] font-bold text-forena-500"
                      >세부 작업 위치 <span class="text-rose-500">*</span></label
                    >
                    <input
                      v-model="item.zone"
                      placeholder="예: B2층 전기실"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400"
                    />
                  </div>
                  <div class="lg:col-span-2">
                    <div class="mb-1 flex items-center justify-between">
                      <label class="block text-[10px] font-bold text-forena-500">
                        <Users class="mr-0.5 inline h-3 w-3" />인력
                        <span class="text-rose-500">*</span>
                      </label>
                      <span
                        v-if="itemWorkerTotal(item) > 0"
                        class="rounded bg-flare-50 px-1.5 py-0.5 text-[10px] font-bold text-flare-700"
                      >
                        총 {{ itemWorkerTotal(item) }}명
                      </span>
                    </div>
                    <div class="space-y-1.5">
                      <div
                        v-for="(wk, wIdx) in item.workers"
                        :key="wk.tradeId"
                        class="flex items-center gap-1"
                      >
                        <select
                          v-model="wk.trade"
                          class="min-w-0 flex-1 rounded-md border border-forena-200 px-1.5 py-1.5 text-xs outline-none focus:border-flare-400"
                        >
                          <option v-for="t in WORKER_TRADES" :key="t" :value="t">
                            {{ t }}
                          </option>
                        </select>
                        <input
                          v-model.number="wk.count"
                          type="number"
                          min="1"
                          max="999"
                          class="w-12 rounded-md border border-forena-200 px-1.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400"
                        />
                        <span class="text-[10px] text-forena-500">명</span>
                        <button
                          v-if="item.workers.length > 1"
                          type="button"
                          @click="removeWorker(item, wIdx)"
                          class="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="인력 삭제"
                        >
                          <Trash2 class="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        @click="addWorker(item)"
                        class="w-full rounded-md border border-dashed border-forena-200 px-2 py-1 text-[10px] font-semibold text-forena-500 hover:border-flare-300 hover:bg-flare-50 hover:text-flare-700"
                      >
                        + 직종 추가
                      </button>
                    </div>
                  </div>
                  <div class="lg:col-span-3">
                    <div class="mb-1 flex items-center justify-between">
                      <label class="block text-[10px] font-bold text-forena-500">
                        <Wrench class="mr-0.5 inline h-3 w-3" />장비
                        <span class="text-rose-500">*</span>
                      </label>
                      <span
                        v-if="itemEquipmentTotal(item) > 0"
                        class="rounded bg-flare-50 px-1.5 py-0.5 text-[10px] font-bold text-flare-700"
                      >
                        총 {{ itemEquipmentTotal(item) }}대
                      </span>
                    </div>
                    <div class="space-y-1.5">
                      <div
                        v-for="(eq, eIdx) in item.equipment"
                        :key="eq.equipId"
                        class="flex items-center gap-1"
                      >
                        <select
                          v-model="eq.type"
                          class="min-w-0 flex-1 rounded-md border border-forena-200 px-1.5 py-1.5 text-xs outline-none focus:border-flare-400"
                        >
                          <optgroup v-for="g in EQUIPMENT_GROUPS" :key="g.label" :label="g.label">
                            <option v-for="t in g.items" :key="t" :value="t">
                              {{ t }}
                            </option>
                          </optgroup>
                        </select>
                        <input
                          v-model.number="eq.count"
                          type="number"
                          min="1"
                          max="99"
                          class="w-12 rounded-md border border-forena-200 px-1.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400"
                        />
                        <span class="text-[10px] text-forena-500">대</span>
                        <button
                          v-if="item.equipment.length > 1"
                          type="button"
                          @click="removeEquipment(item, eIdx)"
                          class="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="장비 삭제"
                        >
                          <Trash2 class="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        @click="addEquipment(item)"
                        class="w-full rounded-md border border-dashed border-forena-200 px-2 py-1 text-[10px] font-semibold text-forena-500 hover:border-flare-300 hover:bg-flare-50 hover:text-flare-700"
                      >
                        + 장비 추가
                      </button>
                    </div>
                  </div>
                  <div class="lg:col-span-5">
                    <label class="mb-1 block text-[10px] font-bold text-forena-500">비고</label>
                    <input
                      v-model="item.note"
                      placeholder="안전 유의사항, 선·후행 공정과의 협의사항 등"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 푸터 -->
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3"
          >
            <p class="text-[11px] text-forena-500">
              <span v-if="!weeklyFormValid" class="text-rose-600">
                <AlertTriangle class="mr-0.5 inline h-3 w-3" />
                협력사·담당자 및 모든 작업의 필수 항목을 입력해주세요.
              </span>
              <span v-else class="text-emerald-700">
                <CheckCircle2 class="mr-0.5 inline h-3 w-3" />
                제출 준비가 완료되었습니다.
              </span>
            </p>
            <div class="flex gap-2">
              <button
                @click="cancelWeeklyForm"
                class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50"
              >
                취소
              </button>
              <button
                @click="submitWeeklyForm"
                :disabled="!weeklyFormValid"
                class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save class="h-3.5 w-3.5" />
                계획서 제출
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
