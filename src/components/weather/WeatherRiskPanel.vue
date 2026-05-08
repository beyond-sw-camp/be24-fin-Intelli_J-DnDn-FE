<script setup>
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { levelBadgeClass, actionBadgeLabel, cleanRiskTitle, riskPriority } from '@/utils/weatherControlMapper.js'

const props = defineProps({
  equipmentRisks: {
    type: Array,
    default: () => [],
  },
  planRisks: {
    type: Array,
    default: () => [],
  },
  workOrdersData: {
    type: Array,
    default: () => [],
  },
})

const sortedEquipmentRisks = computed(() => [...props.equipmentRisks].sort((a, b) => riskPriority(a.level) - riskPriority(b.level)))
const sortedPlanRisks = computed(() => [...props.planRisks].sort((a, b) => riskPriority(a.level) - riskPriority(b.level)))

function getLevelBadgeClass(level) {
  if (level === '경고' || level === '위험') return 'border border-rose-200 bg-rose-100 text-rose-700'
  if (level === '주의') return 'border border-amber-200 bg-amber-100 text-amber-700'
  return 'border border-emerald-200 bg-emerald-100 text-emerald-700'
}
</script>

<template>
  <div class="space-y-4">
    <article class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
      <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-forena-900"><AlertTriangle class="h-5 w-5 text-amber-600" />위험 장비 통제</h2>
      <div v-if="sortedEquipmentRisks.length === 0" class="rounded-xl border border-dashed border-forena-200 bg-forena-50/50 py-6 text-center"><p class="text-sm text-forena-600">위험 장비가 없습니다.</p></div>
      <ul v-else class="space-y-3">
        <li v-for="risk in sortedEquipmentRisks" :key="risk.id" class="rounded-xl border border-forena-100 bg-forena-50/40 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2"><span :class="`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${levelBadgeClass(risk.level)}`">{{ actionBadgeLabel(risk.level) }}</span><p class="font-semibold text-forena-900">{{ cleanRiskTitle(risk.title) }}</p></div>
              <p class="mt-2 text-sm leading-relaxed text-forena-700">AI 추천: {{ risk.recommendation || '위험 대비 필요' }}</p>
            </div>
            <span :class="`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${getLevelBadgeClass(risk.level)}`">{{ risk.level }}</span>
          </div>
        </li>
      </ul>
    </article>

    <article class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
      <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-forena-900"><AlertTriangle class="h-5 w-5 text-rose-600" />계획 대비 위험 경고</h2>
      <div v-if="sortedPlanRisks.length === 0" class="rounded-xl border border-dashed border-forena-200 bg-forena-50/50 py-6 text-center"><p class="text-sm text-forena-600">현재 계획 관련 위험 경고가 없습니다.</p></div>
      <ul v-else class="space-y-3">
        <li v-for="risk in sortedPlanRisks" :key="risk.id" class="rounded-xl border border-forena-100 bg-forena-50/40 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2"><span :class="`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${levelBadgeClass(risk.level)}`">{{ actionBadgeLabel(risk.level) }}</span><p class="font-semibold text-forena-900">{{ cleanRiskTitle(risk.title) }}</p></div>
              <p class="mt-2 text-sm leading-relaxed text-forena-700">{{ risk.reason || '기상 조건에 따른 위험' }}</p>
              <p class="mt-1 text-sm font-medium text-forena-800">AI 추천: {{ risk.recommendation || '상황 모니터링 필요' }}</p>
            </div>
            <span :class="`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${getLevelBadgeClass(risk.level)}`">{{ risk.level }}</span>
          </div>
        </li>
      </ul>
    </article>
  </div>
</template>