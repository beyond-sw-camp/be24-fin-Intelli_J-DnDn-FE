<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  CalendarDays, ChevronLeft, ChevronRight, FileText, Plus, Save, Send, Eye,
  Pencil, Users, Wrench, MapPin, ClipboardList, CheckCircle2, AlertTriangle,
  Clock, ShieldCheck, UserCog, Trash2, X, Layers, Sparkles, RefreshCw,
  Truck, DoorOpen, Image as ImageIcon, Paperclip, Search, Filter,
  ArrowRightLeft, Download
} from 'lucide-vue-next'

// =========================================================
// 권한 / 사용자 (데모용 토글)
// =========================================================
const ROLES = {
  MANAGER: 'site_manager',
  WORKER:  'process_owner',
}
const currentRole = ref(ROLES.WORKER)
const ALL_PROCESSES = ['토공', '골조', '철근', '전기', '설비', '마감']
const myProcess = ref('철근')

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
// 게이트 (현장 등록 게이트)
// =========================================================
const GATES = [
  { id: 'G1', name: '1번 게이트', desc: '북측 정문' },
  { id: 'G2', name: '2번 게이트', desc: '동측 자재 게이트' },
  { id: 'G3', name: '3번 게이트', desc: '남측 토사 반출' },
  { id: 'G4', name: '4번 게이트', desc: '서측 비상' },
]
const GATE_CAPACITY = 6 // 게이트 당 동시 수용 가능 장비 수 (혼잡도 기준)

