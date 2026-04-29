<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  MapPin,
  X,
  ExternalLink,
  AlertTriangle,
  Pencil,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next'
import {
  getAffiliationKind,
  formatAffiliationDisplay,
} from '@/utils/workerAffiliation'
import { useStaffingBoardSync } from '@/composables/useStaffingBoardSync'

const T = {
  kicker: '인력 배치',
  boardTitle: '인력 배치 관리 보드',
  hint: '작업자 투입 현황에서 인력을 선택해 구역에 배치할 수 있습니다.',
  autoRec: '자동 추천 배치',
  confirm: '배치 확정 및 저장',
  zoneByZoneTitle: '구역별 인력 투입 현황',
  workerPoolTitle: '작업자 투입 현황',
  needPerson: '필요 인원',
  currentAssign: '현재 배치',
  tradeToTitle: '구역 필요 직종(T.O)',
  detailToggle: '상세 구역 · 투입 인원',
  workerTableName: '작업자 이름',
  colAffil: '소속',
  colFatigue: '피로도 점수',
  colPlacement: '투입 현황',
  colProfile: '상세 프로필',
  selectAll: '모두 선택',
  showUnassignedOnly: '미투입 인원만 보기',
  pageLabel: '표시',
  pageUnit: '명',
  assignTarget: '투입 구역',
  assignBtn: '선택 인력 투입',
  assignNeedSelection: '투입할 작업자와 구역을 선택해 주세요.',
  assignDone: '선택한 인력을 배치했습니다.',
  count: '명',
  alertAuto: '부족 구역 위주로 투입 가능 인력을 자동 배치했습니다. (데모)',
  alertSave: '현재 배치가 확정되어 저장되었습니다. (데모)',
  totalWorkers: '보드 총인원',
  countUnit: '명',
  badgeDirect: '직영',
  badgePartner: '협력',
  badgeAgency: '인력',
  tradeWarn:
    '이 구역에 필요한 직종과 맞지 않을 수 있습니다. 배치는 가능하며, 안전/산업 관점에서 확인해 주세요.',
  fatigueTitle:
    '안전 주의: 전날 야간 근무 또는 연속 근무 일수가 높음 (피로도 누적 의십)',
  skillCarpenter: '목수',
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
    fatigue: w.fatigue
      ? { ...w.fatigue }
      : { nightShiftYesterday: false, consecutiveDays: 0 },
  }
}

function workerTagOk(w) {
  return w.workerTag === '작업자' && w.attendanceTag === '출근'
}

function fatigueScore(w) {
  const f = w.fatigue || {}
  let s = (f.consecutiveDays ?? 0) * 12
  if (f.nightShiftYesterday) s += 28
  return Math.min(100, Math.round(s))
}

function affiliationDisplayCell(w) {
  return w.affiliationLine ?? formatAffiliationDisplay(w.affiliation)
}

const router = useRouter()

