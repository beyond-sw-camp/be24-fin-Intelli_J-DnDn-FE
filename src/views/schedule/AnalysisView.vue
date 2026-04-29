<script setup>
import { ref, computed, reactive, watch } from 'vue'
import {
  CalendarDays, Filter, AlertTriangle, Sparkles, Pencil, X, Plus, Check,
  ShieldCheck, UserCog, Eye, Send, CheckCircle2, Clock, ClipboardList,
  TrendingDown, ChevronRight, Paperclip, Trash2, FileText, RefreshCw,
  Layers
} from 'lucide-vue-next'

// ─── 권한 / 역할 ──────────────────────────────────────────────────────────
const ROLES = { MANAGER: 'manager', SUPERVISOR: 'supervisor' }
const role = ref(ROLES.MANAGER)
const myProcess = ref('철근')
const isSupervisor = computed(() => role.value === ROLES.SUPERVISOR)

// 권한 토글 시 활성 탭/필터 자동 정리
watch(role, (r) => {
  // 책임자가 아닐 때만 보이는 탭에 있다가 권한 바뀌면 안전한 탭으로
  if (r === ROLES.MANAGER) filterProcess.value = '전체'
})
watch(myProcess, () => {
  // 본인 공정 바꾸면 요청 폼의 공정도 같이 바꿔줌
  requestForm.process = myProcess.value
})

// ─── 필터 ────────────────────────────────────────────────────────────────
const filterPeriod = ref('2026-04')
const filterProcess = ref('전체')
const filterStatus = ref('전체')
const filterRisk = ref('전체')

// ─── 탭 ──────────────────────────────────────────────────────────────────
const activeTab = ref('progress')
const tabs = computed(() => [
  { key: 'progress', label: '공정 진척률 비교' },
  { key: 'delay',    label: '지연 위험 작업' },
  { key: 'ai',       label: 'AI 추천안' },
  { key: 'approval', label: isSupervisor.value ? '일정 변경 승인' : '일정 변경 요청' },
  { key: 'history',  label: '변경 이력' },
])

// ─── 마스터 데이터 ───────────────────────────────────────────────────────
const ALL_PROCESSES = ['철근', '거푸집', '콘크리트', '방수', '조적']

// ─── Mock 데이터 ────────────────────────────────────────────────────────
const processes = ref([
  { id: 1, name: '철근',     plannedPct: 80, actualPct: 62, plannedStart: '2026-03-01', plannedEnd: '2026-04-30', actualStart: '2026-03-03', forecastEnd: '2026-05-08', status: '지연 위험', risk: '높음',     partner: '(주)한국철근',   actualWorkers: 12 },
  { id: 2, name: '거푸집',   plannedPct: 70, actualPct: 68, plannedStart: '2026-03-10', plannedEnd: '2026-05-10', actualStart: '2026-03-10', forecastEnd: '2026-05-13', status: '주의',      risk: '보통',     partner: '(주)대성폼',     actualWorkers: 18 },
  { id: 3, name: '콘크리트', plannedPct: 55, actualPct: 30, plannedStart: '2026-03-20', plannedEnd: '2026-05-20', actualStart: '2026-03-25', forecastEnd: '2026-06-05', status: '지연',      risk: '매우 높음', partner: '(주)삼성레미콘', actualWorkers: 22 },
  { id: 4, name: '방수',     plannedPct: 40, actualPct: 39, plannedStart: '2026-04-01', plannedEnd: '2026-05-25', actualStart: '2026-04-01', forecastEnd: '2026-05-26', status: '정상',      risk: '낮음',     partner: '(주)방수테크',   actualWorkers: 8 },
  { id: 5, name: '조적',     plannedPct: 25, actualPct: 24, plannedStart: '2026-04-10', plannedEnd: '2026-06-01', actualStart: '2026-04-10', forecastEnd: '2026-06-02', status: '정상',      risk: '낮음',     partner: '(주)조적건설',   actualWorkers: 6 },
])

const delayTasks = ref([
  { id: 1, process: '철근',     name: '기초 철근 배근',         location: 'B1층 전체',  partner: '(주)한국철근',   plannedPct: 80, actualPct: 62, diff: 18, expectedDelayDays: 5,  risk: '높음',     cause: '인력 부족 및 우천',          followEffect: '거푸집 공정 3일 지연 예상', isCritical: true,  workPlanId: 'wp-001', originalEnd: '2026-04-30', actualWorkers: 12 },
  { id: 2, process: '콘크리트', name: '지하 1층 슬라브 타설',   location: 'B1 슬라브',  partner: '(주)삼성레미콘', plannedPct: 55, actualPct: 30, diff: 25, expectedDelayDays: 12, risk: '매우 높음', cause: '장비 고장, 레미콘 공급 지연', followEffect: '방수·조적 공정 연쇄 지연', isCritical: true,  workPlanId: 'wp-002', originalEnd: '2026-05-20', actualWorkers: 22 },
  { id: 3, process: '거푸집',   name: '외벽 거푸집 설치',       location: '3층 외벽',   partner: '(주)대성폼',     plannedPct: 70, actualPct: 68, diff: 2,  expectedDelayDays: 2,  risk: '낮음',     cause: '자재 납품 지연',              followEffect: '영향 낮음',                isCritical: false, workPlanId: 'wp-003', originalEnd: '2026-05-10', actualWorkers: 18 },
])

// AI 추천안
const aiRecs = reactive({
  1: { summary: '기초 철근 배근 작업이 계획 대비 18% 지연 중입니다. 우천으로 인한 작업 중단과 인력 부족이 주요 원인으로, 즉각적인 인력 보강과 일정 조정이 필요합니다.', recommendation: '추가 인력 투입 및 일정 연장을 병행 적용하여 계획 진척률을 회복할 것을 권고합니다. 우천 예보를 고려해 실내 선조립 작업을 병행하세요.', workerSuggestion: '숙련공 5명 추가 투입 시 4일 이내 계획 대비 진척률 회복 가능', affectedTasks: ['거푸집 외벽 설치', '콘크리트 타설 준비'], editedAddDays: 3, editedWorkers: 5, expectedEffect: '예상 지연 2일 감소, 후속 공정 영향도 낮음' },
  2: { summary: '지하 1층 슬라브 타설이 계획 대비 25% 지연 중입니다. 장비 고장과 레미콘 공급 지연이 복합 원인으로, 긴급 대응이 필요합니다.', recommendation: '대형 펌프카 추가 투입과 레미콘 협력사 교체 검토, 야간 작업 계획 수립을 권고합니다.', workerSuggestion: '콘크리트 타설 전문 인력 8명 즉시 투입, 야간 2교대 운영 검토', affectedTasks: ['방수 공정 전체', '조적 공정 시작'], editedAddDays: 7, editedWorkers: 8, expectedEffect: '후속 공정 연쇄 지연 방지, 예상 지연일 5일 단축' },
  3: { summary: '외벽 거푸집 설치가 자재 납품 지연으로 소폭 지연 중입니다. 즉각 대응 시 영향을 최소화할 수 있습니다.', recommendation: '대체 자재 공급사 확보 및 2일 일정 연장을 권고합니다.', workerSuggestion: '현재 인원 유지 또는 2명 추가로 자재 설치 속도 향상', affectedTasks: ['콘크리트 타설 일정'], editedAddDays: 2, editedWorkers: 2, expectedEffect: '후속 공정 영향 없음, 자체 해결 가능' },
})

