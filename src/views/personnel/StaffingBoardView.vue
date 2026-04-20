<script setup>
import { computed, ref, onMounted } from 'vue'
import {
  MapPin,
  Settings,
  GripVertical,
  MoreHorizontal,
  Plus,
  X,
  Users,
  Radio,
  WifiOff,
  Moon,
  AlertTriangle,
} from 'lucide-vue-next'
import { getAffiliationKind, affiliationKindBadgeClass } from '@/utils/workerAffiliation'
import { useStaffingBoardSync } from '@/composables/useStaffingBoardSync'

const T = {
  kicker: '인력 배치',
  boardTitle: '인력 배치 관리 보드',
  hint: '드래그 앤 드롭으로 작업자를 구역별로 배치하세요.',
  loadPrev: '이전 배치 불러오기',
  autoRec: '자동 추천 배치',
  confirm: '배치 확정 및 저장',
  waitingTitle: '투입 가능 인력',
  waitingSub: '배치 전',
  waitingEmpty: '투입 가능 인력이 없습니다.',
  needTo: '필요 인원 (T.O)',
  current: '현재 배치',
  dropHint: '인력을 이곳으로 드래그',
  zoneSettings: '구역 설정',
  removeZone: '구역에서 제거',
  more: '더 보기',
  count: '명',
  alertLoad: '저장된 이전 배치 스내이크를 불러옴니다. (데모)',
  alertAuto:
    '부족 구역 위주로 투입 가능 인력을 자동 배치했습니다. (데모)',
  alertSave: '현재 배치가 확정되어 저장되었습니다. (데모)',
  kindSummary: '오늘 보드 인원 (구분)',
  kindFilter: '대기 목록 구분',
  kindAll: '전체',
  badgeDirect: '직영',
  badgePartner: '협력',
  badgeAgency: '인력',
  countUnit: '명',
  waitingFilteredEmpty: '선택한 구분에 해당하는 인력이 없습니다.',
  zoneMix: '구역 구성',
  totalWorkers: '보드 총인원',
  syncTitle: '실시간 보드 동기화',
  syncConnected:
    'BroadcastChannel: 다른 관리 탭과 동기화 중 (새로고침 없이 반영)',
  syncUnsupported:
    '이 브라우저는 탭 간 동기화(BroadcastChannel)를 지원하지 않습니다.',
  tradeToTitle: '구역 필요 직종(T.O)',
  tradeWarn:
    '이 구역에 필요한 직종과 맞지 않을 수 있습니다. 배치는 가능하며, 안전/산업 관점에서 확인해 주세요.',
  fatigueTitle:
    '안전 주의: 전날 야간 근무 또는 연속 근무 일수가 높음 (피로도 누적 의십)',
  skillCarpenter: '목수',
  skillRebar: '첼근',
  skillWelder: '용접',
  skillLabor: '인부',
}

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

const waiting = ref([
  {
    id: 'w1',
    name: '김철수',
    affiliation: '협력사 (태양건설)',
    skills: ['carpenter', 'labor'],
    fatigue: { nightShiftYesterday: true, consecutiveDays: 2 },
  },
  {
    id: 'w2',
    name: '이영희',
    affiliation: '협력사 (우주산업)',
    skills: ['rebar'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 6 },
  },
  {
    id: 'w3',
    name: '박민수',
    affiliation: '인력사무소 (개인)',
    skills: ['labor'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 1 },
  },
  {
    id: 'w4',
    name: '정대리',
    affiliation: '본사 소속',
    skills: ['welder', 'labor'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 0 },
  },
  {
    id: 'w5',
    name: '최작업',
    affiliation: '협력사 (태양건설)',
    skills: ['carpenter'],
    fatigue: { nightShiftYesterday: false, consecutiveDays: 5 },
  },
])

const zones = ref([
  {
    id: 'z-a',
    title: 'A구역',
    subtitle: '지하 주차장',
    required: 4,
    tradeNeeds: [
      { trade: 'carpenter', need: 2 },
      { trade: 'rebar', need: 1 },
      { trade: 'welder', need: 1 },
    ],
    workers: [
      {
        id: 'z1',
        name: '한현장',
        affiliation: '협력사 (태양건설)',
        skills: ['carpenter'],
        fatigue: { nightShiftYesterday: false, consecutiveDays: 3 },
      },
      {
        id: 'z2',
        name: '서대리',
        affiliation: '본사 소속',
        skills: ['labor'],
        fatigue: { nightShiftYesterday: true, consecutiveDays: 4 },
      },
    ],
  },
  {
    id: 'z-b',
    title: 'B구역',
    subtitle: '1동 골조',
    required: 6,
    tradeNeeds: [
      { trade: 'rebar', need: 3 },
      { trade: 'carpenter', need: 2 },
      { trade: 'labor', need: 1 },
    ],
    workers: [
      {
        id: 'z3',
        name: '오형사',
        affiliation: '협력사 (우주산업)',
        skills: ['rebar'],
        fatigue: { nightShiftYesterday: false, consecutiveDays: 7 },
      },
    ],
  },
  {
    id: 'z-c',
    title: 'C구역',
    subtitle: '2동 마감',
    required: 3,
    tradeNeeds: [
      { trade: 'welder', need: 1 },
      { trade: 'labor', need: 2 },
    ],
    workers: [],
  },
])

