<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Ban,
  Check,
  X,
  RefreshCw,
  ArrowLeft,
} from 'lucide-vue-next'
import {
  getAdminAccounts,
  postAdminAccount,
  putAdminAccount,
  getAdminAccountRequests,
  approveAccountRequest,
  rejectAccountRequest,
} from '@/api/auth.js'
import { getProjectList, getMilestoneTradeNames } from '@/api/project.js'
import { userRoleLabel, USER_ROLE } from '@/stores/authStore'

const T = {
  kicker: '시스템 관리',
  title: '계정 및 권한 관리',
  tabStatus: '계정 및 권한 현황',
  tabRequests: '요청 및 승인',
  sectionAccountStatus: '근무자 계정 현황',
  sectionSiteDirectorAccounts: '현장 총 책임자',
  workerSubTabHQ: '본사 직영',
  workerSubTabByTrade: '공종별',
  tradeUnassigned: '공종 미지정',
  sectionRequests: '요청 및 승인',
  reload: '목록 새로고침',
  reloadBusy: '불러오는 중…',
  newAccount: '신규 계정 생성',
  colLoginId: '로그인 ID',
  colWorkerName: '근무자 명',
  colWorkerPhone: '근무자 휴대폰',
  colWorkerRole: '근무자 권한',
  colWorkerTrade: '근무자 공종',
  colName: '이름',
  colPhone: '휴대폰',
  colEmail: '이메일',
  colRole: '권한',
  colSite: '현장',
  colTrade: '공종',
  colStatus: '상태',
  colActions: '관리',
  colReqAt: '요청 일시',
  colReqTitle: '요청 제목',
  colReqRequesterRole: '요청자 권한',
  colReqStatus: '처리 상태',
  reqTypeCreate: '계정·권한',
  reqApprove: '승인',
  reqReject: '거절',
  noRequests: '접수된 요청이 없습니다.',
  demoRequestHint: '예시 데이터 — API로 처리되지 않습니다.',
  detailModalTitle: '요청 상세',
  lblDetailAt: '요청 일시',
  lblDetailSite: '현장명',
  lblDetailName: '요청자명',
  lblDetailRole: '요청자 권한',
  lblDetailTrade: '공종',
  lblDetailRequestedLoginId: '신규 계정 로그인 ID',
  lblDetailRequestedName: '신규 계정 이름',
  lblDetailRequestedRole: '신규 계정 권한',
  lblDetailSiteCode: '현장 코드',
  lblDetailRejectNote: '거절 사유',
  lblDetailBody: '요약·비고',
  active: '사용 중',
  inactive: '비활성',
  edit: '수정',
  activate: '활성',
  del: '비활성',
  lblAccountName: '계정명',
  modalCreate: '신규 계정 생성',
  modalEdit: '계정 수정',
  save: '저장',
  cancel: '취소',
  pwdNew: '비밀번호 (8자 이상)',
  loginIdRo: '로그인 ID는 수정할 수 없습니다.',
  modalApproveTitle: '요청 승인',
  modalRejectTitle: '요청 거절',
  labelInitialPwd: '초기 비밀번호 (선택)',
  approvePwdOptionalHint: '비워 두면 서버에서 임시 비밀번호를 자동 생성합니다. 직접 지정할 때만 8자 이상 입력하세요.',
  labelRejectNote: '거절 사유 (선택)',
  rolePickHint: '권한 선택',
  sitePick: '현장 명',
  pwdEditSectionTitle: '비밀번호 수정',
  pwdResetMail: '비밀번호 초기화',
  pwdResetMailAlert:
    '등록된 이메일로 비밀번호 재설정 메일을 발송했습니다.\n메일함을 확인해 주세요.',
  tradePick: '공종',
  tradeHint: '공종별 책임자·관리자만 선택',
  phone: '휴대폰 번호',
  email: '이메일',
  backToSites: '현장 목록',
  bulkComplete: '완료',
  bulkDismiss: '반려',
  reqDetailBtn: '상세보기',
  colReqDetail: '상세',
  bulkRejectModalTitle: '선택 요청 반려',
  bulkNoEligible: '대기 상태인 요청을 하나 이상 선택해 주세요.',
  srSelectColumn: '선택',
}

