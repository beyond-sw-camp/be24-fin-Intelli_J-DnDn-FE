<script setup>
import { computed, ref } from 'vue'
import { AlertTriangle, Search, X } from 'lucide-vue-next'

const T = {
  title: '공수 관리',
  desc:
    '최근 7일 근태·공수와 총 근무일을 확인하고, 산정·확정 및 제수당·지급 여부를 한 곳에서 관리합니다.',
  dayUnit: '일',
  manUnit: '공수',
  alert:
    '[확인 필요] 이목수 작업자의 공수 계산이 출입 기록과 다를 수 있습니다. 출입 기록을 대조하세요.',
  colName: '이름 / 소속',
  col7: '최근 7일 근태 및 공수',
  colTotal: '총 근무일 / 공수',
  colAllow: '제수당 구분',
  colPay: '지급 여부',
  paid: '지급 완료',
  unpaid: '미지급',
  slash: '/',
  searchPh: '작업자 이름 검색',
  emptyResult: '검색에 맞는 작업자가 없습니다.',
}

/** 오늘 기준 6일 전 ~ 오늘까지 MM/DD (7컬) */
const dateColumns = computed(() => {
  const out = []
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  return out
})

const showLogAlert = ref(true)

const searchQuery = ref('')

const filteredRows = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return rows.value
  return rows.value.filter((r) => r.name.includes(q))
})

/**
 * weekCells: 역시간순 (6일전 → 오늘)
 * man: 공수 (없으면 null, UI에서 /)
 */
const rows = ref([
  {
    id: 1,
    name: '김동석',
    affiliation: '태양건설',
    weekCells: [{ man: 1 }, { man: null }, { man: 1.5 }, { man: null }, { man: 1 }, { man: 1 }, { man: 1.5 }],
    totalDays: 22,
    manDays: 24.5,
    allowanceType: '연장(2공수) / 휴일(1공수)',
    isPaid: true,
  },
  {
    id: 2,
    name: '이목수',
    affiliation: '인력사무소',
    weekCells: [
      { man: 1 },
      { man: 1 },
      { man: null },
      { man: 1 },
      { man: 0.5 },
      { man: null },
      { man: 1 },
    ],
    totalDays: 15,
    manDays: 15,
    allowanceType: '-',
    isPaid: false,
  },
  {
    id: 3,
    name: '박반장',
    affiliation: '본사 소속',
    weekCells: [{ man: 1 }, { man: 1 }, { man: 1 }, { man: 1 }, { man: 1 }, { man: 1 }, { man: 1 }],
    totalDays: 28,
    manDays: 28,
    allowanceType: '휴일(1공수)',
    isPaid: true,
  },
])

const closeAlert = () => (showLogAlert.value = false)
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <h1 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.title }}</h1>
      <p class="mt-2 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
    </div>

    <div
      v-if="showLogAlert"
      class="flex items-center justify-between gap-4 rounded-2xl border border-rose-200/80 bg-rose-50/60 px-4 py-3 text-sm text-rose-800 shadow-sm"
    >
      <div class="flex items-center gap-2 font-bold">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        {{ T.alert }}
      </div>
      <button
        type="button"
        class="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-100 hover:text-rose-700"
        @click="closeAlert"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div
        class="flex flex-col gap-3 border-b border-forena-100 bg-forena-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-end"
      >
        <div class="relative w-full max-w-xs sm:max-w-sm">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forena-400"
            aria-hidden="true"
          />
          <input
            v-model="searchQuery"
            type="search"
            class="w-full rounded-xl border border-forena-200 bg-white py-2 pl-9 pr-3 text-sm text-forena-900 shadow-sm placeholder:text-slate-400 focus:border-flare-300 focus:outline-none focus:ring-2 focus:ring-flare-200/50"
            :placeholder="T.searchPh"
            autocomplete="off"
          />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[960px] text-left text-sm">
          <thead
            class="border-b border-forena-100 bg-forena-50/70 text-[11px] font-bold uppercase tracking-wider text-forena-500"
          >
            <tr>
              <th class="px-5 py-4 text-center font-semibold align-middle">{{ T.colName }}</th>
              <th class="px-5 py-4 text-left font-semibold align-middle">{{ T.col7 }}</th>
              <th class="px-5 py-4 text-center font-semibold align-middle">{{ T.colTotal }}</th>
              <th class="px-5 py-4 text-center font-semibold align-middle">{{ T.colAllow }}</th>
              <th class="px-5 py-4 text-center font-semibold align-middle">{{ T.colPay }}</th>
            </tr>
          </thead>
          <tbody class="text-forena-800">
            <tr v-if="filteredRows.length === 0">
              <td colspan="5" class="px-5 py-14 text-center text-sm text-slate-500">
                {{ T.emptyResult }}
              </td>
            </tr>
            <tr
              v-for="item in filteredRows"
              :key="item.id"
              class="border-b border-forena-50 transition hover:bg-flare-50/30"
            >
              <td class="px-5 py-4 align-middle text-center">
                <div class="flex flex-col items-center justify-center gap-0.5">
                  <div class="font-semibold text-forena-900">{{ item.name }}</div>
                  <div class="text-[11px] text-slate-500">{{ item.affiliation }}</div>
                </div>
              </td>
              <td class="px-5 py-4 align-top">
                <div
                  class="inline-block overflow-hidden rounded-xl border border-forena-200/90 bg-white shadow-sm ring-1 ring-forena-100/80"
                >
                  <table class="w-full border-collapse text-center text-[11px] leading-tight sm:text-xs">
                    <tbody>
                      <tr>
                        <td
                          v-for="(d, i) in dateColumns"
                          :key="'h-' + item.id + '-' + i"
                          class="min-w-[2.65rem] border-b border-r border-forena-100 bg-white px-1.5 py-2.5 font-semibold text-forena-700 last:border-r-0 sm:min-w-[3.1rem] sm:px-2"
                        >
                          {{ d }}
                        </td>
                      </tr>
                      <tr>
                        <td
                          v-for="(c, i) in item.weekCells"
                          :key="'man-' + item.id + '-' + i"
                          class="border-r border-forena-100 bg-white px-1.5 py-2.5 align-middle last:border-r-0 sm:px-2"
                        >
                          <template v-if="c.man != null">
                            <span class="font-bold tabular-nums text-forena-900">{{ c.man }}</span>
                            <span class="font-medium text-forena-600"> {{ T.manUnit }}</span>
                          </template>
                          <span v-else class="font-medium text-slate-400">{{ T.slash }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
              <td class="px-5 py-4 align-middle text-center font-semibold tabular-nums">
                {{ item.totalDays }}{{ T.dayUnit }} / {{ item.manDays }}{{ T.manUnit }}
              </td>
              <td class="px-5 py-4 align-middle text-center text-xs font-medium text-flare-700">
                {{ item.allowanceType }}
              </td>
              <td class="px-5 py-4 align-middle text-center">
                <span
                  class="inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold"
                  :class="
                    item.isPaid
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
                      : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80'
                  "
                >
                  {{ item.isPaid ? T.paid : T.unpaid }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
