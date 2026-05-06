<script setup>
// feat : Vue Composition API 및 아이콘, API 모듈 임포트
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '@/api/index'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Save,
  Send,
  Eye,
  Pencil,
  Users,
  Wrench,
  MapPin,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserCog,
  Trash2,
  X,
  Layers,
  Sparkles,
  RefreshCw,
  Truck,
  DoorOpen,
  Image as ImageIcon,
  Paperclip,
  Search,
  Filter,
  ArrowRightLeft,
  Download,
} from 'lucide-vue-next'

import {
  createWorkOrder,
  getWorkOrderList,
  updateWorkOrder,
  approveWorkOrder,
} from '@/api/workOrder'

// feat : 한글 장비명과 영문 Enum 간의 매핑 상수
const EQUIPMENT_ENUM_MAP = {
  굴삭기: 'EXCAVATOR',
  미니굴삭기: 'MINI_EXCAVATOR',
  백호: 'BACKHOE_LOADER',
  드래그라인: 'DRAGLINE_EXCAVATOR',
  덤프트럭: 'DUMP_TRUCK',
  '트럭 믹서': 'CONCRETE_MIXER_TRUCK',
  트랙터: 'TRACTOR',
  트레일러: 'TRAILER',
  스크레이퍼: 'SCRAPER',
  타워크레인: 'TOWER_CRANE',
  '모바일 크레인': 'MOBILE_CRANE',
  '크롤러 크레인': 'CRAWLER_CRANE',
  지게차: 'FORKLIFT',
  리프트: 'CONSTRUCTION_HOIST',
  불도저: 'BULLDOZER',
  '모터 그레이더': 'MOTOR_GRADER',
  롤러: 'ROAD_ROLLER',
  콤팩터: 'PLATE_COMPACTOR',
  '아스팔트 피니셔': 'ASPHALT_PAVER',
  '밀링 머신': 'MILLING_MACHINE',
  살수차: 'WATER_TRUCK',
  '노면 절단기': 'CONCRETE_CUTTER',
  '파일 드라이버': 'PILE_DRIVER',
  보링머신: 'BORING_MACHINE',
  어스오거: 'EARTH_AUGER',
  RCD: 'REVERSE_CIRCULATION_DRILL',
  '콘크리트 펌프카': 'CONCRETE_PUMP_TRUCK',
  '배치 플랜트': 'BATCHING_PLANT',
  바이브레이터: 'CONCRETE_VIBRATOR',
  브레이커: 'HYDRAULIC_BREAKER',
  니블러: 'NIBBLER',
  크러셔: 'CRUSHER',
  고소작업차: 'AERIAL_WORK_PLATFORM',
  TBM: 'TUNNEL_BORING_MACHINE',
}

// feat : 영문 Enum을 한글 장비명으로 역매핑
const ENUM_TO_KOR_MAP = Object.fromEntries(
  Object.entries(EQUIPMENT_ENUM_MAP).map(([k, v]) => [v, k]),
)

// feat : 사용자 권한 및 공정 기본 설정
const ROLES = {
  MANAGER: 'site_manager',
  WORKER: 'process_owner',
}
const currentRole = ref(ROLES.WORKER)
const ALL_PROCESSES = ['토공', '골조', '철근', '전기', '설비', '마감']
const myProcess = ref('철근')

// feat : 장비 선택 옵션
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

// feat : 게이트 목록 및 상태 정보를 담을 반응형 변수
const GATES = ref([])
const GATE_CAPACITY = 6 // 혼잡도를 판별할 기준 대수

// feat : DB에서 게이트 목록과 실시간 장비 점유 상태를 함께 조회
async function fetchGates() {
  try {
    // 나중에 팀원이 만든 API 엔드포인트에 맞춰 수정.
    // 현재는 게이트 정보와 해당 게이트의 '현재 대기 대수'를 같이 준다고 가정.
    const response = await api.get('/gates/status', { params: { siteIdx: 1 } })
    const data = response.data?.data || response.data || []

    // feat : 받아온 데이터를 화면에서 쓰기 좋게 매핑
    GATES.value = data.map((g) => ({
      gateIdx: g.gateIdx, // DB PK (팀원과 맞출 컬럼)
      gateName: g.gateName, // 화면 표시용 이름
      currentCount: g.currentCount || 0, // 현재 해당 게이트 점유 대수
      // feat : 대기 대수에 따른 상태값 계산
      status: (g.currentCount || 0) >= GATE_CAPACITY ? '혼잡' : '원활',
    }))
  } catch (error) {
    console.error('게이트 상태 정보 조회 실패:', error)
    // API 에러 시 기본값 세팅 (테스트용)
    GATES.value = [
      { gateIdx: 1, gateName: '1번 게이트', currentCount: 0, status: '원활' },
      { gateIdx: 2, gateName: '2번 게이트', currentCount: 0, status: '원활' },
    ]
  }
}

// feat : 게이트 이름과 상태를 같이 보여주는 포맷터
function getGateLabel(g) {
  return `${g.gateName} (${g.status})`
}

// feat : 컴포넌트 마운트 시 호출
onMounted(() => {
  fetchGates() // 게이트 정보 먼저 로드
  fetchWorkOrders()
})

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function fmtKor(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`
}

const filterDate = ref(todayStr())
const filterProcess = ref('all')
const filterPartner = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')

const STATUS_LIST = [
  '작성 전',
  '초안 생성',
  '임시 저장',
  '승인 대기',
  '검토 중',
  '승인 완료',
  '반려',
  '작업 완료',
]
const STATUS_META = {
  '작성 전': { cls: 'bg-slate-100 text-slate-500 ring-slate-200', icon: Clock },
  '초안 생성': { cls: 'bg-flare-50 text-flare-700 ring-flare-200', icon: Sparkles },
  '임시 저장': { cls: 'bg-amber-50 text-amber-700 ring-amber-200', icon: Pencil },
  '승인 대기': { cls: 'bg-sky-50 text-sky-700 ring-sky-200', icon: Send },
  '검토 중': { cls: 'bg-violet-50 text-violet-700 ring-violet-200', icon: Eye },
  '승인 완료': { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  반려: { cls: 'bg-rose-50 text-rose-700 ring-rose-200', icon: AlertTriangle },
  '작업 완료': { cls: 'bg-emerald-100 text-emerald-800 ring-emerald-300', icon: CheckCircle2 },
}
function statusMeta(s) {
  return STATUS_META[s] || STATUS_META['작성 전']
}

function makeId() {
  return `WO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}
