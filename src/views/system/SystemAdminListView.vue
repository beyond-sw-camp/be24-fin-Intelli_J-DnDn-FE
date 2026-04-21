<script setup>
import { computed, ref } from 'vue'
import {
  Building2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-vue-next'

const activeTab = ref('accounts')
const accountSearchField = ref('아이디')
const accountSearchKeyword = ref('')
const siteSearchKeyword = ref('')
const showAccountDrawer = ref(false)
const showRoleDrawer = ref(false)
const showSiteDrawer = ref(false)
const editingAdmin = ref(null)
const editingSite = ref(null)

const tabs = [
  { key: 'accounts', label: '계정 관리' },
  { key: 'sites', label: '현장 관리' },
]
const accountSearchFields = ['아이디', '이름', '권한', '현장', '전화번호', '이메일']

const sites = ref([
  {
    id: 1,
    name: '강남 오피스 신축 1공구',
    region: '서울 강남구',
    client: '본사 시설관리팀',
    constructionType: '신축 공사',
    startDate: '2024-01-15',
    endDate: '2025-06-30',
    status: '진행중',
    createdAt: '2023-12-01',
  },
  {
    id: 2,
    name: '판교 데이터센터 증축',
    region: '경기 성남시',
    client: '본사 인프라팀',
    constructionType: '증축 공사',
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    status: '진행중',
    createdAt: '2024-01-10',
  },
])

const adminForm = ref({
  role: '현장 관리자',
  siteId: 1,
  name: '',
  userId: '',
  phone: '',
  email: '',
  status: '정상',
})

const siteForm = ref({
  name: '',
  region: '',
  client: '',
  constructionType: '',
  startDate: '',
  endDate: '',
  status: '진행중',
})

const admins = ref([
  {
    id: 1,
    role: '시스템 관리자',
    siteId: null,
    name: '김미화',
    userId: 'kimlmy595',
    phone: '01012345678',
    email: 'onlinesupport@ximhay.com',
    status: '정상',
    updatedAt: '2023-12-08',
    updatedBy: 'kimlmy595',
    createdAt: '2023-11-09',
  },
  {
    id: 2,
    role: '현장 관리자',
    siteId: 1,
    name: '이역심',
    userId: 'evdm1',
    phone: '01012345678',
    email: 'onlinesupport@ximhay.com',
    status: '정상',
    updatedAt: '2023-12-14',
    updatedBy: 'kimlmy595',
    createdAt: '2023-12-14',
  },
  {
    id: 3,
    role: '현장 관리자',
    siteId: 2,
    name: '박역심',
    userId: 'evdm2',
    phone: '01012345678',
    email: 'onlinesupport@ximhay.com',
    status: '정상',
    updatedAt: '2023-12-14',
    updatedBy: 'kimlmy595',
    createdAt: '2023-12-14',
  },
])

const roleRules = ref([
  {
    role: '시스템 관리자',
    description: '현장 생성, 계정 생성, 계정별 현장 매칭을 포함한 전체 시스템 권한을 관리합니다.',
  },
  {
    role: '본사 관리자',
    description: '본사 기준으로 전체 현장 현황과 관리자 계정 정보를 조회합니다.',
  },
  {
    role: '현장 관리자',
    description: '매칭된 현장의 대시보드와 인력 정보만 조회하고 관리합니다.',
  },
])

const pageTitle = computed(() => (activeTab.value === 'accounts' ? '계정 관리' : '현장 관리'))

const filteredAdmins = computed(() => {
  const keyword = accountSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return admins.value

  const keyMap = {
    아이디: 'userId',
    이름: 'name',
    권한: 'role',
    전화번호: 'phone',
    이메일: 'email',
  }

  if (accountSearchField.value === '현장') {
    return admins.value.filter((admin) => getSiteName(admin.siteId).toLowerCase().includes(keyword))
  }

  const targetKey = keyMap[accountSearchField.value]
  return admins.value.filter((admin) =>
    String(admin[targetKey] || '')
      .toLowerCase()
      .includes(keyword),
  )
})

const filteredSites = computed(() => {
  const keyword = siteSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return sites.value

  return sites.value.filter((site) =>
    [site.name, site.region, site.client, site.constructionType, site.status]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(keyword)),
  )
})

