<script setup>
import { ref, computed } from 'vue'
import {
  ClipboardList, CalendarClock, CalendarDays, Users, Wrench, MapPin, AlertTriangle,
  CheckCircle2, Cloud, Upload, FileText, BrainCircuit, Pencil, X, Eye, Download,
  RefreshCw, Plus, Search, Filter, ChevronRight, ChevronDown, ShieldCheck,
  ClipboardCheck, ArrowRight, Trash2, Copy, FilePlus2, Truck, Target, Flag,
  ListChecks, Megaphone, BookOpen,
} from 'lucide-vue-next'

// ======================================================
// MOCK DATA — 자체 완결
// ======================================================

// 권한
const ROLES = ['현장 총책임자', '공정 책임자', '본사 관리자', '일반 사용자']
const currentRole = ref('현장 총책임자')
const canConfirm = computed(() => currentRole.value === '현장 총책임자')
const canEdit = computed(() => ['현장 총책임자', '공정 책임자'].includes(currentRole.value))

// 날짜
const todayDate = ref(new Date().toISOString().slice(0, 10))
const tomorrowDate = computed(() => {
  const d = new Date(todayDate.value); d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})
const yesterdayDate = computed(() => {
  const d = new Date(todayDate.value); d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
})

// 금일 작업 지시
const todayInstructions = ref([
  {
    id: 'WI-T-001', name: 'B1층 슬라브 형틀 조립', trade: '형틀',
    location: 'B1층 전체', workHours: '07:00 ~ 17:00',
    requiredCount: 6, assignedCount: 5, shortage: 1,
    requiredEquip: ['타워크레인 1대'], equipStatus: '입차 완료',
    responsible: '오반장', weatherRisk: true,
    caution: '고소 작업 시 안전벨트 착용 필수. 크레인 신호수 배치 확인. 오후 돌풍 예보로 14시 이후 양중 작업 중단 검토.',
    status: '확정', tbmStatus: '완료', tbmAt: '07:15', tbmBy: '안전관리자',
    relatedPlanId: 'P-1', relatedDocs: ['4월5주_작업계획서.pdf', '슬라브_형틀_시공계획.pdf'],
    memo: '',
  },
  {
    id: 'WI-T-002', name: 'B2층 전기 배관 설치', trade: '전기',
    location: 'B2층 전기실', workHours: '08:00 ~ 17:00',
    requiredCount: 3, assignedCount: 3, shortage: 0,
    requiredEquip: [], equipStatus: '확인 전',
    responsible: '정대리', weatherRisk: false,
    caution: '활선 주의. 접지 확인 후 작업 시작. 절연 장갑 필수.',
    status: '확정', tbmStatus: '완료', tbmAt: '07:20', tbmBy: '안전관리자',
    relatedPlanId: 'P-2', relatedDocs: ['4월5주_작업계획서.pdf'],
    memo: '',
  },
  {
    id: 'WI-T-003', name: '지하주차장 방수 1구간', trade: '방수',
    location: 'B3층 주차구역 A', workHours: '07:30 ~ 16:30',
    requiredCount: 4, assignedCount: 4, shortage: 0,
    requiredEquip: [], equipStatus: '확인 전',
    responsible: '한현장', weatherRisk: false,
    caution: '방수재 취급 시 환기 유지. 유증기 주의. 화기 금지.',
    status: '검토 중', tbmStatus: '진행 중', tbmAt: '', tbmBy: '안전관리자',
    relatedPlanId: 'P-3', relatedDocs: ['4월5주_작업계획서.pdf'],
    memo: '방수재 입고 지연으로 09시 이후 시작 가능',
  },
  {
    id: 'WI-T-004', name: '1층 외벽 거푸집 설치', trade: '형틀',
    location: '1층 외벽', workHours: '07:00 ~ 17:00',
    requiredCount: 8, assignedCount: 5, shortage: 3,
    requiredEquip: ['고소작업차 1대'], equipStatus: '지연',
    responsible: '오반장', weatherRisk: true,
    caution: '고소 작업. 외벽 작업 시 안전대 착용 필수. 풍속 10m/s 이상 시 작업 중단.',
    status: '초안', tbmStatus: '미실시', tbmAt: '', tbmBy: '',
    relatedPlanId: 'P-4', relatedDocs: ['외벽_거푸집_시공계획.pdf'],
    memo: '인력 3명 부족 — 인력 배치 페이지 확인 필요',
  },
  {
    id: 'WI-T-005', name: '급배수 수직 배관 (B1~1F)', trade: '설비',
    location: 'PS 구역', workHours: '08:00 ~ 17:00',
    requiredCount: 3, assignedCount: 3, shortage: 0,
    requiredEquip: [], equipStatus: '확인 전',
    responsible: '서기술', weatherRisk: false,
    caution: '용접 작업 시 화재 감시인 배치. 소화기 비치 확인.',
    status: '작업 진행 중', tbmStatus: '완료', tbmAt: '07:25', tbmBy: '안전관리자',
    relatedPlanId: 'P-5', relatedDocs: ['설비배관_시공계획.xlsx'],
    memo: '',
  },
])

// 명일 작업 예정
const tomorrowInstructions = ref([
  {
    id: 'WI-N-001', name: 'B1층 슬라브 형틀 조립 (계속)', trade: '형틀',
    location: 'B1층 전체', requiredCount: 6, assignedCount: 6,
    requiredEquip: ['타워크레인 1대'], expectedHours: '07:00 ~ 17:00',
    fromYesterdayUnfinished: true,
    caution: '오늘 미완료분 약 30% 잔여. 오전 완료 목표.',
    status: '확정',
  },
  {
    id: 'WI-N-002', name: '철근 조립 — 1층 기둥', trade: '철근',
    location: '1층 기둥', requiredCount: 4, assignedCount: 4,
    requiredEquip: [], expectedHours: '07:00 ~ 17:00',
    fromYesterdayUnfinished: false,
    caution: '철근 인양 시 신호수 배치 필수.',
    status: '초안',
  },
  {
    id: 'WI-N-003', name: '지하주차장 방수 2구간', trade: '방수',
    location: 'B3층 주차구역 B', requiredCount: 4, assignedCount: 2,
    requiredEquip: [], expectedHours: '07:30 ~ 16:30',
    fromYesterdayUnfinished: false,
    caution: '방수재 추가 입고 확인 필요.',
    status: '확인 필요',
  },
])

// TBM 체크리스트 항목 (모든 작업 공통)
const TBM_TEMPLATE = [
  '금일 작업 내용 공유',
  '작업 위치 및 동선 확인',
  '투입 인원 확인',
  '사용 장비 확인',
  '장비 반경 및 위험구역 확인',
  '자재 양중 위험 확인',
  '기상 위험 확인',
  '작업자 전달 완료',
  '비상 연락 체계 확인',
  'TBM 완료',
]

// 작업별 TBM 체크 상태 (작업 id -> { items: [bool], riskMemo, completedAt })
const tbmChecklists = ref({
  'WI-T-001': { items: [true,true,true,true,true,true,true,true,true,true], riskMemo: '오후 강풍 주의 — 14시 이후 양중 중단 검토', completedAt: '07:15', completedBy: '안전관리자' },
  'WI-T-002': { items: [true,true,true,true,true,true,true,true,true,true], riskMemo: '활선 주의', completedAt: '07:20', completedBy: '안전관리자' },
  'WI-T-003': { items: [true,true,true,true,true,false,false,false,false,false], riskMemo: '방수재 입고 지연으로 진행 중', completedAt: '', completedBy: '' },
  'WI-T-004': { items: [false,false,false,false,false,false,false,false,false,false], riskMemo: '', completedAt: '', completedBy: '' },
  'WI-T-005': { items: [true,true,true,true,true,true,true,true,true,true], riskMemo: '용접 화재 감시 강화', completedAt: '07:25', completedBy: '안전관리자' },
})

// 업로드된 작업지시서 + AI 분석 결과
const uploadedDocs = ref([
  { id: 1, name: '4월29일_작업지시서_초안.pdf', date: '2026-04-29', type: '작업지시서',
    target: '당일', uploadedAt: '2026-04-28 17:42', uploadedBy: '관리자', aiAnalyzed: true, status: '검토 중',
    desc: '명일 작업 지시 초안 — 형틀/전기/방수 3건' },
  { id: 2, name: '주간_작업계획서_v2.xlsx', date: '2026-04-27', type: '주간계획',
    target: '당일', uploadedAt: '2026-04-25 14:30', uploadedBy: '관리자', aiAnalyzed: true, status: '반영 완료',
    desc: '4월 5주차 작업 계획' },
])

