<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  Ban,
  Check,
} from 'lucide-vue-next'
import {
  getAdminAccounts,
  putAdminAccount,
} from '@/api/auth.js'
import { getProjectList, createProject, updateProject, deactivateProject, activateProject } from '@/api/project.js'
import { USER_ROLE, userRoleLabel } from '@/stores/authStore'
import {
  formatEmailInput,
  formatPhoneNumber,
  formatSiteCode,
  isValidEmail,
  isValidPhoneNumber,
  isValidSiteCode,
  normalizeEmail,
} from '@/utils/inputFormat'

const router = useRouter()

const T = {
  kicker: '시스템 관리',
  title: '계정 및 권한 관리',
  sectionAccountHub: '본사 계정 현황',
  grpSystem: '시스템 관리자',
  grpHQ: '본사',
  sectionSites: '현장 목록',
  reload: '목록 새로고침',
  reloadBusy: '불러오는 중…',
  registerSite: '신규 현장 등록',
  colProjectStatus: '상태',
  modalEditSite: '현장 정보 수정',
  colCode: '현장 코드',
  /** 현장 목록 표 전용 표시명 열 */
  colSiteDisplayName: '현장 명',
  /** 본사 계정 현황 표 — 계정(사용자) 이름 */
  colHubAccountName: '계정 명',
  colDirectorName: '현장 총 책임자',
  colDirectorPhone: '총 책임자 휴대폰',
  colAddress: '현장 주소',
  empty: '등록된 현장이 없습니다.',
  saveRegister: '등록',
  saveAccount: '저장',
  modalTitle: '신규 현장 등록',
  fieldCode: '현장 코드',
  fieldName: '현장 명',
  fieldAddress: '현장 주소',
  fieldStart: '시작일',
  fieldEnd: '종료일',
  cancel: '취소',
  codePh: '예: GN-A',
  namePh: '현장 표시명',
  addrPh: '도로명 또는 지번 주소',
  colLoginId: '로그인 ID',
  colPhone: '휴대폰',
  colEmail: '이메일',
  colRole: '권한',
  colTrade: '공종',
  colStatus: '상태',
  colActions: '관리',
  active: '사용 중',
  inactive: '비활성',
  edit: '수정',
  activate: '활성',
  del: '비활성',
  modalEdit: '계정 수정',
  loginIdRo: '로그인 ID는 수정할 수 없습니다.',
  rolePickHint: '권한 선택',
  phone: '휴대폰 번호',
  email: '이메일',
  lblAccountName: '계정명',
  pwdEditSectionTitle: '비밀번호 수정',
  pwdResetMail: '비밀번호 초기화',
  pwdResetMailAlert:
    '등록된 이메일로 비밀번호 재설정 메일을 발송했습니다.\n메일함을 확인해 주세요.',
}

/** 시스템·본사 전용 (현장 계정은 2페이지) */
const ROLE_OPTIONS_HUB = [
  { value: USER_ROLE.ADMIN, label: '시스템 관리자' },
  { value: USER_ROLE.HEADQUARTOR, label: '본사' },
]

function parseProjectLabel(name) {
  const s = String(name || '').trim()
  const m = /^\s*\[(?<code>[^\]]+)\]\s*(?<rest>.+)$/.exec(s)
  if (m?.groups) {
    return { code: m.groups.code.trim(), displayName: m.groups.rest.trim() }
  }
  return { code: '', displayName: s }
}

/** @param {Record<string, unknown>} p */
function projectSiteStatusLabel(p) {
  return p.active === false ? '운영 종료' : '운영 중'
}

/** @typedef {{ idx: number, loginId?: string, name?: string, role?: string, siteCode?: string|null, trade?: string|null, active?: boolean, phone?: string|null, email?: string|null }} Acc */

const loading = ref(false)
/** @type {import('vue').Ref<Array<Record<string, unknown> & { idx: number, name: string, location?: string }>>} */
const projects = ref([])
/** @type {import('vue').Ref<Acc[]>} */
const accounts = ref([])

