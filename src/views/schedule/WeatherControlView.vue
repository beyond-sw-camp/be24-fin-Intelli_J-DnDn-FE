<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { fetchWeatherDashboard, fetchWorkOrders } from '@/api/weather.js'
import { getTodayDateText, calculateRainPercent, getFineDustValue, generateLiveRiskActions, getThreeDayForecast, getWeeklyForecast, getMonthlyForecast, getSourceLabel, riskPriority } from '@/utils/weatherControlMapper.js'
import WeatherControlHeader from '@/components/weather/WeatherControlHeader.vue'
import WeatherSummaryCards from '@/components/weather/WeatherSummaryCards.vue'
import LiveActionChecklist from '@/components/weather/LiveActionChecklist.vue'
import WeatherRiskPanel from '@/components/weather/WeatherRiskPanel.vue'
import WeatherForecastPanel from '@/components/weather/WeatherForecastPanel.vue'

const reportDate = ref(getTodayDateText())
const loading = ref(false)
const dashboard = ref(null)
const workOrdersData = ref([])
const forecastTab = ref('week')
const selectedMonthWeekId = ref(null)

async function loadData() {
  loading.value = true
  try {
    dashboard.value = await fetchWeatherDashboard(reportDate.value)
    workOrdersData.value = await fetchWorkOrders(reportDate.value)
  } catch (error) {
    console.error('[WeatherControlView] 데이터 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
watch(reportDate, () => loadData())

const today = computed(() => dashboard.value?.today ?? null)
const week = computed(() => dashboard.value?.week ?? null)
const rain = computed(() => dashboard.value?.rain ?? null)
const airQuality = computed(() => dashboard.value?.airQuality ?? null)
const analysis = computed(() => dashboard.value?.analysis ?? null)
const equipmentRisks = computed(() => dashboard.value?.equipmentRisks ?? [])
const planRisks = computed(() => dashboard.value?.planRisks ?? [])
const forecastDays = computed(() => dashboard.value?.forecastDays ?? [])
const alerts = computed(() => dashboard.value?.alerts ?? [])

const sourceLabel = computed(() => getSourceLabel(analysis.value?.sourceType))
const rainPercent = computed(() => calculateRainPercent(analysis.value, rain.value))
const fineDustValue = computed(() => getFineDustValue(analysis.value, airQuality.value))
const liveRiskActions = computed(() => generateLiveRiskActions(analysis.value, alerts.value))

const sortedEquipmentRisks = computed(() => [...equipmentRisks.value].sort((a, b) => riskPriority(a.level) - riskPriority(b.level)))
const sortedPlanRisks = computed(() => [...planRisks.value].sort((a, b) => riskPriority(a.level) - riskPriority(b.level)))

const threeDayForecast = computed(() => getThreeDayForecast(forecastDays.value))
const weeklyForecast = computed(() => getWeeklyForecast(forecastDays.value))
const monthlyForecast = computed(() => getMonthlyForecast(forecastDays.value))
</script>

<template>
  <div class="space-y-5 pb-10">
    <WeatherControlHeader v-model:report-date="reportDate" :source-label="sourceLabel" />
    <div class="grid gap-4 xl:grid-cols-[540px_minmax(0,1fr)] xl:items-stretch">
      <div class="flex h-full flex-col gap-4">
        <WeatherSummaryCards :today="today" :week="week" :rain-percent="rainPercent" :fine-dust-value="fineDustValue" :air-quality="airQuality" />
        <LiveActionChecklist :actions="liveRiskActions" :loading="loading" />
      </div>
      <WeatherRiskPanel :equipment-risks="sortedEquipmentRisks" :plan-risks="sortedPlanRisks" :work-orders-data="workOrdersData" />
    </div>
    <WeatherForecastPanel v-model:tab="forecastTab" v-model:selected-month-week-id="selectedMonthWeekId" :three-day-forecast="threeDayForecast" :weekly-forecast="weeklyForecast" :monthly-forecast="monthlyForecast" />
  </div>
</template>