const accountCountText = computed(
  () => `목록(${filteredAdmins.value.length}/${admins.value.length})`,
)
const siteCountText = computed(() => `목록(${filteredSites.value.length}/${sites.value.length})`)

function getSiteName(siteId) {
  if (!siteId) return '전체 현장'
  return sites.value.find((site) => site.id === Number(siteId))?.name || '미지정'
}

function resetAdminForm() {
  adminForm.value = {
    role: '현장 관리자',
    siteId: sites.value[0]?.id || null,
    name: '',
    userId: '',
    phone: '',
    email: '',
    status: '정상',
  }
}

function resetSiteForm() {
  siteForm.value = {
    name: '',
    region: '',
    client: '',
    constructionType: '',
    startDate: '',
    endDate: '',
    status: '진행중',
  }
}

function openCreateAccountDrawer() {
  editingAdmin.value = null
  resetAdminForm()
  showAccountDrawer.value = true
}

function openEditAccountDrawer(admin) {
  editingAdmin.value = admin.id
  adminForm.value = { ...admin }
  showAccountDrawer.value = true
}

function openCreateSiteDrawer() {
  editingSite.value = null
  resetSiteForm()
  showSiteDrawer.value = true
}

function openEditSiteDrawer(site) {
  editingSite.value = site.id
  siteForm.value = { ...site }
  showSiteDrawer.value = true
}

function saveAdmin() {
  const now = new Date().toISOString().slice(0, 10)
  const nextForm = {
    ...adminForm.value,
    siteId: adminForm.value.role === '현장 관리자' ? Number(adminForm.value.siteId) : null,
  }

  if (editingAdmin.value) {
    admins.value = admins.value.map((admin) =>
      admin.id === editingAdmin.value
        ? { ...admin, ...nextForm, updatedAt: now, updatedBy: nextForm.userId }
        : admin,
    )
  } else {
    admins.value.unshift({
      ...nextForm,
      id: Math.max(...admins.value.map((admin) => admin.id), 0) + 1,
      updatedAt: now,
      updatedBy: nextForm.userId || 'admin',
      createdAt: now,
    })
  }
  showAccountDrawer.value = false
}

function saveSite() {
  const today = new Date().toISOString().slice(0, 10)
  if (editingSite.value) {
    sites.value = sites.value.map((site) =>
      site.id === editingSite.value ? { ...site, ...siteForm.value } : site,
    )
  } else {
    sites.value.unshift({
      ...siteForm.value,
      id: Math.max(...sites.value.map((site) => site.id), 0) + 1,
      createdAt: today,
    })
  }
  showSiteDrawer.value = false
}
</script>