// AI 분석 결과 (업로드 후 추출된 작업 항목들)
const aiExtractedTasks = ref([
  { id: 1, sourceDocId: 1, checked: false,
    workDate: '2026-04-29', name: 'B1층 슬라브 형틀 조립', trade: '형틀', location: 'B1층 전체',
    requiredCount: 6, assignedCount: 5, requiredEquip: '타워크레인 1대', workHours: '07:00 ~ 17:00',
    caution: '고소 작업 시 안전벨트 착용 필수', responsible: '오반장',
    riskFactors: ['고소 작업', '양중 작업'], tbmRequired: true,
    confidence: 92, reviewStatus: '미검토' },
  { id: 2, sourceDocId: 1, checked: false,
    workDate: '2026-04-29', name: '철근 조립 — 1층 기둥', trade: '철근', location: '1층 기둥',
    requiredCount: 4, assignedCount: 4, requiredEquip: '-', workHours: '07:00 ~ 17:00',
    caution: '철근 인양 시 신호수 배치', responsible: '오반장',
    riskFactors: ['양중 작업'], tbmRequired: true,
    confidence: 88, reviewStatus: '미검토' },
  { id: 3, sourceDocId: 1, checked: false,
    workDate: '2026-04-29', name: '지하주차장 방수 2구간', trade: '방수', location: 'B3층 주차구역 B',
    requiredCount: 4, assignedCount: 2, requiredEquip: '-', workHours: '07:30 ~ 16:30',
    caution: '방수재 취급 시 환기 유지', responsible: '한현장',
    riskFactors: ['유증기', '화기 금지'], tbmRequired: true,
    confidence: 76, reviewStatus: '미검토' },
])

// ======================================================
// UI 상태
// ======================================================
const activeTab = ref('today') // today | tomorrow | tbm | upload
const selectedTodayId = ref('WI-T-001')
const selectedTomorrowId = ref(null)
const selectedTbmId = ref('WI-T-003')

const filterTrade = ref('')
const filterStatus = ref('')
const filterTbm = ref('')
const filterShortage = ref(false)
const filterEquipNeeded = ref(false)
const filterWeatherRisk = ref(false)
const searchKey = ref('')

const aiAnalyzing = ref(false)
const uploadForm = ref({ workDate: '', docType: '작업지시서', target: '명일', desc: '', fileName: '' })

// 모달
const detailEditOpen = ref(false)
const editForm = ref(null)

// ======================================================
// 헬퍼
// ======================================================
const TRADES = ['형틀','전기','방수','골조','설비','철근']

