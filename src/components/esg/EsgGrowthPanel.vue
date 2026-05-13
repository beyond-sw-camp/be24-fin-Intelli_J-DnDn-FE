<script setup>
import { Sparkles } from 'lucide-vue-next'

defineProps({
  activeLevel: {
    type: Number,
    default: 0,
  },
  activeScore: {
    type: Number,
    default: 0,
  },
  nextLevelPoint: {
    type: [Number, String],
    default: 0,
  },
  levelProgress: {
    type: Number,
    default: 0,
  },
  buildingFloors: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <article class="flex h-full min-h-[720px] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-card">
    <div class="flex items-start justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
      <div>
        <h2 class="text-xl font-black text-forena-900">ESG 빌딩 성장</h2>
      </div>
      <span class="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-black text-emerald-700">
        Lv.{{ activeLevel }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-5">
      <div class="relative mx-auto h-[390px] w-full max-w-[320px] overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 via-white to-emerald-50">
        <div class="absolute inset-x-8 top-8 h-px border-t border-dashed border-slate-200" />
        <div class="absolute inset-x-10 top-20 h-px border-t border-dashed border-slate-200" />
        <div class="absolute inset-x-12 top-32 h-px border-t border-dashed border-slate-200" />
        <span class="absolute right-7 top-6 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-center text-sm font-black leading-4 text-white shadow-xl ring-4 ring-white">
          Lv.<br />{{ activeLevel }}
        </span>

        <div class="absolute bottom-9 left-1/2 w-48 -translate-x-1/2">
          <div class="mx-auto flex h-64 w-36 flex-col-reverse justify-start gap-1.5">
            <div
              v-for="floor in buildingFloors"
              :key="floor"
              class="relative h-8 transition-all duration-500"
              :class="[
                floor <= activeLevel
                  ? 'border-x-[5px] border-emerald-950 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-sm'
                  : 'border border-dashed border-slate-200 bg-white/45',
                floor === activeLevel ? 'border-t-[5px] border-emerald-950' : '',
                floor === 1 && floor <= activeLevel ? 'rounded-b-sm' : '',
              ]"
            >
              <div class="absolute inset-x-2 top-1.5 grid grid-cols-3 gap-1">
                <span
                  v-for="window in 3"
                  :key="window"
                  class="h-2.5 rounded-[2px]"
                  :class="floor <= activeLevel ? 'bg-emerald-100' : 'bg-slate-100/80'"
                />
              </div>
            </div>
          </div>
          <div class="mx-auto mt-1 h-3 w-32 rounded-sm bg-forena-900" />
          <div class="mx-auto h-1.5 w-44 rounded-full bg-slate-400" />
          <div class="mx-auto mt-1 h-1 w-36 rounded-full bg-slate-300" />
        </div>
      </div>

      <div class="mt-4 text-center">
        <h3 class="text-xl font-black text-forena-900">시공 단계</h3>
        <p class="mt-2 text-sm font-medium text-forena-600">
          현재 점수 <span class="font-black text-emerald-700">{{ activeScore }}</span>점 · 다음 레벨까지
          <span class="font-black text-emerald-700">{{ nextLevelPoint }}</span>점 남음
        </p>
      </div>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
        <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${levelProgress}%` }" />
      </div>

      <div class="mt-auto rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
        <p class="flex items-center gap-2 text-sm font-black text-emerald-900">
          <Sparkles class="h-4 w-4" />
          레벨업 가이드
        </p>
        <p class="mt-1 text-xs leading-6 text-emerald-700">
          중장비 공회전을 낮추고 탄소 배출을 줄이면 다음 층이 올라갑니다.
        </p>
      </div>
    </div>
  </article>
</template>
