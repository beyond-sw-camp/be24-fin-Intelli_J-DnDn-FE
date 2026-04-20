<script setup>
import {
  Zap,
  Building2,
  Users,
  Wallet,
  ShieldAlert,
  User,
  HardHat,
  AlertTriangle,
  Bell,
  Cloud,
  TrendingUp,
  ChevronRight,
} from 'lucide-vue-next'

const D = {
  heroKicker: '총권 현황',
  heroTitle: '본사 전체 운영 현황',
  heroDesc:
    '등록 현장, 출근, 정산 알림, 기상 이슈 등 본사 KPI를 한 화면에 집약합니다.',
  k1: '등록 현장 (운영 / 종료)',
  k1Sub: '/ 4 곳',
  k2: '오늘 출근 인원 (승인)',
  k2Sub: '/ 595 명',
  k2Foot: '결근/취소: 12명 (정상)',
  k3: '신규 정산 내역 알림',
  k3Sub: '건 대기 중',
  k3Btn: '정산 수신 대기: 2건',
  k4: '위험 알림 및 기상 이슈',
  k4Unit: '건',
  k4Foot: '강남구 재건축 A공구 (강풍)',
  colTitle: '현장별 운영 요약',
  colAll: '전체보기',
  chartTitle: '월별 인건비 총액 요약',
  chartUnit: '(단위: 억)',
  chartTrend: '전월 대비 2.4% 증가',
  donutTitle: '전체 협력사별 투입 현황',
  donutCenter: '18개사',
  alertTitle: '긴급 알림 / 이슈',
  wxTitle: '금일 기상 영향 ',
  wxHint: '(요약)',
  wxRainL: '비 (우첨)',
  wxRainR: '3개 현장',
  wxWindL: '강풍 (풍속 10m/s+)',
  wxWindR: '1개 현장',
  wxBtn: '기상 상세 리스트 보기',
  months: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  sites: [
    {
      name: '강남구 재건축 A공구',
      badge: '운영 중',
      badgeClass: 'bg-emerald-50 text-emerald-700',
      deploy: '투입: 124명',
      partners: '협력사: 5개',
      issue: true,
      muted: false,
    },
    {
      name: '판교 데이터센터',
      badge: '운영 중',
      badgeClass: 'bg-emerald-50 text-emerald-700',
      deploy: '투입: 350명',
      partners: '협력사: 12개',
      issue: false,
      muted: false,
    },
    {
      name: '인천항 물류센터',
      badge: '마감 필요',
      badgeClass: 'bg-amber-50 text-amber-800',
      deploy: '투입: 85명',
      partners: '협력사: 3개',
      issue: false,
      muted: true,
    },
    {
      name: '세종 복합문화공간',
      badge: '시작 전',
      badgeClass: 'bg-slate-100 text-slate-600',
      deploy: '투입: 0명',
      partners: '협력사: 0개',
      issue: false,
      muted: 'low',
    },
  ],
  alerts: [
    {
      title: '[강남구] 강풍 주의보',
      body: '오후 고소작업 전면 중지 지시',
      tone: 'rose',
    },
    {
      title: '[인천항] 장비 결함',
      body: '1호기 크레인 정비 대기 (2일 지연 예상)',
      tone: 'amber',
    },
  ],
  issueLabel: '이슈 발생',
  legend: [
    { label: '형틈', sub: '(45%)', dot: 'bg-forena-500' },
    { label: '천근', sub: '(28%)', dot: 'bg-flare-400' },
    { label: '비계', sub: '(15%)', dot: 'bg-amber-400' },
    { label: '기타', sub: '(12%)', dot: 'bg-slate-400' },
  ],
}
</script>