const expanded = reactive({
  system: true,
  hq: true,
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
  const rs =
    r && typeof r === 'object' && r !== null && 'name' in r
      ? String(/** @type {{ name?: string }} */ (r).name || '')
      : String(r || '')
  if (rs === 'ADMIN') return 'system'
  if (rs === 'HEADQUARTOR') return 'hq'
  return 'field'
}

const groupedHub = computed(() => ({
  system: accounts.value.filter((a) => classify(a) === 'system'),
  hq: accounts.value.filter((a) => classify(a) === 'hq'),
}))

const hubSections = computed(() => [
  { key: /** @type {'system'} */ ('system'), label: T.grpSystem, rows: groupedHub.value.system },
  { key: /** @type {'hq'} */ ('hq'), label: T.grpHQ, rows: groupedHub.value.hq },
])

const accountStatusTheadClass =
  'border-b border-violet-200/70 bg-violet-100/45 text-xs font-bold text-violet-950'

/** role 객체/문자열 */
function rowRoleMatches(acc, roleStr) {
  const r = acc?.role
  const name = r && typeof r === 'object' && r !== null && 'name' in r ? String(/** @type {{ name?: string }} */ (r).name || '') : String(r || '')
  return name === roleStr
}

function directorFromAccounts(siteCodeRaw) {
  const siteCode = String(siteCodeRaw || '').trim()
  if (!siteCode) return null
  const candidates = accounts.value.filter(
    (a) =>
      rowRoleMatches(a, USER_ROLE.SITE_DIRECTOR) &&
      String(a?.siteCode || '').trim() === siteCode &&
      a?.active !== false,
  )
  if (!candidates.length) return null
  candidates.sort((x, y) => String(x?.name || '').localeCompare(String(y?.name || ''), 'ko'))
  return candidates[0]
}

function pickDirectorFields(p, accRow) {
  const n = p.siteDirectorName ?? p.directorName ?? p.managerName ?? accRow?.name
  const ph = p.siteDirectorPhone ?? p.directorPhone ?? p.managerPhone ?? accRow?.phone
  return {
    directorName: String(n || '').trim() || '—',
    directorPhone: String(ph || '').trim() || '—',
  }
}

async function refreshList() {
  loading.value = true
  try {
    const [list, accs] = await Promise.all([
      getProjectList(),
      getAdminAccounts().catch(() => []),
    ])
    projects.value = Array.isArray(list) ? list.slice() : []
    accounts.value = Array.isArray(accs) ? accs.slice() : []
  } catch (e) {
    window.alert(e?.message || '목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

const rows = computed(() =>
  projects.value.map((p) => {
    const { code, displayName } = parseProjectLabel(p.name)
    const accRow = directorFromAccounts(code)
    const { directorName, directorPhone } = pickDirectorFields(p, accRow)
    /** @type {Record<string, unknown>} */
    const pr = /** @type {Record<string, unknown>} */ (p)
    return {
      idx: p.idx,
      code: code || '—',
      displayName: displayName || '—',
      directorName,
      directorPhone,
      address: p.location?.trim() ? p.location : '—',
      statusLabel: projectSiteStatusLabel(pr),
      active: p.active !== false,
    }
  }),
)

onMounted(() => {
  refreshList()
})

function openSiteAccounts(idx) {
  router.push({ name: 'hrAccountsSite', params: { projectIdx: String(idx) } })
}

function accordionToggle(key) {
  expanded[key] = !expanded[key]
}

/** ——— 현장 등록 모달 ——— */
const siteModalOpen = ref(false)
const form = reactive({
  siteCode: '',
  siteName: '',
  address: '',
  startDate: '',
  endDate: '',
})

function openSiteModal() {
  form.siteCode = ''
  form.siteName = ''
  form.address = ''
  form.startDate = ''
  form.endDate = ''
  siteModalOpen.value = true
}

function closeSiteModal() {
  siteModalOpen.value = false
}

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function submitRegister() {
  const code = formatSiteCode(form.siteCode)
  const name = String(form.siteName || '').trim()
  const address = String(form.address || '').trim()
  form.siteCode = code
  if (!code || !name || !address) {
    window.alert('현장 코드, 현장 명, 주소를 모두 입력해 주세요.')
    return
  }
  if (!isValidSiteCode(code)) {
    window.alert('현장 코드는 영문 대문자/숫자/하이픈 조합 1~20자로 입력해 주세요.')
    return
  }
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    window.alert('종료일은 시작일보다 이후여야 합니다.')
    return
  }
  const combinedName = `[${code}] ${name}`
  const defaultStart = new Date()
  const defaultEnd = new Date(defaultStart)
  defaultEnd.setFullYear(defaultEnd.getFullYear() + 1)
  try {
    await createProject({
      name: combinedName,
      location: address,
      startDate: form.startDate || isoDate(defaultStart),
      endDate: form.endDate || isoDate(defaultEnd),
    })
    closeSiteModal()
    await refreshList()
  } catch (e) {
    window.alert(e?.message || '현장 등록에 실패했습니다.')
  }
}

/** ——— 현장 수정 모달 ——— */
const siteEditOpen = ref(false)
const editSiteForm = reactive({
  idx: 0,
  siteCode: '',
  siteName: '',
  address: '',
  startDate: '',
  endDate: '',
})

/** @param {{ idx: number }} row */
function openEditSite(row) {
  const p = projects.value.find((x) => x.idx === row.idx)
  if (!p) return
  const { code, displayName } = parseProjectLabel(String(p.name || ''))
  editSiteForm.idx = p.idx
  editSiteForm.siteCode = formatSiteCode(code)
  editSiteForm.siteName = displayName || ''
  editSiteForm.address = String(p.location ?? '').trim()
  const sd = p.startDate
  const ed = p.endDate
  editSiteForm.startDate = sd ? String(sd).slice(0, 10) : ''
  editSiteForm.endDate = ed ? String(ed).slice(0, 10) : ''
  siteEditOpen.value = true
}

function closeSiteEdit() {
  siteEditOpen.value = false
}

async function submitSiteEdit() {
  const code = formatSiteCode(editSiteForm.siteCode)
  const nm = String(editSiteForm.siteName || '').trim()
  const addr = String(editSiteForm.address || '').trim()
  editSiteForm.siteCode = code
  if (!code || !nm || !addr) {
    pushToast('현장 코드, 명, 주소를 확인해 주세요.', 'warning')
    return
  }
  if (!isValidSiteCode(code)) {
    pushToast('현장 코드는 영문 대문자/숫자/하이픈 조합 1~20자로 입력해 주세요.', 'warning')
    return
  }
  if (editSiteForm.startDate && editSiteForm.endDate && editSiteForm.endDate < editSiteForm.startDate) {
    pushToast('종료일은 시작일보다 이후여야 합니다.', 'warning')
    return
  }
  try {
    await updateProject(editSiteForm.idx, {
      name: `[${code}] ${nm}`,
      location: addr,
      startDate: editSiteForm.startDate || null,
      endDate: editSiteForm.endDate || null,
    })
    pushToast('현장 정보가 수정되었습니다.')
    closeSiteEdit()
    await refreshList()
  } catch (e) {
    pushToast(/** @type {Error} */ (e).message || '현장 수정에 실패했습니다.', 'danger')
  }
}

async function deactivateSite(row) {
  if (!row.active) return
  const ok = window.confirm(`'${row.displayName}' 현장을 운영 종료 처리할까요?\n이후 배치 인력 동기화 대상에서 제외됩니다.`)
  if (!ok) return
  try {
    await deactivateProject(row.idx)
    pushToast('현장이 운영 종료 처리되었습니다.')
    await refreshList()
  } catch (e) {
    pushToast(e?.message || '운영 종료 처리에 실패했습니다.', 'danger')
  }
}

async function activateSite(row) {
  if (row.active) return
  const ok = window.confirm(`'${row.displayName}' 현장을 운영 중으로 재개할까요?`)
  if (!ok) return
  try {
    await activateProject(row.idx)
    pushToast('현장이 운영 중으로 변경되었습니다.')
    await refreshList()
  } catch (e) {
    pushToast(e?.message || '운영 재개 처리에 실패했습니다.', 'danger')
  }
}

/** ——— 시스템·본사 계정 모달 ——— */
const modalOpen = ref(false)
const editingIdx = ref(/** @type {number|null} */ (null))

function rowRoleStr(acc) {
  const r = acc?.role
  if (r && typeof r === 'object' && r !== null && 'name' in r)
    return String(/** @type {{ name?: string }} */ (r).name || '')
  return String(r || '')
}

function accountUpdatePayload(row, overrides = {}) {
  const r = rowRoleStr(row)
  return {
    name: String(row?.name || '').trim(),
    phone:
      row?.phone != null && String(row.phone).trim() !== ''
        ? String(row.phone).trim()
        : undefined,
    email:
      row?.email != null && String(row.email).trim() !== ''
        ? String(row.email).trim()
        : undefined,
    role: r,
    siteCode: String(row?.siteCode || '').trim() || undefined,
    trade: String(row?.trade || '').trim() || undefined,
    active: Boolean(row?.active),
    ...overrides,
  }
}

const formEdit = reactive({
  name: '',
  phone: '',
  email: '',
  role: USER_ROLE.ADMIN,
})

/** @param {Acc} row */
function openEditModal(row) {
  editingIdx.value = row.idx
  formEdit.name = row.name || ''
  formEdit.phone = row.phone || ''
  formEdit.email = row.email || ''
  const rs = rowRoleStr(row) || USER_ROLE.ADMIN
  formEdit.role = ROLE_OPTIONS_HUB.some((o) => o.value === rs) ? rs : USER_ROLE.ADMIN
  modalOpen.value = true
}

function closeAccountModal() {
  modalOpen.value = false
  editingIdx.value = null
}

function notifyPasswordResetEmailSent() {
  window.alert(T.pwdResetMailAlert)
}

async function submitAccountModal() {
  const idx = editingIdx.value
  if (idx == null) return

  const name = String(formEdit.name || '').trim()
  const phone = formatPhoneNumber(formEdit.phone)
  const email = normalizeEmail(formEdit.email)
  formEdit.phone = phone
  formEdit.email = email

  if (!name) {
    pushToast('이름을 입력해 주세요.', 'warning')
    return
  }
  if (!isValidPhoneNumber(phone)) {
    pushToast('휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요.', 'warning')
    return
  }
  if (!isValidEmail(email)) {
    pushToast('이메일은 name@example.com 형식으로 입력해 주세요.', 'warning')
    return
  }

  const prevRow = accounts.value.find((a) => a.idx === idx)
  const siteCodeMerged =
    prevRow?.siteCode != null && String(prevRow.siteCode).trim() !== ''
      ? String(prevRow.siteCode).trim()
      : undefined
  const tradeMerged =
    prevRow?.trade != null && String(prevRow.trade).trim() !== ''
      ? String(prevRow.trade).trim()
      : undefined

  try {
    await putAdminAccount(idx, {
      name,
      phone: phone || undefined,
      email: email || undefined,
      role: formEdit.role,
      siteCode: siteCodeMerged,
      trade: tradeMerged,
      active: Boolean(prevRow?.active),
    })
    pushToast('계정이 수정되었습니다.')
    closeAccountModal()
    await refreshList()
  } catch (e) {
    pushToast(e?.message || '계정 수정에 실패했습니다.', 'danger')
  }
}

async function activateAccount(row) {
  if (!row || row.active) return
  const ok = window.confirm(`‘${row.name}’ 계정을 활성화할까요?`)
  if (!ok) return
  try {
    await putAdminAccount(row.idx, accountUpdatePayload(row, { active: true }))
    pushToast('활성화되었습니다.')
    await refreshList()
  } catch (e) {
    pushToast(e?.message || '활성화에 실패했습니다.', 'danger')
  }
}

async function deactivateAccount(row) {
  if (!row || !row.active) return
  const ok = window.confirm(`‘${row.name}’ 계정을 비활성화할까요?`)
  if (!ok) return
  try {
    await putAdminAccount(row.idx, accountUpdatePayload(row, { active: false }))
    pushToast('비활성화되었습니다.')
    await refreshList()
  } catch (e) {
    pushToast(e?.message || '비활성화에 실패했습니다.', 'danger')
  }
}

watch([modalOpen, siteModalOpen, siteEditOpen], ([mo, smo, seo]) => {
  document.documentElement.style.overflow = mo || smo || seo ? 'hidden' : ''
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

    <div class="flex shrink-0 flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">{{ T.kicker }}</p>
        <h1 class="text-xl font-bold text-forena-900">{{ T.title }}</h1>
      </div>
      <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-forena-800 hover:to-black"
          @click="openSiteModal"
        >
          <Plus class="h-3.5 w-3.5 shrink-0" />
          {{ T.registerSite }}
        </button>
      </div>
    </div>

    <!-- 본사 계정 현황 -->
    <section class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white shadow-card">
      <div class="border-b border-forena-100/80 px-4 py-4 sm:px-5">
        <h2 class="text-base font-bold text-forena-900">{{ T.sectionAccountHub }}</h2>
      </div>

      <div>
        <div
          v-for="sec in hubSections"
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
            <div class="border-t border-forena-100/70 px-4 pt-3 pb-px sm:px-5">
              <div class="overflow-x-auto">
              <table class="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead>
                  <tr :class="accountStatusTheadClass">
                    <th class="w-[13%] py-2.5 pl-5 pr-2 sm:pl-6">{{ T.colLoginId }}</th>
                    <th class="w-[12%] px-3 py-2.5">{{ T.colHubAccountName }}</th>
                    <th class="w-[14%] px-3 py-2.5">{{ T.colPhone }}</th>
                    <th class="w-[16%] px-3 py-2.5">{{ T.colEmail }}</th>
                    <th class="w-[14%] px-3 py-2.5">{{ T.colRole }}</th>
                    <th class="w-[10%] px-3 py-2.5">{{ T.colTrade }}</th>
                    <th class="w-[9%] px-3 py-2.5">{{ T.colStatus }}</th>
                    <th class="w-[12%] px-3 py-2.5 pr-5 text-center sm:pr-6">{{ T.colActions }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!sec.rows.length">
                    <td colspan="8" class="border-b border-slate-100/80 py-8 pl-5 pr-3 text-center text-xs text-slate-400 sm:pl-6 sm:pr-5">
                      표시할 계정이 없습니다.
                    </td>
                  </tr>
                  <tr
                    v-for="(row, ri) in sec.rows"
                    :key="row.idx"
                    class="border-b border-violet-100/40 transition hover:bg-violet-50/40"
                    :class="ri % 2 === 0 ? 'bg-white' : 'bg-violet-50/20'"
                  >
                    <td class="truncate py-2.5 pl-5 pr-2 font-mono text-xs text-forena-800 sm:pl-6">{{ row.loginId }}</td>
                    <td class="truncate px-3 py-2.5">
                      <span class="font-semibold text-forena-900">{{ row.name }}</span>
                    </td>
                    <td class="truncate px-3 py-2.5 text-xs">{{ row.phone || '—' }}</td>
                    <td class="truncate px-3 py-2.5 text-xs text-forena-700">{{ row.email || '—' }}</td>
                    <td class="truncate px-3 py-2.5 text-xs">{{ userRoleLabel(rowRoleStr(row)) }}</td>
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
                    <td class="whitespace-nowrap px-3 py-2.5 pr-5 sm:pr-6">
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
                          class="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"
                          :disabled="row.active"
                          @click="activateAccount(row)"
                        >
                          <Check class="h-3 w-3" />
                          {{ T.activate }}
                        </button>
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35"
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
      </div>
    </section>

    <!-- 현장 목록 -->
    <section class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white shadow-card">
      <div class="border-b border-forena-100/80 px-4 py-4 sm:px-5">
        <h2 class="text-base font-bold text-forena-900">{{ T.sectionSites }}</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-left text-sm">
          <thead
            class="border-b border-forena-100 bg-forena-50/70 text-[11px] font-bold uppercase tracking-wide text-forena-500"
          >
            <tr>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colCode }}</th>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colSiteDisplayName }}</th>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colDirectorName }}</th>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colDirectorPhone }}</th>
              <th class="px-3 py-3">{{ T.colAddress }}</th>
              <th class="whitespace-nowrap px-3 py-3">{{ T.colProjectStatus }}</th>
              <th class="whitespace-nowrap px-3 py-3 text-center">관리</th>
              <th class="w-10 px-2 py-3 text-center">
                <span class="sr-only">상세 이동</span>
              </th>
            </tr>
          </thead>
          <tbody class="text-forena-800">
            <tr v-if="!rows.length">
              <td colspan="8" class="px-3 py-10 text-center text-sm text-slate-400">{{ T.empty }}</td>
            </tr>
            <tr
              v-for="r in rows"
              :key="r.idx"
              class="cursor-pointer border-b border-forena-50 transition hover:bg-flare-50/40"
              role="button"
              tabindex="0"
              @click="openSiteAccounts(r.idx)"
              @keydown.enter.prevent="openSiteAccounts(r.idx)"
            >
              <td class="whitespace-nowrap px-3 py-3 font-mono text-xs">{{ r.code }}</td>
              <td class="px-3 py-3 font-semibold text-forena-900">{{ r.displayName }}</td>
              <td class="whitespace-nowrap px-3 py-3">{{ r.directorName }}</td>
              <td class="whitespace-nowrap px-3 py-3 text-xs">{{ r.directorPhone }}</td>
              <td class="px-3 py-3 text-xs text-forena-700">{{ r.address }}</td>
              <td class="whitespace-nowrap px-3 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1"
                  :class="
                    r.statusLabel === '운영 종료'
                      ? 'bg-slate-100 text-slate-700 ring-slate-200/80'
                      : 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
                  "
                >
                  {{ r.statusLabel }}
                </span>
              </td>
              <td class="px-3 py-3 text-center" @click.stop>
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-forena-700 hover:bg-slate-50"
                    @click="openEditSite(r)"
                  >
                    <Pencil class="h-3 w-3" />
                    {{ T.edit }}
                  </button>
                  <button
                    v-if="r.active"
                    type="button"
                    class="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                    @click="deactivateSite(r)"
                  >
                    <Ban class="h-3 w-3" />
                    비활성화
                  </button>
                  <button
                    v-else
                    type="button"
                    class="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50"
                    @click="activateSite(r)"
                  >
                    <Check class="h-3 w-3" />
                    활성화
                  </button>
                </div>
              </td>
              <td class="px-2 py-3 text-center text-forena-400" aria-hidden="true">
                <ChevronRight class="mx-auto h-4 w-4" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 신규 현장 등록 -->
    <Teleport to="body">
      <div
        v-if="siteModalOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        @click.self="closeSiteModal"
      >
        <div
          class="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-forena-100 bg-white shadow-[0_24px_64px_rgba(0,26,61,0.12)]"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-center justify-between border-b border-forena-50 px-4 py-3">
            <h2 class="text-sm font-bold text-forena-900">{{ T.modalTitle }}</h2>
            <button type="button" class="rounded-lg p-1 text-forena-400 hover:bg-forena-50" @click="closeSiteModal">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-3 px-4 py-4 text-sm">
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldCode }}</span>
              <input
                v-model="form.siteCode"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 font-mono text-sm"
                :placeholder="T.codePh"
                maxlength="20"
                spellcheck="false"
                autocapitalize="characters"
                autocomplete="off"
                @input="form.siteCode = formatSiteCode(form.siteCode)"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldName }}</span>
              <input
                v-model="form.siteName"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2"
                :placeholder="T.namePh"
                maxlength="60"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldAddress }}</span>
              <input
                v-model="form.address"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2"
                :placeholder="T.addrPh"
                maxlength="120"
              />
            </label>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldStart }}</span>
                <input
                  v-model="form.startDate"
                  type="date"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2 text-sm"
                  :max="form.endDate || undefined"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldEnd }}</span>
                <input
                  v-model="form.endDate"
                  type="date"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2 text-sm"
                  :min="form.startDate || undefined"
                />
              </label>
            </div>
          </div>
          <div class="flex gap-2 border-t border-forena-50 bg-forena-50/40 px-4 py-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-forena-200 bg-white py-2.5 text-xs font-bold text-forena-700"
              @click="closeSiteModal"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 py-2.5 text-xs font-bold text-white hover:from-forena-800 hover:to-black"
              @click="submitRegister"
            >
              {{ T.saveRegister }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 현장 정보 수정 -->
    <Teleport to="body">
      <div
        v-if="siteEditOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        @click.self="closeSiteEdit"
      >
        <div
          class="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-forena-100 bg-white shadow-[0_24px_64px_rgba(0,26,61,0.12)]"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-center justify-between border-b border-forena-50 px-4 py-3">
            <h2 class="text-sm font-bold text-forena-900">{{ T.modalEditSite }}</h2>
            <button type="button" class="rounded-lg p-1 text-forena-400 hover:bg-forena-50" @click="closeSiteEdit">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-3 px-4 py-4 text-sm">
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldCode }}</span>
              <input
                v-model="editSiteForm.siteCode"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 font-mono text-sm"
                :placeholder="T.codePh"
                maxlength="20"
                spellcheck="false"
                autocapitalize="characters"
                autocomplete="off"
                @input="editSiteForm.siteCode = formatSiteCode(editSiteForm.siteCode)"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldName }}</span>
              <input
                v-model="editSiteForm.siteName"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2"
                :placeholder="T.namePh"
                maxlength="60"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldAddress }}</span>
              <input
                v-model="editSiteForm.address"
                type="text"
                class="w-full rounded-lg border border-forena-200 px-3 py-2"
                :placeholder="T.addrPh"
                maxlength="120"
              />
            </label>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldStart }}</span>
                <input
                  v-model="editSiteForm.startDate"
                  type="date"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2 text-sm"
                  :max="editSiteForm.endDate || undefined"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.fieldEnd }}</span>
                <input
                  v-model="editSiteForm.endDate"
                  type="date"
                  class="w-full rounded-lg border border-forena-200 px-3 py-2 text-sm"
                  :min="editSiteForm.startDate || undefined"
                />
              </label>
            </div>
          </div>
          <div class="flex gap-2 border-t border-forena-50 bg-forena-50/40 px-4 py-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-forena-200 bg-white py-2.5 text-xs font-bold text-forena-700"
              @click="closeSiteEdit"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 py-2.5 text-xs font-bold text-white hover:from-forena-800 hover:to-black"
              @click="submitSiteEdit"
            >
              {{ T.saveAccount }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 시스템·본사 계정 모달 -->
    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        @click.self="closeAccountModal"
      >
        <div
          class="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-flare-100/90 bg-white shadow-[0_24px_64px_rgba(0,26,61,0.12)]"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-center justify-between border-b border-forena-100/80 px-4 py-3">
            <h2 class="text-sm font-bold text-forena-900">{{ T.modalEdit }}</h2>
            <button type="button" class="rounded-lg p-1 text-forena-400 hover:bg-forena-50" @click="closeAccountModal">
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            <p class="rounded-lg bg-forena-50 px-3 py-2 text-[11px] text-forena-600">{{ T.loginIdRo }}</p>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.lblAccountName }}</span>
              <input v-model="formEdit.name" type="text" class="w-full rounded-lg border border-forena-200 px-3 py-2" maxlength="30" autocomplete="name" />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.phone }}</span>
              <input
                v-model="formEdit.phone"
                type="tel"
                class="w-full rounded-lg border border-forena-200 px-3 py-2"
                placeholder="010-1234-5678"
                inputmode="tel"
                maxlength="13"
                autocomplete="tel"
                @input="formEdit.phone = formatPhoneNumber(formEdit.phone)"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.email }}</span>
              <input
                v-model="formEdit.email"
                type="email"
                class="w-full rounded-lg border border-forena-200 px-3 py-2"
                placeholder="name@example.com"
                maxlength="80"
                autocomplete="email"
                @input="formEdit.email = formatEmailInput(formEdit.email)"
                @blur="formEdit.email = normalizeEmail(formEdit.email)"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.rolePickHint }}</span>
              <select v-model="formEdit.role" class="w-full rounded-lg border border-forena-200 bg-white px-3 py-2">
                <option v-for="ro in ROLE_OPTIONS_HUB" :key="ro.value" :value="ro.value">{{ ro.label }}</option>
              </select>
            </label>
            <div class="mt-3 space-y-2 border-t border-forena-100 pt-3">
              <p class="text-[11px] font-bold text-black">{{ T.pwdEditSectionTitle }}</p>
              <button
                type="button"
                class="w-full rounded-lg border border-forena-200 bg-white py-2 text-xs font-bold text-black shadow-sm transition hover:bg-slate-50"
                @click="notifyPasswordResetEmailSent"
              >
                {{ T.pwdResetMail }}
              </button>
            </div>
          </div>

          <div class="flex gap-2 border-t border-forena-100/80 bg-white px-4 py-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-forena-200 bg-white py-2.5 text-xs font-bold text-forena-700 hover:bg-white"
              @click="closeAccountModal"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 py-2.5 text-xs font-bold text-white hover:from-forena-800 hover:to-black"
              @click="submitAccountModal"
            >
              {{ T.saveAccount }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
