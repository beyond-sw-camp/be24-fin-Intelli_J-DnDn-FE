<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  X,
  ExternalLink,
  AlertTriangle,
  Pencil,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
} from 'lucide-vue-next'
import {
  getAffiliationKind,
  formatAffiliationDisplay,
  getPartnerCompanyName,
  employmentKindDisplay,
} from '@/utils/workerUi'
import { useStaffingBoardSync } from '@/composables/useStaffingBoardSync'
import {
  postStaffingAutoRecommend,
  postStaffingReset,
  postStaffingSave,
  getStaffingZones,
  getZoneSubDetail,
  getZoneSubWorkers,
  patchZoneSub,
  deleteZoneSubWorker,
  postZoneSubAssign,
  getStaffingWorkerPool,
} from '@/api/staffing'
import {
  mapAssignedWorkerRes,
  normalizeSaveSummaryRes,
  tradeNeedsFromZoneSubRes,
  buildZoneUpdateBody,
} from '@/utils/staffingAdapter'
import {
  fatigueTotalFromWorker,
  fatigueIsHighRisk,
  fatigueTooltipForWorker,
} from '@/utils/fatigueUi'

const T = {
  pageKicker: '투입 관리',
  boardTitle: '인력 배치',
  autoRec: '자동 추천 배치',
  confirm: '배치 확정 및 저장',
  zoneByZoneTitle: '구역별 인력 현황',
  zoneReset: '초기화',
  savePlacementConfirmTitle: '배치 확정 및 저장',
  savePlacementConfirmWarn:
    '배치 내용을 확인하여 근태 기록을 업데이트합니다.\n이대로 진행하시겠습니까?',
  savePlacementConfirmProceed: '진행',
  workerPoolTitle: '작업자 현황',
  needPerson: '필요 인원',
  currentAssign: '현재 배치',
  detailToggle: '상세 구역 · 투입 인원',
  workerTableName: '작업자 이름',
  colAffil: '소속',
  colTrade: '공종',
  colEmployment: '상용 / 일용',
  colFatigue: '피로도 점수',
  colFatiguePool: '피로도',
  colPlacement: '투입 현황',
  colProfile: '상세 프로필',
  poolHeaderSelectAll: '표시된 미투입 인원 전체 선택',
  showUnassignedOnly: '미투입',
  filterAffil: '소속 구분',
  filterPartnerCompany: '협력사 세부',
  allPartnerCompanies: '협력사 전체',
  searchWorker: '작업자 검색',
  searchPh: '이름·소속·공종으로 검색',
  assignTarget: '투입 구역',
  assignBtn: '선택 인력 투입',
  assignNeedSelection: '투입할 작업자와 구역을 선택해 주세요.',
  assignDone: '선택한 인력을 배치했습니다.',
  assignOverflowTitle: '투입 인원 초과',
  assignOverflowWarn:
    '선택 인력 수가 해당 구역에 투입 가능한 인원보다 많습니다.\n구역을 바꾸거나 선택 인원을 줄인 뒤 다시 시도해 주세요.',
  assignOverflowOk: '확인',
  count: '명',
  alertAuto: '부족 구역 위주로 투입 가능 인력을 자동 배치했습니다. (데모)',
  totalWorkers: '보드 총인원',
  poolListAggregate: '목록 집계',
  countUnit: '명',
  badgeDirect: '직영',
  badgePartner: '협력',
  badgeAgency: '인력',
  tradeWarn:
    '이 구역에 필요한 직종과 맞지 않을 수 있습니다. 배치는 가능하며, 안전/산업 관점에서 확인해 주세요.',
  fatigueTitle:
    '피로도 80점 이상 고위험. 안전사고·연속근무·교대간격·공종 위험도 항목 합(상한 100)으로 산정됩니다.',
  skillCarpenter: '목공',
  skillRebar: '철근',
  skillWelder: '용접',
  skillLabor: '인부',
  editZone: '구역 수정',
  zoneTitle: '구역명',
  zoneSubtitle: '설명',
  tradeNeedRows: '필요 직종별 인원',
  addTradeRow: '직종 추가',
  save: '저장',
  cancel: '취소',
  zoneTitleRequired: '구역명을 입력해 주세요.',
  removeZone: '구역에서 제거',
  workerDetail: '작업자 상세보기',
  poolEmpty: '표시할 작업자가 없습니다.',
  poolGroupToggle: '협력체 그룹 접기·펼치기',
}

const TRADE_OPTIONS = [
  { key: 'carpenter', label: () => T.skillCarpenter },
  { key: 'rebar', label: () => T.skillRebar },
  { key: 'welder', label: () => T.skillWelder },
  { key: 'labor', label: () => T.skillLabor },
]

const tradeLabel = (key) => {
  if (key === 'carpenter') return T.skillCarpenter
  if (key === 'rebar') return T.skillRebar
  if (key === 'welder') return T.skillWelder
  return T.skillLabor
}

let idSeq = 100

function cloneWorker(w) {
  return {
    ...w,
    skills: Array.isArray(w.skills) ? [...w.skills] : ['labor'],
    fatigue: w.fatigue ? { ...w.fatigue } : { nightShiftYesterday: false, consecutiveDays: 0 },
  }
}

function workerTagOk(w) {
  return w.workerTag === '작업자' && w.attendanceTag === '출근'
}

function fatigueScore(w) {
  return fatigueTotalFromWorker(w)
}

function rosterDateToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const rosterDate = ref(rosterDateToday())

function affiliationDisplayCell(w) {
  return w.affiliationLine ?? formatAffiliationDisplay(w.affiliation)
}

/** 소속 열: affiliationLine 의 조직 구간, 없으면 소속 문자열 */
function staffingOrgCell(w) {
  const line = String(w?.affiliationLine ?? '').trim()
  const idx = line.indexOf('/')
  if (idx !== -1) {
    const left = line.slice(0, idx).trim()
    if (left) return left
  }
  return formatAffiliationDisplay(w?.affiliation)
}

/** 공종 열: affiliationLine 의 공종 구간, 없으면 skills 라벨 */
function staffingTradeCell(w) {
  const line = String(w?.affiliationLine ?? '').trim()
  const idx = line.indexOf('/')
  if (idx !== -1) {
    const right = line.slice(idx + 1).trim()
    if (right) return right
  }
  const skills = Array.isArray(w?.skills) ? w.skills : []
  if (!skills.length) return '—'
  return skills.map((k) => tradeLabel(k)).join(', ')
}

