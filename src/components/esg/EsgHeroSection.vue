<script setup>
import { CalendarDays, Factory, Leaf, RefreshCw, ShieldCheck, Target, Trophy } from 'lucide-vue-next'

defineProps({
  currentSite: {
    type: Object,
    required: true,
  },
  lastUpdatedAt: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  airQuality: {
    type: Object,
    default: null,
  },
  safetyDays: {
    type: Number,
    default: 1,
  },
  zoneCount: {
    type: Number,
    default: 0,
  },
})

const reportDate = defineModel('reportDate', {
  type: String,
  required: true,
})

const emit = defineEmits({
  refresh: null,
})
</script>

<template>
  <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white shadow-card">
    <div class="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-300/10" />
    <div class="pointer-events-none absolute bottom-0 left-1/3 h-24 w-72 rounded-full bg-teal-200/10 blur-2xl" />

    <div class="relative flex flex-col gap-6">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="flex items-start gap-4">
          <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Leaf class="h-7 w-7" />
          </span>
          <div>
            <h1 class="text-3xl font-black tracking-tight">ESG 대시보드</h1>
            <p class="mt-2 text-sm font-semibold text-emerald-100">
              {{ currentSite.shortName }} 현장 · 마지막 갱신 {{ lastUpdatedAt || '대기 중' }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p class="text-[10px] font-bold text-emerald-100">현장</p>
            <p class="mt-1 text-sm font-black">{{ currentSite.shortName }} 현장</p>
          </div>
          <label class="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <div>
              <p class="text-[10px] font-bold text-emerald-100">기준 일자</p>
              <input v-model="reportDate" type="date" class="mt-1 bg-transparent text-sm font-black text-white focus:outline-none" />
            </div>
            <CalendarDays class="h-4 w-4 text-emerald-100" />
          </label>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-black ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-60"
            :disabled="loading"
            @click="emit('refresh')"
          >
            <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            새로고침
          </button>
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-4">
        <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
            <Trophy class="h-3.5 w-3.5 text-amber-300" />
            ESG 현장 점수
          </p>
          <p class="mt-2 text-4xl font-black tabular-nums">{{ currentSite.score }}<span class="text-lg text-emerald-100">/100</span></p>
          <p class="mt-1 text-xs text-emerald-100">Lv.{{ currentSite.level }} 시공 단계</p>
        </div>

        <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
            <Factory class="h-3.5 w-3.5 text-sky-200" />
            미세먼지 PM10
          </p>
          <p class="mt-2 text-4xl font-black tabular-nums">{{ airQuality?.value ?? 0 }}<span class="text-lg text-emerald-100">㎍/㎥</span></p>
          <p class="mt-1 text-xs text-emerald-100">{{ airQuality?.label || '0%' }}</p>
        </div>

        <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
            <ShieldCheck class="h-3.5 w-3.5 text-sky-200" />
            안전 무사고 일수
          </p>
          <p class="mt-2 text-4xl font-black tabular-nums">{{ safetyDays }}<span class="text-lg text-emerald-100">일</span></p>
          <p class="mt-1 text-xs text-emerald-100">현장 시작일 기준</p>
        </div>

        <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <p class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
            <Target class="h-3.5 w-3.5 text-sky-200" />
            ESG 관리구역
          </p>
          <p class="mt-2 text-4xl font-black tabular-nums">{{ zoneCount }}<span class="text-lg text-emerald-100">곳</span></p>
          <p class="mt-1 text-xs text-emerald-100">작업구역·상시구역 기준</p>
        </div>
      </div>
    </div>
  </section>
</template>
