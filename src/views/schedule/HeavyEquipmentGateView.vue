<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { fetchGateEquipments } from '@/api/workOrder.js'
import { groupEquipmentsByGate } from '@/utils/gateMapper.js'
import { getTodayDateText } from '@/utils/weatherControlMapper.js'
import GateMapPanel from '@/components/gate/GateMapPanel.vue'
import GateDetailPanel from '@/components/gate/GateDetailPanel.vue'
import GateEquipmentList from '@/components/gate/GateEquipmentList.vue'

const targetDate = ref(getTodayDateText())
const selectedGateId = ref(null)
const equipments = ref([])
const gates = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const data = await fetchGateEquipments(targetDate.value)
    equipments.value = data
    
    const gateSet = new Set(data.map((e) => e.gateIdx).filter(Boolean))
    gates.value = Array.from(gateSet)
      .sort((a, b) => a - b)
      .map((gateIdx) => ({
        idx: gateIdx,
        totalCount: data.filter((e) => e.gateIdx === gateIdx).reduce((sum, e) => sum + (e.equipmentCount || 1), 0),
        x: Math.random() * 50 + 25,
        y: Math.random() * 50 + 25,
      }))
    
    if (gates.value.length > 0 && !selectedGateId.value) {
      selectedGateId.value = gates.value[0].idx
    }
  } catch (error) {
    console.error('[HeavyEquipmentGateView] 데이터 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
watch(targetDate, () => loadData())

const gateEquipmentGroups = computed(() => groupEquipmentsByGate(equipments.value))
const selectedGate = computed(() => gates.value.find((g) => g.idx === selectedGateId.value))
</script>

<template>
  <div class="space-y-5 pb-10">
    <div class="rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-blue-50/40 to-flare-50/20 p-6 shadow-card">
      <h1 class="text-2xl font-bold text-forena-900">중장비 입/출차 관리</h1>
      <p class="mt-1 text-sm text-forena-700">게이트별 중장비 입출차 현황을 실시간으로 관리합니다.</p>
    </div>
    <div class="grid gap-4 lg:grid-cols-[1fr_400px]">
      <GateMapPanel :gates="gates" :selected-gate-id="selectedGateId" :loading="loading" @select-gate="(id) => (selectedGateId = id)" />
      <div class="space-y-4">
        <GateDetailPanel :selected-gate="selectedGate" :loading="loading" />
        <GateEquipmentList :gate-equipment-groups="gateEquipmentGroups" :selected-gate-id="selectedGateId" :loading="loading" />
      </div>
    </div>
  </div>
</template>
