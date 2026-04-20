<script setup>
import { ref, computed } from 'vue'

const selectedMonth = ref('2025-10')

// 현장별 마감 현황 목업 데이터
const closingList = ref([
  {
    id: 'GN-A-01',
    name: '강남구 재건축 A공구',
    totalDays: 1250,
    unconfirmed: 0,
    status: '마감 완료',
    history: '2025.10.05 18:30 (시스템)',
  },
  {
    id: 'PG-02',
    name: '판교 데이터센터',
    totalDays: 3420,
    unconfirmed: 12,
    status: '미마감/수정가능',
    history: '-',
  },
  {
    id: 'IC-03',
    name: '인천항 물류센터',
    totalDays: 850,
    unconfirmed: 0,
    status: '미마감/수정가능',
    history: '반려됨 (2025.10.02)',
  },
])

const summary = computed(() => {
  const total = closingList.value.length
  const closed = closingList.value.filter((c) => c.status === '마감 완료').length
  const pending = total - closed
  return { total, closed, pending }
})

const closeSite = (id) => {
  const site = closingList.value.find((c) => c.id === id)
  if (site.unconfirmed > 0) {
    alert(`[${site.name}] 현장은 아직 미확정 건수가 남아있어 마감할 수 없습니다.`)
    return
  }
  if (
    confirm(
      `[${site.name}] 현장의 ${selectedMonth.value}월 근태를 최종 마감하시겠습니까?\n마감 후에는 어떠한 수정도 불가능합니다.`,
    )
  ) {
    site.status = '마감 완료'
    site.history =
      new Date().toLocaleString('ko-KR', { hour12: false }).slice(0, -3) + ' (본사 승인)'
    alert('근태 마감이 정상적으로 완료되었습니다.')
  }
}

const getStatusBadge = (status) => {
  if (status === '마감 완료') return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
  return 'bg-orange-50 text-orange-600 border border-orange-100'
}
</script>

<template>
  <div class="h-full bg-white font-sans text-gray-800 flex flex-col pb-10">
    <div class="flex justify-between items-end mb-8">
      <div>
        <div class="text-[11px] text-gray-400 mb-1 font-medium tracking-wide">
          Dashboard <span class="mx-1">/</span> Attendance <span class="mx-1">/</span>
          <span class="text-gray-800">Monthly Closing</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">월별 근태 마감 관리</h1>
      </div>
      <div>
        <input
          v-model="selectedMonth"
          type="month"
          class="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-gray-900 bg-white shadow-sm"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <p class="text-sm font-semibold text-gray-500 mb-2">이번 달 총 현장</p>
        <div class="flex items-end justify-between">
          <span class="text-4xl font-bold text-gray-900"
            >{{ summary.total
            }}<span class="text-base font-normal text-gray-400 ml-1">곳</span></span
          >
        </div>
      </div>
      <div
        class="bg-emerald-50/30 border border-emerald-100 rounded-3xl p-6 shadow-sm relative overflow-hidden"
      >
        <div class="absolute right-0 top-0 w-20 h-20 bg-emerald-100/50 rounded-bl-full"></div>
        <p class="text-sm font-semibold text-emerald-600 mb-2 relative z-10">마감 완료 현장</p>
        <div class="flex items-end justify-between relative z-10">
          <span class="text-4xl font-bold text-emerald-700"
            >{{ summary.closed
            }}<span class="text-base font-normal text-emerald-500/70 ml-1">곳</span></span
          >
        </div>
      </div>
      <div
        class="bg-orange-50/30 border border-orange-100 rounded-3xl p-6 shadow-sm relative overflow-hidden"
      >
        <div class="absolute right-0 top-0 w-20 h-20 bg-orange-100/50 rounded-bl-full"></div>
        <p class="text-sm font-semibold text-orange-600 mb-2 relative z-10">미마감 / 수정가능</p>
        <div class="flex items-end justify-between relative z-10">
          <span class="text-4xl font-bold text-orange-700"
            >{{ summary.pending
            }}<span class="text-base font-normal text-orange-500/70 ml-1">곳</span></span
          >
        </div>
      </div>
    </div>

    <div
      class="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col"
    >
      <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 class="font-bold text-gray-900">{{ selectedMonth }} 현장 마감 현황</h3>
      </div>

      <div class="overflow-x-auto flex-1">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead
            class="text-gray-400 bg-white text-xs uppercase tracking-wider border-b border-gray-100"
          >
            <tr>
              <th class="py-4 px-6 font-semibold">현장명</th>
              <th class="py-4 px-6 font-semibold text-right">총 출근일수(공수)</th>
              <th class="py-4 px-6 font-semibold text-center">미확정 건수</th>
              <th class="py-4 px-6 font-semibold text-center">마감 상태</th>
              <th class="py-4 px-6 font-semibold">최근 이력</th>
              <th class="py-4 px-6 font-semibold text-center">마감 처리</th>
            </tr>
          </thead>
          <tbody class="text-gray-700">
            <tr
              v-for="site in closingList"
              :key="site.id"
              class="border-b border-gray-50 hover:bg-gray-50/80 transition"
            >
              <td class="py-4 px-6">
                <div class="font-bold text-gray-900 text-sm">{{ site.name }}</div>
                <div class="text-[11px] text-gray-400 mt-0.5">{{ site.id }}</div>
              </td>
              <td class="py-4 px-6 font-bold text-gray-800 text-right">
                {{ site.totalDays.toLocaleString() }}
                <span class="text-[11px] font-normal text-gray-500">공수</span>
              </td>
              <td class="py-4 px-6 text-center">
                <span
                  v-if="site.unconfirmed > 0"
                  class="text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md text-xs"
                  >{{ site.unconfirmed }}건</span
                >
                <span v-else class="text-gray-300 font-bold">-</span>
              </td>
              <td class="py-4 px-6 text-center">
                <span
                  class="px-3 py-1 rounded-full text-[11px] font-bold"
                  :class="getStatusBadge(site.status)"
                  >{{ site.status }}</span
                >
              </td>
              <td class="py-4 px-6 text-[11px] text-gray-500">{{ site.history }}</td>
              <td class="py-4 px-6 text-center">
                <button
                  v-if="site.status !== '마감 완료'"
                  @click="closeSite(site.id)"
                  class="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-gray-800 transition"
                >
                  마감 승인
                </button>
                <span
                  v-else
                  class="text-[11px] text-gray-300 font-bold bg-gray-50 px-4 py-2 rounded-xl"
                  >수정 불가</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