// 일정 변경 요청 — 상태: 'pending' | 'approved' | 'applied' | 'rejected'
const changeRequests = ref([
  { id: 101, process: '철근',     task: '기초 철근 배근',       requester: '김철수 (철근 책임자)',     requestDate: '2026-04-22', oldStart: '2026-03-01', oldEnd: '2026-04-30', newStart: '2026-03-01', newEnd: '2026-05-03', reason: '우천으로 인한 작업 중단 3일, 인력 수급 지연', cause: '기상 악화 및 인력 부족',       aiApplied: true,  status: 'pending',  attachments: [{ name: '현장사진_0422.jpg', size: 320000 }], rejectReason: '' },
  { id: 102, process: '콘크리트', task: '지하 1층 슬라브 타설', requester: '박영희 (콘크리트 책임자)', requestDate: '2026-04-23', oldStart: '2026-03-20', oldEnd: '2026-05-20', newStart: '2026-03-25', newEnd: '2026-06-05', reason: '펌프카 고장 5일, 레미콘 공급 지연',         cause: '장비 고장 및 자재 공급 이슈', aiApplied: true,  status: 'approved', attachments: [{ name: '장비고장확인서.pdf', size: 540000 }], rejectReason: '' },
])

const changeHistory = ref([
  { id: 201, process: '방수', task: '지붕 방수 시공',  action: '승인',       oldEnd: '2026-04-15', newEnd: '2026-04-18', reason: '우천 3일',     approver: '이감독 (현장 총 책임자)', processedAt: '2026-04-10', aiApplied: false },
  { id: 202, process: '조적', task: '내벽 조적 공사',  action: '반려',       oldEnd: '2026-04-20', newEnd: '2026-04-28', reason: '근거 불충분',   approver: '이감독 (현장 총 책임자)', processedAt: '2026-04-12', aiApplied: false },
])

// ─── 권한 + 필터 적용된 가시 데이터 ───────────────────────────────────────
function passProcessFilter(name) {
  if (filterProcess.value === '전체') return true
  return name === filterProcess.value
}
function passStatusFilter(status) {
  if (filterStatus.value === '전체') return true
  return status === filterStatus.value
}
function passRiskFilter(risk) {
  if (filterRisk.value === '전체') return true
  return risk === filterRisk.value
}

const visibleProcesses = computed(() => {
  let r = processes.value
  if (!isSupervisor.value) r = r.filter(p => p.name === myProcess.value)
  else r = r.filter(p => passProcessFilter(p.name))
  r = r.filter(p => passStatusFilter(p.status))
  r = r.filter(p => passRiskFilter(p.risk))
  return r
})

const visibleTasks = computed(() => {
  let r = delayTasks.value
  if (!isSupervisor.value) r = r.filter(t => t.process === myProcess.value)
  else r = r.filter(t => passProcessFilter(t.process))
  r = r.filter(t => passRiskFilter(t.risk))
  return r
})

const visibleRequests = computed(() => {
  let r = changeRequests.value
  if (!isSupervisor.value) r = r.filter(req => req.process === myProcess.value)
  else r = r.filter(req => passProcessFilter(req.process))
  return r
})

const visibleHistory = computed(() => {
  let r = changeHistory.value
  if (!isSupervisor.value) r = r.filter(h => h.process === myProcess.value)
  else r = r.filter(h => passProcessFilter(h.process))
  return r
})

// ─── KPI ─────────────────────────────────────────────────────────────────
const kpi = computed(() => {
  const src = visibleProcesses.value
  const total = src.length || 1
  const delayCount   = src.filter(p => p.status === '지연').length
  const riskCount    = src.filter(p => p.status === '지연 위험').length
  const completeCount= src.filter(p => p.status === '완료').length
  const avgPlanned   = Math.round(src.reduce((a, p) => a + p.plannedPct, 0) / total)
  const avgActual    = Math.round(src.reduce((a, p) => a + p.actualPct,  0) / total)
  const reqCount     = visibleRequests.value.length
  const pendingCount = visibleRequests.value.filter(r => r.status === 'pending').length
  return { delayCount, riskCount, completeCount, avgPlanned, avgActual, diff: avgPlanned - avgActual, reqCount, pendingCount }
})

// ─── 일정 변경 요청 폼 ────────────────────────────────────────────────────
const showRequestForm = ref(false)
const requestForm = reactive({
  process: myProcess.value, task: '',
  oldStart: '', oldEnd: '', newStart: '', newEnd: '',
  reason: '', cause: '', aiApplied: false,
  attachments: [],
})
const requestFormFileRef = ref(null)
function pickRequestFiles() { requestFormFileRef.value?.click() }
function onRequestFileChange(e) {
  const list = Array.from(e.target.files || [])
  list.forEach(f => requestForm.attachments.push({
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
    name: f.name, size: f.size, type: f.type,
  }))
  e.target.value = ''
}
function removeRequestFile(idx) { requestForm.attachments.splice(idx, 1) }

const requestFormValid = computed(() => {
  return requestForm.task.trim() && requestForm.newStart && requestForm.newEnd && requestForm.reason.trim()
})

function resetRequestForm() {
  Object.assign(requestForm, {
    process: myProcess.value, task: '',
    oldStart: '', oldEnd: '', newStart: '', newEnd: '',
    reason: '', cause: '', aiApplied: false,
    attachments: [],
  })
}

function submitRequest() {
  if (!requestFormValid.value) return
  changeRequests.value.unshift({
    id: Date.now(),
    process: requestForm.process,
    task: requestForm.task,
    requester: `${myProcess.value} 책임자`,
    requestDate: new Date().toISOString().slice(0, 10),
    oldStart: requestForm.oldStart, oldEnd: requestForm.oldEnd,
    newStart: requestForm.newStart, newEnd: requestForm.newEnd,
    reason: requestForm.reason, cause: requestForm.cause,
    aiApplied: requestForm.aiApplied,
    status: 'pending',
    attachments: [...requestForm.attachments],
    rejectReason: '',
  })
  showRequestForm.value = false
  resetRequestForm()
  activeTab.value = 'approval'
}

// ─── 승인/반려/반영 ─────────────────────────────────────────────────────
const rejectModal = ref({ show: false, id: null, reason: '' })

function approveRequest(id) {
  const r = changeRequests.value.find(req => req.id === id)
  if (!r) return
  r.status = 'approved'
  changeHistory.value.unshift({
    id: Date.now(), process: r.process, task: r.task, action: '승인',
    oldEnd: r.oldEnd, newEnd: r.newEnd, reason: r.reason,
    approver: '이감독 (현장 총 책임자)',
    processedAt: new Date().toISOString().slice(0, 10),
    aiApplied: r.aiApplied,
  })
}

function applyToSchedule(id) {
  // 승인 → 공정 계획에 실제 반영
  const r = changeRequests.value.find(req => req.id === id)
  if (!r) return
  const proc = processes.value.find(p => p.name === r.process)
  if (proc) {
    proc.plannedStart = r.newStart || proc.plannedStart
    proc.plannedEnd   = r.newEnd   || proc.plannedEnd
  }
  r.status = 'applied'
  changeHistory.value.unshift({
    id: Date.now(), process: r.process, task: r.task, action: '일정 반영',
    oldEnd: r.oldEnd, newEnd: r.newEnd, reason: r.reason,
    approver: '이감독 (현장 총 책임자)',
    processedAt: new Date().toISOString().slice(0, 10),
    aiApplied: r.aiApplied,
  })
}

