<script setup>
import { CalendarDays, Navigation } from 'lucide-vue-next'

defineProps({
  targetDate: {
    type: String,
    required: true,
  },
  equipmentCount: {
    type: Number,
    default: 0,
  },
  totalAssignedEquipmentCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits({
  'update:targetDate': (value) => typeof value === 'string',
})

function updateTargetDate(event) {
  emit('update:targetDate', event.target.value)
}
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-white p-6 shadow-card">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md">
          <Navigation class="h-5 w-5" />
        </span>
        <div>
          <h1 class="text-xl font-bold text-forena-900">중장비 입출차 현황 관제</h1>
          <p class="text-sm text-forena-600">
            작업지시서의 중장비·게이트 배정과 실시간 게이트 운영 상태를 함께 확인합니다.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <label class="rounded-2xl border border-forena-100 bg-white/90 p-3 shadow-sm">
          <span class="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-forena-500">
            <CalendarDays class="h-3 w-3" />
            기준 날짜
          </span>
          <input
            :value="targetDate"
            type="date"
            class="rounded-xl border border-forena-200 px-3 py-2 text-sm font-semibold text-forena-800 focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-100"
            @change="updateTargetDate"
          />
        </label>

        <span class="inline-flex h-fit items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
          작업지시서 장비 {{ equipmentCount }}건 · 총 {{ totalAssignedEquipmentCount }}대
        </span>
      </div>
    </div>
  </div>
</template>
