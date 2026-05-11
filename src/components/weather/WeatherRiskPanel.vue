<script setup>
import { AlertTriangle, ShieldAlert, Sparkles } from 'lucide-vue-next'
import { WEATHER_CONTROL_TEXT, levelBadgeClass } from '@/utils/weatherControlMapper.js'

defineProps({
  planRisks: {
    type: Array,
    default: () => [],
  },
  equipmentRisks: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="flex h-[588px] flex-col overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
    <div class="border-b border-forena-100 bg-gradient-to-r from-violet-50/70 via-white to-rose-50/60 px-5 py-3">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 class="flex items-center gap-2 text-base font-extrabold text-forena-900">
            <ShieldAlert class="h-4 w-4 text-forena-600" />
            {{ WEATHER_CONTROL_TEXT.catRisk }}
          </h2>
          <p class="mt-1 text-xs leading-relaxed text-forena-500">{{ WEATHER_CONTROL_TEXT.catRiskSub }}</p>
        </div>
        <span class="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-bold text-violet-700 shadow-sm">
          <Sparkles class="mr-1 inline h-3 w-3" />
          AI 추천
        </span>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      <div
        class="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-rose-200/80 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/50 p-4 shadow-sm"
      >
        <span class="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-rose-400 to-rose-600" />
        <div class="mb-3 flex items-center gap-3">
          <span class="rounded-lg bg-rose-100 px-3.5 py-2 text-sm font-extrabold text-rose-800">AI</span>
          <AlertTriangle class="h-5 w-5 text-rose-600" />
          <h3 class="text-[18px] font-extrabold tracking-tight text-forena-900">{{ WEATHER_CONTROL_TEXT.row3Title }}</h3>
          <span class="ml-auto rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700">
            {{ planRisks.length }}건
          </span>
        </div>

        <div v-if="planRisks.length > 0" class="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
          <div
            v-for="risk in planRisks"
            :key="`plan-${risk.title}-${risk.reason}`"
            class="rounded-xl border border-rose-100 bg-white/70 px-4 py-2.5"
          >
            <div class="mb-1 flex items-center justify-between gap-2">
              <p class="text-[14px] font-extrabold leading-5 text-forena-900">{{ risk.title }}</p>
              <span class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold" :class="levelBadgeClass(risk.level)">
                {{ risk.level }}
              </span>
            </div>
            <p class="text-[13px] leading-6 text-slate-700">{{ risk.reason }}</p>
            <p v-if="risk.action" class="mt-1.5 text-[12px] font-semibold leading-5 text-rose-800">
              권장 조치 · {{ risk.action }}
            </p>
          </div>
        </div>

        <p v-else class="flex flex-1 items-center justify-center text-sm font-medium text-slate-600">
          현재 계획 연동 위험은 감지되지 않았습니다.
        </p>
      </div>

      <div
        class="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/40 p-4 shadow-sm"
      >
        <span class="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-violet-400 to-violet-600" />
        <div class="mb-3 flex items-center gap-3">
          <span class="rounded-lg bg-violet-100 px-3.5 py-2 text-sm font-extrabold text-violet-800">AI</span>
          <Sparkles class="h-5 w-5 text-violet-600" />
          <h3 class="text-[18px] font-extrabold tracking-tight text-forena-900">{{ WEATHER_CONTROL_TEXT.row2Title }}</h3>
          <span class="ml-auto rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-bold text-violet-700">
            {{ equipmentRisks.length }}건
          </span>
        </div>

        <div v-if="equipmentRisks.length > 0" class="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
          <div
            v-for="risk in equipmentRisks"
            :key="`equipment-${risk.title}-${risk.reason}`"
            class="rounded-xl border border-violet-100 bg-white/70 px-4 py-2.5"
          >
            <div class="mb-1 flex items-center justify-between gap-2">
              <p class="text-[14px] font-extrabold leading-5 text-forena-900">{{ risk.title }}</p>
              <span class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold" :class="levelBadgeClass(risk.level)">
                {{ risk.level }}
              </span>
            </div>
            <p class="text-[13px] leading-6 text-slate-700">{{ risk.reason }}</p>
            <p v-if="risk.action" class="mt-1.5 text-[12px] font-semibold leading-5 text-violet-800">
              권장 조치 · {{ risk.action }}
            </p>
          </div>
        </div>

        <p v-else class="flex flex-1 items-center justify-center text-sm font-medium text-slate-600">
          현재 장비 통제 위험은 감지되지 않았습니다.
        </p>
      </div>
    </div>
  </div>
</template>
