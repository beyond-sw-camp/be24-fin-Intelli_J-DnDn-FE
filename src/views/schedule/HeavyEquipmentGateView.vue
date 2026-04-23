<script setup>
import { computed, ref } from 'vue'
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

// 1. 게이트별 상태 데이터 (Gate 1 ~ 7)
const gates = ref([
  { id: 1, name: 'Gate 1 (정문)', x: 15, y: 80, vehicles: 8, machines: [true, true], manpower: 6, waitingTrucks: 0 },
  { id: 2, name: 'Gate 2 (서측)', x: 10, y: 40, vehicles: 2, machines: [true, false], manpower: 4, waitingTrucks: 0 },
  { id: 3, name: 'Gate 3 (북측)', x: 45, y: 15, vehicles: 12, machines: [false, false], manpower: 4, waitingTrucks: 0 },
  { id: 4, name: 'Gate 4 (자재)', x: 80, y: 20, vehicles: 3, machines: [true, true], manpower: 6, waitingTrucks: 0 },
  { id: 5, name: 'Gate 5 (토목)', x: 90, y: 60, vehicles: 15, machines: [true, true], manpower: 8, waitingTrucks: 0 },
  { id: 6, name: 'Gate 6 (후문)', x: 70, y: 85, vehicles: 1, machines: [true, false], manpower: 4, waitingTrucks: 0 },
  { id: 7, name: 'Gate 7 (비상)', x: 50, y: 55, vehicles: 0, machines: [false, false], manpower: 2, waitingTrucks: 0 },
])

const selectedGateId = ref(1)
const isAddMode = ref(false)
const selectedGate = computed(() => gates.value.find((g) => g.id === selectedGateId.value))
const recommendedGate = computed(() => {
  if (!selectedGate.value || getGateCongestionLevel(selectedGate.value) !== 'critical') return null

  const availableGates = gates.value.filter(
    (gate) => gate.id !== selectedGate.value.id && getGateCongestionLevel(gate) === 'smooth',
  )

  if (!availableGates.length) return null

  return availableGates.reduce((closestGate, gate) => {
    const closestDistance = Math.hypot(closestGate.x - selectedGate.value.x, closestGate.y - selectedGate.value.y)
    const currentDistance = Math.hypot(gate.x - selectedGate.value.x, gate.y - selectedGate.value.y)

    return currentDistance < closestDistance ? gate : closestGate
  })
})
const mapRef = ref(null)
const draggingGateId = ref(null)
const suppressClickGateId = ref(null)
const dragMoved = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const lastDragPoint = ref({ x: 0, y: 0 })
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

const DRAG_THRESHOLD_PX = 5

const getActiveMachines = (gate) => gate.machines.filter(Boolean).length

const getGateCapacity = (gate) => {
  const activeMachines = gate.machines.filter(Boolean).length

  if (activeMachines > 0) return activeMachines * 5 + Math.floor((gate.manpower - 2) / 2) * 3
  return Math.floor(gate.manpower / 2) * 3
}

const getGateCongestionLevel = (gate) => {
  const capacity = getGateCapacity(gate)

  if (gate.vehicles <= capacity) return 'smooth'
  if (gate.vehicles <= capacity + 3) return 'busy'
  return 'critical'
}

const isInefficientGate = (gate) => gate.machines.length > 0 && gate.vehicles <= 5 && getActiveMachines(gate) === 2

const getStatusColor = (gate) => {
  switch (getGateCongestionLevel(gate)) {
    case 'critical':
      return 'text-rose-500 bg-rose-50 border-rose-200'
    case 'busy':
      return 'text-amber-500 bg-amber-50 border-amber-200'
    default:
      return 'text-blue-500 bg-blue-50 border-blue-200'
  }
}

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

const getMarkerColor = (gate) => {
  switch (getGateCongestionLevel(gate)) {
    case 'critical':
      return 'bg-rose-500 shadow-rose-200'
    case 'busy':
      return 'bg-amber-500 shadow-amber-200'
    default:
      return 'bg-blue-500 shadow-blue-200'
  }
}

const getGateStatusLabel = (gate) => {
  switch (getGateCongestionLevel(gate)) {
    case 'critical':
      return '매우 혼잡'
    case 'busy':
      return '혼잡'
    default:
      return '원활'
  }
}