/** @type {import('vue').Ref<Array<{ id: string, title: string, expanded: boolean, subZones: Array<{ id: string, title: string, expanded: boolean, required: number, tradeNeeds: { trade: string, need: number }[], workers: object[] }> }>>} */
const zoneGroups = ref([
  {
    id: 'g-a',
    title: 'A구역',
    expanded: true,
    subZones: [
      {
        id: 'z-a-102',
        title: '102동',
        expanded: true,
        required: 4,
        tradeNeeds: [
          { trade: 'carpenter', need: 2 },
          { trade: 'rebar', need: 1 },
          { trade: 'welder', need: 1 },
        ],
        workers: [
          {
            id: 'z1',
            profileId: 11,
            name: '한현장',
            affiliation: '협력사 (태양건설)',
            affiliationLine: '태양건설 / 목수',
            workerTag: '작업자',
            attendanceTag: '출근',
            nationality: '내국인',
            skills: ['carpenter'],
            fatigue: { nightShiftYesterday: false, consecutiveDays: 3 },
          },
          {
            id: 'z2',
            profileId: 12,
            name: '서대리',
            affiliation: '본사 소속',
            affiliationLine: '한화건설 / 직영',
            workerTag: '작업자',
            attendanceTag: '출근',
            nationality: '내국인',
            skills: ['labor'],
            fatigue: { nightShiftYesterday: true, consecutiveDays: 4 },
          },
        ],
      },
      {
        id: 'z-a-103',
        title: '103동',
        expanded: false,
        required: 3,
        tradeNeeds: [
          { trade: 'carpenter', need: 1 },
          { trade: 'labor', need: 2 },
        ],
        workers: [],
      },
      {
        id: 'z-a-pk',
        title: '지하주차장',
        expanded: false,
        required: 2,
        tradeNeeds: [
          { trade: 'welder', need: 1 },
          { trade: 'labor', need: 1 },
        ],
        workers: [],
      },
    ],
  },
  {
    id: 'g-b',
    title: 'B구역',
    expanded: true,
    subZones: [
      {
        id: 'z-b-1',
        title: '1동 골조',
        expanded: true,
        required: 6,
        tradeNeeds: [
          { trade: 'rebar', need: 3 },
          { trade: 'carpenter', need: 2 },
          { trade: 'labor', need: 1 },
        ],
        workers: [
          {
            id: 'z3',
            profileId: 13,
            name: '오형사',
            affiliation: '협력사 (우주산업)',
            affiliationLine: '우주산업 / 철근',
            workerTag: '작업자',
            attendanceTag: '출근',
            nationality: '외국인',
            skills: ['rebar'],
            fatigue: { nightShiftYesterday: false, consecutiveDays: 7 },
          },
        ],
      },
      {
        id: 'z-b-2',
        title: '2동 마감',
        expanded: false,
        required: 3,
        tradeNeeds: [
          { trade: 'welder', need: 1 },
          { trade: 'labor', need: 2 },
        ],
        workers: [],
      },
    ],
  },
])

const waiting = ref([
  {
    id: 'w1',
    profileId: 1,
    name: '김철수',
    affiliation: '협력사 (태양건설)',
    affiliationLine: '태양건설 / 인력',
    workerTag: '작업자',
    attendanceTag: '출근',
    nationality: '내국인',
    skills: ['carpenter', 'labor'],
    fatigue: { nightShiftYesterday: true, consecutiveDays: 2 },
  },
  {
    id: 'w2',
    profileId: 2,
    name: '이영희',
    affiliation: '협력사 (우주산업)',
    affiliationLine: '우주산업 / 철근',
    workerTag: '작업자',
    attendanceTag: '출근',
    nationality: '내국인',
    skills: ['rebar'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 6 },
  },
  {
    id: 'w3',
    profileId: 3,
    name: '박민수',
    affiliation: '인력사무소 (개인)',
    affiliationLine: '개인 / 파견',
    workerTag: '작업자',
    attendanceTag: '출근',
    nationality: '외국인',
    skills: ['labor'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 1 },
  },
  {
    id: 'w4',
    profileId: 4,
    name: '정대리',
    affiliation: '본사 소속',
    affiliationLine: '한화건설 / 직영',
    workerTag: '작업자',
    attendanceTag: '출근',
    nationality: '내국인',
    skills: ['welder', 'labor'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 0 },
  },
  {
    id: 'w5',
    profileId: 5,
    name: '최작업',
    affiliation: '협력사 (태양건설)',
    affiliationLine: '태양건설 / 목수',
    workerTag: '작업자',
    attendanceTag: '출근',
    nationality: '내국인',
    skills: ['carpenter'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 5 },
  },
  {
    id: 'w6',
    profileId: 6,
    name: '준비중',
    affiliation: '협력사 (대한건설)',
    affiliationLine: '대한건설 / 인력',
    workerTag: '관리자',
    attendanceTag: '출근',
    nationality: '내국인',
    skills: ['labor'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 0 },
  },
])

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

