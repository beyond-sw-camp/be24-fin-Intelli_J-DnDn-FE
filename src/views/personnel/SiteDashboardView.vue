<script setup>
import { ref, computed } from 'vue'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Zap,
  MapPin,
} from 'lucide-vue-next'

const T = {
  kicker: '본사 인력 운영',
  title: '인사 대시보드',
  desc: '온보딩, 출입·근태, 배치, 공수, 협력사 운영 현황을 한 화면에서 확인합니다.',
  today: '금일 투입',
  status: '현장 운영 상태',
  running: '정상 운영',
  onboardingNeed: '온보딩 확인',
  closing: '근태 마감',
  secPriority: '우선 확인',
  secTask: '운영 체크',
  secMain: '메인 인디케이터',
  indAttendance: '금일 투입 현황',
  totalChecked: '출근 완료',
  personUnit: '명',
  colBreakdown: '현장 / 협력사',
  colCount: '인원',
  indNew: '온보딩 현황',
  indAction: '승인 및 마감 현황',
  approvalTitle: '승인 필요',
  scheduleTitle: '오늘 일정',
  secProgress: '현장별 인력 운영 현황',
  progressViz: '현장별 배치율',
  progressVizSub: '본사 기준 현장별 투입 운영 상태를 요약합니다.',
  overall: '전체 배치율',
}

const attendanceTarget = 145

const attendanceBreakdown = ref([
  { label: '강남구 재건축 A공구 / 태양건설', count: 42 },
  { label: '판교 데이터센터 / 한숲전기', count: 28 },
  { label: '인천항 물류센터 / 청월건설', count: 35 },
  { label: '본사 지원 / 기타', count: 19 },
])

const onboardingCounts = ref({
  total: 4,
  deployable: 1,
  review: 1,
  nodoc: 1,
  limit: 1,
})

const priorityCards = ref([
  {
    id: 1,
    source: '작업자 인력 온보딩',
    title: '서류 미제출 1명',
    detail: '박지훈 · 필수 서류 업로드 전 투입 불가',
    meta: '온보딩 화면 기준',
    tone: 'amber',
  },
  {
    id: 2,
    source: '월별 근태 마감 관리',
    title: '판교 데이터센터 미확정 12건',
    detail: '미확정 건수 해소 전 월 마감 불가',
    meta: '근태 마감 화면 기준',
    tone: 'rose',
  },
  {
    id: 3,
    source: '인력 배치 관리 보드',
    title: '배치 대기 5명',
    detail: 'C구역 공란 · B구역 추가 충원 필요',
    meta: '배치 보드 기준',
    tone: 'sky',
  },
  {
    id: 4,
    source: '공수 관리',
    title: '출입 기록 대조 필요 1건',
    detail: '이목수 공수 계산 확인 필요 · 미지급 1건',
    meta: '공수 관리 기준',
    tone: 'slate',
  },
])

const operationsChecklist = ref([
  {
    id: 1,
    source: '작업자 인력 온보딩',
    title: '검토 중 1명 재확인',
    detail: '이만수 · 안전교육 및 서류 상태 확인 필요',
    status: '승인 전',
  },
  {
    id: 2,
    source: '작업자 관리',
    title: '투입 제한 1명 상세 확인',
    detail: '최용호 · 제재/주의 이력 확인 필요',
    status: '확인 필요',
  },
  {
    id: 3,
    source: '협력사 관리',
    title: '계약 만료 예정 1곳',
    detail: '우주산업 · 계약 기간 및 재계약 여부 검토',
    status: '금주 체크',
  },
  {
    id: 4,
    source: '출입 / 근태 관리',
    title: '작업 중 1명 · 조퇴 1명',
    detail: '현장별 근태 보정 요청 여부 함께 확인',
    status: '수시 확인',
  },
  {
    id: 5,
    source: '계정 관리',
    title: '현장 책임자 계정 1개 점검',
    detail: '판교 데이터센터 담당 계정 권한 유지 여부 확인',
    status: '월간 점검',
  },
])

const approvalItems = ref([
  '신규 투입 승인 대기 1건',
  '근태 수정 요청 검토 1건',
  '공수 계산 확인 1건',
  '서류 보완 확인 1건',
])

