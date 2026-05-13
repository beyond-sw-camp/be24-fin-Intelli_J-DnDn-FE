<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import siteLayout from '@/assets/Firefly_Gemini Flash.png'
import HeavyEquipmentGateDetail from '@/components/gate/HeavyEquipmentGateDetail.vue'
import HeavyEquipmentHeader from '@/components/gate/HeavyEquipmentHeader.vue'
import HeavyEquipmentMapPanel from '@/components/gate/HeavyEquipmentMapPanel.vue'
import HeavyEquipmentStatusTable from '@/components/gate/HeavyEquipmentStatusTable.vue'
import {
  addHeavyEquipmentGateMachine,
  createHeavyEquipmentGate,
  deleteHeavyEquipmentGate,
  fetchGateWorkOrderEquipments,
  fetchHeavyEquipmentGate,
  fetchHeavyEquipmentGateList,
  removeHeavyEquipmentGateMachine,
  toggleHeavyEquipmentGateMachine,
  updateHeavyEquipmentGateManpower,
  updateHeavyEquipmentGatePosition,
  updateHeavyEquipmentGateVehicles,
} from '@/api/heavyEquipmentGate.js'
import {
  BLUEPRINT_STORAGE_KEY,
  BLUEPRINT_ZOOM_STEP,
  MAX_BLUEPRINT_ZOOM,
  MIN_BLUEPRINT_ZOOM,
  buildEquipmentCountByGateKey,
  getClosestSmoothGate,
  getEquipmentStatusClass,
  getGateBusinessKey,
  getGateCapacityValue,
  getGateDisplayCongestion,
  getGateDisplayCongestionLabel,
  getGateVehicleCountForDisplay,
  getMarkerColor,
  getNoticeClass,
  getNoticeMessage,
  getPlannedEquipmentCount,
  getStatusColor,
  getTodayDateText,
  mapWorkOrderEquipments,
} from '@/utils/heavyEquipmentGateMapper.js'

const gates = ref([])
const selectedGateId = ref(null)
const isAddMode = ref(false)
const isLoading = ref(false)
const targetDate = ref(getTodayDateText())
const workOrderEquipments = ref([])
const isEquipmentLoading = ref(false)
const draggingGateId = ref(null)

const blueprintInputRef = ref(null)
const customBlueprint = ref(null)
const blueprintAspectRatio = ref('16 / 10')
const blueprintZoom = ref(1)

const activeBlueprint = computed(() => customBlueprint.value || siteLayout)
const blueprintZoomPercent = computed(() => `${Math.round(blueprintZoom.value * 100)}%`)
const gateMarkerScale = computed(() =>
  Math.max(0.82, Math.min(1.12, 0.88 + blueprintZoom.value * 0.12)),
)
const isBlueprintZoomed = computed(() => blueprintZoom.value > 1.01)
const mapCursorClass = computed(() => {
  if (draggingGateId.value !== null) return 'cursor-grabbing'
  if (isAddMode.value) return 'cursor-crosshair'
  if (isBlueprintZoomed.value) return 'cursor-grab'
  return ''
})

const todayEquipments = computed(() =>
  mapWorkOrderEquipments(workOrderEquipments.value, gates.value),
)
const hasTodayEquipments = computed(() => todayEquipments.value.length > 0)
const totalAssignedEquipmentCount = computed(() =>
  todayEquipments.value.reduce((sum, equipment) => sum + (equipment.count ?? 1), 0),
)
const equipmentCountByGateKey = computed(() => buildEquipmentCountByGateKey(todayEquipments.value))

const displayGates = computed(() => {
  return gates.value.map((gate) => enrichGate(gate))
})

const selectedGate = computed(() => {
  const gate = gates.value.find((item) => item.idx === selectedGateId.value)
  return gate ? enrichGate(gate) : null
})

const recommendedGate = computed(() => {
  const gate = selectedGate.value
  if (!gate) return null

  const closestGate = getClosestSmoothGate(gate, gates.value, equipmentCountByGateKey.value)
  return closestGate ? enrichGate(closestGate) : null
})

