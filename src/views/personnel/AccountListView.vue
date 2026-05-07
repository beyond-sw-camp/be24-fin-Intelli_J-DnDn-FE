<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Ban,
  X,
  RefreshCw,
} from 'lucide-vue-next'
import {
  getAdminAccounts,
  postAdminAccount,
  putAdminAccount,
  putAdminAccountPassword,
  deleteAdminAccount,
  getAdminAccountRequests,
  approveAccountRequest,
  rejectAccountRequest,
} from '@/api/auth.js'
import { getProjectList, getTradeProcessList } from '@/api/project.js'
import { userRoleLabel, USER_ROLE } from '@/stores/authStore'

const T = {
  kicker: '시스템 관리',
  title: '계정 및 권한 관리',
  tabStatus: '계정 및 권한 현황',
  tabRequests: '요청 및 승인',
  sectionAccountStatus: '계정 현황',
  sectionRequests: '요청 및 승인',
  reload: '목록 새로고침',
  reloadBusy: '불러오는 중…',
  newAccount: '신규 계정 생성',
  grpSystem: '시스템 관리자',
  grpHQ: '본사',
  grpField: '현장',
  colLoginId: '로그인 ID',
  colName: '이름',
  colPhone: '휴대폰',
  colEmail: '이메일',
  colRole: '권한',
  colSite: '현장',
  colTrade: '공종',
  colStatus: '상태',
  colActions: '관리',
  colReqAt: '요청일시',
  colReqType: '요청 유형',
  colReqStatus: '처리 상태',
  reqTypeCreate: '계정·권한',
  reqApprove: '승인',
  reqReject: '거절',
  reqSiteHeader: '현장',
  noRequests: '접수된 요청이 없습니다.',
  active: '사용 중',
  inactive: '비활성',
  edit: '수정',
  del: '비활성',
  modalCreate: '신규 계정 생성',
  modalEdit: '계정 수정',
  save: '저장',
  cancel: '취소',
  pwdNew: '비밀번호 (8자 이상)',
  pwdPlaceholderEdit: '변경 시에만 입력',
  loginIdRo: '로그인 ID는 수정할 수 없습니다.',
  modalApproveTitle: '요청 승인',
  modalRejectTitle: '요청 거절',
  labelInitialPwd: '초기 비밀번호',
  labelRejectNote: '거절 사유 (선택)',
  rolePickHint: '권한 선택',
  sitePick: '현장 명',
  tradePick: '공종',
  tradeHint: '공종별 책임자·관리자만 선택',
  phone: '휴대폰 번호',
  email: '이메일',
}

const ROLE_OPTIONS = [
  { value: USER_ROLE.ADMIN, label: '시스템 관리자' },
  { value: USER_ROLE.HEADQUARTOR, label: '본사' },
  { value: USER_ROLE.SITE_DIRECTOR, label: '현장 총 책임자' },
  { value: USER_ROLE.SECTION_LEADER, label: '공종별 책임자' },
  { value: USER_ROLE.SECTION_SUPERVISOR, label: '공종별 현장 관리자' },
]

function parseProjectLabel(name) {
  const s = String(name || '').trim()
  const m = /^\s*\[(?<code>[^\]]+)\]\s*(?<rest>.+)$/.exec(s)
  if (m?.groups) {
    return { code: m.groups.code.trim(), title: m.groups.rest.trim() }
  }
  return { code: '', title: s }
}

/** @typedef {{ idx: number, loginId?: string, name?: string, role?: string, siteCode?: string|null, trade?: string|null, active?: boolean, phone?: string|null, email?: string|null }} Acc */

const mainTab = ref(/** @type {'status' | 'requests'} */ ('status'))

const loading = ref(false)
const loadingRequests = ref(false)
/** @type {import('vue').Ref<Acc[]>} */
const accounts = ref([])
/** @type {import('vue').Ref<any[]>} */
const accountRequests = ref([])

/** @type {import('vue').Ref<Array<{ idx: number, name: string, location?: string }>>} */
const projectOptions = ref([])
const tradeOptions = ref(/** @type {string[]} */ ([]))
const tradeLoading = ref(false)

