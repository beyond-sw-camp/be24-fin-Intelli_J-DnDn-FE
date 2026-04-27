<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ScanLine,
  Search,
  Trash2,
  X,
  AlertTriangle,
  Users,
  Clock,
  UserCheck,
  Eye,
} from 'lucide-vue-next'
import {
  getAffiliationKind,
  affiliationKindBadgeClass,
  formatAffiliationDisplay,
} from '@/utils/workerAffiliation'

const props = defineProps({
  embed: { type: Boolean, default: false },
  /** 작업자 관리(embed)에서 상세보기 열 여부 */
  showProfileLink: { type: Boolean, default: true },
})

const showProfileColumn = computed(() => !props.embed || props.showProfileLink)

const router = useRouter()

const T = {
  kicker: '현장 운영',
  title: '출입 / 근태 관리',
  desc: '작업자 출퇴근과 공수 산정 현황을 일일별로 조회하고 보정할 수 있습니다.',
  breadcrumb: '현장 관리 / 출입·근태',
  statTotal: '조회 인원',
  statWorking: '작업 중',
  statDone: '퇴근 완료',
  filterDate: '조회 날짜',
  filterSite: '현장',
  filterAffil: '소속 구분',
  filterSearch: '작업자 이름',
  filterSearchPh: '이름을 입력하세요',
  siteAll: '전체 현장',
  affilAll: '전체 소속',
  colContact: '이름 / 연락처',
  colEmergency: '비상 연락망 / 관계',
  colAffil: '소속 / 현장',
  colTime: '출·퇴근',
  colMan: '산정 공수',
  colStatus: '상태',
  colDel: '삭제',
  empty: '조회된 근태 내역이 없습니다.',
  drawerTitle: '근태 기록 보정',
  drawerWorker: '대상 작업자',
  affilChange: '소속 변경',
  clockIn: '출근 시간',
  clockOut: '퇴근 시간',
  manDays: '산정 공수',
  reasonTitle: '보정 사유 (필수)',
  reasonPh: '시간 오류, 시스템 누락 등 사유를 입력하세요.',
  cancel: '취소',
  save: '보정 및 승인',
  closedWarn: '이미 마감된 현장의 근태는 수정할 수 없습니다.',
  deleteConfirm: '해당 작업자의 근태 기록을 삭제하시겠습니까?',
  deleted: '삭제가 완료되었습니다.',
  reasonRequired: '보정 사유를 반드시 입력해야 합니다.',
  saved: '근태 정보가 성공적으로 보정되었습니다.',
  closedTag: '마감됨',
  manSuffix: '공수',
  statHint: '기준',
  colDetail: '상세보기',
  filterKind: '투입 구분 (본사/협력/인력)',
  kindAll: '전체',
  kindDirect: '본사 직영',
  kindPartner: '협력사',
  kindAgency: '인력사무소',
  kindBreakdown: '오늘 조회 대상 (구분별)',
  colKind: '구분',
  badgeDirect: '직영',
  badgePartner: '협력',
  badgeAgency: '인력',
  countPeople: '명',
}

const siteOptions = [
  { value: '강남구 재건축 A공구', label: '강남구 재건축 A공구' },
  { value: '판교 데이터센터', label: '판교 데이터센터' },
]

const affiliationOptions = [
  { value: '본사 소속', label: '본사 소속 직원' },
  { value: '협력사', label: '협력사 소속' },
  { value: '인력사무소', label: '인력사무소 (개인)' },
]

const editAffiliationOptions = [
  { value: '본사 소속', label: '본사 소속 직원' },
  { value: '협력사 (태양건설)', label: '협력사 (태양건설)' },
  { value: '인력사무소', label: '인력사무소 (개인)' },
]

const filters = ref({
  date: new Date().toISOString().split('T')[0],
  siteName: '',
  affiliationType: '',
  affiliationKind: '',
  searchName: '',
})

