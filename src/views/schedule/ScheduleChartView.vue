<script setup>
import { computed, ref } from 'vue'
import {
  CalendarRange,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  LayoutDashboard,
} from 'lucide-vue-next'

const T = {
  kicker: '일정',
  title: '공정 지표보고',
  desc: '연간·월간·주간 단위로 공정 진행율과 지연, 주간 계획 대비 실적을 한 눈에 확인합니다.',
  tabY: '연간',
  tabM: '월간',
  tabW: '주간',
  kpiOverall: '전체 진행율',
  kpiDelayed: '지연 건',
  kpiDoneWeek: '금주 완료',
  kpiNextWeek: '다음주 예정',
  kpiDelta: '전월 비',
  kpiAction: '조치 필요',
  kpiPlanRatio: '계획 대비',
  sectionWorkType: '공종별 진행율',
  sectionStatus: '일정 상태 분포',
  sectionWeekly: '주간 계획 vs 실적',
  sectionDelayed: '지연 공정 목록',
  sectionGantt: '공정표 (계획 / 실적)',
  legendPlan: '계획',
  legendActual: '실적',
  colTask: '공정명',
  colType: '공종',
  delayLabel: '지연',
  plannedEnd: '완료 예정',
  statusDone: '완료',
  statusProgress: '진행',
  statusPlanned: '예정',
  statusDelayed: '지연',
  countUnit: '건',
}

const activeTab = ref('week')

const timeline = computed(() => {
  if (activeTab.value === 'year') {
    return {
      count: 4,
      labels: ['1분기', '2분기', '3분기', '4분기'],
      slotUnit: '분기',
    }
  }
  if (activeTab.value === 'month') {
    return {
      count: 4,
      labels: ['1주', '2주', '3주', '4주'],
      slotUnit: '주',
    }
  }
  return {
    count: 24,
    labels: Array.from({ length: 24 }, (_, i) => String(i + 1)),
    slotUnit: '',
  }
})

const kpi = computed(() => {
  if (activeTab.value === 'year') {
    return {
      overall: 58,
      overallDelta: '+5%',
      delayed: 6,
      doneWeek: 24,
      doneSub: '82%',
      nextWeek: 11,
    }
  }
  if (activeTab.value === 'month') {
    return {
      overall: 61,
      overallDelta: '+6%',
      delayed: 5,
      doneWeek: 9,
      doneSub: '85%',
      nextWeek: 10,
    }
  }
  return {
    overall: 62,
    overallDelta: '+8%',
    delayed: 4,
    doneWeek: 7,
    doneSub: '88%',
    nextWeek: 9,
  }
})

const workTypeBars = ref([
  { label: '건축 / 철근', pct: 74 },
  { label: '파일 공사', pct: 68 },
  { label: '토목 공사', pct: 57 },
  { label: '톰링 / 가오사', pct: 49 },
  { label: '전기 공사', pct: 63 },
])

const statusItems = ref([
  { key: 'done', label: T.statusDone, count: 18, class: 'bg-emerald-500' },
  { key: 'progress', label: T.statusProgress, count: 14, class: 'bg-forena-600' },
  { key: 'planned', label: T.statusPlanned, count: 12, class: 'bg-slate-300' },
  { key: 'delayed', label: T.statusDelayed, count: 4, class: 'bg-rose-500' },
])

const activeStatusFilter = ref('delayed')

const statusTaskItems = ref([
  {
    status: 'done',
    tasks: ['B동 외장 마감', '기계실 배관 테스트', '주차장 바닥 도장'],
  },
  {
    status: 'progress',
    tasks: ['옥상 방수 보강', '복도 전등 교체', '계단실 난간 설치'],
  },
  {
    status: 'planned',
    tasks: ['1층 로비 천장 마감', '출입구 자동문 시운전', '소방 설비 점검'],
  },
  {
    status: 'delayed',
    tasks: ['A-2 구간 파일', 'CCTV 설치', 'Joint Pipe EV PIT', '지하 주차장 톤개'],
  },
])

const filteredStatusTasks = computed(() => {
  return statusTaskItems.value.find((item) => item.status === activeStatusFilter.value)?.tasks ?? []
})

const weeklyCompare = ref([
  { label: '9월 3주', plan: 72, actual: 68 },
  { label: '9월 4주', plan: 80, actual: 76 },
  { label: '10월 1주', plan: 65, actual: 70 },
  { label: '10월 2주', plan: 58, actual: 55 },
])

const delayedTasks = ref([
  {
    type: '파일 공사',
    name: 'A-2 구간 파일',
    delay: '3일 지연',
    end: '2025-10-18',
  },
  {
    type: '전기 공사',
    name: 'CCTV 설치',
    delay: '2일 지연',
    end: '2025-10-20',
  },
  {
    type: '토목',
    name: 'Joint Pipe EV PIT',
    delay: '1일 지연',
    end: '2025-10-22',
  },
])