const workOrders = ref([])

const visibleTabs = computed(() => {
  if (currentRole.value === ROLES.WORKER)
    return [{ key: myProcess.value, label: `${myProcess.value} 공정` }]
  return [{ key: 'all', label: '전체' }, ...ALL_PROCESSES.map((p) => ({ key: p, label: p }))]
})

function onRoleChange(role) {
  currentRole.value = role
  if (role === ROLES.WORKER) filterProcess.value = myProcess.value
  else filterProcess.value = 'all'
}
function onMyProcessChange() {
  if (currentRole.value === ROLES.WORKER) filterProcess.value = myProcess.value
}

const filteredOrders = computed(() => {
  let r = workOrders.value
  if (currentRole.value === ROLES.WORKER) r = r.filter((o) => o.process === myProcess.value)
  else if (filterProcess.value !== 'all') r = r.filter((o) => o.process === filterProcess.value)
  if (filterDate.value) r = r.filter((o) => o.date === filterDate.value)
  if (filterPartner.value) r = r.filter((o) => o.partner.includes(filterPartner.value))
  if (filterStatus.value) r = r.filter((o) => o.status === filterStatus.value)
  if (searchKeyword.value.trim()) {
    const k = searchKeyword.value.trim().toLowerCase()
    r = r.filter(
      (o) =>
        o.location.toLowerCase().includes(k) ||
        o.workDetail.toLowerCase().includes(k) ||
        o.id.toLowerCase().includes(k),
    )
  }
  return r
})

const partners = computed(() => Array.from(new Set(workOrders.value.map((o) => o.partner))))
const missingProcesses = computed(() => {
  if (currentRole.value !== ROLES.MANAGER) return []
  const existing = new Set(
    workOrders.value.filter((o) => o.date === filterDate.value).map((o) => o.process),
  )
  return ALL_PROCESSES.filter((p) => !existing.has(p))
})

// feat : 게이트 혼잡도 계산 로직 (에러 픽스: GATES.value 사용 및 gateIdx 매핑)
const gateAssignment = computed(() => {
  const map = {}
  GATES.value.forEach((g) => (map[g.gateIdx] = { in: 0, out: 0 }))
  workOrders.value
    .filter((o) => o.date === filterDate.value)
    .forEach((o) => {
      o.equipment.forEach((eq) => {
        if (eq.gateIn && map[eq.gateIn]) map[eq.gateIn].in += eq.count || 0
        if (eq.gateOut && map[eq.gateOut]) map[eq.gateOut].out += eq.count || 0
      })
    })
  return GATES.value.map((g) => {
    const a = map[g.gateIdx] || { in: 0, out: 0 }
    const total = a.in + a.out
    const ratio = total / GATE_CAPACITY
    let level = 'low'
    if (ratio >= 1) level = 'high'
    else if (ratio >= 0.66) level = 'mid'
    return {
      ...g,
      in: a.in,
      out: a.out,
      total,
      ratio: Math.min(ratio, 1.5),
      level,
      name: g.gateName,
      desc: '',
    }
  })
})

const showEditor = ref(false)
const editing = ref(null)
const isNew = ref(false)
const draftSourcePlan = ref(null)
const draftAutoFilled = ref({})

function canEdit(order) {
  if (currentRole.value === ROLES.MANAGER) return false
  if (order.process !== myProcess.value) return false
  if (['승인 완료', '작업 완료'].includes(order.status)) return false
  return true
}

async function openCreate() {
  isNew.value = true
  editing.value = blankOrder()
  draftSourcePlan.value = null
  draftAutoFilled.value = {}
  showEditor.value = true
  await generateDraft(true)
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
    process:
      currentRole.value === ROLES.WORKER
        ? myProcess.value
        : filterProcess.value !== 'all'
          ? filterProcess.value
          : ALL_PROCESSES[0],
    partner: '',
    location: '',
    workTime: '',
    workers: 0,
    equipmentInput: { name: '', count: 1, gateIn: 1, gateOut: 1 },
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
    equipment: o.equipment.map((e) => ({ ...e })),
    equipmentInput: { name: '', count: 1, gateIn: 1, gateOut: 1 },
    files: o.files.map((f) => ({ ...f })),
    photos: (o.photos || []).map((p) => ({ ...p })),
    history: [...(o.history || [])],
  }
}