function enrichGate(gate) {
  const plannedEquipmentCount = getPlannedEquipmentCount(gate, equipmentCountByGateKey.value)
  const displayCongestion = getGateDisplayCongestion(gate, equipmentCountByGateKey.value)

  return {
    ...gate,
    businessKey: getGateBusinessKey(gate),
    capacityValue: getGateCapacityValue(gate),
    displayCongestion,
    displayCongestionLabel: getGateDisplayCongestionLabel(gate, equipmentCountByGateKey.value),
    displayVehicleCount: getGateVehicleCountForDisplay(gate, equipmentCountByGateKey.value),
    markerColor: getMarkerColor(gate, equipmentCountByGateKey.value),
    noticeClass: getNoticeClass(gate, equipmentCountByGateKey.value),
    noticeMessage: getNoticeMessage(gate, equipmentCountByGateKey.value),
    plannedEquipmentCount,
    statusColor: getStatusColor(gate, equipmentCountByGateKey.value),
  }
}

const displayEquipments = computed(() => {
  return todayEquipments.value.map((equipment) => ({
    ...equipment,
    statusClass: getEquipmentStatusClass(equipment.status),
  }))
})

async function loadGates() {
  isLoading.value = true

  try {
    gates.value = await fetchHeavyEquipmentGateList()

    if (gates.value.length && !selectedGateId.value) {
      selectedGateId.value = gates.value[0].idx
    }
  } catch (error) {
    console.error('게이트 목록 조회 실패', error)
    gates.value = []
  } finally {
    isLoading.value = false
  }
}

async function loadTodayEquipments() {
  isEquipmentLoading.value = true

  try {
    workOrderEquipments.value = await fetchGateWorkOrderEquipments(targetDate.value)
  } catch (error) {
    console.error('작업지시서 장비 조회 실패', error)
    workOrderEquipments.value = []
  } finally {
    isEquipmentLoading.value = false
  }
}

async function refreshGate(gateId) {
  try {
    const updated = await fetchHeavyEquipmentGate(gateId)
    const index = gates.value.findIndex((gate) => gate.idx === gateId)

    if (index !== -1) {
      gates.value[index] = updated
    } else {
      gates.value.push(updated)
    }
  } catch (error) {
    console.error('게이트 갱신 실패', error)
  }
}

async function loadPageData() {
  await Promise.all([loadGates(), loadTodayEquipments()])
}

function updateTargetDate(value) {
  targetDate.value = value
}

async function updateManpower(delta) {
  if (!selectedGate.value) return

  const next = selectedGate.value.manpower + delta
  if (next < 2) return

  try {
    await updateHeavyEquipmentGateManpower(selectedGate.value.idx, next)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('배치 인원 수정 실패', error)
  }
}

async function updateVehicles(delta) {
  if (!selectedGate.value) return

  const next = Math.max(0, selectedGate.value.vehicles + delta)

  try {
    await updateHeavyEquipmentGateVehicles(selectedGate.value.idx, next)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('진입 차량 수정 실패', error)
  }
}

async function toggleMachine(machineId) {
  if (!selectedGate.value) return

  try {
    await toggleHeavyEquipmentGateMachine(selectedGate.value.idx, machineId)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('세척 기계 토글 실패', error)
  }
}

async function addMachine() {
  if (!selectedGate.value) return

  try {
    await addHeavyEquipmentGateMachine(selectedGate.value.idx)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('세척 기계 추가 실패', error)
  }
}

async function removeMachine(machineId) {
  if (!selectedGate.value) return

  try {
    await removeHeavyEquipmentGateMachine(selectedGate.value.idx, machineId)
    await refreshGate(selectedGate.value.idx)
  } catch (error) {
    console.error('세척 기계 삭제 실패', error)
  }
}

async function addCustomGate({ x, y }) {
  const nextSeq = gates.value.length + 1

  try {
    const created = await createHeavyEquipmentGate({
      name: `Gate ${nextSeq}`,
      x,
      y,
    })

    await loadGates()
    selectedGateId.value =
      typeof created === 'number'
        ? created
        : (created?.idx ?? gates.value[gates.value.length - 1]?.idx ?? null)
    isAddMode.value = false
  } catch (error) {
    console.error('게이트 등록 실패', error)
  }
}

async function removeGate(gateId) {
  try {
    await deleteHeavyEquipmentGate(gateId)
    gates.value = gates.value.filter((gate) => gate.idx !== gateId)

    if (selectedGateId.value === gateId) {
      selectedGateId.value = gates.value[0]?.idx ?? null
    }
  } catch (error) {
    console.error('게이트 삭제 실패', error)
  }
}

function handleMarkerDragStart({ gate, event }) {
  event.stopPropagation()
  draggingGateId.value = gate.idx

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(gate.idx))
  }
}

async function handleMarkerDragEnd({ gate, x, y }) {
  draggingGateId.value = null

  gate.x = x
  gate.y = y

  try {
    await updateHeavyEquipmentGatePosition(gate.idx, { x, y })
    await refreshGate(gate.idx)
  } catch (error) {
    console.error('게이트 좌표 저장 실패', error)
    await refreshGate(gate.idx)
  }
}

