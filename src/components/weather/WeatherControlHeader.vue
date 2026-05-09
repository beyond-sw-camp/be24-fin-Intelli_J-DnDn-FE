<script setup>
import { CloudSun } from 'lucide-vue-next'
import { WEATHER_CONTROL_TEXT } from '@/utils/weatherControlMapper.js'

defineProps({
  reportDate: {
    type: String,
    required: true,
  },
  sourceLabel: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits({
  'update:reportDate': (value) => typeof value === 'string',
})

function updateReportDate(event) {
  emit('update:reportDate', event.target.value)
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-sky-50/40 to-flare-50/20 p-6 shadow-card"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-forena-500 to-flare-500"
    />
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-start gap-3">
        <span
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-forena-700 text-white shadow-md"
        >
          <CloudSun class="h-5 w-5" />
        </span>
        <div>
          <h1 class="text-gradient-brand text-2xl font-bold tracking-tight">{{ WEATHER_CONTROL_TEXT.title }}</h1>
          <p class="mt-1 max-w-3xl text-sm leading-relaxed text-forena-700/80">
            {{ WEATHER_CONTROL_TEXT.desc }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span
          class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm"
          :class="sourceLabel.tone"
        >
          <span class="relative flex h-1.5 w-1.5">
            <span class="absolute inset-0 animate-ping rounded-full bg-current opacity-75" />
            <span class="relative h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          {{ sourceLabel.label }}
        </span>

        <div class="rounded-2xl border border-forena-100/80 bg-white/90 p-3 shadow-sm">
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-bold uppercase tracking-wide text-forena-500">기준 날짜</span>
            <input
              :value="reportDate"
              type="date"
              class="rounded-xl border border-forena-200 px-3 py-2 text-sm text-forena-800 focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
              @change="updateReportDate"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