function openRejectModal(id) { rejectModal.value = { show: true, id, reason: '' } }
function confirmReject() {
  const r = changeRequests.value.find(req => req.id === rejectModal.value.id)
  if (!r || !rejectModal.value.reason.trim()) return
  r.status = 'rejected'
  r.rejectReason = rejectModal.value.reason
  changeHistory.value.unshift({
    id: Date.now(), process: r.process, task: r.task, action: '반려',
    oldEnd: r.oldEnd, newEnd: r.newEnd, reason: rejectModal.value.reason,
    approver: '이감독 (현장 총 책임자)',
    processedAt: new Date().toISOString().slice(0, 10),
    aiApplied: r.aiApplied,
  })
  rejectModal.value.show = false
}

// ─── AI 추천 수정 ───────────────────────────────────────────────────────
const editRecModal = ref({ show: false, id: null, days: 0, workers: 0 })
function openEditRec(id) {
  editRecModal.value = { show: true, id, days: aiRecs[id].editedAddDays, workers: aiRecs[id].editedWorkers }
}
function saveEditRec() {
  const id = editRecModal.value.id
  aiRecs[id].editedAddDays = editRecModal.value.days
  aiRecs[id].editedWorkers = editRecModal.value.workers
  editRecModal.value.show = false
}

// ─── 작업 상세 모달 ─────────────────────────────────────────────────────
const taskDetailModal = ref({ show: false, taskId: null })
function openTaskDetail(taskId) { taskDetailModal.value = { show: true, taskId } }
function closeTaskDetail() { taskDetailModal.value = { show: false, taskId: null } }
const detailTask = computed(() => taskDetailModal.value.taskId
  ? delayTasks.value.find(t => t.id === taskDetailModal.value.taskId) : null)
const detailRec = computed(() => taskDetailModal.value.taskId
  ? aiRecs[taskDetailModal.value.taskId] : null)

// AI 탭에서 좌측 목록 선택
const selectedTaskId = ref(null)
const selectedTask = computed(() => delayTasks.value.find(t => t.id === selectedTaskId.value) || null)
const selectedRec = computed(() => selectedTaskId.value ? aiRecs[selectedTaskId.value] : null)

// AI 추천안에서 변경 요청 생성 (책임자가 자기 공정인 경우만 가능)
function createRequestFromAi() {
  if (!selectedTask.value || !selectedRec.value) return
  if (selectedTask.value.process !== myProcess.value) return
  const newEndDate = new Date(selectedTask.value.originalEnd)
  newEndDate.setDate(newEndDate.getDate() + selectedRec.value.editedAddDays)
  Object.assign(requestForm, {
    process: selectedTask.value.process,
    task: selectedTask.value.name,
    oldStart: '', oldEnd: selectedTask.value.originalEnd,
    newStart: '', newEnd: newEndDate.toISOString().slice(0, 10),
    reason: `AI 추천 반영 — 일정 ${selectedRec.value.editedAddDays}일 연장, 인력 ${selectedRec.value.editedWorkers}명 추가`,
    cause: selectedTask.value.cause,
    aiApplied: true,
    attachments: [],
  })
  showRequestForm.value = true
  activeTab.value = 'approval'
}