function poolEmploymentDisplay(w) {
  return employmentKindDisplay(w?.employmentKind)
}

function poolEmploymentBadgeClass(label) {
  if (label === '상용') {
    return 'inline-flex rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-900 ring-1 ring-sky-200/80'
  }
  return 'inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/80'
}

const router = useRouter()

/** @type {import('vue').Ref<Array<{ id: string, title: string, expanded: boolean, subZones: Array<{ id: string, title: string, expanded: boolean, required: number, tradeNeeds: { trade: string, need: number }[], workers: object[] }> }>>} */
const zoneGroups = ref([])

const waiting = ref([])

const toasts = ref([])
let toastSeq = 0

function pushToast(message, variant = 'warning') {
  const id = ++toastSeq
  toasts.value = [...toasts.value, { id, message, variant }]
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 4200)
}

function flattenSubZones() {
  const out = []
  for (const g of zoneGroups.value) {
    for (const sz of g.subZones) {
      out.push({ group: g, subZone: sz })
    }
  }
  return out
}

function findSubZone(subZoneId) {
  for (const g of zoneGroups.value) {
    const sz = g.subZones.find((s) => s.id === subZoneId)
    if (sz) return { group: g, subZone: sz }
  }
  return null
}

const assignTargetSubZoneId = ref('')
const selectedWaitingIds = ref([])

function toggleSelectWaiting(id) {
  const i = selectedWaitingIds.value.indexOf(id)
  if (i >= 0) selectedWaitingIds.value = selectedWaitingIds.value.filter((x) => x !== id)
  else selectedWaitingIds.value = [...selectedWaitingIds.value, id]
}

const assignOptions = computed(() => {
  const opts = []
  for (const g of zoneGroups.value) {
    for (const sz of g.subZones) {
      opts.push({
        value: sz.id,
        label: `${g.title} · ${sz.title}`,
      })
    }
  }
  return opts
})

const boardKindBreakdown = computed(() => {
  let direct = 0
  let partner = 0
  let agency = 0
  const countW = (w) => {
    const k = getAffiliationKind(w.affiliation)
    if (k === 'direct') direct++
    else if (k === 'agency') agency++
    else partner++
  }
  for (const w of waiting.value) countW(w)
  for (const { subZone } of flattenSubZones()) {
    for (const w of subZone.workers) countW(w)
  }
  const total = direct + partner + agency
  return { direct, partner, agency, total }
})

function countTradeInZone(subZone, trade) {
  return subZone.workers.filter((w) => (w.skills || []).includes(trade)).length
}

function zoneTradeProgress(subZone) {
  const needs = subZone.tradeNeeds || []
  return needs.map((tn) => ({
    trade: tn.trade,
    label: tradeLabel(tn.trade),
    need: tn.need,
    fill: countTradeInZone(subZone, tn.trade),
  }))
}

function shouldWarnTradeMismatch(subZone, worker) {
  const needs = subZone.tradeNeeds || []
  if (!needs.length) return false
  const needSet = new Set(needs.map((n) => n.trade))
  const skills = worker.skills || []
  if (!skills.length) return false
  return !skills.some((s) => needSet.has(s))
}

function packState() {
  return {
    waiting: JSON.parse(JSON.stringify(waiting.value)),
    zoneGroups: JSON.parse(
      JSON.stringify(
        zoneGroups.value.map((g) => ({
          ...g,
          subZones: g.subZones.map((sz) => ({
            ...sz,
            workers: sz.workers.map(cloneWorker),
          })),
        })),
      ),
    ),
    idSeq,
    v: 2,
  }
}

function applyRemoteState(payload) {
  if (!payload) return
  if (payload.v === 2 && Array.isArray(payload.zoneGroups) && Array.isArray(payload.waiting)) {
    waiting.value = payload.waiting.map(cloneWorker)
    zoneGroups.value = payload.zoneGroups.map((g) => ({
      ...g,
      subZones: (g.subZones || []).map((sz) => ({
        ...sz,
        expanded: sz.expanded !== false,
        workers: (sz.workers || []).map(cloneWorker),
      })),
    }))
    if (typeof payload.idSeq === 'number' && payload.idSeq > idSeq) idSeq = payload.idSeq
    return
  }
  if (Array.isArray(payload.zones) && Array.isArray(payload.waiting)) {
    waiting.value = payload.waiting.map(cloneWorker)
    zoneGroups.value = payload.zones.map((z, i) => ({
      id: `g-mig-${i}`,
      title: z.title || '구역',
      expanded: true,
      subZones: [
        {
          id: z.id,
          title: z.subtitle || '상세',
          expanded: true,
          required: z.required,
          tradeNeeds: z.tradeNeeds || [],
          workers: (z.workers || []).map(cloneWorker),
        },
      ],
    }))
    if (typeof payload.idSeq === 'number' && payload.idSeq > idSeq) idSeq = payload.idSeq
  }
}

