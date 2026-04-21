<script setup>
import { computed, ref } from 'vue'
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
} from 'lucide-vue-next'

// 1. 게이트별 상태 데이터 (Gate 1 ~ 7)
const gates = ref([
  { id: 1, name: 'Gate 1 (정문)', x: 15, y: 80, vehicles: 8, machines: [true, true], manpower: 6 },
  { id: 2, name: 'Gate 2 (서측)', x: 10, y: 40, vehicles: 2, machines: [true, false], manpower: 4 },
  { id: 3, name: 'Gate 3 (북측)', x: 45, y: 15, vehicles: 12, machines: [false, false], manpower: 4 },
  { id: 4, name: 'Gate 4 (자재)', x: 80, y: 20, vehicles: 3, machines: [true, true], manpower: 6 },
  { id: 5, name: 'Gate 5 (토목)', x: 90, y: 60, vehicles: 15, machines: [true, true], manpower: 8 },
  { id: 6, name: 'Gate 6 (후문)', x: 70, y: 85, vehicles: 1, machines: [true, false], manpower: 4 },
  { id: 7, name: 'Gate 7 (비상)', x: 50, y: 55, vehicles: 0, machines: [false, false], manpower: 2 },
])

const selectedGateId = ref(1)
const isAddMode = ref(false)
const selectedGate = computed(() => gates.value.find((g) => g.id === selectedGateId.value))
const mapRef = ref(null)
const draggingGateId = ref(null)
const suppressClickGateId = ref(null)
const dragMoved = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const lastDragPoint = ref({ x: 0, y: 0 })

const DRAG_THRESHOLD_PX = 5

// 2. 중장비 밀집도에 따른 색상 계산 (5대 이상이면 위험)
const getStatusColor = (count) => {
  if (count >= 10) return 'text-rose-500 bg-rose-50 border-rose-200' // 매우 혼잡
  if (count >= 5) return 'text-orange-500 bg-orange-50 border-orange-200' // 혼잡
  return 'text-emerald-500 bg-emerald-50 border-emerald-200' // 원활
}

const getMarkerColor = (count) => {
  if (count >= 5) return 'bg-rose-500 shadow-rose-200'
  return 'bg-emerald-500 shadow-emerald-200'
}

// 3. 인원 및 기계 제어 함수
const updateManpower = (val) => {
  if (selectedGate.value.manpower + val < 0) return
  selectedGate.value.manpower += val
}

const toggleMachine = (index) => {
  selectedGate.value.machines[index] = !selectedGate.value.machines[index]
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
        class="lg:col-span-2 overflow-hidden rounded-3xl border border-forena-100 bg-slate-50 shadow-card relative min-h-[500px]"
        :class="draggingGateId !== null ? 'cursor-grabbing' : isAddMode ? 'cursor-crosshair' : ''"
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

        <div class="absolute inset-0 flex items-center justify-center opacity-20">
          <MapIcon class="h-64 w-64 text-slate-300" />
          <span class="absolute text-sm font-bold text-slate-400">SITE PLAN VIEW (DNDN)</span>
        </div>

        <svg class="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100">
          <path d="M10,20 L90,20 L90,80 L10,80 Z" fill="none" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2" />
        </svg>

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
            class="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-white shadow-lg transition-colors"
            :class="[getMarkerColor(gate.vehicles), draggingGateId === gate.id ? 'shadow-2xl ring-2 ring-white/80' : '']"
          >
            <Truck class="h-5 w-5" />
          </div>
          <div class="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold shadow-sm border border-forena-100">
            G{{ gate.id }} ({{ gate.vehicles }}대)
          </div>
        </button>
      </div>

      <div class="space-y-4">
        <div v-if="selectedGate" class="rounded-3xl border border-forena-100 bg-white p-6 shadow-card ring-1 ring-forena-50">
          <div class="flex items-center justify-between border-b border-forena-50 pb-4">
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-forena-900">{{ selectedGate.name }}</h2>
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                @click.stop="removeGate(selectedGate.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-bold border" :class="getStatusColor(selectedGate.vehicles)">
              {{ selectedGate.vehicles >= 5 ? '혼잡' : '원활' }}
            </span>
          </div>

          <div class="mt-6">
            <div class="flex items-center justify-between text-sm font-bold text-forena-500 uppercase tracking-wider">
              <span>현재 진입 중장비</span>
              <span :class="selectedGate.vehicles >= 5 ? 'text-rose-500' : 'text-emerald-500'">{{ selectedGate.vehicles }}대</span>
            </div>
            <div class="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full transition-all duration-500"
                :class="selectedGate.vehicles >= 5 ? 'bg-rose-500' : 'bg-emerald-500'"
                :style="{ width: Math.min((selectedGate.vehicles / 20) * 100, 100) + '%' }"
              ></div>
            </div>
          </div>

          <div class="mt-8">
            <h3 class="flex items-center gap-2 text-sm font-bold text-forena-900">
              <Settings2 class="h-4 w-4 text-flare-600" />
              세척 설비 가동 (2대)
            </h3>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <button
                v-for="(on, idx) in selectedGate.machines"
                :key="idx"
                @click="toggleMachine(idx)"
                class="flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all"
                :class="on ? 'border-flare-200 bg-flare-50 text-flare-700' : 'border-slate-100 bg-slate-50 text-slate-400'"
              >
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

          <div class="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[10px] text-amber-700">
            <AlertCircle class="h-3 w-3 shrink-0" />
            <p>혼잡도가 '높음'일 경우 세척 기계 2대를 모두 가동하고 배치 인원을 6명 이상으로 유지하는 것을 권장합니다.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-card {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}
</style>