function handleMarkerClick({ gateId, event }) {
  event.stopPropagation()
  selectedGateId.value = gateId
}

function clearSelectedGate() {
  selectedGateId.value = null
}

function toggleAddMode() {
  isAddMode.value = !isAddMode.value
}

function loadBlueprintFromStorage() {
  try {
    const saved = window.localStorage.getItem(BLUEPRINT_STORAGE_KEY)
    if (saved) customBlueprint.value = saved
  } catch (error) {
    console.error(error)
  }
}

function triggerBlueprintUpload() {
  blueprintInputRef.value?.click()
}

function handleBlueprintUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    window.alert('이미지 파일만 업로드할 수 있습니다.')
    event.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    window.alert('5MB 이하 이미지만 업로드할 수 있습니다.')
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (readerEvent) => {
    const dataUrl = readerEvent.target?.result
    if (typeof dataUrl !== 'string') return

    customBlueprint.value = dataUrl
    blueprintZoom.value = 1

    try {
      window.localStorage.setItem(BLUEPRINT_STORAGE_KEY, dataUrl)
    } catch (error) {
      console.error(error)
    }
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function resetBlueprint() {
  customBlueprint.value = null
  blueprintZoom.value = 1

  try {
    window.localStorage.removeItem(BLUEPRINT_STORAGE_KEY)
  } catch (error) {
    console.error(error)
  }
}

function zoomInBlueprint() {
  blueprintZoom.value = Math.min(MAX_BLUEPRINT_ZOOM, blueprintZoom.value + BLUEPRINT_ZOOM_STEP)
}

function zoomOutBlueprint() {
  blueprintZoom.value = Math.max(MIN_BLUEPRINT_ZOOM, blueprintZoom.value - BLUEPRINT_ZOOM_STEP)
}

function resetBlueprintZoom() {
  blueprintZoom.value = 1
}

onMounted(() => {
  loadPageData()
  loadBlueprintFromStorage()
})

watch(targetDate, () => {
  loadTodayEquipments()
})
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 pb-6">
    <HeavyEquipmentHeader
      :target-date="targetDate"
      :equipment-count="todayEquipments.length"
      :total-assigned-equipment-count="totalAssignedEquipmentCount"
      @update:target-date="updateTargetDate"
    />

    <input
      ref="blueprintInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleBlueprintUpload"
    />

    <div class="grid gap-6 [--gate-panel-height:clamp(560px,calc(100vh-220px),720px)] min-[1440px]:grid-cols-3 min-[1440px]:items-stretch">
      <HeavyEquipmentMapPanel
        :active-blueprint="activeBlueprint"
        :blueprint-aspect-ratio="blueprintAspectRatio"
        :blueprint-zoom="blueprintZoom"
        :blueprint-zoom-percent="blueprintZoomPercent"
        :custom-blueprint="customBlueprint"
        :dragging-gate-id="draggingGateId"
        :gate-marker-scale="gateMarkerScale"
        :gates="displayGates"
        :is-add-mode="isAddMode"
        :is-loading="isLoading"
        :map-cursor-class="mapCursorClass"
        @add-gate="addCustomGate"
        @marker-click="handleMarkerClick"
        @marker-drag-end="handleMarkerDragEnd"
        @marker-drag-start="handleMarkerDragStart"
        @reset-blueprint="resetBlueprint"
        @reset-zoom="resetBlueprintZoom"
        @toggle-add-mode="toggleAddMode"
        @trigger-blueprint-upload="triggerBlueprintUpload"
        @zoom-in="zoomInBlueprint"
        @zoom-out="zoomOutBlueprint"
      />

      <HeavyEquipmentGateDetail
        :gates="displayGates"
        :recommended-gate="recommendedGate"
        :selected-gate="selectedGate"
        @add-machine="addMachine"
        @clear-selected-gate="clearSelectedGate"
        @remove-gate="removeGate"
        @remove-machine="removeMachine"
        @toggle-machine="toggleMachine"
        @update-manpower="updateManpower"
        @update-vehicles="updateVehicles"
      />
    </div>

    <HeavyEquipmentStatusTable
      :equipments="displayEquipments"
      :has-equipments="hasTodayEquipments"
      :is-loading="isEquipmentLoading"
    />
  </div>
</template>

<style scoped>
.shadow-card {
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 8px 10px -6px rgba(0, 0, 0, 0.05);
}
</style>
