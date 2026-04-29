<script setup>
import { computed, onMounted, ref } from 'vue'
import siteLayout from '@/assets/Firefly_Gemini Flash.png'
import {
  Navigation,
  Users,
  Settings2,
  Truck,
  Power,
  PowerOff,
  AlertCircle,
  Map as MapIcon,
  Trash2,
  X,
} from 'lucide-vue-next'
import {
  fetchGateList,
  fetchGate,
  createGate,
  updateGatePosition,
  updateGateVehicles,
  updateGateManpower,
  addGateMachine,
  toggleGateMachine,
  removeGateMachine,
  deleteGate,
} from '@/api/gate'

// 1. 게이트 상태 (백엔드 동기화)
const gates = ref([])
const selectedGateId = ref(null)
const isAddMode = ref(false)
const isLoading = ref(false)

const selectedGate = computed(() => gates.value.find((g) => g.idx === selectedGateId.value))

const recommendedGate = computed(() => {
  if (!selectedGate.value || selectedGate.value.congestion !== 'CRITICAL') return null

  const availableGates = gates.value.filter(
    (gate) => gate.idx !== selectedGate.value.idx && gate.congestion === 'SMOOTH',
  )
  if (!availableGates.length) return null

  return availableGates.reduce((closestGate, gate) => {
    const closestDistance = Math.hypot(
      closestGate.x - selectedGate.value.x,
      closestGate.y - selectedGate.value.y,
    )
    const currentDistance = Math.hypot(gate.x - selectedGate.value.x, gate.y - selectedGate.value.y)
    return currentDistance < closestDistance ? gate : closestGate
  })
})

// 드래그 상태 (UI 전용)
const mapRef = ref(null)
const draggingGateId = ref(null)
const suppressClickGateId = ref(null)
const dragMoved = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const lastDragPoint = ref({ x: 0, y: 0 })
const DRAG_THRESHOLD_PX = 5

// TODO: 작업 지시서 / 작업 일보 도메인 연동 후 실데이터로 교체
const todayEquipments = ref([
  {
    id: 1,
    name: 'CAT 320 굴착기',
    type: '굴착기',
    status: '작업중',
    gate: 'Gate 5 (토목)',
    partner: '동남건기',
    instruction: 'WI-2025-014',
  },
  {
    id: 2,
    name: 'HYUNDAI 25T 덤프트럭',
    type: '덤프트럭',
    status: '대기',
    gate: 'Gate 4 (자재)',
    partner: '한빛로지스',
    instruction: 'WI-2025-018',
  },
  {
    id: 3,
    name: 'VOLVO 휠로더 L90',
    type: '휠로더',
    status: '작업중',
    gate: 'Gate 2 (서측)',
    partner: '서진중기',
    instruction: 'WI-2025-021',
  },
  {
    id: 4,
    name: 'KOBELCO 크레인 50T',
    type: '크레인',
    status: '입차예정',
    gate: 'Gate 1 (정문)',
    partner: '대흥크레인',
    instruction: 'WI-2025-025',
  },
])

// 2. 백엔드 응답 기반 정적 컬러 매핑 (Tailwind JIT 안전)
const STATUS_COLOR_MAP = {
  CRITICAL: 'text-rose-500 bg-rose-50 border-rose-200',
  BUSY: 'text-amber-500 bg-amber-50 border-amber-200',
  SMOOTH: 'text-blue-500 bg-blue-50 border-blue-200',
}
const MARKER_COLOR_MAP = {
  CRITICAL: 'bg-rose-500 shadow-rose-200',
  BUSY: 'bg-amber-500 shadow-amber-200',
  SMOOTH: 'bg-blue-500 shadow-blue-200',
}
const NOTICE_CLASS_MAP = {
  HUMAN_WASH_MODE: 'bg-blue-50 text-blue-700',
  INEFFICIENT: 'bg-amber-50 text-amber-700',
  CRITICAL_GUIDE: 'bg-amber-50 text-amber-700',
  OPTIMAL: 'bg-blue-50 text-blue-700',
}

