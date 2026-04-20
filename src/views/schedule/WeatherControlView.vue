<script setup>
import { ref } from 'vue'
import { CloudSun, Sparkles, AlertTriangle, CalendarRange, Wind, Droplets } from 'lucide-vue-next'

const T = {
  kicker: '일정',
  title: '기상 관제',
  desc:
    '당일·주간 기상 브리핑과 위험 장비 통제, 공정과의 연동을 한 화면에서 지원합니다.',
  catInfo: '기상 정보 관리',
  catControl: '기상 관제',
  catRisk: '위험 통제',
  row1Title: '기상 브리핑 및 자동화',
  row1Desc:
    '직관적인 당일/주간 기상 브리핑 표출 및 작업 일보 작성 시 해당 시간대 기상 정보 자동 기입.',
  row2Title: 'AI 위험 장비 통제',
  row2Desc:
    '당일 기상 분석을 통해 강풍, 폭우 시 타워크레인 등 위험 장비 투입 제한 추천 경고 표시.',
  row3Title: '계획 대비 위험 경고',
  row3Desc:
    '실시간 날씨와 공정 계획을 대조하여 우천 시 콘크리트 타설 등 위험 일정을 붉은색으로 하이라이트.',
  demoToday: '오늘 요약',
  demoWeek: '이번 주 요약',
  demoWind: '최대 풍속',
  demoRain: '강수확률',
  badgeAi: 'AI',
  badgePlan: '계획 연동',
  liveRisk: '실시간 위험 통제 추천 (예시)',
  dot: '·',
}

const briefing = ref({
  todayHigh: '22°C',
  todayLow: '14°C',
  condition: '흥림, 오후 소나기',
  weekNote: '목~금 일시 강풍 주의 (최대 15m/s 예보)',
})

const riskFlags = ref([
  { id: 1, type: 'crane', label: '타워크레인 A', level: '주의', reason: '오후 풍속 12m/s 예보' },
  { id: 2, type: 'concrete', label: 'B구역 슬라브 타설', level: '제한', reason: '강우 예보 — 계획 대비 중단 추천' },
])
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-sky-50/30 to-flare-50/20 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-forena-500 to-flare-500"
      />
      <div class="flex items-start gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-forena-700 text-white shadow-md"
        >
          <CloudSun class="h-5 w-5" />
        </span>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-600">{{ T.kicker }}</p>
          <h1 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.title }}</h1>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <article class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
        <p class="text-[11px] font-bold text-forena-500">{{ T.demoToday }}</p>
        <p class="mt-2 text-2xl font-bold tabular-nums text-forena-900">{{ briefing.todayHigh }} / {{ briefing.todayLow }}</p>
        <p class="mt-1 text-sm text-slate-600">{{ briefing.condition }}</p>
      </article>
      <article class="rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
        <p class="text-[11px] font-bold text-forena-500">{{ T.demoWeek }}</p>
        <p class="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
          <Wind class="h-4 w-4 shrink-0" />
          {{ briefing.weekNote }}
        </p>
      </article>
      <article class="rounded-2xl border border-sky-100/90 bg-sky-50/50 p-5 shadow-card">
        <p class="text-[11px] font-bold text-sky-800">{{ T.demoRain }}</p>
        <p class="mt-2 flex items-center gap-2 text-sm text-sky-900">
          <Droplets class="h-4 w-4" />
          60% (오후)
        </p>
      </article>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-forena-50/50 px-5 py-3">
        <h2 class="text-sm font-bold text-forena-900">{{ T.catInfo }} {{ T.dot }} {{ T.catControl }}</h2>
      </div>
      <div class="divide-y divide-forena-50">
        <div class="grid gap-4 p-5 md:grid-cols-[200px_1fr] md:items-start">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-lg bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-800">{{ T.catControl }}</span>
            <CalendarRange class="h-4 w-4 text-flare-600" />
          </div>
          <div>
            <h3 class="font-bold text-forena-900">{{ T.row1Title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ T.row1Desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-forena-50/50 px-5 py-3">
        <h2 class="text-sm font-bold text-forena-900">{{ T.catRisk }}</h2>
      </div>
      <div class="divide-y divide-forena-50">
        <div class="grid gap-4 p-5 md:grid-cols-[200px_1fr] md:items-start">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-800">{{ T.badgeAi }}</span>
            <Sparkles class="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h3 class="font-bold text-forena-900">{{ T.row2Title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ T.row2Desc }}</p>
          </div>
        </div>
        <div class="grid gap-4 p-5 md:grid-cols-[200px_1fr] md:items-start">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-800">{{ T.badgePlan }}</span>
            <AlertTriangle class="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <h3 class="font-bold text-forena-900">{{ T.row3Title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ T.row3Desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-rose-100/80 bg-rose-50/30 p-5 shadow-card">
      <h3 class="flex items-center gap-2 text-sm font-bold text-rose-900">
        <AlertTriangle class="h-4 w-4" />
        {{ T.liveRisk }}
      </h3>
      <ul class="mt-3 space-y-2">
        <li
          v-for="r in riskFlags"
          :key="r.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/60 bg-white px-4 py-3 text-sm"
        >
          <span class="font-semibold text-forena-900">{{ r.label }}</span>
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-bold"
            :class="r.level === '제한' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900'"
            >{{ r.level }}</span
          >
          <p class="w-full text-xs text-slate-600">{{ r.reason }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>
