<script setup>
import { ref, computed } from 'vue'
import {
  HardHat,
  MapPin,
  Users,
  AlertTriangle,
  UserPlus,
  Truck,
  ClipboardList,
  BarChart3,
  CloudRain,
  Zap,
  LayoutDashboard,
} from 'lucide-vue-next'

const T = {
  kicker: '인사 담당',
  title: '인사 대시보드',
  desc: '현장 인원, 공정, 기상·안전 알림을 실시간에 가까운 형태로 확인합니다.',
  today: '금일 투입',
  cap: '/ 145 명 (샘플)',
  status: '현장 상태',
  running: '운영 중',
  alert: '긴급 알림',
  alertBody: '강풍 주의 — 고소작업 중지',
  tbm: '오늘 TBM',
  tbmBody: '07:30 일일 안전 공유',
  secMain: '메인 인디케이터',
  indAttendance: '금일 투입 인원 현황',
  indAttendanceSub:
    '금일 출근 완료된 총 인원 및 공종별(협력사별) 인원 실시간 표출',
  totalChecked: '출근 완료 합계',
  personUnit: '명',
  colBreakdown: '공종 / 협력사',
  colCount: '인원',
  indNew: '신규 투입 현황',
  indNewSub: '금일 현장에 새로 투입된 신규 온보딩 인원 수치',
  newCountLabel: '오늘 신규 투입',
  indWork: '금일 작업 요약',
  indWorkSub:
    '금일 현장에 투입될 중장비 리스트 및 진행될 공정 리스트',
  equipTitle: '중장비 (예정)',
  procTitle: '공정 (예정)',
  secProgress: '공정 진행 상황',
  progressViz: '공사 진행도 시각화',
  progressVizSub: '전체 공사 진행도 및 공종별 공사 진행도 퍼센트(%) 요약',
  overall: '전체 공사',
  secAlert: '알림 및 경고',
  weatherAlertTitle: '기상 기반 안전 경보',
  weatherAlertSub:
    '기상 정보에 따른 작업 안전 경고 및 현장 안전경보 긴급 알림 표출',
  urgent: '긴급',
  weather: '기상',
}

const attendanceBreakdown = ref([
  { label: '형틀 (태양건설)', count: 42 },
  { label: '전기 (한숲전기)', count: 28 },
  { label: '토목 (청월건설)', count: 35 },
  { label: '내부 직원 / 기타', count: 19 },
])

const newDeployToday = ref(8)

const equipmentToday = ref([
  '50톤 타워크레인 (동)',
  '콘크리트 퍼짱카2대',
  '사다 깅고 25t',
  '비아사 소형 구조',
])

const processesToday = ref([
  'B구역 지하 2층 슬라브 형틀 조립',
  'A구역 전기 배관 도선',
  '외부 스크피드 내매맅 진행',
  '지하주차장 방수 공사',
])

const overallProgress = ref(62)

const processProgress = ref([
  { name: '골조 공사', pct: 74 },
  { name: '파일 및 기초', pct: 68 },
  { name: '전기 및 소방', pct: 52 },
  { name: '내매맅 및 마감', pct: 41 },
])

const weatherAlerts = ref([
  {
    id: 1,
    level: '주의',
    title: '오후 풍속 강화 (12~15m/s 예보)',
    detail: '타워크레인 작업 시간 단축 및 후풍 감소 안내',
  },
  {
    id: 2,
    level: '안내',
    title: '소나기 다량 — 외부 용접 미끄러짐 주의',
    detail: '고소 작업 시 미끄러짐 장치 점검 추천',
  },
])

const urgentAlerts = ref([
  {
    id: 1,
    title: '[긴급] 강풍 이수 시 고소 작업 전면 중지',
    time: '09:42',
    source: '현장 안전관리자',
  },
  {
    id: 2,
    title: 'TBM 이후 지하 주차장 입구 통제 1시간 해제',
    time: '08:15',
    source: '출입근태 시스템',
  },
])