const getStatusColor = (gate) => STATUS_COLOR_MAP[gate?.congestion] ?? STATUS_COLOR_MAP.SMOOTH
const getMarkerColor = (gate) => MARKER_COLOR_MAP[gate?.congestion] ?? MARKER_COLOR_MAP.SMOOTH
const getNoticeClass = (gate) => NOTICE_CLASS_MAP[gate?.noticeType] ?? NOTICE_CLASS_MAP.OPTIMAL

const getEquipStatusClass = (status) => {
  switch (status) {
    case '작업중':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case '대기':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case '입차예정':
      return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
  }
}

// 3. 데이터 로드
const loadGates = async () => {
  isLoading.value = true
  try {
    const list = await fetchGateList()
    gates.value = Array.isArray(list) ? list : []
    if (gates.value.length && !selectedGateId.value) {
      selectedGateId.value = gates.value[0].idx
    }
  } catch (error) {
    console.error('게이트 목록 조회 실패', error)
  } finally {
    isLoading.value = false
  }
}

const refreshGate = async (gateId) => {
  try {
    const updated = await fetchGate(gateId)
    const index = gates.value.findIndex((g) => g.idx === gateId)
    if (index !== -1) gates.value[index] = updated
    else gates.value.push(updated)
  } catch (error) {
    console.error('게이트 갱신 실패', error)
  }
}

onMounted(() => {
  loadGates()
})

// 4. 인원 / 차량 / 기계 / 좌표 제어
const updateManpower = async (delta) => {
  if (!selectedGate.value) return
  const next = selectedGate.value.manpower + delta
  if (next < 2) return
  try {
    await updateGateManpower(selectedGate.value.idx, next)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('배치 인원 수정 실패', error)
  }
}

const updateVehicles = async (delta) => {
  if (!selectedGate.value) return
  const next = Math.max(0, selectedGate.value.vehicles + delta)
  try {
    await updateGateVehicles(selectedGate.value.idx, next)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('진입 차량 수정 실패', error)
  }
}

const toggleMachine = async (machineId) => {
  if (!selectedGate.value) return
  try {
    await toggleGateMachine(selectedGate.value.idx, machineId)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('세척 기계 토글 실패', error)
  }
}

const addMachine = async () => {
  if (!selectedGate.value) return
  try {
    await addGateMachine(selectedGate.value.idx)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('세척 기계 추가 실패', error)
  }
}

const removeMachine = async (machineId) => {
  if (!selectedGate.value) return
  try {
    await removeGateMachine(selectedGate.value.idx, machineId)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('세척 기계 삭제 실패', error)
  }
}

const addCustomGate = async (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  const nextSeq = gates.value.length + 1
  try {
    const newIdx = await createGate({
      name: `Gate ${nextSeq}`,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
    await loadGates()
    selectedGateId.value = newIdx
    isAddMode.value = false
  } catch (error) {
    console.error('게이트 등록 실패', error)
  }
}

const removeGate = async (gateId) => {
  try {
    await deleteGate(gateId)
    gates.value = gates.value.filter((gate) => gate.idx !== gateId)
    if (selectedGateId.value === gateId) {
      selectedGateId.value = gates.value[0]?.idx ?? null
    }
  } catch (error) {
    console.error('게이트 삭제 실패', error)
  }
}

// 5. 드래그 핸들러
const clampPercent = (value) => Math.max(0, Math.min(100, value))

const onMarkerDragStart = (gate, event) => {
  if (isAddMode.value) return
  event.stopPropagation()

  draggingGateId.value = gate.idx
  dragMoved.value = false
  dragStart.value = { x: event.clientX, y: event.clientY }
  lastDragPoint.value = { x: event.clientX, y: event.clientY }

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(gate.idx))
  }
}

const onMarkerDrag = (event) => {
  if (draggingGateId.value == null) return
  if (event.clientX === 0 && event.clientY === 0) return

  lastDragPoint.value = { x: event.clientX, y: event.clientY }
  const movedX = Math.abs(event.clientX - dragStart.value.x)
  const movedY = Math.abs(event.clientY - dragStart.value.y)
  if (movedX > DRAG_THRESHOLD_PX || movedY > DRAG_THRESHOLD_PX) dragMoved.value = true
}