const tabId =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`

const { publish } = useStaffingBoardSync(tabId, applyRemoteState)

function syncPublish() {
  publish(packState())
}

async function reloadWaitingPool() {
  let affiliationKind
  if (poolAffiliationFilter.value === 'direct') affiliationKind = 'DIRECT'
  else if (poolAffiliationFilter.value === 'partner') affiliationKind = 'PARTNER'
  const keyword = workerPoolSearch.value.trim()
  const data = await getStaffingWorkerPool({
    rosterDate: rosterDate.value,
    affiliationKind,
    keyword: keyword || undefined,
    unassignedOnly: showOnlyUnassignedInPool.value,
  })
  const rows = data?.rows ?? []
  waiting.value = rows.filter((r) => !r.assigned).map((r) => mapAssignedWorkerRes(r))
}

async function reloadBoard() {
  try {
    const mains = await getStaffingZones()
    const groups = []
    for (const zm of mains || []) {
      const subZones = []
      for (const szSum of zm.subZones || []) {
        const [detail, assignedList] = await Promise.all([
          getZoneSubDetail(szSum.idx),
          getZoneSubWorkers(szSum.idx, rosterDate.value),
        ])
        const tradeNeeds = tradeNeedsFromZoneSubRes(detail?.tradeNeeds)
        const workers = (assignedList || []).map((row) => mapAssignedWorkerRes(row))
        subZones.push({
          id: String(szSum.idx),
          title: detail?.title ?? szSum.title,
          expanded: true,
          required: detail?.required ?? szSum.required,
          tradeNeeds,
          workers,
        })
      }
      groups.push({
        id: String(zm.idx),
        title: zm.title,
        expanded: true,
        subZones,
      })
    }
    zoneGroups.value = groups
    await reloadWaitingPool()
    syncPublish()
  } catch (e) {
    pushToast(e?.message || '인력 배치 정보를 불러오지 못했습니다.', 'danger')
  }
}

let poolReloadTimer = /** @type {ReturnType<typeof setTimeout> | null} */ (null)

onMounted(() => {
  reloadBoard()
})

function zoneFillRatio(subZone) {
  if (!subZone.required) return 1
  return Math.min(subZone.workers.length / subZone.required, 1)
}

function zoneBarClass(subZone) {
  const r = zoneFillRatio(subZone)
  if (r >= 1) return 'bg-emerald-500'
  if (r >= 0.5) return 'bg-amber-500'
  if (r > 0) return 'bg-rose-500'
  return 'bg-white ring-1 ring-inset ring-slate-200/80'
}

function subZoneCardBorderClass(subZone) {
  const r = zoneFillRatio(subZone)
  if (r >= 1) return 'border border-emerald-200/90'
  if (r >= 0.5) return 'border border-amber-200/90'
  if (r > 0) return 'border border-rose-200/90'
  return 'border border-slate-200/70'
}

function zoneGroupRequiredSum(group) {
  return group.subZones.reduce((s, z) => s + Math.max(0, Number(z.required) || 0), 0)
}

function zoneGroupFillRatio(group) {
  const need = zoneGroupRequiredSum(group)
  const assigned = zoneGroupAssignedSum(group)
  if (!need) return 1
  return Math.min(assigned / need, 1)
}

function zoneGroupCardBorderClass(group) {
  const r = zoneGroupFillRatio(group)
  if (r >= 1) return 'border border-emerald-200/90'
  if (r >= 0.5) return 'border border-amber-200/90'
  if (r > 0) return 'border border-rose-200/90'
  return 'border border-white ring-1 ring-slate-200/75'
}

function openWorkerProfile(w) {
  const id = w.profileId ?? w.id
  router.push({ name: 'siteWorkerProfile', params: { id: String(id) } })
}

async function removeFromSubZone(subZoneId, workerId) {
  const found = findSubZone(subZoneId)
  if (!found) return
  const w = found.subZone.workers.find((x) => x.id === workerId)
  const workerIdx = w?.workerIdx ?? Number(workerId)
  if (workerIdx == null || Number.isNaN(workerIdx)) return
  try {
    await deleteZoneSubWorker(subZoneId, workerIdx, rosterDate.value)
    await reloadBoard()
  } catch (e) {
    pushToast(e?.message || '구역에서 제거하지 못했습니다.', 'danger')
  }
}

async function resetAllZones() {
  try {
    await postStaffingReset(rosterDate.value)
    await reloadBoard()
  } catch (e) {
    pushToast(e?.message || '초기화에 실패했습니다.', 'danger')
  }
}

const saveConfirmOpen = ref(false)

function openSaveConfirm() {
  saveConfirmOpen.value = true
}

function closeSaveConfirm() {
  saveConfirmOpen.value = false
}

const assignOverflowOpen = ref(false)
/** @type {import('vue').Ref<{ selected: number, remaining: number } | null>} */
const assignOverflowMeta = ref(null)

function closeAssignOverflow() {
  assignOverflowOpen.value = false
  assignOverflowMeta.value = null
}

/** 작업자 현황 — 필터 */
const showOnlyUnassignedInPool = ref(false)
const poolAffiliationFilter = ref('')
const poolPartnerCompanyFilter = ref('')
const workerPoolSearch = ref('')

const poolAffiliationOptions = [
  { value: '', label: '전체' },
  { value: 'direct', label: '본사 소속' },
  { value: 'partner', label: '협력사' },
]

/** 화면에 등장 가능한 작업자 기준 협력사 목록 (미투입·구역 배치 모두) */
const poolPartnerCompanyOptions = computed(() => {
  const set = new Set()
  const consider = (w) => {
    if (!workerTagOk(w)) return
    if (getAffiliationKind(w.affiliation) !== 'partner') return
    const n = getPartnerCompanyName(w.affiliation, w.affiliationLine)
    if (n) set.add(n)
  }
  for (const w of waiting.value) consider(w)
  for (const g of zoneGroups.value) {
    for (const sz of g.subZones) {
      for (const w of sz.workers) consider(w)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
})

const staffingTableRows = computed(() => {
  const rows = []
  for (const w of waiting.value) {
    if (!workerTagOk(w)) continue
    rows.push({
      worker: w,
      placement: '미투입',
      waitingId: w.id,
      selectable: true,
    })
  }
  if (!showOnlyUnassignedInPool.value) {
    for (const g of zoneGroups.value) {
      for (const sz of g.subZones) {
        for (const w of sz.workers) {
          if (!workerTagOk(w)) continue
          rows.push({
            worker: w,
            placement: `${g.title} · ${sz.title}`,
            waitingId: null,
            selectable: false,
          })
        }
      }
    }
  }

  let out = rows
  const cat = poolAffiliationFilter.value
  if (cat) {
    out = out.filter((r) => getAffiliationKind(r.worker.affiliation) === cat)
  }
  const partnerCo = poolPartnerCompanyFilter.value
  if (cat === 'partner' && partnerCo) {
    out = out.filter(
      (r) => getPartnerCompanyName(r.worker.affiliation, r.worker.affiliationLine) === partnerCo,
    )
  }
  const q = workerPoolSearch.value.trim().toLowerCase()
  if (q) {
    out = out.filter((r) => {
      const name = String(r.worker.name ?? '').toLowerCase()
      const hay = [
        affiliationDisplayCell(r.worker),
        staffingOrgCell(r.worker),
        staffingTradeCell(r.worker),
        String(r.worker.affiliation ?? ''),
      ]
        .join(' ')
        .toLowerCase()
      return name.includes(q) || hay.includes(q)
    })
  }
  return out
})

/** 작업자 현황 — 협력체별 그룹 */
function poolRowGroupLabel(row) {
  const w = row.worker
  const kind = getAffiliationKind(w.affiliation)
  if (kind === 'direct') return '본사 직영'
  if (kind === 'agency') {
    const n = getPartnerCompanyName(w.affiliation, w.affiliationLine)
    return n ? `인력 · ${n}` : '인력사무소'
  }
  const n = getPartnerCompanyName(w.affiliation, w.affiliationLine)
  return n || '협력사'
}

const staffingTableGrouped = computed(() => {
  const rows = staffingTableRows.value
  const map = new Map()
  for (const row of rows) {
    const label = poolRowGroupLabel(row)
    if (!map.has(label)) map.set(label, [])
    map.get(label).push(row)
  }
  const labels = [...map.keys()].sort((a, b) => {
    if (a === '본사 직영') return -1
    if (b === '본사 직영') return 1
    return a.localeCompare(b, 'ko')
  })
  return labels.map((label) => ({ label, rows: map.get(label) }))
})

/** 그룹 접기 상태 — 키 없음 / true 는 펼침, false 만 접힘 */
const poolGroupExpanded = ref(/** @type Record<string, boolean> */ ({}))

function poolGroupIsOpen(label) {
  return poolGroupExpanded.value[label] !== false
}

function togglePoolGroupExpanded(label) {
  const open = poolGroupExpanded.value[label] !== false
  poolGroupExpanded.value = { ...poolGroupExpanded.value, [label]: !open }
}

function poolGroupSelectableIds(groupRows) {
  return groupRows.filter((r) => r.selectable && r.waitingId).map((r) => r.waitingId)
}

function poolGroupAllChecked(groupRows) {
  const ids = poolGroupSelectableIds(groupRows)
  return ids.length > 0 && ids.every((id) => selectedWaitingIds.value.includes(id))
}

function togglePoolGroupSelectAll(groupRows) {
  const ids = poolGroupSelectableIds(groupRows)
  if (!ids.length) return
  if (poolGroupAllChecked(groupRows)) {
    selectedWaitingIds.value = selectedWaitingIds.value.filter((id) => !ids.includes(id))
  } else {
    selectedWaitingIds.value = [...new Set([...selectedWaitingIds.value, ...ids])]
  }
}

watch(poolAffiliationFilter, (v) => {
  if (v !== 'partner') poolPartnerCompanyFilter.value = ''
})

watch(poolPartnerCompanyFilter, () => {
  selectedWaitingIds.value = []
})

watch([poolAffiliationFilter, workerPoolSearch, showOnlyUnassignedInPool], () => {
  selectedWaitingIds.value = []
  clearTimeout(poolReloadTimer)
  poolReloadTimer = setTimeout(() => {
    reloadWaitingPool().catch((e) =>
      pushToast(e?.message || '작업자 현황을 불러오지 못했습니다.', 'danger'),
    )
  }, 320)
})

const poolSelectableWaitingIds = computed(() =>
  staffingTableRows.value.filter((r) => r.selectable && r.waitingId).map((r) => r.waitingId),
)

const poolHeaderAllChecked = computed(() => {
  const ids = poolSelectableWaitingIds.value
  return ids.length > 0 && ids.every((id) => selectedWaitingIds.value.includes(id))
})

const poolHeaderSomeChecked = computed(() => {
  const ids = poolSelectableWaitingIds.value
  return ids.some((id) => selectedWaitingIds.value.includes(id)) && !poolHeaderAllChecked.value
})

const poolHeaderCheckboxRef = ref(null)

watch([poolHeaderAllChecked, poolHeaderSomeChecked, selectedWaitingIds, staffingTableRows], () => {
  nextTick(() => {
    const el = poolHeaderCheckboxRef.value
    if (el && 'indeterminate' in el) {
      el.indeterminate = poolHeaderSomeChecked.value
    }
  })
})

function togglePoolHeaderSelectAll() {
  const ids = poolSelectableWaitingIds.value
  if (!ids.length) return
  if (poolHeaderAllChecked.value) {
    selectedWaitingIds.value = selectedWaitingIds.value.filter((id) => !ids.includes(id))
  } else {
    selectedWaitingIds.value = [...new Set([...selectedWaitingIds.value, ...ids])]
  }
}

async function assignSelectedWorkers() {
  const targetId = assignTargetSubZoneId.value
  if (!targetId || selectedWaitingIds.value.length === 0) {
    pushToast(T.assignNeedSelection, 'warning')
    return
  }
  const found = findSubZone(targetId)
  if (!found) return

  const subZone = found.subZone
  const selectedAssignable = selectedWaitingIds.value.filter((wid) => {
    const w = waiting.value.find((x) => x.id === wid)
    return !!(w && workerTagOk(w))
  }).length

  const remaining = Math.max(0, subZone.required - subZone.workers.length)
  if (selectedAssignable > remaining) {
    assignOverflowMeta.value = {
      selected: selectedAssignable,
      remaining,
    }
    assignOverflowOpen.value = true
    return
  }

  const ids = [...selectedWaitingIds.value]
  const workerIndices = []
  for (const wid of ids) {
    const w = waiting.value.find((x) => x.id === wid)
    if (!w || !workerTagOk(w)) continue
    if (shouldWarnTradeMismatch(found.subZone, w)) {
      pushToast(T.tradeWarn, 'warning')
    }
    const idx = w.workerIdx ?? Number(wid)
    if (idx != null && !Number.isNaN(Number(idx))) workerIndices.push(Number(idx))
  }
  const unique = [...new Set(workerIndices)]
  if (!unique.length) return

  try {
    await postZoneSubAssign(Number(subZone.id), unique, rosterDate.value)
    selectedWaitingIds.value = []
    await reloadBoard()
    window.alert(T.assignDone)
  } catch (e) {
    const msg = String(e?.message || '')
    if (msg.includes('초과')) {
      assignOverflowMeta.value = {
        selected: unique.length,
        remaining,
      }
      assignOverflowOpen.value = true
    } else {
      pushToast(msg || '투입에 실패했습니다.', 'danger')
    }
  }
}

async function autoRecommend() {
  try {
    const raw = await postStaffingAutoRecommend(rosterDate.value)
    const { assignedCount, unassignedCount } = normalizeSaveSummaryRes(raw)
    await reloadBoard()
    pushToast(
      `본사 직영 미배치 인력 기준 신규 배치 ${assignedCount}명, 잔여 미배치 ${unassignedCount}명입니다.`,
      'success',
    )
  } catch (e) {
    pushToast(e?.message || '자동 추천 배치에 실패했습니다.', 'danger')
  }
}

async function executeFinalizeSave() {
  closeSaveConfirm()
  try {
    const raw = await postStaffingSave(rosterDate.value)
    const { assignedCount } = normalizeSaveSummaryRes(raw)
    await reloadBoard()
    pushToast(
      assignedCount > 0
        ? `배치 저장 완료. 근태 카드 구역 반영 ${assignedCount}건입니다.`
        : '배치 저장 완료. 반영할 배치가 없습니다.',
      'success',
    )
  } catch (e) {
    pushToast(e?.message || '최종 배치 저장에 실패했습니다.', 'danger')
  }
}

const zoneEditOpen = ref(false)
/** @type {import('vue').Ref<{ groupId: string, subZoneId: string, title: string, tradeRows: { trade: string, need: number }[] } | null>} */
const zoneEditDraft = ref(null)

function openZoneEdit(group, sz) {
  zoneEditDraft.value = {
    groupId: group.id,
    subZoneId: sz.id,
    title: sz.title,
    tradeRows: (sz.tradeNeeds || []).map((tn) => ({
      trade: tn.trade,
      need: Math.max(0, Number(tn.need) || 0),
    })),
  }
  if (!zoneEditDraft.value.tradeRows.length) {
    zoneEditDraft.value.tradeRows = [{ trade: 'labor', need: 1 }]
  }
  zoneEditOpen.value = true
}

function closeZoneEdit() {
  zoneEditOpen.value = false
  zoneEditDraft.value = null
}

function addZoneEditRow() {
  if (!zoneEditDraft.value) return
  zoneEditDraft.value.tradeRows.push({ trade: 'labor', need: 1 })
}

function removeZoneEditRow(index) {
  if (!zoneEditDraft.value || zoneEditDraft.value.tradeRows.length <= 1) return
  zoneEditDraft.value.tradeRows.splice(index, 1)
}

async function saveZoneEdit() {
  const draft = zoneEditDraft.value
  if (!draft) return
  const g = zoneGroups.value.find((x) => x.id === draft.groupId)
  if (!g) return
  const sz = g.subZones.find((x) => x.id === draft.subZoneId)
  if (!sz) return
  const title = draft.title.trim()
  if (!title) {
    pushToast(T.zoneTitleRequired, 'warning')
    return
  }
  const merged = {}
  for (const row of draft.tradeRows) {
    const need = Math.max(0, Math.floor(Number(row.need) || 0))
    if (!row.trade || need <= 0) continue
    merged[row.trade] = (merged[row.trade] || 0) + need
  }
  const tradeRows = Object.entries(merged).map(([trade, need]) => ({ trade, need }))
  try {
    await patchZoneSub(Number(sz.id), buildZoneUpdateBody(title, tradeRows))
    closeZoneEdit()
    await reloadBoard()
  } catch (e) {
    pushToast(e?.message || '구역 저장에 실패했습니다.', 'danger')
  }
}

function toastClass(v) {
  if (v === 'danger') return 'border-rose-200 bg-rose-50 text-rose-900'
  if (v === 'info') return 'border-sky-200 bg-sky-50 text-sky-900'
  return 'border-amber-200 bg-amber-50 text-amber-950'
}

function onToggleUnassignedFilter() {
  showOnlyUnassignedInPool.value = !showOnlyUnassignedInPool.value
}

function zoneGroupAssignedSum(group) {
  return group.subZones.reduce((s, z) => s + z.workers.length, 0)
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div class="flex shrink-0 flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">
          {{ T.pageKicker }}
        </p>
        <h1 class="text-xl font-bold text-forena-900">{{ T.boardTitle }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 hover:bg-flare-100"
          @click="autoRecommend"
        >
          {{ T.autoRec }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-forena-800 hover:to-forena-950"
          @click="openSaveConfirm"
        >
          {{ T.confirm }}
        </button>
      </div>
    </div>
    <section class="rounded-2xl border border-forena-100/90 bg-white/90 p-4 shadow-card sm:p-5">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-base font-bold text-forena-900">{{ T.zoneByZoneTitle }}</h2>
        <button
          type="button"
          class="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800"
          @click="resetAllZones"
        >
          {{ T.zoneReset }}
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="group in zoneGroups"
          :key="group.id"
          class="overflow-hidden rounded-lg bg-forena-50/30"
          :class="zoneGroupCardBorderClass(group)"
        >
          <button
            type="button"
            class="flex w-full flex-col gap-2 px-3 py-2.5 text-left transition hover:bg-forena-100/50 sm:flex-row sm:items-center sm:gap-3"
            @click="group.expanded = !group.expanded"
          >
            <div class="flex shrink-0 flex-wrap items-center gap-2">
              <ChevronRight v-if="!group.expanded" class="h-3.5 w-3.5 shrink-0 text-forena-500" />
              <ChevronDown v-else class="h-3.5 w-3.5 shrink-0 text-forena-500" />
              <span class="font-bold text-forena-900">{{ group.title }}</span>
              <span class="text-[11px] text-slate-500">({{ group.subZones.length }}개 상세)</span>
            </div>
            <div
              class="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold leading-snug"
            >
              <template v-for="(sz, idx) in group.subZones" :key="sz.id">
                <span
                  v-if="idx > 0"
                  class="hidden font-bold text-slate-300 sm:inline"
                  aria-hidden="true"
                  >·</span
                >
                <span class="whitespace-nowrap tabular-nums text-forena-900">
                  {{ sz.title
                  }}<span>{{ ' ' }}{{ sz.workers.length }}/{{ sz.required }}{{ T.count }}</span>
                </span>
              </template>
            </div>
            <span class="shrink-0 text-[10px] font-bold tabular-nums text-forena-600 sm:ml-auto">
              {{ zoneGroupAssignedSum(group) }}/{{ zoneGroupRequiredSum(group) }}{{ T.count }} 투입
            </span>
          </button>

          <div
            v-show="group.expanded"
            class="space-y-3 border-t border-forena-100/80 bg-white/90 px-2 py-3 sm:px-3"
          >
            <div
              v-for="sz in group.subZones"
              :key="sz.id"
              class="overflow-hidden rounded-lg border bg-white/95"
              :class="subZoneCardBorderClass(sz)"
            >
              <div
                class="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
                :class="sz.expanded ? 'border-b border-forena-100/90' : ''"
              >
                <button
                  type="button"
                  class="flex min-w-0 max-w-full shrink-0 items-center gap-1.5 text-left"
                  @click="sz.expanded = !sz.expanded"
                >
                  <ChevronRight v-if="!sz.expanded" class="h-3.5 w-3.5 shrink-0 text-forena-400" />
                  <ChevronDown v-else class="h-3.5 w-3.5 shrink-0 text-forena-400" />
                  <span class="truncate text-xs font-bold text-forena-900">{{ sz.title }}</span>
                </button>

                <div
                  class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 leading-tight sm:gap-x-3"
                >
                  <span
                    v-for="row in zoneTradeProgress(sz)"
                    :key="row.trade"
                    class="whitespace-nowrap text-xs font-bold tabular-nums"
                  >
                    <span class="text-forena-900">{{ row.label }}</span>
                    <span :class="row.fill >= row.need ? 'text-emerald-700' : 'text-rose-600'">
                      {{ ' ' }}{{ row.fill }}/{{ row.need }}{{ T.count }}
                    </span>
                  </span>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <div
                    class="h-1.5 w-[4.5rem] overflow-hidden rounded-full bg-forena-100 sm:w-24 md:w-32"
                  >
                    <div
                      class="h-full min-w-0 rounded-full transition-all duration-300"
                      :class="zoneBarClass(sz)"
                      :style="{ width: Math.round(zoneFillRatio(sz) * 100) + '%' }"
                    />
                  </div>
                  <span class="shrink-0 text-[10px] font-bold tabular-nums text-forena-800">
                    총 {{ sz.workers.length }}/{{ sz.required }}{{ T.count }}
                  </span>
                  <button
                    type="button"
                    class="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-forena-50 hover:text-flare-700"
                    :title="T.editZone"
                    @click.stop="openZoneEdit(group, sz)"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div v-if="sz.expanded" class="border-t border-forena-100 bg-white">
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[720px] text-left text-xs">
                    <thead
                      class="border-b border-forena-100 bg-forena-50/85 text-[10px] font-bold uppercase tracking-wide text-forena-500"
                    >
                      <tr>
                        <th class="w-8 px-3 py-2" />
                        <th class="px-3 py-2">{{ T.workerTableName }}</th>
                        <th class="px-3 py-2">{{ T.colAffil }}</th>
                        <th class="px-3 py-2">{{ T.colTrade }}</th>
                        <th class="px-3 py-2 whitespace-nowrap">{{ T.colEmployment }}</th>
                        <th class="px-3 py-2">{{ T.colFatigue }}</th>
                        <th class="px-3 py-2 text-center">{{ T.colProfile }}</th>
                        <th class="w-8 px-3 py-2 text-center" />
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-forena-100 text-forena-800">
                      <tr v-if="sz.workers.length === 0">
                        <td colspan="8" class="px-3 py-5 text-center text-slate-400">
                          {{ T.poolEmpty }}
                        </td>
                      </tr>
                      <tr v-for="w in sz.workers" :key="w.id" class="align-middle">
                        <td class="px-3 py-1.5" />
                        <td class="px-3 py-1.5">
                          <span class="font-semibold text-forena-900">{{ w.name }}</span>
                        </td>
                        <td class="px-3 py-1.5 text-[11px] font-medium">
                          {{ staffingOrgCell(w) }}
                        </td>
                        <td class="px-3 py-1.5 text-[11px] font-medium text-forena-700">
                          {{ staffingTradeCell(w) }}
                        </td>
                        <td class="px-3 py-1.5">
                          <span :class="poolEmploymentBadgeClass(poolEmploymentDisplay(w))">
                            {{ poolEmploymentDisplay(w) }}
                          </span>
                        </td>
                        <td class="px-3 py-1.5">
                          <span
                            :title="fatigueTooltipForWorker(w)"
                            class="tabular-nums font-bold"
                            :class="
                              fatigueIsHighRisk(fatigueScore(w), w)
                                ? 'text-rose-600'
                                : 'text-forena-800'
                            "
                          >
                            {{ fatigueScore(w) }}
                          </span>
                        </td>
                        <td class="px-3 py-1.5 text-center">
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-md border border-forena-200 bg-white px-2 py-0.5 text-[10px] font-bold text-forena-700 hover:bg-flare-50"
                            @click="openWorkerProfile(w)"
                          >
                            <ExternalLink class="h-3 w-3" />
                          </button>
                        </td>
                        <td class="px-3 py-1.5 text-center">
                          <button
                            type="button"
                            class="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            :title="T.removeZone"
                            @click="removeFromSubZone(sz.id, w.id)"
                          >
                            <X class="h-3.5 w-3.5" />
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
      </div>
    </section>

    <!-- 작업자 현황 -->
    <section class="rounded-2xl border border-forena-100/90 bg-white/90 p-4 shadow-card sm:p-5">
      <h2 class="mb-4 text-base font-bold text-forena-900">{{ T.workerPoolTitle }}</h2>

      <div class="mb-4 flex flex-col gap-3 rounded-xl border border-forena-100 bg-forena-50/40 p-3">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-3 lg:gap-y-2"
        >
          <div class="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
            <label class="text-[10px] font-bold uppercase tracking-wide text-forena-500">{{
              T.filterAffil
            }}</label>
            <select
              v-model="poolAffiliationFilter"
              class="w-full min-w-[9rem] rounded-xl border border-forena-200 bg-white px-3 py-2 text-xs font-semibold text-forena-900 outline-none focus:ring-2 focus:ring-flare-400/25 sm:w-44"
            >
              <option
                v-for="opt in poolAffiliationOptions"
                :key="opt.value || 'all'"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div
            v-if="poolAffiliationFilter === 'partner'"
            class="flex w-full min-w-0 flex-col gap-1 sm:w-auto"
          >
            <label class="text-[10px] font-bold uppercase tracking-wide text-forena-500">{{
              T.filterPartnerCompany
            }}</label>
            <select
              v-model="poolPartnerCompanyFilter"
              class="w-full min-w-[9rem] rounded-xl border border-forena-200 bg-white px-3 py-2 text-xs font-semibold text-forena-900 outline-none focus:ring-2 focus:ring-flare-400/25 sm:w-56"
            >
              <option value="">{{ T.allPartnerCompanies }}</option>
              <option v-for="name in poolPartnerCompanyOptions" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
          </div>

          <div class="w-full min-w-0 flex-1 lg:min-w-[220px]">
            <label
              class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500"
              >{{ T.searchWorker }}</label
            >
            <div class="relative">
              <Search
                class="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-flare-500/80"
                aria-hidden="true"
              />
              <input
                v-model="workerPoolSearch"
                type="search"
                :placeholder="T.searchPh"
                class="w-full rounded-xl border border-forena-200 bg-white py-2 pr-3 pl-9 text-xs text-forena-900 outline-none placeholder:text-slate-400 focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
              />
            </div>
          </div>

          <div
            class="flex w-full shrink-0 flex-wrap items-end gap-2 sm:w-auto"
            :class="selectedWaitingIds.length ? '' : 'lg:ml-auto'"
          >
            <button
              type="button"
              class="rounded-lg px-3 py-2 text-xs font-bold shadow-sm ring-1 transition"
              :class="
                showOnlyUnassignedInPool
                  ? 'bg-forena-800 text-white ring-forena-800'
                  : 'bg-white text-forena-700 ring-forena-200 hover:bg-forena-50'
              "
              @click="onToggleUnassignedFilter"
            >
              {{ T.showUnassignedOnly }}
            </button>
          </div>

          <div
            v-if="selectedWaitingIds.length"
            class="flex w-full flex-wrap items-end gap-2 sm:w-auto lg:ml-auto"
          >
            <select
              v-model="assignTargetSubZoneId"
              class="min-w-[12rem] rounded-xl border border-forena-200 bg-white px-3 py-2 text-xs font-semibold text-forena-900 outline-none focus:ring-2 focus:ring-flare-400/30"
            >
              <option value="" disabled>{{ T.assignTarget }}</option>
              <option v-for="opt in assignOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <button
              type="button"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-forena-800 hover:to-forena-950"
              @click="assignSelectedWorkers"
            >
              {{ T.assignBtn }}
            </button>
          </div>
        </div>
      </div>

      <div class="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span
          >{{ T.totalWorkers }}
          <strong class="text-forena-800">{{ boardKindBreakdown.total }}</strong
          >{{ T.countUnit }}</span
        >
        <span v-if="staffingTableRows.length"
          >{{ T.poolListAggregate }}
          <strong class="text-forena-800">{{ staffingTableRows.length }}</strong
          >{{ T.countUnit }}</span
        >
      </div>

      <div class="overflow-x-auto rounded-xl border border-forena-100">
        <table class="w-full min-w-[1000px] text-left text-sm">
          <thead
            class="border-b border-forena-100 bg-forena-50/70 text-[11px] font-bold uppercase tracking-wide text-forena-500"
          >
            <tr>
              <th class="w-11 min-w-[2.75rem] px-3 py-3 align-middle">
                <div class="flex items-center justify-center">
                  <input
                    ref="poolHeaderCheckboxRef"
                    type="checkbox"
                    class="h-4 w-4 shrink-0 rounded border-forena-300 text-flare-600 focus:ring-flare-500 disabled:cursor-not-allowed disabled:opacity-40"
                    :checked="poolHeaderAllChecked"
                    :disabled="!poolSelectableWaitingIds.length"
                    :title="T.poolHeaderSelectAll"
                    :aria-label="T.poolHeaderSelectAll"
                    @change="togglePoolHeaderSelectAll"
                  />
                </div>
              </th>
              <th class="px-3 py-3">{{ T.workerTableName }}</th>
              <th class="px-3 py-3">{{ T.colAffil }}</th>
              <th class="px-3 py-3">{{ T.colTrade }}</th>
              <th class="px-3 py-3 whitespace-nowrap">{{ T.colEmployment }}</th>
              <th class="px-3 py-3">{{ T.colFatiguePool }}</th>
              <th class="px-3 py-3">{{ T.colPlacement }}</th>
              <th class="px-3 py-3 text-center">{{ T.colProfile }}</th>
            </tr>
          </thead>
          <tbody class="text-forena-800">
            <tr v-if="staffingTableRows.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-slate-400">{{ T.poolEmpty }}</td>
            </tr>
            <template v-for="grp in staffingTableGrouped" :key="grp.label">
              <tr class="border-b border-forena-100 bg-indigo-50/75">
                <td class="w-11 min-w-[2.75rem] px-3 py-2 align-middle">
                  <div class="flex items-center justify-center" @click.stop>
                    <input
                      type="checkbox"
                      class="h-4 w-4 shrink-0 rounded border-forena-300 text-flare-600 focus:ring-flare-500 disabled:cursor-not-allowed disabled:opacity-40"
                      :checked="poolGroupAllChecked(grp.rows)"
                      :disabled="!poolGroupSelectableIds(grp.rows).length"
                      :aria-label="`${grp.label} ${T.poolHeaderSelectAll}`"
                      @change="togglePoolGroupSelectAll(grp.rows)"
                    />
                  </div>
                </td>
                <td colspan="7" class="px-3 py-2">
                  <div class="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      class="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-forena-700 hover:bg-white/90"
                      :aria-expanded="poolGroupIsOpen(grp.label)"
                      :aria-label="`${grp.label} ${T.poolGroupToggle}`"
                      @click="togglePoolGroupExpanded(grp.label)"
                    >
                      <ChevronDown v-if="poolGroupIsOpen(grp.label)" class="h-4 w-4" />
                      <ChevronRight v-else class="h-4 w-4" />
                    </button>
                    <span class="truncate text-xs font-bold text-flare-900">{{ grp.label }}</span>
                  </div>
                </td>
              </tr>
              <tr
                v-for="row in grp.rows"
                v-show="poolGroupIsOpen(grp.label)"
                :key="(row.waitingId || row.worker.id) + row.placement"
                class="border-b border-forena-50 transition hover:bg-flare-50/30"
              >
                <td class="w-11 min-w-[2.75rem] px-3 py-3 align-middle">
                  <div class="flex items-center justify-center">
                    <input
                      v-if="row.selectable && row.waitingId"
                      type="checkbox"
                      class="h-4 w-4 shrink-0 rounded border-forena-300 text-flare-600 focus:ring-flare-500"
                      :checked="selectedWaitingIds.includes(row.waitingId)"
                      @change="toggleSelectWaiting(row.waitingId)"
                    />
                  </div>
                </td>
                <td class="px-3 py-3">
                  <span class="font-semibold text-forena-900">{{ row.worker.name }}</span>
                </td>
                <td class="px-3 py-3 text-xs font-medium">
                  {{ staffingOrgCell(row.worker) }}
                </td>
                <td class="px-3 py-3 text-xs font-medium text-forena-700">
                  {{ staffingTradeCell(row.worker) }}
                </td>
                <td class="px-3 py-3">
                  <span :class="poolEmploymentBadgeClass(poolEmploymentDisplay(row.worker))">
                    {{ poolEmploymentDisplay(row.worker) }}
                  </span>
                </td>
                <td class="px-3 py-3">
                  <span
                    class="font-bold tabular-nums"
                    :title="fatigueTooltipForWorker(row.worker)"
                    :class="
                      fatigueIsHighRisk(fatigueScore(row.worker), row.worker)
                        ? 'text-rose-600'
                        : 'text-forena-900'
                    "
                  >
                    {{ fatigueScore(row.worker) }}
                  </span>
                </td>
                <td class="px-3 py-3">
                  <span
                    class="text-xs font-bold"
                    :class="row.placement === '미투입' ? 'text-amber-800' : 'text-emerald-800'"
                  >
                    {{ row.placement }}
                  </span>
                </td>
                <td class="px-3 py-3 text-center">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-forena-700 hover:bg-flare-50"
                    :title="T.workerDetail"
                    @click="openWorkerProfile(row.worker)"
                  >
                    <ExternalLink class="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="zoneEditOpen && zoneEditDraft"
        class="fixed inset-0 z-[90] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="T.editZone"
      >
        <button
          type="button"
          class="absolute inset-0 bg-forena-900/40 backdrop-blur-[1px]"
          :aria-label="T.cancel"
          @click="closeZoneEdit"
        />
        <div
          class="relative z-10 w-full max-w-md rounded-2xl border border-forena-100 bg-white p-5 shadow-xl ring-1 ring-black/5"
          @click.stop
        >
          <h3 class="text-base font-bold text-forena-900">{{ T.editZone }}</h3>
          <div class="mt-4 space-y-3">
            <div>
              <label class="block text-[11px] font-bold text-forena-600">{{ T.zoneTitle }}</label>
              <input
                v-model="zoneEditDraft.title"
                type="text"
                class="mt-1 w-full rounded-xl border border-forena-200 bg-white px-3 py-2 text-sm text-forena-900 outline-none ring-forena-300 focus:ring-2"
              />
            </div>
            <div>
              <p class="text-[11px] font-bold text-forena-600">{{ T.tradeNeedRows }}</p>
              <ul class="mt-2 space-y-2">
                <li
                  v-for="(row, idx) in zoneEditDraft.tradeRows"
                  :key="idx"
                  class="flex items-center gap-2"
                >
                  <select
                    v-model="row.trade"
                    class="min-w-0 flex-1 rounded-xl border border-forena-200 bg-white px-2 py-2 text-sm font-semibold text-forena-800 outline-none ring-forena-300 focus:ring-2"
                  >
                    <option v-for="opt in TRADE_OPTIONS" :key="opt.key" :value="opt.key">
                      {{ opt.label() }}
                    </option>
                  </select>
                  <input
                    v-model.number="row.need"
                    type="number"
                    min="0"
                    class="w-20 shrink-0 rounded-xl border border-forena-200 bg-white px-2 py-2 text-center text-sm font-bold tabular-nums text-forena-900 outline-none ring-forena-300 focus:ring-2"
                  />
                  <button
                    type="button"
                    class="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                    :disabled="zoneEditDraft.tradeRows.length <= 1"
                    @click="removeZoneEditRow(idx)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </li>
              </ul>
              <button
                type="button"
                class="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-flare-700 hover:bg-flare-50"
                @click="addZoneEditRow"
              >
                <Plus class="h-3.5 w-3.5" />
                {{ T.addTradeRow }}
              </button>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-xl border border-forena-200 bg-white px-4 py-2 text-sm font-bold text-forena-700 hover:bg-forena-50"
              @click="closeZoneEdit"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2 text-sm font-bold text-white hover:from-forena-800 hover:to-forena-950"
              @click="saveZoneEdit"
            >
              {{ T.save }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="assignOverflowOpen"
        class="fixed inset-0 z-[96] flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="assign-overflow-title"
        aria-describedby="assign-overflow-desc"
      >
        <button
          type="button"
          class="absolute inset-0 bg-forena-900/40 backdrop-blur-[1px]"
          :aria-label="T.cancel"
          @click="closeAssignOverflow"
        />
        <div
          class="relative z-10 w-full max-w-sm rounded-2xl border border-forena-100 bg-white p-6 text-center shadow-xl ring-1 ring-black/5"
          @click.stop
        >
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-1 ring-amber-200/80"
            aria-hidden="true"
          >
            <AlertTriangle class="h-6 w-6 shrink-0" stroke-width="2" />
          </div>
          <h3 id="assign-overflow-title" class="text-base font-bold text-forena-900">
            {{ T.assignOverflowTitle }}
          </h3>
          <p
            id="assign-overflow-desc"
            class="mt-3 whitespace-pre-line text-sm leading-relaxed text-forena-600"
          >
            {{ T.assignOverflowWarn }}
          </p>
          <p
            v-if="assignOverflowMeta"
            class="mt-3 rounded-lg bg-forena-50 px-3 py-2 text-xs font-semibold tabular-nums text-forena-800"
          >
            현재 선택 {{ assignOverflowMeta.selected }}{{ T.count }} · 투입 가능
            {{ assignOverflowMeta.remaining }}{{ T.count }}
          </p>
          <div class="mt-6 flex justify-center">
            <button
              type="button"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-6 py-2 text-sm font-bold text-white hover:from-forena-800 hover:to-forena-950"
              @click="closeAssignOverflow"
            >
              {{ T.assignOverflowOk }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="saveConfirmOpen"
        class="fixed inset-0 z-[95] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-confirm-title"
        aria-describedby="save-confirm-desc"
      >
        <button
          type="button"
          class="absolute inset-0 bg-forena-900/40 backdrop-blur-[1px]"
          :aria-label="T.cancel"
          @click="closeSaveConfirm"
        />
        <div
          class="relative z-10 w-full max-w-sm rounded-2xl border border-forena-100 bg-white p-6 text-center shadow-xl ring-1 ring-black/5"
          @click.stop
        >
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-forena-100 text-forena-700 ring-1 ring-forena-200/80"
            aria-hidden="true"
          >
            <AlertTriangle class="h-6 w-6 shrink-0" stroke-width="2" />
          </div>
          <h3 id="save-confirm-title" class="text-base font-bold text-forena-900">
            {{ T.savePlacementConfirmTitle }}
          </h3>
          <p
            id="save-confirm-desc"
            class="mt-3 whitespace-pre-line text-sm leading-relaxed text-forena-600"
          >
            {{ T.savePlacementConfirmWarn }}
          </p>
          <div class="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="rounded-xl border border-forena-200 bg-white px-4 py-2 text-sm font-bold text-forena-700 hover:bg-forena-50"
              @click="closeSaveConfirm"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2 text-sm font-bold text-white hover:from-forena-800 hover:to-forena-950"
              @click="executeFinalizeSave"
            >
              {{ T.savePlacementConfirmProceed }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        class="pointer-events-none fixed bottom-4 right-4 z-[80] flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold shadow-lg ring-1 ring-black/5"
          :class="toastClass(t.variant)"
        >
          <AlertTriangle
            v-if="t.variant === 'warning'"
            class="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <span>{{ t.message }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
