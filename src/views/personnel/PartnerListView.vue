<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Handshake,
  Search,
  Download,
  Plus,
  X,
  FileText,
  Loader2,
  Building2,
  AlertTriangle,
  CircleCheck,
} from 'lucide-vue-next'

const router = useRouter()

const T = {
  kicker: '협력 네트워크',
  title: '협력사 관리',
  desc: '협력사 정보, 계약 기간, 평가를 한 화면에서 조회하고 신규 등록을 진행합니다.',
  searchPh: '협력사명, 공종 검색',
  excel: '엑셀 다운로드',
  register: '신규 협력사 등록',
  statTotal: '총 협력사',
  statActive: '계약 유지',
  statExpiring: '만료 예정',
  statExpiringHint: '30일 이내',
  unit: '개사',
  tabAll: '전체',
  tabActive: '계약 유지',
  tabExpiring: '만료 예정',
  tabEnded: '계약 종료',
  colName: '협력사명',
  colTrade: '공종 / 대표자',
  colPeriod: '계약 기간',
  colEval: '평가',
  empty: '조건에 맞는 협력사가 없습니다.',
  drawerTitle: '신규 협력사 등록',
  aiTitle: 'AI 계약서 자동 분석',
  aiHint: 'PDF 또는 이미지 파일 업로드',
  aiLoading: '문서 분석 중...',
  labelName: '협력사명 *',
  labelBiz: '사업자 번호',
  labelRep: '대표자명',
  labelContact: '연락처',
  labelTrade: '담당 공종 *',
  labelUnit: '계약 단가 (원)',
  labelStart: '계약 시작일 *',
  labelEnd: '계약 종료일 *',
  submit: '등록 완료',
  alertFields: '필수 정보를 모두 입력해주세요.',
  alertAi:
    'AI 문서 인식이 완료되었습니다. 추출된 데이터를 확인해주세요.',
  alertOk: '협력사가 등록되었습니다.',
  alertExcel:
    '협력사 리스트 엑셀 다운로드를 시작합니다.',
}

const showRegisterDrawer = ref(false)
const searchQuery = ref('')
const currentTab = ref(T.tabAll)
const tabs = [T.tabAll, T.tabActive, T.tabExpiring, T.tabEnded]
const isParsing = ref(false)

const newPartner = ref({
  name: '',
  bizNumber: '',
  repName: '',
  trade: '',
  contact: '',
  startDate: '',
  endDate: '',
  unitPrice: '',
})

const partners = ref([
  {
    name: '태양건설',
    repName: '김태양',
    trade: '형틀',
    workers: 45,
    unitPrice: '250,000',
    period: '2024.01.01 ~ 2025.12.31',
    status: '계약 유지',
    evaluation: 'A · 92점',
  },
  {
    name: '우주산업',
    repName: '박우주',
    trade: '철근',
    workers: 32,
    unitPrice: '260,000',
    period: '2023.05.01 ~ 2024.05.15',
    status: '만료 예정',
    evaluation: 'B+ · 81점',
  },
  {
    name: '제일환경',
    repName: '이환경',
    trade: '비계',
    workers: 18,
    unitPrice: '230,000',
    period: '2024.03.01 ~ 2026.02.28',
    status: '계약 유지',
    evaluation: 'A · 89점',
  },
])

const summary = computed(() => ({
  total: partners.value.length,
  active: partners.value.filter((p) => p.status === '계약 유지').length,
  expiring: partners.value.filter((p) => p.status === '만료 예정').length,
}))

const filteredPartners = computed(() => {
  let result = partners.value

  if (currentTab.value !== T.tabAll) {
    result = result.filter((p) => p.status === currentTab.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.trade.toLowerCase().includes(q) ||
        p.repName.toLowerCase().includes(q),
    )
  }

  return result.sort((a, b) =>
    a.status === '만료 예정' && b.status !== '만료 예정' ? -1 : 1,
  )
})

const goToDetail = (id) => {
  router.push(`/hr/partners/${id}`)
}

const downloadExcel = () => {
  alert(T.alertExcel)
}