const ROLE_OPTIONS = [
  { value: USER_ROLE.ADMIN, label: '시스템 관리자' },
  { value: USER_ROLE.HEADQUARTOR, label: '본사' },
  { value: USER_ROLE.SITE_MANAGER, label: '현장 관리자' },
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

const route = useRoute()
const router = useRouter()

const projectIdxParam = computed(() => {
  const n = Number(route.params.projectIdx)
  return Number.isFinite(n) ? Math.trunc(n) : NaN
})

const projectsReady = ref(false)

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

const workerAffiliationTab = ref(/** @type {'hq' | 'trade'} */ ('hq'))

/** 공종별 아코디언 펼침 상태 (헤더 라벨 키) */
const tradeAccordionOpen = reactive(/** @type {Record<string, boolean>} */ ({}))

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

function rowRoleStr(acc) {
  const r = acc?.role
  if (r && typeof r === 'object' && r !== null && 'name' in r)
    return String(/** @type {{ name?: string }} */ (r).name || '')
  return String(r || '')
}

const currentProject = computed(() => {
  const idx = projectIdxParam.value
  if (!Number.isFinite(idx)) return null
  return projectOptions.value.find((p) => p.idx === idx) ?? null
})

const currentSiteCode = computed(() => {
  const p = currentProject.value
  if (!p) return ''
  const { code } = parseProjectLabel(p.name)
  return String(code || '').trim()
})

const currentSiteDisplay = computed(() => {
  const p = currentProject.value
  if (!p) return '—'
  const { code, title } = parseProjectLabel(p.name)
  if (code && title) return `[${code}] ${title}`
  return String(p.name || '').trim() || '—'
})

const sortedProjectOptions = computed(() =>
  [...projectOptions.value].sort((a, b) =>
    parseProjectLabel(a.name).title.localeCompare(parseProjectLabel(b.name).title, 'ko'),
  ),
)

function ensureValidProjectRoute() {
  const idx = projectIdxParam.value
  if (!Number.isFinite(idx)) {
    router.replace({ name: 'hrAccounts' })
    return false
  }
  if (!projectOptions.value.some((p) => p.idx === idx)) {
    router.replace({ name: 'hrAccounts' })
    return false
  }
  return true
}

function goBackToSiteHub() {
  router.push({ name: 'hrAccounts' })
}

function onSiteSwitcherChange(ev) {
  const el = /** @type {HTMLSelectElement} */ (ev.target)
  const n = Number(el.value)
  if (!Number.isFinite(n)) return
  router.push({ name: 'hrAccountsSite', params: { projectIdx: String(n) } })
}

const fieldAccounts = computed(() => {
  const code = currentSiteCode.value.trim()
  return accounts.value.filter((a) => {
    if (classify(a) !== 'field') return false
    if (!code) return true
    return String(a?.siteCode || '').trim() === code
  })
})

/** API에 소속 타입이 있으면 우선, 없으면 역할로 본사 직영 vs 협력체 구분 */
function workerAffiliationKind(acc) {
  const raw = acc?.affiliationType ?? acc?.affiliation ?? acc?.workerType ?? acc?.orgType
  if (raw != null && String(raw).trim() !== '') {
    const s = String(raw).toUpperCase()
    if (
      s.includes('PARTNER') ||
      s.includes('VENDOR') ||
      s.includes('협력') ||
      s === 'SUBCONTRACTOR'
    )
      return 'partner'
    if (s.includes('HQ') || s.includes('직영') || s === 'INTERNAL' || s === 'DIRECT') return 'hq'
  }
  const r = rowRoleStr(acc)
  if (r === USER_ROLE.SECTION_LEADER || r === USER_ROLE.SECTION_SUPERVISOR) return 'partner'
  return 'hq'
}

function isSiteDirectorAccount(acc) {
  return rowRoleStr(acc) === USER_ROLE.SITE_DIRECTOR
}

/** 현장 총 책임자만 상단 블록 (본사 직영·공종별 목록에서는 제외) */
const directorFieldAccounts = computed(() =>
  fieldAccounts.value.filter((a) => isSiteDirectorAccount(a)),
)

const hqFieldAccounts = computed(() =>
  fieldAccounts.value.filter(
    (a) => workerAffiliationKind(a) === 'hq' && !isSiteDirectorAccount(a),
  ),
)
const tradeFieldAccounts = computed(() =>
  fieldAccounts.value.filter(
    (a) => workerAffiliationKind(a) === 'partner' && !isSiteDirectorAccount(a),
  ),
)

const tradeGroupedRows = computed(() => {
  const map = new Map()
  for (const acc of tradeFieldAccounts.value) {
    const raw = String(acc?.trade || '').trim()
    const label = raw || T.tradeUnassigned
    if (!map.has(label)) map.set(label, [])
    map.get(label).push(acc)
  }
  const pairs = [...map.entries()]
  pairs.sort((a, b) => {
    if (a[0] === T.tradeUnassigned) return 1
    if (b[0] === T.tradeUnassigned) return -1
    return a[0].localeCompare(b[0], 'ko')
  })
  return pairs
})

watch(
  tradeGroupedRows,
  (pairs) => {
    for (const [label] of pairs) {
      if (tradeAccordionOpen[label] === undefined) tradeAccordionOpen[label] = true
    }
    const keep = new Set(pairs.map(([l]) => l))
    for (const k of Object.keys(tradeAccordionOpen)) {
      if (!keep.has(k)) delete tradeAccordionOpen[k]
    }
  },
  { immediate: true },
)

function toggleTradeAccordion(label) {
  tradeAccordionOpen[label] = !tradeAccordionOpen[label]
}

watch(fieldAccounts, (rows) => {
  const hasHq = rows.some(
    (a) => workerAffiliationKind(a) === 'hq' && !isSiteDirectorAccount(a),
  )
  const hasTradeTab = rows.some(
    (a) => workerAffiliationKind(a) === 'partner' && !isSiteDirectorAccount(a),
  )
  if (!hasHq && hasTradeTab && workerAffiliationTab.value === 'hq') {
    workerAffiliationTab.value = 'trade'
  } else if (hasHq && !hasTradeTab && workerAffiliationTab.value === 'trade') {
    workerAffiliationTab.value = 'hq'
  }
})

const requestsTableTheadClass =
  'sticky top-0 z-[1] border-b border-violet-200/70 bg-violet-100/45 text-xs font-bold text-violet-950'

/** 테이블 컬럼 헤더 — 분류 행과 구분되는 연보라 톤 */
const accountStatusTheadClass =
  'border-b border-violet-200/70 bg-violet-100/45 text-xs font-bold text-violet-950'

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

/** 요청 행 — 신규 계정 부여 권한 (AccountRequestDto.requestedRole) */
function requestRowRequestedRoleStr(rq) {
  const r = rq?.requestedRole
  if (r && typeof r === 'object' && r !== null && 'name' in r)
    return String(/** @type {{ name?: string }} */ (r).name || '')
  return String(r || '')
}

/** 요청 행 — role 문자열 (요청자 권한 = Res.role) */
function requestRowRoleStr(rq) {
  const r = rq?.role
  if (r && typeof r === 'object' && r !== null && 'name' in r)
    return String(/** @type {{ name?: string }} */ (r).name || '')
  return String(r || '')
}

/** 목록/상세 공통: 요청 한 줄 제목 */
function requestRowTitle(rq) {
  const t = rq?.title ?? rq?.requestTitle ?? rq?.subject
  const ts = String(t || '').trim()
  if (ts) return ts
  const lid = String(rq?.requestedLoginId ?? rq?.loginId ?? '').trim()
  const nm = String(rq?.requestedName ?? '').trim()
  if (lid && nm) return `${nm} · ${lid}`
  if (lid) return lid
  if (nm) return nm
  return T.reqTypeCreate
}

/** 상세 보조 텍스트 (자유 입력 필드 + 백엔드 note 등) */
function requestRowDetailText(rq) {
  const parts = []
  const d = rq?.detail ?? rq?.content ?? rq?.description ?? rq?.memo ?? rq?.body
  const ds = String(d || '').trim()
  if (ds) parts.push(ds)
  const note = String(rq?.note ?? '').trim()
  if (note && String(rq?.status || '').toUpperCase() === 'REJECTED') parts.push(`${T.lblDetailRejectNote}: ${note}`)
  if (!parts.length) {
    const rc = []
    const site = String(rq?.siteCode ?? '').trim()
    const tr = String(rq?.trade ?? '').trim()
    if (site) rc.push(`${T.lblDetailSiteCode} ${site}`)
    if (tr) rc.push(`${T.lblDetailTrade} ${tr}`)
    return rc.length ? rc.join(' · ') : '—'
  }
  return parts.join('\n\n')
}

/** 상세 모달 현장명 — API 필드 우선, 없으면 상단 선택 현장 */
function requestSiteNameForDetail(rq) {
  if (!rq) return '—'
  const code = String(rq.siteCode ?? '').trim()
  if (code) return code
  const n = rq.projectName ?? rq.siteName ?? rq.siteDisplayName
  if (n != null && String(n).trim() !== '') return String(n).trim()
  return currentSiteDisplay.value
}

/** UI 확인용 요청 및 승인 탭 더미 (API 응답 앞에 표시) */
const accountRequestsDummy = computed(() => {
  const code = currentSiteCode.value.trim()
  const when = new Date()
  when.setHours(when.getHours() - 2)
  const iso = when.toISOString()
  return [
    {
      idx: 'demo-acc-req-1',
      demo: true,
      status: 'PENDING',
      createdAt: iso,
      title: '협력체 계정 신규 요청',
      detail:
        '현장 협력사 소속 근로자 계정 발급을 요청드립니다.\n안전관리팀 검토 후 회신 부탁드립니다.',
      loginId: 'demo.kim.req',
      requestedLoginId: 'demo.kim.new',
      requestedName: '김신규',
      requestedRole: USER_ROLE.SITE_DIRECTOR,
      name: '김요청',
      role: USER_ROLE.SECTION_SUPERVISOR,
      siteCode: code || undefined,
      trade: '토목',
    },
    {
      idx: 'demo-acc-req-2',
      demo: true,
      status: 'PENDING',
      createdAt: iso,
      title: '공종별 권한 변경 요청',
      detail: '골조 공정 담당자 권한을 공종별 책임자로 상향 조정해 주시기 바랍니다.',
      loginId: 'demo.lee.req',
      requestedLoginId: 'demo.lee.new',
      requestedName: '이신규',
      requestedRole: USER_ROLE.SECTION_LEADER,
      name: '이협력',
      role: USER_ROLE.SECTION_LEADER,
      siteCode: code || undefined,
      trade: '골조',
    },
  ]
})

const accountRequestsWithDummy = computed(() => [
  ...accountRequestsDummy.value,
  ...accountRequests.value,
])

const accountRequestsFiltered = computed(() => {
  const list = accountRequestsWithDummy.value
  const code = currentSiteCode.value.trim()
  if (!code) return list
  return list.filter((r) => requestSiteKey(r) === code)
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
  /** @type {number|null} */
  projectIdx: null,
  trade: '',
})

const editTradeLoading = ref(false)
/** @type {import('vue').Ref<string[]>} */
const editTradeOptions = ref([])

const editNeedsSite = computed(() =>
  [
    USER_ROLE.SITE_MANAGER,
    USER_ROLE.SITE_DIRECTOR,
    USER_ROLE.SECTION_LEADER,
    USER_ROLE.SECTION_SUPERVISOR,
  ].includes(formEdit.role),
)

const editNeedsTrade = computed(() =>
  [USER_ROLE.SECTION_LEADER, USER_ROLE.SECTION_SUPERVISOR].includes(formEdit.role),
)

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

function findProjectIdxForAccountRow(row) {
  const code = String(row?.siteCode || '').trim()
  if (code) {
    const match = projectOptions.value.find((p) => parseProjectLabel(p.name).code === code)
    if (match) return match.idx
  }
  const routeIdx = projectIdxParam.value
  return Number.isFinite(routeIdx) ? routeIdx : null
}

async function loadEditTradeOptions(projectId) {
  if (projectId == null) {
    editTradeOptions.value = []
    return
  }
  editTradeLoading.value = true
  try {
    const list = await getMilestoneTradeNames(projectId)
    editTradeOptions.value = Array.isArray(list)
      ? [...list].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ko'))
      : []
  } catch {
    editTradeOptions.value = []
  } finally {
    editTradeLoading.value = false
  }
}

const needsSiteForRole = computed(() =>
  [
    USER_ROLE.SITE_MANAGER,
    USER_ROLE.SITE_DIRECTOR,
    USER_ROLE.SECTION_LEADER,
    USER_ROLE.SECTION_SUPERVISOR,
  ].includes(formCreate.role),
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
    if (pid == null) return
    tradeLoading.value = true
    try {
      const list = await getMilestoneTradeNames(pid)
      tradeOptions.value = Array.isArray(list)
        ? [...list].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ko'))
        : []
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

watch(
  () => formEdit.role,
  (r) => {
    if (!modalOpen.value || modalMode.value !== 'edit') return
    const siteRoles = [
      USER_ROLE.SITE_MANAGER,
      USER_ROLE.SITE_DIRECTOR,
      USER_ROLE.SECTION_LEADER,
      USER_ROLE.SECTION_SUPERVISOR,
    ]
    if (!siteRoles.includes(r)) {
      formEdit.projectIdx = null
      formEdit.trade = ''
      editTradeOptions.value = []
      return
    }
    if (![USER_ROLE.SECTION_LEADER, USER_ROLE.SECTION_SUPERVISOR].includes(r)) {
      formEdit.trade = ''
    }
  },
)

watch(
  () => [modalOpen.value, modalMode.value, formEdit.projectIdx, formEdit.role],
  async ([mo, mm, pid, role]) => {
    if (!mo || mm !== 'edit') return
    if (![USER_ROLE.SECTION_LEADER, USER_ROLE.SECTION_SUPERVISOR].includes(role)) {
      editTradeOptions.value = []
      return
    }
    await loadEditTradeOptions(pid)
  },
)

async function loadProjects() {
  try {
    const list = await getProjectList()
    projectOptions.value = Array.isArray(list) ? list.slice() : []
  } catch {
    projectOptions.value = []
  } finally {
    projectsReady.value = true
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

onMounted(async () => {
  await loadProjects()
  if (!ensureValidProjectRoute()) return
  await refreshList()
  await refreshRequests()
})

watch(
  () => route.params.projectIdx,
  async () => {
    workerAffiliationTab.value = 'hq'
    if (!projectsReady.value) return
    if (!ensureValidProjectRoute()) return
    await refreshList()
    await refreshRequests()
  },
)

watch(mainTab, (t) => {
  if (t === 'requests') refreshRequests()
})

function openCreateModal() {
  modalMode.value = 'create'
  formCreate.loginId = ''
  formCreate.password = ''
  formCreate.name = ''
  formCreate.phone = ''
  formCreate.email = ''
  formCreate.role = USER_ROLE.SITE_DIRECTOR
  formCreate.projectIdx = Number.isFinite(projectIdxParam.value) ? projectIdxParam.value : null
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
  formEdit.role = rowRoleStr(row) || USER_ROLE.SITE_DIRECTOR
  formEdit.projectIdx = findProjectIdxForAccountRow(row)
  formEdit.trade = row.trade || ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  editingIdx.value = null
}

function notifyPasswordResetEmailSent() {
  window.alert(T.pwdResetMailAlert)
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

function deriveSiteCodeFromEditForm() {
  if (!editNeedsSite.value) return undefined
  const idx = formEdit.projectIdx
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

  if (editNeedsSite.value && formEdit.projectIdx == null) {
    pushToast('현장을 선택해 주세요.', 'warning')
    return
  }
  if (editNeedsTrade.value) {
    if (!String(formEdit.trade || '').trim()) {
      pushToast('공종을 선택해 주세요.', 'warning')
      return
    }
  }
  const siteCodePut = editNeedsSite.value ? deriveSiteCodeFromEditForm() : undefined
  if (editNeedsSite.value && !siteCodePut) {
    pushToast(
      '선택한 현장에서 현장 코드를 확인할 수 없습니다. 현장 등록 형식을 [코드] 표시명 인지 확인해 주세요.',
      'warning',
    )
    return
  }
  const tradePut = editNeedsTrade.value ? String(formEdit.trade || '').trim() || undefined : undefined
  const prevRow = accounts.value.find((a) => a.idx === idx)

  /** 관리자·본사 등 현장 폼 미노출 시 기존 값 유지 */
  let siteCodeMerged
  if (editNeedsSite.value) {
    siteCodeMerged = siteCodePut
  } else if (prevRow?.siteCode != null && String(prevRow.siteCode).trim() !== '') {
    siteCodeMerged = String(prevRow.siteCode).trim()
  } else {
    siteCodeMerged = undefined
  }

  let tradeMerged
  if (editNeedsTrade.value) {
    tradeMerged = tradePut
  } else if (prevRow?.trade != null && String(prevRow.trade).trim() !== '') {
    tradeMerged = String(prevRow.trade).trim()
  } else {
    tradeMerged = undefined
  }

  try {
    await putAdminAccount(idx, {
      name: String(formEdit.name || '').trim(),
      phone: String(formEdit.phone || '').trim() || undefined,
      email: String(formEdit.email || '').trim() || undefined,
      role: formEdit.role,
      siteCode: siteCodeMerged,
      trade: tradeMerged,
      active: Boolean(prevRow?.active),
    })
    pushToast('계정이 수정되었습니다.')
    closeModal()
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

const approveOpen = ref(false)
const approveTarget = ref(/** @type {any|null} */ (null))
const approvePassword = ref('')

const rejectOpen = ref(false)
const rejectTarget = ref(/** @type {any|null} */ (null))
const rejectNote = ref('')

const requestDetailOpen = ref(false)
const selectedRequest = ref(/** @type {any|null} */ (null))

function openRequestDetail(rq) {
  selectedRequest.value = rq
  requestDetailOpen.value = true
}

function closeRequestDetail() {
  requestDetailOpen.value = false
  selectedRequest.value = null
}

function startApproveFromDetail() {
  const rq = selectedRequest.value
  if (!rq) return
  if (rq.demo) {
    pushToast(T.demoRequestHint, 'warning')
    return
  }
  openApprove(rq)
}

function startRejectFromDetail() {
  const rq = selectedRequest.value
  if (!rq) return
  if (rq.demo) {
    pushToast(T.demoRequestHint, 'warning')
    return
  }
  openReject(rq)
}

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
  if (!row) return
  if (pwd.length > 0 && pwd.length < 8) {
    pushToast('초기 비밀번호를 입력할 경우 8자 이상이어야 합니다. 비워 두면 서버에서 자동 생성합니다.', 'warning')
    return
  }
  const body = pwd.length >= 8 ? { initialPassword: pwd } : {}
  try {
    await approveAccountRequest(row.idx, body)
    pushToast(pwd.length >= 8 ? '승인 처리되었습니다.' : '승인되었습니다. 초기 비밀번호는 서버에서 생성되었습니다.')
    closeApprove()
    closeRequestDetail()
    pruneReqSelectionAfterChange([row])
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
    closeRequestDetail()
    pruneReqSelectionAfterChange([row])
    await refreshRequests()
  } catch (e) {
    pushToast(e?.message || '거절 처리에 실패했습니다.', 'danger')
  }
}

function reqRowKey(rq) {
  const k = rq?.idx ?? rq?.id ?? rq?.requestIdx ?? rq?.requestId
  return k == null || k === '' ? '' : String(k)
}

const selectedReqKeys = ref(/** @type {Set<string>} */ (new Set()))

function pruneReqSelectionAfterChange(rows) {
  const drop = new Set(rows.map((r) => reqRowKey(r)).filter(Boolean))
  if (!drop.size) return
  const next = new Set(selectedReqKeys.value)
  for (const k of drop) next.delete(k)
  selectedReqKeys.value = next
}

function isReqSelected(rq) {
  return selectedReqKeys.value.has(reqRowKey(rq))
}

function toggleReqCheckbox(rq, ev) {
  const el = /** @type {HTMLInputElement} */ (ev?.target)
  const key = reqRowKey(rq)
  if (!key) return
  const next = new Set(selectedReqKeys.value)
  if (el?.checked) next.add(key)
  else next.delete(key)
  selectedReqKeys.value = next
}

const selectableReqKeysAll = computed(() =>
  accountRequestsFiltered.value.map((r) => reqRowKey(r)).filter(Boolean),
)

const allReqRowsSelected = computed(() => {
  const keys = selectableReqKeysAll.value
  if (!keys.length) return false
  const set = selectedReqKeys.value
  return keys.every((k) => set.has(k))
})

function toggleSelectAllRequests(ev) {
  const el = /** @type {HTMLInputElement} */ (ev?.target)
  if (el?.checked) {
    selectedReqKeys.value = new Set(selectableReqKeysAll.value)
  } else {
    selectedReqKeys.value = new Set()
  }
}

/** 일괄 완료·반려 버튼 활성화: 대기 상태이며 체크된 행 전부(예시 행 포함). 제출 시 예시 행만 골라진 경우는 API 호출 없이 안내 */
const bulkApproveEligible = computed(() =>
  accountRequestsFiltered.value.filter(
    (r) =>
      selectedReqKeys.value.has(reqRowKey(r)) && isPendingRequest(r) && reqRowKey(r),
  ),
)

const bulkRejectEligible = computed(() =>
  accountRequestsFiltered.value.filter(
    (r) =>
      selectedReqKeys.value.has(reqRowKey(r)) && isPendingRequest(r) && reqRowKey(r),
  ),
)

watch([() => projectIdxParam.value, () => mainTab.value], () => {
  selectedReqKeys.value = new Set()
})

const bulkApproveBusy = ref(false)

const bulkRejectOpen = ref(false)
const bulkRejectNoteInput = ref('')
const bulkRejectBusy = ref(false)

function closeBulkRejectModal() {
  bulkRejectOpen.value = false
}

async function runBulkApproveFromToolbar() {
  const list = bulkApproveEligible.value
  if (!list.length) {
    pushToast(T.bulkNoEligible, 'warning')
    return
  }
  const apiRows = list.filter((r) => !r.demo)
  const demoOnly = apiRows.length === 0 && list.some((r) => r.demo)
  if (demoOnly) {
    pushToast(T.demoRequestHint, 'warning')
    return
  }
  if (!window.confirm(`선택한 ${apiRows.length}건을 승인 처리할까요?`)) return
  bulkApproveBusy.value = true
  let ok = 0
  try {
    for (const row of apiRows) {
      const id = row.idx ?? row.id ?? row.requestIdx ?? row.requestId
      if (id == null || id === '') continue
      await approveAccountRequest(id, {})
      ok++
    }
    if (!ok) {
      pushToast('승인 API를 호출할 수 있는 요청이 없습니다.', 'warning')
      return
    }
    window.alert(`선택한 ${ok}건이 승인 처리되었습니다.`)
    selectedReqKeys.value = new Set()
    closeRequestDetail()
    await refreshRequests()
    await refreshList()
  } catch (e) {
    const err = /** @type {Error & { message?: string }} */ (e)?.message || ''
    pushToast(
      ok > 0
        ? `${err || '오류'} (이전까지 ${ok}/${apiRows.length}건 처리됨)`
        : err || '일괄 승인에 실패했습니다.',
      'danger',
    )
    if (ok) {
      pruneReqSelectionAfterChange(apiRows.slice(0, ok))
      await refreshRequests()
      await refreshList()
    }
  } finally {
    bulkApproveBusy.value = false
  }
}

function openBulkRejectRequests() {
  if (!bulkRejectEligible.value.length) {
    pushToast(T.bulkNoEligible, 'warning')
    return
  }
  bulkRejectNoteInput.value = ''
  bulkRejectOpen.value = true
}

async function submitBulkRejectRequests() {
  const list = bulkRejectEligible.value
  if (!list.length) return
  const apiRows = list.filter((r) => !r.demo)
  const demoOnly =
    apiRows.length === 0 && list.some((r) => r.demo)
  if (demoOnly) {
    pushToast(T.demoRequestHint, 'warning')
    return
  }
  bulkRejectBusy.value = true
  const note = String(bulkRejectNoteInput.value || '').trim() || undefined
  let ok = 0
  try {
    for (const row of apiRows) {
      const id = row.idx ?? row.id ?? row.requestIdx ?? row.requestId
      if (id == null || id === '') continue
      await rejectAccountRequest(id, { note })
      ok++
    }
    pushToast(ok ? `${ok}건 반려 처리되었습니다.` : '처리된 항목이 없습니다.')
    closeBulkRejectModal()
    bulkRejectNoteInput.value = ''
    selectedReqKeys.value = new Set()
    closeRequestDetail()
    await refreshRequests()
  } catch (e) {
    const err = /** @type {Error & { message?: string }} */ (e)?.message || ''
    pushToast(
      ok > 0
        ? `${err || '오류'} (이전까지 ${ok}/${apiRows.length}건 처리됨)`
        : err || '일괄 반려에 실패했습니다.',
      'danger',
    )
    if (ok) {
      pruneReqSelectionAfterChange(apiRows.slice(0, ok))
      await refreshRequests()
    }
  } finally {
    bulkRejectBusy.value = false
  }
}

function projectOptionLabel(p) {
  const { code, title } = parseProjectLabel(p.name)
  if (code && title) return `[${code}] ${title}`
  return String(p.name || '').trim() || `#${p.idx}`
}

watch(
  [modalOpen, approveOpen, rejectOpen, requestDetailOpen, bulkRejectOpen],
  ([mo, ao, ro, rd, br]) => {
    document.documentElement.style.overflow = mo || ao || ro || rd || br ? 'hidden' : ''
  },
)
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

    <div class="flex shrink-0 flex-col gap-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">{{ T.kicker }}</p>
          <div class="mt-1 flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
            <h1 class="text-xl font-bold leading-tight text-forena-900">{{ T.title }}</h1>
            <label class="relative inline-flex min-w-0 max-w-[min(100%,22rem)] flex-1 items-center sm:flex-initial">
              <span class="sr-only">{{ currentSiteDisplay }}</span>
              <select
                class="w-full min-w-0 cursor-pointer appearance-none border-0 border-b border-forena-200/70 bg-transparent py-0.5 pr-7 pb-1 pl-0 text-sm font-semibold text-forena-900 shadow-none transition hover:border-flare-400/70 focus:border-flare-500 focus:outline-none focus:ring-0"
                :value="Number.isFinite(projectIdxParam) ? projectIdxParam : ''"
                :aria-label="currentSiteDisplay"
                @change="onSiteSwitcherChange"
              >
                <option v-for="p in sortedProjectOptions" :key="p.idx" :value="p.idx">{{ projectOptionLabel(p) }}</option>
              </select>
              <ChevronDown
                class="pointer-events-none absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 text-forena-500/75"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>
        <div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 shadow-sm hover:bg-flare-100 disabled:cursor-not-allowed disabled:opacity-50"
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
            class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-forena-800 hover:to-black"
            @click="openCreateModal"
          >
            <Plus class="h-3.5 w-3.5 shrink-0" />
            {{ T.newAccount }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-800 shadow-sm hover:bg-forena-50"
            @click="goBackToSiteHub"
          >
            <ArrowLeft class="h-3.5 w-3.5 shrink-0 text-flare-600" />
            {{ T.backToSites }}
          </button>
        </div>
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
        <div class="px-4 pt-4 pb-3 sm:px-5">
          <h2 class="text-base font-bold text-forena-900">{{ T.sectionAccountStatus }}</h2>
        </div>

        <div class="border-t border-forena-100/70 bg-white px-4 pb-px pt-3 sm:px-5">
          <!-- 현장 총 책임자: 본사 직영·공종별과 분리하여 상단 고정 -->
          <div
            v-if="directorFieldAccounts.length"
            class="mb-5 overflow-hidden rounded-xl border border-slate-200/80"
          >
            <div
              class="flex items-center justify-between gap-3 bg-slate-200/55 px-4 py-2.5 text-left"
            >
              <span class="text-sm font-bold text-forena-900">{{
                T.sectionSiteDirectorAccounts
              }}</span>
              <span class="shrink-0 text-[11px] font-semibold tabular-nums text-forena-600">
                ({{ directorFieldAccounts.length }})
              </span>
            </div>
            <div class="overflow-x-auto border-t border-slate-200/70">
              <table class="w-full min-w-[920px] border-collapse text-sm">
                <thead>
                  <tr :class="accountStatusTheadClass">
                    <th class="w-[13%] py-2.5 pl-5 pr-3 text-left text-xs font-bold sm:pl-6">
                      {{ T.colLoginId }}
                    </th>
                    <th class="w-[15%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerName }}</th>
                    <th class="w-[13%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerPhone }}</th>
                    <th class="w-[17%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerRole }}</th>
                    <th class="w-[13%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerTrade }}</th>
                    <th class="w-[11%] px-3 py-2.5 text-left text-xs">{{ T.colStatus }}</th>
                    <th class="w-[18%] px-3 py-2.5 pr-5 text-center text-xs sm:pr-6">
                      {{ T.colActions }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, ri) in directorFieldAccounts"
                    :key="'dir-' + row.idx"
                    class="border-b border-violet-100/40 transition hover:bg-violet-50/40"
                    :class="ri % 2 === 0 ? 'bg-white' : 'bg-violet-50/20'"
                  >
                    <td class="truncate py-2.5 pl-5 pr-3 font-mono text-xs text-forena-800 sm:pl-6">
                      {{ row.loginId }}
                    </td>
                    <td class="truncate px-3 py-2.5 text-left">
                      <span class="font-semibold text-forena-900">{{ row.name }}</span>
                    </td>
                    <td class="truncate px-3 py-2.5 text-left text-xs">{{ row.phone || '—' }}</td>
                    <td class="truncate px-3 py-2.5 text-left text-xs">
                      {{ userRoleLabel(rowRoleStr(row)) }}
                    </td>
                    <td class="truncate px-3 py-2.5 text-left text-xs text-forena-700">
                      {{ row.trade || '—' }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-2.5 text-left">
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
                    <td class="whitespace-nowrap px-3 py-2.5 pr-5 text-center sm:pr-6">
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

          <!-- 본사 직영·공종별 분류: 현장 총 책임자 블록 아래 -->
          <div
            class="-mx-1 mb-3 flex flex-wrap items-center gap-1 border-b border-forena-100/60 px-1 pb-3"
          >
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-bold transition"
              :class="
                workerAffiliationTab === 'hq'
                  ? 'bg-forena-800 text-white shadow-sm'
                  : 'text-forena-600 hover:bg-forena-50 hover:text-forena-900'
              "
              @click="workerAffiliationTab = 'hq'"
            >
              {{ T.workerSubTabHQ }}
              <span class="ml-1 tabular-nums opacity-90">({{ hqFieldAccounts.length }})</span>
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-bold transition"
              :class="
                workerAffiliationTab === 'trade'
                  ? 'bg-forena-800 text-white shadow-sm'
                  : 'text-forena-600 hover:bg-forena-50 hover:text-forena-900'
              "
              @click="workerAffiliationTab = 'trade'"
            >
              {{ T.workerSubTabByTrade }}
              <span class="ml-1 tabular-nums opacity-90">({{ tradeFieldAccounts.length }})</span>
            </button>
          </div>

          <!-- 본사 직영: 단일 표 -->
          <template v-if="workerAffiliationTab === 'hq'">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[920px] border-collapse text-sm">
                <thead>
                  <tr :class="accountStatusTheadClass">
                    <th class="w-[13%] py-2.5 pl-5 pr-3 text-left text-xs font-bold sm:pl-6">{{ T.colLoginId }}</th>
                    <th class="w-[15%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerName }}</th>
                    <th class="w-[13%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerPhone }}</th>
                    <th class="w-[17%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerRole }}</th>
                    <th class="w-[13%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerTrade }}</th>
                    <th class="w-[11%] px-3 py-2.5 text-left text-xs">{{ T.colStatus }}</th>
                    <th class="w-[18%] px-3 py-2.5 pr-5 text-center text-xs sm:pr-6">{{ T.colActions }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!hqFieldAccounts.length">
                    <td colspan="7" class="border-b border-slate-100/80 py-8 pl-5 pr-5 text-center text-xs text-slate-400 sm:pl-6 sm:pr-6">
                      표시할 계정이 없습니다.
                    </td>
                  </tr>
                  <tr
                    v-for="(row, ri) in hqFieldAccounts"
                    :key="row.idx"
                    class="border-b border-violet-100/40 transition hover:bg-violet-50/40"
                    :class="ri % 2 === 0 ? 'bg-white' : 'bg-violet-50/20'"
                  >
                    <td class="truncate py-2.5 pl-5 pr-3 font-mono text-xs text-forena-800 sm:pl-6">{{ row.loginId }}</td>
                    <td class="truncate px-3 py-2.5 text-left">
                      <span class="font-semibold text-forena-900">{{ row.name }}</span>
                    </td>
                    <td class="truncate px-3 py-2.5 text-left text-xs">{{ row.phone || '—' }}</td>
                    <td class="truncate px-3 py-2.5 text-left text-xs">{{ userRoleLabel(rowRoleStr(row)) }}</td>
                    <td class="truncate px-3 py-2.5 text-left text-xs text-forena-700">{{ row.trade || '—' }}</td>
                    <td class="whitespace-nowrap px-3 py-2.5 text-left">
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
                    <td class="whitespace-nowrap px-3 py-2.5 pr-5 text-center sm:pr-6">
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
          </template>

          <!-- 공종별: 공종 단위 아코디언 -->
          <div v-else class="divide-y divide-slate-200/70">
            <div v-if="!tradeGroupedRows.length" class="px-4 py-10 text-center text-sm text-slate-400">
              표시할 계정이 없습니다.
            </div>
            <div v-for="[tradeLabel, tradeRows] in tradeGroupedRows" :key="'trade-' + tradeLabel">
              <button
                type="button"
                class="flex w-full items-center justify-between bg-slate-200/55 px-4 py-2.5 text-left text-sm font-bold text-forena-900 transition hover:bg-slate-200/75"
                @click="toggleTradeAccordion(tradeLabel)"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <ChevronDown
                    v-if="tradeAccordionOpen[tradeLabel]"
                    class="h-3.5 w-3.5 shrink-0 text-forena-600"
                    aria-hidden="true"
                  />
                  <ChevronRight v-else class="h-3.5 w-3.5 shrink-0 text-forena-600" aria-hidden="true" />
                  <span class="truncate">{{ tradeLabel }}</span>
                  <span class="text-[11px] font-semibold tabular-nums text-forena-600">
                    ({{ tradeRows.length }})
                  </span>
                </div>
              </button>
              <div v-show="tradeAccordionOpen[tradeLabel]" class="bg-white">
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[920px] border-collapse text-sm">
                    <thead>
                      <tr :class="accountStatusTheadClass">
                        <th class="w-[13%] py-2.5 pl-5 pr-3 text-left text-xs font-bold sm:pl-6">{{ T.colLoginId }}</th>
                        <th class="w-[15%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerName }}</th>
                        <th class="w-[13%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerPhone }}</th>
                        <th class="w-[17%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerRole }}</th>
                        <th class="w-[13%] px-3 py-2.5 text-left text-xs">{{ T.colWorkerTrade }}</th>
                        <th class="w-[11%] px-3 py-2.5 text-left text-xs">{{ T.colStatus }}</th>
                        <th class="w-[18%] px-3 py-2.5 pr-5 text-center text-xs sm:pr-6">{{ T.colActions }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, ri) in tradeRows"
                        :key="row.idx"
                        class="border-b border-violet-100/40 transition hover:bg-violet-50/40"
                        :class="ri % 2 === 0 ? 'bg-white' : 'bg-violet-50/20'"
                      >
                        <td class="truncate py-2.5 pl-5 pr-3 font-mono text-xs text-forena-800 sm:pl-6">{{ row.loginId }}</td>
                        <td class="truncate px-3 py-2.5 text-left">
                          <span class="font-semibold text-forena-900">{{ row.name }}</span>
                        </td>
                        <td class="truncate px-3 py-2.5 text-left text-xs">{{ row.phone || '—' }}</td>
                        <td class="truncate px-3 py-2.5 text-left text-xs">{{ userRoleLabel(rowRoleStr(row)) }}</td>
                        <td class="truncate px-3 py-2.5 text-left text-xs text-forena-700">{{ row.trade || '—' }}</td>
                        <td class="whitespace-nowrap px-3 py-2.5 text-left">
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
                        <td class="whitespace-nowrap px-3 py-2.5 pr-5 text-center sm:pr-6">
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
    </template>

    <!-- 요청 탭 -->
    <template v-else>
      <section
        class="mt-6 overflow-hidden rounded-2xl border border-forena-100/90 bg-white shadow-card"
      >
        <div class="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-2 sm:px-5">
          <h2 class="text-base font-bold text-forena-900">{{ T.sectionRequests }}</h2>
          <div
            v-if="accountRequestsFiltered.length"
            class="flex flex-wrap items-center justify-end gap-2"
          >
            <button
              type="button"
              class="rounded-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-forena-900 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!bulkApproveEligible.length || bulkApproveBusy"
              @click="runBulkApproveFromToolbar"
            >
              {{ bulkApproveBusy ? '처리 중…' : T.bulkComplete }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!bulkRejectEligible.length"
              @click="openBulkRejectRequests"
            >
              {{ T.bulkDismiss }}
            </button>
          </div>
        </div>

        <div
          v-if="!accountRequestsFiltered.length"
          class="mx-4 mb-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-14 text-center text-sm text-slate-500"
        >
          {{ T.noRequests }}
        </div>

        <div v-else class="border-t border-forena-100/70 bg-white pt-3 pb-px sm:pt-3">
          <div class="overflow-x-auto px-4 pb-px sm:px-5">
            <table class="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr :class="requestsTableTheadClass">
                  <th class="w-9 shrink-0 py-2.5 pl-1.5 pr-2 text-left align-middle">
                    <span class="sr-only">{{ T.srSelectColumn }}</span>
                    <input
                      type="checkbox"
                      class="h-3.5 w-3.5 cursor-pointer rounded border-forena-300 text-flare-600 accent-forena-800"
                      title="전체 선택"
                      :checked="allReqRowsSelected && selectableReqKeysAll.length > 0"
                      @click.stop
                      @change="toggleSelectAllRequests"
                    />
                  </th>
                  <th class="w-[14%] py-2.5 pr-3 pl-2 text-left text-xs font-bold sm:pl-3">{{ T.colReqAt }}</th>
                  <th class="w-[21%] px-3 py-2.5 text-left text-xs font-bold">{{ T.colReqTitle }}</th>
                  <th class="w-[11%] px-3 py-2.5 text-left text-xs font-bold">{{ T.colName }}</th>
                  <th class="w-[16%] px-3 py-2.5 text-left text-xs font-bold">{{ T.colReqRequesterRole }}</th>
                  <th class="min-w-[10.5rem] w-[18%] px-3 py-2.5 text-left text-xs font-bold">
                    {{ T.colReqStatus }}
                  </th>
                  <th class="w-[6.75rem] shrink-0 px-2 py-2.5 pr-4 text-center text-xs font-bold sm:pr-5">
                    {{ T.colReqDetail }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="rq in accountRequestsFiltered"
                  :key="rq.idx ?? rq.id"
                  class="border-b border-violet-100/40 bg-white transition hover:bg-slate-50/50"
                >
                  <td class="w-9 shrink-0 py-2.5 pl-1.5 pr-2 align-middle">
                    <input
                      v-if="reqRowKey(rq)"
                      type="checkbox"
                      class="h-3.5 w-3.5 cursor-pointer rounded border-forena-300 text-flare-600 accent-forena-800"
                      :checked="isReqSelected(rq)"
                      @click.stop
                      @change="toggleReqCheckbox(rq, $event)"
                    />
                  </td>
                  <td class="whitespace-nowrap py-2.5 pr-3 pl-2 text-left text-xs text-forena-600 sm:pl-3">
                    {{ formatReqDate(rq) }}
                  </td>
                  <td class="truncate px-3 py-2.5 text-left text-xs font-medium text-forena-900">
                    {{ requestRowTitle(rq) }}
                  </td>
                  <td class="truncate px-3 py-2.5 text-left text-xs">{{ rq.name ?? '—' }}</td>
                  <td class="truncate px-3 py-2.5 text-left text-xs">{{ userRoleLabel(requestRowRoleStr(rq)) }}</td>
                  <td class="px-3 py-2.5 text-left align-middle">
                    <div class="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
                      <span
                        class="inline-flex w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1"
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
                      <template v-if="isPendingRequest(rq)">
                        <template v-if="rq.demo">
                          <span class="text-[10px] font-medium text-slate-400">{{ T.demoRequestHint }}</span>
                        </template>
                        <div v-else class="flex flex-wrap gap-1">
                          <button
                            type="button"
                            class="rounded-lg bg-forena-800 px-2 py-1 text-[10px] font-bold text-white hover:bg-forena-900"
                            @click="openApprove(rq)"
                          >
                            {{ T.reqApprove }}
                          </button>
                          <button
                            type="button"
                            class="rounded-lg border border-rose-200 bg-white px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-50"
                            @click="openReject(rq)"
                          >
                            {{ T.reqReject }}
                          </button>
                        </div>
                      </template>
                    </div>
                  </td>
                  <td class="px-2 py-2.5 pr-4 text-center align-middle sm:pr-5">
                    <button
                      type="button"
                      class="inline-flex rounded-lg border border-forena-200/90 bg-white px-2.5 py-1 text-[11px] font-bold text-forena-800 shadow-sm transition hover:border-flare-300 hover:bg-flare-50/40"
                      @click="openRequestDetail(rq)"
                    >
                      {{ T.reqDetailBtn }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </template>

    <!-- 요청 상세 모달 -->
    <Teleport to="body">
      <div
        v-if="requestDetailOpen && selectedRequest"
        class="fixed inset-0 z-[205] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        @click.self="closeRequestDetail"
      >
        <div
          class="flex max-h-[min(92vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-flare-100/90 bg-white shadow-[0_24px_64px_rgba(0,26,61,0.12)]"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-start justify-between gap-2 border-b border-forena-100/80 px-4 py-3">
            <h2 class="min-w-0 flex-1 text-sm font-bold leading-snug text-forena-900">
              {{ T.detailModalTitle }}
            </h2>
            <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1"
                :class="
                  isPendingRequest(selectedRequest)
                    ? 'bg-amber-50 text-amber-900 ring-amber-200/80'
                    : String(selectedRequest.status).toUpperCase() === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
                      : 'bg-slate-100 text-slate-600 ring-slate-200/80'
                "
              >
                {{ statusLabel(selectedRequest.status) }}
              </span>
              <template v-if="isPendingRequest(selectedRequest)">
                <template v-if="selectedRequest.demo">
                  <span class="max-w-[8rem] text-right text-[10px] font-medium leading-tight text-slate-400">
                    {{ T.demoRequestHint }}
                  </span>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="rounded-lg bg-forena-800 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-forena-900"
                    @click.stop="startApproveFromDetail"
                  >
                    {{ T.reqApprove }}
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                    @click.stop="startRejectFromDetail"
                  >
                    {{ T.reqReject }}
                  </button>
                </template>
              </template>
              <button
                type="button"
                class="rounded-lg p-1 text-forena-400 hover:bg-forena-50"
                :aria-label="T.cancel"
                @click.stop="closeRequestDetail"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm text-forena-800">
            <dl class="space-y-2.5">
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.colReqTitle }}</dt>
                <dd class="mt-0.5 font-semibold text-forena-900">{{ requestRowTitle(selectedRequest) }}</dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailAt }}</dt>
                <dd class="mt-0.5">{{ formatReqDate(selectedRequest) }}</dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailSiteCode }}</dt>
                <dd class="mt-0.5">{{ requestSiteNameForDetail(selectedRequest) }}</dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailRequestedLoginId }}</dt>
                <dd class="mt-0.5 font-mono text-xs">
                  {{ selectedRequest.requestedLoginId ?? selectedRequest.loginId ?? '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailRequestedName }}</dt>
                <dd class="mt-0.5">{{ selectedRequest.requestedName ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailRequestedRole }}</dt>
                <dd class="mt-0.5">{{ userRoleLabel(requestRowRequestedRoleStr(selectedRequest)) }}</dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailName }}</dt>
                <dd class="mt-0.5">{{ selectedRequest.name ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailRole }}</dt>
                <dd class="mt-0.5">{{ userRoleLabel(requestRowRoleStr(selectedRequest)) }}</dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailTrade }}</dt>
                <dd class="mt-0.5">{{ selectedRequest.trade ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-[11px] font-bold text-forena-500">{{ T.lblDetailBody }}</dt>
                <dd class="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">
                  {{ requestRowDetailText(selectedRequest) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Teleport>

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
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.lblAccountName }}</span>
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
              <label v-if="editNeedsSite" class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.sitePick }}</span>
                <select
                  v-model.number="formEdit.projectIdx"
                  class="w-full rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm"
                >
                  <option :value="null">현장 선택</option>
                  <option v-for="p in sortedProjectOptions" :key="'e-' + p.idx" :value="p.idx">
                    {{ projectOptionLabel(p) }}
                  </option>
                </select>
              </label>
              <label v-if="editNeedsTrade" class="block">
                <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.tradePick }}</span>
                <span class="mb-1 block text-[10px] text-forena-400">{{ T.tradeHint }}</span>
                <select
                  v-model="formEdit.trade"
                  class="w-full rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                  :disabled="editTradeLoading || formEdit.projectIdx == null"
                >
                  <option value="">{{ editTradeLoading ? '불러오는 중…' : '공종 선택' }}</option>
                  <option v-for="t in editTradeOptions" :key="'et-' + t" :value="t">{{ t }}</option>
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
          <p class="mt-1 text-[11px] leading-snug text-forena-500">{{ T.approvePwdOptionalHint }}</p>
          <label class="mt-3 block text-sm">
            <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.labelInitialPwd }}</span>
            <input
              v-model="approvePassword"
              type="password"
              class="w-full rounded-lg border border-forena-200 px-3 py-2"
              autocomplete="new-password"
              placeholder="선택 입력"
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

    <!-- 일괄 반려 -->
    <Teleport to="body">
      <div
        v-if="bulkRejectOpen"
        class="fixed inset-0 z-[212] flex items-center justify-center bg-forena-950/45 p-4 backdrop-blur-[2px]"
        @click.self="closeBulkRejectModal"
      >
        <div class="w-full max-w-sm rounded-2xl border border-flare-100/90 bg-white p-4 shadow-xl">
          <h3 class="text-sm font-bold text-forena-900">{{ T.bulkRejectModalTitle }}</h3>
          <p class="mt-1 text-xs text-forena-600">{{ bulkRejectEligible.length }}건</p>
          <label class="mt-3 block text-sm">
            <span class="mb-1 block text-[11px] font-bold text-forena-500">{{ T.labelRejectNote }}</span>
            <textarea
              v-model="bulkRejectNoteInput"
              rows="3"
              class="w-full rounded-lg border border-forena-200 px-3 py-2 text-sm"
              :disabled="bulkRejectBusy"
            />
          </label>
          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-forena-200 py-2 text-xs font-bold"
              :disabled="bulkRejectBusy"
              @click="closeBulkRejectModal"
            >
              {{ T.cancel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              :disabled="bulkRejectBusy"
              @click="submitBulkRejectRequests"
            >
              {{ bulkRejectBusy ? '처리 중…' : T.bulkDismiss }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