const dragged = ref(null)
const dragSource = ref(null)

const toasts = ref([])
let toastSeq = 0

function pushToast(message, variant = 'warning') {
  const id = ++toastSeq
  toasts.value = [...toasts.value, { id, message, variant }]
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 4200)
}

const waitingCount = computed(() => waiting.value.length)

const boardKindFilter = ref('')

const displayedWaiting = computed(() => {
  const k = boardKindFilter.value
  if (!k) return waiting.value
  return waiting.value.filter((w) => getAffiliationKind(w.affiliation) === k)
})

const boardKindBreakdown = computed(() => {
  const list = []
  for (const w of waiting.value) list.push(w)
  for (const z of zones.value) for (const w of z.workers) list.push(w)
  let direct = 0
  let partner = 0
  let agency = 0
  for (const w of list) {
    const k = getAffiliationKind(w.affiliation)
    if (k === 'direct') direct++
    else if (k === 'agency') agency++
    else partner++
  }
  return { direct, partner, agency, total: list.length }
})

function workerKindLabel(affiliation) {
  const k = getAffiliationKind(affiliation)
  if (k === 'direct') return T.badgeDirect
  if (k === 'agency') return T.badgeAgency
  return T.badgePartner
}

const boardKindPills = computed(() => [
  { key: '', label: T.kindAll },
  { key: 'direct', label: T.badgeDirect },
  { key: 'partner', label: T.badgePartner },
  { key: 'agency', label: T.badgeAgency },
])

function zoneKindMixText(z) {
  if (!z.workers.length) return ''
  let d = 0
  let p = 0
  let a = 0
  for (const w of z.workers) {
    const k = getAffiliationKind(w.affiliation)
    if (k === 'direct') d++
    else if (k === 'agency') a++
    else p++
  }
  return `${T.zoneMix}: ${T.badgeDirect} ${d} · ${T.badgePartner} ${p} · ${T.badgeAgency} ${a}`
}

function countTradeInZone(zone, trade) {
  return zone.workers.filter((w) => (w.skills || []).includes(trade)).length
}

function zoneTradeProgress(zone) {
  const needs = zone.tradeNeeds || []
  return needs.map((tn) => ({
    trade: tn.trade,
    label: tradeLabel(tn.trade),
    need: tn.need,
    fill: countTradeInZone(zone, tn.trade),
  }))
}

/** 구역에 명시된 필요 직종과 작업자 스킬 교집이 없으면 경고 */
function shouldWarnTradeMismatch(zone, worker) {
  const needs = zone.tradeNeeds || []
  if (!needs.length) return false
  const needSet = new Set(needs.map((n) => n.trade))
  const skills = worker.skills || []
  if (!skills.length) return false
  return !skills.some((s) => needSet.has(s))
}

function workerFatigueHigh(w) {
  const f = w.fatigue || {}
  return Boolean(f.nightShiftYesterday) || (f.consecutiveDays ?? 0) >= 5
}

function skillBadgeClass(trade) {
  if (trade === 'welder') return 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80'
  if (trade === 'rebar') return 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80'
  if (trade === 'carpenter') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80'
}

function packState() {
  return {
    waiting: JSON.parse(JSON.stringify(waiting.value)),
    zones: JSON.parse(JSON.stringify(zones.value)),
    idSeq,
  }
}

function applyRemoteState(payload) {
  if (!payload || !Array.isArray(payload.waiting) || !Array.isArray(payload.zones)) return
  waiting.value = payload.waiting.map(cloneWorker)
  zones.value = payload.zones.map((z) => ({
    ...z,
    workers: (z.workers || []).map(cloneWorker),
  }))
  if (typeof payload.idSeq === 'number' && payload.idSeq > idSeq) idSeq = payload.idSeq
}

