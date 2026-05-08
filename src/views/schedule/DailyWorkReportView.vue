<script setup>
// feat : Vue Composition API 및 외부 라이브러리 임포트
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import api from '@/api/index'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Save,
  Upload,
  Image as ImageIcon,
  Paperclip,
  X,
  Users,
  Wrench,
  MapPin,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  Pencil,
  FileCheck2,
  Layers,
  ShieldCheck,
  UserCog,
  Trash2,
  Download,
  Sparkles,
} from 'lucide-vue-next'

// feat : 사용자 권한 상수 정의
const ROLES = {
  MANAGER: 'site_manager',
  WORKER: 'process_owner',
}

const currentRole = ref(ROLES.WORKER)
const ALL_PROCESSES = [
  '공통/가설',
  '토공사',
  '지정/기초',
  '골조공사',
  '건축마감',
  '기계/설비',
  '전기/통신',
  '토목/조경',
  '준공/검사',
]

const myProcess = ref(ALL_PROCESSES[0])

const TRADE_ENUM_MAP = {
  EARTHWORK: '토공사',
  FORM: '골조공사',
  FRAME: '골조공사',
  REBAR: '골조공사',
  CONCRETE: '골조공사',
  FACILITY: '기계/설비',
  ELECTRIC: '전기/통신',
  TELECOM: '전기/통신',
  WATERPROOF: '건축마감',
  MASONRY: '건축마감',
  PLASTER: '건축마감',
  TILE: '건축마감',
  PAINT: '건축마감',
  LANDSCAPE: '토목/조경',
  PAVEMENT: '토목/조경',
  ETC: '기타',
}

function normalizeTradeName(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  const upper = raw.toUpperCase()
  if (TRADE_ENUM_MAP[upper]) return TRADE_ENUM_MAP[upper]

  const compact = raw.replace(/\s+/g, '')
  if (
    ['공통/가설', '공통가설', '가설공사'].includes(compact) ||
    /가설|현장개설|울타리|가설사무실|가설전기|가설수도/.test(raw)
  )
    return '공통/가설'
  if (
    ['토공', '토공사'].includes(compact) ||
    /토공|터파기|토사|굴착|되메우기|흙막이|토목굴착/.test(raw)
  )
    return '토공사'
  if (
    ['지정/기초', '지정기초', '기초공사', '지정공사'].includes(compact) ||
    /지정|기초|파일|PHC|지반|말뚝/.test(raw)
  )
    return '지정/기초'
  if (
    ['골조', '골조공사', '철근', '콘크리트', '형틀', '거푸집'].includes(compact) ||
    /골조|철근|콘크리트|거푸집|형틀|타설|RC/.test(raw)
  )
    return '골조공사'
  if (
    ['건축마감', '마감', '마감공사'].includes(compact) ||
    /마감|조적|방수|미장|타일|도장|창호|석고|수장|도배|단열|내장/.test(raw)
  )
    return '건축마감'
  if (
    ['기계/설비', '기계설비', '설비', '기계'].includes(compact) ||
    /기계|설비|배관|위생|소방|공조|환기|급수|배수/.test(raw)
  )
    return '기계/설비'
  if (
    ['전기/통신', '전기통신', '전기', '통신'].includes(compact) ||
    /전기|통신|조명|배선|전력|약전|수배전/.test(raw)
  )
    return '전기/통신'
  if (
    ['토목/조경', '토목조경', '조경', '포장'].includes(compact) ||
    /토목|조경|포장|외부|부대토목|도로/.test(raw)
  )
    return '토목/조경'
  if (
    ['준공/검사', '준공검사', '준공', '검사'].includes(compact) ||
    /준공|검사|시운전|사용승인|청소|인수인계/.test(raw)
  )
    return '준공/검사'

  return null
}

function getTradeNameFromRecord(record) {
  if (!record) return null
  return normalizeTradeName(
    record.tradeName ||
      record.majorTradeName ||
      record.tradeType ||
      record.trade ||
      record.category ||
      record.process ||
      record.tradeProcess?.tradeName ||
      record.tradeProcess?.tradeType ||
      record.tradeProcess?.trade ||
      record.tradeProcess?.category ||
      record.tradeProcessName ||
      record.name ||
      record.title,
  )
}

function getAllTradeOptions() {
  return ALL_PROCESSES
}

// feat : 공정 카테고리별 투입 가능한 중장비 목록 데이터
const equipmentList = {
  '굴착·토공': ['굴삭기', '미니굴삭기', '백호', '드래그라인'],
  운반: ['덤프트럭', '트럭 믹서', '트랙터', '트레일러', '스크레이퍼'],
  '하역·양중': ['타워크레인', '모바일 크레인', '크롤러 크레인', '지게차', '리프트'],
  '정지·다짐': ['불도저', '모터 그레이더', '롤러', '콤팩터'],
  '도로·포장': ['아스팔트 피니셔', '밀링 머신', '살수차', '노면 절단기'],
  '기초·파일': ['파일 드라이버', '보링머신', '어스오거', 'RCD'],
  콘크리트: ['콘크리트 펌프카', '배치 플랜트', '바이브레이터'],
  '철거·특수': ['브레이커', '니블러', '크러셔', '고소작업차', 'TBM'],
}

const EQ_ENUM_MAP = {
  EXCAVATOR: '굴삭기',
  MINI_EXCAVATOR: '미니굴삭기',
  BACKHOE: '백호',
  DRAGLINE: '드래그라인',
  DUMP_TRUCK: '덤프트럭',
  TRUCK_MIXER: '트럭 믹서',
  TRACTOR: '트랙터',
  TRAILER: '트레일러',
  SCRAPER: '스크레이퍼',
  TOWER_CRANE: '타워크레인',
  MOBILE_CRANE: '모바일 크레인',
  CRAWLER_CRANE: '크롤러 크레인',
  FORKLIFT: '지게차',
  LIFT: '리프트',
  BULLDOZER: '불도저',
  MOTOR_GRADER: '모터 그레이더',
  ROLLER: '롤러',
  COMPACTOR: '콤팩터',
  ASPHALT_FINISHER: '아스팔트 피니셔',
  MILLING_MACHINE: '밀링 머신',
  WATER_TRUCK: '살수차',
  ROAD_CUTTER: '노면 절단기',
  PILE_DRIVER: '파일 드라이버',
  BORING_MACHINE: '보링머신',
  EARTH_AUGER: '어스오거',
  RCD: 'RCD',
  CONCRETE_PUMP: '콘크리트 펌프카',
  BATCH_PLANT: '배치 플랜트',
  VIBRATOR: '바이브레이터',
  BREAKER: '브레이커',
  NIBBLER: '니블러',
  CRUSHER: '크러셔',
  AERIAL_WORK_PLATFORM: '고소작업차',
  TBM: 'TBM',
}