const handleFileUpload = (e) => {
  if (!e.target.files[0]) return
  isParsing.value = true

  setTimeout(() => {
    newPartner.value = {
      name: '스마트안전(주)',
      bizNumber: '123-45-67890',
      repName: '최스마트',
      trade: '전기',
      contact: '010-9999-8888',
      startDate: '2024-05-01',
      endDate: '2025-04-30',
      unitPrice: '240,000',
    }
    isParsing.value = false
    alert(T.alertAi)
  }, 1500)
}

const registerPartner = () => {
  if (
    !newPartner.value.name ||
    !newPartner.value.trade ||
    !newPartner.value.startDate ||
    !newPartner.value.endDate
  ) {
    alert(T.alertFields)
    return
  }
  partners.value.unshift({
    id: `PTN-00${partners.value.length + 1}`,
    name: newPartner.value.name,
    repName: newPartner.value.repName,
    trade: newPartner.value.trade,
    contact: newPartner.value.contact,
    workers: 0,
    unitPrice: newPartner.value.unitPrice,
    period: `${newPartner.value.startDate.replace(/-/g, '.')} ~ ${newPartner.value.endDate.replace(/-/g, '.')}`,
    status: '계약 유지',
    evaluation: '-',
  })

  alert(T.alertOk)
  showRegisterDrawer.value = false

  newPartner.value = {
    name: '',
    bizNumber: '',
    repName: '',
    trade: '',
    contact: '',
    startDate: '',
    endDate: '',
    unitPrice: '',
  }
}