<template>
  <div class="space-y-5 pb-10">
    <section
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex items-start gap-4">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-forena-600 to-forena-900 text-white shadow-md"
          >
            <ShieldCheck class="h-5 w-5" />
          </span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">System</p>
            <h1 class="text-gradient-brand text-2xl font-bold tracking-tight">{{ pageTitle }}</h1>
            <p class="mt-2 text-sm text-forena-700/80">{{ pageDescription }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <template v-if="activeTab === 'accounts'">
            <div class="flex min-w-0 rounded-xl border border-forena-200 bg-white shadow-sm">
              <select
                v-model="accountSearchField"
                class="w-28 rounded-l-xl border-0 bg-forena-50 px-3 py-2.5 text-sm font-semibold text-forena-800 outline-none"
              >
                <option v-for="field in accountSearchFields" :key="field" :value="field">
                  {{ field }}
                </option>
              </select>
              <div class="relative min-w-[220px] flex-1">
                <Search
                  class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flare-500"
                />
                <input
                  v-model="accountSearchKeyword"
                  type="text"
                  class="h-full w-full rounded-r-xl border-0 py-2.5 pr-3 pl-9 text-sm text-forena-900 outline-none placeholder:text-slate-400"
                  placeholder="검색"
                />
              </div>
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-forena-200 bg-white px-4 py-2.5 text-sm font-bold text-forena-800 shadow-sm transition hover:bg-forena-50"
              @click="showRoleDrawer = true"
            >
              <Settings class="h-4 w-4 text-flare-600" />
              권한 설명
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
              @click="openCreateAccountDrawer"
            >
              <Plus class="h-4 w-4" />
              계정 추가
            </button>
          </template>

          <template v-else>
            <div
              class="relative min-w-[260px] rounded-xl border border-forena-200 bg-white shadow-sm"
            >
              <Search
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flare-500"
              />
              <input
                v-model="siteSearchKeyword"
                type="text"
                class="w-full rounded-xl border-0 py-2.5 pr-3 pl-9 text-sm text-forena-900 outline-none placeholder:text-slate-400"
                placeholder="현장명, 지역, 공사 구분 검색"
              />
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
              @click="openCreateSiteDrawer"
            >
              <Plus class="h-4 w-4" />
              현장 추가
            </button>
          </template>
        </div>
      </div>
    </section>

    <div class="flex gap-1 rounded-2xl border border-forena-100 bg-white/90 p-1 shadow-sm">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition"
        :class="
          activeTab === tab.key
            ? 'bg-forena-800 text-white shadow-sm'
            : 'text-forena-600 hover:bg-forena-50 hover:text-forena-900'
        "
        @click="activeTab = tab.key"
      >
        <ShieldCheck v-if="tab.key === 'accounts'" class="h-4 w-4" />
        <Building2 v-else class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

    <section
      v-if="activeTab === 'accounts'"
      class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card"
    >
      <div class="flex items-center justify-between border-b border-forena-100 px-5 py-4">
        <h2 class="text-sm font-bold text-forena-900">{{ accountCountText }}</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1180px] table-fixed text-left text-sm whitespace-nowrap">
          <thead
            class="border-b border-forena-100 bg-forena-50/70 text-xs font-bold text-forena-500"
          >
            <tr>
              <th class="w-14 px-4 py-4 text-center">No</th>
              <th class="w-32 px-4 py-4 text-center">권한</th>
              <th class="w-44 px-4 py-4 text-center">담당 현장</th>
              <th class="w-24 px-4 py-4 text-center">이름</th>
              <th class="w-32 px-4 py-4 text-center">아이디</th>
              <th class="w-36 px-4 py-4 text-center">전화번호</th>
              <th class="w-64 px-4 py-4 text-center">이메일</th>
              <th class="w-24 px-4 py-4 text-center">상태</th>
              <th class="w-32 px-4 py-4 text-center">최근 수정일</th>
              <th class="w-32 px-4 py-4 text-center">최근 수정자</th>
              <th class="w-32 px-4 py-4 text-center">등록일</th>
              <th class="w-32 px-4 py-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-forena-50 text-forena-800">
            <tr v-if="filteredAdmins.length === 0">
              <td colspan="12" class="px-6 py-14 text-center text-sm text-slate-400">
                검색 조건에 맞는 관리자 계정이 없습니다.
              </td>
            </tr>
            <tr
              v-for="(admin, index) in filteredAdmins"
              v-else
              :key="admin.id"
              class="transition hover:bg-flare-50/40"
            >
              <td class="px-4 py-4 text-center tabular-nums text-slate-500">{{ index + 1 }}</td>
              <td class="px-4 py-4 text-center font-semibold">{{ admin.role }}</td>
              <td class="truncate px-4 py-4 text-center" :title="getSiteName(admin.siteId)">
                {{ getSiteName(admin.siteId) }}
              </td>
              <td class="px-4 py-4 text-center font-semibold text-forena-900">{{ admin.name }}</td>
              <td class="px-4 py-4 text-center">{{ admin.userId }}</td>
              <td class="px-4 py-4 text-center tabular-nums">{{ admin.phone }}</td>
              <td class="truncate px-4 py-4 text-center" :title="admin.email">{{ admin.email }}</td>
              <td class="px-4 py-4 text-center">
                <span
                  class="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
                >
                  {{ admin.status }}
                </span>
              </td>
              <td class="px-4 py-4 text-center tabular-nums">{{ admin.updatedAt }}</td>
              <td class="px-4 py-4 text-center">{{ admin.updatedBy }}</td>
              <td class="px-4 py-4 text-center tabular-nums">{{ admin.createdAt }}</td>
              <td class="px-4 py-4 text-center">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-1 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-bold text-forena-700 shadow-sm transition hover:bg-forena-50"
                  @click="openEditAccountDrawer(admin)"
                >
                  <Pencil class="h-3.5 w-3.5 text-flare-600" />
                  정보 수정
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section
      v-else
      class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card"
    >
      <div class="flex items-center justify-between border-b border-forena-100 px-5 py-4">
        <h2 class="text-sm font-bold text-forena-900">{{ siteCountText }}</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[960px] table-fixed text-left text-sm whitespace-nowrap">
          <thead
            class="border-b border-forena-100 bg-forena-50/70 text-xs font-bold text-forena-500"
          >
            <tr>
              <th class="w-14 px-4 py-4 text-center">No</th>
              <th class="w-56 px-4 py-4 text-center">현장명</th>
              <th class="w-36 px-4 py-4 text-center">지역</th>
              <th class="w-40 px-4 py-4 text-center">발주/요청 부서</th>
              <th class="w-32 px-4 py-4 text-center">공사 구분</th>
              <th class="w-52 px-4 py-4 text-center">공사 기간</th>
              <th class="w-24 px-4 py-4 text-center">상태</th>
              <th class="w-32 px-4 py-4 text-center">등록일</th>
              <th class="w-32 px-4 py-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-forena-50 text-forena-800">
            <tr v-if="filteredSites.length === 0">
              <td colspan="9" class="px-6 py-14 text-center text-sm text-slate-400">
                검색 조건에 맞는 현장이 없습니다.
              </td>
            </tr>
            <tr
              v-for="(site, index) in filteredSites"
              v-else
              :key="site.id"
              class="transition hover:bg-flare-50/40"
            >
              <td class="px-4 py-4 text-center tabular-nums text-slate-500">{{ index + 1 }}</td>
              <td
                class="truncate px-4 py-4 text-center font-semibold text-forena-900"
                :title="site.name"
              >
                {{ site.name }}
              </td>
              <td class="px-4 py-4 text-center">{{ site.region }}</td>
              <td class="truncate px-4 py-4 text-center" :title="site.client">{{ site.client }}</td>
              <td class="px-4 py-4 text-center">{{ site.constructionType }}</td>
              <td class="px-4 py-4 text-center tabular-nums">
                {{ site.startDate }} ~ {{ site.endDate }}
              </td>
              <td class="px-4 py-4 text-center">
                <span
                  class="rounded-lg bg-flare-50 px-2.5 py-1 text-xs font-bold text-forena-800 ring-1 ring-flare-200"
                >
                  {{ site.status }}
                </span>
              </td>
              <td class="px-4 py-4 text-center tabular-nums">{{ site.createdAt }}</td>
              <td class="px-4 py-4 text-center">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-1 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-bold text-forena-700 shadow-sm transition hover:bg-forena-50"
                  @click="openEditSiteDrawer(site)"
                >
                  <Pencil class="h-3.5 w-3.5 text-flare-600" />
                  정보 수정
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="showAccountDrawer"
        class="fixed inset-0 z-50 flex justify-end bg-forena-900/20 backdrop-blur-[2px]"
        @click.self="showAccountDrawer = false"
      >
        <aside
          class="flex h-full w-full max-w-md flex-col border-l border-forena-100 bg-white shadow-2xl"
        >
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/60 px-5 py-4"
          >
            <h2 class="text-lg font-bold text-forena-900">
              {{ editingAdmin ? '관리자 정보 수정' : '관리자 계정 추가' }}
            </h2>
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-500 transition hover:text-forena-900"
              @click="showAccountDrawer = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="flex-1 space-y-4 overflow-y-auto p-6 text-sm">
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="mb-1.5 block text-xs font-bold text-forena-500">권한</span>
                <select
                  v-model="adminForm.role"
                  class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 outline-none focus:border-flare-400"
                >
                  <option>시스템 관리자</option>
                  <option>본사 관리자</option>
                  <option>현장 관리자</option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1.5 block text-xs font-bold text-forena-500">상태</span>
                <select
                  v-model="adminForm.status"
                  class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 outline-none focus:border-flare-400"
                >
                  <option>정상</option>
                  <option>중지</option>
                </select>
              </label>
            </div>
            <label v-if="adminForm.role === '현장 관리자'" class="block">
              <span class="mb-1.5 flex items-center gap-1 text-xs font-bold text-forena-500">
                <MapPin class="h-3.5 w-3.5 text-flare-600" />
                담당 현장
              </span>
              <select
                v-model="adminForm.siteId"
                class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 outline-none focus:border-flare-400"
              >
                <option v-for="site in sites" :key="site.id" :value="site.id">
                  {{ site.name }}
                </option>
              </select>
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">이름</span>
              <input
                v-model="adminForm.name"
                type="text"
                class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">아이디</span>
              <input
                v-model="adminForm.userId"
                type="text"
                class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">전화번호</span>
              <input
                v-model="adminForm.phone"
                type="tel"
                class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">이메일</span>
              <input
                v-model="adminForm.email"
                type="email"
                class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
              />
            </label>
          </div>
          <div class="flex gap-2 border-t border-forena-100 bg-forena-50/60 p-5">
            <button
              type="button"
              class="flex-1 rounded-xl border border-forena-200 bg-white py-2.5 text-sm font-bold text-forena-700"
              @click="showAccountDrawer = false"
            >
              취소
            </button>
            <button
              type="button"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-forena-800 py-2.5 text-sm font-bold text-white"
              @click="saveAdmin"
            >
              <Save class="h-4 w-4" />
              저장
            </button>
          </div>
        </aside>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showSiteDrawer"
        class="fixed inset-0 z-50 flex justify-end bg-forena-900/20 backdrop-blur-[2px]"
        @click.self="showSiteDrawer = false"
      >
        <aside
          class="flex h-full w-full max-w-md flex-col border-l border-forena-100 bg-white shadow-2xl"
        >
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/60 px-5 py-4"
          >
            <h2 class="text-lg font-bold text-forena-900">
              {{ editingSite ? '현장 정보 수정' : '현장 추가' }}
            </h2>
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-500 transition hover:text-forena-900"
              @click="showSiteDrawer = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="flex-1 space-y-4 overflow-y-auto p-6 text-sm">
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">현장명</span>
              <input
                v-model="siteForm.name"
                type="text"
                class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">지역</span>
              <input
                v-model="siteForm.region"
                type="text"
                class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">발주/요청 부서</span>
              <input
                v-model="siteForm.client"
                type="text"
                class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">공사 구분</span>
              <input
                v-model="siteForm.constructionType"
                type="text"
                class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
              />
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="mb-1.5 block text-xs font-bold text-forena-500">공사 시작일</span>
                <input
                  v-model="siteForm.startDate"
                  type="date"
                  class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
                />
              </label>
              <label class="block">
                <span class="mb-1.5 block text-xs font-bold text-forena-500">공사 종료일</span>
                <input
                  v-model="siteForm.endDate"
                  type="date"
                  class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400"
                />
              </label>
            </div>
            <label class="block">
              <span class="mb-1.5 block text-xs font-bold text-forena-500">상태</span>
              <select
                v-model="siteForm.status"
                class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 outline-none focus:border-flare-400"
              >
                <option>준비중</option>
                <option>진행중</option>
                <option>종료</option>
              </select>
            </label>
          </div>
          <div class="flex gap-2 border-t border-forena-100 bg-forena-50/60 p-5">
            <button
              type="button"
              class="flex-1 rounded-xl border border-forena-200 bg-white py-2.5 text-sm font-bold text-forena-700"
              @click="showSiteDrawer = false"
            >
              취소
            </button>
            <button
              type="button"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-forena-800 py-2.5 text-sm font-bold text-white"
              @click="saveSite"
            >
              <Save class="h-4 w-4" />
              저장
            </button>
          </div>
        </aside>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showRoleDrawer"
        class="fixed inset-0 z-50 flex justify-end bg-forena-900/20 backdrop-blur-[2px]"
        @click.self="showRoleDrawer = false"
      >
        <aside
          class="flex h-full w-full max-w-lg flex-col border-l border-forena-100 bg-white shadow-2xl"
        >
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/60 px-5 py-4"
          >
            <h2 class="text-lg font-bold text-forena-900">권한 관리</h2>
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-500 transition hover:text-forena-900"
              @click="showRoleDrawer = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="flex-1 space-y-3 overflow-y-auto p-6">
            <article
              v-for="rule in roleRules"
              :key="rule.role"
              class="rounded-xl border border-forena-100 bg-forena-50/40 p-4"
            >
              <h3 class="font-bold text-forena-900">{{ rule.role }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ rule.description }}</p>
            </article>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>
