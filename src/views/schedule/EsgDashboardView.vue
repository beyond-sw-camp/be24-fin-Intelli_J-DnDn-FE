<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { fetchEsgDashboard } from '@/api/esg.js'
import { fetchWorkOrdersByDate } from '@/api/workOrder.js'
import { getTodayDateText } from '@/utils/weatherControlMapper.js'
import { getAllZones, calculateEsgScore } from '@/utils/esgDashboardMapper.js'
import EsgZoneSelector from '@/components/esg/EsgZoneSelector.vue'
import EsgSummaryCards from '@/components/esg/EsgSummaryCards.vue'
import EsgBuildingGrowthCard from '@/components/esg/EsgBuildingGrowthCard.vue'
import EsgMissionCard from '@/components/esg/EsgMissionCard.vue'
import EsgRankingCard from '@/components/esg/EsgRankingCard.vue'

const reportDate = ref(getTodayDateText())
const selectedZoneId = ref(null)
const esgData = ref(null)
const workOrders = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    esgData.value = await fetchEsgDashboard(reportDate.value)
    workOrders.value = await fetchWorkOrdersByDate(reportDate.value)
    
    if (!selectedZoneId.value && allZones.value.length > 0) {
      selectedZoneId.value = allZones.value[0].id
    }
  } catch (error) {
    console.error('[EsgDashboardView] 데이터 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
watch(reportDate, () => loadData())

const allZones = computed(() => getAllZones(workOrders.value))
const selectedZone = computed(() => allZones.value.find((z) => z.id === selectedZoneId.value))
const esgScore = computed(() => calculateEsgScore(selectedZoneId.value, esgData.value?.scoresByZone?.[selectedZoneId.value]))
const safetyDays = computed(() => esgData.value?.safetyDays?.[selectedZoneId.value] || 0)
const ranking = computed(() => esgData.value?.ranking || 1)
</script>

<template>
  <div class="space-y-5 pb-10">
    <div class="rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-emerald-50/30 to-flare-50/20 p-6 shadow-card">
      <h1 class="text-2xl font-bold text-forena-900">ESG 대시보드</h1>
      <p class="mt-1 text-sm text-forena-700">현장의 환경·사회·거버넌스 성과를 체계적으로 관리합니다.</p>
    </div>
    <EsgZoneSelector :zones="allZones" :selected-zone-id="selectedZoneId" @select-zone="(id) => (selectedZoneId = id)" />
    <EsgSummaryCards :esg-score="esgScore" key-focus="안전 문화" :safety-days="safetyDays" :ranking="ranking" />
    <div class="grid gap-4 lg:grid-cols-2">
      <EsgBuildingGrowthCard :selected-zone="selectedZone" :esg-score="esgScore" />
      <EsgRankingCard />
    </div>
    <EsgMissionCard :selected-zone-id="selectedZoneId" />
  </div>
</template>