// feat : 워크오더 API 조회 + 실패 시 대비한 무적의 3중 Fallback 안전모드 장착
async function generateDraft(isAutoMode = false) {
  if (!editing.value) return
  try {
    const response = await api.get('/work-plan', { params: { planType: '주간' } })
    const plans = Array.isArray(response) ? response : response?.data?.data || response?.data || []

    const targetDate = editing.value.date
    const targetProcess = editing.value.process

    const toDateString = (dateVal) => {
      if (Array.isArray(dateVal))
        return `${dateVal[0]}-${String(dateVal[1]).padStart(2, '0')}-${String(dateVal[2]).padStart(2, '0')}`
      return dateVal
    }

    let targetPlan = plans.find(
      (p) =>
        (p.trade === targetProcess || p.tradeType === targetProcess) &&
        p.name &&
        p.name.includes('(명일 예정)') &&
        toDateString(p.startDate) === targetDate,
    )
    if (!targetPlan)
      targetPlan = plans.find(
        (p) =>
          (p.trade === targetProcess || p.tradeType === targetProcess) &&
          toDateString(p.startDate) === targetDate,
      )
    if (!targetPlan)
      targetPlan = plans.find(
        (p) =>
          (p.trade === targetProcess || p.tradeType === targetProcess) &&
          targetDate >= toDateString(p.startDate) &&
          targetDate <= toDateString(p.endDate),
      )

    if (!targetPlan) {
      if (!isAutoMode)
        alert(`DB에서 ${targetDate} 일자의 [${targetProcess}] 계획을 찾지 못했습니다.`)
      return
    }

    draftSourcePlan.value = { plan: targetPlan.name }
    editing.value.workPlanId = targetPlan.idx
    editing.value.location = targetPlan.location
    editing.value.partner = targetPlan.partner || ''
    editing.value.workTime = '07:00 ~ 17:00'
    editing.value.workers = targetPlan.requiredCount || 0
    editing.value.workDetail = targetPlan.name + (targetPlan.note ? '\n' + targetPlan.note : '')

    const eqList = []

    try {
      // 1순위: 깔끔하게 백엔드 DB에서 직접 조회 시도
      const eqRes = await api.get(`/work-order/draft-equipments/${targetPlan.idx}`)
      const equipments = eqRes.data?.data || eqRes.data || []

      if (equipments.length > 0) {
        equipments.forEach((eq, i) => {
          const korName = ENUM_TO_KOR_MAP[eq.equipmentName] || eq.equipmentName
          eqList.push({
            id: `eq_${Date.now()}_${i}`,
            name: korName,
            count: eq.equipmentCount || 1,
            gateIn: 1,
            gateOut: 1,
          })
        })
      } else {
        throw new Error('API 응답이 비어있음')
      }
    } catch (apiError) {
      console.warn('API 직접 조회 실패, 안전 모드로 자체 복구 시도:', apiError)
      // 2순위: 혹시 백엔드가 터졌으면 프론트가 문자열을 쪼개서라도 무조건 렌더링함!
      if (targetPlan.equipmentDisplay) {
        const items = targetPlan.equipmentDisplay.split(',')
        items.forEach((item, i) => {
          const match = item.trim().match(/(.+)\s+(\d+)대/)
          if (match)
            eqList.push({
              id: `eq_fb_${Date.now()}_${i}`,
              name: match[1].trim(),
              count: parseInt(match[2], 10),
              gateIn: 1,
              gateOut: 1,
            })
        })
      }
    }

    editing.value.equipment = eqList
    draftAutoFilled.value = {
      location: true,
      workTime: true,
      workers: true,
      workDetail: true,
      equipment: true,
    }
    if (editing.value.status === '작성 전') editing.value.status = '초안 생성'
  } catch (error) {
    console.error('계획 데이터 자동 연동 실패:', error)
  }
}

async function regenerateDraft() {
  if (!confirm('현재 입력 내용이 초안으로 다시 덮어쓰여집니다. 계속할까요?')) return
  await generateDraft()
}

function clearDraftHighlight(field) {
  if (draftAutoFilled.value[field]) draftAutoFilled.value[field] = false
}

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

const photoInputRef = ref(null)
const fileInputRef = ref(null)
function pickPhotos() {
  photoInputRef.value?.click()
}
function pickFiles() {
  fileInputRef.value?.click()
}

function onPhotoChange(e) {
  Array.from(e.target.files || []).forEach((f) => {
    if (!f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) =>
      editing.value.photos.push({
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        size: f.size,
        dataUrl: ev.target.result,
      })
    reader.readAsDataURL(f)
  })
  e.target.value = ''
}

function onFileChangeInput(e) {
  Array.from(e.target.files || []).forEach((f) =>
    editing.value.files.push({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type,
    }),
  )
  e.target.value = ''
}

function removePhoto(idx) {
  editing.value.photos.splice(idx, 1)
}
function removeFile(idx) {
  editing.value.files.splice(idx, 1)
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
  persist('임시 저장', '임시 저장')
}

// feat : 작업 지시서 제출 (숫자 타입인 gateIdx를 그대로 사용하도록 수정)
async function submitOrder() {
  const r = editing.value
  if (!r.partner.trim() || !r.location.trim() || !r.workTime.trim() || !r.workDetail.trim()) {
    alert('필수 항목을 입력해주세요.')
    return
  }

  // feat : 장비 리스트 매핑 (replace 제거 및 숫자 데이터 직접 전송)
  const equipmentList = r.equipment.map((eq) => ({
    // eq.gateIn이 이제 숫자(1, 2...)이므로 바로 할당합니다.
    gateIdx: eq.gateIn,
    equipmentName: EQUIPMENT_ENUM_MAP[eq.name] || 'EXCAVATOR',
    equipmentCount: eq.count,
  }))

  const requestPayload = {
    siteIdx: 1,
    partnerCompanyIdx: 1,
    workPlanId: r.workPlanId,
    tradeType: r.process,
    title: `[${r.process}] ${r.location} 작업지시서`,
    instructionContent: `${r.workDetail}\n\n[작업시간] ${r.workTime}\n[안전사항] ${r.safety}`,
    dueDate: r.date,
    workerCount: r.workers,
    equipments: equipmentList,
  }

  try {
    if (isNew.value) {
      requestPayload.statusCode = 'OPEN'
      await createWorkOrder(requestPayload)
      alert('작업 지시서가 성공적으로 전송되었습니다!')
    } else {
      const rawId = r.id.replace('WO-', '')
      requestPayload.statusCode = 'OPEN'
      await updateWorkOrder(rawId, requestPayload)
      alert('작업 지시서가 성공적으로 수정되었습니다!')
    }
    closeEditor()
    await fetchWorkOrders()
  } catch (error) {
    console.error('API 에러:', error)
    alert('저장 실패: 서버 오류가 발생했습니다.')
  }
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
  const idx = workOrders.value.findIndex((x) => x.id === r.id)
  if (idx >= 0) workOrders.value.splice(idx, 1, { ...r })
  else workOrders.value.push({ ...r })
  closeEditor()
}

const viewing = ref(null)
function openViewer(o) {
  viewing.value = o
}
function closeViewer() {
  viewing.value = null
}
function editViewing() {
  if (!viewing.value) return
  const order = viewing.value
  closeViewer()
  openEdit(order)
}
async function approve() {
  if (!confirm('이 작업 지시서를 승인하시겠습니까?')) return
  await updateOrderStatus('승인 완료', 'APPROVED')
}
async function reject() {
  if (!confirm('이 작업 지시서를 반려하시겠습니까?')) return
  await updateOrderStatus('반려', 'REJECTED')
}