const scheduleItems = ref([
  '10:00 오전 출근 확정',
  '14:00 공수 검토',
  '17:00 근태 마감 확인',
  '18:00 익일 배치 확정',
])

const staffingProgress = ref([
  { name: '강남구 재건축 A공구', pct: 96 },
  { name: '판교 데이터센터', pct: 88 },
  { name: '인천항 물류센터', pct: 91 },
  { name: '본사 지원 / 기타', pct: 79 },
])

const totalCheckedIn = computed(() =>
  attendanceBreakdown.value.reduce((sum, row) => sum + row.count, 0),
)

const onboardingPendingCount = computed(
  () => onboardingCounts.value.review + onboardingCounts.value.nodoc + onboardingCounts.value.limit,
)

const overallStaffingRate = computed(() =>
  Math.round(
    staffingProgress.value.reduce((sum, row) => sum + row.pct, 0) / staffingProgress.value.length,
  ),
)

const workingNowCount = computed(() => 1)
const leaveEarlyCount = computed(() => 1)
const closingPendingCount = computed(() => 2)
const approvalCount = computed(() => approvalItems.value.length)
const scheduleCount = computed(() => scheduleItems.value.length)

function toneClass(tone) {
  if (tone === 'rose') {
    return {
      card: 'border-rose-200 bg-rose-50/70',
      badge: 'bg-rose-100 text-rose-700',
      title: 'text-rose-900',
      icon: 'text-rose-500',
    }
  }

  if (tone === 'amber') {
    return {
      card: 'border-amber-200 bg-amber-50/70',
      badge: 'bg-amber-100 text-amber-700',
      title: 'text-amber-900',
      icon: 'text-amber-500',
    }
  }

  if (tone === 'sky') {
    return {
      card: 'border-sky-200 bg-sky-50/70',
      badge: 'bg-sky-100 text-sky-700',
      title: 'text-sky-900',
      icon: 'text-sky-500',
    }
  }

  return {
    card: 'border-slate-200 bg-slate-50/80',
    badge: 'bg-slate-100 text-slate-700',
    title: 'text-slate-900',
    icon: 'text-slate-500',
  }
}
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
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
          >
            <LayoutDashboard class="h-[1.125rem] w-[1.125rem]" />
          </span>
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">
              {{ T.kicker }}
            </p>
            <h2 class="text-gradient-brand text-lg font-bold tracking-tight sm:text-xl">
              {{ T.title }}
            </h2>
            <p class="mt-1.5 w-full text-[13px] leading-relaxed text-forena-700/80 sm:text-sm">
              {{ T.desc }}
            </p>
          </div>
        </div>
        <div
          class="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-forena-100/80 bg-white/70 px-3 py-2 text-[11px] text-forena-600 lg:px-4 lg:py-3"
        >
          <span class="tabular-nums text-forena-800">
            {{ T.today }}: <strong>{{ totalCheckedIn }}</strong> / {{ attendanceTarget }}{{ T.personUnit }}
          </span>
        </div>
      </div>
    </div>

    <div class="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[1.18fr_0.82fr] lg:gap-5 xl:gap-6">
      <div class="overflow-hidden rounded-2xl border border-rose-100/90 bg-white/95 shadow-card lg:h-[22.25rem]">
        <div
          class="border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-4 py-2.5 sm:px-5 sm:py-3"
        >
          <div class="flex items-center gap-2">
            <Zap class="h-4 w-4 text-rose-600" />
            <h3 class="text-sm font-bold text-forena-900">{{ T.secPriority }}</h3>
          </div>
        </div>

        <div class="grid gap-3 p-3.5 sm:grid-cols-2 sm:p-4">
          <article
            v-for="item in priorityCards"
            :key="item.id"
            class="min-h-[7.6rem] rounded-xl border p-3.5"
            :class="toneClass(item.tone).card"
          >
            <div class="flex items-start justify-between gap-3">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                :class="toneClass(item.tone).badge"
              >
                {{ item.source }}
              </span>
              <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" :class="toneClass(item.tone).icon" />
            </div>
            <p class="mt-2 text-sm font-bold leading-snug" :class="toneClass(item.tone).title">
              {{ item.title }}
            </p>
            <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ item.detail }}</p>
            <p class="mt-2 text-[11px] font-medium text-slate-500">{{ item.meta }}</p>
          </article>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-sky-100/90 bg-white/95 shadow-card lg:h-[22.25rem]">
        <div class="border-b border-sky-100 bg-sky-50/60 px-4 py-2.5 sm:px-5 sm:py-3">
          <div class="flex items-center gap-2">
            <ClipboardList class="h-4 w-4 text-sky-700" />
            <h3 class="text-sm font-bold text-forena-900">{{ T.secTask }}</h3>
          </div>
        </div>

        <div class="h-full overflow-y-auto p-3.5 sm:p-4 lg:pr-3">
          <div class="grid gap-3">
            <article
              v-for="task in operationsChecklist"
              :key="task.id"
              class="rounded-xl border border-forena-100 bg-slate-50/70 p-3.5"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
                  {{ task.source }}
                </span>
                <span class="text-[10px] font-semibold text-slate-500">{{ task.status }}</span>
              </div>
              <p class="mt-2 text-sm font-semibold text-forena-900">{{ task.title }}</p>
              <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ task.detail }}</p>
            </article>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div
        class="flex flex-wrap items-center gap-2 border-b border-forena-100 bg-gradient-to-r from-forena-50/60 to-flare-50/40 px-4 py-2.5 sm:px-5 sm:py-3"
      >
        <LayoutDashboard class="h-4 w-4 text-flare-600" />
        <h3 class="text-sm font-bold text-forena-900">{{ T.secMain }}</h3>
      </div>

      <div class="grid gap-4 p-4 sm:gap-5 sm:p-5 xl:grid-cols-12 xl:gap-5 xl:p-6">
        <div class="min-w-0 rounded-xl border border-forena-100 bg-forena-50/30 p-4 xl:col-span-6">
          <div class="flex items-center gap-2">
            <Users class="h-4 w-4 shrink-0 text-flare-600" />
            <p class="text-sm font-bold text-forena-900">{{ T.indAttendance }}</p>
          </div>

          <div class="mt-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p class="text-3xl font-bold leading-none tabular-nums text-forena-900 sm:text-[2rem]">
                {{ totalCheckedIn }}
                <span class="mx-1.5 text-slate-300">/</span>
                <span class="text-slate-500">{{ attendanceTarget }}</span>
                <span class="ml-1 text-base font-semibold text-slate-500 sm:text-lg">{{ T.personUnit }}</span>
              </p>
              <p class="mt-2 text-[11px] font-semibold text-forena-500">{{ T.totalChecked }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <div class="rounded-lg border border-forena-100 bg-white px-3 py-2">
                <p class="text-[10px] font-bold text-slate-500">작업 중</p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ workingNowCount }}명</p>
              </div>
              <div class="rounded-lg border border-forena-100 bg-white px-3 py-2">
                <p class="text-[10px] font-bold text-slate-500">조퇴</p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ leaveEarlyCount }}명</p>
              </div>
              <div class="rounded-lg border border-forena-100 bg-white px-3 py-2">
                <p class="text-[10px] font-bold text-slate-500">근태 마감 대기</p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ closingPendingCount }}곳</p>
              </div>
            </div>
          </div>

          <div class="mt-4 overflow-hidden rounded-lg border border-forena-100 bg-white">
            <table class="w-full text-left text-xs">
              <thead class="bg-forena-50/90 text-[10px] font-bold uppercase text-forena-500">
                <tr>
                  <th class="px-3 py-2">{{ T.colBreakdown }}</th>
                  <th class="px-3 py-2 text-right">{{ T.colCount }}</th>
                </tr>
              </thead>
              <tbody class="text-forena-800">
                <tr v-for="(row, i) in attendanceBreakdown" :key="i" class="border-t border-forena-50">
                  <td class="px-3 py-2.5 font-medium">{{ row.label }}</td>
                  <td class="px-3 py-2.5 text-right font-bold tabular-nums">{{ row.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="min-w-0 rounded-xl border border-sky-100/80 bg-sky-50/40 p-4 xl:col-span-3">
          <div class="flex items-center gap-2">
            <UserPlus class="h-4 w-4 shrink-0 text-sky-600" />
            <p class="text-sm font-bold text-forena-900">{{ T.indNew }}</p>
          </div>

          <div class="mt-4 rounded-xl border border-sky-100/60 bg-white/85 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-3xl font-bold leading-none tabular-nums text-sky-900 sm:text-[2rem]">
                  {{ onboardingCounts.total }}
                </p>
                <p class="mt-2 text-[11px] font-semibold text-sky-800">총 등록 인원</p>
              </div>
              <div class="rounded-lg bg-forena-50 px-3 py-2 text-right ring-1 ring-forena-100">
                <p class="text-[10px] font-bold text-forena-500">확인 필요</p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ onboardingPendingCount }}명</p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2.5">
              <div class="rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-100">
                <p class="text-[10px] font-bold text-emerald-700">투입 가능</p>
                <p class="mt-1 text-sm font-bold tabular-nums text-emerald-900">
                  {{ onboardingCounts.deployable }}
                </p>
              </div>
              <div class="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
                <p class="text-[10px] font-bold text-slate-500">검토 중</p>
                <p class="mt-1 text-sm font-bold tabular-nums text-forena-900">
                  {{ onboardingCounts.review }}
                </p>
              </div>
              <div class="rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-amber-100">
                <p class="text-[10px] font-bold text-amber-700">서류 미제출</p>
                <p class="mt-1 text-sm font-bold tabular-nums text-amber-900">
                  {{ onboardingCounts.nodoc }}
                </p>
              </div>
              <div class="rounded-lg bg-rose-50 px-3 py-2.5 ring-1 ring-rose-100">
                <p class="text-[10px] font-bold text-rose-700">투입 제한</p>
                <p class="mt-1 text-sm font-bold tabular-nums text-rose-900">
                  {{ onboardingCounts.limit }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="min-w-0 rounded-xl border border-forena-100 bg-white p-4 xl:col-span-3">
          <div class="flex items-center gap-2">
            <ClipboardList class="h-4 w-4 shrink-0 text-flare-600" />
            <p class="text-sm font-bold text-forena-900">{{ T.indAction }}</p>
          </div>

          <div class="mt-4 flex h-full min-h-[18.5rem] flex-col gap-3">
            <div class="grid grid-cols-3 gap-2.5">
              <div class="rounded-lg border border-forena-100 bg-forena-50/50 px-3 py-2.5">
                <p class="text-[10px] font-bold text-forena-500">승인 대기</p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ approvalCount }}건</p>
              </div>
              <div class="rounded-lg border border-forena-100 bg-forena-50/50 px-3 py-2.5">
                <p class="text-[10px] font-bold text-forena-500">오늘 일정</p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ scheduleCount }}건</p>
              </div>
              <div class="rounded-lg border border-forena-100 bg-forena-50/50 px-3 py-2.5">
                <p class="text-[10px] font-bold text-forena-500">근태 마감</p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ closingPendingCount }}곳</p>
              </div>
            </div>

            <div class="grid flex-1 gap-3 xl:grid-rows-2">
              <div class="rounded-lg border border-forena-100 bg-white px-3 py-3">
                <p class="mb-2 flex items-center gap-1 text-[11px] font-bold text-forena-500">
                  <AlertTriangle class="h-3.5 w-3.5" />
                  {{ T.approvalTitle }}
                </p>
                <ul class="space-y-1.5 text-xs text-forena-800">
                  <li
                    v-for="(item, index) in approvalItems"
                    :key="index"
                    class="rounded-lg border border-forena-100 bg-forena-50/50 px-2.5 py-1.5"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>

              <div class="rounded-lg border border-forena-100 bg-white px-3 py-3">
                <p class="mb-2 flex items-center gap-1 text-[11px] font-bold text-forena-500">
                  <ClipboardList class="h-3.5 w-3.5" />
                  {{ T.scheduleTitle }}
                </p>
                <ul class="space-y-1.5 text-xs text-forena-800">
                  <li
                    v-for="(item, index) in scheduleItems"
                    :key="index"
                    class="rounded-lg border border-forena-100 px-2.5 py-1.5"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
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
          <p class="text-2xl font-light tabular-nums text-forena-900 sm:text-3xl">
            {{ totalCheckedIn }} / {{ attendanceTarget }}{{ T.personUnit }}
          </p>
        </div>
        <p class="text-xs text-slate-500">{{ T.totalChecked }}</p>
      </article>

      <article class="flex min-h-[7.5rem] flex-col gap-2 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <LayoutDashboard class="h-4 w-4 text-flare-600" />
          {{ T.status }}
        </div>
        <div class="flex flex-1 flex-col justify-center py-0.5">
          <p class="text-base font-bold text-emerald-700 sm:text-lg">{{ T.running }}</p>
        </div>
      </article>

      <article
        class="flex min-h-[7.5rem] flex-col gap-3 rounded-2xl border border-amber-100/90 bg-amber-50/40 p-4 shadow-card"
      >
        <div class="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <UserPlus class="h-4 w-4 shrink-0" />
          {{ T.onboardingNeed }}
        </div>

        <div class="grid flex-1 grid-cols-2 gap-2">
          <div class="rounded-lg bg-white/90 px-3 py-2 ring-1 ring-amber-100">
            <p class="text-[10px] font-bold text-amber-700">확인 필요</p>
            <p class="mt-1 text-sm font-bold tabular-nums text-amber-900">
              {{ onboardingPendingCount }}명
            </p>
          </div>
          <div class="rounded-lg bg-white/90 px-3 py-2 ring-1 ring-emerald-100">
            <p class="text-[10px] font-bold text-emerald-700">투입 가능</p>
            <p class="mt-1 text-sm font-bold tabular-nums text-emerald-900">
              {{ onboardingCounts.deployable }}명
            </p>
          </div>
        </div>
      </article>

      <article class="flex min-h-[7.5rem] flex-col gap-3 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <ClipboardList class="h-4 w-4 text-flare-600" />
          {{ T.closing }}
        </div>
        <div class="grid flex-1 grid-cols-2 gap-2">
          <div class="rounded-lg border border-forena-100 bg-forena-50/50 px-3 py-2">
            <p class="text-[10px] font-bold text-forena-500">미마감 현장</p>
            <p class="mt-1 text-sm font-bold text-forena-900">{{ closingPendingCount }}곳</p>
          </div>
          <div class="rounded-lg border border-forena-100 bg-forena-50/50 px-3 py-2">
            <p class="text-[10px] font-bold text-forena-500">미확정 건수</p>
            <p class="mt-1 text-sm font-bold text-forena-900">12건</p>
          </div>
        </div>
      </article>
    </div>

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
            <p class="text-2xl font-bold tabular-nums text-forena-900 sm:text-3xl">
              {{ overallStaffingRate }}%
            </p>
          </div>
          <div class="mt-4 h-3 overflow-hidden rounded-full bg-forena-100 sm:h-3.5">
            <div
              class="h-full rounded-full bg-gradient-to-r from-forena-600 to-flare-500 transition-all"
              :style="{ width: overallStaffingRate + '%' }"
            />
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-3">
            <div class="rounded-lg border border-forena-100 bg-white/80 px-3 py-2">
              <p class="text-[10px] font-bold text-slate-500">인력 배치</p>
              <p class="mt-1 text-sm font-bold text-forena-900">대기 5명</p>
            </div>
            <div class="rounded-lg border border-forena-100 bg-white/80 px-3 py-2">
              <p class="text-[10px] font-bold text-slate-500">근태 마감</p>
              <p class="mt-1 text-sm font-bold text-forena-900">미마감 {{ closingPendingCount }}곳</p>
            </div>
            <div class="rounded-lg border border-forena-100 bg-white/80 px-3 py-2">
              <p class="text-[10px] font-bold text-slate-500">온보딩</p>
              <p class="mt-1 text-sm font-bold text-forena-900">확인 필요 {{ onboardingPendingCount }}명</p>
            </div>
          </div>
        </div>

        <div class="min-w-0">
          <p class="mb-3 flex items-center gap-1 text-xs font-bold text-forena-500">
            <MapPin class="h-3.5 w-3.5" />
            {{ T.progressViz }}
          </p>
          <ul class="grid gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3 lg:grid-cols-1 xl:grid-cols-2 xl:gap-x-8">
            <li v-for="(site, idx) in staffingProgress" :key="idx" class="min-w-0">
              <div class="flex justify-between gap-2 text-xs font-semibold text-forena-800">
                <span class="min-w-0 truncate">{{ site.name }}</span>
                <span class="shrink-0 tabular-nums text-flare-700">{{ site.pct }}%</span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-forena-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-forena-500 to-flare-400"
                  :style="{ width: site.pct + '%' }"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>