function getEqKorName(name) {
  if (!name) return '장비'
  return EQ_ENUM_MAP[name.toUpperCase()] || name
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function fmtKor(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`
}

const selectedDate = ref(todayStr())
const tomorrowDate = computed(() => addDays(selectedDate.value, 1))
function prevDay() {
  selectedDate.value = addDays(selectedDate.value, -1)
}
function nextDay() {
  selectedDate.value = addDays(selectedDate.value, 1)
}
function goToday() {
  selectedDate.value = todayStr()
}
const isToday = computed(() => selectedDate.value === todayStr())

const activeTab = ref('today')
const modalTab = ref('today')

function switchTab(tab) {
  if (tab === 'consolidated' && currentRole.value !== ROLES.MANAGER) return
  activeTab.value = tab
}

function switchRole(role) {
  currentRole.value = role
  if (role === ROLES.WORKER) activeTab.value = 'today'
}

const reports = ref([])

// feat : 공사일보 조회
async function loadReportsForDate(targetDate) {
  try {
    const res = await api.get('/report/', { params: { date: targetDate } })
    const dbReports = Array.isArray(res) ? res : res.data?.data || res.data || []

    const toDateString = (dateVal) => {
      if (Array.isArray(dateVal))
        return `${dateVal[0]}-${String(dateVal[1]).padStart(2, '0')}-${String(dateVal[2]).padStart(2, '0')}`
      return dateVal
    }

    reports.value = dbReports.map((db) => ({
      id: db.idx,
      workPlanId: db.workPlanId,
      date: toDateString(db.reportDate),
      process: getTradeNameFromRecord(db) || '공종 미지정',
      workers: db.actualWorkerCount || 0,
      location: db.location || '',
      equipmentCount: 0,
      equipmentList: [],
      todayWork: db.todayWork || '',
      tomorrowPlan: db.tomorrowPlan || '',
      progress: db.todayProgress || 0,
      processProgress: db.actualProgress || 0,
      notes: db.issue || '',
      completion: db.actualProgress >= 100 ? '완료' : '미완료',
      status: '제출 완료',
      photos: [],
      files: [],
    }))
  } catch (error) {
    console.error('데이터 로드 실패:', error)
  }
}

onMounted(() => {
  loadReportsForDate(selectedDate.value)
  document.addEventListener('keydown', onKeydown)
})

watch(selectedDate, (newDate) => {
  loadReportsForDate(newDate)
})

const STATUS_META = {
  '작성 전': { cls: 'bg-slate-100 text-slate-500 ring-slate-200', icon: Clock },
  '임시 저장': { cls: 'bg-amber-50 text-amber-700 ring-amber-200', icon: Pencil },
  '제출 완료': { cls: 'bg-sky-50 text-sky-700 ring-sky-200', icon: Send },
  '검토 중': { cls: 'bg-violet-50 text-violet-700 ring-violet-200', icon: Eye },
  '승인 완료': { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  반려: { cls: 'bg-rose-50 text-rose-700 ring-rose-200', icon: AlertTriangle },
}
function statusMeta(s) {
  return STATUS_META[s] || STATUS_META['작성 전']
}

const visibleProcesses = computed(() => {
  if (currentRole.value === ROLES.WORKER) return [myProcess.value]
  return getAllTradeOptions()
})

function reportsForDate(dateStr) {
  return reports.value.filter(
    (r) => r.date === dateStr && visibleProcesses.value.includes(r.process),
  )
}

const todayReports = computed(() => reportsForDate(selectedDate.value))
const tomorrowReports = computed(() => reportsForDate(tomorrowDate.value))

const stats = computed(() => {
  const list = todayReports.value
  const total = list.length
  const submitted = list.filter((r) =>
    ['제출 완료', '검토 중', '승인 완료'].includes(r.status),
  ).length
  const pending = list.filter((r) => r.status === '작성 전' || r.status === '임시 저장').length
  const completed = list.filter((r) => r.completion === '완료').length
  const totalWorkers = list.reduce((s, r) => s + (r.workers || 0), 0)
  const totalEquip = list.reduce((s, r) => s + (r.equipmentCount || 0), 0)
  const avgProgress = total
    ? Math.round(list.reduce((s, r) => s + (r.processProgress || 0), 0) / total)
    : 0
  return { total, submitted, pending, completed, totalWorkers, totalEquip, avgProgress }
})

const showEditor = ref(false)
const editingReport = ref(null)
const isNewReport = ref(false)

const showTaskSelector = ref(false)
const availableTodayOrders = ref([])
const availableTomorrowPlans = ref([])

function canEdit(report) {
  if (currentRole.value === ROLES.MANAGER) return false
  if (report.process !== myProcess.value) return false
  if (report.status === '승인 완료') return false
  return true
}

// feat : 금일 작업 지시서 불러오기
async function openCreate() {
  const targetDate = selectedDate.value
  const targetProcess = myProcess.value

  try {
    const res = await api.get('/work-order').catch(() => ({ data: [] }))
    const orders = Array.isArray(res) ? res : res.data?.data || res.data || []

    availableTodayOrders.value = orders.filter(
      (o) =>
        getTradeNameFromRecord(o) === targetProcess &&
        o.dueDate === targetDate &&
        o.statusCode === 'APPROVED', // 승인된 지시서만 노출
    )

    if (availableTodayOrders.value.length === 0) {
      alert(`${targetDate} 일자에 등록된 [${targetProcess}] 작업 지시서가 없습니다.`)
      return
    }
    showTaskSelector.value = true
  } catch (e) {
    console.error('작업 지시서 조회 실패:', e)
  }
}

// feat : 작업 지시서 선택 시 에디터 세팅 및 데이터 로드
async function selectTaskForReport(order) {
  showTaskSelector.value = false
  isNewReport.value = true

  editingReport.value = {
    id: `r_${Date.now()}`,
    date: selectedDate.value,
    process: myProcess.value,
    author: '나(담당자)',
    location:
      order.location || order.title.replace(`[${myProcess.value}] `, '').replace(' 작업지시서', ''),
    workers: order.workerCount || 0,
    equipmentCount: 0,
    equipmentList: (order.equipments || []).map(
      (eq) =>
        `${getEqKorName(eq.equipmentName || eq.type)} ${eq.equipmentCount || eq.count || 1}대`,
    ),
    equipmentInput: { name: '', count: 1 },
    todayWork: `[지시내용]\n${order.instructionContent || ''}\n\n[실제 완료]\n`,
    startDate: '',
    endDate: '',
    tradeStartDate: '',
    tradeEndDate: '', // 🌟 진척률 계산용 '전체 월간 세부계획 기간' 변수 추가
    progress: 0,
    processProgress: 0,
    prevProgress: 0,
    completion: '미완료',
    notes: '',
    photos: [],
    files: [],
    status: '작성 전',
    workPlanId: order.workPlanId || null,
    monthlyWorkPlanId: null,
    monthlyWorkPlanName: '',
    todayMonthlyOrderCount: 1,
    tomorrowWorkPlanId: null,
    tomorrowLocation: order.location || '',
    tomorrowWorkers: 0,
    tomorrowEquipmentList: [],
    tomorrowEquipmentInput: { name: '', count: 1 },
    tomorrowPlan: '',
    tomorrowSafety: '',
  }

  try {
    // 1. 전체 월간 세부계획 기간(철근 전체)을 구하기 위해 모든 계획을 불러옵니다.
    const [weekRes, monthRes, yearRes] = await Promise.all([
      api.get('/work-plan', { params: { planType: '주간' } }).catch(() => ({ data: [] })),
      api.get('/work-plan', { params: { planType: '월간' } }).catch(() => ({ data: [] })),
      api.get('/work-plan', { params: { planType: '연간' } }).catch(() => ({ data: [] })),
    ])

    const weeklyPlans = Array.isArray(weekRes) ? weekRes : weekRes.data?.data || weekRes.data || []

    const monthlyPlans = Array.isArray(monthRes)
      ? monthRes
      : monthRes.data?.data || monthRes.data || []

    const yearlyPlans = Array.isArray(yearRes) ? yearRes : yearRes.data?.data || yearRes.data || []

    const allPlans = [...weeklyPlans, ...monthlyPlans, ...yearlyPlans]

    function findMonthlyPlanByWeeklyPlanId(weeklyPlanId) {
      if (!weeklyPlanId) return null

      const weeklyPlan = weeklyPlans.find((p) => Number(p.idx ?? p.id) === Number(weeklyPlanId))

      if (!weeklyPlan?.parentWorkPlanId) return null

      return (
        monthlyPlans.find((p) => Number(p.idx ?? p.id) === Number(weeklyPlan.parentWorkPlanId)) ||
        null
      )
    }

    const toDateString = (d) =>
      Array.isArray(d)
        ? `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`
        : d

    // let tradeMinStart = '9999-12-31'
    // let tradeMaxEnd = '0000-01-01'

    // // 🌟 2. 내 공종(철근)의 모든 계획을 뒤져서 '진짜 시작일'과 '진짜 종료일'을 찾습니다.
    // allPlans.forEach((p) => {
    //   if (getTradeNameFromRecord(p) === myProcess.value) {
    //     const s = toDateString(p.startDate)
    //     const e = toDateString(p.endDate)
    //     if (s && s < tradeMinStart) tradeMinStart = s
    //     if (e && e > tradeMaxEnd) tradeMaxEnd = e
    //   }
    // })

    // // 찾은 전체 월간 세부계획 기간을 숨겨진 변수에 저장합니다.
    // if (tradeMinStart !== '9999-12-31') editingReport.value.tradeStartDate = tradeMinStart
    // if (tradeMaxEnd !== '0000-01-01') editingReport.value.tradeEndDate = tradeMaxEnd

    const monthlyPlan = findMonthlyPlanByWeeklyPlanId(order.workPlanId)

    if (monthlyPlan) {
      editingReport.value.startDate = toDateString(monthlyPlan.startDate) || ''
      editingReport.value.endDate = toDateString(monthlyPlan.endDate) || ''
      editingReport.value.monthlyWorkPlanId = monthlyPlan.idx ?? monthlyPlan.id
      editingReport.value.monthlyWorkPlanName = monthlyPlan.name || ''
    } else if (order.workPlanId) {
      const currentPlan = weeklyPlans.find(
        (p) => Number(p.idx ?? p.id) === Number(order.workPlanId),
      )

      if (currentPlan) {
        editingReport.value.startDate = toDateString(currentPlan.startDate) || ''
        editingReport.value.endDate = toDateString(currentPlan.endDate) || ''
      }
    }

    // 3. 진척률 계산 기준은 주간/일일 계획이 아니라 부모 월간 세부계획 기간입니다.
    //    위에서 monthlyPlan을 찾은 경우 startDate/endDate를 다시 주간 계획 날짜로 덮어쓰지 않습니다.
    if (monthlyPlan) {
      const monthlyPlanId = Number(monthlyPlan.idx ?? monthlyPlan.id)
      const sameMonthlyOrdersCount = availableTodayOrders.value.filter((todayOrder) => {
        const weeklyPlan = weeklyPlans.find(
          (p) => Number(p.idx ?? p.id) === Number(todayOrder.workPlanId),
        )
        return Number(weeklyPlan?.parentWorkPlanId) === monthlyPlanId
      }).length

      editingReport.value.todayMonthlyOrderCount = Math.max(1, sameMonthlyOrdersCount)
    }

    // 이전 누적 진척률은 공사일보가 연결된 부모 월간 세부계획의 actualProgressPct를 사용합니다.
    // 기존처럼 같은 주간 계획의 이전 공사일보를 찾으면, 월간 세부계획 전체 누적률을 이어받지 못합니다.
    if (monthlyPlan) {
      const monthlyActualProgress = Number(
        monthlyPlan.actualProgressPct ?? monthlyPlan.actualProgress ?? 0,
      )
      editingReport.value.prevProgress = Number.isFinite(monthlyActualProgress)
        ? monthlyActualProgress
        : 0
      editingReport.value.processProgress = editingReport.value.prevProgress
    }

    const tmrwStr = tomorrowDate.value
    availableTomorrowPlans.value = allPlans.filter(
      (p) =>
        getTradeNameFromRecord(p) === myProcess.value &&
        tmrwStr >= toDateString(p.startDate) &&
        tmrwStr <= toDateString(p.endDate),
    )
  } catch (e) {
    console.error('명일 주간계획 로드 실패', e)
  }

  showEditor.value = true
}

// feat : 명일 주간계획 선택 시 내용 자동 바인딩
function onTomorrowPlanSelect() {
  const planId = editingReport.value.tomorrowWorkPlanId
  const targetPlan = availableTomorrowPlans.value.find((p) => p.idx === planId || p.id === planId)

  if (targetPlan) {
    editingReport.value.tomorrowLocation = targetPlan.location || editingReport.value.location
    editingReport.value.tomorrowPlan = targetPlan.name || ''
    if (targetPlan.note) editingReport.value.tomorrowPlan += `\n\n${targetPlan.note}`

    editingReport.value.tomorrowWorkers = targetPlan.requiredCount || 0

    if (targetPlan.equipmentDisplay) {
      const tEqList = []
      targetPlan.equipmentDisplay.split(',').forEach((item) => {
        const match = item.trim().match(/(.+)\s+(\d+)대/)
        if (match) tEqList.push(`${match[1].trim()} ${match[2]}대`)
      })
      editingReport.value.tomorrowEquipmentList = [...new Set(tEqList)]
    } else {
      editingReport.value.tomorrowEquipmentList = []
    }
  }
}

// feat : 기존 작성된 보고서 수정
async function openEditor(report) {
  isNewReport.value = false
  editingReport.value = {
    ...report,
    equipmentList: [...(report.equipmentList || [])],
    equipmentInput: { name: '', count: 1 },
    tradeStartDate: '',
    tradeEndDate: '',
    monthlyWorkPlanId: report.monthlyWorkPlanId || null,
    monthlyWorkPlanName: report.monthlyWorkPlanName || '',
    todayMonthlyOrderCount: report.todayMonthlyOrderCount || 1,
    tomorrowWorkPlanId: null,
    tomorrowLocation: report.location || '',
    tomorrowWorkers: 0,
    tomorrowEquipmentList: [],
    tomorrowEquipmentInput: { name: '', count: 1 },
    tomorrowPlan: report.tomorrowPlan || '',
    tomorrowSafety: '',
    photos: (report.photos || []).map((p) => ({ ...p })),
    files: (report.files || []).map((f) => ({ ...f })),
  }

  try {
    const [weekRes, monthRes, yearRes] = await Promise.all([
      api.get('/work-plan', { params: { planType: '주간' } }).catch(() => ({ data: [] })),
      api.get('/work-plan', { params: { planType: '월간' } }).catch(() => ({ data: [] })),
      api.get('/work-plan', { params: { planType: '연간' } }).catch(() => ({ data: [] })),
    ])

    const weeklyPlans = Array.isArray(weekRes) ? weekRes : weekRes.data?.data || weekRes.data || []
    const monthlyPlans = Array.isArray(monthRes)
      ? monthRes
      : monthRes.data?.data || monthRes.data || []
    const yearlyPlans = Array.isArray(yearRes) ? yearRes : yearRes.data?.data || yearRes.data || []

    const allPlans = [...weeklyPlans, ...monthlyPlans, ...yearlyPlans]

    const toDateString = (d) =>
      Array.isArray(d)
        ? `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`
        : d

    if (report.workPlanId) {
      const weeklyPlan = weeklyPlans.find(
        (p) => Number(p.idx ?? p.id) === Number(report.workPlanId),
      )
      const monthlyPlan = weeklyPlan?.parentWorkPlanId
        ? monthlyPlans.find((p) => Number(p.idx ?? p.id) === Number(weeklyPlan.parentWorkPlanId))
        : null

      if (monthlyPlan) {
        editingReport.value.startDate = toDateString(monthlyPlan.startDate) || ''
        editingReport.value.endDate = toDateString(monthlyPlan.endDate) || ''
        editingReport.value.monthlyWorkPlanId = monthlyPlan.idx ?? monthlyPlan.id
        editingReport.value.monthlyWorkPlanName = monthlyPlan.name || ''

        const monthlyActualProgress = Number(
          monthlyPlan.actualProgressPct ?? monthlyPlan.actualProgress ?? 0,
        )
        editingReport.value.prevProgress = Number.isFinite(monthlyActualProgress)
          ? monthlyActualProgress
          : 0
        editingReport.value.processProgress = editingReport.value.prevProgress
      } else if (!editingReport.value.startDate || !editingReport.value.endDate) {
        const currentPlan = allPlans.find(
          (p) => Number(p.idx ?? p.id) === Number(report.workPlanId),
        )
        if (currentPlan) {
          editingReport.value.startDate = toDateString(currentPlan.startDate) || ''
          editingReport.value.endDate = toDateString(currentPlan.endDate) || ''
        }
      }
    }

    const tmrwStr = tomorrowDate.value
    availableTomorrowPlans.value = allPlans.filter(
      (p) =>
        getTradeNameFromRecord(p) === myProcess.value &&
        tmrwStr >= toDateString(p.startDate) &&
        tmrwStr <= toDateString(p.endDate),
    )
  } catch (e) {
    console.error(e)
  }

  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingReport.value = null
  modalTab.value = 'today'
}

// feat : 월간 세부계획 기간 비례 금일 증가분(%) 자동 계산 로직
const calcInfo = computed(() => {
  const r = editingReport.value
  if (!r) return null

  // 핵심: 진척률 계산은 선택한 주간/일일 계획이 아니라 부모 월간 세부계획 기간을 기준으로 합니다.
  const start = new Date(r.startDate)
  const end = new Date(r.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

  // 1. 월간 세부계획 기간 (예: 15일)
  const duration = Math.max(1, Math.round((end - start) / 86400000) + 1)

  // 2. 하루 목표 진척률 (예: 100% / 15일 = 6.67%)
  const dailyAllocation = 100 / duration

  // 3. 금일 발급된 같은 월간 세부계획의 작업 지시서 개수
  const tasksTodayCount = Math.max(1, r.todayMonthlyOrderCount || availableTodayOrders.value.length)

  // 4. 세부 작업 1개당 배분된 가중치
  const weightPerTask = dailyAllocation / tasksTodayCount

  // 5. 사용자가 당긴 해당 세부 작업 완료율에 가중치를 곱함
  const increment = ((r.progress || 0) / 100) * weightPerTask

  return {
    duration,
    dailyAllocation: parseFloat(dailyAllocation.toFixed(2)),
    tasksTodayCount,
    weightPerTask: parseFloat(weightPerTask.toFixed(2)),
    increment: parseFloat(increment.toFixed(2)),
  }
})

watch(
  () => [
    editingReport.value?.progress,
    editingReport.value?.startDate,
    editingReport.value?.endDate,
    editingReport.value?.prevProgress,
    editingReport.value?.todayMonthlyOrderCount,
  ],
  () => {
    const r = editingReport.value
    if (!r) return
    const info = calcInfo.value
    if (!info) {
      r.processProgress = r.prevProgress || 0
      return
    }
    r.processProgress = parseFloat(Math.min(100, (r.prevProgress || 0) + info.increment).toFixed(1))
  },
  { deep: true },
)

function addEquipment() {
  const v = (editingReport.value.equipmentInput.name || '').trim()
  if (!v) return
  const count = Math.max(1, editingReport.value.equipmentInput.count || 1)
  editingReport.value.equipmentList.push(v + ' ' + count + '대')
  editingReport.value.equipmentInput = { name: '', count: 1 }
}
function removeEquipment(idx) {
  editingReport.value.equipmentList.splice(idx, 1)
}

function addTomorrowEquipment() {
  const v = (editingReport.value.tomorrowEquipmentInput.name || '').trim()
  if (!v) return
  const count = Math.max(1, editingReport.value.tomorrowEquipmentInput.count || 1)
  editingReport.value.tomorrowEquipmentList.push(v + ' ' + count + '대')
  editingReport.value.tomorrowEquipmentInput = { name: '', count: 1 }
}
function removeTomorrowEquipment(idx) {
  editingReport.value.tomorrowEquipmentList.splice(idx, 1)
}

// feat : 복구된 사진 및 첨부파일 업로드 로직
const photoInputRef = ref(null)
const fileInputRef = ref(null)

function pickPhotos() {
  photoInputRef.value?.click()
}
function pickFiles() {
  fileInputRef.value?.click()
}

function onPhotoChange(e) {
  const list = Array.from(e.target.files || [])
  list.forEach((f) => {
    if (!f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      editingReport.value.photos.push({
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
  list.forEach((f) => {
    editingReport.value.files.push({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type,
    })
  })
  e.target.value = ''
}

function removePhoto(idx) {
  editingReport.value.photos.splice(idx, 1)
}
function removeFile(idx) {
  editingReport.value.files.splice(idx, 1)
}
function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function fileBadge(type) {
  if (!type) return '파일'
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('sheet') || type.includes('excel')) return 'XLSX'
  if (type.includes('image')) return 'IMG'
  return '파일'
}

function saveDraft() {
  persistEditing('임시 저장')
  closeEditor()
}

async function submitReport() {
  const r = editingReport.value
  if (!r.location.trim()) {
    alert('작업 위치는 필수입니다.')
    return
  }

  // 백엔드 전송 데이터 구성
  const payload = {
    workPlanId: r.workPlanId,
    todayProgress: parseFloat(r.progress || 0),
    actualProgress: parseFloat(r.processProgress || 0),
    monthlyWorkPlanId: r.monthlyWorkPlanId || null,
    progressIncrementPct: calcInfo.value?.increment ?? 0,
    monthlyProgressPct: parseFloat(r.processProgress || 0),
    actualWorkerCount: r.workers || 0,
    issue: r.notes || '특이사항 없음',
    reportDate: r.date,
    todayWork: r.todayWork,

    // 명일 일정 덮어쓰기용 데이터
    tomorrowWorkPlanId: r.tomorrowWorkPlanId,
    tomorrowPlan: r.tomorrowPlan + (r.tomorrowSafety ? `\n\n[안전사항]\n${r.tomorrowSafety}` : ''),
    tomorrowWorkerCount: r.tomorrowWorkers || 0,
    tomorrowEquipments: r.tomorrowEquipmentList.map((eqStr) => {
      const match = eqStr.match(/(.+)\s+(\d+)대/)
      return match
        ? { type: match[1].trim(), count: parseInt(match[2], 10) }
        : { type: '기타', count: 1 }
    }),
  }

  try {
    await api.post('/report/', payload)
    r.submittedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    persistEditing('제출 완료')
    closeEditor()
    alert('🎉 공사일보 제출 및 내일 주간계획 업데이트가 완료되었습니다!')
    loadReportsForDate(selectedDate.value)
  } catch (error) {
    console.error(error)
    alert('제출에 실패했습니다.')
  }
}

function persistEditing(newStatus) {
  const r = editingReport.value
  delete r.equipmentInput
  delete r.tomorrowEquipmentInput
  r.status = newStatus

  const idx = reports.value.findIndex((x) => x.id === r.id)
  if (idx >= 0) reports.value.splice(idx, 1, { ...r })
  else reports.value.push({ ...r })
}

// feat : 복구된 상세보기 모달 로직
const viewingReport = ref(null)

function openViewer(report) {
  viewingReport.value = report
}
function closeViewer() {
  viewingReport.value = null
}

function approveReport() {
  if (!viewingReport.value) return
  const idx = reports.value.findIndex((r) => r.id === viewingReport.value.id)
  if (idx >= 0) {
    reports.value[idx].status = '승인 완료'
    viewingReport.value = reports.value[idx]
  }
}

function rejectReport() {
  if (!viewingReport.value) return
  const idx = reports.value.findIndex((r) => r.id === viewingReport.value.id)
  if (idx >= 0) {
    reports.value[idx].status = '반려'
    viewingReport.value = reports.value[idx]
  }
}

function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (showTaskSelector.value) showTaskSelector.value = false
  else if (showEditor.value) closeEditor()
  else if (viewingReport.value) closeViewer()
}

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 pb-6">
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">현장 보고</p>
        <h1 class="text-xl font-bold text-forena-900">공사일보</h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="
              currentRole === ROLES.WORKER
                ? 'bg-forena-800 text-white'
                : 'text-forena-600 hover:bg-forena-50'
            "
            @click="switchRole(ROLES.WORKER)"
          >
            <UserCog class="h-3.5 w-3.5" /> 공종 담당자
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="
              currentRole === ROLES.MANAGER
                ? 'bg-forena-800 text-white'
                : 'text-forena-600 hover:bg-forena-50'
            "
            @click="switchRole(ROLES.MANAGER)"
          >
            <ShieldCheck class="h-3.5 w-3.5" /> 현장 총 책임자
          </button>
        </div>

        <select
          v-if="currentRole === ROLES.WORKER"
          v-model="myProcess"
          class="rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400"
        >
          <option v-for="p in ALL_PROCESSES" :key="p" :value="p">{{ p }} 공종</option>
        </select>
      </div>
    </div>

    <div
      class="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-forena-100 bg-white px-4 py-3"
    >
      <div class="flex items-center gap-1.5">
        <CalendarDays class="h-4 w-4 text-flare-600" />
        <span class="text-[11px] font-bold uppercase tracking-wide text-forena-500">조회 일자</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          @click="prevDay"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 hover:bg-forena-50"
        >
          <ChevronLeft class="h-3.5 w-3.5" />
        </button>
        <input
          type="date"
          v-model="selectedDate"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs font-semibold tabular-nums text-forena-800 outline-none focus:border-flare-400"
        />
        <button
          @click="nextDay"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 hover:bg-forena-50"
        >
          <ChevronRight class="h-3.5 w-3.5" />
        </button>
        <button
          @click="goToday"
          class="ml-1 rounded-md border px-2 py-1 text-[10px] font-bold transition"
          :class="
            isToday
              ? 'border-flare-200 bg-flare-50 text-flare-700'
              : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'
          "
          :disabled="isToday"
        >
          오늘
        </button>
      </div>

      <span class="text-xs font-semibold text-forena-700 tabular-nums">{{
        fmtKor(selectedDate)
      }}</span>

      <div class="ml-auto flex items-center gap-2">
        <span
          v-if="currentRole === ROLES.MANAGER && stats.pending > 0"
          class="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200"
        >
          <AlertTriangle class="h-3 w-3" />미제출 {{ stats.pending }}건
        </span>
        <button
          v-if="currentRole === ROLES.WORKER"
          @click="openCreate"
          class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-flare-600"
        >
          <Plus class="h-3.5 w-3.5" /> 공사일보 작성
        </button>
      </div>
    </div>

    <div
      v-if="currentRole === ROLES.MANAGER"
      class="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
    >
      <div class="rounded-xl border border-forena-100 bg-white p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">전체 공종</p>
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
        <p
          class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400"
        >
          <Users class="h-3 w-3" /> 총 투입 인력
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
          {{ stats.totalWorkers }}<span class="text-sm font-normal text-slate-400 ml-1">명</span>
        </p>
      </div>
      <div class="rounded-xl border border-forena-100 bg-white p-3.5">
        <p
          class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400"
        >
          <Wrench class="h-3 w-3" /> 총 투입 장비
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
          {{ stats.totalEquip }}<span class="text-sm font-normal text-slate-400 ml-1">대</span>
        </p>
      </div>
      <div class="rounded-xl border border-flare-100 bg-flare-50/40 p-3.5">
        <p class="text-[10px] font-bold uppercase tracking-wide text-flare-600">평균 진척률</p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-flare-700">
          {{ stats.avgProgress }}<span class="text-sm font-normal ml-0.5">%</span>
        </p>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1 border-b border-forena-100 mt-2">
      <button
        class="border-b-2 px-4 py-2 text-xs font-bold transition"
        :class="
          activeTab === 'today'
            ? 'border-flare-500 text-flare-700'
            : 'border-transparent text-forena-500 hover:text-forena-700'
        "
        @click="switchTab('today')"
      >
        금일 공사일보
      </button>
      <button
        class="border-b-2 px-4 py-2 text-xs font-bold transition"
        :class="
          activeTab === 'tomorrow'
            ? 'border-flare-500 text-flare-700'
            : 'border-transparent text-forena-500 hover:text-forena-700'
        "
        @click="switchTab('tomorrow')"
      >
        명일 작업 예정
      </button>
      <button
        v-if="currentRole === ROLES.MANAGER"
        class="inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-bold transition"
        :class="
          activeTab === 'consolidated'
            ? 'border-flare-500 text-flare-700'
            : 'border-transparent text-forena-500 hover:text-forena-700'
        "
        @click="switchTab('consolidated')"
      >
        <Layers class="h-3.5 w-3.5" /> 종합 공사일보
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="activeTab === 'today'" class="grid grid-cols-1 gap-3 lg:grid-cols-2 mt-2">
        <div
          v-if="todayReports.length === 0"
          class="col-span-1 lg:col-span-2 flex flex-col items-center justify-center gap-3 py-16 text-center"
        >
          <FileText class="h-10 w-10 text-slate-300" />
          <p class="text-sm text-slate-500">작성된 공사일보가 없습니다.</p>
          <button
            v-if="currentRole === ROLES.WORKER"
            @click="openCreate"
            class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white hover:bg-flare-600"
          >
            <Plus class="h-3.5 w-3.5" /> 작성하기
          </button>
        </div>

        <div
          v-for="r in todayReports"
          :key="r.id"
          class="flex flex-col rounded-xl border bg-white border-forena-100 hover:border-flare-200 hover:shadow-sm transition"
        >
          <div class="flex items-start justify-between gap-3 border-b border-forena-100 px-4 py-3">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span
                  class="rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-bold text-forena-700"
                  >{{ r.process }} 공종</span
                >
                <span
                  class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
                  :class="statusMeta(r.status).cls"
                  ><component :is="statusMeta(r.status).icon" class="h-3 w-3" />
                  {{ r.status }}</span
                >
              </div>
              <p class="mt-1.5 truncate text-sm font-bold text-forena-900">
                {{ r.location || '작업 위치 미입력' }}
              </p>
            </div>
            <div class="flex shrink-0 gap-1">
              <button
                @click="openViewer(r)"
                class="rounded-md border border-forena-200 bg-white p-1.5 text-forena-600 hover:bg-forena-50"
                title="상세 보기"
              >
                <Eye class="h-3.5 w-3.5" />
              </button>
              <button
                v-if="canEdit(r)"
                @click="openEditor(r)"
                class="rounded-md border border-flare-200 bg-flare-50 p-1.5 text-flare-700 hover:bg-flare-100"
                title="수정"
              >
                <Pencil class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div class="flex-1 px-4 py-3">
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-lg bg-forena-50/40 px-2.5 py-2">
                <p class="flex items-center gap-1 text-[10px] font-bold text-forena-400">
                  <Users class="h-3 w-3" /> 인력
                </p>
                <p class="mt-0.5 text-base font-bold tabular-nums text-forena-900">
                  {{ r.workers
                  }}<span class="text-[10px] font-normal text-slate-400 ml-0.5">명</span>
                </p>
              </div>
              <div class="rounded-lg bg-forena-50/40 px-2.5 py-2">
                <p class="flex items-center gap-1 text-[10px] font-bold text-forena-400">
                  <Wrench class="h-3 w-3" /> 장비
                </p>
                <p class="mt-0.5 text-base font-bold tabular-nums text-forena-900">
                  {{ r.equipmentCount
                  }}<span class="text-[10px] font-normal text-slate-400 ml-0.5">대</span>
                </p>
              </div>

              <div class="rounded-lg bg-flare-50/60 px-2.5 py-1.5 flex flex-col justify-center">
                <p class="flex items-center justify-between text-[10px] font-bold text-flare-600">
                  전체 진척률
                  <span
                    class="rounded bg-white px-1 py-0.5 text-[9px] font-bold text-flare-600 shadow-sm border border-flare-100"
                    >금일 {{ r.progress }}%</span
                  >
                </p>
                <p class="mt-0.5 text-base font-bold tabular-nums text-flare-700">
                  {{ r.processProgress }}<span class="text-[10px] font-normal ml-0.5">%</span>
                </p>
              </div>
            </div>

            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
              <div
                class="h-full rounded-full bg-flare-500 transition-all"
                :style="{ width: r.processProgress + '%' }"
              ></div>
            </div>

            <div class="mt-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                금일 작업 완료
              </p>
              <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ r.todayWork || '—' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'tomorrow'" class="space-y-3 mt-2">
        <p class="text-xs text-forena-500">
          <span class="font-bold tabular-nums text-forena-700">{{ fmtKor(tomorrowDate) }}</span>
          기준 공종별 작업 예정 내용입니다.
        </p>
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div
            v-for="r in todayReports"
            :key="'tomorrow_' + r.id"
            class="rounded-xl border border-forena-100 bg-white p-4"
          >
            <div class="flex items-center gap-1.5">
              <span
                class="rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-bold text-forena-700"
                >{{ r.process }} 공종</span
              >
            </div>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-wide text-forena-400">
              명일 작업 예정
            </p>
            <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ r.tomorrowPlan || '—' }}</p>
          </div>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showTaskSelector"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="showTaskSelector = false"
      >
        <div
          class="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-forena-100 px-6 py-4"
          >
            <div>
              <p class="text-base font-bold text-forena-900">공사일보 작성 대상 세부 작업 선택</p>
              <p class="mt-0.5 text-xs text-forena-500">
                {{ fmtKor(selectedDate) }} 기준 승인된 작업 지시서 목록입니다.
              </p>
            </div>
            <button @click="showTaskSelector = false" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="overflow-y-auto px-6 py-4">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                v-for="order in availableTodayOrders"
                :key="order.idx"
                @click="selectTaskForReport(order)"
                class="group cursor-pointer rounded-xl border border-forena-200 bg-white p-4 transition-all hover:border-flare-400 hover:bg-flare-50 hover:shadow-md"
              >
                <div class="flex items-start justify-between mb-2">
                  <span
                    class="rounded bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-700"
                    >{{ order.location || order.title }}</span
                  >
                </div>
                <p class="mt-2 text-xs text-forena-500 line-clamp-2">
                  {{ order.instructionContent || '세부 지시 내용 없음' }}
                </p>
                <div class="mt-3 flex items-center gap-3 text-[11px] font-semibold text-forena-600">
                  <span class="flex items-center gap-1"
                    ><Users class="h-3.5 w-3.5" /> {{ order.workerCount || 0 }}명</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showEditor && editingReport"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeEditor"
      >
        <div
          class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
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
                <p class="text-base font-bold text-forena-900">
                  {{ isNewReport ? '공사일보 작성' : '공사일보 수정' }}
                </p>
                <p class="mt-0.5 text-xs text-forena-500">
                  <span class="font-bold text-forena-700">{{ editingReport.process }} 공종</span>
                  · {{ fmtKor(editingReport.date) }} · 작성자 {{ editingReport.author }}
                </p>
              </div>
            </div>
            <button @click="closeEditor" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div
            class="flex shrink-0 items-center gap-1 border-b border-forena-100 bg-forena-50/30 px-6"
          >
            <button
              class="border-b-2 px-3 py-2.5 text-xs font-bold transition"
              :class="
                modalTab === 'today'
                  ? 'border-flare-500 text-flare-700'
                  : 'border-transparent text-forena-500 hover:text-forena-700'
              "
              @click="modalTab = 'today'"
            >
              금일 공사 내용
            </button>
            <button
              class="border-b-2 px-3 py-2.5 text-xs font-bold transition"
              :class="
                modalTab === 'tomorrow'
                  ? 'border-flare-500 text-flare-700'
                  : 'border-transparent text-forena-500 hover:text-forena-700'
              "
              @click="modalTab = 'tomorrow'"
            >
              명일 작업 예정
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div v-if="modalTab === 'today'" class="space-y-4">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div class="sm:col-span-3">
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    ><MapPin class="mr-0.5 inline h-3 w-3" />작업 위치
                    <span class="text-rose-500">*</span></label
                  >
                  <input
                    v-model="editingReport.location"
                    class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                  />
                </div>
                <div>
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    ><Users class="mr-0.5 inline h-3 w-3" />금일 작업 인력 수</label
                  >
                  <input
                    type="number"
                    min="0"
                    v-model.number="editingReport.workers"
                    class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    >완료 / 미완료</label
                  >
                  <select
                    v-model="editingReport.completion"
                    class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                  >
                    <option>미완료</option>
                    <option>완료</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >금일 투입 장비 목록</label
                >
                <div class="flex gap-2">
                  <select
                    v-model="editingReport.equipmentInput.name"
                    class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">장비 선택</option>
                    <optgroup
                      v-for="(items, category) in equipmentList"
                      :key="category"
                      :label="category"
                    >
                      <option
                        v-for="equipment in items"
                        :key="`${category}_${equipment}`"
                        :value="equipment"
                      >
                        {{ equipment }}
                      </option>
                    </optgroup>
                  </select>
                  <input
                    type="number"
                    min="1"
                    v-model.number="editingReport.equipmentInput.count"
                    class="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm text-center tabular-nums"
                  />
                  <button
                    @click="addEquipment"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-xs font-bold text-flare-700 hover:bg-flare-100"
                  >
                    <Plus class="h-3 w-3" />추가
                  </button>
                </div>
                <div v-if="editingReport.equipmentList.length" class="mt-2 flex flex-wrap gap-1.5">
                  <span
                    v-for="(eq, i) in editingReport.equipmentList"
                    :key="i"
                    class="inline-flex items-center gap-1 rounded-md bg-forena-50 px-2 py-0.5 text-[11px] font-semibold text-forena-700"
                    >{{ eq
                    }}<button
                      @click="removeEquipment(i)"
                      class="text-slate-400 hover:text-rose-600"
                    >
                      <X class="h-3 w-3" /></button
                  ></span>
                </div>
              </div>

              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >금일 작업 완료 내용 <span class="text-rose-500">*</span></label
                >
                <textarea
                  v-model="editingReport.todayWork"
                  rows="4"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"
                ></textarea>
              </div>

              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >월간 세부계획 기간</label
                >
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="mb-0.5 block text-[10px] text-forena-400">시작일</label>
                    <input
                      type="date"
                      v-model="editingReport.startDate"
                      class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                    />
                  </div>
                  <div>
                    <label class="mb-0.5 block text-[10px] text-forena-400">종료일</label>
                    <input
                      type="date"
                      v-model="editingReport.endDate"
                      class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >이전 누적 진척률 (%)</label
                >
                <input
                  type="number"
                  min="0"
                  max="100"
                  v-model.number="editingReport.prevProgress"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400"
                />
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    >금일 진척률</label
                  >
                  <span class="text-xs font-bold tabular-nums text-flare-700"
                    >{{ editingReport.progress }}%</span
                  >
                </div>
                <div class="flex items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      v-model.number="editingReport.progress"
                      class="w-full accent-flare-500"
                    />
                    <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
                      <div
                        class="h-full rounded-full bg-flare-500 transition-all"
                        :style="{ width: editingReport.progress + '%' }"
                      ></div>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    v-model.number="editingReport.progress"
                    class="w-20 rounded-md border border-forena-200 bg-white px-2 py-1 text-xs tabular-nums outline-none focus:border-flare-400"
                  />
                </div>
                <p v-if="calcInfo" class="mt-1 text-[10px] text-forena-400">
                  금일 증가분:
                  <span class="font-semibold text-forena-700">{{ calcInfo.increment }}%</span> (기간
                  {{ calcInfo.duration }}일 · 일일 배분율 {{ calcInfo.dailyAllocation }}%)
                </p>
              </div>

              <div class="rounded-lg border border-flare-100 bg-flare-50/40 p-3">
                <div class="mb-2 flex items-center justify-between">
                  <label class="text-[10px] font-bold uppercase tracking-wide text-flare-600">
                    월간 세부계획 진척률
                    <span class="font-normal text-flare-400">(공기 비례 자동 계산)</span>
                  </label>
                  <span class="text-sm font-bold tabular-nums text-flare-700"
                    >{{ editingReport.processProgress }}%</span
                  >
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-flare-100">
                  <div
                    class="h-full rounded-full bg-flare-500 transition-all"
                    :style="{ width: editingReport.processProgress + '%' }"
                  ></div>
                </div>
                <p v-if="calcInfo" class="mt-1.5 text-[10px] text-forena-500">
                  <span class="block mb-0.5 text-forena-600">
                    <span class="font-bold">산식:</span> 하루 목표
                    <span class="font-bold">{{ calcInfo.dailyAllocation }}%</span> ÷ 금일 세부작업
                    <span class="font-bold">{{ calcInfo.tasksTodayCount }}건</span> = 건당 최대
                    <span class="font-bold">{{ calcInfo.weightPerTask }}%</span> 반영
                  </span>
                  이전 누적
                  <span class="font-bold text-forena-700">{{ editingReport.prevProgress }}%</span> +
                  금일 증가분
                  <span class="font-bold text-forena-700">{{ calcInfo.increment }}%</span> =
                  <span class="font-bold text-flare-700">{{ editingReport.processProgress }}%</span>
                </p>
                <p v-else class="mt-1.5 text-[10px] text-amber-600">
                  ⚠ 월간 세부계획 기간(시작일·종료일)을 입력하면 자동 계산됩니다.
                </p>
              </div>

              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >특이사항</label
                >
                <textarea
                  v-model="editingReport.notes"
                  rows="2"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"
                ></textarea>
              </div>

              <div class="mt-5 rounded-xl border border-forena-100 bg-forena-50/30 p-3.5">
                <div class="mb-2 flex items-center justify-between">
                  <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                    <ImageIcon class="h-3.5 w-3.5 text-flare-600" /> 현장 / 도면 사진 ({{
                      editingReport.photos.length
                    }})
                  </p>
                  <button
                    @click="pickPhotos"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100"
                  >
                    <Plus class="h-3 w-3" /> 사진 추가
                  </button>
                  <input
                    ref="photoInputRef"
                    type="file"
                    class="sr-only"
                    accept="image/*"
                    multiple
                    @change="onPhotoChange"
                  />
                </div>
                <div
                  v-if="editingReport.photos.length"
                  class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
                >
                  <div
                    v-for="(photo, i) in editingReport.photos"
                    :key="photo.id"
                    class="group relative aspect-square overflow-hidden rounded-lg border border-forena-200 bg-white"
                  >
                    <img
                      :src="photo.dataUrl"
                      :alt="photo.name"
                      class="h-full w-full object-cover"
                    />
                    <button
                      @click="removePhoto(i)"
                      class="absolute right-1 top-1 rounded-md bg-slate-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600"
                    >
                      <Trash2 class="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p v-else class="text-[11px] text-slate-400">첨부된 사진이 없습니다.</p>
              </div>

              <div class="mt-3 rounded-xl border border-forena-100 bg-forena-50/30 p-3.5">
                <div class="mb-2 flex items-center justify-between">
                  <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                    <Paperclip class="h-3.5 w-3.5 text-flare-600" /> 첨부 파일 ({{
                      editingReport.files.length
                    }})
                  </p>
                  <button
                    @click="pickFiles"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100"
                  >
                    <Plus class="h-3 w-3" /> 파일 추가
                  </button>
                  <input
                    ref="fileInputRef"
                    type="file"
                    class="sr-only"
                    accept=".pdf,.xls,.xlsx,.csv,image/*"
                    multiple
                    @change="onFileChangeInput"
                  />
                </div>
                <ul v-if="editingReport.files.length" class="space-y-1.5">
                  <li
                    v-for="(f, i) in editingReport.files"
                    :key="f.id"
                    class="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-forena-100"
                  >
                    <span
                      class="rounded-md bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700"
                      >{{ fileBadge(f.type) }}</span
                    >
                    <span class="flex-1 truncate text-xs text-forena-800">{{ f.name }}</span>
                    <button @click="removeFile(i)" class="text-slate-400 hover:text-rose-600">
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </li>
                </ul>
                <p v-else class="text-[11px] text-slate-400">첨부된 파일이 없습니다.</p>
              </div>
            </div>

            <div v-else-if="modalTab === 'tomorrow'" class="space-y-4 mt-2">
              <div class="rounded-xl border border-flare-200 bg-flare-50/40 p-4 mb-4">
                <label class="mb-1.5 block text-xs font-bold text-flare-800"
                  ><Sparkles class="inline h-3.5 w-3.5 text-flare-600" /> 대상 주간계획 선택</label
                >
                <select
                  v-model="editingReport.tomorrowWorkPlanId"
                  @change="onTomorrowPlanSelect"
                  class="w-full rounded-md border border-forena-200 bg-white px-3 py-2 text-sm font-semibold text-forena-800 outline-none focus:border-flare-400"
                >
                  <option :value="null">-- 내일 진행할 주간계획 일정을 선택하세요 --</option>
                  <option
                    v-for="plan in availableTomorrowPlans"
                    :key="plan.idx || plan.id"
                    :value="plan.idx || plan.id"
                  >
                    [{{ plan.location }}] {{ plan.name }}
                  </option>
                </select>
                <p class="mt-2 text-[11px] text-forena-600">
                  위에서 내일 일정을 선택하면 기존 데이터가 불려오며, 수정한 내용은 원본 주간계획에
                  덮어쓰기 됩니다.
                </p>
              </div>

              <div
                v-if="editingReport.tomorrowWorkPlanId"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <div class="sm:col-span-2">
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    ><MapPin class="mr-0.5 inline h-3 w-3" />작업 위치</label
                  >
                  <input
                    v-model="editingReport.tomorrowLocation"
                    class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                  />
                </div>

                <div>
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    ><Clock class="mr-0.5 inline h-3 w-3" />작업 시간</label
                  >
                  <input
                    value="07:00 ~ 17:00"
                    disabled
                    class="w-full rounded-md border border-forena-200 bg-slate-50 px-2.5 py-1.5 text-xs tabular-nums text-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    ><Users class="mr-0.5 inline h-3 w-3" />필요 인원</label
                  >
                  <input
                    type="number"
                    min="0"
                    v-model.number="editingReport.tomorrowWorkers"
                    class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    ><Wrench class="mr-0.5 inline h-3 w-3" />필요 장비</label
                  >
                  <div class="flex gap-2">
                    <select
                      v-model="editingReport.tomorrowEquipmentInput.name"
                      class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">장비 선택</option>
                      <optgroup
                        v-for="(items, category) in equipmentList"
                        :key="category"
                        :label="category"
                      >
                        <option
                          v-for="equipment in items"
                          :key="category + '_tom_' + equipment"
                          :value="equipment"
                        >
                          {{ equipment }}
                        </option>
                      </optgroup>
                    </select>
                    <input
                      type="number"
                      min="1"
                      v-model.number="editingReport.tomorrowEquipmentInput.count"
                      class="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm text-center tabular-nums"
                    />
                    <button
                      @click="addTomorrowEquipment"
                      class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-xs font-bold text-flare-700 hover:bg-flare-100"
                    >
                      <Plus class="h-3 w-3" />추가
                    </button>
                  </div>
                  <div
                    v-if="editingReport.tomorrowEquipmentList.length"
                    class="mt-2 flex flex-wrap gap-1.5"
                  >
                    <span
                      v-for="(eq, i) in editingReport.tomorrowEquipmentList"
                      :key="i"
                      class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200"
                      >{{ eq
                      }}<button
                        @click="removeTomorrowEquipment(i)"
                        class="text-slate-400 hover:text-rose-600"
                      >
                        <X class="h-3 w-3" /></button
                    ></span>
                  </div>
                </div>

                <div class="sm:col-span-2">
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    >작업 상세 내역 <span class="text-rose-500">*</span></label
                  >
                  <textarea
                    v-model="editingReport.tomorrowPlan"
                    rows="5"
                    class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"
                  ></textarea>
                </div>

                <div class="sm:col-span-2">
                  <label
                    class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    >안전 유의사항</label
                  >
                  <textarea
                    v-model="editingReport.tomorrowSafety"
                    rows="3"
                    placeholder="추락/낙하/화재 등 위험요인 사전 점검"
                    class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex shrink-0 items-center justify-between gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3"
          >
            <p class="text-[11px] text-forena-500">
              <span class="text-rose-500">*</span> 표시는 필수 입력 항목입니다.
            </p>
            <div class="flex gap-2">
              <button
                @click="closeEditor"
                class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50"
              >
                취소
              </button>
              <button
                @click="saveDraft"
                class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50"
              >
                <Save class="h-3.5 w-3.5" /> 임시 저장
              </button>
              <button
                @click="submitReport"
                class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600"
              >
                <Send class="h-3.5 w-3.5" /> 공사일보 제출
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="viewingReport"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeViewer"
      >
        <div
          class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div
            class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forena-50"
              >
                <FileText class="h-5 w-5 text-forena-700" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">
                  {{ viewingReport.process }} 공종 공사일보
                </p>
                <p class="mt-0.5 text-xs text-forena-500">
                  {{ fmtKor(viewingReport.date) }} · 작성자 {{ viewingReport.author }}
                  <span v-if="viewingReport.submittedAt">
                    · 제출 {{ viewingReport.submittedAt }}</span
                  >
                </p>
              </div>
            </div>
            <button @click="closeViewer" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p
                  class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400"
                >
                  <MapPin class="h-3 w-3" />작업 위치
                </p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ viewingReport.location }}</p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p
                  class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400"
                >
                  <Users class="h-3 w-3" />작업 인력
                </p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
                  {{ viewingReport.workers
                  }}<span class="text-sm font-normal text-slate-400 ml-1">명</span>
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <p
                  class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-forena-400"
                >
                  <Wrench class="h-3 w-3" />중장비
                </p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
                  {{ viewingReport.equipmentCount
                  }}<span class="text-sm font-normal text-slate-400 ml-1">대</span>
                </p>
                <div v-if="viewingReport.equipmentList.length" class="mt-1.5 flex flex-wrap gap-1">
                  <span
                    v-for="(eq, i) in viewingReport.equipmentList"
                    :key="i"
                    class="inline-flex items-center rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-semibold text-forena-700"
                  >
                    {{ eq }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-xl border border-forena-100 p-3.5">
                <div class="mb-1 flex items-center justify-between">
                  <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                    금일 진척률
                  </p>
                  <span class="text-xs font-bold tabular-nums text-flare-700"
                    >{{ viewingReport.progress }}%</span
                  >
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-forena-100">
                  <div
                    class="h-full rounded-full bg-flare-500"
                    :style="{ width: viewingReport.progress + '%' }"
                  ></div>
                </div>
              </div>
              <div class="rounded-xl border border-forena-100 p-3.5">
                <div class="mb-1 flex items-center justify-between">
                  <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                    월간 세부계획 진척률
                  </p>
                  <span class="text-xs font-bold tabular-nums text-flare-700"
                    >{{ viewingReport.processProgress }}%</span
                  >
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-forena-100">
                  <div
                    class="h-full rounded-full bg-flare-500"
                    :style="{ width: viewingReport.processProgress + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-forena-100 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  금일 작업 완료
                </p>
                <p class="mt-1 text-xs leading-relaxed text-forena-800">
                  {{ viewingReport.todayWork }}
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 p-3.5">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  명일 작업 예정
                </p>
                <p class="mt-1 text-xs leading-relaxed text-forena-800">
                  {{ viewingReport.tomorrowPlan }}
                </p>
              </div>
            </div>

            <div
              v-if="viewingReport.notes"
              class="mt-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5"
            >
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-700">특이사항</p>
              <p class="mt-1 text-xs leading-relaxed text-amber-900">{{ viewingReport.notes }}</p>
            </div>

            <div
              v-if="viewingReport.photos?.length"
              class="mt-3 rounded-xl border border-forena-100 px-4 py-3"
            >
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">현장 사진</p>
              <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                <div
                  v-for="photo in viewingReport.photos"
                  :key="photo.id"
                  class="aspect-square overflow-hidden rounded-lg border border-forena-200 bg-white"
                >
                  <img :src="photo.dataUrl" :alt="photo.name" class="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <div
              v-if="viewingReport.files?.length"
              class="mt-3 rounded-xl border border-forena-100 px-4 py-3"
            >
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">관련 문서</p>
              <ul class="mt-1.5 space-y-1">
                <li
                  v-for="f in viewingReport.files"
                  :key="f.id"
                  class="flex items-center gap-2 text-xs text-forena-800"
                >
                  <FileText class="h-3.5 w-3.5 text-forena-400" />
                  <span class="flex-1 truncate">{{ f.name }}</span>
                  <span class="text-[10px] text-forena-400 tabular-nums">{{
                    fmtSize(f.size)
                  }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div
            v-if="currentRole === ROLES.MANAGER"
            class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3"
          >
            <button
              @click="rejectReport"
              class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
            >
              <AlertTriangle class="h-3.5 w-3.5" /> 반려
            </button>
            <button
              @click="approveReport"
              class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600"
            >
              <CheckCircle2 class="h-3.5 w-3.5" /> 승인
            </button>
            <button
              @click="closeViewer"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