// feat : 작업 지시서 상태 업데이트 (승인은 전용 엔드포인트 사용)
async function updateOrderStatus(newStatus, statusCodeStr) {
  const order = viewing.value
  if (!order) return

  const rawId = order.id.replace('WO-', '')

  try {
    if (statusCodeStr === 'APPROVED') {
      // ★ 승인: 전용 엔드포인트 호출 → 백엔드가 WorkPlan까지 동기화
      await approveWorkOrder(rawId)
    } else {
      // 반려/기타: 기존 방식 유지 (페이로드 구성)
      const requestPayload = {
        siteIdx: 1,
        partnerCompanyIdx: 1,
        tradeType: order.process,
        title: `[${order.process}] ${order.location} 작업지시서`,
        instructionContent: `${order.workDetail}\n\n[작업시간] ${order.workTime}\n[안전사항] ${order.safety}`,
        dueDate: order.date,
        workerCount: order.workers || 0,
        statusCode: statusCodeStr,
        equipments: order.equipment.map((eq) => {
          const safeGateIdx =
            typeof eq.gateIn === 'string' ? parseInt(eq.gateIn.replace(/\D/g, ''), 10) : eq.gateIn
          return {
            gateIdx: safeGateIdx || 1,
            equipmentName: EQUIPMENT_ENUM_MAP[eq.name] || 'EXCAVATOR',
            equipmentCount: eq.count || 1,
          }
        }),
      }
      await updateWorkOrder(rawId, requestPayload)
    }

    // 로컬 상태 업데이트
    const idx = workOrders.value.findIndex((o) => o.id === order.id)
    if (idx >= 0) {
      workOrders.value[idx].status = newStatus
      workOrders.value[idx].history.push({
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        who: '현장소장',
        what: newStatus,
      })
    }
    alert(`성공적으로 ${newStatus} 처리되었습니다!`)
    closeViewer()
  } catch (e) {
    console.error('상태 업데이트 API 오류:', e)
    alert('상태 변경에 실패했습니다. 서버 오류를 확인해주세요.')
  }
}

// feat : 게이트 고유 번호로 이름을 찾는 유틸 함수 수정
function gateName(id) {
  return GATES.value.find((g) => g.gateIdx === id)?.gateName || id
}
function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (showEditor.value) closeEditor()
  else if (viewing.value) closeViewer()
}

