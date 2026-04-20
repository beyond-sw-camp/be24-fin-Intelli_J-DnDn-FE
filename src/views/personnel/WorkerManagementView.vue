<script setup>
import { Users } from 'lucide-vue-next'
import AttendanceListView from '@/views/personnel/AttendanceListView.vue'

const T = {
  pageTitle: '작업자 관리',
  kicker: '인사',
  heroDesc:
    '본사 직영과 협력사(인력 등)소속 작업자를 동일 현장에서 관리할 수 있도록, 출입/근태 및 공수 현황을 구분별로 조회하고 보정합니다.',
  sectionAttendance: '출입 / 근태 현황',
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex items-start gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
        >
          <Users class="h-5 w-5" />
        </span>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">{{ T.kicker }}</p>
          <h1 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.pageTitle }}</h1>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ T.heroDesc }}</p>
        </div>
      </div>
    </div>

    <div>
      <h2 class="mb-3 text-sm font-bold text-forena-900">{{ T.sectionAttendance }}</h2>
      <AttendanceListView embed />
    </div>
  </div>
</template>