const tabId =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`

const { syncStatus, publish } = useStaffingBoardSync(tabId, applyRemoteState)

function syncPublish() {
  publish(packState())
}

onMounted(() => {
  syncPublish()
})

function onDragStart(worker, source, zoneId = null) {
  dragged.value = worker
  dragSource.value = { type: source, zoneId }
}

function onDragEnd() {
  dragged.value = null
  dragSource.value = null
}

function removeFromWaiting(id) {
  waiting.value = waiting.value.filter((w) => w.id !== id)
}

function removeFromZone(zoneId, workerId) {
  const z = zones.value.find((x) => x.id === zoneId)
  if (!z) return
  const w = z.workers.find((x) => x.id === workerId)
  z.workers = z.workers.filter((x) => x.id !== workerId)
  if (w) waiting.value.push(cloneWorker({ ...w, id: 'w-' + String(++idSeq) }))
  syncPublish()
}

function onDropZone(zoneId) {
  if (!dragged.value || !dragSource.value) return
  const worker = cloneWorker(dragged.value)
  const src = dragSource.value

  if (src.type === 'waiting') {
    removeFromWaiting(worker.id)
  } else if (src.type === 'zone' && src.zoneId) {
    const zFrom = zones.value.find((x) => x.id === src.zoneId)
    if (zFrom) zFrom.workers = zFrom.workers.filter((w) => w.id !== worker.id)
  }

  const zTo = zones.value.find((x) => x.id === zoneId)
  if (zTo && !zTo.workers.some((w) => w.id === worker.id)) {
    if (shouldWarnTradeMismatch(zTo, worker)) {
      pushToast(T.tradeWarn, 'warning')
    }
    zTo.workers.push({
      ...worker,
      id: worker.id.startsWith('w') ? 'z-' + String(++idSeq) : worker.id,
    })
  }
  syncPublish()
  onDragEnd()
}

function onDropWaiting() {
  if (!dragged.value || !dragSource.value) return
  const worker = cloneWorker(dragged.value)
  if (dragSource.value.type === 'zone' && dragSource.value.zoneId) {
    const zFrom = zones.value.find((x) => x.id === dragSource.value.zoneId)
    if (zFrom) zFrom.workers = zFrom.workers.filter((w) => w.id !== worker.id)
    waiting.value.push(cloneWorker({ ...worker, id: 'w-' + String(++idSeq) }))
  }
  syncPublish()
  onDragEnd()
}

function zoneFillRatio(z) {
  if (!z.required) return 1
  return Math.min(z.workers.length / z.required, 1)
}

function zoneBarClass(z) {
  const r = zoneFillRatio(z)
  if (r >= 1) return 'bg-emerald-500'
  if (r >= 0.5) return 'bg-amber-500'
  return 'bg-rose-500'
}

function loadPrevious() {
  window.alert(T.alertLoad)
}

function autoRecommend() {
  const pool = waiting.value.map(cloneWorker)
  waiting.value = []
  for (const z of zones.value) {
    while (z.workers.length < z.required && pool.length) {
      const w = pool.shift()
      z.workers.push({ ...w, id: 'z-' + String(++idSeq) })
    }
  }
  waiting.value = pool
  syncPublish()
  window.alert(T.alertAuto)
}

function confirmSave() {
  syncPublish()
  window.alert(T.alertSave)
}

function toastClass(v) {
  if (v === 'danger') return 'border-rose-200 bg-rose-50 text-rose-900'
  if (v === 'info') return 'border-sky-200 bg-sky-50 text-sky-900'
  return 'border-amber-200 bg-amber-50 text-amber-950'
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
            class="rounded-xl border border-forena-200 bg-white px-4 py-2.5 text-sm font-bold text-forena-700 shadow-sm transition hover:bg-forena-50"
            @click="loadPrevious"
          >
            {{ T.loadPrev }}
          </button>
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
      <div
        class="mt-4 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-semibold"
        :class="
          syncStatus === 'connected'
            ? 'border-emerald-200/90 bg-emerald-50/60 text-emerald-900'
            : 'border-forena-200 bg-forena-50/80 text-forena-700'
        "
      >
        <Radio
          v-if="syncStatus === 'connected'"
          class="h-3.5 w-3.5 shrink-0 text-emerald-600"
          aria-hidden="true"
        />
        <WifiOff v-else class="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
        <span class="font-bold text-forena-800">{{ T.syncTitle }}</span>
        <span class="text-forena-600/90">
          {{ syncStatus === 'connected' ? T.syncConnected : T.syncUnsupported }}
        </span>
      </div>
    </div>

    <div
      class="rounded-2xl border border-forena-100/90 bg-white/90 px-4 py-3 shadow-card sm:px-5"
    >
      <p class="text-[11px] font-bold uppercase tracking-wide text-forena-500">{{ T.kindSummary }}</p>
      <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-forena-800">
        <span class="tabular-nums">
          <span class="font-semibold text-indigo-700">{{ T.badgeDirect }}</span>
          {{ boardKindBreakdown.direct }}{{ T.countUnit }}
        </span>
        <span class="text-slate-300" aria-hidden="true">·</span>
        <span class="tabular-nums">
          <span class="font-semibold text-amber-800">{{ T.badgePartner }}</span>
          {{ boardKindBreakdown.partner }}{{ T.countUnit }}
        </span>
        <span class="text-slate-300" aria-hidden="true">·</span>
        <span class="tabular-nums">
          <span class="font-semibold text-slate-600">{{ T.badgeAgency }}</span>
          {{ boardKindBreakdown.agency }}{{ T.countUnit }}
        </span>
        <span class="text-slate-300" aria-hidden="true">·</span>
        <span class="tabular-nums text-slate-500">
          {{ T.totalWorkers }} {{ boardKindBreakdown.total }}{{ T.countUnit }}
        </span>
      </p>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-2" @dragover.prevent @drop.prevent="onDropWaiting">
      <section
        class="flex w-[280px] shrink-0 flex-col rounded-2xl border border-forena-100/90 bg-white/90 shadow-card"
      >
        <header class="border-b border-forena-100 px-4 py-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <Users class="h-4 w-4 shrink-0 text-flare-600" />
              <div class="min-w-0">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span class="text-sm font-bold text-forena-900">{{ T.waitingTitle }}</span>
                  <span class="text-[11px] text-slate-500">({{ T.waitingSub }})</span>
                </div>
              </div>
            </div>
            <span class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800"
              >{{ waitingCount }}{{ T.count }}</span
            >
          </div>
          <p class="mt-2 text-[10px] font-bold text-forena-500">{{ T.kindFilter }}</p>
          <div class="mt-1.5 flex flex-wrap gap-1.5">
            <button
              v-for="pill in boardKindPills"
              :key="pill.key || 'all'"
              type="button"
              class="rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ring-1"
              :class="
                boardKindFilter === pill.key
                  ? 'bg-forena-800 text-white ring-forena-800'
                  : 'bg-forena-50 text-forena-700 ring-forena-200/80 hover:bg-forena-100'
              "
              @click="boardKindFilter = pill.key"
            >
              {{ pill.label }}
            </button>
          </div>
        </header>
        <div class="max-h-[520px] space-y-2 overflow-y-auto p-3">
          <div
            v-for="w in displayedWaiting"
            :key="w.id"
            draggable="true"
            class="flex cursor-grab items-start gap-2 rounded-xl border border-forena-100 bg-white p-3 shadow-sm transition hover:border-flare-300 active:cursor-grabbing"
            @dragstart="onDragStart(w, 'waiting')"
            @dragend="onDragEnd"
          >
            <div class="relative shrink-0">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-forena-100 to-flare-50 text-xs font-bold text-forena-700"
              >
                {{ w.name.slice(0, 1) }}
              </div>
              <span
                v-if="workerFatigueHigh(w)"
                class="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white ring-2 ring-white"
                :title="T.fatigueTitle"
              >
                <AlertTriangle class="h-2.5 w-2.5" aria-hidden="true" />
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <div class="truncate text-sm font-semibold text-forena-900">{{ w.name }}</div>
                <span
                  class="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold"
                  :class="affiliationKindBadgeClass(getAffiliationKind(w.affiliation))"
                >
                  {{ workerKindLabel(w.affiliation) }}
                </span>
                <Moon
                  v-if="w.fatigue?.nightShiftYesterday"
                  class="h-3.5 w-3.5 shrink-0 text-indigo-500"
                  :title="T.fatigueTitle"
                  aria-hidden="true"
                />
              </div>
              <div class="truncate text-[11px] text-slate-500">{{ w.affiliation }}</div>
              <div class="mt-1.5 flex flex-wrap gap-1">
                <span
                  v-for="sk in w.skills || []"
                  :key="sk"
                  class="rounded px-1.5 py-0.5 text-[9px] font-bold"
                  :class="skillBadgeClass(sk)"
                >
                  {{ tradeLabel(sk) }}
                </span>
              </div>
            </div>
            <MoreHorizontal class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          </div>
          <p v-if="displayedWaiting.length === 0" class="py-8 text-center text-sm text-slate-400">
            {{ waiting.length === 0 ? T.waitingEmpty : T.waitingFilteredEmpty }}
          </p>
        </div>
      </section>

      <section
        v-for="z in zones"
        :key="z.id"
        class="flex w-[300px] shrink-0 flex-col rounded-2xl border border-forena-100/90 bg-white/90 shadow-card"
        @dragover.prevent
        @drop.prevent="onDropZone(z.id)"
      >
        <header class="border-b border-forena-100 px-4 py-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <h2 class="text-sm font-bold text-forena-900">{{ z.title }}</h2>
                <button
                  type="button"
                  class="rounded p-1 text-slate-400 transition hover:bg-forena-50 hover:text-forena-600"
                  :title="T.zoneSettings"
                >
                  <Settings class="h-3.5 w-3.5" />
                </button>
              </div>
              <p class="text-[11px] text-slate-500">{{ z.subtitle }}</p>
            </div>
          </div>
          <div class="mt-3 space-y-1.5">
            <div class="flex justify-between text-[11px] font-semibold text-forena-600">
              <span>{{ T.needTo }} {{ z.required }}{{ T.count }}</span>
              <span>{{ T.current }} {{ z.workers.length }}{{ T.count }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-forena-100">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="zoneBarClass(z)"
                :style="{ width: Math.round(zoneFillRatio(z) * 100) + '%' }"
              />
            </div>
            <p v-if="z.workers.length" class="text-[10px] font-medium text-slate-500">
              {{ zoneKindMixText(z) }}
            </p>
            <div v-if="(z.tradeNeeds || []).length" class="rounded-lg border border-forena-100 bg-forena-50/50 px-2 py-2">
              <p class="text-[9px] font-bold uppercase tracking-wide text-forena-500">{{ T.tradeToTitle }}</p>
              <ul class="mt-1 space-y-0.5">
                <li
                  v-for="row in zoneTradeProgress(z)"
                  :key="row.trade"
                  class="flex justify-between text-[10px] font-semibold tabular-nums"
                >
                  <span class="text-forena-700">{{ row.label }}</span>
                  <span :class="row.fill >= row.need ? 'text-emerald-700' : 'text-rose-600'">
                    {{ row.fill }}/{{ row.need }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <div
          class="m-3 flex min-h-[100px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-forena-200/80 bg-forena-50/40 px-3 py-6 text-center transition hover:border-flare-300 hover:bg-flare-50/30"
        >
          <GripVertical class="mb-1 h-5 w-5 text-forena-400" />
          <span class="text-[11px] font-medium text-forena-500">{{ T.dropHint }}</span>
        </div>

        <div class="max-h-[360px] flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          <div
            v-for="w in z.workers"
            :key="w.id"
            draggable="true"
            class="flex cursor-grab items-start gap-2 rounded-xl border border-forena-100 bg-white p-3 shadow-sm transition hover:border-flare-300 active:cursor-grabbing"
            @dragstart="onDragStart(w, 'zone', z.id)"
            @dragend="onDragEnd"
          >
            <div class="relative shrink-0">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-flare-100 to-forena-50 text-xs font-bold text-forena-800"
              >
                {{ w.name.slice(0, 1) }}
              </div>
              <span
                v-if="workerFatigueHigh(w)"
                class="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white ring-2 ring-white"
                :title="T.fatigueTitle"
              >
                <AlertTriangle class="h-2.5 w-2.5" aria-hidden="true" />
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <div class="truncate text-sm font-semibold text-forena-900">{{ w.name }}</div>
                <span
                  class="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold"
                  :class="affiliationKindBadgeClass(getAffiliationKind(w.affiliation))"
                >
                  {{ workerKindLabel(w.affiliation) }}
                </span>
                <Moon
                  v-if="w.fatigue?.nightShiftYesterday"
                  class="h-3.5 w-3.5 shrink-0 text-indigo-500"
                  :title="T.fatigueTitle"
                  aria-hidden="true"
                />
              </div>
              <div class="truncate text-[11px] text-slate-500">{{ w.affiliation }}</div>
              <div class="mt-1.5 flex flex-wrap gap-1">
                <span
                  v-for="sk in w.skills || []"
                  :key="sk"
                  class="rounded px-1.5 py-0.5 text-[9px] font-bold"
                  :class="skillBadgeClass(sk)"
                >
                  {{ tradeLabel(sk) }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              :title="T.removeZone"
              @click="removeFromZone(z.id, w.id)"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
        <footer class="border-t border-forena-50 px-3 py-2 text-center">
          <button
            type="button"
            class="inline-flex items-center gap-1 text-[11px] font-bold text-flare-700 hover:text-flare-800"
          >
            <Plus class="h-3.5 w-3.5" />
            {{ T.more }}
          </button>
        </footer>
      </section>
    </div>

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
          <AlertTriangle v-if="t.variant === 'warning'" class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{{ t.message }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
