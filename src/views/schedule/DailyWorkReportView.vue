<script setup>
import { computed, ref } from 'vue'
import {
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Filter,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-vue-next'

const today = new Date().toISOString().slice(0, 10)
const selectedDate = ref(today)
const activeTab = ref('byDate')
const selectedTaskId = ref('WR-001')
const currentRole = ref('현장 총책임자')

const tabs = [
  { key: 'byDate', label: '날짜별 공사일보' },
  { key: 'today', label: '금일 공사일보' },
  { key: 'tomorrow', label: '명일 공사일보' },
  { key: 'upload', label: '공사일보 업로드' },
  { key: 'approval', label: '검토/승인' },
]

const roles = ['현장 총책임자', '공정 책임자', '본사 관리자', '일반 사용자']
const trades = ['철근', '형틀', '전기', '방수', '설비', '토공']
const workStatuses = ['완료', '일부 완료', '미완료', '작업 중지']
const incompleteReasons = ['인력 부족', '자재 지연', '장비 문제', '날씨 영향', '선행 공정 지연', '작업 공간 제한', '기타']
const approvalStatuses = ['작성 전', '작성 중', '제출 완료', '검토 중', '승인 완료', '반려', '수정 요청']

const filters = ref({
  keyword: '',
  trade: '',
  status: '',
  reason: '',
  approval: '',
  delayOnly: false,
})

const calendarDays = ref([
  { date: '2026-04-24', day: 24, type: '과거', status: '승인 완료', taskCount: 7, completed: 6, delayed: 1 },
  { date: '2026-04-25', day: 25, type: '과거', status: '승인 완료', taskCount: 5, completed: 5, delayed: 0 },
  { date: '2026-04-26', day: 26, type: '과거', status: '제출 완료', taskCount: 6, completed: 4, delayed: 1 },
  { date: '2026-04-27', day: 27, type: '과거', status: '검토 중', taskCount: 8, completed: 5, delayed: 2 },
  { date: '2026-04-28', day: 28, type: '과거', status: '반려', taskCount: 7, completed: 4, delayed: 2 },
  { date: today, day: Number(today.slice(8, 10)), type: '금일', status: '작성 중', taskCount: 6, completed: 2, delayed: 2 },
  { date: '2026-04-30', day: 30, type: '명일', status: '작성 전', taskCount: 5, completed: 0, delayed: 1 },
])

const todayTasks = ref([
  {
    id: 'WR-001',
    name: 'A동 3층 철근 배근',
    trade: '철근',
    location: 'A동 3층 코어부',
    plannedStart: '2026-04-27',
    plannedEnd: '2026-04-30',
    plannedProgress: 80,
    actualProgress: 55,
    plannedWorkers: 8,
    actualWorkers: 5,
    requiredEquipment: '타워크레인 1대',
    actualEquipment: '타워크레인 1대',
    status: '일부 완료',
    incompleteReason: '인력 부족',
    note: '협력사 인력 부족으로 일부 작업 잔여',
    delayed: true,
    analysisApplied: false,
    weatherImpact: false,
    equipmentIssue: false,
    tbmDone: true,
    instructionId: 'WI-20260429-001',
    documents: ['철근 배근 작업지시서.pdf'],
    cp: true,
    weight: 6.5,
    writer: '김현장',
    reviewer: '박공정',
    approver: '이총책',
  },
  {
    id: 'WR-002',
    name: 'B동 지하 방수 1구간',
    trade: '방수',
    location: 'B동 B2 주차구역',
    plannedStart: '2026-04-28',
    plannedEnd: '2026-04-29',
    plannedProgress: 100,
    actualProgress: 100,
    plannedWorkers: 4,
    actualWorkers: 4,
    requiredEquipment: '-',
    actualEquipment: '-',
    status: '완료',
    incompleteReason: '',
    note: '누수 취약부 보강 완료',
    delayed: false,
    analysisApplied: true,
    weatherImpact: false,
    equipmentIssue: false,
    tbmDone: true,
    instructionId: 'WI-20260429-002',
    documents: ['방수 시공계획서.xlsx'],
    cp: false,
    weight: 3.2,
    writer: '최방수',
    reviewer: '박공정',
    approver: '이총책',
  },
  {
    id: 'WR-003',
    name: '1층 전기 배관 매립',
    trade: '전기',
    location: 'A동 1층 전기실',
    plannedStart: '2026-04-29',
    plannedEnd: '2026-05-01',
    plannedProgress: 45,
    actualProgress: 40,
    plannedWorkers: 3,
    actualWorkers: 3,
    requiredEquipment: '고소작업대 1대',
    actualEquipment: '고소작업대 1대',
    status: '일부 완료',
    incompleteReason: '선행 공정 지연',
    note: '형틀 해체 지연으로 일부 구간 대기',
    delayed: true,
    analysisApplied: false,
    weatherImpact: false,
    equipmentIssue: false,
    tbmDone: true,
    instructionId: 'WI-20260429-003',
    documents: ['전기 배관 도면.dwg'],
    cp: false,
    weight: 2.8,
    writer: '정전기',
    reviewer: '박공정',
    approver: '',
  },
  {
    id: 'WR-004',
    name: 'C동 외부 비계 해체',
    trade: '형틀',
    location: 'C동 외부 입면',
    plannedStart: '2026-04-29',
    plannedEnd: '2026-04-29',
    plannedProgress: 60,
    actualProgress: 20,
    plannedWorkers: 6,
    actualWorkers: 2,
    requiredEquipment: '크레인 1대',
    actualEquipment: '미사용',
    status: '작업 중지',
    incompleteReason: '날씨 영향',
    note: '강풍 예보로 오후 작업 중지',
    delayed: true,
    analysisApplied: false,
    weatherImpact: true,
    equipmentIssue: false,
    tbmDone: true,
    instructionId: 'WI-20260429-004',
    documents: ['외부 비계 해체계획.pdf'],
    cp: true,
    weight: 4.1,
    writer: '오형틀',
    reviewer: '',
    approver: '',
  },
])

const tomorrowTasks = ref([
  {
    id: 'TM-001',
    name: 'A동 3층 철근 배근 잔여분',
    trade: '철근',
    location: 'A동 3층 코어부',
    time: '07:00 ~ 17:00',
    requiredWorkers: 8,
    assignedWorkers: 8,
    equipment: '타워크레인 1대',
    equipmentStatus: '입차 예정',
    carryOver: true,
    risk: '금일 미완료 연계, CP 영향 가능',
    note: '오전 집중 투입 필요',
    status: '확인 필요',
  },
  {
    id: 'TM-002',
    name: 'B동 지하 방수 2구간',
    trade: '방수',
    location: 'B동 B2 주차구역',
    time: '08:00 ~ 16:30',
    requiredWorkers: 4,
    assignedWorkers: 3,
    equipment: '-',
    equipmentStatus: '해당 없음',
    carryOver: false,
    risk: '자재 입고 확인 필요',
    note: '방수재 반입 확인 후 착수',
    status: '초안',
  },
  {
    id: 'TM-003',
    name: 'C동 외부 비계 해체 재개',
    trade: '형틀',
    location: 'C동 외부 입면',
    time: '09:00 ~ 17:00',
    requiredWorkers: 6,
    assignedWorkers: 5,
    equipment: '크레인 1대',
    equipmentStatus: '승인 대기',
    carryOver: true,
    risk: '강풍 예보',
    note: '풍속 확인 후 작업 여부 결정',
    status: '변경 필요',
  },
])

const uploadForm = ref({
  reportDate: today,
  documentName: '',
  documentType: 'Excel',
  target: '금일',
  description: '',
  fileName: '',
})

const aiResults = ref([
  {
    id: 'AI-001',
    checked: true,
    name: 'A동 3층 철근 배근',
    trade: '철근',
    location: 'A동 3층 코어부',
    actualProgress: 55,
    actualWorkers: 5,
    status: '일부 완료',
    incompleteReason: '인력 부족',
    note: '협력사 인원 부족',
    equipment: '타워크레인 1대',
    weatherImpact: false,
    delayed: true,
    confidence: 91,
    reviewStatus: '검토 중',
  },
  {
    id: 'AI-002',
    checked: false,
    name: 'C동 외부 비계 해체',
    trade: '형틀',
    location: 'C동 외부 입면',
    actualProgress: 20,
    actualWorkers: 2,
    status: '작업 중지',
    incompleteReason: '날씨 영향',
    note: '강풍으로 중지',
    equipment: '미사용',
    weatherImpact: true,
    delayed: true,
    confidence: 83,
    reviewStatus: '미검토',
  },
])

const approvals = ref([
  { id: 'AP-001', date: today, trade: '철근', writer: '김현장', taskCount: 2, completed: 0, delayed: 1, status: '제출 완료', scope: '전체' },
  { id: 'AP-002', date: today, trade: '방수', writer: '최방수', taskCount: 1, completed: 1, delayed: 0, status: '승인 완료', scope: '전체' },
  { id: 'AP-003', date: today, trade: '전기', writer: '정전기', taskCount: 1, completed: 0, delayed: 1, status: '검토 중', scope: '전기' },
])

const roleNotice = computed(() => {
  if (currentRole.value === '현장 총책임자') return '전체 공사일보와 금일 전체 작업 실적을 조회하고 최종 승인할 수 있습니다.'
  if (currentRole.value === '공정 책임자') return '본인 담당 공정의 공사일보와 작업 실적만 조회/작성할 수 있습니다.'
  if (currentRole.value === '본사 관리자') return '승인 완료된 공사일보와 현장 실적 요약만 조회할 수 있습니다.'
  return '일반 사용자는 제한된 조회만 가능합니다.'
})

const canApprove = computed(() => currentRole.value === '현장 총책임자')
const canEditReport = computed(() => ['현장 총책임자', '공정 책임자'].includes(currentRole.value))
const selectedDay = computed(() => calendarDays.value.find((day) => day.date === selectedDate.value) ?? calendarDays.value[5])
const selectedTask = computed(() => todayTasks.value.find((task) => task.id === selectedTaskId.value) ?? todayTasks.value[0])

const visibleTodayTasks = computed(() => {
  let rows = todayTasks.value
  if (currentRole.value === '공정 책임자') rows = rows.filter((task) => task.trade === '철근')
  if (currentRole.value === '본사 관리자') rows = rows.filter((task) => task.analysisApplied)
  if (filters.value.trade) rows = rows.filter((task) => task.trade === filters.value.trade)
  if (filters.value.status) rows = rows.filter((task) => task.status === filters.value.status)
  if (filters.value.reason) rows = rows.filter((task) => task.incompleteReason === filters.value.reason)
  if (filters.value.delayOnly) rows = rows.filter((task) => task.delayed)

  const keyword = filters.value.keyword.trim().toLowerCase()
  if (keyword) {
    rows = rows.filter((task) =>
      [task.name, task.trade, task.location, task.writer].some((value) => value.toLowerCase().includes(keyword)),
    )
  }
  return rows
})

const filteredApprovals = computed(() => {
  let rows = approvals.value
  if (currentRole.value === '공정 책임자') rows = rows.filter((row) => row.trade === '철근')
  if (currentRole.value === '본사 관리자') rows = rows.filter((row) => row.status === '승인 완료')
  if (filters.value.approval) rows = rows.filter((row) => row.status === filters.value.approval)
  if (filters.value.trade) rows = rows.filter((row) => row.trade === filters.value.trade)
  return rows
})

const summary = computed(() => {
  const tasks = visibleTodayTasks.value
  return {
    taskCount: tasks.length,
    completed: tasks.filter((task) => task.status === '완료').length,
    incomplete: tasks.filter((task) => task.status !== '완료').length,
    delayed: tasks.filter((task) => task.delayed).length,
    avgProgress: tasks.length ? Math.round(tasks.reduce((sum, task) => sum + Number(task.actualProgress || 0), 0) / tasks.length) : 0,
    pendingApproval: approvals.value.filter((item) => ['제출 완료', '검토 중', '수정 요청'].includes(item.status)).length,
  }
})

const analysisPayloadPreview = computed(() =>
  todayTasks.value.map((task) => ({
    taskId: task.id,
    taskName: task.name,
    trade: task.trade,
    location: task.location,
    workDate: selectedDate.value,
    plannedProgress: task.plannedProgress,
    actualProgress: task.actualProgress,
    plannedWorkers: task.plannedWorkers,
    actualWorkers: task.actualWorkers,
    status: task.status,
    incompleteReason: task.incompleteReason || null,
    note: task.note,
    weatherImpact: task.weatherImpact,
    equipmentIssue: task.equipmentIssue,
    cp: task.cp,
    weight: task.weight,
    approvalStatus: selectedDay.value.status,
  })),
)

function badgeClass(status) {
  return {
    '작성 전': 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    '작성 중': 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    '제출 완료': 'bg-forena-50 text-forena-700 ring-1 ring-forena-200',
    '검토 중': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    '승인 완료': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    반려: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    '수정 요청': 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    '지연 발생': 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    완료: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    '일부 완료': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    미완료: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    '작업 중지': 'bg-slate-800 text-white ring-1 ring-slate-800',
    초안: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    '확인 필요': 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    확정: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    '변경 필요': 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    미검토: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    승인: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    제외: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  }[status] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

function progressGapClass(task) {
  const gap = Number(task.actualProgress) - Number(task.plannedProgress)
  if (gap >= 0) return 'text-emerald-700'
  if (gap <= -20) return 'text-rose-700'
  return 'text-amber-700'
}

function pickDate(date) {
  selectedDate.value = date
  activeTab.value = 'byDate'
}

function loadDraftFromInstruction() {
  todayTasks.value = todayTasks.value.map((task) => ({ ...task, analysisApplied: false }))
  window.alert('당일 작업지시서와 TBM 완료 정보를 기준으로 공사일보 초안을 불러왔습니다.')
}

function addCarryOverTasks() {
  const carryOvers = todayTasks.value.filter((task) => task.status !== '완료')
  window.alert(`금일 미완료 작업 ${carryOvers.length}건을 명일 예정 작업에 포함했습니다.`)
}

function saveReport(mode = '임시 저장') {
  window.alert(`공사일보가 ${mode}되었습니다. 구조화된 실적 데이터는 승인 후 공정 분석으로 전달됩니다.`)
}

function applyAnalysis() {
  selectedTask.value.analysisApplied = true
  window.alert('선택 작업의 실적 데이터가 공정 분석 반영 대기 상태로 전환되었습니다.')
}

function onUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadForm.value.fileName = file.name
  if (!uploadForm.value.documentName) uploadForm.value.documentName = file.name
  event.target.value = ''
}

function runAiAnalysis() {
  window.alert('AI/OCR 분석이 실행되었습니다. 결과는 관리자 검토 후에만 공사일보에 반영됩니다.')
}

function reflectSelectedResults(target) {
  const count = aiResults.value.filter((item) => item.checked && item.reviewStatus === '승인').length
  window.alert(`${count}건을 ${target} 공사일보 초안에 반영했습니다.`)
}

function setApproval(row, status) {
  if (!canApprove.value) {
    window.alert('최종 승인/반려/수정 요청은 현장 총책임자만 처리할 수 있습니다.')
    return
  }
  row.status = status
}
</script>

<template>
  <div class="space-y-5 pb-8">
    <div class="relative overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 p-5 shadow-card">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-flare-400 via-forena-500 to-flare-500" />
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-3">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-flare-400 to-flare-600 text-white shadow-md">
            <ClipboardCheck class="h-6 w-6" />
          </span>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리 / 작업 후 실적</p>
            <h1 class="mt-1 text-xl font-bold text-forena-900 md:text-2xl">공사일보</h1>
            <p class="mt-1 text-sm text-forena-500">당일 작업 결과를 구조화해 공정표 대비 실적, 지연 위험, AI 추천 분석에 전달합니다.</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input v-model="selectedDate" type="date"
            class="rounded-xl border border-forena-200 bg-white px-3 py-2 text-sm font-semibold text-forena-800 outline-none focus:border-flare-400 focus:ring-2 focus:ring-flare-200/50" />
          <select v-model="currentRole"
            class="rounded-xl border border-forena-200 bg-white px-3 py-2 text-sm font-semibold text-forena-800 outline-none focus:border-flare-400">
            <option v-for="role in roles" :key="role">{{ role }}</option>
          </select>
          <button type="button" class="inline-flex items-center gap-1.5 rounded-xl border border-forena-200 bg-white px-3 py-2 text-sm font-bold text-forena-700 hover:bg-forena-50" @click="loadDraftFromInstruction">
            <ClipboardList class="h-4 w-4" /> 작업지시서에서 불러오기
          </button>
          <button type="button" class="inline-flex items-center gap-1.5 rounded-xl border border-flare-200 bg-flare-50 px-3 py-2 text-sm font-bold text-forena-800 hover:bg-flare-100" @click="activeTab = 'upload'">
            <Upload class="h-4 w-4 text-flare-600" /> 공사일보 업로드
          </button>
          <button type="button" class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-forena-700 to-forena-900 px-3 py-2 text-sm font-bold text-white shadow-md" @click="saveReport('제출')">
            <Send class="h-4 w-4" /> 제출
          </button>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-forena-100 bg-forena-50/50 px-3 py-2 text-xs text-forena-600">
        <ShieldCheck class="h-4 w-4 text-forena-700" />
        <span class="font-semibold text-forena-800">{{ currentRole }}</span>
        <span>{{ roleNotice }}</span>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-5">
      <div class="rounded-2xl border border-forena-100 bg-white/95 p-4 shadow-card">
        <p class="text-xs font-bold text-forena-400">금일 작업 수</p>
        <p class="mt-2 text-2xl font-bold text-forena-900">{{ summary.taskCount }}</p>
      </div>
      <div class="rounded-2xl border border-forena-100 bg-white/95 p-4 shadow-card">
        <p class="text-xs font-bold text-forena-400">완료 작업</p>
        <p class="mt-2 text-2xl font-bold text-emerald-700">{{ summary.completed }}</p>
      </div>
      <div class="rounded-2xl border border-forena-100 bg-white/95 p-4 shadow-card">
        <p class="text-xs font-bold text-forena-400">미완료 작업</p>
        <p class="mt-2 text-2xl font-bold text-rose-700">{{ summary.incomplete }}</p>
      </div>
      <div class="rounded-2xl border border-forena-100 bg-white/95 p-4 shadow-card">
        <p class="text-xs font-bold text-forena-400">지연 위험 작업</p>
        <p class="mt-2 text-2xl font-bold text-amber-700">{{ summary.delayed }}</p>
      </div>
      <div class="rounded-2xl border border-forena-100 bg-white/95 p-4 shadow-card">
        <p class="text-xs font-bold text-forena-400">승인 대기</p>
        <p class="mt-2 text-2xl font-bold text-forena-900">{{ summary.pendingApproval }}</p>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-forena-100/90 bg-white/95 shadow-card">
      <div class="flex overflow-x-auto border-b border-forena-100 bg-forena-50/60 p-2">
        <button v-for="tab in tabs" :key="tab.key" type="button"
          class="shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition"
          :class="activeTab === tab.key ? 'bg-forena-800 text-white shadow-sm' : 'text-forena-600 hover:bg-white'"
          @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </div>

      <div class="p-5">
        <div v-if="activeTab === 'byDate'" class="grid gap-5 xl:grid-cols-12">
          <div class="xl:col-span-5">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-forena-900">날짜별 작성 상태</h2>
              <span class="text-xs text-forena-400">{{ selectedDate }}</span>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
              <button v-for="day in calendarDays" :key="day.date" type="button"
                class="rounded-xl border p-3 text-left transition hover:bg-forena-50"
                :class="selectedDate === day.date ? 'border-flare-300 bg-flare-50/60 ring-2 ring-flare-100' : 'border-forena-100 bg-white'"
                @click="pickDate(day.date)">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-lg font-bold tabular-nums text-forena-900">{{ day.day }}</p>
                    <p class="text-[11px] font-semibold text-forena-400">{{ day.type }}</p>
                  </div>
                  <span class="rounded-md px-2 py-1 text-[10px] font-bold" :class="badgeClass(day.status)">{{ day.status }}</span>
                </div>
                <p class="mt-3 text-xs text-forena-500">작업 {{ day.taskCount }}건 · 완료 {{ day.completed }}건 · 지연 {{ day.delayed }}건</p>
              </button>
            </div>
          </div>

          <div class="space-y-4 xl:col-span-7">
            <div class="rounded-2xl border border-forena-100 bg-white p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="text-base font-bold text-forena-900">{{ selectedDate }} 공사일보 요약</h2>
                  <p class="mt-1 text-xs text-forena-500">선택 날짜의 작업 실적과 작성/검토 상태입니다.</p>
                </div>
                <span class="rounded-lg px-2.5 py-1 text-xs font-bold" :class="badgeClass(selectedDay.status)">{{ selectedDay.status }}</span>
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-4">
                <div class="rounded-xl bg-forena-50/60 p-3"><p class="text-[11px] text-forena-400">작업 수</p><p class="mt-1 text-lg font-bold">{{ summary.taskCount }}</p></div>
                <div class="rounded-xl bg-emerald-50/60 p-3"><p class="text-[11px] text-emerald-600">완료</p><p class="mt-1 text-lg font-bold text-emerald-700">{{ summary.completed }}</p></div>
                <div class="rounded-xl bg-rose-50/60 p-3"><p class="text-[11px] text-rose-600">미완료</p><p class="mt-1 text-lg font-bold text-rose-700">{{ summary.incomplete }}</p></div>
                <div class="rounded-xl bg-amber-50/60 p-3"><p class="text-[11px] text-amber-600">평균 진척률</p><p class="mt-1 text-lg font-bold text-amber-700">{{ summary.avgProgress }}%</p></div>
              </div>
              <div class="mt-4 grid gap-2 text-xs text-forena-600 sm:grid-cols-3">
                <p>작성자: <strong class="text-forena-900">김현장</strong></p>
                <p>검토자: <strong class="text-forena-900">박공정</strong></p>
                <p>승인자: <strong class="text-forena-900">{{ selectedDay.status === '승인 완료' ? '이총책' : '-' }}</strong></p>
              </div>
            </div>

            <div class="overflow-hidden rounded-2xl border border-forena-100 bg-white">
              <div class="border-b border-forena-100 px-4 py-3 text-sm font-bold text-forena-900">선택 날짜 작업 목록</div>
              <div class="divide-y divide-forena-50">
                <button v-for="task in visibleTodayTasks" :key="task.id" type="button"
                  class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-forena-50/70"
                  @click="selectedTaskId = task.id; activeTab = 'today'">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-forena-900">{{ task.name }}</p>
                    <p class="mt-1 text-xs text-forena-500">{{ task.trade }} · {{ task.location }} · 계획 {{ task.plannedProgress }}% / 실제 {{ task.actualProgress }}%</p>
                  </div>
                  <ChevronRight class="h-4 w-4 shrink-0 text-forena-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'today'" class="space-y-4">
          <div class="flex flex-wrap items-center gap-2 rounded-xl border border-forena-100 bg-forena-50/50 p-3">
            <Search class="h-4 w-4 text-forena-400" />
            <input v-model="filters.keyword" type="search" placeholder="작업명, 공종, 위치, 작성자 검색"
              class="min-w-56 flex-1 rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm outline-none focus:border-flare-400" />
            <select v-model="filters.trade" class="rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm outline-none"><option value="">전체 공종</option><option v-for="trade in trades" :key="trade">{{ trade }}</option></select>
            <select v-model="filters.status" class="rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm outline-none"><option value="">전체 상태</option><option v-for="status in workStatuses" :key="status">{{ status }}</option></select>
            <label class="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-forena-700 ring-1 ring-forena-100">
              <input v-model="filters.delayOnly" type="checkbox" class="rounded border-forena-300 text-flare-600" /> 지연만
            </label>
          </div>

          <div class="grid gap-4 xl:grid-cols-12">
            <div class="overflow-hidden rounded-2xl border border-forena-100 bg-white xl:col-span-8">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 px-4 py-3">
                <h2 class="text-sm font-bold text-forena-900">작업지시서 기반 금일 작업 실적</h2>
                <div class="flex gap-2">
                  <button class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 px-3 py-1.5 text-xs font-bold text-forena-700 hover:bg-forena-50" @click="saveReport('임시 저장')"><Save class="h-3.5 w-3.5" /> 임시 저장</button>
                  <button class="inline-flex items-center gap-1.5 rounded-lg bg-forena-800 px-3 py-1.5 text-xs font-bold text-white" @click="saveReport('제출')"><Send class="h-3.5 w-3.5" /> 제출</button>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[1040px] text-left text-xs">
                  <thead class="bg-forena-50/70 text-[10px] font-bold uppercase text-forena-500">
                    <tr>
                      <th class="px-4 py-3">작업명</th><th class="px-3 py-3">공종/위치</th><th class="px-3 py-3 text-right">계획</th><th class="px-3 py-3 text-right">실제</th><th class="px-3 py-3 text-right">인원</th><th class="px-3 py-3">상태</th><th class="px-3 py-3">미완료 사유</th><th class="px-3 py-3">공정 분석</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-forena-50">
                    <tr v-for="task in visibleTodayTasks" :key="task.id" class="cursor-pointer hover:bg-flare-50/30" :class="selectedTaskId === task.id ? 'bg-flare-50/50' : ''" @click="selectedTaskId = task.id">
                      <td class="px-4 py-3"><p class="font-bold text-forena-900">{{ task.name }}</p><p class="mt-1 text-[10px] text-forena-400">{{ task.instructionId }}</p></td>
                      <td class="px-3 py-3 text-forena-600">{{ task.trade }}<br /><span class="text-slate-400">{{ task.location }}</span></td>
                      <td class="px-3 py-3 text-right tabular-nums font-bold">{{ task.plannedProgress }}%</td>
                      <td class="px-3 py-3 text-right tabular-nums font-bold" :class="progressGapClass(task)">{{ task.actualProgress }}%</td>
                      <td class="px-3 py-3 text-right tabular-nums">{{ task.actualWorkers }}/{{ task.plannedWorkers }}</td>
                      <td class="px-3 py-3"><span class="rounded-md px-2 py-1 text-[10px] font-bold" :class="badgeClass(task.status)">{{ task.status }}</span></td>
                      <td class="px-3 py-3 text-forena-600">{{ task.incompleteReason || '-' }}</td>
                      <td class="px-3 py-3"><span class="rounded-md px-2 py-1 text-[10px] font-bold" :class="task.analysisApplied ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ task.analysisApplied ? '반영 완료' : '대기' }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <aside class="rounded-2xl border border-forena-100 bg-white xl:col-span-4">
              <div class="border-b border-forena-100 px-4 py-3">
                <h2 class="text-sm font-bold text-forena-900">작업 상세 입력 패널</h2>
                <p class="mt-1 text-xs text-forena-400">실제 진척률, 상태, 미완료 사유는 구조화 데이터로 저장됩니다.</p>
              </div>
              <div v-if="selectedTask" class="space-y-3 p-4">
                <div>
                  <p class="text-base font-bold text-forena-900">{{ selectedTask.name }}</p>
                  <p class="mt-1 text-xs text-forena-500">{{ selectedTask.trade }} · {{ selectedTask.location }}</p>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="rounded-xl bg-forena-50/60 p-3"><p class="text-forena-400">계획 기간</p><p class="mt-1 font-bold">{{ selectedTask.plannedStart }} ~ {{ selectedTask.plannedEnd }}</p></div>
                  <div class="rounded-xl bg-forena-50/60 p-3"><p class="text-forena-400">CP / 보할</p><p class="mt-1 font-bold">{{ selectedTask.cp ? 'CP' : '일반' }} · {{ selectedTask.weight }}%</p></div>
                </div>
                <label class="block space-y-1"><span class="text-xs font-bold text-forena-600">실제 진척률 *</span><input v-model.number="selectedTask.actualProgress" type="number" min="0" max="100" :disabled="!canEditReport" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none focus:border-flare-400 disabled:bg-slate-50" /></label>
                <label class="block space-y-1"><span class="text-xs font-bold text-forena-600">실제 투입 인원 *</span><input v-model.number="selectedTask.actualWorkers" type="number" min="0" :disabled="!canEditReport" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none focus:border-flare-400 disabled:bg-slate-50" /></label>
                <label class="block space-y-1"><span class="text-xs font-bold text-forena-600">작업 상태 *</span><select v-model="selectedTask.status" :disabled="!canEditReport" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none focus:border-flare-400 disabled:bg-slate-50"><option v-for="status in workStatuses" :key="status">{{ status }}</option></select></label>
                <label class="block space-y-1"><span class="text-xs font-bold text-forena-600">미완료 사유 <span v-if="selectedTask.status !== '완료'" class="text-rose-600">*</span></span><select v-model="selectedTask.incompleteReason" :disabled="!canEditReport || selectedTask.status === '완료'" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none focus:border-flare-400 disabled:bg-slate-50"><option value="">해당 없음</option><option v-for="reason in incompleteReasons" :key="reason">{{ reason }}</option></select></label>
                <label class="block space-y-1"><span class="text-xs font-bold text-forena-600">특이사항</span><textarea v-model="selectedTask.note" rows="3" :disabled="!canEditReport" class="w-full resize-y rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none focus:border-flare-400 disabled:bg-slate-50"></textarea></label>
                <div class="grid grid-cols-2 gap-2">
                  <label class="flex items-center gap-2 rounded-xl bg-forena-50/60 p-3 text-xs font-bold text-forena-700"><input v-model="selectedTask.weatherImpact" type="checkbox" :disabled="!canEditReport" /> 기상 영향</label>
                  <label class="flex items-center gap-2 rounded-xl bg-forena-50/60 p-3 text-xs font-bold text-forena-700"><input v-model="selectedTask.equipmentIssue" type="checkbox" :disabled="!canEditReport" /> 장비 문제</label>
                  <label class="flex items-center gap-2 rounded-xl bg-forena-50/60 p-3 text-xs font-bold text-forena-700"><input v-model="selectedTask.tbmDone" type="checkbox" disabled /> TBM 완료</label>
                  <label class="flex items-center gap-2 rounded-xl bg-forena-50/60 p-3 text-xs font-bold text-forena-700"><input v-model="selectedTask.analysisApplied" type="checkbox" disabled /> 분석 반영</label>
                </div>
                <div class="rounded-xl border border-forena-100 p-3 text-xs text-forena-600">
                  <p>필요 장비: <strong>{{ selectedTask.requiredEquipment }}</strong></p>
                  <p class="mt-1">실제 장비: <strong>{{ selectedTask.actualEquipment }}</strong></p>
                  <p class="mt-1">관련 문서: <strong>{{ selectedTask.documents.join(', ') }}</strong></p>
                </div>
                <div class="grid grid-cols-2 gap-2 border-t border-forena-100 pt-3">
                  <button class="rounded-xl border border-forena-200 px-3 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50" @click="saveReport('저장')">저장</button>
                  <button class="rounded-xl border border-forena-200 px-3 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50" @click="saveReport('임시 저장')">임시 저장</button>
                  <button class="rounded-xl border border-flare-200 bg-flare-50 px-3 py-2 text-xs font-bold text-forena-800 hover:bg-flare-100" @click="applyAnalysis">공정 분석 반영</button>
                  <button class="rounded-xl bg-forena-800 px-3 py-2 text-xs font-bold text-white" @click="saveReport('제출')">제출</button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div v-else-if="activeTab === 'tomorrow'" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forena-100 bg-forena-50/50 p-3">
            <div class="flex items-center gap-2 text-sm font-bold text-forena-900"><CalendarDays class="h-4 w-4 text-flare-600" /> 명일 예정 작업 / 공사일보 초안</div>
            <div class="flex gap-2">
              <button class="rounded-lg border border-forena-200 bg-white px-3 py-2 text-xs font-bold text-forena-700 hover:bg-forena-50" @click="addCarryOverTasks">금일 미완료 자동 포함</button>
              <button class="rounded-lg bg-forena-800 px-3 py-2 text-xs font-bold text-white" @click="saveReport('명일 초안 저장')">초안 저장</button>
            </div>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-forena-100 bg-white">
            <table class="w-full min-w-[1080px] text-left text-xs">
              <thead class="bg-forena-50/70 text-[10px] font-bold uppercase text-forena-500">
                <tr><th class="px-4 py-3">예정 작업명</th><th class="px-3 py-3">공종/위치</th><th class="px-3 py-3">예정 시간</th><th class="px-3 py-3 text-right">인원</th><th class="px-3 py-3">장비</th><th class="px-3 py-3">전날 연계</th><th class="px-3 py-3">예상 위험 요소</th><th class="px-3 py-3">상태</th></tr>
              </thead>
              <tbody class="divide-y divide-forena-50">
                <tr v-for="task in tomorrowTasks" :key="task.id" class="hover:bg-forena-50/50">
                  <td class="px-4 py-3"><input v-model="task.name" class="w-full rounded border border-transparent bg-transparent px-2 py-1 font-bold text-forena-900 outline-none focus:border-flare-300" /></td>
                  <td class="px-3 py-3">{{ task.trade }}<br /><span class="text-slate-400">{{ task.location }}</span></td>
                  <td class="px-3 py-3">{{ task.time }}</td>
                  <td class="px-3 py-3 text-right tabular-nums">{{ task.assignedWorkers }}/{{ task.requiredWorkers }}</td>
                  <td class="px-3 py-3">{{ task.equipment }}<br /><span class="text-slate-400">{{ task.equipmentStatus }}</span></td>
                  <td class="px-3 py-3"><span class="rounded-md px-2 py-1 text-[10px] font-bold" :class="task.carryOver ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-500'">{{ task.carryOver ? '연계' : '신규' }}</span></td>
                  <td class="px-3 py-3 text-forena-600">{{ task.risk }}</td>
                  <td class="px-3 py-3"><select v-model="task.status" class="rounded-lg border border-forena-200 px-2 py-1 text-xs"><option>초안</option><option>확인 필요</option><option>확정</option><option>변경 필요</option></select></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'upload'" class="grid gap-4 xl:grid-cols-12">
          <div class="space-y-4 xl:col-span-4">
            <div class="rounded-2xl border border-forena-100 bg-white p-4">
              <h2 class="flex items-center gap-2 text-sm font-bold text-forena-900"><Upload class="h-4 w-4 text-flare-600" /> 공사일보 파일 업로드</h2>
              <div class="mt-4 space-y-3">
                <input v-model="uploadForm.reportDate" type="date" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none focus:border-flare-400" />
                <input v-model="uploadForm.documentName" type="text" placeholder="문서명" class="w-full rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none focus:border-flare-400" />
                <div class="grid grid-cols-2 gap-2">
                  <select v-model="uploadForm.documentType" class="rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none"><option>Excel</option><option>PDF</option><option>Image</option><option>Word</option><option>HWP</option></select>
                  <select v-model="uploadForm.target" class="rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none"><option>금일</option><option>명일</option></select>
                </div>
                <textarea v-model="uploadForm.description" rows="3" placeholder="설명" class="w-full resize-y rounded-xl border border-forena-200 px-3 py-2 text-sm outline-none focus:border-flare-400"></textarea>
                <label class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-forena-200 bg-forena-50/50 p-6 text-center hover:bg-flare-50/60">
                  <Upload class="h-8 w-8 text-forena-300" />
                  <span class="mt-2 text-sm font-bold text-forena-700">{{ uploadForm.fileName || '파일 선택' }}</span>
                  <span class="mt-1 text-[11px] text-forena-400">Excel, PDF, Image, Word, HWP</span>
                  <input type="file" class="sr-only" accept=".xlsx,.xls,.pdf,.png,.jpg,.jpeg,.doc,.docx,.hwp" @change="onUpload" />
                </label>
                <button class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-flare-500 to-flare-700 px-4 py-2.5 text-sm font-bold text-white shadow-md" @click="runAiAnalysis">
                  <BrainCircuit class="h-4 w-4" /> AI 분석 실행
                </button>
              </div>
            </div>
          </div>

          <div class="overflow-hidden rounded-2xl border border-forena-100 bg-white xl:col-span-8">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-forena-100 px-4 py-3">
              <h2 class="text-sm font-bold text-forena-900">AI 분석 결과 검토</h2>
              <div class="flex gap-2">
                <button class="rounded-lg border border-forena-200 px-3 py-1.5 text-xs font-bold text-forena-700 hover:bg-forena-50" @click="reflectSelectedResults('금일')">금일 반영</button>
                <button class="rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-bold text-forena-800 hover:bg-flare-100" @click="reflectSelectedResults('명일')">명일 반영</button>
                <button class="rounded-lg border border-forena-200 px-3 py-1.5 text-xs font-bold text-forena-700 hover:bg-forena-50" @click="runAiAnalysis"><RefreshCw class="inline h-3.5 w-3.5" /> 재분석</button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[1080px] text-left text-xs">
                <thead class="bg-forena-50/70 text-[10px] font-bold uppercase text-forena-500">
                  <tr><th class="px-3 py-3"></th><th class="px-3 py-3">작업명</th><th class="px-3 py-3">공종</th><th class="px-3 py-3">위치</th><th class="px-3 py-3 text-right">진척률</th><th class="px-3 py-3 text-right">인원</th><th class="px-3 py-3">상태</th><th class="px-3 py-3">미완료 사유</th><th class="px-3 py-3">특이사항</th><th class="px-3 py-3 text-right">신뢰도</th><th class="px-3 py-3">검토</th><th class="px-3 py-3"></th></tr>
                </thead>
                <tbody class="divide-y divide-forena-50">
                  <tr v-for="row in aiResults" :key="row.id" class="hover:bg-forena-50/50">
                    <td class="px-3 py-3"><input v-model="row.checked" type="checkbox" /></td>
                    <td class="px-3 py-3 font-bold text-forena-900">{{ row.name }}</td>
                    <td class="px-3 py-3">{{ row.trade }}</td>
                    <td class="px-3 py-3">{{ row.location }}</td>
                    <td class="px-3 py-3 text-right tabular-nums font-bold">{{ row.actualProgress }}%</td>
                    <td class="px-3 py-3 text-right tabular-nums">{{ row.actualWorkers }}</td>
                    <td class="px-3 py-3"><span class="rounded-md px-2 py-1 text-[10px] font-bold" :class="badgeClass(row.status)">{{ row.status }}</span></td>
                    <td class="px-3 py-3">{{ row.incompleteReason || '-' }}</td>
                    <td class="px-3 py-3">{{ row.note }}</td>
                    <td class="px-3 py-3 text-right font-bold" :class="row.confidence >= 90 ? 'text-emerald-700' : 'text-amber-700'">{{ row.confidence }}%</td>
                    <td class="px-3 py-3"><select v-model="row.reviewStatus" class="rounded-lg border border-forena-200 px-2 py-1 text-xs"><option>미검토</option><option>검토 중</option><option>승인</option><option>수정 요청</option><option>제외</option></select></td>
                    <td class="px-3 py-3"><button class="rounded-lg p-1.5 text-forena-500 hover:bg-forena-100"><Pencil class="h-3.5 w-3.5" /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex flex-wrap items-center gap-2 rounded-xl border border-forena-100 bg-forena-50/50 p-3">
            <Filter class="h-4 w-4 text-forena-400" />
            <select v-model="filters.trade" class="rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm"><option value="">전체 공정</option><option v-for="trade in trades" :key="trade">{{ trade }}</option></select>
            <select v-model="filters.approval" class="rounded-lg border border-forena-200 bg-white px-3 py-2 text-sm"><option value="">전체 상태</option><option v-for="status in approvalStatuses" :key="status">{{ status }}</option></select>
            <span class="text-xs text-forena-500">{{ currentRole === '현장 총책임자' ? '금일 전체 작업 실적 조회 가능' : '권한 범위 내 실적만 표시' }}</span>
          </div>
          <div class="overflow-hidden rounded-2xl border border-forena-100 bg-white">
            <div class="border-b border-forena-100 px-4 py-3 text-sm font-bold text-forena-900">제출된 공사일보 목록</div>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[860px] text-left text-xs">
                <thead class="bg-forena-50/70 text-[10px] font-bold uppercase text-forena-500">
                  <tr><th class="px-4 py-3">일자</th><th class="px-3 py-3">담당 공정</th><th class="px-3 py-3">작성자</th><th class="px-3 py-3 text-right">작업</th><th class="px-3 py-3 text-right">완료</th><th class="px-3 py-3 text-right">지연</th><th class="px-3 py-3">상태</th><th class="px-3 py-3 text-right">처리</th></tr>
                </thead>
                <tbody class="divide-y divide-forena-50">
                  <tr v-for="row in filteredApprovals" :key="row.id" class="hover:bg-forena-50/50">
                    <td class="px-4 py-3 font-bold text-forena-900">{{ row.date }}</td>
                    <td class="px-3 py-3">{{ row.trade }}</td>
                    <td class="px-3 py-3">{{ row.writer }}</td>
                    <td class="px-3 py-3 text-right tabular-nums">{{ row.taskCount }}</td>
                    <td class="px-3 py-3 text-right tabular-nums">{{ row.completed }}</td>
                    <td class="px-3 py-3 text-right tabular-nums text-rose-700">{{ row.delayed }}</td>
                    <td class="px-3 py-3"><span class="rounded-md px-2 py-1 text-[10px] font-bold" :class="badgeClass(row.status)">{{ row.status }}</span></td>
                    <td class="px-3 py-3">
                      <div class="flex justify-end gap-1">
                        <button class="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 disabled:opacity-40" :disabled="!canApprove" @click="setApproval(row, '승인 완료')">승인</button>
                        <button class="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700 disabled:opacity-40" :disabled="!canApprove" @click="setApproval(row, '수정 요청')">수정 요청</button>
                        <button class="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 disabled:opacity-40" :disabled="!canApprove" @click="setApproval(row, '반려')">반려</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="rounded-2xl border border-forena-100 bg-white p-4">
            <h2 class="flex items-center gap-2 text-sm font-bold text-forena-900"><BrainCircuit class="h-4 w-4 text-flare-600" /> 공정 분석 전달 데이터 미리보기</h2>
            <pre class="mt-3 max-h-56 overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-relaxed text-slate-100">{{ JSON.stringify(analysisPayloadPreview.slice(0, 2), null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