const delayedTradeRatios = ref([
  { name: '건축', pct: 40, color: '#f97316' },
  { name: '토목', pct: 30, color: '#0ea5e9' },
  { name: '파일', pct: 30, color: '#ef4444' },
])

const delayedDonutStyle = computed(() => {
  let start = 0
  const stops = delayedTradeRatios.value
    .map((item) => {
      const end = start + item.pct
      const stop = `${item.color} ${start}% ${end}%`
      start = end
      return stop
    })
    .join(', ')

  return {
    background: `conic-gradient(${stops})`,
  }
})

/** plan/actual: { s, e } 일관 슬롯 (1 ~ count) */
const ganttRows = computed(() => {
  const c = timeline.value.count
  if (activeTab.value === 'year') {
    return [
      {
        name: 'Joint Pipe EV PIT',
        trade: '토목',
        plan: { s: 1, e: 2 },
        actual: { s: 1, e: 2 },
      },
      {
        name: 'A-2 구간 파일',
        trade: '파일 공사',
        plan: { s: 2, e: 3 },
        actual: { s: 2, e: 4 },
      },
      {
        name: 'CCTV 설치',
        trade: '전기',
        plan: { s: 3, e: 3 },
        actual: { s: 3, e: 4 },
      },
      {
        name: '지하 주차장 톤개',
        trade: '토목',
        plan: { s: 1, e: 4 },
        actual: { s: 2, e: 4 },
      },
    ]
  }
  if (activeTab.value === 'month') {
    return [
      {
        name: 'Joint Pipe EV PIT',
        trade: '토목',
        plan: { s: 1, e: 2 },
        actual: { s: 1, e: 2 },
      },
      {
        name: 'A-2 구간 파일',
        trade: '파일 공사',
        plan: { s: 2, e: 3 },
        actual: { s: 2, e: 3 },
      },
      {
        name: 'CCTV 설치',
        trade: '전기',
        plan: { s: 3, e: 4 },
        actual: { s: 3, e: 4 },
      },
      {
        name: '철근 에넜지',
        trade: '건축',
        plan: { s: 1, e: 3 },
        actual: { s: 2, e: 3 },
      },
    ]
  }
  return [
    {
      name: 'Joint Pipe EV PIT',
      trade: '토목',
      plan: { s: 3, e: 10 },
      actual: { s: 4, e: 11 },
    },
    {
      name: 'A-2 구간 파일',
      trade: '파일 공사',
      plan: { s: 6, e: 14 },
      actual: { s: 7, e: 15 },
    },
    {
      name: 'CCTV 설치',
      trade: '전기',
      plan: { s: 12, e: 18 },
      actual: { s: 13, e: 19 },
    },
    {
      name: '형틀 제거',
      trade: '건축',
      plan: { s: 2, e: 8 },
      actual: { s: 2, e: 7 },
    },
    {
      name: 'TBM 및 안전교육',
      trade: '안전',
      plan: { s: 1, e: 3 },
      actual: { s: 1, e: 3 },
    },
  ]
})

function barLeftPct(s, total) {
  return ((s - 1) / total) * 100
}