// =========================================================
// 날짜
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
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${dow})`
}

const filterDate = ref(todayStr())
const filterProcess = ref('all') // 활성 탭
const filterPartner = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')

// =========================================================
// 작업 지시서 상태
// =========================================================
const STATUS_LIST = ['작성 전','초안 생성','임시 저장','승인 대기','검토 중','승인 완료','반려','작업 완료']
const STATUS_META = {
  '작성 전':   { cls: 'bg-slate-100 text-slate-500 ring-slate-200',         icon: Clock },
  '초안 생성': { cls: 'bg-flare-50 text-flare-700 ring-flare-200',          icon: Sparkles },
  '임시 저장': { cls: 'bg-amber-50 text-amber-700 ring-amber-200',          icon: Pencil },
  '승인 대기': { cls: 'bg-sky-50 text-sky-700 ring-sky-200',                icon: Send },
  '검토 중':   { cls: 'bg-violet-50 text-violet-700 ring-violet-200',       icon: Eye },
  '승인 완료': { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',    icon: CheckCircle2 },
  '반려':      { cls: 'bg-rose-50 text-rose-700 ring-rose-200',             icon: AlertTriangle },
  '작업 완료': { cls: 'bg-emerald-100 text-emerald-800 ring-emerald-300',   icon: CheckCircle2 },
}
function statusMeta(s) { return STATUS_META[s] || STATUS_META['작성 전'] }

// =========================================================
// 데모 데이터: 공사일보의 명일 작업 예정 (초안 생성 소스)
// =========================================================
// (전일 작성된 공사일보의 tomorrowPlan을 시뮬레이션)
const tomorrowPlanSource = ref([
  {
    process: '토공', date: todayStr(),
    location: 'B3층 동측 굴착 구역',
    plan: '잔여 토사 반출 마무리, 굴착 바닥 정리. 흙막이 변위 추가 점검.',
    expectedWorkers: 14,
    expectedEquipment: [
      { name: '굴삭기', count: 1 },
      { name: '덤프트럭', count: 3 },
    ],
    workTime: '07:00 ~ 17:00',
  },
  {
    process: '골조', date: todayStr(),
    location: '지상 5층 동·서측',
    plan: '4층 양생 관리 병행, 5층 거푸집 설치 시작.',
    expectedWorkers: 22,
    expectedEquipment: [
      { name: '타워크레인', count: 1 },
      { name: '콘크리트 펌프카', count: 1 },
    ],
    workTime: '07:00 ~ 18:00',
  },
  {
    process: '철근', date: todayStr(),
    location: '본동 3층 슬라브',
    plan: '3층 슬라브 상부 철근 배근 마무리, 검측 요청.',
    expectedWorkers: 12,
    expectedEquipment: [
      { name: '철근 절곡기', count: 1 },
    ],
    workTime: '07:00 ~ 17:00',
  },
  {
    process: '전기', date: todayStr(),
    location: 'B2층 전기실',
    plan: 'B2층 잔여 배관 설치, 배관 청소 및 검측.',
    expectedWorkers: 6,
    expectedEquipment: [
      { name: '고소작업대', count: 1 },
    ],
    workTime: '08:00 ~ 17:00',
  },
])

function planFor(process, date) {
  return tomorrowPlanSource.value.find(p => p.process === process && p.date === date) || null
}

// =========================================================
// 작업 지시서 (데모)
// =========================================================
function makeId() { return `WO-${Math.random().toString(36).slice(2, 7).toUpperCase()}` }

const workOrders = ref([
  {
    id: 'WO-A1B2C', date: todayStr(),
    process: '토공', partner: '한울중기',
    location: 'B3층 동측 굴착 구역',
    workTime: '07:00 ~ 17:00',
    workers: 14,
    equipment: [
      { id: 'eq1', name: '굴삭기', count: 1, gateIn: 'G3', gateOut: 'G3' },
      { id: 'eq2', name: '덤프트럭', count: 3, gateIn: 'G3', gateOut: 'G3' },
    ],
    workDetail: '잔여 토사 반출 마무리, 굴착 바닥 정리, 흙막이 변위 추가 점검.',
    safety: '굴착부 추락 방지 안전난간 확인. 덤프트럭 후진 시 신호수 배치.',
    notes: '오후 강우 예보, 우천 시 작업 중지 검토.',
    files: [
      { id: 'f1', name: '토공_4월29일_작업계획서.pdf', size: 482000, type: 'application/pdf' },
    ],
    photos: [],
    author: '김토공', createdAt: '2026-04-28 18:10',
    status: '승인 대기',
    history: [
      { at: '2026-04-28 17:30', who: '김토공', what: '초안 생성' },
      { at: '2026-04-28 18:10', who: '김토공', what: '승인 대기' },
    ],
  },
  {
    id: 'WO-D3E4F', date: todayStr(),
    process: '골조', partner: '대한건설',
    location: '지상 5층 동·서측',
    workTime: '07:00 ~ 18:00',
    workers: 22,
    equipment: [
      { id: 'eq3', name: '타워크레인', count: 1, gateIn: 'G2', gateOut: 'G2' },
      { id: 'eq4', name: '콘크리트 펌프카', count: 1, gateIn: 'G2', gateOut: 'G2' },
    ],
    workDetail: '4층 양생 관리, 5층 거푸집 설치 시작 (동측 → 서측 순).',
    safety: '거푸집 인양 작업 반경 통제. 신호수 1명 상시 배치.',
    notes: '',
    files: [],
    photos: [],
    author: '박골조', createdAt: '2026-04-28 17:50',
    status: '승인 완료',
    history: [
      { at: '2026-04-28 17:50', who: '박골조', what: '승인 대기' },
      { at: '2026-04-28 19:20', who: '현장소장', what: '승인 완료' },
    ],
  },
  {
    id: 'WO-G5H6I', date: todayStr(),
    process: '전기', partner: '대우전기',
    location: 'B2층 전기실',
    workTime: '08:00 ~ 17:00',
    workers: 6,
    equipment: [
      { id: 'eq5', name: '고소작업대', count: 1, gateIn: 'G2', gateOut: 'G2' },
    ],
    workDetail: 'B2층 잔여 배관 설치 및 배관 청소.',
    safety: '고소작업대 안전벨트 착용 필수. 정전 작업 절차 준수.',
    notes: '천장 간섭 구간 1개소 협의 후 진행.',
    files: [],
    photos: [],
    author: '최전기', createdAt: '2026-04-28 18:30',
    status: '승인 완료',
    history: [
      { at: '2026-04-28 18:30', who: '최전기', what: '승인 대기' },
      { at: '2026-04-28 20:00', who: '현장소장', what: '승인 완료' },
    ],
  },
])

// =========================================================
// 권한별 보이는 탭
// =========================================================
const visibleTabs = computed(() => {
  if (currentRole.value === ROLES.WORKER) {
    return [{ key: myProcess.value, label: `${myProcess.value} 공정` }]
  }
  return [
    { key: 'all', label: '전체' },
    ...ALL_PROCESSES.map(p => ({ key: p, label: p })),
  ]
})

// 담당자라면 탭을 myProcess로 자동 고정
function onRoleChange(role) {
  currentRole.value = role
  if (role === ROLES.WORKER) filterProcess.value = myProcess.value
  else filterProcess.value = 'all'
}
function onMyProcessChange() {
  if (currentRole.value === ROLES.WORKER) filterProcess.value = myProcess.value
}

// =========================================================
// 필터링
// =========================================================
const filteredOrders = computed(() => {
  let r = workOrders.value
  // 권한 필터: 담당자는 본인 공정만
  if (currentRole.value === ROLES.WORKER) {
    r = r.filter(o => o.process === myProcess.value)
  } else if (filterProcess.value !== 'all') {
    r = r.filter(o => o.process === filterProcess.value)
  }
  if (filterDate.value) r = r.filter(o => o.date === filterDate.value)
  if (filterPartner.value) r = r.filter(o => o.partner.includes(filterPartner.value))
  if (filterStatus.value) r = r.filter(o => o.status === filterStatus.value)
  if (searchKeyword.value.trim()) {
    const k = searchKeyword.value.trim().toLowerCase()
    r = r.filter(o =>
      o.location.toLowerCase().includes(k) ||
      o.workDetail.toLowerCase().includes(k) ||
      o.id.toLowerCase().includes(k)
    )
  }
  return r
})

const partners = computed(() => {
  const set = new Set(workOrders.value.map(o => o.partner))
  return Array.from(set)
})

// 책임자: 오늘자 미작성 공정 알림
const missingProcesses = computed(() => {
  if (currentRole.value !== ROLES.MANAGER) return []
  const existing = new Set(
    workOrders.value.filter(o => o.date === filterDate.value).map(o => o.process)
  )
  return ALL_PROCESSES.filter(p => !existing.has(p))
})

// =========================================================
// 게이트 배정 현황 (선택된 날짜 기준)
// =========================================================
const gateAssignment = computed(() => {
  const map = {}
  GATES.forEach(g => map[g.id] = { in: 0, out: 0 })
  workOrders.value
    .filter(o => o.date === filterDate.value)
    .forEach(o => {
      o.equipment.forEach(eq => {
        if (eq.gateIn && map[eq.gateIn])  map[eq.gateIn].in  += eq.count || 0
        if (eq.gateOut && map[eq.gateOut]) map[eq.gateOut].out += eq.count || 0
      })
    })
  return GATES.map(g => {
    const a = map[g.id]
    const total = a.in + a.out
    const ratio = total / GATE_CAPACITY
    let level = 'low'
    if (ratio >= 1) level = 'high'
    else if (ratio >= 0.66) level = 'mid'
    return { ...g, in: a.in, out: a.out, total, ratio: Math.min(ratio, 1.5), level }
  })
})

// 편집 중 보고서의 임시 게이트 점유까지 합산하려면 별도 계산도 가능 — 여기선 단순화

// =========================================================
// 작성/수정 모달
// =========================================================
const showEditor = ref(false)
const editing = ref(null)
const isNew = ref(false)
// 편집 중 자동 초안 영역
const draftSourcePlan = ref(null)   // 명일 작업 원문
const draftAutoFilled = ref({})     // 어떤 필드가 자동 입력됐는지 표시

function canEdit(order) {
  if (currentRole.value === ROLES.MANAGER) return false
  if (order.process !== myProcess.value) return false
  if (['승인 완료','작업 완료'].includes(order.status)) return false
  return true
}

function openCreate() {
  isNew.value = true
  editing.value = blankOrder()
  // 작성 시작 시 자동 초안을 띄울지 여부는 사용자가 버튼으로 선택
  draftSourcePlan.value = null
  draftAutoFilled.value = {}
  showEditor.value = true
}
function openEdit(order) {
  isNew.value = false
  editing.value = cloneOrder(order)
  draftSourcePlan.value = null
  draftAutoFilled.value = {}
  showEditor.value = true
}
function closeEditor() {
  showEditor.value = false
  editing.value = null
  draftSourcePlan.value = null
  draftAutoFilled.value = {}
}

function blankOrder() {
  return {
    id: makeId(),
    date: filterDate.value,
    process: currentRole.value === ROLES.WORKER ? myProcess.value : (filterProcess.value !== 'all' ? filterProcess.value : ALL_PROCESSES[0]),
    partner: '',
    location: '',
    workTime: '',
    workers: 0,
    equipment: [],
    equipmentInput: { name: '', count: 1, gateIn: 'G1', gateOut: 'G1' },
    workDetail: '',
    safety: '',
    notes: '',
    files: [],
    photos: [],
    author: currentRole.value === ROLES.WORKER ? `나(${myProcess.value} 담당)` : '관리자',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    status: '작성 전',
    history: [],
  }
}
function cloneOrder(o) {
  return {
    ...o,
    equipment: o.equipment.map(e => ({ ...e })),
    equipmentInput: { name: '', count: 1, gateIn: 'G1', gateOut: 'G1' },
    files: o.files.map(f => ({ ...f })),
    photos: (o.photos || []).map(p => ({ ...p })),
    history: [...(o.history || [])],
  }
}

// 명일 작업 예정 → 초안 자동 생성
function generateDraft() {
  if (!editing.value) return
  const plan = planFor(editing.value.process, addDays(editing.value.date, -1))
              || planFor(editing.value.process, editing.value.date)
  if (!plan) {
    alert(`${editing.value.process} 공정의 명일 작업 예정 내용을 찾지 못했습니다.\n공사일보가 먼저 작성되어 있어야 합니다.`)
    return
  }
  draftSourcePlan.value = plan
  // 자동 입력
  editing.value.location   = plan.location
  editing.value.workTime   = plan.workTime
  editing.value.workers    = plan.expectedWorkers
  editing.value.workDetail = plan.plan
  // 장비도 자동으로 채워넣되, 게이트는 기본값(G1)
  editing.value.equipment = plan.expectedEquipment.map((eq, i) => ({
    id: `eq_${Date.now()}_${i}`,
    name: eq.name,
    count: eq.count,
    gateIn: 'G1',
    gateOut: 'G1',
  }))
  draftAutoFilled.value = {
    location: true, workTime: true, workers: true,
    workDetail: true, equipment: true,
  }
  if (editing.value.status === '작성 전') editing.value.status = '초안 생성'
}
function regenerateDraft() {
  if (!confirm('현재 입력 내용이 초안으로 다시 덮어쓰여집니다. 계속할까요?')) return
  generateDraft()
}
function clearDraftHighlight(field) {
  // 사용자가 수정한 필드는 자동입력 표시 해제
  if (draftAutoFilled.value[field]) draftAutoFilled.value[field] = false
}

// 장비 추가/삭제
function addEquipment() {
  const inp = editing.value.equipmentInput
  if (!inp.name.trim() || inp.count < 1) return
  editing.value.equipment.push({
    id: `eq_${Date.now()}`,
    name: inp.name.trim(),
    count: inp.count,
    gateIn: inp.gateIn,
    gateOut: inp.gateOut,
  })
  editing.value.equipmentInput = { name: '', count: 1, gateIn: 'G1', gateOut: 'G1' }
}
function removeEquipment(idx) {
  editing.value.equipment.splice(idx, 1)
}

// 첨부 (사진 + 파일) — 디자인 일관성 위해 동일 패턴
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
      editing.value.photos.push({
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        name: f.name, size: f.size, dataUrl: ev.target.result,
      })
    }
    reader.readAsDataURL(f)
  })
  e.target.value = ''
}
function onFileChangeInput(e) {
  const list = Array.from(e.target.files || [])
  list.forEach(f => {
    editing.value.files.push({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      name: f.name, size: f.size, type: f.type,
    })
  })
  e.target.value = ''
}
function removePhoto(idx) { editing.value.photos.splice(idx, 1) }
function removeFile(idx)  { editing.value.files.splice(idx, 1) }
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

// 임시저장 / 제출
function saveDraft() {
  persist('임시 저장', '임시 저장')
}
function submitOrder() {
  const r = editing.value
  if (!r.partner.trim() || !r.location.trim() || !r.workTime.trim() || !r.workDetail.trim()) {
    alert('협력사 / 작업 위치 / 작업 시간 / 작업 상세 내역은 필수입니다.')
    return
  }
  if (r.equipment.length === 0) {
    if (!confirm('투입 장비가 없습니다. 그대로 제출하시겠습니까?')) return
  }
  persist('승인 대기', '승인 대기')
}
function persist(newStatus, historyLabel) {
  const r = editing.value
  delete r.equipmentInput
  r.status = newStatus
  r.history.push({
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    who: r.author,
    what: historyLabel,
  })
  const idx = workOrders.value.findIndex(x => x.id === r.id)
  if (idx >= 0) workOrders.value.splice(idx, 1, { ...r })
  else workOrders.value.push({ ...r })
  closeEditor()
}

// =========================================================
// 상세 보기 (책임자/조회 공통)
// =========================================================
const viewing = ref(null)
function openViewer(o) { viewing.value = o }
function closeViewer() { viewing.value = null }

function approve() {
  const idx = workOrders.value.findIndex(o => o.id === viewing.value.id)
  if (idx < 0) return
  workOrders.value[idx].status = '승인 완료'
  workOrders.value[idx].history.push({
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    who: '현장소장', what: '승인 완료',
  })
  viewing.value = workOrders.value[idx]
}
function reject() {
  const idx = workOrders.value.findIndex(o => o.id === viewing.value.id)
  if (idx < 0) return
  workOrders.value[idx].status = '반려'
  workOrders.value[idx].history.push({
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    who: '현장소장', what: '반려',
  })
  viewing.value = workOrders.value[idx]
}

// 게이트 이름 헬퍼
function gateName(id) { return GATES.find(g => g.id === id)?.name || id }

// ESC 닫기
function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (showEditor.value) closeEditor()
  else if (viewing.value) closeViewer()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 pb-6">

    <!-- ========== 헤더 ========== -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">현장 운영</p>
        <h1 class="text-xl font-bold text-forena-900">작업 지시서</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <!-- 권한 토글 -->
        <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="currentRole === ROLES.WORKER ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'"
            @click="onRoleChange(ROLES.WORKER)">
            <UserCog class="h-3.5 w-3.5" /> 공정 담당자
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="currentRole === ROLES.MANAGER ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'"
            @click="onRoleChange(ROLES.MANAGER)">
            <ShieldCheck class="h-3.5 w-3.5" /> 현장 총 관리자
          </button>
        </div>
        <select v-if="currentRole === ROLES.WORKER" v-model="myProcess" @change="onMyProcessChange"
          class="rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400">
          <option v-for="p in ALL_PROCESSES" :key="p" :value="p">{{ p }} 공정</option>
        </select>

        <button @click="openCreate"
          class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-flare-600">
          <Plus class="h-3.5 w-3.5" /> 작업 지시서 작성
        </button>
      </div>
    </div>

    <!-- ========== 권한 안내 ========== -->
    <div v-if="currentRole === ROLES.WORKER"
      class="flex shrink-0 items-start gap-2.5 rounded-xl border border-flare-200 bg-flare-50/60 px-4 py-3">
      <UserCog class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <span class="font-bold text-flare-700">{{ myProcess }} 공정 담당자</span>입니다.
        {{ myProcess }} 공정 작업 지시서만 조회 · 작성 · 수정할 수 있습니다.
      </p>
    </div>
    <div v-else
      class="flex shrink-0 items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
      <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <span class="font-bold text-emerald-700">현장 총 관리자</span>입니다.
        전체 공정 작업 지시서를 조회하고 승인/반려할 수 있습니다.
        <span v-if="missingProcesses.length" class="ml-1 font-bold text-rose-600">
          · 미작성 공정: {{ missingProcesses.join(', ') }}
        </span>
      </p>
    </div>

    <!-- ========== 필터 바 ========== -->
    <div class="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-forena-100 bg-white px-4 py-3">
      <!-- 날짜 -->
      <div class="flex items-center gap-1">
        <CalendarDays class="h-4 w-4 text-flare-600" />
        <input type="date" v-model="filterDate"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs font-semibold tabular-nums text-forena-800 outline-none focus:border-flare-400" />
      </div>
      <!-- 협력사 -->
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold text-forena-400">협력사</span>
        <select v-model="filterPartner"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs text-forena-800 outline-none focus:border-flare-400">
          <option value="">전체</option>
          <option v-for="p in partners" :key="p">{{ p }}</option>
        </select>
      </div>
      <!-- 상태 -->
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold text-forena-400">상태</span>
        <select v-model="filterStatus"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs text-forena-800 outline-none focus:border-flare-400">
          <option value="">전체</option>
          <option v-for="s in STATUS_LIST" :key="s">{{ s }}</option>
        </select>
      </div>
      <!-- 검색 -->
      <div class="flex items-center gap-1 rounded-md border border-forena-200 bg-white px-2">
        <Search class="h-3.5 w-3.5 text-forena-400" />
        <input v-model="searchKeyword" placeholder="위치/지시서 번호/내용"
          class="w-44 bg-transparent py-1 text-xs text-forena-800 outline-none placeholder:text-forena-300" />
      </div>

      <span class="ml-auto text-[11px] text-forena-500">
        조회 결과 <span class="font-bold text-forena-800 tabular-nums">{{ filteredOrders.length }}</span>건
      </span>
    </div>

    <!-- ========== 게이트 배정 현황 (책임자 전용) ========== -->
    <div v-if="currentRole === ROLES.MANAGER"
      class="shrink-0 rounded-xl border border-forena-100 bg-white p-4">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <DoorOpen class="h-4 w-4 text-flare-600" />
          <p class="text-sm font-bold text-forena-900">중장비 게이트 배정 현황</p>
          <span class="text-[11px] text-forena-400">{{ fmtKor(filterDate) }} 기준</span>
        </div>
        <span class="text-[10px] text-forena-400">게이트 수용 기준 {{ GATE_CAPACITY }}대</span>
      </div>
      <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div v-for="g in gateAssignment" :key="g.id"
          class="rounded-xl border p-3"
          :class="g.level === 'high' ? 'border-rose-200 bg-rose-50/40'
                  : g.level === 'mid' ? 'border-amber-200 bg-amber-50/40'
                  : 'border-forena-100 bg-forena-50/30'">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold text-forena-900">{{ g.name }}</p>
              <p class="text-[10px] text-forena-500">{{ g.desc }}</p>
            </div>
            <span v-if="g.level === 'high'"
              class="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
              <AlertTriangle class="h-3 w-3" /> 과밀
            </span>
            <span v-else-if="g.level === 'mid'"
              class="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">혼잡</span>
            <span v-else class="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">원활</span>
          </div>
          <div class="mt-2 flex items-center gap-3 text-[11px] text-forena-700">
            <span class="inline-flex items-center gap-1">
              <ChevronRight class="h-3 w-3 text-emerald-500" />입차 <b class="tabular-nums">{{ g.in }}</b>대
            </span>
            <span class="inline-flex items-center gap-1">
              <ChevronLeft class="h-3 w-3 text-rose-500" />출차 <b class="tabular-nums">{{ g.out }}</b>대
            </span>
          </div>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
            <div class="h-full rounded-full transition-all"
              :class="g.level === 'high' ? 'bg-rose-500' : g.level === 'mid' ? 'bg-amber-500' : 'bg-emerald-500'"
              :style="{ width: Math.min(g.ratio * 100, 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 공정 탭 ========== -->
    <div class="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-forena-100">
      <button v-for="t in visibleTabs" :key="t.key"
        @click="filterProcess = t.key"
        class="shrink-0 border-b-2 px-4 py-2 text-xs font-bold transition"
        :class="filterProcess === t.key ? 'border-flare-500 text-flare-700' : 'border-transparent text-forena-500 hover:text-forena-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- ========== 작업 지시서 목록 ========== -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="!filteredOrders.length"
        class="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <FileText class="h-8 w-8 text-slate-300" />
        <p class="text-sm text-slate-400">조회된 작업 지시서가 없습니다.</p>
        <button v-if="currentRole === ROLES.WORKER" @click="openCreate"
          class="mt-1 inline-flex items-center gap-1 rounded-md bg-flare-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-flare-600">
          <Plus class="h-3 w-3" /> 새 작업 지시서 작성
        </button>
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-forena-100 bg-white">
        <table class="w-full text-xs">
          <thead class="bg-forena-50/60 text-forena-500">
            <tr>
              <th class="px-3 py-2.5 text-left font-bold">상태</th>
              <th class="px-3 py-2.5 text-left font-bold">지시서 번호</th>
              <th class="px-3 py-2.5 text-left font-bold">공정 / 협력사</th>
              <th class="px-3 py-2.5 text-left font-bold">작업 위치</th>
              <th class="px-3 py-2.5 text-left font-bold tabular-nums">작업 시간</th>
              <th class="px-3 py-2.5 text-center font-bold">인원</th>
              <th class="px-3 py-2.5 text-left font-bold">중장비 / 게이트</th>
              <th class="px-3 py-2.5 text-left font-bold">작성자</th>
              <th class="px-3 py-2.5 text-right font-bold">동작</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-forena-100">
            <tr v-for="o in filteredOrders" :key="o.id"
              class="cursor-pointer hover:bg-forena-50/40"
              @click="openViewer(o)">
              <td class="px-3 py-3">
                <span class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
                  :class="statusMeta(o.status).cls">
                  <component :is="statusMeta(o.status).icon" class="h-3 w-3" />
                  {{ o.status }}
                </span>
              </td>
              <td class="px-3 py-3 font-mono text-[11px] text-forena-700">{{ o.id }}</td>
              <td class="px-3 py-3">
                <p class="font-bold text-forena-900">{{ o.process }}</p>
                <p class="text-[10px] text-forena-500">{{ o.partner }}</p>
              </td>
              <td class="px-3 py-3">
                <p class="flex items-center gap-1 text-forena-800">
                  <MapPin class="h-3 w-3 text-flare-600" />{{ o.location }}
                </p>
              </td>
              <td class="px-3 py-3 tabular-nums text-forena-700">{{ o.workTime }}</td>
              <td class="px-3 py-3 text-center font-bold tabular-nums text-forena-900">{{ o.workers }}</td>
              <td class="px-3 py-3">
                <div v-if="o.equipment.length" class="space-y-0.5">
                  <p v-for="eq in o.equipment" :key="eq.id" class="text-[11px] text-forena-700">
                    <span class="font-semibold">{{ eq.name }} {{ eq.count }}대</span>
                    <span class="ml-1 text-forena-400">
                      ({{ gateName(eq.gateIn) }} → {{ gateName(eq.gateOut) }})
                    </span>
                  </p>
                </div>
                <span v-else class="text-[11px] text-slate-400">—</span>
              </td>
              <td class="px-3 py-3 text-forena-700">{{ o.author }}</td>
              <td class="px-3 py-3 text-right" @click.stop>
                <button @click="openViewer(o)"
                  class="rounded-md border border-forena-200 bg-white p-1.5 text-forena-600 hover:bg-forena-50" title="상세 보기">
                  <Eye class="h-3.5 w-3.5" />
                </button>
                <button v-if="canEdit(o)" @click="openEdit(o)"
                  class="ml-1 rounded-md border border-flare-200 bg-flare-50 p-1.5 text-flare-700 hover:bg-flare-100" title="수정">
                  <Pencil class="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
      <div v-if="showEditor && editing"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeEditor">
        <div class="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <!-- 헤더 -->
          <div class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50">
                <ClipboardList class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">
                  {{ isNew ? '작업 지시서 작성' : '작업 지시서 수정' }}
                </p>
                <p class="mt-0.5 text-xs text-forena-500">
                  <span class="font-mono text-forena-700">{{ editing.id }}</span>
                  · {{ fmtKor(editing.date) }} ·
                  <span class="font-bold text-forena-700">{{ editing.process }} 공정</span>
                </p>
              </div>
            </div>
            <button @click="closeEditor" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- 본문 (스크롤) -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">

            <!-- ===== 자동 초안 생성 섹션 ===== -->
            <div class="rounded-xl border border-flare-200 bg-flare-50/40 p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-2.5">
                  <Sparkles class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
                  <div>
                    <p class="text-xs font-bold text-forena-900">명일 작업 예정으로 초안 자동 생성</p>
                    <p class="mt-0.5 text-[11px] text-forena-600">
                      전일 공사일보의 명일 작업 예정 내용을 불러와
                      작업 위치 · 시간 · 인원 · 장비 · 상세를 자동 입력합니다. 게이트는 직접 지정하세요.
                    </p>
                  </div>
                </div>
                <div class="flex shrink-0 gap-1.5">
                  <button v-if="!draftSourcePlan" @click="generateDraft"
                    class="inline-flex items-center gap-1 rounded-md bg-flare-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-flare-600">
                    <Sparkles class="h-3 w-3" /> 초안 생성
                  </button>
                  <button v-else @click="regenerateDraft"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-300 bg-white px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-50">
                    <RefreshCw class="h-3 w-3" /> 다시 생성
                  </button>
                </div>
              </div>

              <!-- 원문 미리보기 -->
              <div v-if="draftSourcePlan" class="mt-3 rounded-lg bg-white p-3 ring-1 ring-flare-100">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">원문 (전일 공사일보 명일 작업)</p>
                <p class="mt-1 text-[11px] leading-relaxed text-forena-700">{{ draftSourcePlan.plan }}</p>
              </div>
            </div>

            <!-- ===== 기본 정보 ===== -->
            <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">작업 일 <span class="text-rose-500">*</span></label>
                <input type="date" v-model="editing.date"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  작업 시간 <span class="text-rose-500">*</span>
                  <span v-if="draftAutoFilled.workTime" class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700">자동</span>
                </label>
                <input v-model="editing.workTime" placeholder="예: 07:00 ~ 17:00"
                  @input="clearDraftHighlight('workTime')"
                  class="w-full rounded-md border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                  :class="draftAutoFilled.workTime ? 'border-flare-300' : 'border-forena-200'" />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">공정 명</label>
                <select v-model="editing.process"
                  :disabled="currentRole === ROLES.WORKER"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400 disabled:bg-forena-50/40">
                  <option v-for="p in ALL_PROCESSES" :key="p">{{ p }}</option>
                </select>
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">협력사 명 <span class="text-rose-500">*</span></label>
                <input v-model="editing.partner" placeholder="예: 한울중기"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  필요 인원
                  <span v-if="draftAutoFilled.workers" class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700">자동</span>
                </label>
                <input type="number" min="0" v-model.number="editing.workers"
                  @input="clearDraftHighlight('workers')"
                  class="w-full rounded-md border bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400"
                  :class="draftAutoFilled.workers ? 'border-flare-300' : 'border-forena-200'" />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  <MapPin class="mr-0.5 inline h-3 w-3" />작업 위치 <span class="text-rose-500">*</span>
                  <span v-if="draftAutoFilled.location" class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700">자동</span>
                </label>
                <input v-model="editing.location" placeholder="예: 본동 3층 슬라브"
                  @input="clearDraftHighlight('location')"
                  class="w-full rounded-md border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                  :class="draftAutoFilled.location ? 'border-flare-300' : 'border-forena-200'" />
              </div>
            </div>

            <!-- ===== 중장비 + 게이트 배정 ===== -->
            <div class="mt-5 rounded-xl border border-forena-100 bg-forena-50/30 p-4">
              <div class="mb-2 flex items-center justify-between">
                <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                  <Truck class="h-3.5 w-3.5 text-flare-600" />
                  필요 중장비 + 게이트 배정 ({{ editing.equipment.length }})
                  <span v-if="draftAutoFilled.equipment" class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700">자동 입력됨</span>
                </p>
              </div>

              <!-- 입력 행 -->
              <div class="grid grid-cols-2 gap-2 rounded-lg bg-white p-3 ring-1 ring-forena-100 sm:grid-cols-5">
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-[10px] font-bold text-forena-500">장비명</label>
                  <select v-model="editing.equipmentInput.name"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option value="">장비 선택</option>
                    <optgroup v-for="(items, category) in equipmentList" :key="category" :label="category">
                      <option v-for="equipment in items" :key="`${category}_${equipment}`" :value="equipment">
                        {{ equipment }}
                      </option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-[10px] font-bold text-forena-500">대수</label>
                  <input type="number" min="1" v-model.number="editing.equipmentInput.count"
                    class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400" />
                </div>
                <div>
                  <label class="mb-1 block text-[10px] font-bold text-forena-500">입차 게이트</label>
                  <select v-model="editing.equipmentInput.gateIn"
                    class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400">
                    <option v-for="g in GATES" :key="g.id" :value="g.id">{{ g.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-[10px] font-bold text-forena-500">출차 게이트</label>
                  <select v-model="editing.equipmentInput.gateOut"
                    class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400">
                    <option v-for="g in GATES" :key="g.id" :value="g.id">{{ g.name }}</option>
                  </select>
                </div>
                <div class="sm:col-span-5">
                  <button @click="addEquipment"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100">
                    <Plus class="h-3 w-3" /> 장비 추가
                  </button>
                </div>
              </div>

              <!-- 등록된 장비 -->
              <div v-if="editing.equipment.length" class="mt-2 space-y-1.5">
                <div v-for="(eq, i) in editing.equipment" :key="eq.id"
                  class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-forena-100">
                  <Wrench class="h-3.5 w-3.5 text-forena-400" />
                  <span class="font-semibold text-xs text-forena-900">{{ eq.name }}</span>
                  <span class="rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-bold text-forena-700 tabular-nums">{{ eq.count }}대</span>
                  <span class="ml-auto flex items-center gap-1.5 text-[11px]">
                    <select v-model="eq.gateIn"
                      class="rounded border border-forena-200 px-1.5 py-0.5 text-[11px] outline-none focus:border-flare-400">
                      <option v-for="g in GATES" :key="g.id" :value="g.id">입 · {{ g.name }}</option>
                    </select>
                    <ArrowRightLeft class="h-3 w-3 text-forena-400" />
                    <select v-model="eq.gateOut"
                      class="rounded border border-forena-200 px-1.5 py-0.5 text-[11px] outline-none focus:border-flare-400">
                      <option v-for="g in GATES" :key="g.id" :value="g.id">출 · {{ g.name }}</option>
                    </select>
                  </span>
                  <button @click="removeEquipment(i)" class="text-slate-400 hover:text-rose-600">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <!-- 게이트 혼잡도 미니 뷰 -->
              <div class="mt-3">
                <p class="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  현재 일자 게이트 혼잡도
                </p>
                <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  <div v-for="g in gateAssignment" :key="g.id"
                    class="rounded-md border px-2 py-1.5"
                    :class="g.level === 'high' ? 'border-rose-200 bg-rose-50/40'
                            : g.level === 'mid' ? 'border-amber-200 bg-amber-50/40'
                            : 'border-forena-100 bg-white'">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-forena-800">{{ g.name }}</span>
                      <span v-if="g.level === 'high'" class="text-[9px] font-bold text-rose-600">과밀</span>
                      <span v-else-if="g.level === 'mid'" class="text-[9px] font-bold text-amber-600">혼잡</span>
                      <span v-else class="text-[9px] font-bold text-emerald-600">원활</span>
                    </div>
                    <p class="mt-0.5 text-[10px] tabular-nums text-forena-500">
                      입차 {{ g.in }} · 출차 {{ g.out }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- ===== 작업 상세 ===== -->
            <div class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  작업 상세 내역 <span class="text-rose-500">*</span>
                  <span v-if="draftAutoFilled.workDetail" class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700">자동</span>
                </label>
                <textarea v-model="editing.workDetail" rows="5"
                  @input="clearDraftHighlight('workDetail')"
                  placeholder="작업 절차, 범위, 협의사항 등"
                  class="w-full resize-none rounded-md border bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"
                  :class="draftAutoFilled.workDetail ? 'border-flare-300' : 'border-forena-200'"></textarea>
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">안전 유의사항</label>
                <textarea v-model="editing.safety" rows="5"
                  placeholder="추락/낙하/화재 등 위험요인 및 안전조치"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"></textarea>
              </div>
              <div class="md:col-span-2">
                <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">특이사항</label>
                <textarea v-model="editing.notes" rows="2"
                  placeholder="기상, 선행공정 의존성, 추가 요청 등"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"></textarea>
              </div>
            </div>

            <!-- ===== 사진 첨부 ===== -->
            <div class="mt-5 rounded-xl border border-forena-100 bg-forena-50/30 p-3.5">
              <div class="mb-2 flex items-center justify-between">
                <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                  <ImageIcon class="h-3.5 w-3.5 text-flare-600" />
                  현장 / 도면 사진 ({{ editing.photos.length }})
                </p>
                <button @click="pickPhotos"
                  class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100">
                  <Plus class="h-3 w-3" /> 사진 추가
                </button>
                <input ref="photoInputRef" type="file" class="sr-only"
                  accept="image/*" multiple @change="onPhotoChange" />
              </div>
              <div v-if="editing.photos.length"
                class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                <div v-for="(photo, i) in editing.photos" :key="photo.id"
                  class="group relative aspect-square overflow-hidden rounded-lg border border-forena-200 bg-white">
                  <img :src="photo.dataUrl" :alt="photo.name" class="h-full w-full object-cover" />
                  <button @click="removePhoto(i)"
                    class="absolute right-1 top-1 rounded-md bg-slate-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600">
                    <Trash2 class="h-3 w-3" />
                  </button>
                  <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-1.5 py-1">
                    <p class="truncate text-[9px] font-semibold text-white">{{ photo.name }}</p>
                  </div>
                </div>
              </div>
              <p v-else class="text-[11px] text-slate-400">첨부된 사진이 없습니다.</p>
            </div>

            <!-- ===== 일반 첨부 파일 ===== -->
            <div class="mt-3 rounded-xl border border-forena-100 bg-forena-50/30 p-3.5">
              <div class="mb-2 flex items-center justify-between">
                <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                  <Paperclip class="h-3.5 w-3.5 text-flare-600" />
                  첨부 파일 ({{ editing.files.length }})
                  <span class="ml-1 text-[10px] font-normal text-forena-400">PDF · Excel · 이미지</span>
                </p>
                <button @click="pickFiles"
                  class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100">
                  <Plus class="h-3 w-3" /> 파일 추가
                </button>
                <input ref="fileInputRef" type="file" class="sr-only"
                  accept=".pdf,.xls,.xlsx,.csv,image/*" multiple @change="onFileChangeInput" />
              </div>
              <ul v-if="editing.files.length" class="space-y-1.5">
                <li v-for="(f, i) in editing.files" :key="f.id"
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
              <button @click="submitOrder"
                class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600">
                <Send class="h-3.5 w-3.5" /> 제출
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- =====================================================
         상세 보기 모달 (이미지 디자인 톤 반영)
         ===================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="viewing"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeViewer">
        <div class="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <!-- 헤더 (이미지 톤: 작업 상세 + 연필) -->
          <div class="flex shrink-0 items-center justify-between border-b border-forena-100 px-6 py-4">
            <p class="text-sm font-bold text-forena-900">작업 상세</p>
            <div class="flex items-center gap-1">
              <button v-if="canEdit(viewing)" @click="openEdit(viewing); closeViewer()"
                class="rounded-md p-1.5 text-forena-500 hover:bg-forena-50 hover:text-forena-800" title="수정">
                <Pencil class="h-4 w-4" />
              </button>
              <button @click="closeViewer" class="text-slate-400 hover:text-forena-700">
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- 본문 -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <!-- 타이틀 영역 -->
            <div class="flex items-start gap-2">
              <h2 class="text-lg font-bold text-forena-900">{{ viewing.location }}</h2>
              <span class="mt-1.5 rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-700">{{ viewing.process }}</span>
            </div>
            <p class="mt-0.5 font-mono text-xs text-forena-500">{{ viewing.id }}</p>

            <!-- 상태 배지 줄 -->
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1"
                :class="statusMeta(viewing.status).cls">
                <component :is="statusMeta(viewing.status).icon" class="h-3 w-3" />
                {{ viewing.status }}
              </span>
              <span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                {{ viewing.partner }}
              </span>
            </div>

            <!-- 그리드 정보 박스 -->
            <div class="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">작업 위치</p>
                <p class="mt-1 flex items-center gap-1 text-sm font-bold text-forena-900">
                  <MapPin class="h-3.5 w-3.5 text-flare-600" />{{ viewing.location }}
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">작업 시간</p>
                <p class="mt-1 text-sm font-bold tabular-nums text-forena-900">{{ viewing.workTime }}</p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">필요 인원</p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
                  {{ viewing.workers }}<span class="text-sm font-normal text-slate-400 ml-1">명</span>
                </p>
              </div>
              <div class="rounded-xl border border-rose-200 bg-rose-50/40 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-rose-600">작성자 / 작성일</p>
                <p class="mt-1 text-sm font-bold text-rose-700">
                  {{ viewing.author }}<span class="ml-1 text-[11px] font-normal text-rose-500">{{ viewing.createdAt }}</span>
                </p>
              </div>
            </div>

            <!-- 필요 장비 + 게이트 -->
            <div class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <div class="flex items-center justify-between">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">필요 장비 + 게이트</p>
                <span v-if="viewing.equipment.length"
                  class="text-[10px] font-bold text-emerald-700">배정 완료</span>
              </div>
              <div v-if="viewing.equipment.length" class="mt-2 space-y-1.5">
                <div v-for="eq in viewing.equipment" :key="eq.id"
                  class="flex flex-wrap items-center gap-2 rounded-lg bg-forena-50/60 px-3 py-1.5">
                  <Wrench class="h-3.5 w-3.5 text-forena-500" />
                  <span class="text-xs font-semibold text-forena-900">{{ eq.name }} {{ eq.count }}대</span>
                  <span class="ml-auto inline-flex items-center gap-1 text-[11px] text-forena-700">
                    <span class="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-700">입 · {{ gateName(eq.gateIn) }}</span>
                    <ArrowRightLeft class="h-3 w-3 text-forena-400" />
                    <span class="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700">출 · {{ gateName(eq.gateOut) }}</span>
                  </span>
                </div>
              </div>
              <p v-else class="mt-1 text-xs text-slate-400">투입 장비 없음</p>
            </div>

            <!-- 작업 상세 -->
            <div class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">작업 상세 내역</p>
              <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ viewing.workDetail }}</p>
            </div>

            <!-- 안전 (이미지의 노란 박스 톤) -->
            <div v-if="viewing.safety" class="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-700">안전 유의사항</p>
              <p class="mt-1 text-xs leading-relaxed text-amber-900">{{ viewing.safety }}</p>
            </div>

            <!-- 특이사항 -->
            <div v-if="viewing.notes" class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">특이사항</p>
              <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ viewing.notes }}</p>
            </div>

            <!-- 관련 문서 -->
            <div v-if="viewing.files?.length" class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">관련 문서</p>
              <ul class="mt-1.5 space-y-1">
                <li v-for="f in viewing.files" :key="f.id"
                  class="flex items-center gap-2 text-xs text-forena-800">
                  <FileText class="h-3.5 w-3.5 text-forena-400" />
                  <span class="flex-1 truncate">{{ f.name }}</span>
                  <span class="text-[10px] text-forena-400 tabular-nums">{{ fmtSize(f.size) }}</span>
                  <button class="rounded p-1 text-forena-400 hover:bg-forena-50 hover:text-forena-700">
                    <Eye class="h-3.5 w-3.5" />
                  </button>
                </li>
              </ul>
            </div>

            <!-- 사진 -->
            <div v-if="viewing.photos?.length" class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">현장 사진</p>
              <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                <div v-for="photo in viewing.photos" :key="photo.id"
                  class="aspect-square overflow-hidden rounded-lg border border-forena-200 bg-white">
                  <img :src="photo.dataUrl" :alt="photo.name" class="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <!-- 상태 이력 -->
            <div v-if="viewing.history?.length" class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">상태 이력</p>
              <ul class="mt-1.5 space-y-1">
                <li v-for="(h, i) in viewing.history" :key="i" class="flex items-center gap-2 text-[11px]">
                  <span class="font-mono text-forena-400 tabular-nums">{{ h.at }}</span>
                  <span class="text-forena-700">{{ h.who }}</span>
                  <span class="rounded bg-forena-50 px-1.5 py-0.5 font-bold text-forena-700">{{ h.what }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 푸터 액션 (이미지 톤: 빨강 보더 액션 + 진한 메인 액션) -->
          <div class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-white px-6 py-3">
            <button v-if="currentRole === ROLES.MANAGER && ['승인 대기','검토 중'].includes(viewing.status)"
              @click="reject"
              class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
              <AlertTriangle class="h-3.5 w-3.5" /> 반려
            </button>
            <button v-if="currentRole === ROLES.MANAGER && ['승인 대기','검토 중'].includes(viewing.status)"
              @click="approve"
              class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600">
              <CheckCircle2 class="h-3.5 w-3.5" /> 승인
            </button>
            <button @click="closeViewer"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50">
              닫기
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>