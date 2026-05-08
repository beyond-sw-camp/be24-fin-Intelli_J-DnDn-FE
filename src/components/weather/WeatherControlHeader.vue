<script setup>
import { CloudSun } from 'lucide-vue-next'

defineProps({
  reportDate: {
    type: String,
    required: true,
  },
  sourceLabel: {
    type: Object,
    default: () => ({ label: '데이터 없음', tone: 'text-slate-600 bg-slate-50 border-slate-200' }),
  },
})

defineEmits(['update:reportDate'])
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-sky-50/40 to-flare-50/20 p-6 shadow-card">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-forena-500 to-flare-500" />
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-forena-700 text-white shadow-md">
          <CloudSun class="h-5 w-5" />
        </span>
        <div>
          <h1 class="text-gradient-brand text-2xl font-bold tracking-tight">기상 관제</h1>
          <p class="mt-1 max-w-3xl text-sm leading-relaxed text-forena-700/80">기상 변화에 따른 위험 공정 통제와 작업 계획 조정 포인트를 한 화면에서 확인합니다.</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <span v-if="sourceLabel" class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm" :class="sourceLabel.tone">
          <span class="relative flex h-1.5 w-1.5"><span class="absolute inset-0 animate-ping rounded-full bg-current opacity-75" /><span class="relative h-1.5 w-1.5 rounded-full bg-current" /></span>
          {{ sourceLabel.label }}
        </span>
        <div class="rounded-2xl border border-forena-100/80 bg-white/90 p-3 shadow-sm">
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-bold uppercase tracking-wide text-forena-500">기준 날짜</span>
            <input :value="reportDate" type="date" class="rounded-xl border border-forena-200 px-3 py-2 text-sm text-forena-800 focus:border-flare-400 focus:outline-none focus:ring-2 focus:ring-flare-200/50" @change="(e) => $emit('update:reportDate', e.target.value)" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>