async function fetchWorkOrders() {
  try {
    const response = await getWorkOrderList()
    let serverData = Array.isArray(response)
      ? response
      : response?.data?.data || response?.data || []
    if (!Array.isArray(serverData)) return

    workOrders.value = serverData.map((dto) => {
      let locationStr = dto.title
        ? dto.title.replace(`[${dto.tradeType}] `, '').replace(' 작업지시서', '')
        : ''
      let detail = dto.instructionContent || ''
      let time = ''
      let safetyText = ''
      if (detail.includes('[작업시간]')) {
        const parts = detail.split('[작업시간]')
        detail = parts[0].trim()
        const subParts = parts[1].split('[안전사항]')
        time = subParts[0] ? subParts[0].trim() : ''
        if (subParts.length > 1) safetyText = subParts[1].trim()
      }
      return {
        id: `WO-${dto.idx}`,
        date: dto.dueDate,
        process: dto.tradeType,
        partner: '한울중기',
        location: locationStr,
        workTime: time,
        workers: dto.workerCount || 0,
        workDetail: detail,
        safety: safetyText,
        notes: '',
        status:
          dto.statusCode === 'APPROVED'
            ? '승인 완료'
            : dto.statusCode === 'REJECTED'
              ? '반려'
              : dto.statusCode === 'OPEN'
                ? '승인 대기'
                : '작성 전',
        author: '작성자',
        createdAt: '-',
        files: [],
        photos: [],
        history: [],
        equipment: (dto.equipments || []).map((eq) => ({
          id: `eq_${eq.idx}`,
          name: ENUM_TO_KOR_MAP[eq.equipmentName] || eq.equipmentName,
          count: eq.equipmentCount,
          gateIn: `G${eq.gateIdx}`,
          gateOut: `G${eq.gateIdx}`,
        })),
      }
    })
  } catch (e) {
    console.error('데이터 불러오기 실패:', e)
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  fetchWorkOrders()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 pb-6">
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">현장 운영</p>
        <h1 class="text-xl font-bold text-forena-900">작업 지시서</h1>
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
            @click="onRoleChange(ROLES.WORKER)"
          >
            <UserCog class="h-3.5 w-3.5" /> 공정 담당자
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="
              currentRole === ROLES.MANAGER
                ? 'bg-forena-800 text-white'
                : 'text-forena-600 hover:bg-forena-50'
            "
            @click="onRoleChange(ROLES.MANAGER)"
          >
            <ShieldCheck class="h-3.5 w-3.5" /> 현장 총 관리자
          </button>
        </div>
        <select
          v-if="currentRole === ROLES.WORKER"
          v-model="myProcess"
          @change="onMyProcessChange"
          class="rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400"
        >
          <option v-for="p in ALL_PROCESSES" :key="p" :value="p">{{ p }} 공정</option>
        </select>

        <button
          @click="openCreate"
          class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-flare-600"
        >
          <Plus class="h-3.5 w-3.5" /> 작업 지시서 작성
        </button>
      </div>
    </div>

    <div
      v-if="currentRole === ROLES.WORKER"
      class="flex shrink-0 items-start gap-2.5 rounded-xl border border-flare-200 bg-flare-50/60 px-4 py-3"
    >
      <UserCog class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <span class="font-bold text-flare-700">{{ myProcess }} 공정 담당자</span>입니다.
        {{ myProcess }} 공정 작업 지시서만 조회 · 작성 · 수정할 수 있습니다.
      </p>
    </div>
    <div
      v-else
      class="flex shrink-0 items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3"
    >
      <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <span class="font-bold text-emerald-700">현장 총 관리자</span>입니다. 전체 공정
        작업 지시서를 조회하고 승인/반려할 수 있습니다.
        <span v-if="missingProcesses.length" class="ml-1 font-bold text-rose-600">
          · 미작성 공정: {{ missingProcesses.join(', ') }}
        </span>
      </p>
    </div>

    <div
      class="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-forena-100 bg-white px-4 py-3"
    >
      <div class="flex items-center gap-1">
        <CalendarDays class="h-4 w-4 text-flare-600" />
        <input
          type="date"
          v-model="filterDate"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs font-semibold tabular-nums text-forena-800 outline-none focus:border-flare-400"
        />
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold text-forena-400">협력사</span>
        <select
          v-model="filterPartner"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs text-forena-800 outline-none focus:border-flare-400"
        >
          <option value="">전체</option>
          <option v-for="p in partners" :key="p">{{ p }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold text-forena-400">상태</span>
        <select
          v-model="filterStatus"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs text-forena-800 outline-none focus:border-flare-400"
        >
          <option value="">전체</option>
          <option v-for="s in STATUS_LIST" :key="s">{{ s }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1 rounded-md border border-forena-200 bg-white px-2">
        <Search class="h-3.5 w-3.5 text-forena-400" />
        <input
          v-model="searchKeyword"
          placeholder="위치/지시서 번호/내용"
          class="w-44 bg-transparent py-1 text-xs text-forena-800 outline-none placeholder:text-forena-300"
        />
      </div>
      <span class="ml-auto text-[11px] text-forena-500">
        조회 결과
        <span class="font-bold text-forena-800 tabular-nums">{{ filteredOrders.length }}</span
        >건
      </span>
    </div>

    <div
      v-if="currentRole === ROLES.MANAGER"
      class="shrink-0 rounded-xl border border-forena-100 bg-white p-4"
    >
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <DoorOpen class="h-4 w-4 text-flare-600" />
          <p class="text-sm font-bold text-forena-900">중장비 게이트 배정 현황</p>
          <span class="text-[11px] text-forena-400">{{ fmtKor(filterDate) }} 기준</span>
        </div>
        <span class="text-[10px] text-forena-400">게이트 수용 기준 {{ GATE_CAPACITY }}대</span>
      </div>
      <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div
          v-for="g in gateAssignment"
          :key="g.id"
          class="rounded-xl border p-3"
          :class="
            g.level === 'high'
              ? 'border-rose-200 bg-rose-50/40'
              : g.level === 'mid'
                ? 'border-amber-200 bg-amber-50/40'
                : 'border-forena-100 bg-forena-50/30'
          "
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold text-forena-900">{{ g.name }}</p>
              <p class="text-[10px] text-forena-500">{{ g.desc }}</p>
            </div>
            <span
              v-if="g.level === 'high'"
              class="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700"
            >
              <AlertTriangle class="h-3 w-3" /> 과밀
            </span>
            <span
              v-else-if="g.level === 'mid'"
              class="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700"
              >혼잡</span
            >
            <span
              v-else
              class="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
              >원활</span
            >
          </div>
          <div class="mt-2 flex items-center gap-3 text-[11px] text-forena-700">
            <span class="inline-flex items-center gap-1">
              <ChevronRight class="h-3 w-3 text-emerald-500" />입차
              <b class="tabular-nums">{{ g.in }}</b
              >대
            </span>
            <span class="inline-flex items-center gap-1">
              <ChevronLeft class="h-3 w-3 text-rose-500" />출차
              <b class="tabular-nums">{{ g.out }}</b
              >대
            </span>
          </div>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
            <div
              class="h-full rounded-full transition-all"
              :class="
                g.level === 'high'
                  ? 'bg-rose-500'
                  : g.level === 'mid'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              "
              :style="{ width: Math.min(g.ratio * 100, 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-forena-100">
      <button
        v-for="t in visibleTabs"
        :key="t.key"
        @click="filterProcess = t.key"
        class="shrink-0 border-b-2 px-4 py-2 text-xs font-bold transition"
        :class="
          filterProcess === t.key
            ? 'border-flare-500 text-flare-700'
            : 'border-transparent text-forena-500 hover:text-forena-700'
        "
      >
        {{ t.label }}
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div
        v-if="!filteredOrders.length"
        class="flex flex-col items-center justify-center gap-2 py-16 text-center"
      >
        <FileText class="h-8 w-8 text-slate-300" />
        <p class="text-sm text-slate-400">조회된 작업 지시서가 없습니다.</p>
        <button
          v-if="currentRole === ROLES.WORKER"
          @click="openCreate"
          class="mt-1 inline-flex items-center gap-1 rounded-md bg-flare-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-flare-600"
        >
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
            <tr
              v-for="o in filteredOrders"
              :key="o.id"
              class="cursor-pointer hover:bg-forena-50/40"
              @click="openViewer(o)"
            >
              <td class="px-3 py-3">
                <span
                  class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1"
                  :class="statusMeta(o.status).cls"
                >
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
              <td class="px-3 py-3 text-center font-bold tabular-nums text-forena-900">
                {{ o.workers }}
              </td>
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
                <button
                  @click="openViewer(o)"
                  class="rounded-md border border-forena-200 bg-white p-1.5 text-forena-600 hover:bg-forena-50"
                  title="상세 보기"
                >
                  <Eye class="h-3.5 w-3.5" />
                </button>
                <button
                  v-if="canEdit(o)"
                  @click="openEdit(o)"
                  class="ml-1 rounded-md border border-flare-200 bg-flare-50 p-1.5 text-flare-700 hover:bg-flare-100"
                  title="수정"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
        v-if="showEditor && editing"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeEditor"
      >
        <div
          class="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
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

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div class="rounded-xl border border-flare-200 bg-flare-50/40 p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-2.5">
                  <Sparkles class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
                  <div>
                    <p class="text-xs font-bold text-forena-900">
                      명일 작업 예정으로 초안 자동 생성
                    </p>
                    <p class="mt-0.5 text-[11px] text-forena-600">
                      전일 공사일보의 명일 작업 예정 내용을 불러와 작업 위치 · 시간 · 인원 · 장비 ·
                      상세를 자동 입력합니다. 게이트는 직접 지정하세요.
                    </p>
                  </div>
                </div>
                <div class="flex shrink-0 gap-1.5">
                  <button
                    v-if="!draftSourcePlan"
                    @click="generateDraft"
                    class="inline-flex items-center gap-1 rounded-md bg-flare-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-flare-600"
                  >
                    <Sparkles class="h-3 w-3" /> 초안 생성
                  </button>
                  <button
                    v-else
                    @click="regenerateDraft"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-300 bg-white px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-50"
                  >
                    <RefreshCw class="h-3 w-3" /> 다시 생성
                  </button>
                </div>
              </div>

              <div
                v-if="draftSourcePlan"
                class="mt-3 rounded-lg bg-white p-3 ring-1 ring-flare-100"
              >
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  원문 (전일 공사일보 명일 작업)
                </p>
                <p class="mt-1 text-[11px] leading-relaxed text-forena-700">
                  {{ draftSourcePlan.plan }}
                </p>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >작업 일 <span class="text-rose-500">*</span></label
                >
                <input
                  type="date"
                  v-model="editing.date"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                />
              </div>
              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                >
                  작업 시간 <span class="text-rose-500">*</span>
                  <span
                    v-if="draftAutoFilled.workTime"
                    class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700"
                    >자동</span
                  >
                </label>
                <input
                  v-model="editing.workTime"
                  placeholder="예: 07:00 ~ 17:00"
                  @input="clearDraftHighlight('workTime')"
                  class="w-full rounded-md border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                  :class="draftAutoFilled.workTime ? 'border-flare-300' : 'border-forena-200'"
                />
              </div>
              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >공정 명</label
                >
                <select
                  v-model="editing.process"
                  :disabled="currentRole === ROLES.WORKER"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400 disabled:bg-forena-50/40"
                >
                  <option v-for="p in ALL_PROCESSES" :key="p">{{ p }}</option>
                </select>
              </div>
              <div class="sm:col-span-2">
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >협력사 명 <span class="text-rose-500">*</span></label
                >
                <input
                  v-model="editing.partner"
                  placeholder="예: 한울중기"
                  class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                />
              </div>
              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                >
                  필요 인원
                  <span
                    v-if="draftAutoFilled.workers"
                    class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700"
                    >자동</span
                  >
                </label>
                <input
                  type="number"
                  min="0"
                  v-model.number="editing.workers"
                  @input="clearDraftHighlight('workers')"
                  class="w-full rounded-md border bg-white px-2.5 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400"
                  :class="draftAutoFilled.workers ? 'border-flare-300' : 'border-forena-200'"
                />
              </div>
              <div class="sm:col-span-3">
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                >
                  <MapPin class="mr-0.5 inline h-3 w-3" />작업 위치
                  <span class="text-rose-500">*</span>
                  <span
                    v-if="draftAutoFilled.location"
                    class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700"
                    >자동</span
                  >
                </label>
                <input
                  v-model="editing.location"
                  placeholder="예: 본동 3층 슬라브"
                  @input="clearDraftHighlight('location')"
                  class="w-full rounded-md border bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400"
                  :class="draftAutoFilled.location ? 'border-flare-300' : 'border-forena-200'"
                />
              </div>
            </div>

            <div class="mt-5 rounded-xl border border-forena-100 bg-forena-50/30 p-4">
              <div class="mb-2 flex items-center justify-between">
                <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                  <Truck class="h-3.5 w-3.5 text-flare-600" />
                  필요 중장비 + 게이트 배정 ({{ editing.equipment.length }})
                  <span
                    v-if="draftAutoFilled.equipment"
                    class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700"
                    >자동 입력됨</span
                  >
                </p>
              </div>

              <div
                class="grid grid-cols-2 gap-2 rounded-lg bg-white p-3 ring-1 ring-forena-100 sm:grid-cols-5"
              >
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-[10px] font-bold text-forena-500">장비명</label>
                  <select
                    v-model="editing.equipmentInput.name"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                </div>
                <div>
                  <label class="mb-1 block text-[10px] font-bold text-forena-500">대수</label>
                  <input
                    type="number"
                    min="1"
                    v-model.number="editing.equipmentInput.count"
                    class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs tabular-nums outline-none focus:border-flare-400"
                  />
                </div>
                <div class="flex-1">
                  <label class="block text-xs font-medium text-slate-500 mb-1">입차 게이트</label>
                  <select
                    v-model="editing.equipmentInput.gateIn"
                    class="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-flare-500 outline-none"
                  >
                    <option value="" disabled>게이트 선택</option>
                    <!-- feat : GATES 배열을 돌며 동적으로 옵션 생성 -->
                    <option
                      v-for="g in GATES"
                      :key="g.gateIdx"
                      :value="g.gateIdx"
                      :class="g.status === '혼잡' ? 'text-rose-500' : 'text-emerald-500'"
                    >
                      {{ getGateLabel(g) }}
                    </option>
                  </select>
                </div>
                <div class="flex-1">
                  <label class="block text-xs font-medium text-slate-500 mb-1">출차 게이트</label>
                  <select
                    v-model="editing.equipmentInput.gateOut"
                    class="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-flare-500 outline-none"
                  >
                    <option value="" disabled>게이트 선택</option>
                    <option v-for="g in GATES" :key="g.gateIdx" :value="g.gateIdx">
                      {{ getGateLabel(g) }}
                    </option>
                  </select>
                </div>
                <div class="sm:col-span-5">
                  <button
                    @click="addEquipment"
                    class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100"
                  >
                    <Plus class="h-3 w-3" /> 장비 추가
                  </button>
                </div>
              </div>

              <div v-if="editing.equipment.length" class="mt-2 space-y-1.5">
                <div
                  v-for="(eq, i) in editing.equipment"
                  :key="eq.id"
                  class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-forena-100"
                >
                  <Wrench class="h-3.5 w-3.5 text-forena-400" />
                  <span class="font-semibold text-xs text-forena-900">{{ eq.name }}</span>
                  <span
                    class="rounded-md bg-forena-50 px-1.5 py-0.5 text-[10px] font-bold text-forena-700 tabular-nums"
                    >{{ eq.count }}대</span
                  >
                  <span class="ml-auto flex items-center gap-1.5 text-[11px]">
                    <select
                      v-model="eq.gateIn"
                      class="rounded border border-forena-200 px-1.5 py-0.5 text-[11px] outline-none focus:border-flare-400"
                    >
                      <option v-for="g in GATES" :key="g.id" :value="g.id">
                        입 · {{ g.name }}
                      </option>
                    </select>
                    <ArrowRightLeft class="h-3 w-3 text-forena-400" />
                    <select
                      v-model="eq.gateOut"
                      class="rounded border border-forena-200 px-1.5 py-0.5 text-[11px] outline-none focus:border-flare-400"
                    >
                      <option v-for="g in GATES" :key="g.id" :value="g.id">
                        출 · {{ g.name }}
                      </option>
                    </select>
                  </span>
                  <button @click="removeEquipment(i)" class="text-slate-400 hover:text-rose-600">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div class="mt-3">
                <p class="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  현재 일자 게이트 혼잡도
                </p>
                <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  <div
                    v-for="g in gateAssignment"
                    :key="g.id"
                    class="rounded-md border px-2 py-1.5"
                    :class="
                      g.level === 'high'
                        ? 'border-rose-200 bg-rose-50/40'
                        : g.level === 'mid'
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-forena-100 bg-white'
                    "
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-forena-800">{{ g.name }}</span>
                      <span v-if="g.level === 'high'" class="text-[9px] font-bold text-rose-600"
                        >과밀</span
                      >
                      <span
                        v-else-if="g.level === 'mid'"
                        class="text-[9px] font-bold text-amber-600"
                        >혼잡</span
                      >
                      <span v-else class="text-[9px] font-bold text-emerald-600">원활</span>
                    </div>
                    <p class="mt-0.5 text-[10px] tabular-nums text-forena-500">
                      입차 {{ g.in }} · 출차 {{ g.out }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                >
                  작업 상세 내역 <span class="text-rose-500">*</span>
                  <span
                    v-if="draftAutoFilled.workDetail"
                    class="ml-1 rounded bg-flare-100 px-1 text-[9px] font-bold text-flare-700"
                    >자동</span
                  >
                </label>
                <textarea
                  v-model="editing.workDetail"
                  rows="5"
                  @input="clearDraftHighlight('workDetail')"
                  placeholder="작업 절차, 범위, 협의사항 등"
                  class="w-full resize-none rounded-md border bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"
                  :class="draftAutoFilled.workDetail ? 'border-flare-300' : 'border-forena-200'"
                ></textarea>
              </div>
              <div>
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >안전 유의사항</label
                >
                <textarea
                  v-model="editing.safety"
                  rows="5"
                  placeholder="추락/낙하/화재 등 위험요인 및 안전조치"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"
                ></textarea>
              </div>
              <div class="md:col-span-2">
                <label
                  class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
                  >특이사항</label
                >
                <textarea
                  v-model="editing.notes"
                  rows="2"
                  placeholder="기상, 선행공정 의존성, 추가 요청 등"
                  class="w-full resize-none rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-flare-400"
                ></textarea>
              </div>
            </div>

            <div class="mt-5 rounded-xl border border-forena-100 bg-forena-50/30 p-3.5">
              <div class="mb-2 flex items-center justify-between">
                <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                  <ImageIcon class="h-3.5 w-3.5 text-flare-600" />
                  현장 / 도면 사진 ({{ editing.photos.length }})
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
                v-if="editing.photos.length"
                class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
              >
                <div
                  v-for="(photo, i) in editing.photos"
                  :key="photo.id"
                  class="group relative aspect-square overflow-hidden rounded-lg border border-forena-200 bg-white"
                >
                  <img :src="photo.dataUrl" :alt="photo.name" class="h-full w-full object-cover" />
                  <button
                    @click="removePhoto(i)"
                    class="absolute right-1 top-1 rounded-md bg-slate-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600"
                  >
                    <Trash2 class="h-3 w-3" />
                  </button>
                  <div
                    class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-1.5 py-1"
                  >
                    <p class="truncate text-[9px] font-semibold text-white">{{ photo.name }}</p>
                  </div>
                </div>
              </div>
              <p v-else class="text-[11px] text-slate-400">첨부된 사진이 없습니다.</p>
            </div>

            <div class="mt-3 rounded-xl border border-forena-100 bg-forena-50/30 p-3.5">
              <div class="mb-2 flex items-center justify-between">
                <p class="flex items-center gap-1.5 text-[11px] font-bold text-forena-700">
                  <Paperclip class="h-3.5 w-3.5 text-flare-600" />
                  첨부 파일 ({{ editing.files.length }})
                  <span class="ml-1 text-[10px] font-normal text-forena-400"
                    >PDF · Excel · 이미지</span
                  >
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
              <ul v-if="editing.files.length" class="space-y-1.5">
                <li
                  v-for="(f, i) in editing.files"
                  :key="f.id"
                  class="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-forena-100"
                >
                  <span
                    class="rounded-md bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700"
                    >{{ fileBadge(f.type) }}</span
                  >
                  <span class="flex-1 truncate text-xs text-forena-800">{{ f.name }}</span>
                  <span class="shrink-0 text-[10px] text-forena-400 tabular-nums">{{
                    fmtSize(f.size)
                  }}</span>
                  <button @click="removeFile(i)" class="text-slate-400 hover:text-rose-600">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </li>
              </ul>
              <p v-else class="text-[11px] text-slate-400">첨부된 파일이 없습니다.</p>
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
                @click="submitOrder"
                class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600"
              >
                <Send class="h-3.5 w-3.5" /> 제출
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
        v-if="viewing"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeViewer"
      >
        <div
          class="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div
            class="flex shrink-0 items-center justify-between border-b border-forena-100 px-6 py-4"
          >
            <p class="text-sm font-bold text-forena-900">작업 상세</p>
            <div class="flex items-center gap-1">
              <button
                v-if="canEdit(viewing)"
                @click="editViewing"
                class="rounded-md p-1.5 text-forena-500 hover:bg-forena-50 hover:text-forena-800"
                title="수정"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button @click="closeViewer" class="text-slate-400 hover:text-forena-700">
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div class="flex items-start gap-2">
              <h2 class="text-lg font-bold text-forena-900">{{ viewing.location }}</h2>
              <span
                class="mt-1.5 rounded-md bg-forena-100 px-1.5 py-0.5 text-[10px] font-bold text-forena-700"
                >{{ viewing.process }}</span
              >
            </div>
            <p class="mt-0.5 font-mono text-xs text-forena-500">{{ viewing.id }}</p>

            <div class="mt-2 flex flex-wrap gap-1.5">
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1"
                :class="statusMeta(viewing.status).cls"
              >
                <component :is="statusMeta(viewing.status).icon" class="h-3 w-3" />
                {{ viewing.status }}
              </span>
              <span
                class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200"
              >
                {{ viewing.partner }}
              </span>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  작업 위치
                </p>
                <p class="mt-1 flex items-center gap-1 text-sm font-bold text-forena-900">
                  <MapPin class="h-3.5 w-3.5 text-flare-600" />{{ viewing.location }}
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  작업 시간
                </p>
                <p class="mt-1 text-sm font-bold tabular-nums text-forena-900">
                  {{ viewing.workTime }}
                </p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">
                  필요 인원
                </p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-forena-900">
                  {{ viewing.workers
                  }}<span class="text-sm font-normal text-slate-400 ml-1">명</span>
                </p>
              </div>
              <div class="rounded-xl border border-rose-200 bg-rose-50/40 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-rose-600">
                  작성자 / 작성일
                </p>
                <p class="mt-1 text-sm font-bold text-rose-700">
                  {{ viewing.author
                  }}<span class="ml-1 text-[11px] font-normal text-rose-500">{{
                    viewing.createdAt
                  }}</span>
                </p>
              </div>
            </div>

            <div class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <div class="flex items-center justify-between">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">
                  필요 장비 + 게이트
                </p>
                <span v-if="viewing.equipment.length" class="text-[10px] font-bold text-emerald-700"
                  >배정 완료</span
                >
              </div>
              <div v-if="viewing.equipment.length" class="mt-2 space-y-1.5">
                <div
                  v-for="eq in viewing.equipment"
                  :key="eq.id"
                  class="flex flex-wrap items-center gap-2 rounded-lg bg-forena-50/60 px-3 py-1.5"
                >
                  <Wrench class="h-3.5 w-3.5 text-forena-500" />
                  <span class="text-xs font-semibold text-forena-900"
                    >{{ eq.name }} {{ eq.count }}대</span
                  >
                  <span class="ml-auto inline-flex items-center gap-1 text-[11px] text-forena-700">
                    <span class="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-700"
                      >입 · {{ gateName(eq.gateIn) }}</span
                    >
                    <ArrowRightLeft class="h-3 w-3 text-forena-400" />
                    <span class="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-rose-700"
                      >출 · {{ gateName(eq.gateOut) }}</span
                    >
                  </span>
                </div>
              </div>
              <p v-else class="mt-1 text-xs text-slate-400">투입 장비 없음</p>
            </div>

            <div class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">
                작업 상세 내역
              </p>
              <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ viewing.workDetail }}</p>
            </div>

            <div
              v-if="viewing.safety"
              class="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3"
            >
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                안전 유의사항
              </p>
              <p class="mt-1 text-xs leading-relaxed text-amber-900">{{ viewing.safety }}</p>
            </div>

            <div v-if="viewing.notes" class="mt-3 rounded-xl border border-forena-100 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">특이사항</p>
              <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ viewing.notes }}</p>
            </div>

            <div
              v-if="viewing.files?.length"
              class="mt-3 rounded-xl border border-forena-100 px-4 py-3"
            >
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">관련 문서</p>
              <ul class="mt-1.5 space-y-1">
                <li
                  v-for="f in viewing.files"
                  :key="f.id"
                  class="flex items-center gap-2 text-xs text-forena-800"
                >
                  <FileText class="h-3.5 w-3.5 text-forena-400" />
                  <span class="flex-1 truncate">{{ f.name }}</span>
                  <span class="text-[10px] text-forena-400 tabular-nums">{{
                    fmtSize(f.size)
                  }}</span>
                  <button
                    class="rounded p-1 text-forena-400 hover:bg-forena-50 hover:text-forena-700"
                  >
                    <Eye class="h-3.5 w-3.5" />
                  </button>
                </li>
              </ul>
            </div>

            <div
              v-if="viewing.photos?.length"
              class="mt-3 rounded-xl border border-forena-100 px-4 py-3"
            >
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">현장 사진</p>
              <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                <div
                  v-for="photo in viewing.photos"
                  :key="photo.id"
                  class="aspect-square overflow-hidden rounded-lg border border-forena-200 bg-white"
                >
                  <img :src="photo.dataUrl" :alt="photo.name" class="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <div
              v-if="viewing.history?.length"
              class="mt-3 rounded-xl border border-forena-100 px-4 py-3"
            >
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-500">상태 이력</p>
              <ul class="mt-1.5 space-y-1">
                <li
                  v-for="(h, i) in viewing.history"
                  :key="i"
                  class="flex items-center gap-2 text-[11px]"
                >
                  <span class="font-mono text-forena-400 tabular-nums">{{ h.at }}</span>
                  <span class="text-forena-700">{{ h.who }}</span>
                  <span class="rounded bg-forena-50 px-1.5 py-0.5 font-bold text-forena-700">{{
                    h.what
                  }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div
            class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-white px-6 py-3"
          >
            <button
              v-if="
                currentRole === ROLES.MANAGER && ['승인 대기', '검토 중'].includes(viewing.status)
              "
              @click="reject"
              class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
            >
              <AlertTriangle class="h-3.5 w-3.5" /> 반려
            </button>
            <button
              v-if="
                currentRole === ROLES.MANAGER && ['승인 대기', '검토 중'].includes(viewing.status)
              "
              @click="approve"
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