const attendanceList = ref([
  {
    id: 1,
    name: '김동석',
    phone: '010-1234-5678',
    emergency: '010-9999-1111 (배우자)',
    affiliationType: '협력사 (태양건설)',
    site: '강남구 재건축 A공구',
    clockIn: '06:50',
    clockOut: '17:10',
    manDays: 1.0,
    status: '퇴근 완료',
    isClosed: false,
    monthTotalMan: 18.5,
    clockHistory: [
      { date: '2025-10-14', clockIn: '06:50', clockOut: '17:10', manDays: 1.0 },
      { date: '2025-10-13', clockIn: '06:48', clockOut: '17:05', manDays: 1.0 },
      { date: '2025-10-12', clockIn: '06:52', clockOut: '17:00', manDays: 1.0 },
      { date: '2025-10-11', clockIn: '06:55', clockOut: '12:30', manDays: 0.5 },
    ],
  },
  {
    id: 2,
    name: '이목수',
    phone: '010-8888-7777',
    emergency: '010-7777-6666 (자녀)',
    affiliationType: '인력사무소',
    site: '강남구 재건축 A공구',
    clockIn: '07:05',
    clockOut: '-',
    manDays: 0,
    status: '작업 중',
    isClosed: false,
    monthTotalMan: 14.0,
    clockHistory: [
      { date: '2025-10-14', clockIn: '07:05', clockOut: '-', manDays: 0 },
      { date: '2025-10-13', clockIn: '07:00', clockOut: '17:15', manDays: 1.0 },
      { date: '2025-10-12', clockIn: '07:02', clockOut: '17:00', manDays: 1.0 },
    ],
  },
  {
    id: 3,
    name: '박반장',
    phone: '010-5555-4444',
    emergency: '010-4444-3333 (형제)',
    affiliationType: '본사 소속',
    site: '판교 데이터센터',
    clockIn: '06:45',
    clockOut: '16:00',
    manDays: 0.5,
    status: '조퇴',
    isClosed: true,
    monthTotalMan: 10.5,
    clockHistory: [
      { date: '2025-10-14', clockIn: '06:45', clockOut: '16:00', manDays: 0.5 },
      { date: '2025-10-13', clockIn: '-', clockOut: '-', manDays: 0 },
      { date: '2025-10-12', clockIn: '06:40', clockOut: '17:10', manDays: 1.0 },
    ],
  },
])

const preKindAttendance = computed(() => {
  let result = attendanceList.value
  if (filters.value.siteName) result = result.filter((a) => a.site.includes(filters.value.siteName))
  if (filters.value.affiliationType)
    result = result.filter((a) => a.affiliationType.includes(filters.value.affiliationType))
  if (filters.value.searchName)
    result = result.filter((a) => a.name.includes(filters.value.searchName))
  return result
})

const kindBreakdown = computed(() => {
  const rows = preKindAttendance.value
  let direct = 0
  let partner = 0
  let agency = 0
  let manDirect = 0
  let manPartner = 0
  let manAgency = 0
  for (const r of rows) {
    const k = getAffiliationKind(r.affiliationType)
    const m = Number(r.manDays) || 0
    if (k === 'direct') {
      direct++
      manDirect += m
    } else if (k === 'agency') {
      agency++
      manAgency += m
    } else {
      partner++
      manPartner += m
    }
  }
  return { direct, partner, agency, manDirect, manPartner, manAgency }
})

const filteredAttendance = computed(() => {
  let result = preKindAttendance.value
  const k = filters.value.affiliationKind
  if (k) result = result.filter((a) => getAffiliationKind(a.affiliationType) === k)
  return result
})

const statCounts = computed(() => {
  const rows = filteredAttendance.value
  return {
    total: rows.length,
    working: rows.filter((r) => r.status.includes('작업 중')).length,
    done: rows.filter((r) => r.status.includes('퇴근 완료')).length,
  }
})

const kindPills = computed(() => [
  { key: '', label: T.kindAll },
  { key: 'direct', label: T.kindDirect },
  { key: 'partner', label: T.kindPartner },
  { key: 'agency', label: T.kindAgency },
])

function affiliationKindLabel(kind) {
  if (kind === 'direct') return T.badgeDirect
  if (kind === 'agency') return T.badgeAgency
  return T.badgePartner
}

const deleteAttendance = (id, event) => {
  event.stopPropagation()
  if (confirm(T.deleteConfirm)) {
    attendanceList.value = attendanceList.value.filter((a) => a.id !== id)
    alert(T.deleted)
  }
}

const showEditDrawer = ref(false)
const editForm = ref({
  id: null,
  affiliationType: '',
  clockIn: '',
  clockOut: '',
  manDays: '',
  reason: '',
})
const selectedWorkerName = ref('')
const selectedWorkerSite = ref('')

