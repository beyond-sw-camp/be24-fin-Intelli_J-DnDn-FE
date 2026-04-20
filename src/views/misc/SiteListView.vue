<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteStore } from '@/stores/siteStore'

const router = useRouter()
const siteStore = useSiteStore()

const searchQuery = ref('')
const currentTab = ref('All Sites')
const showRightPanel = ref(false)
const panelMode = ref('detail') // 'detail', 'register', 'edit'
const selectedSite = ref(null)

// [hq_site_001] 신규 현장 폼
const newSite = ref({
  name: '',
  code: '',
  type: '',
  startDate: '',
  endDate: '',
  address: '',
  manager: '',
  initialPartners: '',
})

// 상단 요약 카드 데이터
const summary = computed(() => {
  const total = siteStore.sites.length
  const active = siteStore.sites.filter((s) => s.status === '운영 중').length
  const pending = siteStore.sites.filter((s) => s.status === '시작 전').length
  return { total, active, pending }
})

// [hq_site_002] 목록 필터링 및 검색
const filteredSites = computed(() => {
  let result = siteStore.sites
  if (currentTab.value !== 'All Sites') {
    result = result.filter((s) => currentTab.value.includes(s.status))
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.manager.toLowerCase().includes(q),
    )
  }
  return result.sort((a, b) => (a.status === '운영 중' && b.status !== '운영 중' ? -1 : 1))
})

const openDetail = (site) => {
  selectedSite.value = { ...site }
  panelMode.value = 'detail'
  showRightPanel.value = true
}

const openRegister = () => {
  panelMode.value = 'register'
  showRightPanel.value = true
}

// [hq_site_001] 현장 등록
const registerSite = () => {
  if (!newSite.value.name || !newSite.value.code || !newSite.value.address) {
    alert('필수 정보를 모두 입력해주세요.')
    return
  }
  const addedSite = {
    id: newSite.value.code,
    name: newSite.value.name,
    address: newSite.value.address,
    period: `${newSite.value.startDate} ~ ${newSite.value.endDate}`,
    manager: newSite.value.manager || '미정',
    managerPhone: '010-0000-0000',
    partners: newSite.value.initialPartners ? newSite.value.initialPartners.split(',').length : 0,
    currentWorkers: 0,
    maxWorkers: 0,
    status: '시작 전',
    statusCode: 'pending',
  }
  siteStore.addSite(addedSite)
  alert('현장이 성공적으로 등록되었습니다.')
  showRightPanel.value = false
  openDetail(addedSite)
}

// [hq_site_004] 정보 수정 저장
const saveEdit = () => {
  const index = siteStore.sites.findIndex((s) => s.id === selectedSite.value.id)
  if (index !== -1) {
    siteStore.sites[index] = { ...selectedSite.value }
    alert('현장 정보가 수정되었습니다.')
    panelMode.value = 'detail'
  }
}
</script>

