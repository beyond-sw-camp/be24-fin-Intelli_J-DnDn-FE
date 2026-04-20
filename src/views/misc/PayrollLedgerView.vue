<script setup>
import { ref, computed } from 'vue'

const filters = ref({ month: '2025-10', site: '전체 현장' })
const selectedRows = ref([])

const ledgerList = ref([
  {
    id: 1,
    name: '김동석',
    affiliation: '태양건설',
    netPay: 5535000,
    bank: '신한은행',
    account: '110********',
  },
  {
    id: 2,
    name: '박반장',
    affiliation: '본사 소속',
    netPay: 4200000,
    bank: '국민은행',
    account: '934********',
  },
])

const toggleAll = (e) => {
  if (e.target.checked) selectedRows.value = ledgerList.value.map((l) => l.id)
  else selectedRows.value = []
}
</script>

<template>
  <div class="h-full font-sans text-[#2D3748] flex flex-col pb-10">
    <div class="flex justify-between items-end mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">일용직 급여 대장</h1>
        <p class="text-sm text-gray-400 mt-1">
          지급이 완료된 급여 대장을 확인하고 문서를 다운로드합니다.
        </p>
      </div>
      <div class="flex gap-3">
        <button
          class="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50"
        >
          PDF 다운로드
        </button>
        <button
          class="px-4 py-2 bg-[#546272] text-white rounded-lg text-sm font-bold hover:bg-[#43505e]"
        >
          엑셀 다운로드
        </button>
      </div>
    </div>

    <div class="flex gap-4 mb-6">
      <input
        v-model="filters.month"
        type="month"
        class="p-2 border border-gray-200 rounded-lg text-sm outline-none"
      />
      <select
        v-model="filters.site"
        class="p-2 border border-gray-200 rounded-lg text-sm outline-none"
      >
        <option>전체 현장</option>
        <option>강남구 재건축 A공구</option>
      </select>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p class="text-sm font-semibold text-gray-500 mb-2">지급 대상 인원</p>
        <span class="text-2xl font-bold">2명</span>
      </div>
      <div class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p class="text-sm font-semibold text-gray-500 mb-2">총 기본급 합계</p>
        <span class="text-2xl font-bold text-gray-800">8,500,000원</span>
      </div>
      <div class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p class="text-sm font-semibold text-gray-500 mb-2">총 공제액</p>
        <span class="text-2xl font-bold text-red-500">-345,000원</span>
      </div>
      <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
        <p class="text-sm font-semibold text-blue-600 mb-2">총 실 지급액</p>
        <span class="text-2xl font-bold text-blue-700">9,735,000원</span>
      </div>
    </div>

    <div
      class="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col"
    >
      <table class="w-full text-left text-sm whitespace-nowrap">
        <thead
          class="bg-gray-50/50 text-xs text-gray-400 uppercase font-bold border-b border-gray-100"
        >
          <tr>
            <th class="py-4 px-4 w-10 text-center">
              <input type="checkbox" @change="toggleAll" />
            </th>
            <th class="py-4 px-4">이름 / 소속</th>
            <th class="py-4 px-4">실 지급액</th>
            <th class="py-4 px-4">계좌번호</th>
          </tr>
        </thead>
        <tbody class="text-gray-700">
          <tr
            v-for="item in ledgerList"
            :key="item.id"
            class="border-b border-gray-50 hover:bg-gray-50"
          >
            <td class="py-3 px-4 text-center">
              <input type="checkbox" :value="item.id" v-model="selectedRows" />
            </td>
            <td class="py-3 px-4">
              <div class="font-bold text-gray-900">{{ item.name }}</div>
              <div class="text-[11px] text-gray-400">{{ item.affiliation }}</div>
            </td>
            <td class="py-3 px-4 font-bold text-lg">{{ item.netPay.toLocaleString() }}원</td>
            <td class="py-3 px-4">
              <span class="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{{
                item.bank
              }}</span>
              <span class="ml-2 font-mono text-gray-600">{{ item.account }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
