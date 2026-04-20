<script setup>
import { ref } from 'vue'

const showForm = ref(false)
const isEdit = ref(false)

const form = ref({ trade: '', grade: '', rate: '', startDate: '' })
const standards = ref([
  { id: 1, trade: '형틀목수', grade: '기공', rate: 250000, startDate: '2025-01-01' },
  { id: 2, trade: '철근공', grade: '기공', rate: 260000, startDate: '2025-01-01' },
  { id: 3, trade: '보통인부', grade: '일반', rate: 180000, startDate: '2024-06-01' },
])

const openAdd = () => {
  isEdit.value = false
  form.value = { trade: '', grade: '', rate: '', startDate: '' }
  showForm.value = true
}
const openEdit = (item) => {
  isEdit.value = true
  form.value = { ...item }
  showForm.value = true
}
const save = () => {
  showForm.value = false
  alert('단가 기준이 저장되었습니다.')
}
</script>

<template>
  <div class="h-full font-sans text-[#2D3748] flex flex-col pb-10 relative">
    <div class="mb-6 flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">급여 기준(단가) 설정</h1>
      </div>
      <button
        @click="openAdd"
        class="px-4 py-2 bg-[#546272] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#43505e]"
      >
        + 새 단가 항목 추가
      </button>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6">
      <div
        class="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm"
      >
        <p class="text-sm font-bold text-blue-600 mb-1">형틀목수 (기공) 평균</p>
        <div class="flex justify-between items-end">
          <span class="text-3xl font-bold text-gray-900"
            >250,000<span class="text-sm font-normal text-gray-500 ml-1">원</span></span
          >
          <span class="text-xs font-bold text-red-500">↑ 15,000원 변동</span>
        </div>
      </div>
      <div
        class="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm"
      >
        <p class="text-sm font-bold text-emerald-600 mb-1">철근공 (기공) 평균</p>
        <div class="flex justify-between items-end">
          <span class="text-3xl font-bold text-gray-900"
            >260,000<span class="text-sm font-normal text-gray-500 ml-1">원</span></span
          >
          <span class="text-xs font-bold text-red-500">↑ 10,000원 변동</span>
        </div>
      </div>
    </div>

    <div class="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full text-left text-sm whitespace-nowrap">
        <thead
          class="bg-gray-50/50 text-xs text-gray-400 uppercase font-bold border-b border-gray-100"
        >
          <tr>
            <th class="py-4 px-6">직종 / 분류</th>
            <th class="py-4 px-6">등급</th>
            <th class="py-4 px-6">기본 단가 (정공수 기준)</th>
            <th class="py-4 px-6">적용 시작일</th>
            <th class="py-4 px-6 text-center">관리</th>
          </tr>
        </thead>
        <tbody class="text-gray-700">
          <tr v-for="item in standards" :key="item.id" class="border-b border-gray-50">
            <td class="py-4 px-6 font-bold text-gray-900">{{ item.trade }}</td>
            <td class="py-4 px-6 font-semibold">{{ item.grade }}</td>
            <td class="py-4 px-6 font-mono text-blue-600">{{ item.rate.toLocaleString() }}원</td>
            <td class="py-4 px-6">{{ item.startDate }}</td>
            <td class="py-4 px-6 text-center">
              <button
                @click="openEdit(item)"
                class="px-3 py-1.5 border border-gray-200 rounded text-xs font-bold hover:bg-gray-50"
              >
                수정
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <aside
      v-if="showForm"
      class="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl flex flex-col z-50 animate-[slideIn_0.3s_ease-out] border-l border-gray-100"
    >
      <div class="p-5 border-b border-gray-100 flex justify-between">
        <h2 class="font-bold text-lg">{{ isEdit ? '단가 수정' : '새 단가 추가' }}</h2>
        <button @click="showForm = false" class="text-gray-400 font-bold">✕</button>
      </div>
      <div class="p-6 space-y-4 flex-1 text-sm">
        <div>
          <label class="block text-[11px] font-bold text-gray-500 mb-1">직종/분류</label
          ><input v-model="form.trade" type="text" class="w-full p-2.5 border rounded-lg" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-gray-500 mb-1">등급</label
          ><input v-model="form.grade" type="text" class="w-full p-2.5 border rounded-lg" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-gray-500 mb-1">기본 단가</label
          ><input v-model="form.rate" type="number" class="w-full p-2.5 border rounded-lg" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-gray-500 mb-1">적용 시작일</label
          ><input v-model="form.startDate" type="date" class="w-full p-2.5 border rounded-lg" />
        </div>
      </div>
      <div class="p-6 border-t border-gray-100 bg-gray-50 flex gap-2">
        <button @click="showForm = false" class="flex-1 py-2.5 border rounded-lg bg-white">
          취소
        </button>
        <button @click="save" class="flex-1 py-2.5 bg-gray-900 text-white rounded-lg">저장</button>
      </div>
    </aside>
  </div>
</template>