const onMarkerDragEnd = async (gate, event) => {
  const point =
    event.clientX === 0 && event.clientY === 0
      ? lastDragPoint.value
      : { x: event.clientX, y: event.clientY }

  let nextX = gate.x
  let nextY = gate.y

  if (dragMoved.value && mapRef.value) {
    const rect = mapRef.value.getBoundingClientRect()
    nextX = clampPercent(((point.x - rect.left) / rect.width) * 100)
    nextY = clampPercent(((point.y - rect.top) / rect.height) * 100)

    // 화면 즉시 반영 후 백엔드 동기화
    gate.x = nextX
    gate.y = nextY

    try {
      await updateGatePosition(gate.idx, { x: nextX, y: nextY })
    } catch (error) {
      console.error('게이트 좌표 저장 실패', error)
      await refreshGate(gate.idx)
    }
  }

  if (dragMoved.value) {
    suppressClickGateId.value = draggingGateId.value
  }
  draggingGateId.value = null
}

const onMapDragOver = (event) => {
  event.preventDefault()
}

const onGateClick = (gateId, event) => {
  event.stopPropagation()
  if (suppressClickGateId.value === gateId) {
    suppressClickGateId.value = null
    return
  }
  selectedGateId.value = gateId
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-white p-6 shadow-card">
      <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md">
          <Navigation class="h-5 w-5" />
        </span>
        <div>
          <h1 class="text-xl font-bold text-forena-900">중장비 입출차 현황 관제</h1>
          <p class="text-sm text-forena-600">실시간 게이트별 중장비 밀집도 및 세척 설비/인원 배치 관리</p>
        </div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 relative flex min-h-[600px] flex-col overflow-auto rounded-3xl border border-forena-100 shadow-card">
        <div class="absolute right-4 top-4 z-20 flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition-all"
            :class="isAddMode ? 'border-flare-300 bg-flare-100 text-flare-700 ring-2 ring-flare-200 animate-pulse' : 'border-forena-100 bg-white text-forena-700 hover:bg-forena-50'"
            @click.stop="isAddMode = !isAddMode"
          >
            <MapIcon class="h-4 w-4" />
            게이트 추가 모드
          </button>
          <span class="inline-flex h-8 items-center rounded-xl border border-forena-100 bg-white px-3 text-xs font-bold text-forena-700 shadow-sm">
            총 {{ gates.length }}개
          </span>
        </div>

        <div
          ref="mapRef"
          class="relative h-full min-h-[650px] w-full min-w-[130%]"
          :class="draggingGateId !== null ? 'cursor-grabbing' : isAddMode ? 'cursor-crosshair' : ''"
          :style="{
            backgroundImage: `url(${siteLayout})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }"
          @click="isAddMode && addCustomGate($event)"
          @dragover="onMapDragOver"
        >
          <button
            v-for="gate in gates"
            :key="gate.idx"
            class="absolute flex flex-col items-center gap-1 transition-all"
            :class="draggingGateId === gate.idx ? 'scale-110 cursor-grabbing opacity-50' : 'cursor-grab'"
            :style="{
              left: gate.x + '%',
              top: gate.y + '%',
              transform: 'translate(-50%, -50%)',
              zIndex: draggingGateId === gate.idx ? 50 : 10,
            }"
            :draggable="!isAddMode"
            @dragstart="onMarkerDragStart(gate, $event)"
            @drag="onMarkerDrag($event)"
            @dragend="onMarkerDragEnd(gate, $event)"
            @click="onGateClick(gate.idx, $event)"
          >
            <div
              class="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-white shadow-xl transition-colors"
              :class="[getMarkerColor(gate), draggingGateId === gate.idx ? 'shadow-2xl ring-2 ring-white/80' : 'drop-shadow-xl']"
            >
              <Truck class="h-5 w-5" />
              <AlertCircle
                v-if="gate.inefficient"
                class="absolute -right-2 -top-2 h-5 w-5 fill-amber-500 text-white rounded-full"
              />
            </div>
            <div class="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold shadow-sm border border-forena-100 flex flex-col items-center gap-0.5">
              <span class="whitespace-nowrap">G{{ gate.idx }} (총 {{ gate.vehicles }}대)</span>
            </div>
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-if="selectedGate"
          class="overflow-hidden rounded-3xl border border-forena-100 bg-white shadow-card ring-1 ring-forena-50"
        >
          <div class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <span class="text-lg font-black text-forena-900">{{ selectedGate.idx }}</span>
              </div>
              <div>
                <h3 class="text-lg font-bold text-forena-900">{{ selectedGate.name }}</h3>
                <p class="text-xs font-semibold text-slate-500">게이트 상세 정보</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5 rounded-full bg-amber-100 px-1.5 py-1">
                <button
                  type="button"
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-white text-amber-800 shadow-sm transition hover:bg-amber-50 hover:scale-105"
                  @click="updateVehicles(-1)"
                >-</button>
                <span class="px-1 text-sm font-bold text-amber-800">대기 {{ selectedGate.vehicles }}대</span>
                <button
                  type="button"
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-white text-amber-800 shadow-sm transition hover:bg-amber-50 hover:scale-105"
                  @click="updateVehicles(1)"
                >+</button>
              </div>

              <span
                class="rounded-full px-3 py-1 text-xs font-bold border"
                :class="getStatusColor(selectedGate)"
              >
                {{ selectedGate.congestionLabel }}
              </span>

              <button
                type="button"
                class="rounded-full p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                title="게이트 삭제"
                @click="removeGate(selectedGate.idx)"
              >
                <Trash2 class="h-5 w-5" />
              </button>

              <button
                type="button"
                class="rounded-full p-2 text-forena-400 transition hover:bg-forena-100 hover:text-forena-600"
                @click="selectedGateId = null"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="p-6">
            <div class="mt-6">
              <div class="flex items-center justify-between text-sm font-bold text-forena-500 uppercase tracking-wider">
                <span>현재 진입 중장비</span>
                <span :class="getStatusColor(selectedGate).split(' ')[0]">{{ selectedGate.vehicles }}대</span>
              </div>
              <div class="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full transition-all duration-500"
                  :class="getMarkerColor(selectedGate)"
                  :style="{ width: Math.min((selectedGate.vehicles / 20) * 100, 100) + '%' }"
                ></div>
              </div>
            </div>

            <div class="mt-8">
              <div class="flex items-center justify-between">
                <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
                  <Settings2 class="h-4 w-4 text-flare-600" />
                  세척 설비 가동 ({{ selectedGate.machines.length }}대)
                </h3>
                <button
                  type="button"
                  class="bg-slate-100 text-slate-600 rounded-lg p-1 hover:bg-slate-200"
                  @click="addMachine"
                >
                  <span class="text-sm font-bold leading-none">+</span>
                </button>
              </div>

              <div
                v-if="selectedGate.machines.length === 0"
                class="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"
              >
                현재 인력 세척 모드로 가동 중입니다. (배치 인원 2명당 트럭 3대 수용 가능)
              </div>

              <div v-else class="mt-3 grid grid-cols-2 gap-3">
                <button
                  v-for="(machine, idx) in selectedGate.machines"
                  :key="machine.idx"
                  class="relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all"
                  :class="machine.active ? 'border-flare-200 bg-flare-50 text-flare-700' : 'border-slate-100 bg-slate-50 text-slate-400'"
                  @click="toggleMachine(machine.idx)"
                >
                  <button
                    type="button"
                    class="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-100"
                    @click.stop="removeMachine(machine.idx)"
                  >
                    <X class="h-3 w-3" />
                  </button>
                  <component :is="machine.active ? Power : PowerOff" class="h-6 w-6" />
                  <span class="text-[10px] font-bold">{{ idx + 1 }}번 기계 {{ machine.active ? 'ON' : 'OFF' }}</span>
                </button>
              </div>
            </div>

            <div class="mt-8">
              <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
                <Users class="h-4 w-4 text-flare-600" />
                게이트 배치 인원
              </h3>
              <div class="mt-3 flex items-center justify-between rounded-2xl border border-forena-100 bg-forena-50/30 p-2">
                <button
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-xl font-bold"
                  @click="updateManpower(-1)"
                >-</button>
                <div class="text-center">
                  <span class="text-xl font-black text-forena-900">{{ selectedGate.manpower }}</span>
                  <span class="text-xs font-bold text-forena-500 ml-1">명</span>
                </div>
                <button
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-xl font-bold"
                  @click="updateManpower(1)"
                >+</button>
              </div>
            </div>

            <div class="mt-6 flex items-start gap-2 rounded-xl p-3 text-[10px]" :class="getNoticeClass(selectedGate)">
              <AlertCircle class="h-3 w-3 shrink-0" />
              <p>{{ selectedGate.noticeMessage }}</p>
            </div>

            <div
              v-if="recommendedGate"
              class="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 shadow-sm"
            >
              <p class="text-sm font-semibold">현재 게이트가 매우 혼잡합니다.</p>
              <p class="mt-2 text-sm font-bold text-blue-900">
                가장 가까운 우회 경로: {{ recommendedGate.name }} (현재 진입: {{ recommendedGate.vehicles }}대)
              </p>
            </div>
          </div>
        </div>

        <!-- 게이트가 하나도 없을 때 -->
        <div
          v-else-if="!isLoading && gates.length === 0"
          class="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-forena-100 bg-white/60 p-8 text-center"
        >
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-flare-50 text-flare-600">
            <MapIcon class="h-6 w-6" />
          </span>
          <p class="text-sm font-bold text-forena-900">아직 등록된 게이트가 없습니다.</p>
          <p class="text-xs text-forena-500">
            우측 상단 <span class="font-semibold text-flare-600">'게이트 추가 모드'</span>를 눌러 도면 위에 게이트를 배치하세요.
          </p>
        </div>

        <!-- 게이트는 있는데 선택 해제된 상태 -->
        <div
          v-else-if="gates.length > 0"
          class="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-3xl border border-forena-100 bg-white/60 p-8 text-center shadow-card"
        >
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-forena-50 text-forena-600">
            <Navigation class="h-6 w-6" />
          </span>
          <p class="text-sm font-bold text-forena-900">게이트를 선택해주세요</p>
          <p class="text-xs text-forena-500">도면의 마커를 클릭하면 상세 정보가 표시됩니다.</p>
        </div>

        <!-- 로딩 중 -->
        <div
          v-else
          class="flex min-h-[400px] items-center justify-center rounded-3xl border border-forena-100 bg-white/60 text-sm text-forena-500 shadow-card"
        >
          게이트 정보를 불러오는 중...
        </div>
      </div>
    </div>

    <div class="w-full rounded-3xl border border-forena-100 bg-white p-6 shadow-card ring-1 ring-forena-50">
      <div class="flex flex-col gap-3 border-b border-forena-50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-forena-700 to-forena-900 text-white shadow-md">
            <Truck class="h-5 w-5" />
          </span>
          <div>
            <h2 class="text-lg font-bold text-forena-900">금일 투입 중장비 현황</h2>
            <p class="text-sm text-forena-500">작업 지시서 자재/장비 데이터 연동 전 임시 표시 목록</p>
          </div>
        </div>
        <span class="inline-flex w-fit items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
          지시서 연동 예정
        </span>
      </div>

      <div class="mt-6 overflow-x-auto">
        <table class="min-w-full divide-y divide-forena-100 text-sm">
          <thead>
            <tr class="text-left text-xs font-bold uppercase tracking-[0.18em] text-forena-500">
              <th class="px-4 py-3">장비명 / 유형</th>
              <th class="px-4 py-3">배정 게이트</th>
              <th class="px-4 py-3">협력사</th>
              <th class="px-4 py-3">관련 지시서</th>
              <th class="px-4 py-3">현재 상태</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-forena-50">
            <tr
              v-for="equipment in todayEquipments"
              :key="equipment.id"
              class="transition-colors hover:bg-slate-50/80"
            >
              <td class="px-4 py-4">
                <div class="font-bold text-forena-900">{{ equipment.name }}</div>
                <div class="mt-1 text-xs font-medium text-forena-500">{{ equipment.type }}</div>
              </td>
              <td class="px-4 py-4 font-medium text-forena-700">{{ equipment.gate }}</td>
              <td class="px-4 py-4 text-forena-700">{{ equipment.partner }}</td>
              <td class="px-4 py-4">
                <a href="#" class="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4">
                  {{ equipment.instruction }}
                </a>
              </td>
              <td class="px-4 py-4">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                  :class="getEquipStatusClass(equipment.status)"
                >
                  {{ equipment.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-card {
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 8px 10px -6px rgba(0, 0, 0, 0.05);
}
</style>