const openEditDrawer = (record) => {
  if (record.isClosed) {
    alert(T.closedWarn)
    return
  }
  selectedWorkerName.value = record.name
  selectedWorkerSite.value = record.site

  editForm.value = {
    id: record.id,
    affiliationType: record.affiliationType,
    clockIn: record.clockIn,
    clockOut: record.clockOut === '-' ? '' : record.clockOut,
    manDays: record.manDays,
    reason: '',
  }
  showEditDrawer.value = true
}

const saveEdit = () => {
  if (!editForm.value.reason.trim()) {
    alert(T.reasonRequired)
    return
  }
  const index = attendanceList.value.findIndex((a) => a.id === editForm.value.id)
  if (index !== -1) {
    const prev = attendanceList.value[index]
    attendanceList.value[index] = {
      ...prev,
      affiliationType: editForm.value.affiliationType,
      clockIn: editForm.value.clockIn,
      clockOut: editForm.value.clockOut || '-',
      manDays: Number(editForm.value.manDays),
      monthTotalMan: prev.monthTotalMan,
      clockHistory: prev.clockHistory,
    }
    alert(T.saved)
    showEditDrawer.value = false
  }
}

function goWorkerProfile(record, event) {
  event.stopPropagation()
  router.push({ name: 'siteWorkerProfile', params: { id: String(record.id) } })
}