onMounted(() => {
  syncPublish()
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

function openWorkerProfile(w) {
  const id = w.profileId ?? w.id
  router.push({ name: 'siteWorkerProfile', params: { id: String(id) } })
}

function removeFromSubZone(subZoneId, workerId) {
  const found = findSubZone(subZoneId)
  if (!found) return
  const w = found.subZone.workers.find((x) => x.id === workerId)
  found.subZone.workers = found.subZone.workers.filter((x) => x.id !== workerId)
  if (w) {
    waiting.value.push(
      cloneWorker({
        ...w,
        id: 'w-' + String(++idSeq),
      }),
    )
  }
  syncPublish()
}

/** 작업자 투입 현황 — 표시 행 */
const showOnlyUnassignedInPool = ref(false)
const poolPageSize = ref(10)
const poolPage = ref(1)

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
  return rows
})

const poolTotalPages = computed(() =>
  Math.max(1, Math.ceil(staffingTableRows.value.length / poolPageSize.value)),
)

const paginatedPoolRows = computed(() => {
  const start = (poolPage.value - 1) * poolPageSize.value
  return staffingTableRows.value.slice(start, start + poolPageSize.value)
})

function setPoolPageSize(n) {
  poolPageSize.value = n
  poolPage.value = 1
  selectedWaitingIds.value = []
}

function selectAllOnPage() {
  const ids = paginatedPoolRows.value.filter((r) => r.selectable && r.waitingId).map((r) => r.waitingId)
  const allSelected = ids.length > 0 && ids.every((id) => selectedWaitingIds.value.includes(id))
  if (allSelected) {
    selectedWaitingIds.value = selectedWaitingIds.value.filter((id) => !ids.includes(id))
  } else {
    const set = new Set([...selectedWaitingIds.value, ...ids])
    selectedWaitingIds.value = [...set]
  }
}

function assignSelectedWorkers() {
  const targetId = assignTargetSubZoneId.value
  if (!targetId || selectedWaitingIds.value.length === 0) {
    pushToast(T.assignNeedSelection, 'warning')
    return
  }
  const found = findSubZone(targetId)
  if (!found) return

  const ids = [...selectedWaitingIds.value]
  for (const wid of ids) {
    const w = waiting.value.find((x) => x.id === wid)
    if (!w || !workerTagOk(w)) continue
    if (shouldWarnTradeMismatch(found.subZone, w)) {
      pushToast(T.tradeWarn, 'warning')
    }
    waiting.value = waiting.value.filter((x) => x.id !== wid)
    found.subZone.workers.push({
      ...cloneWorker(w),
      id: 'z-' + String(++idSeq),
    })
  }
  selectedWaitingIds.value = []
  syncPublish()
  window.alert(T.assignDone)
}

function autoRecommend() {
  const pool = waiting.value.filter(workerTagOk).map(cloneWorker)
  waiting.value = waiting.value.filter((w) => !workerTagOk(w))
  for (const { subZone } of flattenSubZones()) {
    while (subZone.workers.length < subZone.required && pool.length) {
      const w = pool.shift()
      subZone.workers.push({ ...cloneWorker(w), id: 'z-' + String(++idSeq) })
    }
  }
  for (const w of pool) {
    waiting.value.push({
      ...cloneWorker(w),
      id: 'w-' + String(++idSeq),
    })
  }
  syncPublish()
  window.alert(T.alertAuto)
}