const statusClass = (s) => ({
  '작성 전':       'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  '초안':          'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  '검토 중':       'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  '확정':          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  '작업 진행 중':  'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  '완료':          'bg-flare-50 text-flare-700 ring-1 ring-flare-200',
  '취소':          'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  '확인 필요':     'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  '변경 필요':     'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}[s] ?? 'bg-slate-100 text-slate-500')

const equipStatusClass = (s) => ({
  '확인 전':   'bg-slate-100 text-slate-500',
  '입차 예정': 'bg-sky-50 text-sky-700',
  '입차 완료': 'bg-emerald-50 text-emerald-700',
  '지연':      'bg-rose-50 text-rose-700',
  '사용 불가': 'bg-rose-100 text-rose-800',
}[s] ?? 'bg-slate-100')

const tbmStatusClass = (s) => ({
  '미실시':  'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  '진행 중': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  '완료':    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  '보류':    'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
}[s] ?? 'bg-slate-100')

const reviewStatusClass = (s) => ({
  '미검토':   'bg-slate-100 text-slate-500',
  '검토 중':  'bg-sky-50 text-sky-700',
  '승인':     'bg-emerald-50 text-emerald-700',
  '수정 요청':'bg-amber-50 text-amber-800',
  '제외':     'bg-rose-50 text-rose-700',
}[s] ?? 'bg-slate-100')

const confidenceClass = (n) =>
  n >= 90 ? 'text-emerald-600' : n >= 80 ? 'text-forena-600' : 'text-amber-600'

// 필터된 금일 작업
const filteredToday = computed(() => {
  let r = todayInstructions.value
  if (filterTrade.value)   r = r.filter(t => t.trade === filterTrade.value)
  if (filterStatus.value)  r = r.filter(t => t.status === filterStatus.value)
  if (filterTbm.value)     r = r.filter(t => t.tbmStatus === filterTbm.value)
  if (filterShortage.value)     r = r.filter(t => t.shortage > 0)
  if (filterEquipNeeded.value)  r = r.filter(t => t.requiredEquip.length && t.equipStatus !== '입차 완료')
  if (filterWeatherRisk.value)  r = r.filter(t => t.weatherRisk)
  if (searchKey.value.trim()) {
    const k = searchKey.value.trim().toLowerCase()
    r = r.filter(t =>
      t.name.toLowerCase().includes(k) ||
      t.trade.toLowerCase().includes(k) ||
      t.location.toLowerCase().includes(k) ||
      (t.responsible || '').toLowerCase().includes(k))
  }
  return r
})

// 선택된 작업
const selectedToday = computed(() => todayInstructions.value.find(t => t.id === selectedTodayId.value) ?? null)
const selectedTomorrow = computed(() => tomorrowInstructions.value.find(t => t.id === selectedTomorrowId.value) ?? null)
const selectedTbm = computed(() => todayInstructions.value.find(t => t.id === selectedTbmId.value) ?? null)
const selectedTbmCheck = computed(() => selectedTbmId.value ? tbmChecklists.value[selectedTbmId.value] : null)

// 요약 KPI
const kpi = computed(() => ({
  todayCount:     todayInstructions.value.length,
  tomorrowCount:  tomorrowInstructions.value.length,
  unconfirmed:    todayInstructions.value.filter(t => !['확정','작업 진행 중','완료'].includes(t.status)).length,
  shortage:       todayInstructions.value.filter(t => t.shortage > 0).length,
  equipNeeded:    todayInstructions.value.filter(t => t.requiredEquip.length && t.equipStatus !== '입차 완료').length,
  tbmIncomplete:  todayInstructions.value.filter(t => t.tbmStatus !== '완료').length,
  weatherWarn:    todayInstructions.value.filter(t => t.weatherRisk).length,
}))

// TBM 진척률
const tbmProgress = (id) => {
  const c = tbmChecklists.value[id]
  if (!c) return 0
  const done = c.items.filter(Boolean).length
  return Math.round((done / TBM_TEMPLATE.length) * 100)
}

// ======================================================
// 액션 — 모두 mock
// ======================================================
function notify(msg) { /* 데모 — alert 대신 콘솔 로그 + 알림 */ alert(msg) }

// 금일 — 작업지시서 확정
function confirmToday(task) {
  if (!canConfirm.value) { notify('당일 작업지시서 확정 권한이 없습니다.'); return }
  task.status = '확정'
  notify(`"${task.name}" 작업지시서가 확정되었습니다.`)
}
function confirmAllToday() {
  if (!canConfirm.value) { notify('확정 권한이 없습니다.'); return }
  todayInstructions.value.forEach(t => {
    if (['초안','검토 중','작성 전'].includes(t.status)) t.status = '확정'
  })
  notify('전체 작업지시서가 확정되었습니다.')
}
// 작업 완료 처리
function completeTask(task) {
  task.status = '완료'
  notify(`"${task.name}" 완료 처리되었습니다.`)
}
// 공사일보 작성으로 이동
function goToDailyReport(task) {
  notify(`공사일보 작성 화면으로 이동 — ${task ? task.name : ''} (데모)`)
  // router.push({ name: 'daily-report', query: { taskId: task.id } })
}
// 인력 배치로 이동
function goToManpower(task) {
  notify(`인력 배치 페이지로 이동 — 부족 ${task.shortage}명 (데모)`)
}
// 장비 입출차 확인
function goToEquipment(task) {
  notify(`장비 입출차 화면으로 이동 — ${task.requiredEquip.join(', ')} (데모)`)
}
// TBM 시작
function startTbm(task) {
  if (!tbmChecklists.value[task.id]) {
    tbmChecklists.value[task.id] = { items: Array(TBM_TEMPLATE.length).fill(false), riskMemo: '', completedAt: '', completedBy: '' }
  }
  task.tbmStatus = '진행 중'
  selectedTbmId.value = task.id
  activeTab.value = 'tbm'
}
// TBM 항목 토글
function toggleTbmItem(id, idx) {
  const c = tbmChecklists.value[id]
  if (!c) return
  c.items[idx] = !c.items[idx]
  // 마지막(완료) 체크 자동 처리
  const allDone = c.items.slice(0, -1).every(Boolean)
  if (allDone) c.items[c.items.length - 1] = true
  // 작업의 tbmStatus 업데이트
  const t = todayInstructions.value.find(t => t.id === id)
  if (t) {
    if (c.items.every(Boolean)) t.tbmStatus = '완료'
    else if (c.items.some(Boolean)) t.tbmStatus = '진행 중'
    else t.tbmStatus = '미실시'
  }
}
// TBM 완료 처리
function completeTbm(id) {
  const c = tbmChecklists.value[id]
  const t = todayInstructions.value.find(t => t.id === id)
  if (!c || !t) return
  c.items = Array(TBM_TEMPLATE.length).fill(true)
  c.completedAt = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  c.completedBy = '안전관리자'
  t.tbmStatus = '완료'
  t.tbmAt = c.completedAt
  t.tbmBy = c.completedBy
  notify(`"${t.name}" TBM 완료 처리되었습니다. (${c.completedAt})`)
}
function holdTbm(id) {
  const t = todayInstructions.value.find(t => t.id === id)
  if (t) t.tbmStatus = '보류'
}

// 명일 — 데이터 불러오기
function loadFromWeekly() {
  // 주간 작업계획에서 미반영분을 추가
  const newOnes = [
    { id: `WI-N-${Date.now()}-1`, name: '2층 거푸집 설치', trade: '형틀',
      location: '2층 전체', requiredCount: 6, assignedCount: 4,
      requiredEquip: ['타워크레인 1대'], expectedHours: '07:00 ~ 17:00',
      fromYesterdayUnfinished: false, caution: '주간 계획서 기반 자동 생성',
      status: '초안' },
    { id: `WI-N-${Date.now()}-2`, name: '2층 철근 조립', trade: '철근',
      location: '2층 기둥/보', requiredCount: 5, assignedCount: 3,
      requiredEquip: ['타워크레인 1대'], expectedHours: '07:00 ~ 17:00',
      fromYesterdayUnfinished: false, caution: '주간 계획서 기반 자동 생성',
      status: '확인 필요' },
  ]
  tomorrowInstructions.value.push(...newOnes)
  notify(`주간 작업계획에서 ${newOnes.length}건을 불러왔습니다.`)
}
function loadYesterday() {
  // 전날 지시서에서 미완료 작업만 가져오기
  const carryOver = todayInstructions.value
    .filter(t => t.status !== '완료')
    .map(t => ({
      id: `WI-N-${Date.now()}-${t.id}`,
      name: `${t.name} (계속)`,
      trade: t.trade, location: t.location,
      requiredCount: t.requiredCount, assignedCount: t.assignedCount,
      requiredEquip: t.requiredEquip.slice(),
      expectedHours: t.workHours, fromYesterdayUnfinished: true,
      caution: `전날 미완료 작업 — ${t.caution}`,
      status: '확인 필요',
    }))
  tomorrowInstructions.value.push(...carryOver)
  notify(`전날 미완료 ${carryOver.length}건을 명일 지시서에 추가했습니다.`)
}
function saveTomorrow() { notify('명일 작업지시서가 임시 저장되었습니다.') }
function confirmTomorrow() {
  if (!canConfirm.value) { notify('확정 권한이 없습니다.'); return }
  tomorrowInstructions.value.forEach(t => t.status = '확정')
  notify('명일 작업지시서가 확정되었습니다.')
}
function removeTomorrowItem(id) {
  tomorrowInstructions.value = tomorrowInstructions.value.filter(t => t.id !== id)
}

// 업로드 / AI 분석
function onUpload(e) {
  const f = e.target.files?.[0]
  if (f) uploadForm.value.fileName = f.name
  e.target.value = ''
}
function runAi() {
  if (!uploadForm.value.fileName) { notify('파일을 먼저 업로드하세요.'); return }
  aiAnalyzing.value = true
  setTimeout(() => {
    aiAnalyzing.value = false
    uploadedDocs.value.unshift({
      id: Date.now(), name: uploadForm.value.fileName,
      date: uploadForm.value.workDate || todayDate.value,
      type: uploadForm.value.docType, target: uploadForm.value.target,
      uploadedAt: new Date().toLocaleString('ko-KR'), uploadedBy: '관리자',
      aiAnalyzed: true, status: '검토 중', desc: uploadForm.value.desc,
    })
    // mock 추출 결과 추가
    aiExtractedTasks.value.unshift({
      id: Date.now(), sourceDocId: uploadedDocs.value[0].id, checked: false,
      workDate: uploadForm.value.workDate || tomorrowDate.value,
      name: '신규 추출 — 골조 콘크리트 양생', trade: '골조', location: '2층 슬라브',
      requiredCount: 4, assignedCount: 3, requiredEquip: '-', workHours: '07:00 ~ 16:00',
      caution: '양생 기간 7일 이상 확보', responsible: '오반장',
      riskFactors: ['양생 관리'], tbmRequired: true,
      confidence: 84, reviewStatus: '미검토',
    })
    uploadForm.value = { workDate: '', docType: '작업지시서', target: '명일', desc: '', fileName: '' }
    notify('AI 분석이 완료되었습니다. 추출된 항목을 검토하세요.')
  }, 1400)
}
function reanalyze(doc) { notify(`"${doc.name}" 재분석 시작 (데모)`) }
function viewDoc(doc) { notify(`원본 문서 보기: ${doc.name} (데모)`) }
// 검토 액션
function approveExtracted(t) { t.reviewStatus = '승인' }
function excludeExtracted(t) { t.reviewStatus = '제외' }
function reflectToToday(t) {
  if (t.reviewStatus !== '승인') { notify('승인 상태인 항목만 반영할 수 있습니다.'); return }
  todayInstructions.value.push({
    id: `WI-T-${Date.now()}`, name: t.name, trade: t.trade,
    location: t.location, workHours: t.workHours,
    requiredCount: t.requiredCount, assignedCount: t.assignedCount,
    shortage: Math.max(0, t.requiredCount - t.assignedCount),
    requiredEquip: t.requiredEquip === '-' ? [] : [t.requiredEquip],
    equipStatus: '확인 전', responsible: t.responsible, weatherRisk: false,
    caution: t.caution, status: '초안', tbmStatus: '미실시',
    tbmAt: '', tbmBy: '', relatedPlanId: '', relatedDocs: [], memo: '',
  })
  notify(`"${t.name}" 당일 작업지시서에 반영되었습니다.`)
}
function reflectToTomorrow(t) {
  if (t.reviewStatus !== '승인') { notify('승인 상태인 항목만 반영할 수 있습니다.'); return }
  tomorrowInstructions.value.push({
    id: `WI-N-${Date.now()}`, name: t.name, trade: t.trade,
    location: t.location, requiredCount: t.requiredCount,
    assignedCount: t.assignedCount,
    requiredEquip: t.requiredEquip === '-' ? [] : [t.requiredEquip],
    expectedHours: t.workHours, fromYesterdayUnfinished: false,
    caution: t.caution, status: '초안',
  })
  notify(`"${t.name}" 명일 작업지시서에 반영되었습니다.`)
}

// 상세 패널 편집
function openEdit(task) {
  if (!canEdit.value) { notify('수정 권한이 없습니다.'); return }
  editForm.value = JSON.parse(JSON.stringify(task))
  detailEditOpen.value = true
}
function saveEdit() {
  if (!editForm.value) return
  const list = activeTab.value === 'tomorrow' ? tomorrowInstructions.value : todayInstructions.value
  const idx = list.findIndex(t => t.id === editForm.value.id)
  if (idx !== -1) {
    Object.assign(list[idx], editForm.value)
    if (list[idx].requiredCount && list[idx].assignedCount !== undefined) {
      list[idx].shortage = Math.max(0, list[idx].requiredCount - list[idx].assignedCount)
    }
  }
  detailEditOpen.value = false
  editForm.value = null
}
</script>

<template>
  <div class="flex flex-col gap-5 pb-8">
    <!-- ============================================================ -->
    <!-- 상단                                                            -->
    <!-- ============================================================ -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">작업 지시</h1>
        <p class="mt-1 text-xs text-forena-500">작업 계획 → <strong class="text-forena-700">작업 지시 / TBM</strong> → 작업 수행 → 공사일보 → 공정 분석</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- 권한 데모 셀렉터 -->
        <div class="flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-2.5 py-1.5">
          <Users class="h-3.5 w-3.5 text-forena-400" />
          <select v-model="currentRole" class="bg-transparent text-xs font-bold text-forena-700 outline-none">
            <option v-for="r in ROLES" :key="r">{{ r }}</option>
          </select>
        </div>

        <!-- 날짜 선택 -->
        <div class="flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-2.5 py-1.5">
          <CalendarClock class="h-3.5 w-3.5 text-forena-400" />
          <input v-model="todayDate" type="date" class="bg-transparent text-xs font-bold text-forena-800 outline-none" />
        </div>

        <button @click="loadFromWeekly"
          class="inline-flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50">
          <CalendarDays class="h-3.5 w-3.5 text-forena-400" /> 주간 계획 불러오기
        </button>
        <button @click="loadYesterday"
          class="inline-flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50">
          <Copy class="h-3.5 w-3.5 text-forena-400" /> 전날 지시서 불러오기
        </button>
        <button @click="activeTab = 'upload'"
          class="inline-flex items-center gap-1.5 rounded-xl border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 hover:bg-flare-100">
          <Upload class="h-3.5 w-3.5 text-flare-600" /> 작업지시서 업로드
        </button>
        <button :disabled="!canConfirm" @click="confirmAllToday"
          class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-bold text-white shadow-md disabled:opacity-50">
          <ShieldCheck class="h-3.5 w-3.5" /> 당일 지시서 확정
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 요약 KPI                                                       -->
    <!-- ============================================================ -->
    <div class="grid gap-3 grid-cols-2 sm:grid-cols-4">
      <div class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">오늘 작업</p>
          <ClipboardList class="h-4 w-4 text-flare-600" />
        </div>
        <p class="mt-2 text-3xl font-bold tabular-nums text-forena-900">{{ kpi.todayCount }}<span class="text-sm font-normal text-slate-400 ml-1">건</span></p>
        <p class="mt-0.5 text-[10px] text-forena-400">미확정 {{ kpi.unconfirmed }}건</p>
      </div>
      <div class="rounded-2xl border p-4 shadow-card"
        :class="kpi.shortage ? 'border-rose-200 bg-rose-50/30' : 'border-forena-100/90 bg-white/95'">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">인력 부족</p>
          <Users class="h-4 w-4" :class="kpi.shortage ? 'text-rose-500' : 'text-forena-400'" />
        </div>
        <p class="mt-2 text-3xl font-bold tabular-nums" :class="kpi.shortage ? 'text-rose-700' : 'text-forena-900'">
          {{ kpi.shortage }}<span class="text-sm font-normal text-slate-400 ml-1">건</span>
        </p>
        <p class="mt-0.5 text-[10px] text-forena-400">배치 미완 작업</p>
      </div>
      <div class="rounded-2xl border p-4 shadow-card"
        :class="kpi.equipNeeded ? 'border-amber-200 bg-amber-50/30' : 'border-forena-100/90 bg-white/95'">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">장비 확인 필요</p>
          <Truck class="h-4 w-4" :class="kpi.equipNeeded ? 'text-amber-500' : 'text-forena-400'" />
        </div>
        <p class="mt-2 text-3xl font-bold tabular-nums" :class="kpi.equipNeeded ? 'text-amber-700' : 'text-forena-900'">
          {{ kpi.equipNeeded }}<span class="text-sm font-normal text-slate-400 ml-1">건</span>
        </p>
        <p class="mt-0.5 text-[10px] text-forena-400">입차 대기 / 지연</p>
      </div>
      <div class="rounded-2xl border p-4 shadow-card"
        :class="kpi.tbmIncomplete ? 'border-rose-200 bg-rose-50/30' : 'border-forena-100/90 bg-white/95'">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">TBM 미완료</p>
          <ShieldCheck class="h-4 w-4" :class="kpi.tbmIncomplete ? 'text-rose-500' : 'text-emerald-500'" />
        </div>
        <p class="mt-2 text-3xl font-bold tabular-nums" :class="kpi.tbmIncomplete ? 'text-rose-700' : 'text-emerald-600'">
          {{ kpi.tbmIncomplete }}<span class="text-sm font-normal text-slate-400 ml-1">건</span>
        </p>
        <p class="mt-0.5 text-[10px] text-forena-400">미실시 / 진행 중</p>
      </div>
    </div>

    <!-- 기상 경고 (있을 때만) -->
    <div v-if="kpi.weatherWarn"
      class="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 shadow-card">
      <Cloud class="h-4 w-4 shrink-0 text-amber-600" />
      <p class="text-xs font-semibold text-amber-800">
        오늘 기상 위험 작업 <strong>{{ kpi.weatherWarn }}건</strong> — 오후 돌풍 예보 (순간 풍속 12m/s). 고소·양중 작업 시간 단축 권고.
      </p>
    </div>

    <!-- ============================================================ -->
    <!-- 탭                                                            -->
    <!-- ============================================================ -->
    <div class="flex items-center gap-1 rounded-xl border border-forena-200 bg-white p-1 shadow-card w-fit">
      <button v-for="tab in [
        ['today',    '금일 작업 지시', 'CalendarClock'],
        ['tomorrow', '명일 작업 예정', 'CalendarDays'],
        ['tbm',      'TBM 확인',       'ShieldCheck'],
        ['upload',   '작업지시서 업로드', 'Upload']
      ]" :key="tab[0]"
        class="rounded-lg px-3.5 py-1.5 text-xs font-bold transition"
        :class="activeTab === tab[0]
          ? 'bg-gradient-to-r from-forena-700 to-forena-900 text-white shadow-sm'
          : 'text-forena-600 hover:bg-forena-50'"
        @click="activeTab = tab[0]">
        {{ tab[1] }}
        <span v-if="tab[0] === 'today' && kpi.unconfirmed" class="ml-1 rounded-full bg-rose-500/20 px-1.5 text-[10px] tabular-nums" :class="activeTab === 'today' ? 'text-white' : 'text-rose-700 bg-rose-100'">{{ kpi.unconfirmed }}</span>
        <span v-if="tab[0] === 'tbm' && kpi.tbmIncomplete" class="ml-1 rounded-full bg-rose-500/20 px-1.5 text-[10px] tabular-nums" :class="activeTab === 'tbm' ? 'text-white' : 'text-rose-700 bg-rose-100'">{{ kpi.tbmIncomplete }}</span>
      </button>
    </div>

    <!-- ============================================================ -->
    <!-- 1) 금일 작업 지시 탭                                            -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'today'" class="grid gap-4 lg:grid-cols-12">
      <!-- 좌: 작업 목록 -->
      <div class="lg:col-span-7 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 px-5 py-3">
          <div class="flex items-center gap-2">
            <ClipboardList class="h-4 w-4 text-flare-600" />
            <h2 class="text-sm font-bold text-forena-900">{{ todayDate }} 금일 작업 ({{ filteredToday.length }})</h2>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative">
              <Search class="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-forena-400" />
              <input v-model="searchKey" type="text" placeholder="작업/공종/위치/담당자"
                class="w-44 rounded-xl border border-forena-200 bg-white pl-7 pr-2 py-1.5 text-xs outline-none focus:border-flare-400" />
            </div>
            <select v-model="filterTrade" class="rounded-xl border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none">
              <option value="">전체 공종</option>
              <option v-for="t in TRADES" :key="t">{{ t }}</option>
            </select>
            <select v-model="filterStatus" class="rounded-xl border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none">
              <option value="">전체 상태</option>
              <option>초안</option><option>검토 중</option><option>확정</option>
              <option>작업 진행 중</option><option>완료</option><option>취소</option>
            </select>
            <select v-model="filterTbm" class="rounded-xl border border-forena-200 bg-white px-2 py-1.5 text-xs outline-none">
              <option value="">전체 TBM</option>
              <option>미실시</option><option>진행 중</option><option>완료</option><option>보류</option>
            </select>
          </div>
        </div>

        <!-- 토글 필터 -->
        <div class="flex flex-wrap items-center gap-2 border-b border-forena-100 bg-forena-50/40 px-5 py-2">
          <button @click="filterShortage = !filterShortage"
            class="rounded-lg border px-2 py-1 text-[10px] font-bold"
            :class="filterShortage ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'">
            인력 부족만
          </button>
          <button @click="filterEquipNeeded = !filterEquipNeeded"
            class="rounded-lg border px-2 py-1 text-[10px] font-bold"
            :class="filterEquipNeeded ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'">
            장비 확인 필요
          </button>
          <button @click="filterWeatherRisk = !filterWeatherRisk"
            class="rounded-lg border px-2 py-1 text-[10px] font-bold"
            :class="filterWeatherRisk ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'">
            기상 위험만
          </button>
        </div>

        <!-- 작업 카드 리스트 -->
        <div class="divide-y divide-forena-50">
          <div v-for="t in filteredToday" :key="t.id"
            class="cursor-pointer p-4 transition hover:bg-forena-50/40"
            :class="selectedTodayId === t.id ? 'bg-flare-50/50 border-l-2 border-l-flare-500' : ''"
            @click="selectedTodayId = t.id">
            <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <p class="text-sm font-bold text-forena-900">{{ t.name }}</p>
                  <span class="rounded bg-forena-100 px-1.5 py-0.5 text-[9px] font-bold text-forena-600">{{ t.trade }}</span>
                  <span v-if="t.weatherRisk"
                    class="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
                    <Cloud class="h-2.5 w-2.5" />기상
                  </span>
                </div>
                <p class="mt-0.5 text-[11px] text-forena-500 flex items-center gap-1">
                  <MapPin class="h-3 w-3" />{{ t.location }} · {{ t.workHours }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="statusClass(t.status)">{{ t.status }}</span>
                <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="tbmStatusClass(t.tbmStatus)">TBM {{ t.tbmStatus }}</span>
              </div>
            </div>

            <!-- 인원/장비 상태 -->
            <div class="grid grid-cols-3 gap-2 text-[11px]">
              <div class="rounded-lg bg-forena-50/40 px-2 py-1.5">
                <p class="text-[9px] font-bold text-forena-400">인원</p>
                <div class="flex items-baseline gap-1">
                  <span class="font-bold tabular-nums text-forena-800">{{ t.assignedCount }}/{{ t.requiredCount }}</span>
                  <span v-if="t.shortage > 0" class="text-[10px] font-bold text-rose-600">−{{ t.shortage }}</span>
                </div>
              </div>
              <div class="rounded-lg bg-forena-50/40 px-2 py-1.5">
                <p class="text-[9px] font-bold text-forena-400">장비</p>
                <div class="flex items-center gap-1">
                  <span v-if="!t.requiredEquip.length" class="text-slate-400">없음</span>
                  <span v-else class="rounded px-1 py-0.5 text-[9px] font-bold" :class="equipStatusClass(t.equipStatus)">{{ t.equipStatus }}</span>
                </div>
              </div>
              <div class="rounded-lg bg-forena-50/40 px-2 py-1.5">
                <p class="text-[9px] font-bold text-forena-400">담당</p>
                <p class="font-bold text-forena-800">{{ t.responsible }}</p>
              </div>
            </div>

            <p v-if="t.caution" class="mt-2 line-clamp-1 rounded-lg bg-amber-50/40 px-2 py-1 text-[10px] text-amber-800 ring-1 ring-amber-100">
              ⚠ {{ t.caution }}
            </p>
          </div>
          <div v-if="!filteredToday.length" class="py-12 text-center text-sm text-slate-400">
            조회된 작업이 없습니다.
          </div>
        </div>
      </div>

      <!-- 우: 상세 패널 -->
      <div class="lg:col-span-5 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
          <h2 class="text-sm font-bold text-forena-900">작업 상세</h2>
          <div v-if="selectedToday" class="flex items-center gap-1">
            <button v-if="canEdit" @click="openEdit(selectedToday)" title="수정"
              class="rounded-lg p-1.5 text-forena-500 hover:bg-forena-100">
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div v-if="!selectedToday" class="flex h-80 items-center justify-center text-sm text-slate-400">
          왼쪽 목록에서 작업을 선택하세요
        </div>

        <div v-else class="space-y-4 p-5">
          <!-- 헤더 -->
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <p class="text-base font-bold text-forena-900">{{ selectedToday.name }}</p>
              <span class="rounded bg-forena-100 px-1.5 py-0.5 text-[9px] font-bold text-forena-600">{{ selectedToday.trade }}</span>
            </div>
            <p class="mt-0.5 text-xs text-forena-500">{{ selectedToday.id }}</p>
          </div>

          <!-- 상태 뱃지 -->
          <div class="flex flex-wrap gap-1.5">
            <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="statusClass(selectedToday.status)">{{ selectedToday.status }}</span>
            <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="tbmStatusClass(selectedToday.tbmStatus)">TBM {{ selectedToday.tbmStatus }}</span>
            <span v-if="selectedToday.weatherRisk"
              class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
              <Cloud class="h-3 w-3" />기상 위험
            </span>
          </div>

          <!-- 정보 그리드 -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg bg-forena-50/40 p-2.5">
              <p class="text-[10px] font-bold text-forena-400">작업 위치</p>
              <p class="mt-0.5 font-semibold text-forena-800 flex items-center gap-1"><MapPin class="h-3 w-3" />{{ selectedToday.location }}</p>
            </div>
            <div class="rounded-lg bg-forena-50/40 p-2.5">
              <p class="text-[10px] font-bold text-forena-400">작업 시간</p>
              <p class="mt-0.5 font-semibold tabular-nums text-forena-800">{{ selectedToday.workHours }}</p>
            </div>
            <div class="rounded-lg bg-forena-50/40 p-2.5">
              <p class="text-[10px] font-bold text-forena-400">필요 인원</p>
              <p class="mt-0.5 font-bold tabular-nums text-forena-800">{{ selectedToday.requiredCount }}명</p>
            </div>
            <div class="rounded-lg p-2.5"
              :class="selectedToday.shortage ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-forena-50/40'">
              <p class="text-[10px] font-bold" :class="selectedToday.shortage ? 'text-rose-600' : 'text-forena-400'">배치 / 부족</p>
              <p class="mt-0.5 font-bold tabular-nums" :class="selectedToday.shortage ? 'text-rose-700' : 'text-forena-800'">
                {{ selectedToday.assignedCount }}명 <span class="text-[10px]" v-if="selectedToday.shortage">(−{{ selectedToday.shortage }})</span>
              </p>
            </div>
          </div>

          <!-- 장비 -->
          <div class="rounded-lg border border-forena-100 p-3">
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-[10px] font-bold uppercase text-forena-400">필요 장비</p>
              <span v-if="selectedToday.requiredEquip.length" class="rounded px-1.5 py-0.5 text-[9px] font-bold" :class="equipStatusClass(selectedToday.equipStatus)">{{ selectedToday.equipStatus }}</span>
            </div>
            <div v-if="selectedToday.requiredEquip.length" class="flex flex-wrap gap-1">
              <span v-for="(eq, i) in selectedToday.requiredEquip" :key="i"
                class="inline-flex items-center gap-1 rounded-md bg-white border border-forena-100 px-2 py-1 text-[11px] font-semibold text-forena-700">
                <Wrench class="h-3 w-3" />{{ eq }}
              </span>
            </div>
            <p v-else class="text-xs text-slate-400">해당 없음</p>
          </div>

          <!-- 주의사항 -->
          <div v-if="selectedToday.caution" class="rounded-lg bg-amber-50/40 p-3 ring-1 ring-amber-100">
            <p class="text-[10px] font-bold uppercase text-amber-700 mb-1">주의사항</p>
            <p class="text-xs leading-relaxed text-amber-900">{{ selectedToday.caution }}</p>
          </div>

          <!-- 담당자 / TBM -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg border border-forena-100 p-2.5">
              <p class="text-[10px] font-bold text-forena-400">담당자</p>
              <p class="mt-0.5 font-bold text-forena-800">{{ selectedToday.responsible }}</p>
            </div>
            <div class="rounded-lg border border-forena-100 p-2.5">
              <p class="text-[10px] font-bold text-forena-400">TBM</p>
              <p class="mt-0.5 font-bold text-forena-800">
                {{ selectedToday.tbmAt || '-' }}
                <span v-if="selectedToday.tbmBy" class="text-[10px] font-normal text-slate-400">/ {{ selectedToday.tbmBy }}</span>
              </p>
            </div>
          </div>

          <!-- 관련 문서 -->
          <div v-if="selectedToday.relatedDocs?.length" class="rounded-lg border border-flare-100 bg-flare-50/30 p-3">
            <p class="text-[10px] font-bold uppercase text-flare-700 mb-1.5">관련 문서</p>
            <ul class="space-y-1">
              <li v-for="(d, i) in selectedToday.relatedDocs" :key="i"
                class="flex items-center justify-between gap-2 text-xs">
                <span class="flex items-center gap-1.5 truncate text-forena-800">
                  <FileText class="h-3 w-3 shrink-0 text-flare-600" />{{ d }}
                </span>
                <button class="shrink-0 rounded p-1 text-forena-500 hover:bg-white">
                  <Eye class="h-3 w-3" />
                </button>
              </li>
            </ul>
          </div>

          <!-- 메모 -->
          <div v-if="selectedToday.memo"
            class="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-700">
            <strong class="block text-[10px] uppercase text-slate-500 mb-1">메모</strong>
            {{ selectedToday.memo }}
          </div>

          <!-- 액션 버튼 영역 -->
          <div class="space-y-2 border-t border-forena-100 pt-3">
            <div v-if="canConfirm && selectedToday.status !== '완료'" class="grid grid-cols-2 gap-2">
              <button v-if="selectedToday.status !== '확정' && selectedToday.status !== '작업 진행 중'"
                @click="confirmToday(selectedToday)"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-2 text-xs font-bold text-white shadow-md">
                <ShieldCheck class="h-3.5 w-3.5" /> 작업지시서 확정
              </button>
              <button v-if="selectedToday.tbmStatus !== '완료'"
                @click="startTbm(selectedToday)"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-flare-300 bg-flare-50 px-3 py-2 text-xs font-bold text-flare-700 hover:bg-flare-100">
                <ClipboardCheck class="h-3.5 w-3.5" /> TBM 체크 시작
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button v-if="selectedToday.shortage > 0" @click="goToManpower(selectedToday)"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
                <Users class="h-3.5 w-3.5" /> 인력 배치로
              </button>
              <button v-if="selectedToday.requiredEquip.length" @click="goToEquipment(selectedToday)"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">
                <Truck class="h-3.5 w-3.5" /> 장비 입출차
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button v-if="canEdit && selectedToday.status === '작업 진행 중'" @click="completeTask(selectedToday)"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                <CheckCircle2 class="h-3.5 w-3.5" /> 작업 완료
              </button>
              <button @click="goToDailyReport(selectedToday)"
                class="col-span-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-flare-600 px-3 py-2 text-xs font-bold text-white hover:bg-flare-700">
                <BookOpen class="h-3.5 w-3.5" /> 공사일보 작성으로 이동
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 2) 명일 작업 예정 탭                                            -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'tomorrow'" class="space-y-4">
      <!-- 액션 -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forena-100/90 bg-white/95 px-5 py-3 shadow-card">
        <div class="flex items-center gap-2">
          <CalendarDays class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">{{ tomorrowDate }} 명일 작업지시서 초안</h2>
          <span class="rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-600">{{ tomorrowInstructions.length }}건</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button @click="loadFromWeekly"
            class="inline-flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50">
            <CalendarDays class="h-3.5 w-3.5 text-forena-400" /> 주간 계획 불러오기
          </button>
          <button @click="loadYesterday"
            class="inline-flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50">
            <Copy class="h-3.5 w-3.5 text-forena-400" /> 전날 미완료 작업 포함
          </button>
          <button @click="saveTomorrow"
            class="inline-flex items-center gap-1.5 rounded-xl border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 hover:bg-flare-100">
            저장
          </button>
          <button :disabled="!canConfirm" @click="confirmTomorrow"
            class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-bold text-white shadow-md disabled:opacity-50">
            <ShieldCheck class="h-3.5 w-3.5" /> 명일 지시서 확정
          </button>
        </div>
      </div>

      <!-- 명일 작업 목록 + 상세 -->
      <div class="grid gap-4 lg:grid-cols-12">
        <div class="lg:col-span-7 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
          <table class="w-full text-xs">
            <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
              <tr>
                <th class="px-3 py-2 text-left">작업명</th>
                <th class="px-3 py-2 text-left">공종</th>
                <th class="px-3 py-2 text-left">위치</th>
                <th class="px-3 py-2 text-right">인원</th>
                <th class="px-3 py-2 text-left">장비</th>
                <th class="px-3 py-2 text-center">상태</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-forena-50">
              <tr v-for="t in tomorrowInstructions" :key="t.id"
                class="cursor-pointer hover:bg-forena-50/40"
                :class="selectedTomorrowId === t.id ? 'bg-flare-50/40' : ''"
                @click="selectedTomorrowId = t.id">
                <td class="px-3 py-2.5">
                  <div class="flex items-center gap-1.5">
                    <p class="font-bold text-forena-900">{{ t.name }}</p>
                    <span v-if="t.fromYesterdayUnfinished"
                      class="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
                      전날 미완료
                    </span>
                  </div>
                  <p class="mt-0.5 truncate text-[10px] text-slate-500">{{ t.expectedHours }}</p>
                </td>
                <td class="px-3 py-2.5 text-forena-600">{{ t.trade }}</td>
                <td class="px-3 py-2.5 text-slate-500">{{ t.location }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums">
                  <span class="font-bold text-forena-800">{{ t.assignedCount }}/{{ t.requiredCount }}</span>
                </td>
                <td class="px-3 py-2.5 text-[10px] text-slate-500">
                  <span v-if="t.requiredEquip.length">{{ t.requiredEquip.join(', ') }}</span>
                  <span v-else class="text-slate-300">없음</span>
                </td>
                <td class="px-3 py-2.5 text-center">
                  <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="statusClass(t.status)">{{ t.status }}</span>
                </td>
                <td class="px-3 py-2.5 text-right" @click.stop>
                  <button v-if="canEdit" @click="openEdit(t)" title="수정"
                    class="rounded p-1 text-forena-500 hover:bg-forena-100">
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                  <button v-if="canEdit" @click="removeTomorrowItem(t.id)" title="삭제"
                    class="rounded p-1 text-rose-500 hover:bg-rose-50">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
              <tr v-if="!tomorrowInstructions.length">
                <td colspan="7" class="px-3 py-12 text-center text-sm text-slate-400">
                  명일 작업이 없습니다. <strong>주간 계획 불러오기</strong> 또는 <strong>전날 지시서 불러오기</strong>를 사용하세요.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 명일 상세 -->
        <div class="lg:col-span-5 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
          <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
            <h2 class="text-sm font-bold text-forena-900">명일 작업 상세</h2>
          </div>
          <div v-if="!selectedTomorrow" class="flex h-72 items-center justify-center text-sm text-slate-400">
            왼쪽 목록에서 작업을 선택하세요
          </div>
          <div v-else class="space-y-3 p-5 text-xs">
            <div>
              <p class="text-base font-bold text-forena-900">{{ selectedTomorrow.name }}</p>
              <p class="text-forena-500">{{ selectedTomorrow.trade }} · {{ selectedTomorrow.location }}</p>
            </div>
            <div v-if="selectedTomorrow.fromYesterdayUnfinished"
              class="rounded-lg bg-amber-50/40 p-2.5 text-[11px] text-amber-800 ring-1 ring-amber-100">
              <strong>전날 미완료 작업입니다.</strong> 전날 진척률과 미완료 사유를 확인하세요.
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-lg bg-forena-50/40 p-2.5">
                <p class="text-[10px] font-bold text-forena-400">예상 시간</p>
                <p class="mt-0.5 font-bold tabular-nums">{{ selectedTomorrow.expectedHours }}</p>
              </div>
              <div class="rounded-lg bg-forena-50/40 p-2.5">
                <p class="text-[10px] font-bold text-forena-400">인원</p>
                <p class="mt-0.5 font-bold tabular-nums">{{ selectedTomorrow.assignedCount }}/{{ selectedTomorrow.requiredCount }}명</p>
              </div>
            </div>
            <div v-if="selectedTomorrow.requiredEquip.length" class="rounded-lg border border-forena-100 p-3">
              <p class="text-[10px] font-bold uppercase text-forena-400 mb-1">필요 장비</p>
              <div class="flex flex-wrap gap-1">
                <span v-for="(eq, i) in selectedTomorrow.requiredEquip" :key="i"
                  class="rounded-md bg-white border border-forena-100 px-2 py-0.5 text-[10px] font-semibold text-forena-700">
                  {{ eq }}
                </span>
              </div>
            </div>
            <div v-if="selectedTomorrow.caution" class="rounded-lg bg-amber-50/40 p-2.5 ring-1 ring-amber-100">
              <p class="text-[10px] font-bold uppercase text-amber-700 mb-1">주의사항</p>
              <p class="text-amber-900">{{ selectedTomorrow.caution }}</p>
            </div>
            <button v-if="canEdit" @click="openEdit(selectedTomorrow)"
              class="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-forena-200 bg-white py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">
              <Pencil class="h-3.5 w-3.5" /> 수정
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 3) TBM 확인 탭                                                -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'tbm'" class="grid gap-4 lg:grid-cols-12">
      <!-- 좌: 작업별 TBM 상태 카드 -->
      <div class="lg:col-span-5 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex items-center justify-between border-b border-forena-100 px-5 py-3">
          <div class="flex items-center gap-2">
            <ShieldCheck class="h-4 w-4 text-flare-600" />
            <h2 class="text-sm font-bold text-forena-900">금일 TBM 현황</h2>
          </div>
          <span class="text-[10px] text-forena-400">미완료 {{ kpi.tbmIncomplete }} / 전체 {{ kpi.todayCount }}</span>
        </div>
        <div class="divide-y divide-forena-50 max-h-[640px] overflow-y-auto">
          <div v-for="t in todayInstructions" :key="t.id"
            class="cursor-pointer p-4 transition hover:bg-forena-50/40"
            :class="[
              selectedTbmId === t.id ? 'bg-flare-50/50 border-l-2 border-l-flare-500' : '',
              t.tbmStatus === '미실시' ? 'border-l-2 border-l-rose-400' : ''
            ]"
            @click="selectedTbmId = t.id">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="min-w-0">
                <p class="text-sm font-bold text-forena-900">{{ t.name }}</p>
                <p class="text-[11px] text-forena-500">{{ t.trade }} · {{ t.responsible }}</p>
              </div>
              <span class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="tbmStatusClass(t.tbmStatus)">{{ t.tbmStatus }}</span>
            </div>

            <!-- 진척 바 -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[10px] tabular-nums text-forena-500">
                <span>{{ tbmProgress(t.id) }}% ({{ tbmChecklists[t.id]?.items.filter(Boolean).length ?? 0 }}/{{ TBM_TEMPLATE.length }})</span>
                <span v-if="t.tbmAt">{{ t.tbmAt }} · {{ t.tbmBy }}</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-forena-100">
                <div class="h-full rounded-full transition-all"
                  :class="t.tbmStatus === '완료' ? 'bg-emerald-500'
                        : t.tbmStatus === '진행 중' ? 'bg-amber-500'
                        : 'bg-rose-400'"
                  :style="{ width: tbmProgress(t.id) + '%' }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 우: 체크리스트 -->
      <div class="lg:col-span-7 overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div v-if="!selectedTbm" class="flex h-96 items-center justify-center text-sm text-slate-400">
          왼쪽에서 작업을 선택하면 TBM 체크리스트가 표시됩니다
        </div>
        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 px-5 py-3">
            <div class="min-w-0">
              <h2 class="text-sm font-bold text-forena-900">{{ selectedTbm.name }} — TBM 체크리스트</h2>
              <p class="text-[11px] text-forena-500">{{ selectedTbm.trade }} · {{ selectedTbm.location }} · 담당 {{ selectedTbm.responsible }}</p>
            </div>
            <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="tbmStatusClass(selectedTbm.tbmStatus)">{{ selectedTbm.tbmStatus }}</span>
          </div>

          <div class="space-y-4 p-5">
            <!-- 작업 요약 -->
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="rounded-lg bg-forena-50/40 p-2.5">
                <p class="text-[10px] font-bold text-forena-400">작업 시간</p>
                <p class="mt-0.5 font-bold tabular-nums">{{ selectedTbm.workHours }}</p>
              </div>
              <div class="rounded-lg bg-forena-50/40 p-2.5">
                <p class="text-[10px] font-bold text-forena-400">투입 인원</p>
                <p class="mt-0.5 font-bold tabular-nums">{{ selectedTbm.assignedCount }}/{{ selectedTbm.requiredCount }}명</p>
              </div>
              <div class="rounded-lg p-2.5"
                :class="selectedTbm.weatherRisk ? 'bg-amber-50 ring-1 ring-amber-100' : 'bg-forena-50/40'">
                <p class="text-[10px] font-bold" :class="selectedTbm.weatherRisk ? 'text-amber-700' : 'text-forena-400'">기상</p>
                <p class="mt-0.5 font-bold" :class="selectedTbm.weatherRisk ? 'text-amber-700' : 'text-emerald-600'">
                  {{ selectedTbm.weatherRisk ? '주의' : '양호' }}
                </p>
              </div>
            </div>

            <!-- 체크리스트 -->
            <div class="rounded-xl border border-forena-100 bg-forena-50/30 p-4">
              <div class="flex items-center gap-2 mb-3">
                <ListChecks class="h-4 w-4 text-flare-600" />
                <p class="text-xs font-bold text-forena-700">TBM 체크 항목 ({{ TBM_TEMPLATE.length }})</p>
              </div>
              <ul class="space-y-1.5">
                <li v-for="(item, idx) in TBM_TEMPLATE" :key="idx"
                  class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition"
                  :class="selectedTbmCheck?.items[idx]
                    ? 'bg-emerald-50/60 text-emerald-800'
                    : 'bg-white text-forena-700 hover:bg-forena-50'"
                  @click="canEdit && toggleTbmItem(selectedTbm.id, idx)">
                  <input type="checkbox" :checked="selectedTbmCheck?.items[idx]" :disabled="!canEdit"
                    class="h-4 w-4 cursor-pointer rounded border-forena-300 text-emerald-600 focus:ring-emerald-400" />
                  <span class="text-[10px] tabular-nums font-bold text-forena-400 w-6">{{ String(idx + 1).padStart(2, '0') }}</span>
                  <span class="flex-1 font-semibold">{{ item }}</span>
                  <CheckCircle2 v-if="selectedTbmCheck?.items[idx]" class="h-3.5 w-3.5 text-emerald-600" />
                </li>
              </ul>
            </div>

            <!-- 위험요소 메모 -->
            <div>
              <label class="text-[10px] font-bold uppercase text-forena-400">위험요소 메모</label>
              <textarea v-model="tbmChecklists[selectedTbm.id].riskMemo"
                rows="2" :disabled="!canEdit"
                placeholder="TBM 중 식별된 위험요소를 기록하세요"
                class="mt-1 w-full rounded-xl border border-forena-200 bg-white px-3 py-2 text-xs outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-200/50 disabled:bg-slate-50">
              </textarea>
            </div>

            <!-- 완료 정보 -->
            <div v-if="selectedTbmCheck?.completedAt"
              class="flex items-center gap-2 rounded-xl bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-100">
              <CheckCircle2 class="h-4 w-4 text-emerald-600" />
              <span>TBM 완료 — <strong>{{ selectedTbmCheck.completedAt }}</strong> · 담당 {{ selectedTbmCheck.completedBy }}</span>
            </div>

            <!-- 액션 -->
            <div v-if="canEdit" class="grid grid-cols-3 gap-2 border-t border-forena-100 pt-3">
              <button @click="holdTbm(selectedTbm.id)"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">
                보류
              </button>
              <button @click="completeTbm(selectedTbm.id)"
                :disabled="selectedTbm.tbmStatus === '완료'"
                class="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50">
                <CheckCircle2 class="h-3.5 w-3.5" /> TBM 완료 처리
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 4) 작업지시서 업로드 탭                                         -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'upload'" class="space-y-4">
      <!-- 업로드 폼 + 문서 이력 -->
      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex items-center gap-2 border-b border-forena-100 px-5 py-3">
          <Upload class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">작업지시서 업로드 + AI 분석</h2>
          <span class="ml-1 text-[11px] text-forena-400">기존 작업지시서를 파일로 업로드하면 AI가 작업 항목을 추출합니다.</span>
        </div>

        <div class="grid gap-4 p-5 lg:grid-cols-12">
          <div class="lg:col-span-5 space-y-3">
            <div class="rounded-xl border-2 border-dashed border-forena-200 bg-forena-50/40 p-5 text-center">
              <Upload class="mx-auto h-8 w-8 text-forena-300" />
              <p class="mt-2 text-sm font-semibold text-forena-700">파일을 끌어 놓거나 클릭하여 업로드</p>
              <p class="mt-0.5 text-[10px] text-forena-400">Excel · PDF · Image · Word · HWP</p>
              <label class="mt-3 inline-block cursor-pointer rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                파일 선택
                <input type="file" class="sr-only"
                  accept=".xlsx,.xls,.pdf,.png,.jpg,.jpeg,.doc,.docx,.hwp"
                  @change="onUpload" />
              </label>
              <p v-if="uploadForm.fileName" class="mt-2 text-xs font-bold text-flare-700">📎 {{ uploadForm.fileName }}</p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] font-bold uppercase text-forena-400">작업일자</label>
                <input v-model="uploadForm.workDate" type="date"
                  class="mt-1 w-full rounded-xl border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
              </div>
              <div>
                <label class="text-[10px] font-bold uppercase text-forena-400">반영 대상</label>
                <select v-model="uploadForm.target"
                  class="mt-1 w-full rounded-xl border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400">
                  <option>당일</option>
                  <option>명일</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold uppercase text-forena-400">문서 유형</label>
                <select v-model="uploadForm.docType"
                  class="mt-1 w-full rounded-xl border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400">
                  <option>작업지시서</option>
                  <option>주간계획</option>
                  <option>TBM 자료</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold uppercase text-forena-400">설명</label>
                <input v-model="uploadForm.desc" type="text" placeholder="문서 설명 (선택)"
                  class="mt-1 w-full rounded-xl border border-forena-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-flare-400" />
              </div>
            </div>

            <button @click="runAi" :disabled="aiAnalyzing"
              class="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-flare-500 to-flare-700 px-3 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60">
              <BrainCircuit class="h-3.5 w-3.5" />
              {{ aiAnalyzing ? 'AI 분석 중…' : 'AI 분석 실행' }}
            </button>
          </div>

          <!-- 문서 이력 -->
          <div class="lg:col-span-7">
            <p class="mb-2 text-[11px] font-bold text-forena-500">업로드 문서 ({{ uploadedDocs.length }})</p>
            <div class="overflow-hidden rounded-xl border border-forena-100">
              <table class="w-full text-xs">
                <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
                  <tr>
                    <th class="px-3 py-2 text-left">문서명 / 일자</th>
                    <th class="px-3 py-2 text-left">유형</th>
                    <th class="px-3 py-2 text-center">대상</th>
                    <th class="px-3 py-2 text-left">상태</th>
                    <th class="px-3 py-2 text-right">액션</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-forena-50">
                  <tr v-for="d in uploadedDocs" :key="d.id" class="hover:bg-forena-50/40">
                    <td class="px-3 py-2">
                      <p class="font-semibold text-forena-800">{{ d.name }}</p>
                      <p class="text-[10px] tabular-nums text-slate-400">{{ d.date }} · {{ d.uploadedAt }}</p>
                    </td>
                    <td class="px-3 py-2 text-forena-600">{{ d.type }}</td>
                    <td class="px-3 py-2 text-center">
                      <span class="rounded bg-forena-100 px-1.5 py-0.5 text-[9px] font-bold text-forena-700">{{ d.target }}</span>
                    </td>
                    <td class="px-3 py-2">
                      <span class="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        :class="d.status === '반영 완료' ? 'bg-emerald-50 text-emerald-700'
                              : d.status === '검토 중' ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-500'">
                        {{ d.status }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button @click="viewDoc(d)" title="원본 보기"
                          class="rounded p-1 text-forena-500 hover:bg-forena-100"><Eye class="h-3.5 w-3.5" /></button>
                        <button @click="reanalyze(d)" title="재분석"
                          class="rounded p-1 text-flare-600 hover:bg-flare-50"><RefreshCw class="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 분석 결과 검토 테이블 -->
      <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 px-5 py-3">
          <div class="flex items-center gap-2">
            <BrainCircuit class="h-4 w-4 text-flare-600" />
            <h2 class="text-sm font-bold text-forena-900">AI 분석 결과 — 검토 후 반영</h2>
            <span class="rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-600">{{ aiExtractedTasks.length }}건</span>
          </div>
          <p class="text-[11px] text-forena-400">관리자 승인 후 당일/명일 작업지시서에 반영됩니다.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[1100px] text-xs">
            <thead class="bg-forena-50/60 text-[10px] font-bold uppercase text-forena-500">
              <tr>
                <th class="px-3 py-2 text-left">작업일자</th>
                <th class="px-3 py-2 text-left">작업명</th>
                <th class="px-3 py-2 text-left">공종</th>
                <th class="px-3 py-2 text-left">위치</th>
                <th class="px-3 py-2 text-right">인원</th>
                <th class="px-3 py-2 text-left">장비</th>
                <th class="px-3 py-2 text-left">담당자</th>
                <th class="px-3 py-2 text-left">위험요소</th>
                <th class="px-3 py-2 text-right">신뢰도</th>
                <th class="px-3 py-2 text-center">검토</th>
                <th class="px-3 py-2 text-center">반영</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-forena-50">
              <tr v-for="t in aiExtractedTasks" :key="t.id" class="hover:bg-forena-50/40">
                <td class="px-3 py-2 tabular-nums text-slate-600">{{ t.workDate }}</td>
                <td class="px-3 py-2">
                  <p class="font-bold text-forena-900">{{ t.name }}</p>
                  <p v-if="t.tbmRequired" class="mt-0.5 inline-flex items-center gap-0.5 rounded bg-flare-50 px-1 py-0.5 text-[9px] font-bold text-flare-700">
                    <ShieldCheck class="h-2.5 w-2.5" />TBM 필요
                  </p>
                </td>
                <td class="px-3 py-2 text-forena-600">{{ t.trade }}</td>
                <td class="px-3 py-2 text-slate-500">{{ t.location }}</td>
                <td class="px-3 py-2 text-right tabular-nums font-bold">{{ t.assignedCount }}/{{ t.requiredCount }}</td>
                <td class="px-3 py-2 text-[10px] text-slate-500">{{ t.requiredEquip }}</td>
                <td class="px-3 py-2 text-slate-600">{{ t.responsible }}</td>
                <td class="px-3 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="(r, i) in t.riskFactors" :key="i"
                      class="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-100">
                      {{ r }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2 text-right tabular-nums font-bold" :class="confidenceClass(t.confidence)">{{ t.confidence }}%</td>
                <td class="px-3 py-2 text-center">
                  <select v-model="t.reviewStatus"
                    class="rounded border border-forena-200 bg-white px-1 py-0.5 text-[10px] font-bold outline-none">
                    <option>미검토</option><option>검토 중</option>
                    <option>승인</option><option>수정 요청</option><option>제외</option>
                  </select>
                </td>
                <td class="px-3 py-2 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button @click="reflectToToday(t)" :disabled="t.reviewStatus !== '승인'"
                      title="당일 반영"
                      class="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40">
                      당일
                    </button>
                    <button @click="reflectToTomorrow(t)" :disabled="t.reviewStatus !== '승인'"
                      title="명일 반영"
                      class="rounded border border-flare-200 bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700 hover:bg-flare-100 disabled:opacity-40">
                      명일
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!aiExtractedTasks.length">
                <td colspan="11" class="px-3 py-12 text-center text-sm text-slate-400">
                  AI 분석 결과가 없습니다. 파일 업로드 후 분석을 실행하세요.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 모달: 작업 수정                                                -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <div v-if="detailEditOpen && editForm"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-forena-900/40 p-4 backdrop-blur-sm sm:items-center"
        @click.self="detailEditOpen = false">
        <div class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-forena-100 bg-white shadow-2xl">
          <div class="sticky top-0 z-10 flex items-center justify-between border-b border-forena-100 bg-white px-5 py-4">
            <h3 class="text-lg font-bold text-forena-900">작업 수정 — {{ editForm.name }}</h3>
            <button class="rounded-lg p-2 text-slate-500 hover:bg-forena-50 hover:text-forena-900"
              @click="detailEditOpen = false">
              <X class="h-5 w-5" />
            </button>
          </div>
          <div class="space-y-3 p-5">
            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">작업명</span>
              <input v-model="editForm.name" type="text"
                class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" />
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="block space-y-1">
                <span class="text-xs font-bold text-forena-600">공종</span>
                <input v-model="editForm.trade" type="text" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" />
              </label>
              <label class="block space-y-1">
                <span class="text-xs font-bold text-forena-600">작업 위치</span>
                <input v-model="editForm.location" type="text" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" />
              </label>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="block space-y-1">
                <span class="text-xs font-bold text-forena-600">필요 인원</span>
                <input v-model.number="editForm.requiredCount" type="number" min="0" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" />
              </label>
              <label class="block space-y-1">
                <span class="text-xs font-bold text-forena-600">배치 인원</span>
                <input v-model.number="editForm.assignedCount" type="number" min="0" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" />
              </label>
            </div>
            <label v-if="editForm.workHours !== undefined" class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">작업 시간</span>
              <input v-model="editForm.workHours" type="text" placeholder="예: 07:00 ~ 17:00"
                class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" />
            </label>
            <label v-if="editForm.responsible !== undefined" class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">담당자</span>
              <input v-model="editForm.responsible" type="text" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" />
            </label>
            <label class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">주의사항</span>
              <textarea v-model="editForm.caution" rows="3"
                class="w-full resize-y rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50">
              </textarea>
            </label>
            <label v-if="editForm.memo !== undefined" class="block space-y-1">
              <span class="text-xs font-bold text-forena-600">메모</span>
              <textarea v-model="editForm.memo" rows="2"
                class="w-full resize-y rounded-xl border border-forena-200 px-3 py-2 text-sm focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50">
              </textarea>
            </label>
          </div>
          <div class="flex justify-end gap-2 border-t border-forena-100 px-5 py-4">
            <button @click="detailEditOpen = false"
              class="rounded-xl border border-forena-200 px-4 py-2.5 text-sm font-bold text-forena-700 hover:bg-forena-50">
              취소
            </button>
            <button @click="saveEdit"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-5 py-2.5 text-sm font-bold text-white shadow-md">
              저장
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>