const statusBadgeClass = (status) => {
  if (status === '만료 예정')
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80'
  if (status === '계약 종료')
    return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
  return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
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
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-wrap items-start gap-4">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
          >
            <Handshake class="h-5 w-5" />
          </span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">
              {{ T.kicker }}
            </p>
            <h2 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.title }}</h2>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <div class="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flare-500/80"
            />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="T.searchPh"
              class="w-full rounded-xl border border-forena-200 bg-white py-2.5 pr-4 pl-9 text-sm text-forena-900 outline-none transition placeholder:text-slate-400 focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
            />
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-forena-200 bg-white px-4 py-2.5 text-sm font-bold text-forena-700 shadow-sm transition hover:bg-forena-50"
            @click="downloadExcel"
          >
            <Download class="h-4 w-4 text-flare-600" />
            {{ T.excel }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
            @click="showRegisterDrawer = true"
          >
            <Plus class="h-4 w-4" />
            {{ T.register }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <article class="rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <Building2 class="h-4 w-4 text-flare-600" />
          {{ T.statTotal }}
        </div>
        <p class="mt-3 text-3xl font-light tabular-nums text-forena-900">
          {{ summary.total
          }}<span class="ml-1 text-sm font-normal text-slate-500">{{ T.unit }}</span>
        </p>
      </article>
      <article class="rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <CircleCheck class="h-4 w-4 text-emerald-600" />
          {{ T.statActive }}
        </div>
        <p class="mt-3 text-3xl font-light tabular-nums text-emerald-800">
          {{ summary.active
          }}<span class="ml-1 text-sm font-normal text-emerald-600/80">{{ T.unit }}</span>
        </p>
      </article>
      <article
        class="rounded-2xl border border-rose-100/90 bg-gradient-to-br from-rose-50/40 to-white p-5 shadow-card"
      >
        <div class="flex items-center gap-2 text-sm font-semibold text-rose-800">
          <AlertTriangle class="h-4 w-4 shrink-0" />
          {{ T.statExpiring }}
        </div>
        <div class="mt-3 flex items-end justify-between gap-2">
          <p class="text-3xl font-light tabular-nums text-rose-700">
            {{ summary.expiring
            }}<span class="ml-1 text-sm font-normal text-rose-500">{{ T.unit }}</span>
          </p>
          <span class="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700">{{
            T.statExpiringHint
          }}</span>
        </div>
      </article>
    </div>

    <div
      class="flex flex-col overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card"
    >
      <div
        class="flex flex-col gap-3 border-b border-forena-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            class="relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition"
            :class="
              currentTab === tab
                ? 'bg-flare-50 font-bold text-forena-900 ring-1 ring-flare-200/80'
                : 'text-slate-500 hover:bg-forena-50/80 hover:text-forena-800'
            "
            @click="currentTab = tab"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm whitespace-nowrap">
          <thead
            class="border-b border-forena-100 bg-forena-50/60 text-[11px] font-bold uppercase tracking-wider text-forena-500"
          >
            <tr>
              <th class="px-6 py-4 font-semibold">{{ T.colName }}</th>
              <th class="px-6 py-4 font-semibold">{{ T.colTrade }}</th>
              <th class="px-6 py-4 font-semibold">{{ T.colPeriod }}</th>
              <th class="px-6 py-4 text-center font-semibold">{{ T.colEval }}</th>
            </tr>
          </thead>
          <tbody class="text-forena-800">
            <tr v-if="filteredPartners.length === 0">
              <td colspan="4" class="px-6 py-14 text-center text-sm text-slate-400">
                {{ T.empty }}
              </td>
            </tr>
            <tr
              v-else
              v-for="partner in filteredPartners"
              :key="partner.id"
              class="cursor-pointer border-b border-forena-50 transition hover:bg-flare-50/40"
              @click="goToDetail(partner.id)"
            >
              <td class="px-6 py-4">
                <div class="font-semibold text-forena-900">{{ partner.name }}</div>
                <div class="text-[11px] text-slate-500">{{ partner.id }}</div>
              </td>
              <td class="px-6 py-4">
                <span class="font-semibold text-forena-800">{{ partner.trade }}</span>
                <span class="ml-2 text-xs text-slate-500">| {{ partner.repName }}</span>
              </td>
              <td class="px-6 py-4 text-xs text-slate-600">{{ partner.period }}</td>
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex rounded-lg bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-forena-800 ring-1 ring-flare-200/70"
                >
                  {{ partner.evaluation }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showRegisterDrawer"
        class="fixed inset-0 z-50 flex justify-end bg-forena-900/20 backdrop-blur-[2px]"
        @click.self="showRegisterDrawer = false"
      >
        <aside
          class="flex h-full w-full max-w-md flex-col border-l border-forena-100 bg-white shadow-2xl animate-[drawerIn_0.25s_ease-out]"
          @click.stop
        >
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-4"
          >
            <h2 class="text-lg font-bold text-forena-900">{{ T.drawerTitle }}</h2>
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-400 transition hover:text-forena-700"
              @click="showRegisterDrawer = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-6 text-sm">
            <div
              class="relative rounded-xl border-2 border-dashed border-forena-200 p-6 text-center transition hover:border-flare-400/60"
              :class="{ 'pointer-events-none opacity-60': isParsing }"
            >
              <input
                type="file"
                class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                accept=".pdf,image/*"
                @change="handleFileUpload"
              />
              <template v-if="!isParsing">
                <FileText class="mx-auto mb-2 h-8 w-8 text-flare-600" />
                <p class="font-bold text-forena-900">{{ T.aiTitle }}</p>
                <p class="mt-1 text-[11px] text-slate-500">{{ T.aiHint }}</p>
              </template>
              <div v-else class="py-2">
                <Loader2 class="mx-auto mb-2 h-7 w-7 animate-spin text-forena-700" />
                <p class="text-xs font-bold text-forena-800">{{ T.aiLoading }}</p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelName
                  }}</label>
                  <input
                    v-model="newPartner.name"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelBiz
                  }}</label>
                  <input
                    v-model="newPartner.bizNumber"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelRep
                  }}</label>
                  <input
                    v-model="newPartner.repName"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelContact
                  }}</label>
                  <input
                    v-model="newPartner.contact"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelTrade
                  }}</label>
                  <input
                    v-model="newPartner.trade"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelUnit
                  }}</label>
                  <input
                    v-model="newPartner.unitPrice"
                    type="text"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelStart
                  }}</label>
                  <input
                    v-model="newPartner.startDate"
                    type="date"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{
                    T.labelEnd
                  }}</label>
                  <input
                    v-model="newPartner.endDate"
                    type="date"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              class="w-full rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 py-3 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
              @click="registerPartner"
            >
              {{ T.submit }}
            </button>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes drawerIn {
  from {
    transform: translateX(100%);
    opacity: 0.96;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
