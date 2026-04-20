<script setup>
import { ref } from 'vue'

const selectedMonth = ref('2025-10')
const searchName = ref('')
const selectedWorker = ref(null)

const workers = ref([
  {
    id: 1,
    name: '김동석',
    affiliation: '태양건설',
    trade: '형틀목수',
    base: 5390000,
    risk: 100000,
    overtime: 230000,
    total: 5720000,
    tax: 85000,
    localTax: 8500,
    insurance: 91500,
    net: 5535000,
  },
  {
    id: 2,
    name: '이목수',
    affiliation: '인력사무소',
    trade: '보통인부',
    base: 3300000,
    risk: 0,
    overtime: 0,
    total: 3300000,
    tax: 45000,
    localTax: 4500,
    insurance: 60500,
    net: 3190000,
  },
])

const selectWorker = (worker) => (selectedWorker.value = worker)
</script>

<template>
  <div class="h-full font-sans text-[#2D3748] flex flex-col pb-10">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">급여 명세서 조회 및 발급</h1>
    </div>

    <div class="grid grid-cols-12 gap-6 flex-1 h-full min-h-[600px]">
      <div
        class="col-span-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col"
      >
        <div class="flex gap-2 mb-4">
          <input
            v-model="selectedMonth"
            type="month"
            class="w-1/3 p-2 border border-gray-200 rounded-lg text-sm"
          />
          <input
            v-model="searchName"
            type="text"
            placeholder="이름 검색"
            class="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div class="overflow-y-auto flex-1 space-y-2">
          <div
            v-for="w in workers"
            :key="w.id"
            @click="selectWorker(w)"
            class="p-3 border rounded-xl cursor-pointer transition"
            :class="
              selectedWorker?.id === w.id
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-100 hover:bg-gray-50'
            "
          >
            <p class="font-bold text-gray-900">
              {{ w.name }}
              <span class="text-xs text-gray-400 font-normal ml-1">{{ w.affiliation }}</span>
            </p>
          </div>
        </div>
      </div>

      <div
        class="col-span-8 bg-gray-50/50 border border-gray-100 rounded-2xl p-8 shadow-inner relative flex flex-col"
      >
        <div
          v-if="selectedWorker"
          class="bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-2xl mx-auto w-full"
        >
          <div class="text-center border-b-2 border-gray-900 pb-4 mb-6">
            <h2 class="text-2xl font-bold">
              {{ selectedMonth.split('-')[0] }}년 {{ selectedMonth.split('-')[1] }}월 급여 명세서
            </h2>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div class="flex justify-between border-b border-gray-100 pb-2">
              <span class="text-gray-500">성명</span
              ><span class="font-bold">{{ selectedWorker.name }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-100 pb-2">
              <span class="text-gray-500">소속</span
              ><span class="font-bold">{{ selectedWorker.affiliation }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-100 pb-2">
              <span class="text-gray-500">직종</span
              ><span class="font-bold">{{ selectedWorker.trade }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-100 pb-2">
              <span class="text-gray-500">근무 날짜</span
              ><span class="font-bold">{{ selectedMonth }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <h3 class="font-bold text-blue-600 border-b border-blue-200 pb-2 mb-3">지급 내역</h3>
              <div class="space-y-2">
                <div class="flex justify-between text-gray-600">
                  <span>기본급</span><span>{{ selectedWorker.base.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>위험수당</span><span>{{ selectedWorker.risk.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>연장수당</span><span>{{ selectedWorker.overtime.toLocaleString() }}</span>
                </div>
                <div
                  class="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2"
                >
                  <span>지급 총액</span><span>{{ selectedWorker.total.toLocaleString() }}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 class="font-bold text-red-500 border-b border-red-200 pb-2 mb-3">공제 내역</h3>
              <div class="space-y-2">
                <div class="flex justify-between text-gray-600">
                  <span>소득세</span><span>{{ selectedWorker.tax.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>지방소득세</span><span>{{ selectedWorker.localTax.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>4대보험</span><span>{{ selectedWorker.insurance.toLocaleString() }}</span>
                </div>
                <div
                  class="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2"
                >
                  <span>공제 총액</span
                  ><span>{{
                    (
                      selectedWorker.tax +
                      selectedWorker.localTax +
                      selectedWorker.insurance
                    ).toLocaleString()
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg flex justify-between items-center text-lg">
            <span class="font-bold text-gray-700">실 지급액</span>
            <span class="font-bold text-blue-700"
              >{{ selectedWorker.net.toLocaleString() }} 원</span
            >
          </div>

          <div class="flex gap-3 mt-8">
            <button
              class="flex-1 py-3 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50"
            >
              PDF 저장
            </button>
            <button
              class="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              이메일 발송
            </button>
          </div>
        </div>
        <div v-else class="flex items-center justify-center h-full text-gray-400">
          좌측에서 작업자를 선택해주세요.
        </div>
      </div>
    </div>
  </div>
</template>