<template>
  <div class="h-full bg-white font-sans text-gray-800 flex gap-6 pb-10">
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-300">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
          현장 관리 <span class="text-gray-400 text-sm font-normal ml-2">Sites</span>
        </h1>
        <div class="flex gap-3">
          <div class="relative w-64">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="현장명, 주소 검색"
              class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/50"
            />
          </div>
          <button
            @click="() => alert('엑셀 다운로드 완료')"
            class="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white">
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm font-semibold text-gray-500">전체 등록 현장</p>
            <span class="text-gray-300">•••</span>
          </div>
          <div class="flex items-end justify-between">
            <span class="text-3xl font-bold text-gray-900"
              >{{ summary.total
              }}<span class="text-sm font-normal text-gray-500 ml-1">곳</span></span
            >
            <span class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded"
              >100%</span
            >
          </div>
        </div>
        <div class="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white">
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm font-semibold text-gray-500">운영 중인 현장</p>
            <span class="text-gray-300">•••</span>
          </div>
          <div class="flex items-end justify-between">
            <span class="text-3xl font-bold text-gray-900"
              >{{ summary.active
              }}<span class="text-sm font-normal text-gray-500 ml-1">곳</span></span
            >
            <span class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded"
              >진행 중</span
            >
          </div>
        </div>
        <div class="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white">
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm font-semibold text-gray-500">시작 전 / 대기</p>
            <span class="text-gray-300">•••</span>
          </div>
          <div class="flex items-end justify-between">
            <span class="text-3xl font-bold text-gray-900"
              >{{ summary.pending
              }}<span class="text-sm font-normal text-gray-500 ml-1">곳</span></span
            >
            <span class="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded"
              >투입 대기</span
            >
          </div>
        </div>
      </div>

      <div
        class="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col"
      >
        <div class="flex justify-between items-center p-4 border-b border-gray-100">
          <div class="flex gap-6 text-sm font-medium">
            <button
              @click="currentTab = 'All Sites'"
              :class="
                currentTab === 'All Sites'
                  ? 'text-gray-900 font-bold border-b-2 border-gray-900 pb-1'
                  : 'text-gray-400'
              "
            >
              All Sites
            </button>
            <button
              @click="currentTab = 'Active (운영 중)'"
              :class="
                currentTab === 'Active (운영 중)'
                  ? 'text-gray-900 font-bold border-b-2 border-gray-900 pb-1'
                  : 'text-gray-400'
              "
            >
              Active (운영 중)
            </button>
          </div>
          <div class="flex gap-2">
            <button
              class="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold"
            >
              Filter ▾
            </button>
            <button
              @click="openRegister"
              class="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              + 신규 현장
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="text-gray-400 bg-gray-50/50 text-xs uppercase tracking-wider">
              <tr>
                <th class="py-3 px-6 font-semibold">
                  현장명 <span class="ml-1 text-[9px]">↕</span>
                </th>
                <th class="py-3 px-6 font-semibold">공사 기간</th>
                <th class="py-3 px-6 font-semibold">책임자</th>
                <th class="py-3 px-6 font-semibold">투입 인원</th>
                <th class="py-3 px-6 font-semibold text-center">상태</th>
              </tr>
            </thead>
            <tbody class="text-gray-700">
              <tr
                v-for="site in filteredSites"
                :key="site.id"
                @click="openDetail(site)"
                class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition"
              >
                <td class="py-4 px-6">
                  <div class="font-bold text-gray-900">{{ site.name }}</div>
                  <div class="text-[11px] text-gray-400">{{ site.id }}</div>
                </td>
                <td class="py-4 px-6 text-gray-500">{{ site.period }}</td>
                <td class="py-4 px-6 font-medium">{{ site.manager }}</td>
                <td class="py-4 px-6 font-semibold text-gray-900">
                  {{ site.currentWorkers }}
                  <span class="text-xs text-gray-400 font-normal ml-1"
                    >/ {{ site.maxWorkers }}명</span
                  >
                </td>
                <td class="py-4 px-6 text-center">
                  <span
                    class="px-2.5 py-1 rounded-md text-[11px] font-bold"
                    :class="
                      site.status === '운영 중'
                        ? 'bg-emerald-50 text-emerald-600'
                        : site.status === '마감 필요'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-orange-50 text-orange-600'
                    "
                  >
                    {{ site.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <aside
      v-if="showRightPanel"
      class="w-[380px] bg-white border border-gray-100 rounded-2xl shadow-lg flex flex-col shrink-0 animate-[slideIn_0.3s_ease-out]"
    >
      <div class="p-5 border-b border-gray-100 flex justify-between items-center">
        <h2 class="font-bold text-gray-900 text-lg">
          {{
            panelMode === 'detail'
              ? '현장 상세 정보'
              : panelMode === 'register'
                ? '신규 현장 등록'
                : '현장 정보 수정'
          }}
        </h2>
        <button
          @click="showRightPanel = false"
          class="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-md"
        >
          ✕
        </button>
      </div>

      <div
        v-if="panelMode === 'detail' && selectedSite"
        class="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-hide"
      >
        <div class="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div
            class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold"
          >
            🏢
          </div>
          <div>
            <p class="text-[11px] text-gray-400 font-mono">{{ selectedSite.id }}</p>
            <p class="font-bold text-gray-900 text-sm">{{ selectedSite.name }}</p>
          </div>
        </div>

        <div class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <p class="text-[10px] text-gray-400 uppercase font-bold mb-1">책임자</p>
              <p class="font-semibold text-gray-800">{{ selectedSite.manager }}</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <p class="text-[10px] text-gray-400 uppercase font-bold mb-1">협력사 수</p>
              <p class="font-semibold text-gray-800">{{ selectedSite.partners }}개</p>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p class="text-[10px] text-gray-400 uppercase font-bold mb-1">공사 기간</p>
            <p class="font-semibold text-gray-800">{{ selectedSite.period }}</p>
          </div>
          <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p class="text-[10px] text-gray-400 uppercase font-bold mb-1">현장 주소</p>
            <p class="font-semibold text-gray-800">{{ selectedSite.address }}</p>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-100">
          <button
            @click="panelMode = 'edit'"
            class="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-100 mb-2 transition"
          >
            정보 수정
          </button>
          <button
            @click="$router.push(`/hr/sites/${selectedSite.id}`)"
            class="w-full py-2.5 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 transition"
          >
            상세 대시보드 열기
          </button>
        </div>
      </div>

      <div v-else class="p-6 overflow-y-auto flex-1 space-y-4 scrollbar-hide text-sm">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">현장명</label>
          <input
            v-if="panelMode === 'register'"
            v-model="newSite.name"
            type="text"
            class="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900"
          />
          <input
            v-else
            v-model="selectedSite.name"
            type="text"
            class="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900"
          />
        </div>
        <div v-if="panelMode === 'register'">
          <label class="block text-xs font-bold text-gray-500 mb-1">현장 코드</label>
          <input
            v-model="newSite.code"
            type="text"
            class="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">현장 주소</label>
          <input
            v-if="panelMode === 'register'"
            v-model="newSite.address"
            type="text"
            class="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900"
          />
          <input
            v-else
            v-model="selectedSite.address"
            type="text"
            class="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">담당 현장 관리자</label>
          <input
            v-if="panelMode === 'register'"
            v-model="newSite.manager"
            type="text"
            placeholder="계정 자동 생성"
            class="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900"
          />
          <input
            v-else
            v-model="selectedSite.manager"
            type="text"
            class="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900"
          />
        </div>
        <div v-if="panelMode === 'edit'">
          <label class="block text-xs font-bold text-gray-500 mb-1">운영 상태</label>
          <select
            v-model="selectedSite.status"
            class="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900"
          >
            <option>운영 중</option>
            <option>시작 전</option>
            <option>마감 필요</option>
          </select>
        </div>

        <div class="pt-6">
          <button
            v-if="panelMode === 'register'"
            @click="registerSite"
            class="w-full py-3 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 transition"
          >
            등록 완료
          </button>
          <button
            v-if="panelMode === 'edit'"
            @click="saveEdit"
            class="w-full py-3 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 transition"
          >
            수정 내역 저장
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