const getStatusBadge = (status) => {
  if (status.includes('퇴근')) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
  if (status.includes('작업 중')) return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80'
  if (status.includes('조퇴') || status.includes('겸근'))
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80'
  return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80'
}
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      v-if="!embed"
      class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-gradient-to-br from-white via-forena-50/50 to-flare-50/30 p-6 shadow-card"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500"
      />
      <div class="flex flex-wrap items-start gap-4">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md"
        >
          <ScanLine class="h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-flare-600">{{ T.kicker }}</p>
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">{{ T.title }}</h2>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-forena-700/80">{{ T.desc }}</p>
          <p class="mt-3 text-[11px] font-medium text-forena-400">{{ T.breadcrumb }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <article class="rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <Users class="h-4 w-4 text-flare-600" />
          {{ T.statTotal }}
        </div>
        <p class="mt-3 text-3xl font-light tabular-nums text-forena-900">{{ statCounts.total }}</p>
        <p class="text-xs text-slate-500">{{ T.filterDate }} {{ T.statHint }}</p>
      </article>
      <article class="rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <Clock class="h-4 w-4 text-amber-600" />
          {{ T.statWorking }}
        </div>
        <p class="mt-3 text-3xl font-light tabular-nums text-amber-800">{{ statCounts.working }}</p>
      </article>
      <article class="rounded-2xl border border-white/90 bg-white/90 p-5 shadow-card">
        <div class="flex items-center gap-2 text-sm font-semibold text-forena-900">
          <UserCheck class="h-4 w-4 text-emerald-600" />
          {{ T.statDone }}
        </div>
        <p class="mt-3 text-3xl font-light tabular-nums text-emerald-800">{{ statCounts.done }}</p>
      </article>
    </div>

    <div
      class="rounded-2xl border border-forena-100/90 bg-white/90 p-4 shadow-card backdrop-blur-sm sm:p-5"
    >
      <p class="text-[11px] font-bold uppercase tracking-wide text-forena-500">{{ T.kindBreakdown }}</p>
      <div
        class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-forena-800"
      >
        <span class="tabular-nums">
          <span class="font-semibold text-indigo-700">{{ T.kindDirect }}</span>
          {{ kindBreakdown.direct }}{{ T.countPeople }}
          <span class="text-slate-400">·</span>
          {{ kindBreakdown.manDirect.toFixed(1) }}{{ T.manSuffix }}
        </span>
        <span class="tabular-nums">
          <span class="font-semibold text-amber-800">{{ T.kindPartner }}</span>
          {{ kindBreakdown.partner }}{{ T.countPeople }}
          <span class="text-slate-400">·</span>
          {{ kindBreakdown.manPartner.toFixed(1) }}{{ T.manSuffix }}
        </span>
        <span class="tabular-nums">
          <span class="font-semibold text-slate-600">{{ T.kindAgency }}</span>
          {{ kindBreakdown.agency }}{{ T.countPeople }}
          <span class="text-slate-400">·</span>
          {{ kindBreakdown.manAgency.toFixed(1) }}{{ T.manSuffix }}
        </span>
      </div>
    </div>

    <div
      class="rounded-2xl border border-forena-100/90 bg-white/90 p-5 shadow-card backdrop-blur-sm"
    >
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.filterDate }}</label>
          <input
            v-model="filters.date"
            type="date"
            class="w-40 rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.filterSite }}</label>
          <select
            v-model="filters.siteName"
            class="w-48 rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
          >
            <option value="">{{ T.siteAll }}</option>
            <option v-for="opt in siteOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.filterAffil }}</label>
          <select
            v-model="filters.affiliationType"
            class="w-44 rounded-xl border border-forena-200 bg-white px-3 py-2.5 text-sm text-forena-900 outline-none transition focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
          >
            <option value="">{{ T.affilAll }}</option>
            <option v-for="opt in affiliationOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="relative min-w-[200px] flex-1">
          <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.filterSearch }}</label>
          <Search
            class="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-flare-500/80"
            aria-hidden="true"
          />
          <input
            v-model="filters.searchName"
            type="text"
            :placeholder="T.filterSearchPh"
            class="w-full rounded-xl border border-forena-200 bg-white py-2.5 pr-4 pl-9 text-sm text-forena-900 outline-none transition placeholder:text-slate-400 focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
          />
        </div>
      </div>
      <div class="mt-5 border-t border-forena-100 pt-4">
        <p class="mb-2 text-[11px] font-bold text-forena-500">{{ T.filterKind }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="pill in kindPills"
            :key="pill.key || 'all'"
            type="button"
            class="rounded-full px-3.5 py-1.5 text-xs font-bold transition ring-1"
            :class="
              filters.affiliationKind === pill.key
                ? 'bg-forena-800 text-white ring-forena-800'
                : 'bg-forena-50 text-forena-700 ring-forena-200/80 hover:bg-forena-100'
            "
            @click="filters.affiliationKind = pill.key"
          >
            {{ pill.label }}
          </button>
        </div>
      </div>
    </div>

    <div
      class="flex flex-col overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[960px] text-left text-sm whitespace-nowrap">
          <thead
            class="border-b border-forena-100 bg-forena-50/60 text-[11px] font-bold uppercase tracking-wider text-forena-500"
          >
            <tr>
              <th class="px-6 py-4 font-semibold">{{ T.colContact }}</th>
              <th class="px-6 py-4 font-semibold">{{ T.colEmergency }}</th>
              <th class="px-6 py-4 font-semibold">{{ T.colKind }}</th>
              <th class="px-6 py-4 font-semibold">{{ T.colAffil }}</th>
              <th class="px-6 py-4 font-semibold">{{ T.colTime }}</th>
              <th class="px-6 py-4 font-semibold">{{ T.colMan }}</th>
              <th class="px-6 py-4 text-center font-semibold">{{ T.colStatus }}</th>
              <th v-if="showProfileColumn" class="px-6 py-4 text-center font-semibold">{{ T.colDetail }}</th>
              <th class="px-6 py-4 text-center font-semibold">{{ T.colDel }}</th>
            </tr>
          </thead>
          <tbody class="text-forena-800">
            <tr v-if="filteredAttendance.length === 0">
              <td
                :colspan="showProfileColumn ? 9 : 8"
                class="px-6 py-14 text-center text-sm text-slate-400"
              >
                {{ T.empty }}
              </td>
            </tr>
            <tr
              v-else
              v-for="record in filteredAttendance"
              :key="record.id"
              class="cursor-pointer border-b border-forena-50 transition hover:bg-flare-50/40"
              @click="openEditDrawer(record)"
            >
              <td class="px-6 py-4">
                <div class="font-semibold text-forena-900">{{ record.name }}</div>
                <div class="text-[11px] text-slate-500">{{ record.phone }}</div>
              </td>
              <td class="px-6 py-4 text-xs font-medium text-rose-600/90">{{ record.emergency }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold"
                  :class="affiliationKindBadgeClass(getAffiliationKind(record.affiliationType))"
                >
                  {{ affiliationKindLabel(getAffiliationKind(record.affiliationType)) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-xs font-semibold text-forena-800">
                  {{ formatAffiliationDisplay(record.affiliationType) }}
                </div>
                <div class="text-[11px] text-slate-500">{{ record.site }}</div>
              </td>
              <td class="px-6 py-4 font-mono text-xs">
                <span class="font-semibold text-flare-700">{{ record.clockIn }}</span>
                <span class="text-slate-400"> — </span>
                <span class="text-slate-600">{{ record.clockOut }}</span>
              </td>
              <td class="px-6 py-4 font-semibold tabular-nums text-forena-900">
                {{ record.manDays }} {{ T.manSuffix }}
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold"
                  :class="getStatusBadge(record.status)"
                  >{{ record.status }}</span
                >
                <span v-if="record.isClosed" class="mt-1 block text-[9px] font-bold text-slate-400">{{
                  T.closedTag
                }}</span>
              </td>
              <td v-if="showProfileColumn" class="px-6 py-4 text-center">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-[11px] font-bold text-forena-700 shadow-sm transition hover:border-flare-300 hover:bg-flare-50/50"
                  :title="T.colDetail"
                  @click="(e) => goWorkerProfile(record, e)"
                >
                  <Eye class="h-3.5 w-3.5" />
                  {{ T.colDetail }}
                </button>
              </td>
              <td class="px-6 py-4 text-center">
                <button
                  type="button"
                  class="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  :title="T.colDel"
                  @click="(e) => deleteAttendance(record.id, e)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showEditDrawer"
        class="fixed inset-0 z-50 flex justify-end bg-forena-900/20 backdrop-blur-[2px]"
        @click.self="showEditDrawer = false"
      >
        <aside
          class="flex h-full w-full max-w-md flex-col border-l border-forena-100 bg-white shadow-2xl animate-[slideIn_0.25s_ease-out]"
          @click.stop
        >
          <div
            class="flex items-center justify-between border-b border-forena-100 bg-forena-50/50 px-5 py-4"
          >
            <h2 class="text-lg font-bold text-forena-900">{{ T.drawerTitle }}</h2>
            <button
              type="button"
              class="rounded-lg border border-forena-200 bg-white p-2 text-forena-400 transition hover:text-forena-700"
              @click="showEditDrawer = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="flex-1 space-y-6 overflow-y-auto p-6 text-sm">
            <div class="rounded-xl border border-forena-100 bg-white p-4 shadow-sm">
              <p class="mb-1 text-[11px] font-bold uppercase tracking-wide text-forena-400">
                {{ T.drawerWorker }}
              </p>
              <p class="text-lg font-bold text-forena-900">
                {{ selectedWorkerName }}
                <span class="ml-1 text-xs font-normal text-slate-500">| {{ selectedWorkerSite }}</span>
              </p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.affilChange }}</label>
                <select
                  v-model="editForm.affiliationType"
                  class="w-full rounded-xl border border-forena-200 bg-white px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                >
                  <option v-for="opt in editAffiliationOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.clockIn }}</label>
                  <input
                    v-model="editForm.clockIn"
                    type="time"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.clockOut }}</label>
                  <input
                    v-model="editForm.clockOut"
                    type="time"
                    class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                  />
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-[11px] font-bold text-forena-500">{{ T.manDays }}</label>
                <input
                  v-model="editForm.manDays"
                  type="number"
                  step="0.5"
                  min="0"
                  class="w-full rounded-xl border border-forena-200 px-3 py-2.5 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-400/20"
                />
              </div>

              <div class="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                <h3 class="mb-2 flex items-center gap-2 text-[11px] font-bold text-rose-700">
                  <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
                  {{ T.reasonTitle }}
                </h3>
                <textarea
                  v-model="editForm.reason"
                  rows="3"
                  :placeholder="T.reasonPh"
                  class="w-full resize-none rounded-lg border border-rose-200/80 bg-white p-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15"
                />
              </div>
            </div>
          </div>

          <div class="flex shrink-0 justify-end gap-3 border-t border-forena-100 bg-forena-50/30 px-6 py-4">
            <button
              type="button"
              class="rounded-xl border border-forena-200 bg-white px-5 py-2.5 text-sm font-bold text-forena-600 transition hover:bg-forena-50"
              @click="showEditDrawer = false"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-forena-800 hover:to-forena-950"
              @click="saveEdit"
            >
              {{ T.save }}
            </button>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