function barWidthPct(s, e, total) {
  return ((e - s + 1) / total) * 100
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <!-- Hero -->
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
          >
            <LayoutDashboard class="h-5 w-5" />
          </span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">
              {{ T.kicker }}
            </p>
            <h1 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.title }}</h1>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
          </div>
        </div>
        <div
          class="flex flex-wrap gap-2 rounded-2xl border border-forena-100/80 bg-white/80 p-1.5 shadow-sm"
        >
          <button
            v-for="tab in [
              { id: 'year', label: T.tabY },
              { id: 'month', label: T.tabM },
              { id: 'week', label: T.tabW },
            ]"
            :key="tab.id"
            type="button"
            class="rounded-xl px-4 py-2 text-sm font-bold transition"
            :class="
              activeTab === tab.id
                ? 'bg-gradient-to-r from-forena-700 to-forena-900 text-white shadow-md'
                : 'text-forena-600 hover:bg-forena-50'
            "
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- KPI -->
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div
        class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card ring-1 ring-forena-50"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">
            {{ T.kpiOverall }}
          </p>
          <span class="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {{ kpi.overallDelta }} {{ T.kpiDelta }}
          </span>
        </div>
        <div class="mt-2 flex items-end gap-2">
          <span class="text-3xl font-bold tabular-nums text-forena-900">{{ kpi.overall }}%</span>
          <TrendingUp class="mb-1 h-5 w-5 text-emerald-600" />
        </div>
      </div>
      <div
        class="rounded-2xl border border-rose-100/90 bg-gradient-to-br from-rose-50/40 to-white p-4 shadow-card ring-1 ring-rose-100/60"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="text-[11px] font-bold uppercase tracking-wider text-rose-700/90">
            {{ T.kpiDelayed }}
          </p>
          <span class="rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
            {{ T.kpiAction }}
          </span>
        </div>
        <div class="mt-2 flex items-end gap-2">
          <span class="text-3xl font-bold tabular-nums text-forena-900">{{ kpi.delayed }}</span>
          <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countUnit }}</span>
          <AlertTriangle class="mb-1 h-5 w-5 text-rose-500" />
        </div>
      </div>
      <div
        class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card ring-1 ring-forena-50"
      >
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">
          {{ T.kpiDoneWeek }}
        </p>
        <div class="mt-2 flex items-end justify-between gap-2">
          <span class="text-3xl font-bold tabular-nums text-forena-900">{{ kpi.doneWeek }}</span>
          <span class="mb-1 text-xs font-semibold text-forena-600"
            >{{ kpi.doneSub }} {{ T.kpiPlanRatio }}</span
          >
        </div>
        <CheckCircle2 class="mt-2 h-4 w-4 text-flare-600" />
      </div>
      <div
        class="rounded-2xl border border-forena-100/90 bg-white/95 p-4 shadow-card ring-1 ring-forena-50"
      >
        <p class="text-[11px] font-bold uppercase tracking-wider text-forena-500">
          {{ T.kpiNextWeek }}
        </p>
        <div class="mt-2 flex items-end gap-2">
          <span class="text-3xl font-bold tabular-nums text-forena-900">{{ kpi.nextWeek }}</span>
          <span class="mb-1 text-sm font-medium text-slate-500">{{ T.countUnit }}</span>
          <CalendarClock class="mb-1 h-5 w-5 text-forena-600" />
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div
        class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card"
      >
        <div class="flex items-center gap-2 border-b border-forena-100 pb-3">
          <CalendarRange class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">{{ T.sectionWorkType }}</h2>
        </div>
        <ul class="mt-4 space-y-3">
          <li v-for="(w, i) in workTypeBars" :key="i" class="space-y-1">
            <div class="flex justify-between text-xs font-semibold text-forena-800">
              <span>{{ w.label }}</span>
              <span class="tabular-nums text-forena-600">{{ w.pct }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-forena-100">
              <div
                class="h-full rounded-full bg-gradient-to-r from-forena-600 to-flare-500 transition-all"
                :style="{ width: w.pct + '%' }"
              />
            </div>
          </li>
        </ul>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card"
      >
        <h2 class="border-b border-forena-100 pb-3 text-sm font-bold text-forena-900">
          {{ T.sectionStatus }}
        </h2>
        <div class="mt-4 flex flex-wrap gap-2">
          <div
            v-for="s in statusItems"
            :key="s.key"
            class="flex min-w-[140px] flex-1 cursor-pointer select-none items-center justify-between gap-3 rounded-xl border border-forena-100 bg-forena-50/50 px-3 py-2.5 transition hover:bg-forena-100/50"
            :class="activeStatusFilter === s.key ? 'ring-2 ring-flare-400/60' : ''"
            role="button"
            tabindex="0"
            @click="activeStatusFilter = s.key"
            @keydown.enter.prevent="activeStatusFilter = s.key"
            @keydown.space.prevent="activeStatusFilter = s.key"
          >
            <span class="flex items-center gap-2 text-xs font-bold text-forena-800">
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="s.class" />
              {{ s.label }}
            </span>
            <span class="text-lg font-bold tabular-nums text-forena-900">{{ s.count }}</span>
          </div>
        </div>
        <ul class="mt-3 space-y-1">
          <li
            v-for="(task, idx) in filteredStatusTasks"
            :key="`${activeStatusFilter}-${idx}`"
            class="text-xs font-semibold text-forena-800"
          >
            {{ task }}
          </li>
        </ul>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div
        class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card"
      >
        <h2 class="border-b border-forena-100 pb-3 text-sm font-bold text-forena-900">
          {{ T.sectionWeekly }}
        </h2>
        <div class="mt-4 flex h-40 items-end justify-between gap-3">
          <div
            v-for="(w, i) in weeklyCompare"
            :key="i"
            class="flex flex-1 flex-col items-center gap-2"
          >
            <div class="flex h-32 w-full items-end justify-center gap-1">
              <div
                class="w-1/2 max-w-[18px] rounded-t-md bg-blue-600"
                :style="{ height: w.plan + '%' }"
                :title="'plan'"
              />
              <div
                class="w-1/2 max-w-[18px] rounded-t-md bg-red-600"
                :style="{ height: w.actual + '%' }"
                :title="'actual'"
              />
            </div>
            <span class="text-center text-[10px] font-semibold text-slate-600">{{ w.label }}</span>
          </div>
        </div>
        <div
          class="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600"
        >
          <span class="inline-flex items-center gap-1.5">
            <span class="h-1.5 w-4 shrink-0 rounded-full bg-blue-600" /> {{ T.legendPlan }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-1.5 w-4 shrink-0 rounded-full bg-red-600" /> {{ T.legendActual }}
          </span>
        </div>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card"
      >
        <h2 class="border-b border-forena-100 pb-3 text-sm font-bold text-forena-900">
          {{ T.sectionDelayed }}
        </h2>
        <div class="mt-3 flex items-start gap-4">
          <div class="relative h-28 w-28 shrink-0 rounded-full" :style="delayedDonutStyle">
            <div
              class="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] font-bold text-forena-700"
            >
              {{ T.statusDelayed }}
            </div>
          </div>
          <ul class="min-w-0 flex-1 divide-y divide-forena-50">
            <li v-for="(d, i) in delayedTasks" :key="i" class="flex flex-col gap-1 py-3 first:pt-0">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-flare-700">{{ d.type }}</span>
                <span class="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {{ T.delayLabel }} {{ d.delay }}
                </span>
              </div>
              <p class="font-semibold text-forena-900">{{ d.name }}</p>
              <p class="text-[11px] text-slate-500">{{ T.plannedEnd }}: {{ d.end }}</p>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Gantt -->
    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-forena-100 px-5 py-4"
      >
        <div class="flex items-center gap-2">
          <CalendarRange class="h-4 w-4 text-flare-600" />
          <h2 class="text-sm font-bold text-forena-900">{{ T.sectionGantt }}</h2>
          <span class="rounded-lg bg-forena-100 px-2 py-0.5 text-[10px] font-bold text-forena-600">
            {{ activeTab === 'year' ? T.tabY : activeTab === 'month' ? T.tabM : T.tabW }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
          <span class="inline-flex items-center gap-1.5">
            <span class="h-1.5 w-6 shrink-0 rounded-full bg-blue-600" /> {{ T.legendPlan }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-1.5 w-6 shrink-0 rounded-full bg-red-600" /> {{ T.legendActual }}
          </span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="min-w-[880px] px-5 py-4">
          <div
            class="flex gap-3 border-b border-forena-100 pb-2 text-[10px] font-bold text-forena-500"
          >
            <div class="w-[220px] shrink-0 pl-1">{{ T.colTask }} / {{ T.colType }}</div>
            <div
              class="grid min-w-0 flex-1"
              :style="{ gridTemplateColumns: `repeat(${timeline.count}, minmax(0, 1fr))` }"
            >
              <div
                v-for="(lab, idx) in timeline.labels"
                :key="idx"
                class="border-l border-forena-100 px-0.5 text-center tabular-nums"
              >
                {{ lab }}
              </div>
            </div>
          </div>

          <div
            v-for="(row, ri) in ganttRows"
            :key="ri"
            class="flex gap-3 border-b border-forena-50 py-3"
          >
            <div class="w-[220px] shrink-0 min-w-0 pl-1 pr-2">
              <p class="truncate text-sm font-semibold text-forena-900">{{ row.name }}</p>
              <p class="truncate text-[11px] text-slate-500">{{ row.trade }}</p>
            </div>
            <div class="relative min-h-[44px] min-w-0 flex-1">
              <div
                class="absolute inset-0 grid h-full"
                :style="{ gridTemplateColumns: `repeat(${timeline.count}, minmax(0, 1fr))` }"
              >
                <div
                  v-for="n in timeline.count"
                  :key="n"
                  class="border-r border-forena-100/70 last:border-r-0"
                />
              </div>
              <div class="relative h-full min-h-[44px] w-full px-0.5">
                <div
                  class="pointer-events-none absolute top-[30%] h-1.5 -translate-y-1/2 rounded-full bg-blue-600"
                  :style="{
                    left: barLeftPct(row.plan.s, timeline.count) + '%',
                    width: barWidthPct(row.plan.s, row.plan.e, timeline.count) + '%',
                  }"
                />
                <div
                  class="pointer-events-none absolute top-[52%] h-1.5 -translate-y-1/2 rounded-full bg-red-600"
                  :style="{
                    left: barLeftPct(row.actual.s, timeline.count) + '%',
                    width: barWidthPct(row.actual.s, row.actual.e, timeline.count) + '%',
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