const expanded = reactive({
  system: true,
  hq: true,
  field: true,
})

const toastMsg = ref('')
const toastVariant = ref('info')

function pushToast(msg, variant = 'info') {
  toastMsg.value = msg
  toastVariant.value = variant
  window.setTimeout(() => {
    toastMsg.value = ''
  }, 3800)
}

function classify(acc) {
  const r = acc?.role
  if (r === 'ADMIN') return 'system'
  if (r === 'HEADQUARTOR') return 'hq'
  return 'field'
}

const grouped = computed(() => ({
  system: accounts.value.filter((a) => classify(a) === 'system'),
  hq: accounts.value.filter((a) => classify(a) === 'hq'),
  field: accounts.value.filter((a) => classify(a) === 'field'),
}))

const accSections = computed(() => [
  { key: 'system', label: T.grpSystem, rows: grouped.value.system },
  { key: 'hq', label: T.grpHQ, rows: grouped.value.hq },
  { key: 'field', label: T.grpField, rows: grouped.value.field },
])

const requestsTableTheadClass =
  'sticky top-0 z-[1] border-b border-violet-200/70 bg-violet-100/45 text-xs font-bold text-violet-950'

const requestsBundleSiteHeaderClass =
  'border-b border-indigo-100/80 bg-indigo-50 px-4 py-3'
const accountStatusGroupRowClass =
  'flex w-full items-center justify-between border-b border-indigo-100/80 bg-indigo-50 px-4 py-2.5 text-left text-sm font-bold text-indigo-950 transition hover:bg-indigo-100/50'

/** 테이블 컬럼 헤더 — 분류 행과 구분되는 연보라 톤 */
const accountStatusTheadClass =
  'border-b border-violet-200/70 bg-violet-100/45 text-xs font-bold text-violet-950'

/** 목록 카드 — 요청 탭 등 */
const panelClass =
  'overflow-hidden rounded-2xl border border-flare-100/80 bg-white shadow-[0_10px_40px_rgba(0,46,85,0.06)]'

async function refreshCurrentTab() {
  if (mainTab.value === 'status') await refreshList()
  else await refreshRequests()
}

function statusLabel(raw) {
  const s = String(raw || '').toUpperCase()
  if (s === 'PENDING' || s === 'WAIT') return '대기'
  if (s === 'APPROVED') return '승인'
  if (s === 'REJECTED') return '거절'
  return raw || '—'
}

function isPendingRequest(row) {
  const s = String(row?.status || '').toUpperCase()
  return s === 'PENDING' || s === 'WAIT'
}

function requestSiteKey(row) {
  const v = row?.siteCode ?? row?.projectCode ?? row?.site ?? ''
  const t = String(v || '').trim()
  return t || '미지정'
}

const requestsBySite = computed(() => {
  const map = new Map()
  for (const r of accountRequests.value) {
    const k = requestSiteKey(r)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(r)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ko'))
})

function formatReqDate(row) {
  const d = row?.createdAt ?? row?.requestAt ?? row?.createdDate
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(d))
  } catch {
    return String(d)
  }
}

const modalOpen = ref(false)
const modalMode = ref('create')

const formCreate = reactive({
  loginId: '',
  password: '',
  name: '',
  phone: '',
  email: '',
  role: USER_ROLE.SITE_DIRECTOR,
  projectIdx: /** @type {number | null} */ (null),
  trade: '',
})

const editingIdx = ref(/** @type {number|null} */ (null))
const formEdit = reactive({
  name: '',
  phone: '',
  email: '',
  role: USER_ROLE.SITE_DIRECTOR,
  siteCode: '',
  trade: '',
  active: true,
  newPassword: '',
})

const needsSiteForRole = computed(() =>
  [USER_ROLE.SITE_DIRECTOR, USER_ROLE.SECTION_LEADER, USER_ROLE.SECTION_SUPERVISOR].includes(
    formCreate.role,
  ),
)

const needsTrade = computed(() =>
  [USER_ROLE.SECTION_LEADER, USER_ROLE.SECTION_SUPERVISOR].includes(formCreate.role),
)