<template>
  <div class="space-y-6 pb-10 font-sans text-slate-800">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-wrap items-start gap-4">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
        >
          <Zap class="h-5 w-5" />
        </span>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">
            {{ D.heroKicker }}
          </p>
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">{{ D.heroTitle }}</h2>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ D.heroDesc }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <article
        class="relative flex h-[120px] flex-col justify-between overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-forena-500 to-flare-400 opacity-90"
        />
        <div class="flex items-start justify-between">
          <h3 class="text-sm font-semibold text-forena-800">{{ D.k1 }}</h3>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-flare-100 text-flare-600"
          >
            <Building2 class="h-4 w-4" />
          </span>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-4xl font-light tabular-nums text-forena-900">2</span>
          <span class="text-lg font-medium text-slate-400">{{ D.k1Sub }}</span>
        </div>
      </article>

      <article
        class="relative flex h-[120px] flex-col justify-between overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-flare-500 to-emerald-400"
        />
        <div class="flex items-start justify-between">
          <h3 class="text-sm font-semibold text-forena-800">{{ D.k2 }}</h3>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
          >
            <Users class="h-4 w-4" />
          </span>
        </div>
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-light tabular-nums text-forena-900">559</span>
            <span class="text-sm font-medium text-slate-400">{{ D.k2Sub }}</span>
          </div>
          <p class="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <span class="h-1 w-1 rounded-full bg-emerald-500" />
            {{ D.k2Foot }}
          </p>
        </div>
      </article>

      <article
        class="relative flex h-[120px] flex-col justify-between overflow-hidden rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/80 to-white/90 p-5 shadow-card"
      >
        <div class="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-amber-200/20" />
        <div class="relative z-10 flex items-start justify-between">
          <h3 class="text-sm font-semibold text-amber-900">{{ D.k3 }}</h3>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700"
          >
            <Wallet class="h-4 w-4" />
          </span>
        </div>
        <div class="relative z-10">
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-light tabular-nums text-forena-900">4</span>
            <span class="text-sm font-medium text-slate-500">{{ D.k3Sub }}</span>
          </div>
          <button
            type="button"
            class="mt-1 flex items-center gap-0.5 text-left text-[11px] font-bold text-amber-800 hover:underline"
          >
            {{ D.k3Btn }}
            <ChevronRight class="h-3 w-3" />
          </button>
        </div>
      </article>

      <article
        class="relative flex h-[120px] flex-col justify-between overflow-hidden rounded-2xl border border-rose-100/90 bg-gradient-to-br from-rose-50/90 to-white/90 p-5 shadow-card"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-rose-400 to-amber-400"
        />
        <div class="flex items-start justify-between">
          <h3 class="text-sm font-semibold text-rose-800">{{ D.k4 }}</h3>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600"
          >
            <ShieldAlert class="h-4 w-4" />
          </span>
        </div>
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-light tabular-nums text-rose-600">1</span>
            <span class="text-sm font-medium text-rose-500">{{ D.k4Unit }}</span>
          </div>
          <p class="mt-1 truncate text-[11px] font-medium text-rose-700">{{ D.k4Foot }}</p>
        </div>
      </article>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div
        class="relative flex min-h-[500px] flex-col rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm lg:col-span-3"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-forena-500 to-flare-400 opacity-90"
        />
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-bold text-forena-900">{{ D.colTitle }}</h3>
          <button
            type="button"
            class="text-[11px] font-semibold text-flare-600 hover:text-flare-700 hover:underline"
          >
            {{ D.colAll }}
          </button>
        </div>
        <div class="scrollbar-hide flex-1 space-y-3 overflow-y-auto pr-1">
          <div
            v-for="(s, idx) in D.sites"
            :key="idx"
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            :class="s.muted === true ? 'opacity-70' : s.muted === 'low' ? 'opacity-50' : ''"
          >
            <div class="mb-3 flex items-start justify-between">
              <h4 class="text-sm font-bold text-slate-800">{{ s.name }}</h4>
              <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="s.badgeClass">{{
                s.badge
              }}</span>
            </div>
            <div class="space-y-1.5 text-xs text-slate-600">
              <p class="flex items-center justify-between gap-2">
                <span class="flex items-center gap-1.5">
                  <User class="h-3.5 w-3.5 text-flare-500" />
                  {{ s.deploy }}
                </span>
                <span
                  v-if="s.issue"
                  class="flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600"
                >
                  <AlertTriangle class="h-3 w-3" />
                  {{ D.issueLabel }}
                </span>
              </p>
              <p class="flex items-center gap-1.5">
                <HardHat class="h-3.5 w-3.5 text-forena-400" />
                {{ s.partners }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 lg:col-span-6">
        <div
          class="flex min-h-[300px] flex-1 flex-col rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-bold text-forena-900">
              {{ D.chartTitle }}
              <span class="ml-1 text-xs font-normal text-slate-400">{{ D.chartUnit }}</span>
            </h3>
            <span
              class="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
            >
              <TrendingUp class="h-3.5 w-3.5" />
              {{ D.chartTrend }}
            </span>
          </div>
          <div
            class="relative flex flex-1 items-end justify-between rounded-xl border-b-2 border-forena-100 bg-gradient-to-t from-flare-50/50 to-transparent px-4 pb-2"
          >
            <div class="h-[20%] w-8 rounded-t-sm bg-forena-200" />
            <div class="h-[25%] w-8 rounded-t-sm bg-forena-200" />
            <div class="h-[35%] w-8 rounded-t-sm bg-forena-300" />
            <div class="h-[55%] w-8 rounded-t-sm bg-forena-400" />
            <div class="h-[40%] w-8 rounded-t-sm bg-forena-300" />
            <div class="h-[60%] w-8 rounded-t-sm bg-flare-500" />
            <div
              class="relative h-[80%] w-8 rounded-t-sm bg-gradient-to-t from-forena-600 to-flare-500"
            >
              <span
                class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600"
                >18.5</span
              >
            </div>
            <div class="h-[5%] w-8 rounded-t-sm bg-slate-200" />
            <div class="h-[5%] w-8 rounded-t-sm bg-slate-200" />
            <div class="h-[5%] w-8 rounded-t-sm bg-slate-200" />
            <div class="h-[5%] w-8 rounded-t-sm bg-slate-200" />
            <div class="h-[5%] w-8 rounded-t-sm bg-slate-200" />
          </div>
          <div class="mt-2 flex justify-between px-2 text-[10px] font-medium text-slate-400">
            <span v-for="(m, mi) in D.months" :key="mi">{{ m }}</span>
          </div>
        </div>

        <div
          class="flex h-[180px] flex-col rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
        >
          <h3 class="mb-4 font-bold text-forena-900">{{ D.donutTitle }}</h3>
          <div class="flex flex-1 items-center justify-around">
            <div
              class="relative flex h-24 w-24 items-center justify-center rounded-full border-[12px] border-slate-100"
            >
              <div
                class="absolute inset-[-12px] rotate-[-45deg] rounded-full border-[12px] border-forena-500 border-b-transparent border-r-transparent"
              />
              <div
                class="absolute inset-[-12px] rotate-45 rounded-full border-[12px] border-flare-400 border-b-transparent border-l-transparent border-t-transparent"
              />
              <div
                class="absolute inset-[-12px] -rotate-12 rounded-full border-[12px] border-amber-400 border-b-transparent border-r-transparent border-t-transparent"
              />
              <span class="text-xs font-bold text-forena-900">{{ D.donutCenter }}</span>
            </div>
            <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div v-for="(lg, li) in D.legend" :key="li" class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full" :class="lg.dot" />
                <span class="text-slate-600"
                  >{{ lg.label }} <span class="text-slate-400">{{ lg.sub }}</span></span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 lg:col-span-3">
        <div
          class="flex-1 rounded-2xl border border-flare-100/80 bg-gradient-to-b from-flare-50/50 to-white/90 p-5 shadow-card backdrop-blur-sm"
        >
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-bold text-forena-900">{{ D.alertTitle }}</h3>
            <Bell class="h-5 w-5 text-flare-500" />
          </div>
          <div class="space-y-3">
            <div
              v-for="(a, ai) in D.alerts"
              :key="ai"
              class="rounded-lg bg-white p-3 shadow-sm"
              :class="
                a.tone === 'rose'
                  ? 'border border-rose-100 ring-1 ring-rose-100/80'
                  : 'border border-amber-100'
              "
            >
              <div
                class="mb-1 flex items-center gap-1.5 text-xs font-bold"
                :class="a.tone === 'rose' ? 'text-rose-600' : 'text-amber-700'"
              >
                <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
                {{ a.title }}
              </div>
              <p class="text-[11px] text-slate-500">{{ a.body }}</p>
            </div>
          </div>
        </div>

        <div
          class="rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
        >
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-bold text-forena-900">
              {{ D.wxTitle }}<span class="text-xs font-normal text-slate-400">{{ D.wxHint }}</span>
            </h3>
            <Cloud class="h-5 w-5 text-flare-500" />
          </div>
          <div class="mb-4 space-y-2">
            <div class="flex items-center justify-between rounded-lg bg-flare-50/80 p-2.5">
              <span class="text-xs font-medium text-forena-800">{{ D.wxRainL }}</span>
              <span class="text-xs font-bold text-flare-700">{{ D.wxRainR }}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-rose-50/80 p-2.5">
              <span class="text-xs font-medium text-rose-900">{{ D.wxWindL }}</span>
              <span class="text-xs font-bold text-rose-600">{{ D.wxWindR }}</span>
            </div>
          </div>
          <button
            type="button"
            class="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            {{ D.wxBtn }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