function confirmSave() {
  syncPublish()
  window.alert(T.alertSave)
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

function saveZoneEdit() {
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
  const tradeNeeds = Object.entries(merged).map(([trade, need]) => ({ trade, need }))
  sz.title = title
  sz.tradeNeeds = tradeNeeds
  const sum = tradeNeeds.reduce((s, t) => s + t.need, 0)
  sz.required = sum > 0 ? sum : Math.max(sz.workers.length, 1)
  syncPublish()
  closeZoneEdit()
}

function toastClass(v) {
  if (v === 'danger') return 'border-rose-200 bg-rose-50 text-rose-900'
  if (v === 'info') return 'border-sky-200 bg-sky-50 text-sky-900'
  return 'border-amber-200 bg-amber-50 text-amber-950'
}

function onToggleUnassignedFilter() {
  showOnlyUnassignedInPool.value = !showOnlyUnassignedInPool.value
  poolPage.value = 1
  selectedWaitingIds.value = []
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card md:p-6"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
          >
            <MapPin class="h-5 w-5" />
          </span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">{{ T.kicker }}</p>
            <h1 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.boardTitle }}</h1>
            <p class="mt-1 text-sm text-forena-600/90">{{ T.hint }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-xl border border-flare-200 bg-flare-50 px-4 py-2.5 text-sm font-bold text-forena-800 shadow-sm transition hover:bg-flare-100/80"
            @click="autoRecommend"
          >
            {{ T.autoRec }}
          </button>
          <button
            type="button"
            class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
            @click="confirmSave"
          >
            {{ T.confirm }}
          </button>
        </div>
      </div>
    </div>

    <section class="rounded-2xl border border-forena-100/90 bg-white/90 p-4 shadow-card sm:p-5">
      <h2 class="mb-3 text-base font-bold text-forena-900">{{ T.zoneByZoneTitle }}</h2>

      <div class="space-y-2">
        <div
          v-for="group in zoneGroups"
          :key="group.id"
          class="overflow-hidden rounded-lg border border-forena-100 bg-forena-50/30"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-forena-100/50"
            @click="group.expanded = !group.expanded"
          >
            <ChevronRight v-if="!group.expanded" class="h-3.5 w-3.5 shrink-0 text-forena-500" />
            <ChevronDown v-else class="h-3.5 w-3.5 shrink-0 text-forena-500" />
            <span class="font-bold text-forena-900">{{ group.title }}</span>
            <span class="text-[11px] text-slate-500">({{ group.subZones.length }}개 상세)</span>
            <span class="ml-auto text-[10px] font-bold text-forena-500">{{ group.subZones.reduce((s, z) => s + z.workers.length, 0) }}{{ T.count }} 투입</span>
          </button>

          <div v-show="group.expanded" class="space-y-1.5 border-t border-forena-100/80 bg-white/90 px-2 py-2 sm:px-3">
            <div
              v-for="sz in group.subZones"
              :key="sz.id"
              class="rounded-lg border bg-white/95"
              :class="subZoneCardBorderClass(sz)"
            >
              <div class="flex items-center gap-2 px-2 py-1.5 sm:px-3">
                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  @click="sz.expanded = !sz.expanded"
                >
                  <ChevronRight v-if="!sz.expanded" class="h-3.5 w-3.5 shrink-0 text-forena-400" />
                  <ChevronDown v-else class="h-3.5 w-3.5 shrink-0 text-forena-400" />
                  <span class="truncate text-xs font-bold text-forena-900">{{ sz.title }}</span>
                  <span class="shrink-0 text-[10px] tabular-nums text-slate-500">
                    {{ sz.workers.length }}/{{ sz.required }}{{ T.count }}
                  </span>
                </button>
                <div class="hidden max-w-[8rem] flex-1 sm:block">
                  <div class="h-1.5 overflow-hidden rounded-full bg-forena-100">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="zoneBarClass(sz)"
                      :style="{ width: Math.round(zoneFillRatio(sz) * 100) + '%' }"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-forena-50 hover:text-flare-700"
                  :title="T.editZone"
                  @click.stop="openZoneEdit(group, sz)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
              </div>
              <div v-if="sz.expanded" class="border-t border-forena-50 px-2 pb-1.5 pt-1 sm:px-3">
                <div class="mb-1.5 flex max-w-[10rem] sm:hidden">
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-forena-100">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="zoneBarClass(sz)"
                      :style="{ width: Math.round(zoneFillRatio(sz) * 100) + '%' }"
                    />
                  </div>
                </div>
                <div
                  v-if="(sz.tradeNeeds || []).length"
                  class="mb-2 rounded border border-forena-100/80 bg-forena-50/40 px-2 py-1"
                >
                  <p class="text-[9px] font-bold text-forena-500">{{ T.tradeToTitle }}</p>
                  <ul class="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    <li
                      v-for="row in zoneTradeProgress(sz)"
                      :key="row.trade"
                      class="text-[10px] font-semibold tabular-nums"
                    >
                      <span class="text-forena-700">{{ row.label }}</span>
                      <span :class="row.fill >= row.need ? 'text-emerald-700' : 'text-rose-600'">
                        {{ row.fill }}/{{ row.need }}
                      </span>
                    </li>
                  </ul>
                </div>
                <div class="overflow-x-auto rounded border border-forena-100/90">
                  <table class="w-full min-w-[560px] text-left text-xs">
                    <thead class="border-b border-forena-100 bg-forena-50/80 text-[10px] font-bold uppercase tracking-wide text-forena-500">
                      <tr>
                        <th class="w-8 px-2 py-2" />
                        <th class="px-2 py-2">{{ T.workerTableName }}</th>
                        <th class="px-2 py-2">{{ T.colAffil }}</th>
                        <th class="px-2 py-2">{{ T.colFatigue }}</th>
                        <th class="px-2 py-2">{{ T.colPlacement }}</th>
                        <th class="px-2 py-2 text-center">{{ T.colProfile }}</th>
                        <th class="w-8 px-2 py-2 text-center" />
                      </tr>
                    </thead>
                    <tbody class="text-forena-800">
                      <tr v-if="sz.workers.length === 0">
                        <td colspan="7" class="px-3 py-6 text-center text-slate-400">{{ T.poolEmpty }}</td>
                      </tr>
                      <tr
                        v-for="w in sz.workers"
                        :key="w.id"
                        class="border-b border-forena-50 align-middle"
                      >
                        <td class="px-2 py-1.5" />
                        <td class="px-2 py-1.5">
                          <div class="flex items-center gap-2">
                            <div
                              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-flare-100 to-forena-50 text-[10px] font-bold text-forena-800"
                            >
                              {{ w.name.slice(0, 1) }}
                            </div>
                            <span class="font-semibold text-forena-900">{{ w.name }}</span>
                          </div>
                        </td>
                        <td class="px-2 py-1.5 text-[11px] font-medium">{{ affiliationDisplayCell(w) }}</td>
                        <td class="px-2 py-1.5">
                          <span
                            class="tabular-nums font-bold"
                            :class="fatigueScore(w) >= 70 ? 'text-rose-600' : 'text-forena-800'"
                          >
                            {{ fatigueScore(w) }}
                          </span>
                        </td>
                        <td class="px-2 py-1.5 text-[11px] font-semibold text-emerald-800">
                          {{ group.title }} · {{ sz.title }}
                        </td>
                        <td class="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-lg border border-forena-200 bg-white px-2 py-0.5 text-[10px] font-bold text-forena-700 hover:bg-flare-50"
                            @click="openWorkerProfile(w)"
                          >
                            <ExternalLink class="h-3 w-3" />
                          </button>
                        </td>
                        <td class="px-2 py-1.5 text-center">
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

    <!-- 작업자 투입 현황 -->
    <section class="rounded-2xl border border-forena-100/90 bg-white/90 p-4 shadow-card sm:p-5">
      <h2 class="mb-4 text-base font-bold text-forena-900">{{ T.workerPoolTitle }}</h2>

      <div
        class="mb-4 flex flex-col gap-3 rounded-xl border border-forena-100 bg-forena-50/40 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      >
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-forena-200 bg-white px-3 py-2 text-xs font-bold text-forena-700 shadow-sm hover:bg-forena-50"
            @click="selectAllOnPage"
          >
            {{ T.selectAll }}
          </button>
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
          <div class="flex items-center gap-1 text-[11px] font-bold text-forena-600">
            <span>{{ T.pageLabel }}</span>
            <button
              v-for="n in [10, 20, 30]"
              :key="n"
              type="button"
              class="rounded-md px-2 py-1 ring-1 transition"
              :class="
                poolPageSize === n
                  ? 'bg-flare-600 text-white ring-flare-600'
                  : 'bg-white text-forena-700 ring-forena-200 hover:bg-forena-50'
              "
              @click="setPoolPageSize(n)"
            >
              {{ n }}
            </button>
            <span>{{ T.pageUnit }}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
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

      <div class="mb-2 flex items-center justify-between text-[11px] text-slate-500">
        <span
          >{{ T.totalWorkers }} <strong class="text-forena-800">{{ boardKindBreakdown.total }}</strong
          >{{ T.countUnit }}</span
        >
        <span v-if="staffingTableRows.length"
          >{{ poolPage }} / {{ poolTotalPages }} 페이지 · {{ staffingTableRows.length }}명</span
        >
      </div>

      <div class="overflow-x-auto rounded-xl border border-forena-100">
        <table class="w-full min-w-[800px] text-left text-sm">
          <thead class="border-b border-forena-100 bg-forena-50/70 text-[11px] font-bold uppercase tracking-wide text-forena-500">
            <tr>
              <th class="w-12 px-3 py-3" />
              <th class="px-3 py-3">{{ T.workerTableName }}</th>
              <th class="px-3 py-3">{{ T.colAffil }}</th>
              <th class="px-3 py-3">{{ T.colFatigue }}</th>
              <th class="px-3 py-3">{{ T.colPlacement }}</th>
              <th class="px-3 py-3 text-center">{{ T.colProfile }}</th>
            </tr>
          </thead>
          <tbody class="text-forena-800">
            <tr v-if="paginatedPoolRows.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400">{{ T.poolEmpty }}</td>
            </tr>
            <tr
              v-for="row in paginatedPoolRows"
              :key="(row.waitingId || row.worker.id) + row.placement"
              class="border-b border-forena-50 transition hover:bg-flare-50/30"
            >
              <td class="px-3 py-3 align-middle">
                <input
                  v-if="row.selectable && row.waitingId"
                  type="checkbox"
                  class="h-4 w-4 rounded border-forena-300 text-flare-600 focus:ring-flare-500"
                  :checked="selectedWaitingIds.includes(row.waitingId)"
                  @change="toggleSelectWaiting(row.waitingId)"
                />
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forena-100 to-flare-50 text-xs font-bold text-forena-700"
                  >
                    {{ row.worker.name.slice(0, 1) }}
                  </div>
                  <span class="font-semibold text-forena-900">{{ row.worker.name }}</span>
                </div>
              </td>
              <td class="px-3 py-3 text-xs font-medium">{{ affiliationDisplayCell(row.worker) }}</td>
              <td class="px-3 py-3">
                <span
                  class="font-bold tabular-nums"
                  :class="fatigueScore(row.worker) >= 70 ? 'text-rose-600' : 'text-forena-900'"
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
          </tbody>
        </table>
      </div>

      <div v-if="poolTotalPages > 1" class="mt-3 flex justify-center gap-2">
        <button
          type="button"
          class="rounded-lg border border-forena-200 px-3 py-1.5 text-xs font-bold text-forena-700 disabled:opacity-40"
          :disabled="poolPage <= 1"
          @click="poolPage--"
        >
          이전
        </button>
        <span class="px-2 py-1.5 text-xs font-semibold text-forena-600">{{ poolPage }} / {{ poolTotalPages }}</span>
        <button
          type="button"
          class="rounded-lg border border-forena-200 px-3 py-1.5 text-xs font-bold text-forena-700 disabled:opacity-40"
          :disabled="poolPage >= poolTotalPages"
          @click="poolPage++"
        >
          다음
        </button>
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
        class="pointer-events-none fixed bottom-4 right-4 z-[80] flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold shadow-lg ring-1 ring-black/5"
          :class="toastClass(t.variant)"
        >
          <AlertTriangle v-if="t.variant === 'warning'" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{{ t.message }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
