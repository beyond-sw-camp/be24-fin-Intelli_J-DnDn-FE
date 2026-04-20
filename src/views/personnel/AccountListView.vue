<script setup>
import { ref } from 'vue'

const AUTH_SUPER = '최고 관리자'
const AUTH_SITE_LEAD = '총 책임자'

const UI = {
  title: '계정 관리',
  subtitlePrefix: '권한은 ',
  subtitleMid: '와 ',
  subtitleSuffix: ' 두 가지만 부여할 수 있습니다.',
  newAccount: '+ 새 계정 생성',
  colName: '이름',
  colEmail: '이메일 (ID)',
  colSite: '담당 현장',
  colAuth: '권한',
  colManage: '관리',
  edit: '수정',
  del: '삭제',
  cancel: '취소',
  saveEdit: '수정 사항 저장',
  saveCreate: '계정 생성 완료',
}

const showDrawer = ref(false)
const isEdit = ref(false)

const form = ref({ name: '', email: '', password: '', site: '', auth: '' })
const accounts = ref([
  {
    id: 1,
    name: '김철수',
    email: 'chulsu@conwork.com',
    site: '-',
    auth: AUTH_SUPER,
  },
  {
    id: 2,
    name: '이영희',
    email: 'young@conwork.com',
    site: '판교 데이터센터',
    auth: AUTH_SITE_LEAD,
  },
])

const openAdd = () => {
  isEdit.value = false
  form.value = { name: '', email: '', password: '', site: '', auth: AUTH_SITE_LEAD }
  showDrawer.value = true
}
const openEdit = (item) => {
  isEdit.value = true
  form.value = { ...item, password: '****' }
  showDrawer.value = true
}
const save = () => {
  showDrawer.value = false
  alert(isEdit.value ? '계정이 수정되었습니다.' : '계정이 생성되었습니다.')
}
const deleteAccount = (id) => {
  if (confirm('이 계정을 완전히 삭제하시겠습니까?'))
    alert('삭제 완료')
}

function onAuthChange() {
  if (form.value.auth === AUTH_SUPER) form.value.site = '-'
}
</script>

<template>
  <div class="relative flex h-full flex-col pb-10 font-sans text-[#2D3748]">
    <div class="mb-6 flex items-end justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ UI.title }}</h1>
               <p class="mt-1 text-sm text-gray-400">
          {{ UI.subtitlePrefix }}{{ AUTH_SUPER }}{{ UI.subtitleMid }}{{ AUTH_SITE_LEAD }}{{ UI.subtitleSuffix }}
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-[#546272] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#43505e]"
        @click="openAdd"
      >
        {{ UI.newAccount }}
      </button>
    </div>

    <div class="flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table class="w-full table-fixed text-left text-sm whitespace-nowrap">
        <thead class="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase text-gray-400">
          <tr>
            <th class="px-6 py-4">{{ UI.colName }}</th>
            <th class="px-6 py-4">{{ UI.colEmail }}</th>
            <th class="px-6 py-4">{{ UI.colSite }}</th>
            <th class="px-6 py-4">{{ UI.colAuth }}</th>
            <th class="px-6 py-4 text-center">{{ UI.colManage }}</th>
          </tr>
        </thead>
        <tbody class="text-gray-700">
          <tr
            v-for="acc in accounts"
            :key="acc.id"
            class="border-b border-gray-50 hover:bg-gray-50"
          >
            <td class="px-6 py-4 font-bold text-gray-900">{{ acc.name }}</td>
            <td class="px-6 py-4">{{ acc.email }}</td>
            <td class="px-6 py-4">{{ acc.site }}</td>
            <td class="px-6 py-4">
              <span class="rounded bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600">{{
                acc.auth
              }}</span>
            </td>
            <td class="flex justify-center gap-2 px-6 py-4 text-center">
              <button
                type="button"
                class="rounded border border-gray-200 px-3 py-1 text-xs font-bold hover:bg-gray-50"
                @click="openEdit(acc)"
              >
                {{ UI.edit }}
              </button>
              <button
                type="button"
                class="rounded bg-red-50 px-3 py-1 text-xs font-bold text-red-500 hover:bg-red-100"
                @click="deleteAccount(acc.id)"
              >
                {{ UI.del }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <aside
      v-if="showDrawer"
      class="fixed inset-y-0 right-0 z-50 flex w-[400px] animate-[slideIn_0.3s_ease-out] flex-col border-l border-gray-100 bg-white shadow-2xl"
    >
      <div class="flex justify-between border-b border-gray-100 p-5">
        <h2 class="text-lg font-bold">
          {{
            isEdit
              ? '계정 정보 수정'
              : '신규 계정 생성'
          }}
        </h2>
        <button type="button" class="text-lg font-bold leading-none text-gray-400" @click="showDrawer = false">
          &times;
        </button>
      </div>
      <div class="flex-1 space-y-5 overflow-y-auto p-6 text-sm">
        <div>
          <label class="mb-1 block text-[11px] font-bold text-gray-500">담당자 이름</label>
          <input v-model="form.name" type="text" class="w-full rounded-lg border p-2.5" />
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-bold text-gray-500">이메일 (아이디)</label>
          <input v-model="form.email" type="email" class="w-full rounded-lg border p-2.5" />
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-bold text-gray-500">{{
            isEdit ? '새 비밀번호 (선택)' : '임시 비밀번호 할당'
          }}</label>
          <input v-model="form.password" type="password" class="w-full rounded-lg border p-2.5" />
        </div>

        <div v-if="form.auth !== AUTH_SUPER" class="border-t border-gray-100 pt-2">
          <label class="mb-1 block text-[11px] font-bold text-gray-500">담당 현장 지정</label>
          <select v-model="form.site" class="w-full rounded-lg border bg-white p-2.5 text-gray-700">
            <option value="강남구 재건축 A공구">
              강남구 재건축 A공구
            </option>
            <option value="판교 데이터센터">판교 데이터센터</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-[11px] font-bold text-gray-500">권한</label>
          <select
            v-model="form.auth"
            class="w-full rounded-lg border bg-white p-2.5 text-gray-700"
            @change="onAuthChange"
          >
            <option :value="AUTH_SUPER">{{ AUTH_SUPER }}</option>
            <option :value="AUTH_SITE_LEAD">{{ AUTH_SITE_LEAD }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2 border-t border-gray-100 bg-gray-50 p-6">
        <button
          type="button"
          class="flex-1 rounded-lg border bg-white py-2.5 font-bold text-gray-600"
          @click="showDrawer = false"
        >
          {{ UI.cancel }}
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg bg-[#546272] py-2.5 font-bold text-white"
          @click="save"
        >
          {{ isEdit ? UI.saveEdit : UI.saveCreate }}
        </button>
      </div>
    </aside>
  </div>
</template>