const selectedProjectLabel = computed(() => {
  const idx = formCreate.projectIdx
  if (idx == null) return ''
  const p = projectOptions.value.find((x) => x.idx === idx)
  if (!p) return ''
  const { code, title } = parseProjectLabel(p.name)
  if (code && title) return `[${code}] ${title}`
  return p.name || ''
})

watch(
  () => formCreate.projectIdx,
  async (pid) => {
    formCreate.trade = ''
    tradeOptions.value = []
    if (pid == null || !needsTrade.value) return
    tradeLoading.value = true
    try {
      const list = await getTradeProcessList(pid)
      const arr = Array.isArray(list) ? list : []
      const names = new Set()
      for (const row of arr) {
        const n =
          row?.tradeName ??
          row?.trade ??
          row?.processName ??
          row?.name
        if (n) names.add(String(n).trim())
      }
      tradeOptions.value = [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ko'))
    } catch {
      tradeOptions.value = []
    } finally {
      tradeLoading.value = false
    }
  },
)

watch(
  () => formCreate.role,
  (r) => {
    if (!needsTrade.value) formCreate.trade = ''
    if (!needsSiteForRole.value) {
      formCreate.projectIdx = null
      formCreate.trade = ''
      tradeOptions.value = []
    }
  },
)

async function loadProjects() {
  try {
    const list = await getProjectList()
    projectOptions.value = Array.isArray(list) ? list.slice() : []
  } catch {
    projectOptions.value = []
  }
}

async function refreshList() {
  loading.value = true
  try {
    const list = await getAdminAccounts()
    accounts.value = Array.isArray(list) ? list.slice() : []
  } catch (e) {
    pushToast(e?.message || '계정 목록을 불러오지 못했습니다.', 'danger')
  } finally {
    loading.value = false
  }
}

async function refreshRequests() {
  loadingRequests.value = true
  try {
    const list = await getAdminAccountRequests()
    accountRequests.value = Array.isArray(list) ? list.slice() : []
  } catch (e) {
    pushToast(e?.message || '요청 목록을 불러오지 못했습니다.', 'danger')
    accountRequests.value = []
  } finally {
    loadingRequests.value = false
  }
}

onMounted(() => {
  loadProjects()
  refreshList()
  refreshRequests()
})

watch(mainTab, (t) => {
  if (t === 'requests') refreshRequests()
})

function accordionToggle(key) {
  expanded[key] = !expanded[key]
}

function openCreateModal() {
  modalMode.value = 'create'
  formCreate.loginId = ''
  formCreate.password = ''
  formCreate.name = ''
  formCreate.phone = ''
  formCreate.email = ''
  formCreate.role = USER_ROLE.SITE_DIRECTOR
  formCreate.projectIdx = null
  formCreate.trade = ''
  modalOpen.value = true
}

/** @param {Acc} row */
function openEditModal(row) {
  modalMode.value = 'edit'
  editingIdx.value = row.idx
  formEdit.name = row.name || ''
  formEdit.phone = row.phone || ''
  formEdit.email = row.email || ''
  formEdit.role = row.role || USER_ROLE.SITE_DIRECTOR
  formEdit.siteCode = row.siteCode || ''
  formEdit.trade = row.trade || ''
  formEdit.active = Boolean(row.active)
  formEdit.newPassword = ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  editingIdx.value = null
}

function deriveSiteCodeFromForm() {
  if (!needsSiteForRole.value) return undefined
  const idx = formCreate.projectIdx
  if (idx == null) return undefined
  const p = projectOptions.value.find((x) => x.idx === idx)
  if (!p) return undefined
  const { code } = parseProjectLabel(p.name)
  return code || undefined
}

async function submitModal() {
  if (modalMode.value === 'create') {
    const loginId = String(formCreate.loginId || '').trim()
    const password = String(formCreate.password || '').trim()
    const name = String(formCreate.name || '').trim()
    if (!loginId || !password || password.length < 8) {
      pushToast('로그인 ID와 비밀번호(8자 이상)를 확인해 주세요.', 'warning')
      return
    }
    if (!name) {
      pushToast('이름을 입력해 주세요.', 'warning')
      return
    }
    if (needsSiteForRole.value && formCreate.projectIdx == null) {
      pushToast('현장을 선택해 주세요.', 'warning')
      return
    }
    if (needsTrade.value) {
      if (!String(formCreate.trade || '').trim()) {
        pushToast('공종을 선택해 주세요.', 'warning')
        return
      }
    }
    const siteCode = deriveSiteCodeFromForm()
    try {
      await postAdminAccount({
        loginId,
        password,
        name,
        phone: String(formCreate.phone || '').trim() || undefined,
        email: String(formCreate.email || '').trim() || undefined,
        role: formCreate.role,
        siteCode,
        trade: needsTrade.value ? String(formCreate.trade || '').trim() : undefined,
      })
      pushToast('계정이 생성되었습니다.')
      closeModal()
      await refreshList()
    } catch (e) {
      pushToast(e?.message || '계정 생성에 실패했습니다.', 'danger')
    }
    return
  }

  const idx = editingIdx.value
  if (idx == null) return

  try {
    await putAdminAccount(idx, {
      name: String(formEdit.name || '').trim(),
      phone: String(formEdit.phone || '').trim() || undefined,
      email: String(formEdit.email || '').trim() || undefined,
      role: formEdit.role,
      siteCode: String(formEdit.siteCode || '').trim() || undefined,
      trade: String(formEdit.trade || '').trim() || undefined,
      active: Boolean(formEdit.active),
    })
    const np = String(formEdit.newPassword || '').trim()
    if (np.length >= 8) {
      await putAdminAccountPassword(idx, { newPassword: np })
    }
    pushToast('계정이 수정되었습니다.')
    closeModal()
    await refreshList()
  } catch (e) {
    pushToast(e?.message || '계정 수정에 실패했습니다.', 'danger')
  }
}

async function deactivateAccount(row) {
  const ok = window.confirm(`‘${row.name}’ 계정을 비활성화할까요?`)
  if (!ok) return
  try {
    await deleteAdminAccount(row.idx)
    pushToast('비활성화되었습니다.')
    await refreshList()
  } catch (e) {
    pushToast(e?.message || '비활성화에 실패했습니다.', 'danger')
  }
}

const approveOpen = ref(false)
const approveTarget = ref(/** @type {any|null} */ (null))
const approvePassword = ref('')

const rejectOpen = ref(false)
const rejectTarget = ref(/** @type {any|null} */ (null))
const rejectNote = ref('')

function openApprove(row) {
  approveTarget.value = row
  approvePassword.value = ''
  approveOpen.value = true
}

function closeApprove() {
  approveOpen.value = false
  approveTarget.value = null
}

async function submitApprove() {
  const row = approveTarget.value
  const pwd = String(approvePassword.value || '').trim()
  if (!row || pwd.length < 8) {
    pushToast('초기 비밀번호(8자 이상)를 입력해 주세요.', 'warning')
    return
  }
  try {
    await approveAccountRequest(row.idx, { initialPassword: pwd })
    pushToast('승인 처리되었습니다.')
    closeApprove()
    await refreshRequests()
    await refreshList()
  } catch (e) {
    pushToast(e?.message || '승인 처리에 실패했습니다.', 'danger')
  }
}

function openReject(row) {
  rejectTarget.value = row
  rejectNote.value = ''
  rejectOpen.value = true
}

function closeReject() {
  rejectOpen.value = false
  rejectTarget.value = null
}

async function submitReject() {
  const row = rejectTarget.value
  if (!row) return
  try {
    await rejectAccountRequest(row.idx, { note: String(rejectNote.value || '').trim() || undefined })
    pushToast('거절 처리되었습니다.')
    closeReject()
    await refreshRequests()
  } catch (e) {
    pushToast(e?.message || '거절 처리에 실패했습니다.', 'danger')
  }
}

watch([modalOpen, approveOpen, rejectOpen], ([mo, ao, ro]) => {
  document.documentElement.style.overflow = mo || ao || ro ? 'hidden' : ''
})
</script>

<template>
  <div class="space-y-6 pb-10">
    <div
      v-if="toastMsg"
      class="fixed top-16 left-1/2 z-[100] max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg"
      :class="
        toastVariant === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : toastVariant === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-sky-200 bg-sky-50 text-sky-900'
      "
    >
      {{ toastMsg }}
    </div>

    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div class="flex items-start gap-3">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">{{ T.kicker }}</p>
          <h1 class="text-xl font-bold text-forena-900">{{ T.title }}</h1>
        </div>
      </div>
      <div class="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 shadow-sm hover:bg-flare-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="mainTab === 'status' ? loading : loadingRequests"
          @click="refreshCurrentTab"
        >
          <RefreshCw
            class="h-3.5 w-3.5 shrink-0 text-flare-600"
            :class="{ 'animate-spin': mainTab === 'status' ? loading : loadingRequests }"
          />
          {{ (mainTab === 'status' ? loading : loadingRequests) ? T.reloadBusy : T.reload }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-forena-800 hover:to-black"
          @click="openCreateModal"
        >
          <Plus class="h-3.5 w-3.5" />
          {{ T.newAccount }}
        </button>
      </div>
    </div>

    <!-- 공사 일보 스타일 세부 탭 -->
    <div class="-mb-px flex flex-wrap gap-1 border-b border-forena-200/80">
      <button
        type="button"
        class="border-b-2 px-4 py-2.5 text-xs font-bold transition"
        :class="
          mainTab === 'status'
            ? 'border-flare-500 text-flare-700'
            : 'border-transparent text-forena-500 hover:text-forena-700'
        "
        @click="mainTab = 'status'"
      >
        {{ T.tabStatus }}
      </button>
      <button
        type="button"
        class="border-b-2 px-4 py-2.5 text-xs font-bold transition"
        :class="
          mainTab === 'requests'
            ? 'border-flare-500 text-flare-700'
            : 'border-transparent text-forena-500 hover:text-forena-700'
        "
        @click="mainTab = 'requests'"
      >
        {{ T.tabRequests }}
      </button>
    </div>

    <!-- 현황 탭 · 근무자/파트너 목록형 플랫 보드 -->
    <template v-if="mainTab === 'status'">
      <section
        class="mt-6 overflow-hidden rounded-2xl border border-forena-100/90 bg-white shadow-card"
      >
        <div class="border-b border-forena-100/80 px-4 py-4 sm:px-5">
          <h2 class="text-base font-bold text-forena-900">{{ T.sectionAccountStatus }}</h2>
        </div>

        <div>
          <div
            v-for="sec in accSections"
            :key="sec.key"
            class="border-b border-slate-200/60 last:border-b-0"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between bg-slate-200/55 px-4 py-2.5 text-left text-sm font-bold text-forena-900 transition hover:bg-slate-200/75"
              @click="accordionToggle(sec.key)"
            >
              <div class="flex items-center gap-2">
                <ChevronDown v-if="expanded[sec.key]" class="h-3.5 w-3.5 shrink-0 text-forena-600" />
                <ChevronRight v-else class="h-3.5 w-3.5 shrink-0 text-forena-600" />
                <span>{{ sec.label }}</span>
                <span class="text-[11px] font-semibold tabular-nums text-forena-600">({{ sec.rows.length }})</span>
              </div>
            </button>

            <div v-show="expanded[sec.key]" class="bg-white">
              <div class="overflow-x-auto">
                <table class="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead>
                    <tr :class="accountStatusTheadClass">
                      <th class="w-[11%] px-3 py-2.5">{{ T.colLoginId }}</th>
                      <th class="w-[10%] px-3 py-2.5">{{ T.colName }}</th>
                      <th class="w-[12%] px-3 py-2.5">{{ T.colPhone }}</th>
                      <th class="w-[14%] px-3 py-2.5">{{ T.colEmail }}</th>
                      <th class="w-[12%] px-3 py-2.5">{{ T.colRole }}</th>
                      <th class="w-[11%] px-3 py-2.5">{{ T.colSite }}</th>
                      <th class="w-[10%] px-3 py-2.5">{{ T.colTrade }}</th>
                      <th class="w-[8%] px-3 py-2.5">{{ T.colStatus }}</th>
                      <th class="w-[12%] px-3 py-2.5 text-center">{{ T.colActions }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!sec.rows.length">
                      <td colspan="9" class="border-b border-slate-100/80 px-3 py-8 text-center text-xs text-slate-400">
                        표시할 계정이 없습니다.
                      </td>
                    </tr>
                    <tr
                      v-for="(row, ri) in sec.rows"
                      :key="row.idx"
                      class="border-b border-violet-100/40 transition hover:bg-violet-50/40"
                      :class="ri % 2 === 0 ? 'bg-white' : 'bg-violet-50/20'"
                    >
                      <td class="truncate px-3 py-2.5 font-mono text-xs text-forena-800">{{ row.loginId }}</td>
                      <td class="truncate px-3 py-2.5">
                        <span class="font-semibold text-forena-900">{{ row.name }}</span>
                      </td>
                      <td class="truncate px-3 py-2.5 text-xs">{{ row.phone || '—' }}</td>
                      <td class="truncate px-3 py-2.5 text-xs text-forena-700">{{ row.email || '—' }}</td>
                      <td class="truncate px-3 py-2.5 text-xs">{{ userRoleLabel(row.role) }}</td>
                      <td class="truncate px-3 py-2.5 text-xs">{{ row.siteCode || '—' }}</td>
                      <td class="truncate px-3 py-2.5 text-xs text-forena-700">{{ row.trade || '—' }}</td>
                      <td class="whitespace-nowrap px-3 py-2.5">
                        <span
                          class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1"
                          :class="
                            row.active
                              ? 'bg-sky-100 text-sky-900 ring-sky-200/80'
                              : 'bg-slate-100 text-slate-600 ring-slate-200/80'
                          "
                        >
                          {{ row.active ? T.active : T.inactive }}
                        </span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-2.5">
                        <div class="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-forena-700 hover:bg-slate-50"
                            @click="openEditModal(row)"
                          >
                            <Pencil class="h-3 w-3" />
                            {{ T.edit }}
                          </button>
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                            :disabled="!row.active"
                            @click="deactivateAccount(row)"
                          >
                            <Ban class="h-3 w-3" />
                            {{ T.del }}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- 요청 탭 — 현황과 동일하게 탭선·흰 카드·안쪽 여백 -->
    <template v-else>
      <section
        class="mt-6 overflow-hidden rounded-2xl border border-forena-100/90 bg-white shadow-card"
      >
        <div class="border-b border-forena-100/80 px-4 py-4 sm:px-5">
          <h2 class="text-base font-bold text-forena-900">{{ T.sectionRequests }}</h2>
        </div>

        <div class="px-4 py-5 sm:px-5 sm:py-6">
          <div
            v-if="!requestsBySite.length"
            class="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-14 text-center text-sm text-slate-500"
          >
            {{ T.noRequests }}
          </div>

          <div v-else class="space-y-5">
            <section
              v-for="bundle in requestsBySite"
              :key="bundle[0]"
              :class="panelClass"
            >
              <div :class="requestsBundleSiteHeaderClass">
                <p class="text-xs font-bold text-indigo-950">
                  <span class="text-indigo-500/90">{{ T.reqSiteHeader }}</span>
                  · {{ bundle[0] }}
                  <span class="ml-2 text-[11px] font-medium tabular-nums text-indigo-700/85">({{ bundle[1].length }})</span>
                </p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[1000px] table-fixed text-left text-sm">
                  <thead :class="requestsTableTheadClass">
                <tr>
                  <th class="w-[15%] px-4 py-3">{{ T.colReqAt }}</th>
                  <th class="w-[10%] px-4 py-3">{{ T.colReqType }}</th>
                  <th class="w-[10%] px-4 py-3">{{ T.colLoginId }}</th>
                  <th class="w-[9%] px-4 py-3">{{ T.colName }}</th>
                  <th class="w-[11%] px-4 py-3">{{ T.colRole }}</th>
                  <th class="w-[10%] px-4 py-3">{{ T.colSite }}</th>
                  <th class="w-[9%] px-4 py-3">{{ T.colTrade }}</th>
                  <th class="w-[9%] px-4 py-3">{{ T.colReqStatus }}</th>
                  <th class="w-[17%] px-4 py-3 text-center">{{ T.colActions }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-forena-50 text-forena-800">
                <tr v-for="rq in bundle[1]" :key="rq.idx ?? rq.id" class="hover:bg-forena-50/40">
                  <td class="whitespace-nowrap px-4 py-3 text-xs text-forena-600">{{ formatReqDate(rq) }}</td>
                  <td class="px-4 py-3 text-xs">{{ T.reqTypeCreate }}</td>
                  <td class="truncate px-4 py-3 font-mono text-xs">{{ rq.loginId ?? rq.requestedLoginId ?? '—' }}</td>
                  <td class="truncate px-4 py-3 font-medium">{{ rq.name ?? '—' }}</td>
                  <td class="truncate px-4 py-3 text-xs">{{ userRoleLabel(rq.role) }}</td>
                  <td class="truncate px-4 py-3">{{ rq.siteCode ?? '—' }}</td>
                  <td class="truncate px-4 py-3">{{ rq.trade ?? '—' }}</td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1"
                      :class="
                        isPendingRequest(rq)
                          ? 'bg-amber-50 text-amber-900 ring-amber-200/80'
                          : String(rq.status).toUpperCase() === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
                            : 'bg-slate-100 text-slate-600 ring-slate-200/80'
                      "
                    >
                      {{ statusLabel(rq.status) }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <div v-if="isPendingRequest(rq)" class="flex flex-wrap items-center justify-center gap-1.5">
                      <button
                        type="button"
                        class="rounded-lg bg-forena-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-forena-900"
                        @click="openApprove(rq)"
                      >
                        {{ T.reqApprove }}
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                        @click="openReject(rq)"
                      >
                        {{ T.reqReject }}
                      </button>
                    </div>
                    <span v-else class="block text-center text-[11px] text-forena-400">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
            </section>
          </div>
        </div>
      </section>
    </template>

    <!-- 계정 모달 -->
    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        @click.self="closeModal"
      >
        <div
          class="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-flare-100/90 bg-white shadow-[0_24px_64px_rgba(0,26,61,0.12)]"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-center justify-between border-b border-forena-100/80 px-4 py-3">
            <h2 class="text-sm font-bold text-forena-900">
              {{ modalMode === 'create' ? T.modalCreate : T.modalEdit }}
            </h2>
            <button type="button" class="rounded-lg p-1 text-forena-400 hover:bg-forena-50" @click="closeModal">
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <template v-if="modalMode === 'create'">
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">로그인 ID</span>
                <input
                  v-model="formCreate.loginId"
                  type="text"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2 text-sm font-mono"
                  autocomplete="off"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.pwdNew }}</span>
                <input
                  v-model="formCreate.password"
                  type="password"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2"
                  autocomplete="new-password"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.phone }}</span>
                <input v-model="formCreate.phone" type="tel" class="w-full rounded-lg border border-forena-200 px-3 py-2" />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.email }}</span>
                <input
                  v-model="formCreate.email"
                  type="email"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">이름</span>
                <input v-model="formCreate.name" type="text" class="w-full rounded-lg border border-forena-200 px-3 py-2" />
              </label>

              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.rolePickHint }}</span>
                <select
                  v-model="formCreate.role"
                  class="w-full rounded-lg border border-forena-200/90 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option v-for="ro in ROLE_OPTIONS" :key="ro.value" :value="ro.value">{{ ro.label }}</option>
                </select>
              </label>

              <label v-if="needsSiteForRole" class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.sitePick }}</span>
                <select
                  v-model.number="formCreate.projectIdx"
                  class="w-full rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm"
                >
                  <option :value="null">현장 선택</option>
                  <option v-for="p in projectOptions" :key="p.idx" :value="p.idx">
                    {{ p.name }}
                  </option>
                </select>
                <p v-if="selectedProjectLabel" class="mt-1 text-[10px] text-forena-400">선택: {{ selectedProjectLabel }}</p>
              </label>

              <label v-if="needsTrade" class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.tradePick }}</span>
                <span class="mb-1 block text-[10px] text-forena-400">{{ T.tradeHint }}</span>
                <select
                  v-model="formCreate.trade"
                  class="w-full rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                  :disabled="tradeLoading || formCreate.projectIdx == null"
                >
                  <option value="">{{ tradeLoading ? '불러오는 중…' : '공종 선택' }}</option>
                  <option v-for="t in tradeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
              </label>
            </template>

            <template v-else>
              <p class="rounded-lg bg-forena-50 px-3 py-2 text-[11px] text-forena-600">{{ T.loginIdRo }}</p>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">이름</span>
                <input
                  v-model="formEdit.name"
                  type="text"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.phone }}</span>
                <input v-model="formEdit.phone" type="tel" class="w-full rounded-lg border border-forena-200 px-3 py-2" />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.email }}</span>
                <input
                  v-model="formEdit.email"
                  type="email"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.rolePickHint }}</span>
                <select v-model="formEdit.role" class="w-full rounded-lg border border-forena-200 bg-white px-3 py-2">
                  <option v-for="ro in ROLE_OPTIONS" :key="ro.value" :value="ro.value">{{ ro.label }}</option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.colSite }} (코드)</span>
                <input
                  v-model="formEdit.siteCode"
                  type="text"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2 font-mono text-xs"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.colTrade }}</span>
                <input v-model="formEdit.trade" type="text" class="w-full rounded-lg border border-forena-200 px-3 py-2" />
              </label>
              <label class="flex cursor-pointer items-center gap-2 py-1">
                <input
                  v-model="formEdit.active"
                  type="checkbox"
                  class="h-4 w-4 rounded border-forena-300 text-flare-600"
                />
                <span class="text-[11px] font-bold text-forena-700">계정 사용</span>
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500"
                  >{{ T.pwdNew }}
                  <span class="font-normal text-forena-400">({{ T.pwdPlaceholderEdit }})</span></span
                >
                <input
                  v-model="formEdit.newPassword"
                  type="password"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2"
                  autocomplete="new-password"
                />
              </label>
            </template>
          </div>

          <div class="flex gap-2 border-t border-forena-100/80 bg-white px-4 py-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-forena-200 bg-white py-2.5 text-xs font-bold text-forena-700 hover:bg-white"
              @click="closeModal"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 py-2.5 text-xs font-bold text-white hover:from-forena-800 hover:to-black"
              @click="submitModal"
            >
              {{ T.save }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 승인 모달 -->
    <Teleport to="body">
      <div
        v-if="approveOpen"
        class="fixed inset-0 z-[210] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        @click.self="closeApprove"
      >
        <div class="w-full max-w-sm rounded-2xl border border-flare-100/90 bg-white p-4 shadow-xl">
          <h3 class="text-sm font-bold text-forena-900">{{ T.modalApproveTitle }}</h3>
          <label class="mt-3 block text-sm">
            <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.labelInitialPwd }}</span>
            <input
              v-model="approvePassword"
              type="password"
              class="w-full rounded-lg border border-forena-200 px-3 py-2"
              autocomplete="new-password"
            />
          </label>
          <div class="mt-4 flex gap-2">
            <button type="button" class="flex-1 rounded-lg border border-forena-200 py-2 text-xs font-bold" @click="closeApprove">
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-forena-800 py-2 text-xs font-bold text-white hover:bg-forena-900"
              @click="submitApprove"
            >
              {{ T.reqApprove }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 거절 모달 -->
    <Teleport to="body">
      <div
        v-if="rejectOpen"
        class="fixed inset-0 z-[210] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        @click.self="closeReject"
      >
        <div class="w-full max-w-sm rounded-2xl border border-flare-100/90 bg-white p-4 shadow-xl">
          <h3 class="text-sm font-bold text-forena-900">{{ T.modalRejectTitle }}</h3>
          <label class="mt-3 block text-sm">
            <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.labelRejectNote }}</span>
            <textarea
              v-model="rejectNote"
              rows="3"
              class="w-full rounded-lg border border-forena-200 px-3 py-2 text-sm"
            />
          </label>
          <div class="mt-4 flex gap-2">
            <button type="button" class="flex-1 rounded-lg border border-forena-200 py-2 text-xs font-bold" @click="closeReject">
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100"
              @click="submitReject"
            >
              {{ T.reqReject }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