const getGateNotice = (gate) => {
  const activeMachines = getActiveMachines(gate)

  if (gate.machines.length > 0 && activeMachines === 0) {
    return {
      containerClass: 'bg-blue-50 text-blue-700',
      message: '모든 설비 OFF: 현재 인력 세척 모드로 동작 중입니다. (인원 2명당 트럭 3대 수용)',
    }
  }

  if (isInefficientGate(gate)) {
    return {
      containerClass: 'bg-amber-50 text-amber-700',
      message: '진입 차량 대비 세척 기계가 과하게 가동 중입니다. 기계 1대를 OFF하여 전력을 절감하세요.',
    }
  }

  if (getGateCongestionLevel(gate) === 'critical') {
    return {
      containerClass: 'bg-amber-50 text-amber-700',
      message: "혼잡도가 '높음'일 경우 세척 기계 2대를 모두 가동하고 배치 인원을 6명 이상으로 유지하는 것을 권장합니다.",
    }
  }

  return {
    containerClass: 'bg-blue-50 text-blue-700',
    message: '현재 최적의 상태로 운영 중입니다.',
  }
}

// 3. 인원 및 기계 제어 함수
const updateManpower = (val) => {
  if (selectedGate.value.manpower + val < 2) return
  selectedGate.value.manpower += val
}

const toggleMachine = (index) => {
  selectedGate.value.machines[index] = !selectedGate.value.machines[index]
}

const addMachine = () => {
  selectedGate.value.machines.push(false)
}

const removeMachine = (index) => {
  selectedGate.value.machines.splice(index, 1)
}

const addCustomGate = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  const nextId = gates.value.length + 1
  gates.value.push({
    id: nextId,
    name: `Gate ${nextId}`,
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    vehicles: 0,
    machines: [false, false],
    manpower: 2,
    waitingTrucks: 0,
  })

  selectedGateId.value = nextId
  isAddMode.value = false
}

const clampPercent = (value) => Math.max(0, Math.min(100, value))

const onMarkerDragStart = (gate, event) => {
  if (isAddMode.value) return
  event.stopPropagation()

  draggingGateId.value = gate.id
  dragMoved.value = false
  dragStart.value = { x: event.clientX, y: event.clientY }
  lastDragPoint.value = { x: event.clientX, y: event.clientY }

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(gate.id))
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

const onMarkerDragEnd = (gate, event) => {
  const point =
    event.clientX === 0 && event.clientY === 0
      ? lastDragPoint.value
      : { x: event.clientX, y: event.clientY }

  if (dragMoved.value && mapRef.value) {
    const rect = mapRef.value.getBoundingClientRect()
    const x = ((point.x - rect.left) / rect.width) * 100
    const y = ((point.y - rect.top) / rect.height) * 100
    gate.x = clampPercent(x)
    gate.y = clampPercent(y)
  }

  if (dragMoved.value) {
    suppressClickGateId.value = draggingGateId.value
  }
  draggingGateId.value = null
}

const onMapDragOver = (event) => {
  event.preventDefault()
}