// ─── 유틸 ───────────────────────────────────────────────────────────────
const statusColor = (s) => ({
  '정상':      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  '주의':      'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  '지연 위험': 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  '지연':      'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  '완료':      'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
}[s] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200')

const riskColor = (r) => ({
  '낮음':      'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  '보통':      'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  '높음':      'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  '매우 높음': 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}[r] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200')

const riskBar = (r) => ({
  '낮음':      'bg-sky-400',
  '보통':      'bg-amber-400',
  '높음':      'bg-orange-500',
  '매우 높음': 'bg-rose-500',
}[r] || 'bg-slate-400')

const reqStatusColor = (s) => ({
  pending:  'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  approved: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  applied:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}[s] || 'bg-slate-100 text-slate-500 ring-1 ring-slate-200')

const reqStatusLabel = (s) => ({
  pending:  '승인 대기',
  approved: '승인 완료',
  applied:  '일정 반영 완료',
  rejected: '반려',
}[s] || s)

function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}
function addDaysStr(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
</script>

<template>
  <div class="flex flex-col gap-5 pb-10">

    <!-- ── 헤더 ─────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">공정 분석</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <!-- 권한 토글 -->
        <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
          <button @click="role = ROLES.MANAGER"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="role === ROLES.MANAGER ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'">
            <UserCog class="h-3.5 w-3.5" /> 공정 책임자
          </button>
          <button @click="role = ROLES.SUPERVISOR"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition"
            :class="role === ROLES.SUPERVISOR ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'">
            <ShieldCheck class="h-3.5 w-3.5" /> 현장 총 책임자
          </button>
        </div>
        <select v-if="!isSupervisor" v-model="myProcess"
          class="rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400">
          <option v-for="p in ALL_PROCESSES" :key="p" :value="p">{{ p }} 공정</option>
        </select>
      </div>
    </div>

    <!-- ── 권한 안내 ───────────────────────────────────────────────── -->
    <div v-if="!isSupervisor"
      class="flex items-start gap-2.5 rounded-xl border border-flare-200 bg-flare-50/60 px-4 py-3">
      <UserCog class="mt-0.5 h-4 w-4 shrink-0 text-flare-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <strong class="text-flare-700">{{ myProcess }} 공정 책임자</strong>입니다.
        {{ myProcess }} 공정의 분석 결과와 AI 추천안을 확인하고 일정 변경을 요청할 수 있습니다.
      </p>
    </div>
    <div v-else class="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
      <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <p class="text-xs text-forena-800">
        현재 계정은 <strong class="text-emerald-700">현장 총 책임자</strong>입니다.
        전체 공정의 분석 결과를 확인하고 일정 변경 요청을 승인 · 반려 · 일정 반영할 수 있습니다.
      </p>
    </div>

    <!-- ── 필터 ───────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center gap-2 rounded-xl border border-forena-100 bg-white px-4 py-3">
      <Filter class="h-3.5 w-3.5 text-forena-400" />
      <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400">필터</span>

      <div class="flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-2.5 py-1">
        <CalendarDays class="h-3.5 w-3.5 text-forena-400" />
        <input type="month" v-model="filterPeriod"
          class="bg-transparent text-xs font-semibold tabular-nums text-forena-700 outline-none cursor-pointer" />
      </div>

      <div v-if="isSupervisor" class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold text-forena-400">공종</span>
        <select v-model="filterProcess"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400">
          <option>전체</option>
          <option v-for="p in ALL_PROCESSES" :key="p">{{ p }}</option>
        </select>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold text-forena-400">상태</span>
        <select v-model="filterStatus"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400">
          <option>전체</option><option>정상</option><option>주의</option><option>지연 위험</option><option>지연</option><option>완료</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[11px] font-bold text-forena-400">위험도</span>
        <select v-model="filterRisk"
          class="rounded-md border border-forena-200 bg-white px-2 py-1 text-xs font-semibold text-forena-700 outline-none focus:border-flare-400">
          <option>전체</option><option>낮음</option><option>보통</option><option>높음</option><option>매우 높음</option>
        </select>
      </div>

      <span class="ml-auto text-[11px] text-forena-500">
        조회 결과 <strong class="tabular-nums text-forena-800">{{ visibleProcesses.length }}</strong>개 공정 ·
        <strong class="tabular-nums text-forena-800">{{ visibleTasks.length }}</strong>개 위험 작업
      </span>
    </div>

    <!-- ── KPI 카드 ────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <div class="rounded-xl border border-forena-200 bg-white p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-forena-400">{{ isSupervisor ? '전체 진척률' : '공정 진척률' }}</p>
        <p class="text-3xl font-bold tabular-nums text-forena-900">{{ kpi.avgActual }}<span class="text-base">%</span></p>
        <p class="mt-0.5 text-[10px] text-forena-400">계획 {{ kpi.avgPlanned }}%</p>
      </div>
      <div class="rounded-xl border bg-white p-4"
        :class="kpi.diff > 0 ? 'border-rose-200' : 'border-emerald-200'">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wide"
          :class="kpi.diff > 0 ? 'text-rose-500' : 'text-emerald-500'">진척률 차이</p>
        <p class="text-3xl font-bold tabular-nums"
          :class="kpi.diff > 0 ? 'text-rose-700' : 'text-emerald-700'">
          {{ kpi.diff > 0 ? '-' : '+' }}{{ Math.abs(kpi.diff) }}<span class="text-base">%</span>
        </p>
        <p class="mt-0.5 text-[10px]" :class="kpi.diff > 0 ? 'text-rose-400' : 'text-emerald-400'">계획 대비</p>
      </div>
      <div class="rounded-xl border border-orange-200 bg-white p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-orange-600">지연 위험</p>
        <p class="text-3xl font-bold tabular-nums text-orange-700">{{ kpi.riskCount }}</p>
        <p class="mt-0.5 text-[10px] text-orange-400">건</p>
      </div>
      <div class="rounded-xl border border-rose-200 bg-white p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-rose-500">지연 발생</p>
        <p class="text-3xl font-bold tabular-nums text-rose-700">{{ kpi.delayCount }}</p>
        <p class="mt-0.5 text-[10px] text-rose-400">건</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-amber-700">변경 요청</p>
        <p class="text-3xl font-bold tabular-nums text-amber-700">{{ kpi.reqCount }}</p>
        <p class="mt-0.5 text-[10px] text-amber-500">건</p>
      </div>
      <div class="rounded-xl border border-forena-200 bg-white p-4">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-forena-400">승인 대기</p>
        <p class="text-3xl font-bold tabular-nums text-forena-900">{{ kpi.pendingCount }}</p>
        <p class="mt-0.5 text-[10px] text-forena-400">건</p>
      </div>
    </div>

    <!-- ── 탭 ─────────────────────────────────────────────────────── -->
    <div class="flex gap-1 rounded-xl border border-forena-200 bg-forena-50/60 p-1">
      <button v-for="t in tabs" :key="t.key" @click="activeTab = t.key"
        class="flex-1 rounded-lg py-2 text-xs font-bold transition"
        :class="activeTab === t.key ? 'bg-white text-forena-900 shadow-sm' : 'text-forena-400 hover:text-forena-700'">
        {{ t.label }}
        <span v-if="t.key === 'approval' && kpi.pendingCount > 0"
          class="ml-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] text-white">{{ kpi.pendingCount }}</span>
      </button>
    </div>

    <!-- ══ TAB 1: 공정 진척률 비교 ══════════════════════════════════ -->
    <div v-if="activeTab === 'progress'" class="space-y-3">
      <!-- 지연 감지 기준 -->
      <div class="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
        <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
          <AlertTriangle class="h-3.5 w-3.5" /> 지연 감지 기준
        </p>
        <div class="flex flex-wrap gap-3 text-[11px] text-amber-800">
          <span class="flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>계획 대비 실제 진척률 차이 10% 이상</span>
          <span class="flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-orange-400"></span>예정 종료일 3일 이내인데 실제 진척률 70% 미만</span>
          <span class="flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-rose-400"></span>선행 공정 지연으로 후속 공정 영향 발생</span>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-forena-200 bg-white">
        <table class="w-full text-xs">
          <thead class="border-b border-forena-100 bg-forena-50/60">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-forena-400">공정</th>
              <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">계획 시작</th>
              <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">계획 종료</th>
              <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">실제 시작</th>
              <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">종료 예상</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-forena-400">계획 / 실제 진척률</th>
              <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">차이</th>
              <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">상태</th>
              <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">위험도</th>
              <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">협력사</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-forena-50">
            <tr v-for="p in visibleProcesses" :key="p.id" class="transition-colors hover:bg-forena-50/40">
              <td class="px-4 py-3.5 font-semibold text-forena-900">{{ p.name }}</td>
              <td class="px-3 py-3.5 tabular-nums text-forena-600">{{ p.plannedStart }}</td>
              <td class="px-3 py-3.5 tabular-nums text-forena-600">{{ p.plannedEnd }}</td>
              <td class="px-3 py-3.5 tabular-nums text-forena-600">{{ p.actualStart }}</td>
              <td class="px-3 py-3.5 tabular-nums font-semibold"
                :class="p.forecastEnd > p.plannedEnd ? 'text-rose-600' : 'text-forena-600'">{{ p.forecastEnd }}</td>
              <td class="min-w-[160px] px-4 py-3.5">
                <div class="space-y-1.5">
                  <div>
                    <div class="mb-0.5 flex justify-between text-[10px] font-semibold text-forena-400">
                      <span>계획</span><span class="tabular-nums">{{ p.plannedPct }}%</span>
                    </div>
                    <div class="h-1.5 overflow-hidden rounded-full bg-forena-100">
                      <div class="h-full rounded-full bg-forena-300" :style="{ width: p.plannedPct + '%' }" />
                    </div>
                  </div>
                  <div>
                    <div class="mb-0.5 flex justify-between text-[10px] font-semibold">
                      <span class="text-forena-400">실제</span>
                      <span class="tabular-nums" :class="p.actualPct < p.plannedPct ? 'text-rose-600' : 'text-emerald-600'">{{ p.actualPct }}%</span>
                    </div>
                    <div class="h-1.5 overflow-hidden rounded-full bg-forena-100">
                      <div class="h-full rounded-full" :class="riskBar(p.risk)" :style="{ width: p.actualPct + '%' }" />
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3.5 font-bold tabular-nums"
                :class="p.plannedPct - p.actualPct > 0 ? 'text-rose-600' : 'text-emerald-600'">
                {{ p.plannedPct - p.actualPct > 0 ? '-' : '+' }}{{ Math.abs(p.plannedPct - p.actualPct) }}%
              </td>
              <td class="px-3 py-3.5">
                <span class="rounded-lg px-2 py-0.5 text-[10px] font-bold" :class="statusColor(p.status)">{{ p.status }}</span>
              </td>
              <td class="px-3 py-3.5">
                <span class="rounded-lg px-2 py-0.5 text-[10px] font-bold" :class="riskColor(p.risk)">{{ p.risk }}</span>
              </td>
              <td class="px-3 py-3.5 text-forena-500">{{ p.partner }}</td>
            </tr>
            <tr v-if="!visibleProcesses.length">
              <td colspan="10" class="px-4 py-12 text-center text-sm text-slate-400">
                조건에 맞는 공정이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ TAB 2: 지연 위험 작업 ════════════════════════════════════ -->
    <div v-if="activeTab === 'delay'" class="space-y-3">
      <div v-for="t in visibleTasks" :key="t.id" class="overflow-hidden rounded-xl border border-forena-200 bg-white">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-forena-100 bg-forena-50/60 px-4 py-3">
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-bold text-forena-900">{{ t.name }}</p>
            <span v-if="t.isCritical" class="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">CP</span>
            <span class="text-xs text-forena-400">{{ t.process }} 공정 · {{ t.location }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="rounded-lg px-2 py-0.5 text-[10px] font-bold" :class="riskColor(t.risk)">{{ t.risk }}</span>
            <button @click="openTaskDetail(t.id)"
              class="inline-flex items-center gap-1 rounded-lg border border-forena-200 bg-white px-2.5 py-1.5 text-xs font-bold text-forena-700 transition hover:bg-forena-50">
              <Eye class="h-3 w-3" /> 상세 보기
            </button>
            <button @click="selectedTaskId = t.id; activeTab = 'ai'"
              class="inline-flex items-center gap-1 rounded-lg bg-flare-500 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-flare-600">
              <Sparkles class="h-3 w-3" /> AI 추천
            </button>
          </div>
        </div>
        <div class="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p class="mb-1 text-[10px] font-bold text-forena-400">담당 협력사</p>
            <p class="text-sm font-semibold text-forena-800">{{ t.partner }}</p>
          </div>
          <div>
            <p class="mb-2 text-[10px] font-bold text-forena-400">계획 / 실제 진척률</p>
            <div class="space-y-1.5">
              <div>
                <div class="mb-0.5 flex justify-between text-[10px]"><span class="text-forena-400">계획 {{ t.plannedPct }}%</span></div>
                <div class="h-2 overflow-hidden rounded-full bg-forena-100"><div class="h-full rounded-full bg-forena-300" :style="{ width: t.plannedPct + '%' }" /></div>
              </div>
              <div>
                <div class="mb-0.5 flex justify-between text-[10px]"><span class="font-bold text-rose-500">실제 {{ t.actualPct }}% (차이 -{{ t.diff }}%)</span></div>
                <div class="h-2 overflow-hidden rounded-full bg-forena-100"><div class="h-full rounded-full" :class="riskBar(t.risk)" :style="{ width: t.actualPct + '%' }" /></div>
              </div>
            </div>
          </div>
          <div>
            <p class="mb-1 text-[10px] font-bold text-forena-400">지연 원인</p>
            <p class="text-xs text-forena-700">{{ t.cause }}</p>
            <p class="mt-2 text-[10px] font-bold text-forena-400">예상 지연</p>
            <p class="text-sm font-bold text-rose-600">{{ t.expectedDelayDays }}일</p>
          </div>
          <div>
            <p class="mb-1 text-[10px] font-bold text-rose-500">후속 공정 영향</p>
            <p class="text-xs text-forena-700">{{ t.followEffect }}</p>
          </div>
        </div>
      </div>

      <div v-if="!visibleTasks.length"
        class="flex h-40 items-center justify-center rounded-xl border border-dashed border-forena-200 bg-white text-sm text-forena-400">
        지연 위험 작업이 없습니다
      </div>
    </div>

    <!-- ══ TAB 3: AI 추천안 ════════════════════════════════════════ -->
    <div v-if="activeTab === 'ai'" class="grid gap-5 lg:grid-cols-12">
      <!-- 좌: 작업 목록 -->
      <div class="overflow-hidden rounded-xl border border-forena-200 bg-white lg:col-span-4">
        <div class="border-b border-forena-100 bg-forena-50/60 px-4 py-2.5">
          <p class="text-sm font-bold text-forena-900">지연 위험 작업</p>
          <p class="text-[11px] text-forena-400">선택하면 AI 추천안을 확인합니다</p>
        </div>
        <div class="divide-y divide-forena-50">
          <div v-for="t in visibleTasks" :key="t.id"
            class="cursor-pointer p-4 transition-colors hover:bg-forena-50/60"
            :class="selectedTaskId === t.id ? 'border-l-2 border-l-flare-500 bg-flare-50/50' : ''"
            @click="selectedTaskId = t.id">
            <div class="mb-2 flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-forena-900">{{ t.name }}</p>
              <span class="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold" :class="riskColor(t.risk)">{{ t.risk }}</span>
            </div>
            <div class="text-[10px] text-forena-400">
              {{ t.process }} 공정 · 차이 <strong class="text-rose-500">-{{ t.diff }}%</strong>
            </div>
          </div>
          <div v-if="!visibleTasks.length" class="py-12 text-center text-xs text-slate-400">
            지연 위험 작업이 없습니다
          </div>
        </div>
      </div>

      <!-- 우: AI 추천안 상세 -->
      <div class="lg:col-span-8">
        <div v-if="selectedTask && selectedRec" class="overflow-hidden rounded-xl border border-forena-200 bg-white">
          <div class="flex items-center justify-between border-b border-forena-100 bg-forena-50/60 px-4 py-2.5">
            <div class="flex items-center gap-2">
              <Sparkles class="h-4 w-4 text-flare-600" />
              <p class="text-sm font-bold text-forena-900">AI 추천안 — {{ selectedTask.name }}</p>
            </div>
            <button @click="selectedTaskId = null" class="text-forena-400 hover:text-forena-700">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-4 p-4">
            <!-- 진척률 비교 -->
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-lg border border-forena-100 bg-forena-50/40 p-3 text-center">
                <p class="mb-1 text-[10px] font-bold text-forena-400">계획 진척률</p>
                <p class="text-2xl font-bold tabular-nums text-forena-700">{{ selectedTask.plannedPct }}%</p>
              </div>
              <div class="rounded-lg border border-rose-100 bg-rose-50/40 p-3 text-center">
                <p class="mb-1 text-[10px] font-bold text-rose-500">실제 진척률</p>
                <p class="text-2xl font-bold tabular-nums text-rose-700">{{ selectedTask.actualPct }}%</p>
              </div>
              <div class="rounded-lg border border-orange-100 bg-orange-50/40 p-3 text-center">
                <p class="mb-1 text-[10px] font-bold text-orange-600">예상 지연</p>
                <p class="text-2xl font-bold tabular-nums text-orange-700">{{ selectedTask.expectedDelayDays }}일</p>
              </div>
            </div>

            <!-- AI 분석 요약 -->
            <div class="rounded-lg border border-amber-100 bg-amber-50/40 px-3.5 py-3">
              <p class="mb-1.5 text-[11px] font-bold text-amber-700">AI 분석 요약</p>
              <p class="text-xs leading-relaxed text-amber-900">{{ selectedRec.summary }}</p>
            </div>

            <!-- 수정 가능한 추천안 -->
            <div class="rounded-lg border border-flare-200 bg-flare-50/30 px-3.5 py-3">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-[11px] font-bold text-flare-700">AI 추천 수치 (수정 가능)</p>
                <button @click="openEditRec(selectedTaskId)"
                  class="inline-flex items-center gap-1 rounded-lg border border-flare-300 bg-white px-2.5 py-1 text-[11px] font-bold text-flare-700 transition-colors hover:bg-flare-50">
                  <Pencil class="h-3 w-3" /> 수정
                </button>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-lg border border-flare-100 bg-white p-3">
                  <p class="mb-0.5 text-[10px] font-bold text-forena-400">일정 연장</p>
                  <p class="text-xl font-bold tabular-nums text-flare-700">+{{ selectedRec.editedAddDays }}일</p>
                  <p class="mt-0.5 text-[10px] text-forena-400">
                    {{ selectedTask.originalEnd }} → {{ addDaysStr(selectedTask.originalEnd, selectedRec.editedAddDays) }}
                  </p>
                </div>
                <div class="rounded-lg border border-flare-100 bg-white p-3">
                  <p class="mb-0.5 text-[10px] font-bold text-forena-400">추가 인력</p>
                  <p class="text-xl font-bold tabular-nums text-flare-700">+{{ selectedRec.editedWorkers }}명</p>
                  <p class="mt-0.5 text-[10px] text-forena-400">
                    현재 {{ selectedTask.actualWorkers }}명 → {{ selectedTask.actualWorkers + selectedRec.editedWorkers }}명
                  </p>
                </div>
              </div>
              <div class="mt-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                <strong>예상 효과:</strong> {{ selectedRec.expectedEffect }}
              </div>
            </div>

            <!-- AI 권고사항 -->
            <div class="rounded-lg border border-forena-100 bg-forena-50/40 px-3.5 py-3">
              <p class="mb-1.5 text-[11px] font-bold text-forena-400">AI 권고사항</p>
              <p class="text-xs leading-relaxed text-forena-800">{{ selectedRec.recommendation }}</p>
            </div>

            <!-- 후속 공정 영향 -->
            <div>
              <p class="mb-2 text-[11px] font-bold text-forena-400">후속 공정 영향</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="(t, i) in selectedRec.affectedTasks" :key="i"
                  class="flex items-center gap-1 rounded-md border border-rose-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-rose-400"></span>{{ t }}
                </span>
              </div>
            </div>

            <!-- 책임자: 변경 요청 등록 (자기 공정만) -->
            <div v-if="!isSupervisor && selectedTask.process === myProcess"
              class="rounded-lg border border-forena-100 bg-forena-50/60 p-3">
              <p class="mb-2.5 text-[11px] font-bold text-forena-400">이 추천안을 바탕으로 일정 변경 요청</p>
              <button @click="createRequestFromAi"
                class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-forena-800 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forena-900">
                <Plus class="h-4 w-4" />
                일정 변경 요청 등록
              </button>
            </div>
            <div v-else-if="!isSupervisor"
              class="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
              <Eye class="mr-1 inline h-3 w-3" />
              {{ selectedTask.process }} 공정은 본인 담당이 아니므로 조회만 가능합니다.
            </div>

            <div v-if="isSupervisor"
              class="rounded-lg border border-forena-100 bg-forena-50/60 px-3.5 py-3 text-xs text-forena-500">
              AI 추천안은 참고용입니다. 일정 변경은 공정 책임자 요청 → 총 책임자 승인 → 일정 반영 순으로 처리됩니다.
            </div>
          </div>
        </div>

        <div v-else class="flex h-52 items-center justify-center rounded-xl border border-dashed border-forena-200 bg-white text-sm text-forena-400">
          왼쪽 목록에서 작업을 선택하세요
        </div>
      </div>
    </div>

    <!-- ══ TAB 4: 일정 변경 요청 / 승인 ════════════════════════════ -->
    <div v-if="activeTab === 'approval'" class="space-y-4">

      <!-- 책임자: 요청 등록 폼 -->
      <div v-if="!isSupervisor">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm font-bold text-forena-900">일정 변경 요청</p>
          <button @click="showRequestForm = !showRequestForm"
            class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-2 text-xs font-bold text-forena-700 transition-colors hover:bg-forena-50">
            <Plus class="h-3.5 w-3.5" />
            {{ showRequestForm ? '닫기' : '새 요청 등록' }}
          </button>
        </div>

        <div v-if="showRequestForm" class="overflow-hidden rounded-xl border border-flare-200 bg-white">
          <div class="border-b border-flare-100 bg-flare-50/40 px-4 py-2.5">
            <p class="text-sm font-bold text-forena-900">일정 변경 요청 등록</p>
          </div>
          <div class="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-[11px] font-bold text-forena-400">공정명</label>
              <input v-model="requestForm.process" readonly
                class="w-full rounded-lg border border-forena-200 bg-forena-50 px-3 py-2 text-xs text-forena-600 outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-bold text-forena-400">작업명 <span class="text-rose-500">*</span></label>
              <input v-model="requestForm.task" placeholder="작업명 입력"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 text-xs outline-none transition-colors focus:border-flare-400" />
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-bold text-forena-400">기존 시작일</label>
              <input type="date" v-model="requestForm.oldStart"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 text-xs outline-none focus:border-flare-400" />
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-bold text-forena-400">기존 종료일</label>
              <input type="date" v-model="requestForm.oldEnd"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 text-xs outline-none focus:border-flare-400" />
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-bold text-forena-400">변경 시작일 <span class="text-rose-500">*</span></label>
              <input type="date" v-model="requestForm.newStart"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 text-xs outline-none focus:border-flare-400" />
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-bold text-forena-400">변경 종료일 <span class="text-rose-500">*</span></label>
              <input type="date" v-model="requestForm.newEnd"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 text-xs outline-none focus:border-flare-400" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-[11px] font-bold text-forena-400">변경 사유 <span class="text-rose-500">*</span></label>
              <textarea v-model="requestForm.reason" rows="2" placeholder="일정 변경이 필요한 이유를 입력하세요"
                class="w-full resize-none rounded-lg border border-forena-200 px-3 py-2 text-xs outline-none transition-colors focus:border-flare-400" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-[11px] font-bold text-forena-400">지연 원인</label>
              <input v-model="requestForm.cause" placeholder="지연 원인 (기상, 인력, 자재 등)"
                class="w-full rounded-lg border border-forena-200 px-3 py-2 text-xs outline-none transition-colors focus:border-flare-400" />
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="aiApplied" v-model="requestForm.aiApplied" class="h-4 w-4 accent-flare-600" />
              <label for="aiApplied" class="text-xs font-semibold text-forena-700">AI 추천안 반영</label>
            </div>
            <div>
              <label class="mb-1 block text-[11px] font-bold text-forena-400">첨부파일</label>
              <button @click="pickRequestFiles"
                class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100">
                <Paperclip class="h-3 w-3" /> 파일 선택
              </button>
              <input ref="requestFormFileRef" type="file" class="sr-only"
                accept=".pdf,.xls,.xlsx,.csv,image/*" multiple @change="onRequestFileChange" />
            </div>
            <div v-if="requestForm.attachments.length" class="sm:col-span-2">
              <p class="mb-1 text-[10px] font-bold text-forena-400">첨부된 파일</p>
              <ul class="space-y-1">
                <li v-for="(f, i) in requestForm.attachments" :key="f.id"
                  class="flex items-center gap-2 rounded-lg bg-forena-50/60 px-2.5 py-1.5 text-xs">
                  <FileText class="h-3.5 w-3.5 text-forena-400" />
                  <span class="flex-1 truncate text-forena-800">{{ f.name }}</span>
                  <span class="shrink-0 text-[10px] text-forena-400 tabular-nums">{{ fmtSize(f.size) }}</span>
                  <button @click="removeRequestFile(i)" class="text-slate-400 hover:text-rose-600">
                    <Trash2 class="h-3 w-3" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-4 py-3">
            <button @click="showRequestForm = false; resetRequestForm()"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-600 transition-colors hover:bg-forena-50">취소</button>
            <button @click="submitRequest" :disabled="!requestFormValid"
              class="rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
              :class="requestFormValid ? 'bg-forena-800 hover:bg-forena-900' : ''">요청 등록</button>
          </div>
        </div>
      </div>

      <!-- 변경 요청 목록 -->
      <div>
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm font-bold text-forena-900">{{ isSupervisor ? '전체 일정 변경 요청 목록' : '내 요청 목록' }}</p>
          <span class="text-xs text-forena-400">총 {{ visibleRequests.length }}건 · 승인 대기 {{ kpi.pendingCount }}건</span>
        </div>
        <div class="space-y-3">
          <div v-for="r in visibleRequests" :key="r.id" class="overflow-hidden rounded-xl border border-forena-200 bg-white">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 bg-forena-50/60 px-4 py-3">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-semibold text-forena-900">{{ r.process }} · {{ r.task }}</p>
                <span class="rounded-lg px-2 py-0.5 text-[10px] font-bold" :class="reqStatusColor(r.status)">{{ reqStatusLabel(r.status) }}</span>
                <span v-if="r.aiApplied" class="rounded bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700 ring-1 ring-flare-200">AI 반영</span>
              </div>
              <div class="flex items-center gap-2 text-[11px] text-forena-400">
                <span>{{ r.requester }}</span><span>·</span><span>{{ r.requestDate }}</span>
              </div>
            </div>
            <div class="grid gap-4 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p class="mb-1 text-[10px] font-bold text-forena-400">기존 일정</p>
                <p class="tabular-nums text-forena-600">{{ r.oldStart || '-' }} ~ {{ r.oldEnd }}</p>
              </div>
              <div>
                <p class="mb-1 text-[10px] font-bold text-flare-600">변경 요청 일정</p>
                <p class="font-semibold tabular-nums text-forena-800">{{ r.newStart || '-' }} ~ {{ r.newEnd }}</p>
              </div>
              <div>
                <p class="mb-1 text-[10px] font-bold text-forena-400">변경 사유</p>
                <p class="text-forena-700">{{ r.reason }}</p>
              </div>
              <div>
                <p class="mb-1 text-[10px] font-bold text-forena-400">지연 원인</p>
                <p class="text-forena-700">{{ r.cause }}</p>
              </div>
            </div>

            <div v-if="r.attachments?.length" class="mx-4 mb-3 flex flex-wrap gap-1.5">
              <span v-for="(f, i) in r.attachments" :key="i"
                class="inline-flex items-center gap-1 rounded-md bg-forena-50 px-2 py-0.5 text-[10px] font-semibold text-forena-700">
                <Paperclip class="h-3 w-3" />{{ f.name }}
              </span>
            </div>

            <!-- 반려 사유 -->
            <div v-if="r.status === 'rejected' && r.rejectReason"
              class="mx-4 mb-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs">
              <p class="mb-0.5 font-bold text-rose-600">반려 사유</p>
              <p class="text-rose-800">{{ r.rejectReason }}</p>
            </div>

            <!-- 책임자 액션: pending이면 승인/반려, approved면 일정 반영 -->
            <div v-if="isSupervisor && (r.status === 'pending' || r.status === 'approved')"
              class="flex justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-4 py-3">
              <button v-if="r.status === 'pending'" @click="openRejectModal(r.id)"
                class="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50">
                <X class="h-3.5 w-3.5" /> 반려
              </button>
              <button v-if="r.status === 'pending'" @click="approveRequest(r.id)"
                class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-600">
                <Check class="h-3.5 w-3.5" /> 승인
              </button>
              <button v-if="r.status === 'approved'" @click="applyToSchedule(r.id)"
                class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-flare-600">
                <Send class="h-3.5 w-3.5" /> 공정표 반영
              </button>
            </div>
          </div>

          <div v-if="!visibleRequests.length"
            class="flex h-32 items-center justify-center rounded-xl border border-dashed border-forena-200 bg-white text-sm text-forena-400">
            일정 변경 요청이 없습니다
          </div>
        </div>
      </div>
    </div>

    <!-- ══ TAB 5: 변경 이력 ════════════════════════════════════════ -->
    <div v-if="activeTab === 'history'" class="overflow-hidden rounded-xl border border-forena-200 bg-white">
      <div class="border-b border-forena-100 bg-forena-50/60 px-4 py-2.5">
        <p class="text-sm font-bold text-forena-900">변경 이력</p>
        <p class="text-[11px] text-forena-400">일정 변경 요청 승인 · 반려 · 일정 반영 처리 이력</p>
      </div>
      <table class="w-full text-xs">
        <thead class="border-b border-forena-100 bg-forena-50/30">
          <tr>
            <th class="px-4 py-3 text-left text-[10px] font-bold text-forena-400">처리</th>
            <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">공정 · 작업</th>
            <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">변경 전 종료</th>
            <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">변경 후 종료</th>
            <th class="px-4 py-3 text-left text-[10px] font-bold text-forena-400">사유</th>
            <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">처리자</th>
            <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">AI 추천 반영</th>
            <th class="px-3 py-3 text-left text-[10px] font-bold text-forena-400">처리일</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-forena-50">
          <tr v-for="h in visibleHistory" :key="h.id" class="transition-colors hover:bg-forena-50/40">
            <td class="px-4 py-3.5">
              <span class="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                :class="h.action === '승인' ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                       : h.action === '일정 반영' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                       : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'">{{ h.action }}</span>
            </td>
            <td class="px-3 py-3.5 font-semibold text-forena-800">{{ h.process }} · {{ h.task }}</td>
            <td class="px-3 py-3.5 tabular-nums text-forena-500 line-through">{{ h.oldEnd }}</td>
            <td class="px-3 py-3.5 font-semibold tabular-nums text-forena-800">{{ h.newEnd }}</td>
            <td class="max-w-[180px] truncate px-4 py-3.5 text-forena-600">{{ h.reason }}</td>
            <td class="px-3 py-3.5 text-forena-500">{{ h.approver }}</td>
            <td class="px-3 py-3.5">
              <span v-if="h.aiApplied" class="rounded bg-flare-50 px-1.5 py-0.5 text-[9px] font-bold text-flare-700 ring-1 ring-flare-200">반영</span>
              <span v-else class="text-forena-300">–</span>
            </td>
            <td class="px-3 py-3.5 tabular-nums text-forena-400">{{ h.processedAt }}</td>
          </tr>
          <tr v-if="!visibleHistory.length">
            <td colspan="8" class="px-4 py-12 text-center text-sm text-forena-400">변경 이력이 없습니다</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══ 모달: AI 추천 수정 ══════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="editRecModal.show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="editRecModal.show = false">
        <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-forena-100 bg-flare-50/60 px-5 py-4">
            <div class="flex items-center gap-2">
              <Pencil class="h-4 w-4 text-flare-600" />
              <p class="font-bold text-forena-900">AI 추천 수치 수정</p>
            </div>
            <button @click="editRecModal.show = false" class="text-forena-400 hover:text-forena-700">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-5 p-5">
            <p class="text-[11px] text-forena-500">AI 추천 수치를 현장 상황에 맞게 조정할 수 있습니다.</p>
            <div>
              <label class="mb-2 block text-[11px] font-bold text-forena-400">일정 연장 (일)</label>
              <div class="flex items-center gap-3">
                <input type="range" v-model.number="editRecModal.days" min="0" max="30" step="1" class="flex-1 accent-flare-600" />
                <span class="w-16 text-right font-bold tabular-nums text-flare-700">+{{ editRecModal.days }}일</span>
              </div>
              <div class="mt-0.5 flex justify-between text-[10px] text-forena-400"><span>0일</span><span>30일</span></div>
            </div>
            <div>
              <label class="mb-2 block text-[11px] font-bold text-forena-400">추가 인력 (명)</label>
              <div class="flex items-center gap-3">
                <input type="range" v-model.number="editRecModal.workers" min="0" max="20" step="1" class="flex-1 accent-flare-600" />
                <span class="w-16 text-right font-bold tabular-nums text-flare-700">+{{ editRecModal.workers }}명</span>
              </div>
              <div class="mt-0.5 flex justify-between text-[10px] text-forena-400"><span>0명</span><span>20명</span></div>
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-forena-100 bg-forena-50/60 px-5 py-3">
            <button @click="editRecModal.show = false"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-600 transition-colors hover:bg-forena-50">취소</button>
            <button @click="saveEditRec"
              class="rounded-lg bg-flare-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-flare-700">저장</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ 모달: 반려 사유 입력 ════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="rejectModal.show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="rejectModal.show = false">
        <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-rose-100 bg-rose-50/60 px-5 py-4">
            <div class="flex items-center gap-2">
              <AlertTriangle class="h-4 w-4 text-rose-600" />
              <p class="font-bold text-rose-800">일정 변경 요청 반려</p>
            </div>
            <button @click="rejectModal.show = false" class="text-rose-400 hover:text-rose-700">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-3 p-5">
            <p class="text-xs text-forena-600">반려 사유를 입력해주세요. 입력한 내용은 공정 책임자에게 전달됩니다.</p>
            <div>
              <label class="mb-1.5 block text-[11px] font-bold text-forena-400">반려 사유 <span class="text-rose-500">*</span></label>
              <textarea v-model="rejectModal.reason" rows="4"
                placeholder="예: 제출된 근거 자료 미흡, 추가 현장 확인 필요, 다른 공정 일정과 충돌 등"
                class="w-full resize-none rounded-lg border border-forena-200 px-3 py-2.5 text-xs outline-none transition-colors focus:border-rose-400" />
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-forena-100 bg-forena-50/60 px-5 py-3">
            <button @click="rejectModal.show = false"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-600 transition-colors hover:bg-forena-50">취소</button>
            <button @click="confirmReject" :disabled="!rejectModal.reason.trim()"
              class="rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
              :class="rejectModal.reason.trim() ? 'bg-rose-600 hover:bg-rose-700' : ''">반려 확인</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ 모달: 작업 상세 ═════════════════════════════════════════ -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="taskDetailModal.show && detailTask"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="closeTaskDetail">
        <div class="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <div class="flex shrink-0 items-center justify-between border-b border-forena-100 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-flare-50">
                <ClipboardList class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">지연 위험 작업 상세</p>
                <p class="mt-0.5 text-xs text-forena-500">{{ detailTask.process }} 공정 · {{ detailTask.partner }}</p>
              </div>
            </div>
            <button @click="closeTaskDetail" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <!-- 타이틀 + 위험도 -->
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-lg font-bold text-forena-900">{{ detailTask.name }}</h2>
              <span v-if="detailTask.isCritical" class="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">CP · 임계공정</span>
              <span class="rounded-lg px-2 py-0.5 text-[11px] font-bold" :class="riskColor(detailTask.risk)">위험도 {{ detailTask.risk }}</span>
            </div>
            <p class="mt-1 text-xs text-forena-500">
              <ChevronRight class="inline h-3 w-3" />작업 위치: <strong class="text-forena-700">{{ detailTask.location }}</strong>
            </p>

            <!-- 진척률 박스 -->
            <div class="mt-4 grid grid-cols-3 gap-2.5">
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3">
                <p class="text-[10px] font-bold uppercase text-forena-400">계획</p>
                <p class="mt-0.5 text-2xl font-bold tabular-nums text-forena-700">{{ detailTask.plannedPct }}%</p>
              </div>
              <div class="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                <p class="text-[10px] font-bold uppercase text-rose-500">실제</p>
                <p class="mt-0.5 text-2xl font-bold tabular-nums text-rose-700">{{ detailTask.actualPct }}%</p>
                <p class="mt-0.5 text-[10px] text-rose-500">차이 -{{ detailTask.diff }}%</p>
              </div>
              <div class="rounded-xl border border-orange-200 bg-orange-50/40 p-3">
                <p class="text-[10px] font-bold uppercase text-orange-600">예상 지연</p>
                <p class="mt-0.5 text-2xl font-bold tabular-nums text-orange-700">{{ detailTask.expectedDelayDays }}일</p>
              </div>
            </div>

            <!-- 정보 -->
            <div class="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div class="rounded-xl border border-forena-100 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">지연 원인</p>
                <p class="mt-1 text-xs leading-relaxed text-forena-800">{{ detailTask.cause }}</p>
              </div>
              <div class="rounded-xl border border-rose-100 bg-rose-50/30 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-rose-500">후속 공정 영향</p>
                <p class="mt-1 text-xs leading-relaxed text-rose-800">{{ detailTask.followEffect }}</p>
              </div>
              <div class="rounded-xl border border-forena-100 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">현재 투입 인력</p>
                <p class="mt-1 text-sm font-bold text-forena-900">{{ detailTask.actualWorkers }}명</p>
              </div>
              <div class="rounded-xl border border-forena-100 px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">계획 종료일</p>
                <p class="mt-1 text-sm font-bold tabular-nums text-forena-900">{{ detailTask.originalEnd }}</p>
              </div>
            </div>

            <!-- AI 요약 미리보기 -->
            <div v-if="detailRec" class="mt-3 rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3">
              <p class="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                <Sparkles class="h-3.5 w-3.5" />AI 분석 요약
              </p>
              <p class="mt-1 text-xs leading-relaxed text-amber-900">{{ detailRec.summary }}</p>
            </div>
          </div>

          <div class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3">
            <button @click="closeTaskDetail"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50">
              닫기
            </button>
            <button @click="selectedTaskId = detailTask.id; activeTab = 'ai'; closeTaskDetail()"
              class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600">
              <Sparkles class="h-3.5 w-3.5" /> AI 추천안 보기
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>