const totalCheckedIn = computed(() =>
  attendanceBreakdown.value.reduce((s, r) => s + r.count, 0),
)
</script>

<template>
  <div class="w-full min-w-0 space-y-5 pb-8">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-5 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
      >
        <div class="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
          >
            <HardHat class="h-[1.125rem] w-[1.125rem]" />
          </span>
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">{{ T.kicker }}</p>
            <h2 class="text-gradient-brand text-lg font-bold tracking-tight sm:text-xl">{{ T.title }}</h2>
            <p class="mt-1.5 w-full text-[13px] leading-relaxed text-forena-700/80 sm:text-sm">
              {{ T.desc }}
            </p>
          </div>
        </div>
        <div
          class="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-forena-100/80 bg-white/60 px-3 py-2 text-[11px] text-forena-600 lg:px-4 lg:py-3"
        >
          <span class="tabular-nums text-forena-800">{{ T.today }}: <strong>{{ totalCheckedIn }}</strong> {{ T.personUnit }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      <article class="flex min-h-[7.5rem] flex-col gap-2 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <Users class="h-4 w-4 text-flare-600" />
          {{ T.today }}
        </div>
        <div class="flex flex-1 flex-col justify-center py-0.5">
          <p class="text-2xl font-light tabular-nums text-forena-900 sm:text-3xl">{{ totalCheckedIn }}</p>
        </div>
        <p class="text-xs text-slate-500">{{ T.cap }}</p>
      </article>
      <article class="flex min-h-[7.5rem] flex-col gap-2 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <MapPin class="h-4 w-4 text-flare-600" />
          {{ T.status }}
        </div>
        <div class="flex flex-1 flex-col justify-center py-0.5">
          <p class="text-base font-bold text-emerald-700 sm:text-lg">{{ T.running }}</p>
        </div>
      </article>
      <article
        class="flex min-h-[7.5rem] flex-col gap-2 rounded-2xl border border-rose-100/80 bg-rose-50/30 p-4 shadow-card"
      >
        <div class="flex items-center gap-2 text-sm font-semibold text-rose-900">
          <AlertTriangle class="h-4 w-4 shrink-0" />
          {{ T.alert }}
        </div>
        <div class="flex flex-1 flex-col justify-center py-0.5">
          <p class="text-sm leading-snug text-rose-800">{{ T.alertBody }}</p>
        </div>
      </article>
      <article class="flex min-h-[7.5rem] flex-col gap-2 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <HardHat class="h-4 w-4 text-flare-600" />
          {{ T.tbm }}
        </div>
        <div class="flex flex-1 flex-col justify-center py-0.5">
          <p class="text-sm text-slate-700">{{ T.tbmBody }}</p>
        </div>
      </article>
    </div>

    <!-- Main indicators: attendance, new hires, work summary -->
    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="flex flex-wrap items-center gap-2 border-b border-forena-100 bg-forena-50/50 px-4 py-2.5 sm:px-5 sm:py-3">
        <LayoutDashboard class="h-4 w-4 text-flare-600" />
        <h3 class="text-sm font-bold text-forena-900">{{ T.secMain }}</h3>
      </div>
      <div
        class="grid gap-4 p-4 sm:gap-5 sm:p-5 lg:grid-cols-1 xl:grid-cols-12 xl:gap-5 xl:p-6"
      >
        <div
          class="min-w-0 rounded-xl border border-forena-100 bg-forena-50/30 p-3.5 sm:p-4 xl:col-span-5"
        >
          <div class="flex items-start gap-2">
            <Users class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
            <div>
              <p class="text-sm font-bold text-forena-900">{{ T.indAttendance }}</p>
              <p class="mt-1 text-[11px] leading-snug text-slate-600">{{ T.indAttendanceSub }}</p>
            </div>
          </div>
          <p class="mt-3 text-2xl font-bold tabular-nums text-forena-900 sm:text-3xl">
            {{ totalCheckedIn }}<span class="text-base font-semibold text-slate-500 sm:text-lg">{{ T.personUnit }}</span>
          </p>
          <p class="text-[11px] font-semibold text-forena-500">{{ T.totalChecked }}</p>
          <div class="mt-3 max-h-44 overflow-y-auto rounded-lg border border-forena-100 bg-white sm:max-h-48 xl:max-h-56">
            <table class="w-full text-left text-xs">
              <thead class="sticky top-0 bg-forena-50/90 text-[10px] font-bold uppercase text-forena-500">
                <tr>
                  <th class="px-3 py-2">{{ T.colBreakdown }}</th>
                  <th class="px-3 py-2 text-right">{{ T.colCount }}</th>
                </tr>
              </thead>
              <tbody class="text-forena-800">
                <tr v-for="(row, i) in attendanceBreakdown" :key="i" class="border-t border-forena-50">
                  <td class="px-3 py-2 font-medium">{{ row.label }}</td>
                  <td class="px-3 py-2 text-right font-bold tabular-nums">{{ row.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="flex min-h-0 flex-col rounded-xl border border-sky-100/80 bg-sky-50/40 p-3.5 sm:p-4 xl:col-span-3"
        >
          <div class="flex items-start gap-2">
            <UserPlus class="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <div class="min-w-0">
              <p class="text-sm font-bold text-forena-900">{{ T.indNew }}</p>
              <p class="mt-1 text-[11px] leading-snug text-slate-600">{{ T.indNewSub }}</p>
            </div>
          </div>
          <div
            class="mt-4 flex flex-1 flex-col items-center justify-center gap-1 border border-sky-100/60 bg-white/70 py-6 sm:mt-5 sm:py-8 xl:min-h-[11rem]"
          >
            <p class="text-3xl font-bold tabular-nums text-sky-900 sm:text-4xl">{{ newDeployToday }}</p>
            <p class="text-center text-[11px] font-semibold text-sky-800">{{ T.newCountLabel }}</p>
          </div>
        </div>

        <div
          class="min-w-0 rounded-xl border border-forena-100 bg-white p-3.5 sm:p-4 xl:col-span-4"
        >
          <div class="flex items-start gap-2">
            <ClipboardList class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
            <div>
              <p class="text-sm font-bold text-forena-900">{{ T.indWork }}</p>
              <p class="mt-1 text-[11px] leading-snug text-slate-600">{{ T.indWorkSub }}</p>
            </div>
          </div>
          <div class="mt-3 grid min-h-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:gap-5">
            <div class="min-w-0">
              <p class="mb-2 flex items-center gap-1 text-[11px] font-bold text-forena-500">
                <Truck class="h-3.5 w-3.5" /> {{ T.equipTitle }}
              </p>
              <ul class="space-y-1.5 text-xs text-forena-800">
                <li
                  v-for="(eq, ei) in equipmentToday"
                  :key="ei"
                  class="rounded-lg border border-forena-100 bg-forena-50/50 px-2.5 py-1.5"
                >
                  {{ eq }}
                </li>
              </ul>
            </div>
            <div class="min-w-0">
              <p class="mb-2 text-[11px] font-bold text-forena-500">{{ T.procTitle }}</p>
              <ul class="space-y-1.5 text-xs text-forena-800">
                <li
                  v-for="(pr, pi) in processesToday"
                  :key="pi"
                  class="rounded-lg border border-forena-100 px-2.5 py-1.5"
                >
                  {{ pr }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Process progress visualization -->
    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="border-b border-forena-100 bg-forena-50/50 px-4 py-2.5 sm:px-5 sm:py-3">
        <div class="flex items-center gap-2">
          <BarChart3 class="h-4 w-4 text-flare-600" />
          <h3 class="text-sm font-bold text-forena-900">{{ T.secProgress }}</h3>
        </div>
        <p class="mt-1 text-[11px] text-slate-600">{{ T.progressVizSub }}</p>
      </div>
      <div class="grid gap-5 p-4 sm:p-5 lg:grid-cols-2 lg:items-start lg:gap-6 xl:gap-8 xl:p-6">
        <div
          class="rounded-xl border border-forena-100 bg-gradient-to-r from-forena-50/80 to-flare-50/40 p-3.5 sm:p-4"
        >
          <div class="flex flex-wrap items-end justify-between gap-3">
            <p class="text-xs font-bold uppercase tracking-wide text-forena-500">{{ T.overall }}</p>
            <p class="text-2xl font-bold tabular-nums text-forena-900 sm:text-3xl">{{ overallProgress }}%</p>
          </div>
          <div class="mt-4 h-3 overflow-hidden rounded-full bg-forena-100 sm:h-3.5">
            <div
              class="h-full rounded-full bg-gradient-to-r from-forena-600 to-flare-500 transition-all"
              :style="{ width: overallProgress + '%' }"
            />
          </div>
        </div>
        <div class="min-w-0">
          <p class="mb-3 text-xs font-bold text-forena-500">{{ T.progressViz }}</p>
          <ul class="grid gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3 lg:grid-cols-1 xl:grid-cols-2 xl:gap-x-8">
            <li v-for="(p, idx) in processProgress" :key="idx" class="min-w-0">
              <div class="flex justify-between gap-2 text-xs font-semibold text-forena-800">
                <span class="min-w-0 truncate">{{ p.name }}</span>
                <span class="shrink-0 tabular-nums text-flare-700">{{ p.pct }}%</span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-forena-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-forena-500 to-flare-400"
                  :style="{ width: p.pct + '%' }"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 알림 및 경고 -->
    <div class="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5 xl:gap-6">
      <div class="overflow-hidden rounded-2xl border border-sky-100/90 bg-white/95 shadow-card">
        <div class="border-b border-sky-100 bg-sky-50/50 px-4 py-2.5 sm:px-5 sm:py-3">
          <div class="flex items-center gap-2">
            <CloudRain class="h-4 w-4 text-sky-600" />
            <h3 class="text-sm font-bold text-forena-900">{{ T.weatherAlertTitle }}</h3>
          </div>
          <p class="mt-1 text-[11px] text-slate-600">{{ T.weatherAlertSub }}</p>
        </div>
        <ul class="divide-y divide-forena-50 p-3.5 sm:p-4">
          <li v-for="w in weatherAlerts" :key="w.id" class="py-3 first:pt-0 last:pb-0">
            <span
              class="inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold"
              :class="
                w.level === '주의'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-100 text-slate-700'
              "
              >{{ T.weather }} · {{ w.level }}</span
            >
            <p class="mt-2 text-sm font-bold text-forena-900">{{ w.title }}</p>
            <p class="mt-1 text-xs text-slate-600">{{ w.detail }}</p>
          </li>
        </ul>
      </div>
      <div class="overflow-hidden rounded-2xl border border-rose-100/90 bg-white/95 shadow-card">
        <div class="border-b border-rose-100 bg-rose-50/40 px-4 py-2.5 sm:px-5 sm:py-3">
          <div class="flex items-center gap-2">
            <Zap class="h-4 w-4 text-rose-600" />
            <h3 class="text-sm font-bold text-rose-900">{{ T.secAlert }} — {{ T.urgent }}</h3>
          </div>
        </div>
        <ul class="divide-y divide-rose-50/80 p-3.5 sm:p-4">
          <li v-for="u in urgentAlerts" :key="u.id" class="py-3 first:pt-0 last:pb-0">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-[10px] font-bold tabular-nums text-slate-500">{{ u.time }}</span>
              <span class="text-[10px] text-slate-500">{{ u.source }}</span>
            </div>
            <p class="mt-1 text-sm font-semibold text-rose-900">{{ u.title }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