const removeGate = (id) => {
  const index = gates.value.findIndex((gate) => gate.id === id)
  if (index === -1) return

  gates.value.splice(index, 1)
  selectedGateId.value = gates.value[0]?.id ?? null
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
      <div
        ref="mapRef"
        class="lg:col-span-2 overflow-hidden rounded-3xl border border-forena-100 shadow-card relative min-h-[500px]"
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
        <div class="absolute right-4 top-4 z-20 flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition-all"
            :class="
              isAddMode
                ? 'border-flare-300 bg-flare-100 text-flare-700 ring-2 ring-flare-200 animate-pulse'
                : 'border-forena-100 bg-white text-forena-700 hover:bg-forena-50'
            "
            @click.stop="isAddMode = !isAddMode"
          >
            <MapIcon class="h-4 w-4" />
            게이트 추가 모드
          </button>
          <span class="inline-flex h-8 items-center rounded-xl border border-forena-100 bg-white px-3 text-xs font-bold text-forena-700 shadow-sm">
            총 {{ gates.length }}개
          </span>
        </div>

        <button
          v-for="gate in gates"
          :key="gate.id"
          class="absolute flex flex-col items-center gap-1 transition-all"
          :class="draggingGateId === gate.id ? 'scale-110 cursor-grabbing opacity-50' : 'cursor-grab'"
          :style="{
            left: gate.x + '%',
            top: gate.y + '%',
            transform: 'translate(-50%, -50%)',
            zIndex: draggingGateId === gate.id ? 50 : 10,
          }"
          :draggable="!isAddMode"
          @dragstart="onMarkerDragStart(gate, $event)"
          @drag="onMarkerDrag($event)"
          @dragend="onMarkerDragEnd(gate, $event)"
          @click="onGateClick(gate.id, $event)"
        >
          <div
            class="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-white shadow-xl transition-colors"
            :class="[getMarkerColor(gate), draggingGateId === gate.id ? 'shadow-2xl ring-2 ring-white/80' : 'drop-shadow-xl']"
          >
            <Truck class="h-5 w-5" />
            <AlertCircle
              v-if="isInefficientGate(gate)"
              class="absolute -right-2 -top-2 h-5 w-5 fill-amber-500 text-white rounded-full"
            />
          </div>
          <div class="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold shadow-sm border border-forena-100 flex flex-col items-center gap-0.5">
            <span>G{{ gate.id }} (진입 {{ gate.vehicles }}대)</span>
            <span v-if="gate.waitingTrucks > 0" class="text-amber-600">대기 {{ gate.waitingTrucks }}대</span>
          </div>
        </button>
      </div>

      <div class="space-y-4">
        <div v-if="selectedGate" class="overflow-hidden rounded-3xl border border-forena-100 bg-white shadow-card ring-1 ring-forena-50">
          <div class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <span class="text-lg font-black text-forena-900">{{ selectedGate.id }}</span>
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
                  @click="selectedGate.vehicles = Math.max(0, selectedGate.vehicles - 1)"
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-white text-amber-800 shadow-sm transition hover:bg-amber-50 hover:scale-105"
                >-</button>
                <span class="px-1 text-sm font-bold text-amber-800">대기 {{ selectedGate.vehicles }}대</span>
                <button
                  type="button"
                  @click="selectedGate.vehicles++"
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-white text-amber-800 shadow-sm transition hover:bg-amber-50 hover:scale-105"
                >+</button>
              </div>

              <span
                class="rounded-full px-3 py-1 text-xs font-bold border"
                :class="getStatusColor(selectedGate)"
              >
                {{ getGateStatusLabel(selectedGate) }}
              </span>

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
              ⚠️ 현재 인력 세척 모드로 가동 중입니다. (배치 인원 2명당 트럭 3대 수용 가능)
            </div>

            <div v-else class="mt-3 grid grid-cols-2 gap-3">
              <button
                v-for="(on, idx) in selectedGate.machines"
                :key="idx"
                @click="toggleMachine(idx)"
                class="relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all"
                :class="on ? 'border-flare-200 bg-flare-50 text-flare-700' : 'border-slate-100 bg-slate-50 text-slate-400'"
              >
                <button
                  type="button"
                  class="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-100"
                  @click.stop="removeMachine(idx)"
                >
                  <X class="h-3 w-3" />
                </button>
                <component :is="on ? Power : PowerOff" class="h-6 w-6" />
                <span class="text-[10px] font-bold">{{ idx + 1 }}번 기계 {{ on ? 'ON' : 'OFF' }}</span>
              </button>
            </div>
          </div>

          <div class="mt-8">
            <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
              <Users class="h-4 w-4 text-flare-600" />
              게이트 배치 인원
            </h3>
            <div class="mt-3 flex items-center justify-between rounded-2xl border border-forena-100 bg-forena-50/30 p-2">
              <button @click="updateManpower(-1)" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-xl font-bold">-</button>
              <div class="text-center">
                <span class="text-xl font-black text-forena-900">{{ selectedGate.manpower }}</span>
                <span class="text-xs font-bold text-forena-500 ml-1">명</span>
              </div>
              <button @click="updateManpower(1)" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 text-xl font-bold">+</button>
            </div>
          </div>

          <div class="mt-6 flex items-start gap-2 rounded-xl p-3 text-[10px]" :class="getGateNotice(selectedGate).containerClass">
            <AlertCircle class="h-3 w-3 shrink-0" />
            <p>{{ getGateNotice(selectedGate).message }}</p>
          </div>

          <div
            v-if="recommendedGate"
            class="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 shadow-sm"
          >
            <p class="text-sm font-semibold">⚠️ 현재 게이트가 매우 혼잡합니다.</p>
            <p class="mt-2 text-sm font-bold text-blue-900">
              가장 가까운 우회 경로: {{ recommendedGate.name }} (현재 진입: {{ recommendedGate.vehicles }}대)
            </p>
          </div>
          </div>
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
            <tr v-for="equipment in todayEquipments" :key="equipment.id" class="transition-colors hover:bg-slate-50/80">
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
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}
</style>
