<script setup>
import { Droplets, Eye, Thermometer, Wind } from 'lucide-vue-next'
import { WEATHER_CONTROL_TEXT } from '@/utils/weatherControlMapper.js'

defineProps({
  today: {
    type: Object,
    default: null,
  },
  week: {
    type: Object,
    default: null,
  },
  analysis: {
    type: Object,
    default: null,
  },
  riskLevel: {
    type: Object,
    required: true,
  },
  rainPercent: {
    type: Number,
    required: true,
  },
  rainBarClass: {
    type: String,
    required: true,
  },
  rainNoteDetailed: {
    type: String,
    required: true,
  },
  windTone: {
    type: Object,
    required: true,
  },
  fineDustValue: {
    type: [Number, null],
    default: null,
  },
  fineDustTone: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="grid auto-rows-fr gap-4 sm:grid-cols-2">
    <article class="flex h-full min-h-[136px] flex-col rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2">
          <Thermometer class="h-4 w-4 shrink-0 text-forena-400" />
          <p class="text-[11px] font-bold text-forena-500">{{ WEATHER_CONTROL_TEXT.demoToday }}</p>
        </div>
        <span class="whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold" :class="riskLevel.tone">
          위험 {{ riskLevel.label }}
        </span>
      </div>
      <p class="mt-2 text-2xl font-bold tabular-nums text-forena-900">
        {{ today?.headlineTemp || '--°C / --°C' }}
      </p>
      <p class="mt-2 text-sm leading-relaxed text-slate-600">
        {{ today?.summary || '기상 정보 없음' }}
      </p>
    </article>

    <article :class="`flex h-full min-h-[136px] flex-col rounded-2xl p-4 shadow-card transition-colors duration-500 ${windTone.color}`">
      <div class="flex items-center gap-2">
        <Wind :class="`h-4 w-4 ${windTone.iconColor}`" />
        <p :class="`text-[11px] font-bold tracking-wide ${windTone.labelColor}`">{{ WEATHER_CONTROL_TEXT.demoWeek }}</p>
      </div>
      <div class="mt-3">
        <p :class="`text-4xl font-extrabold tracking-tight ${windTone.textColor} tabular-nums`">
          {{ analysis?.maxWindSpeed ?? '--' }}<span class="text-lg font-bold">m/s</span>
        </p>
        <p :class="`mt-1 text-xs font-semibold ${windTone.descriptionColor}`">
          {{ windTone.statusLabel }}
        </p>
      </div>
      <p :class="`mt-2 text-[11px] leading-relaxed ${windTone.descriptionColor}`">
        {{ week?.summary || '풍속 데이터 분석 중' }}
      </p>
    </article>

    <article class="flex h-full min-h-[136px] flex-col rounded-2xl border border-sky-100/90 bg-gradient-to-br from-sky-50 to-cyan-50 p-4 shadow-card">
      <div class="flex items-center gap-2">
        <Droplets class="h-4 w-4 text-sky-500" />
        <p class="text-[11px] font-bold tracking-wide text-sky-800">{{ WEATHER_CONTROL_TEXT.demoRain }}</p>
      </div>
      <p class="mt-2 text-3xl font-extrabold tracking-tight text-sky-900 tabular-nums">
        {{ rainPercent }}%
      </p>
      <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="rainBarClass"
          :style="{ width: `${Math.min(100, rainPercent)}%` }"
        />
      </div>
      <p class="mt-2 text-xs leading-relaxed text-sky-800/80">
        {{ rainNoteDetailed }}
      </p>
    </article>

    <article :class="`flex h-full min-h-[136px] flex-col rounded-2xl p-4 shadow-card transition-colors duration-500 border ${fineDustTone.card}`">
      <div class="flex items-center gap-2">
        <Eye :class="`h-4 w-4 ${fineDustTone.icon}`" />
        <p :class="`text-[11px] font-bold tracking-wide ${fineDustTone.title}`">
          {{ WEATHER_CONTROL_TEXT.fineDustTitle }}
        </p>
      </div>
      <p :class="`mt-2 text-3xl font-extrabold tracking-tight tabular-nums transition-colors duration-500 ${fineDustTone.value}`">
        {{ fineDustValue != null ? fineDustValue : '—' }}<span v-if="fineDustValue != null" class="text-base font-bold">㎍/㎥</span>
      </p>
      <p :class="`mt-2 text-sm leading-relaxed transition-colors duration-500 ${fineDustTone.desc}`">
        {{ fineDustTone.label }}
      </p>
    </article>
  </div>
</template>
