<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Upload, BrainCircuit, X, Users, Wrench, MapPin, ChevronDown, ChevronLeft, ChevronRight, CalendarRange, CalendarPlus, FileCheck2, AlertTriangle, CheckCircle2, Plus, Trash2, ClipboardList, Save } from 'lucide-vue-next'
import { workPlans, yearlyWorkPlans } from '@/data/mockData'
import { planStore } from '@/data/planStore'

const plans = ref(workPlans.map(p => ({ ...p })))
const annualPlans = ref(yearlyWorkPlans.map(p => ({ ...p })))
const viewMode = ref('weekly')
const filterTrade = ref('')
const filterStatus = ref('')
const selectedPlan = ref(null)
const uploadFileName = ref('')
const uploadCategory = ref('')
const trades = ['형틀','전기','방수','골조','설비','철근']
const statuses = ['계획','검토 중','확정','진행 중']

// 업로드 메뉴 상태
const showUploadMenu = ref(false)
const uploadMenuRef = ref(null)
const yearlyInputRef = ref(null)
const monthlyInputRef = ref(null)

// 연장 정보 헬퍼 (planStore 기반)
function extOf(p) {
  return planStore.extensions[p.id] ?? null
}
// 화면에 보일 "최종 종료일" — 연장이 있으면 연장된 종료일, 없으면 원래 종료일
function effectiveEnd(p) {
  return extOf(p)?.extendedEnd ?? p.end
}

const filtered = computed(() => {
  let r = plans.value
  if (filterTrade.value)  r = r.filter(p => p.trade === filterTrade.value)
  if (filterStatus.value) r = r.filter(p => p.status === filterStatus.value)
  return r
})

const annualFiltered = computed(() => {
  let r = annualPlans.value
  if (filterTrade.value)  r = r.filter(p => p.trade === filterTrade.value)
  if (filterStatus.value) r = r.filter(p => p.status === filterStatus.value)
  return r
})

const statusClass = (s) => {
  if (s === '확정')   return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
  if (s === '진행 중') return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
  if (s === '검토 중') return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
  return 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
}

// =========================
// 주간 캘린더
// =========================
const weekDays = computed(() => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 3)
  const labels = ['일','월','화','수','목','금','토']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const isToday = d.toDateString() === today.toDateString()
    const dow = d.getDay()
    return {
      label: labels[dow],
      date: d.toISOString().slice(0, 10),
      day: d.getDate(),
      month: d.getMonth() + 1,
      isToday,
      isWeekend: dow === 0 || dow === 6,
    }
  })
})

const weekHeader = computed(() => {
  const first = weekDays.value[0]
  const last  = weekDays.value[6]
  if (!first || !last) return ''
  const [y, m] = first.date.split('-')
  return `${Number(y)}년 ${Number(m)}월 · ${first.month}.${first.day} ~ ${last.month}.${last.day}`
})

// 해당 날짜에 표시할 작업과 연장 여부 함께 반환
function plansForDay(dateStr) {
  return filtered.value
    .filter(p => p.start <= dateStr && effectiveEnd(p) >= dateStr)
    .map(p => ({
      ...p,
      // 이 날짜가 "연장 구간(원래 end 이후)"에 속하는지
      isExtensionDay: extOf(p) && dateStr > p.end,
    }))
}

// =========================
// 업로드 (연간/월간 → 간트차트 검증 모달)
// =========================
function toggleUploadMenu() { showUploadMenu.value = !showUploadMenu.value }
function pickYearly() { showUploadMenu.value = false; yearlyInputRef.value?.click() }
function pickMonthly() { showUploadMenu.value = false; monthlyInputRef.value?.click() }
// 주간은 업로드가 아니라 협력사 작성 모달을 띄움
function openWeeklyComposer() { showUploadMenu.value = false; openWeeklyForm() }

// 검증 모달 상태
const showVerifyModal = ref(false)
const verifyCategory = ref('')        // '연간' | '월간'
const verifyFileName = ref('')
const verifyRows = ref([])            // 파싱된 행 (데모: 모의 데이터)

function onFileChange(e, category) {
  const f = e.target.files?.[0]
  if (!f) { e.target.value = ''; return }
  uploadFileName.value = f.name
  uploadCategory.value = category
  // 검증 모달용 모의 파싱 결과 생성 (실제 환경에서는 백엔드 파싱 결과로 교체)
  verifyCategory.value = category
  verifyFileName.value = f.name
  verifyRows.value = generateMockParseRows(category)
  showVerifyModal.value = true
  e.target.value = ''
}

// 데모용: 업로드 파일에서 추출되었다고 가정하는 행
function generateMockParseRows(category) {
  if (category === '연간') {
    return [
      { id: 'r1', name: '본동 골조 공사',     trade: '골조', location: '본동 1~10층', start: '2026-03-01', end: '2026-08-31', issue: null },
      { id: 'r2', name: '지하주차장 방수',     trade: '방수', location: '지하 1~3층',   start: '2026-04-15', end: '2026-06-30', issue: null },
      { id: 'r3', name: '전기 간선 설치',     trade: '전기', location: '전 층',         start: '2026-05-01', end: '2026-09-15', issue: 'warning' },
      { id: 'r4', name: '외부 마감',           trade: '형틀', location: '외벽',          start: '',           end: '2026-10-31', issue: 'error' },
    ]
  }
  // 월간
  return [
    { id: 'm1', name: 'B2층 전기 배관 설치', trade: '전기', location: 'B2층 전기실',     start: '2026-04-29', end: '2026-05-08', issue: null },
    { id: 'm2', name: '본동 3층 슬라브 철근 박·고정', trade: '철근', location: '본동 3층', start: '2026-04-25', end: '2026-05-02', issue: null },
    { id: 'm3', name: 'B1층 슬라브 형틀 조립', trade: '형틀', location: 'B1층 전체',      start: '2026-04-28', end: '2026-05-05', issue: null },
    { id: 'm4', name: '지하주차장 방수 공사',  trade: '방수', location: '지하 주차구역 A', start: '2026-05-03', end: '',           issue: 'error' },
  ]
}

const verifyStats = computed(() => {
  const total = verifyRows.value.length
  const errors = verifyRows.value.filter(r => r.issue === 'error').length
  const warnings = verifyRows.value.filter(r => r.issue === 'warning').length
  const ok = total - errors - warnings
  return { total, ok, warnings, errors }
})

function fixVerifyRow(row) {
  // 데모: 누락된 날짜를 임의의 합리적 값으로 채움
  if (!row.start) row.start = row.end || new Date().toISOString().slice(0, 10)
  if (!row.end)   row.end   = row.start
  row.issue = null
}
function removeVerifyRow(row) {
  verifyRows.value = verifyRows.value.filter(r => r.id !== row.id)
}
function confirmVerifyAndApply() {
  // 실제로는 verifyRows를 plans/yearlyPlans에 머지. 여기서는 데모로 알림.
  showVerifyModal.value = false
  alert(`${verifyCategory.value} 계획서 ${verifyRows.value.length}건이 간트차트에 반영되었습니다.`)
}
function cancelVerify() {
  showVerifyModal.value = false
  verifyRows.value = []
  uploadFileName.value = ''
}

// =========================
// 주간 계획서 작성 (협력사/공정 담당자)
// =========================
const showWeeklyForm = ref(false)
const weeklyForm = ref(null) // { partner, manager, weekStart, items: [...] }

function openWeeklyForm() {
  // 이번 주 시작일(일요일 기준)
  const t = new Date()
  const ws = new Date(t); ws.setDate(t.getDate() - t.getDay())
  weeklyForm.value = {
    partner: '',
    manager: '',
    contact: '',
    weekStart: ws.toISOString().slice(0, 10),
    items: [makeWeeklyItem(ws.toISOString().slice(0, 10))],
  }
  showWeeklyForm.value = true
}

function makeWeeklyItem(date) {
  return {
    id: `wi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date,
    processName: '',  // 공정명 (필수)
    zone: '',         // 작업구역 (필수)
    workers: '',      // 인력 (필수) - "형틀공 4명, 보통공 2명" 형식
    equipment: '',    // 장비 (필수) - "타워크레인 1대, 펌프카 1대"
    note: '',
  }
}

function addWeeklyItem() {
  weeklyForm.value.items.push(makeWeeklyItem(weeklyForm.value.weekStart))
}
function removeWeeklyItem(idx) {
  if (weeklyForm.value.items.length <= 1) return
  weeklyForm.value.items.splice(idx, 1)
}

const weeklyFormValid = computed(() => {
  if (!weeklyForm.value) return false
  const w = weeklyForm.value
  if (!w.partner.trim() || !w.manager.trim()) return false
  return w.items.every(it =>
    it.date && it.processName.trim() && it.zone.trim() && it.workers.trim() && it.equipment.trim()
  )
})

function submitWeeklyForm() {
  if (!weeklyFormValid.value) return
  // 데모: 입력된 항목을 plans에 추가 (실제로는 서버 전송)
  const w = weeklyForm.value
  w.items.forEach((it, i) => {
    plans.value.push({
      id: `weekly_${Date.now()}_${i}`,
      name: it.processName,
      trade: '협력사',
      location: it.zone,
      start: it.date,
      end: it.date,
      status: '검토 중',
      requiredCount: parseWorkersCount(it.workers),
      workers: [it.workers],
      equipment: it.equipment ? [it.equipment] : [],
      partner: w.partner,
      manager: w.manager,
    })
  })
  showWeeklyForm.value = false
  alert(`${w.partner} (${w.manager}) 주간 계획서 ${w.items.length}건이 제출되었습니다.`)
}
function parseWorkersCount(str) {
  // "형틀공 4명, 보통공 2명" → 6
  const matches = str.match(/(\d+)\s*명/g) || []
  return matches.reduce((s, m) => s + parseInt(m, 10), 0) || 0
}
function cancelWeeklyForm() {
  showWeeklyForm.value = false
  weeklyForm.value = null
}

function handleClickOutside(e) {
  if (uploadMenuRef.value && !uploadMenuRef.value.contains(e.target)) showUploadMenu.value = false
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

function importAi() { alert('AI로 작업계획을 불러옵니다. (데모)') }

// =========================
// 월간/연간 간트차트
// =========================
const GANTT_DAY_W = 42
const GANTT_MONTH_W = 108
const NAME_COL_W = 240

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth() + 1)

function prevYear() { viewYear.value -= 1 }
function nextYear() { viewYear.value += 1 }

function prevMonth() {
  if (viewMonth.value === 1) { viewMonth.value = 12; viewYear.value -= 1 }
  else viewMonth.value -= 1
}
function nextMonth() {
  if (viewMonth.value === 12) { viewMonth.value = 1; viewYear.value += 1 }
  else viewMonth.value += 1
}
function goToday() {
  const t = new Date()
  viewYear.value = t.getFullYear()
  viewMonth.value = t.getMonth() + 1
}

const monthMeta = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value - 1
  const last = new Date(y, m + 1, 0)
  const today = new Date()
  const days = []
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(y, m, d)
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const dow = dt.getDay()
    days.push({
      day: d,
      date: dateStr,
      dow,
      isWeekend: dow === 0 || dow === 6,
      isToday: dt.toDateString() === today.toDateString(),
    })
  }
  return {
    year: y,
    month: m + 1,
    daysInMonth: last.getDate(),
    days,
    firstDate: `${y}-${String(m+1).padStart(2,'0')}-01`,
    lastDate:  `${y}-${String(m+1).padStart(2,'0')}-${String(last.getDate()).padStart(2,'0')}`,
  }
})

const isCurrentMonth = computed(() => {
  const t = new Date()
  return viewYear.value === t.getFullYear() && viewMonth.value === t.getMonth() + 1
})

const isCurrentYear = computed(() => {
  const t = new Date()
  return viewYear.value === t.getFullYear()
})

// 이번 달과 겹치는 작업 (연장된 종료일까지 고려)
const ganttPlans = computed(() => {
  const { firstDate, lastDate } = monthMeta.value
  return filtered.value.filter(p => !(effectiveEnd(p) < firstDate || p.start > lastDate))
})

const yearMeta = computed(() => {
  const y = viewYear.value
  return {
    year: y,
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: `${i + 1}월`,
      firstDate: `${y}-${String(i + 1).padStart(2, '0')}-01`,
      lastDate: `${y}-${String(i + 1).padStart(2, '0')}-${String(new Date(y, i + 1, 0).getDate()).padStart(2, '0')}`,
      isCurrent: y === today.getFullYear() && i === today.getMonth(),
    })),
    firstDate: `${y}-01-01`,
    lastDate: `${y}-12-31`,
  }
})

const yearlyPlans = computed(() => {
  const { firstDate, lastDate } = yearMeta.value
  return annualFiltered.value.filter(p => !(effectiveEnd(p) < firstDate || p.start > lastDate))
})

// 막대 위치/너비 계산 — 이번 달 영역 내로 클리핑
function barStyle(startStr, endStr) {
  if (!startStr || !endStr) return null
  const { firstDate, lastDate } = monthMeta.value
  if (endStr < firstDate || startStr > lastDate) return null
  const s = startStr < firstDate ? firstDate : startStr
  const e = endStr   > lastDate  ? lastDate  : endStr
  const sd = Number(s.slice(8, 10))
  const ed = Number(e.slice(8, 10))
  const span = Math.max(1, ed - sd + 1)
  return {
    left: `${(sd - 1) * GANTT_DAY_W + 4}px`,
    width: `${span * GANTT_DAY_W - 8}px`,
  }
}

function yearBarStyle(startStr, endStr) {
  if (!startStr || !endStr) return null
  const { firstDate, lastDate, year } = yearMeta.value
  if (endStr < firstDate || startStr > lastDate) return null
  const s = startStr < firstDate ? firstDate : startStr
  const e = endStr > lastDate ? lastDate : endStr
  const sm = Number(s.slice(5, 7))
  const em = Number(e.slice(5, 7))
  const span = Math.max(1, em - sm + 1)
  const startDay = Number(s.slice(8, 10))
  const endDay = Number(e.slice(8, 10))
  const startMonthDays = new Date(year, sm, 0).getDate()
  const endMonthDays = new Date(year, em, 0).getDate()
  const leftOffset = ((startDay - 1) / startMonthDays) * GANTT_MONTH_W
  const rightTrim = ((endMonthDays - endDay) / endMonthDays) * GANTT_MONTH_W
  return {
    left: `${(sm - 1) * GANTT_MONTH_W + leftOffset + 4}px`,
    width: `${span * GANTT_MONTH_W - leftOffset - rightTrim - 8}px`,
  }
}

function actualLineRange(p) {
  return {
    start: p.actualStart || p.start,
    end: effectiveEnd(p),
  }
}

function progressFillEnd(p) {
  const range = actualLineRange(p)
  const t = new Date().toISOString().slice(0, 10)
  if (t < range.start) return null
  return t > range.end ? range.end : t
}

// 오늘 라인
const todayLineStyle = computed(() => {
  const t = new Date()
  const { year, month } = monthMeta.value
  if (t.getFullYear() !== year || (t.getMonth() + 1) !== month) return null
  const left = (t.getDate() - 1) * GANTT_DAY_W + GANTT_DAY_W / 2
  return { left: `${left}px` }
})

const chartWidth = computed(() => monthMeta.value.daysInMonth * GANTT_DAY_W)
const yearChartWidth = computed(() => 12 * GANTT_MONTH_W)

// 화면 상단/필터 바 — 활성 연장 개수
const extensionCount = computed(() => Object.keys(planStore.extensions).length)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-4 pb-6">
    <!-- 헤더 -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-widest text-flare-600">일정 관리</p>
        <h1 class="text-xl font-bold text-forena-900">작업 계획</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex overflow-hidden rounded-lg border border-forena-200 bg-white">
          <button v-for="m in [['yearly','연간'],['monthly','월간'],['weekly','주간']]" :key="m[0]"
            class="px-3.5 py-1.5 text-xs font-bold transition"
            :class="viewMode === m[0] ? 'bg-forena-800 text-white' : 'text-forena-600 hover:bg-forena-50'"
            @click="viewMode = m[0]; selectedPlan = null">{{ m[1] }}</button>
        </div>

        <div class="relative" ref="uploadMenuRef">
          <button type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-forena-200 bg-white px-3 py-1.5 text-xs font-semibold text-forena-700 hover:bg-forena-50"
            @click="toggleUploadMenu">
            <Upload class="h-3.5 w-3.5 text-forena-400" />
            계획서 업로드
            <ChevronDown class="h-3 w-3 text-forena-400 transition-transform" :class="showUploadMenu ? 'rotate-180' : ''" />
          </button>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1">
            <div v-if="showUploadMenu"
              class="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-lg border border-forena-200 bg-white shadow-lg">
              <button type="button"
                class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-forena-700 hover:bg-flare-50"
                @click="pickYearly">
                <CalendarRange class="h-4 w-4 shrink-0 text-flare-600" />
                <div class="flex flex-col">
                  <span>연간 계획서 업로드</span>
                  <span class="text-[10px] font-normal text-slate-400">연간 공정 목표와 범위</span>
                </div>
              </button>
              <div class="h-px bg-forena-100"></div>
              <button type="button"
                class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-forena-700 hover:bg-flare-50"
                @click="openWeeklyComposer">
                <ClipboardList class="h-4 w-4 shrink-0 text-flare-600" />
                <div class="flex flex-col">
                  <span>주간 계획서 작성</span>
                  <span class="text-[10px] font-normal text-slate-400">협력사 담당자가 직접 입력 · 매주 작성</span>
                </div>
              </button>
              <div class="h-px bg-forena-100"></div>
              <button type="button"
                class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-forena-700 hover:bg-flare-50"
                @click="pickMonthly">
                <CalendarRange class="h-4 w-4 shrink-0 text-flare-600" />
                <div class="flex flex-col">
                  <span>월간 계획서 업로드</span>
                  <span class="text-[10px] font-normal text-slate-400">이번 달 공정 목표와 작업 범위 · 매월 작성</span>
                </div>
              </button>
            </div>
          </transition>

          <input ref="yearlyInputRef" type="file" class="sr-only"
            accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
            @change="(e) => onFileChange(e, '연간')" />
          <input ref="monthlyInputRef" type="file" class="sr-only"
            accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
            @change="(e) => onFileChange(e, '월간')" />
        </div>

        <button class="inline-flex items-center gap-1.5 rounded-lg border border-flare-200 bg-flare-50 px-3 py-1.5 text-xs font-semibold text-forena-800 hover:bg-flare-100" @click="importAi">
          <BrainCircuit class="h-3.5 w-3.5 text-flare-600" /> AI 불러오기
        </button>
      </div>
    </div>

    <!-- 필터 바 -->
    <div class="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-forena-100 bg-white px-4 py-3">
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-bold text-forena-400">공종</span>
        <select v-model="filterTrade" class="rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs text-forena-800 outline-none focus:border-flare-400">
          <option value="">전체</option>
          <option v-for="t in trades" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-bold text-forena-400">상태</span>
        <select v-model="filterStatus" class="rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs text-forena-800 outline-none focus:border-flare-400">
          <option value="">전체</option>
          <option v-for="s in statuses" :key="s">{{ s }}</option>
        </select>
      </div>

      <!-- 연장 적용 개수 알림 -->
      <span v-if="extensionCount" class="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
        <CalendarPlus class="h-3 w-3" />
        공정 분석으로 일정 연장 {{ extensionCount }}건 반영됨
      </span>

      <span v-if="uploadFileName" class="ml-auto inline-flex items-center gap-1.5 text-xs text-forena-500">
        <span class="rounded-md bg-flare-50 px-2 py-0.5 text-[10px] font-bold text-flare-700 ring-1 ring-flare-200">{{ uploadCategory }}</span>
        {{ uploadFileName }}
      </span>
    </div>

    <!-- 메인 -->
    <div class="flex min-h-0 flex-1 gap-4">
      <!-- 작업 목록 -->
      <div v-if="viewMode === 'weekly'" class="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-forena-200 bg-white">
        <div class="border-b border-forena-100 bg-forena-50/60 px-4 py-2.5">
          <span class="text-sm font-bold text-forena-900">작업 목록</span>
          <span class="ml-2 text-xs text-forena-400">{{ filtered.length }}건</span>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto divide-y divide-forena-50">
          <div v-if="!filtered.length" class="flex items-center justify-center py-16 text-sm text-slate-400">
            조회된 작업이 없습니다.
          </div>
          <div v-for="p in filtered" :key="p.id"
            class="cursor-pointer p-3.5 transition-colors hover:bg-forena-50/60"
            :class="selectedPlan?.id === p.id ? 'bg-flare-50/60 border-l-2 border-l-flare-500' : ''"
            @click="selectedPlan = p">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold leading-snug text-forena-900">{{ p.name }}</p>
              <span class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold" :class="statusClass(p.status)">{{ p.status }}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span class="flex items-center gap-1"><MapPin class="h-3 w-3" />{{ p.location }}</span>
              <span class="flex items-center gap-1"><Users class="h-3 w-3" />{{ p.requiredCount }}명</span>
            </div>
            <div class="mt-1 flex items-center gap-1.5">
              <p class="text-[11px] tabular-nums text-forena-400">{{ p.start.slice(5) }} ~ {{ p.end.slice(5) }}</p>
              <span v-if="extOf(p)" class="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                → {{ extOf(p).extendedEnd.slice(5) }} (+{{ extOf(p).addedDays }}일)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽 -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-forena-200 bg-white">
        <!-- 작업 상세 -->
        <template v-if="selectedPlan">
          <div class="flex items-center justify-between border-b border-forena-100 bg-forena-50/60 px-4 py-2.5">
            <p class="text-sm font-bold text-forena-900">작업 상세</p>
            <button @click="selectedPlan = null"><X class="h-4 w-4 text-slate-400 hover:text-forena-700" /></button>
          </div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <p class="text-lg font-bold text-forena-900">{{ selectedPlan.name }}</p>
                <p class="text-xs text-forena-400 mt-0.5">{{ selectedPlan.trade }} · {{ selectedPlan.start }} ~ {{ selectedPlan.end }}</p>
              </div>
              <span class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold" :class="statusClass(selectedPlan.status)">{{ selectedPlan.status }}</span>
            </div>

            <!-- ★ 연장 알림 박스 -->
            <div v-if="extOf(selectedPlan)"
              class="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
              <CalendarPlus class="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div class="flex-1">
                <p class="text-xs font-bold text-emerald-700">공정 분석을 통한 일정 연장</p>
                <p class="mt-1 text-[11px] text-emerald-800">
                  종료일 <span class="font-bold tabular-nums">{{ selectedPlan.end }}</span>
                  → <span class="font-bold tabular-nums">{{ extOf(selectedPlan).extendedEnd }}</span>
                  (+{{ extOf(selectedPlan).addedDays }}일)
                </p>
                <p v-if="extOf(selectedPlan).reason" class="mt-1 text-[11px] text-emerald-700/80 leading-relaxed">{{ extOf(selectedPlan).reason }}</p>
                <p class="mt-1 text-[10px] text-emerald-600">반영 {{ extOf(selectedPlan).decidedAt }}</p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <div class="flex items-center gap-1.5 mb-2">
                  <MapPin class="h-3.5 w-3.5 text-flare-600" />
                  <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400">작업 위치</span>
                </div>
                <p class="text-sm font-semibold text-forena-900">{{ selectedPlan.location }}</p>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <div class="flex items-center gap-1.5 mb-2">
                  <Users class="h-3.5 w-3.5 text-flare-600" />
                  <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400">필요 인원</span>
                </div>
                <p class="text-2xl font-bold tabular-nums text-forena-900">{{ selectedPlan.requiredCount }}<span class="text-sm font-normal text-slate-400 ml-1">명</span></p>
                <ul class="mt-1.5 space-y-0.5">
                  <li v-for="(w, i) in selectedPlan.workers" :key="i" class="text-xs text-forena-600">· {{ w }}</li>
                </ul>
              </div>
              <div class="rounded-xl border border-forena-100 bg-forena-50/40 p-3.5">
                <div class="flex items-center gap-1.5 mb-2">
                  <Wrench class="h-3.5 w-3.5 text-flare-600" />
                  <span class="text-[11px] font-bold uppercase tracking-wide text-forena-400">필요 장비</span>
                </div>
                <div v-if="selectedPlan.equipment.length">
                  <p v-for="(eq, i) in selectedPlan.equipment" :key="i" class="text-sm font-semibold text-forena-900">{{ eq }}</p>
                </div>
                <p v-else class="text-sm text-slate-400">해당 없음</p>
              </div>
            </div>
          </div>
        </template>

        <!-- 캘린더 -->
        <template v-else>
          <div class="flex shrink-0 items-center justify-between border-b border-forena-100 bg-forena-50/60 px-4 py-2.5">
            <p class="text-sm font-bold text-forena-900">
              {{ viewMode === 'weekly' ? '주간 일정' : viewMode === 'monthly' ? '월간 계획 (간트차트)' : '연간 계획 (간트차트)' }}
            </p>
            <div class="flex items-center gap-3">
              <!-- 간트차트 범례 -->
              <div v-if="viewMode !== 'weekly'" class="flex items-center gap-3 text-[10px]">
                <span class="flex items-center gap-1.5 text-forena-500">
                  <span class="h-[3px] w-5 rounded-full bg-blue-500"></span>계획서 기준
                </span>
                <span class="flex items-center gap-1.5 text-forena-500">
                  <span class="h-[3px] w-5 rounded-full bg-red-500"></span>실제/예상 진행
                </span>
              </div>

              <!-- 연 이동 네비게이션 -->
              <div v-if="viewMode === 'yearly'" class="flex items-center gap-1">
                <button type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="이전 해"
                  @click="prevYear">
                  <ChevronLeft class="h-3.5 w-3.5" />
                </button>
                <p class="min-w-[82px] text-center text-xs font-bold tabular-nums text-forena-700">
                  {{ yearMeta.year }}년
                </p>
                <button type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="다음 해"
                  @click="nextYear">
                  <ChevronRight class="h-3.5 w-3.5" />
                </button>
                <button type="button"
                  class="ml-1 rounded-md border px-2 py-1 text-[10px] font-bold transition"
                  :class="isCurrentYear
                    ? 'border-flare-200 bg-flare-50 text-flare-700'
                    : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'"
                  :disabled="isCurrentYear"
                  @click="goToday">
                  올해
                </button>
              </div>

              <!-- 월 이동 네비게이션 -->
              <div v-if="viewMode === 'monthly'" class="flex items-center gap-1">
                <button type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="이전 달"
                  @click="prevMonth">
                  <ChevronLeft class="h-3.5 w-3.5" />
                </button>
                <p class="min-w-[110px] text-center text-xs font-bold tabular-nums text-forena-700">
                  {{ monthMeta.year }}년 {{ monthMeta.month }}월
                </p>
                <button type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-md border border-forena-200 bg-white text-forena-600 transition hover:bg-forena-50"
                  title="다음 달"
                  @click="nextMonth">
                  <ChevronRight class="h-3.5 w-3.5" />
                </button>
                <button type="button"
                  class="ml-1 rounded-md border px-2 py-1 text-[10px] font-bold transition"
                  :class="isCurrentMonth
                    ? 'border-flare-200 bg-flare-50 text-flare-700'
                    : 'border-forena-200 bg-white text-forena-600 hover:bg-forena-50'"
                  :disabled="isCurrentMonth"
                  @click="goToday">
                  오늘
                </button>
              </div>

              <p v-else class="text-xs text-forena-400 tabular-nums">{{ weekHeader }}</p>
            </div>
          </div>

          <!-- ========== 주간 ========== -->
          <div v-if="viewMode === 'weekly'" class="min-h-0 flex-1 overflow-auto p-3">
            <div class="grid h-full grid-cols-7 gap-2">
              <div v-for="day in weekDays" :key="day.date"
                class="flex flex-col overflow-hidden rounded-xl border bg-white"
                :class="day.isToday ? 'border-flare-400 ring-2 ring-flare-200' : 'border-forena-100'">
                <div class="flex items-center justify-between px-2.5 py-2"
                  :class="day.isToday ? 'bg-flare-500 text-white'
                          : day.isWeekend ? 'bg-slate-50 text-slate-400'
                          : 'bg-forena-50 text-forena-600'">
                  <span class="text-[11px] font-bold">{{ day.label }}</span>
                  <span class="rounded-md px-1.5 text-base font-bold tabular-nums"
                    :class="day.isToday ? 'bg-white/20' : ''">{{ day.day }}</span>
                </div>
                <div class="flex-1 space-y-1 overflow-y-auto p-1.5">
                  <div v-if="!plansForDay(day.date).length"
                    class="py-4 text-center text-[10px] text-slate-300">—</div>
                  <div v-for="p in plansForDay(day.date)" :key="p.id"
                    class="cursor-pointer rounded-md border-l-[3px] border-l-flare-500 bg-flare-50 px-1.5 py-1 text-[10px] font-semibold text-flare-900 transition hover:bg-flare-100"
                    :class="p.isExtensionDay ? 'ring-1 ring-emerald-300' : ''"
                    @click="selectedPlan = p">
                    <div class="flex items-center gap-1">
                      <CalendarPlus v-if="p.isExtensionDay" class="h-2.5 w-2.5 shrink-0" />
                      <p class="truncate">{{ p.name }}</p>
                    </div>
                    <p class="mt-0.5 truncate text-[9px] font-normal text-flare-700">
                      <span v-if="p.isExtensionDay">연장 일정</span>
                      <span v-else>{{ p.location }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 연간 (간트차트) ========== -->
          <div v-else-if="viewMode === 'yearly'" class="min-h-0 flex-1 overflow-auto bg-white">
            <div v-if="!yearlyPlans.length" class="flex items-center justify-center py-16 text-sm text-slate-400">
              {{ yearMeta.year }}년에 표시할 작업이 없습니다.
            </div>

            <div v-else class="flex min-w-max">
              <div class="sticky left-0 z-10 shrink-0 border-r border-forena-200 bg-white"
                :style="{ width: NAME_COL_W + 'px' }">
                <div class="flex h-10 items-center border-b border-forena-200 bg-white px-4">
                  <span class="text-[11px] font-bold text-forena-500">공정명 / 공종</span>
                </div>
                <div v-for="p in yearlyPlans" :key="p.id"
                  class="flex h-[68px] cursor-pointer flex-col justify-center gap-0.5 border-b border-forena-100 px-4 transition hover:bg-forena-50/60"
                  :class="selectedPlan?.id === p.id ? 'bg-flare-50/60' : ''"
                  @click="selectedPlan = p">
                  <div class="flex items-center gap-1.5">
                    <p class="truncate text-sm font-bold text-forena-900">{{ p.name }}</p>
                    <span v-if="extOf(p)" class="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-bold text-emerald-700">
                      <CalendarPlus class="h-2.5 w-2.5" />+{{ extOf(p).addedDays }}일
                    </span>
                  </div>
                  <p class="truncate text-[11px] text-forena-500">{{ p.trade }}{{ p.location ? ` / ${p.location}` : '' }}</p>
                  <p v-if="p.sourceFile" class="truncate text-[10px] text-slate-400">출처 문서: {{ p.sourceFile }}</p>
                </div>
              </div>

              <div class="relative" :style="{ width: yearChartWidth + 'px' }">
                <div class="sticky top-0 z-[5] flex h-10 border-b border-forena-200 bg-white">
                  <div v-for="m in yearMeta.months" :key="m.month"
                    class="flex items-center justify-center border-r border-forena-100 text-[11px] font-semibold tabular-nums"
                    :style="{ width: GANTT_MONTH_W + 'px' }"
                    :class="m.isCurrent ? 'bg-flare-50 text-flare-700' : 'text-forena-500'">
                    {{ m.label }}
                  </div>
                </div>

                <div class="relative">
                  <div v-for="p in yearlyPlans" :key="p.id"
                    class="relative flex h-[68px] border-b border-forena-100"
                    :class="selectedPlan?.id === p.id ? 'bg-flare-50/40' : ''">
                    <div v-for="m in yearMeta.months" :key="m.month"
                      class="border-r border-forena-50"
                      :style="{ width: GANTT_MONTH_W + 'px' }"></div>

                    <div v-if="yearBarStyle(p.start, p.end)"
                      class="group absolute z-[2] flex cursor-pointer items-center"
                      :style="{ ...yearBarStyle(p.start, p.end), top: '20px', height: '4px' }"
                      :title="`계획서 기준: ${p.start} ~ ${p.end}`"
                      @click="selectedPlan = p">
                      <span class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white"></span>
                      <span class="absolute -right-[3px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white"></span>
                      <span class="h-1 w-full rounded-full bg-blue-500 transition group-hover:h-1.5"></span>
                    </div>

                    <div v-if="yearBarStyle(actualLineRange(p).start, actualLineRange(p).end)"
                      class="absolute z-[1] flex cursor-pointer items-center"
                      :style="{ ...yearBarStyle(actualLineRange(p).start, actualLineRange(p).end), top: '40px', height: '4px' }"
                      :title="`실제/예상 진행: ${actualLineRange(p).start} ~ ${actualLineRange(p).end}`"
                      @click="selectedPlan = p">
                      <span class="h-1 w-full rounded-full bg-red-200"></span>
                    </div>
                    <div v-if="progressFillEnd(p) && yearBarStyle(actualLineRange(p).start, progressFillEnd(p))"
                      class="absolute z-[2] flex cursor-pointer items-center"
                      :style="{ ...yearBarStyle(actualLineRange(p).start, progressFillEnd(p)), top: '40px', height: '4px' }"
                      @click="selectedPlan = p">
                      <span class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                      <span class="absolute -right-[3px] h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                      <span class="h-1 w-full rounded-full bg-red-500"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 월간 (라인형 간트차트) ========== -->
          <div v-else class="min-h-0 flex-1 overflow-auto bg-white">
            <div v-if="!ganttPlans.length" class="flex items-center justify-center py-16 text-sm text-slate-400">
              {{ monthMeta.year }}년 {{ monthMeta.month }}월에 표시할 작업이 없습니다.
            </div>

            <div v-else class="flex min-w-max">
              <!-- 좌측: 작업명 -->
              <div class="sticky left-0 z-10 shrink-0 border-r border-forena-200 bg-white"
                :style="{ width: NAME_COL_W + 'px' }">
                <div class="flex h-10 items-center border-b border-forena-200 bg-white px-4">
                  <span class="text-[11px] font-bold text-forena-500">공정명 / 공종</span>
                </div>
                <div v-for="p in ganttPlans" :key="p.id"
                  class="flex h-[68px] cursor-pointer flex-col justify-center gap-0.5 border-b border-forena-100 px-4 transition hover:bg-forena-50/60"
                  :class="selectedPlan?.id === p.id ? 'bg-flare-50/60' : ''"
                  @click="selectedPlan = p">
                  <div class="flex items-center gap-1.5">
                    <p class="truncate text-sm font-bold text-forena-900">{{ p.name }}</p>
                    <span v-if="extOf(p)" class="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-bold text-emerald-700">
                      <CalendarPlus class="h-2.5 w-2.5" />+{{ extOf(p).addedDays }}일
                    </span>
                  </div>
                  <p class="truncate text-[11px] text-forena-500">{{ p.trade }}{{ p.location ? ` / ${p.location}` : '' }}</p>
                  <p v-if="p.sourceFile" class="truncate text-[10px] text-slate-400">출처 문서: {{ p.sourceFile }}</p>
                </div>
              </div>

              <!-- 우측: 차트 -->
              <div class="relative" :style="{ width: chartWidth + 'px' }">
                <!-- 날짜 헤더 -->
                <div class="sticky top-0 z-[5] flex h-10 border-b border-forena-200 bg-white">
                  <div v-for="d in monthMeta.days" :key="d.date"
                    class="flex items-center justify-center border-r border-forena-100 text-[11px] font-semibold tabular-nums"
                    :style="{ width: GANTT_DAY_W + 'px' }"
                    :class="d.isToday ? 'bg-flare-50 text-flare-700'
                          : d.isWeekend ? 'text-slate-300'
                          : 'text-forena-500'">
                    {{ d.day }}
                  </div>
                </div>

                <!-- 차트 본문 -->
                <div class="relative">
                  <div v-if="todayLineStyle"
                    class="pointer-events-none absolute top-0 z-[3] h-full w-px bg-flare-400/60"
                    :style="todayLineStyle"></div>

                  <!-- 작업 행들 -->
                  <div v-for="p in ganttPlans" :key="p.id"
                    class="relative flex h-[68px] border-b border-forena-100"
                    :class="selectedPlan?.id === p.id ? 'bg-flare-50/40' : ''">
                    <!-- 셀 그리드 -->
                    <div v-for="d in monthMeta.days" :key="d.date"
                      class="border-r border-forena-50"
                      :style="{ width: GANTT_DAY_W + 'px' }"
                      :class="d.isWeekend ? 'bg-slate-50/40' : ''"></div>

                    <!-- 계획 라인 (파란색, 월간 작업계획서 기준) -->
                    <div v-if="barStyle(p.start, p.end)"
                      class="group absolute z-[2] flex cursor-pointer items-center"
                      :style="{ ...barStyle(p.start, p.end), top: '20px', height: '4px' }"
                      :title="`계획서 기준: ${p.start} ~ ${p.end}`"
                      @click="selectedPlan = p">
                      <span class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white"></span>
                      <span class="absolute -right-[3px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white"></span>
                      <span class="h-1 w-full rounded-full bg-blue-500 transition group-hover:h-1.5"></span>
                    </div>

                    <!-- 실제/예상 진행 라인: 연장 시 빨간 예상선이 연장 종료일까지 이어짐 -->
                    <div v-if="barStyle(actualLineRange(p).start, actualLineRange(p).end)"
                      class="absolute z-[1] flex cursor-pointer items-center"
                      :style="{ ...barStyle(actualLineRange(p).start, actualLineRange(p).end), top: '40px', height: '4px' }"
                      :title="`실제/예상 진행: ${actualLineRange(p).start} ~ ${actualLineRange(p).end}`"
                      @click="selectedPlan = p">
                      <span class="h-1 w-full rounded-full bg-red-200"></span>
                    </div>
                    <div v-if="progressFillEnd(p) && barStyle(actualLineRange(p).start, progressFillEnd(p))"
                      class="group absolute z-[2] flex cursor-pointer items-center"
                      :style="{ ...barStyle(actualLineRange(p).start, progressFillEnd(p)), top: '40px', height: '4px' }"
                      @click="selectedPlan = p">
                      <span class="absolute -left-[3px] h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                      <span class="absolute -right-[3px] h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                      <span class="h-1 w-full rounded-full bg-red-500 transition group-hover:h-1.5"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- 연간/월간 업로드 검증 모달                                    -->
    <!-- 업로드된 계획서가 간트차트에 정확히 반영되었는지 확인 후 적용  -->
    <!-- ========================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="showVerifyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="cancelVerify">
        <div class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <!-- 헤더 -->
          <div class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50">
                <FileCheck2 class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">{{ verifyCategory }} 계획서 반영 확인</p>
                <p class="mt-0.5 text-xs text-forena-500">
                  <span class="font-semibold text-forena-700">{{ verifyFileName }}</span> 에서 추출한 작업이
                  간트차트에 정확히 반영되었는지 확인해주세요.
                </p>
              </div>
            </div>
            <button @click="cancelVerify" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- 요약 통계 -->
          <div class="grid shrink-0 grid-cols-4 gap-3 border-b border-forena-100 bg-forena-50/40 px-6 py-3">
            <div class="rounded-lg bg-white px-3 py-2 ring-1 ring-forena-100">
              <p class="text-[10px] font-bold uppercase tracking-wide text-forena-400">전체</p>
              <p class="mt-0.5 text-xl font-bold tabular-nums text-forena-900">{{ verifyStats.total }}</p>
            </div>
            <div class="rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
              <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-600">정상</p>
              <p class="mt-0.5 text-xl font-bold tabular-nums text-emerald-700">{{ verifyStats.ok }}</p>
            </div>
            <div class="rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
              <p class="text-[10px] font-bold uppercase tracking-wide text-amber-600">경고</p>
              <p class="mt-0.5 text-xl font-bold tabular-nums text-amber-700">{{ verifyStats.warnings }}</p>
            </div>
            <div class="rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-rose-100">
              <p class="text-[10px] font-bold uppercase tracking-wide text-rose-600">오류</p>
              <p class="mt-0.5 text-xl font-bold tabular-nums text-rose-700">{{ verifyStats.errors }}</p>
            </div>
          </div>

          <!-- 파싱된 작업 목록 (간트차트 미리보기 + 행별 상세) -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p class="mb-2 text-[11px] font-bold uppercase tracking-wide text-forena-400">파싱된 작업 ({{ verifyRows.length }}건)</p>
            <div class="overflow-hidden rounded-lg border border-forena-100">
              <table class="w-full text-xs">
                <thead class="bg-forena-50/60 text-forena-500">
                  <tr>
                    <th class="px-3 py-2 text-left font-bold">상태</th>
                    <th class="px-3 py-2 text-left font-bold">공정명</th>
                    <th class="px-3 py-2 text-left font-bold">공종</th>
                    <th class="px-3 py-2 text-left font-bold">위치</th>
                    <th class="px-3 py-2 text-left font-bold tabular-nums">시작일</th>
                    <th class="px-3 py-2 text-left font-bold tabular-nums">종료일</th>
                    <th class="px-3 py-2 text-right font-bold">처리</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-forena-100 bg-white">
                  <tr v-for="row in verifyRows" :key="row.id"
                    :class="row.issue === 'error' ? 'bg-rose-50/40' : row.issue === 'warning' ? 'bg-amber-50/40' : ''">
                    <td class="px-3 py-2">
                      <span v-if="row.issue === 'error'" class="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        <AlertTriangle class="h-3 w-3" /> 오류
                      </span>
                      <span v-else-if="row.issue === 'warning'" class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        <AlertTriangle class="h-3 w-3" /> 경고
                      </span>
                      <span v-else class="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 class="h-3 w-3" /> 정상
                      </span>
                    </td>
                    <td class="px-3 py-2 font-semibold text-forena-900">
                      <input v-model="row.name" class="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-forena-200 focus:border-flare-400 focus:bg-white focus:outline-none" />
                    </td>
                    <td class="px-3 py-2 text-forena-600">
                      <input v-model="row.trade" class="w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-forena-200 focus:border-flare-400 focus:bg-white focus:outline-none" />
                    </td>
                    <td class="px-3 py-2 text-forena-600">
                      <input v-model="row.location" class="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-forena-200 focus:border-flare-400 focus:bg-white focus:outline-none" />
                    </td>
                    <td class="px-3 py-2 tabular-nums">
                      <input type="date" v-model="row.start"
                        class="rounded border px-1 py-0.5 text-[11px]"
                        :class="!row.start ? 'border-rose-300 bg-rose-50' : 'border-forena-200'" />
                    </td>
                    <td class="px-3 py-2 tabular-nums">
                      <input type="date" v-model="row.end"
                        class="rounded border px-1 py-0.5 text-[11px]"
                        :class="!row.end ? 'border-rose-300 bg-rose-50' : 'border-forena-200'" />
                    </td>
                    <td class="px-3 py-2 text-right">
                      <button v-if="row.issue" @click="fixVerifyRow(row)"
                        class="rounded-md bg-flare-50 px-2 py-1 text-[10px] font-bold text-flare-700 ring-1 ring-flare-200 hover:bg-flare-100">
                        자동 수정
                      </button>
                      <button @click="removeVerifyRow(row)"
                        class="ml-1 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p v-if="verifyStats.errors > 0" class="mt-3 flex items-center gap-1.5 text-[11px] text-rose-600">
              <AlertTriangle class="h-3.5 w-3.5" />
              오류 {{ verifyStats.errors }}건이 있습니다. 자동 수정 또는 직접 수정 후 반영해주세요.
            </p>
          </div>

          <!-- 푸터 -->
          <div class="flex shrink-0 items-center justify-end gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3">
            <button @click="cancelVerify"
              class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50">
              취소
            </button>
            <button @click="confirmVerifyAndApply"
              :disabled="verifyStats.errors > 0"
              class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600 disabled:cursor-not-allowed disabled:bg-slate-300">
              <CheckCircle2 class="h-3.5 w-3.5" />
              간트차트에 반영
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ========================================================== -->
    <!-- 주간 계획서 작성 모달 (협력사 / 공정 담당자 입력)             -->
    <!-- 일자별: 공정명·작업구역·인력·장비 (필수)                      -->
    <!-- ========================================================== -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="showWeeklyForm && weeklyForm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        @click.self="cancelWeeklyForm">
        <div class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <!-- 헤더 -->
          <div class="flex shrink-0 items-start justify-between border-b border-forena-100 px-6 py-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flare-50">
                <ClipboardList class="h-5 w-5 text-flare-600" />
              </div>
              <div>
                <p class="text-base font-bold text-forena-900">주간 계획서 작성</p>
                <p class="mt-0.5 text-xs text-forena-500">
                  협력사 담당자가 직접 작성합니다. 일자별 <span class="font-bold text-flare-700">공정명·작업구역·인력·장비</span>는 모두 필수입니다.
                </p>
              </div>
            </div>
            <button @click="cancelWeeklyForm" class="text-slate-400 hover:text-forena-700">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- 협력사 정보 -->
          <div class="grid shrink-0 grid-cols-1 gap-3 border-b border-forena-100 bg-forena-50/40 px-6 py-4 sm:grid-cols-4">
            <div>
              <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">협력사 <span class="text-rose-500">*</span></label>
              <input v-model="weeklyForm.partner" placeholder="예: (주)대우전기"
                class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
            </div>
            <div>
              <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">담당자 <span class="text-rose-500">*</span></label>
              <input v-model="weeklyForm.manager" placeholder="예: 김현수 반장"
                class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
            </div>
            <div>
              <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">연락처</label>
              <input v-model="weeklyForm.contact" placeholder="010-0000-0000"
                class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
            </div>
            <div>
              <label class="mb-1 block text-[10px] font-bold uppercase tracking-wide text-forena-500">주 시작일(일)</label>
              <input type="date" v-model="weeklyForm.weekStart"
                class="w-full rounded-md border border-forena-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-flare-400" />
            </div>
          </div>

          <!-- 일자별 작업 입력 -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-[11px] font-bold uppercase tracking-wide text-forena-400">
                일자별 작업 ({{ weeklyForm.items.length }}건)
              </p>
              <button @click="addWeeklyItem"
                class="inline-flex items-center gap-1 rounded-md border border-flare-200 bg-flare-50 px-2.5 py-1 text-[11px] font-bold text-flare-700 hover:bg-flare-100">
                <Plus class="h-3 w-3" /> 작업 추가
              </button>
            </div>

            <div class="space-y-3">
              <div v-for="(item, idx) in weeklyForm.items" :key="item.id"
                class="rounded-xl border border-forena-100 bg-white p-3.5">
                <div class="mb-2.5 flex items-center justify-between">
                  <span class="rounded-md bg-forena-50 px-2 py-0.5 text-[10px] font-bold text-forena-600">#{{ idx + 1 }}</span>
                  <button v-if="weeklyForm.items.length > 1" @click="removeWeeklyItem(idx)"
                    class="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
                <div class="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label class="mb-1 block text-[10px] font-bold text-forena-500">작업일자 <span class="text-rose-500">*</span></label>
                    <input type="date" v-model="item.date"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400" />
                  </div>
                  <div class="lg:col-span-2">
                    <label class="mb-1 block text-[10px] font-bold text-forena-500">공정명 <span class="text-rose-500">*</span></label>
                    <input v-model="item.processName" placeholder="예: B2층 전기 배관 설치"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400" />
                  </div>
                  <div class="lg:col-span-2">
                    <label class="mb-1 block text-[10px] font-bold text-forena-500">작업구역 <span class="text-rose-500">*</span></label>
                    <input v-model="item.zone" placeholder="예: B2층 전기실"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400" />
                  </div>
                  <div class="lg:col-span-2">
                    <label class="mb-1 block text-[10px] font-bold text-forena-500">
                      <Users class="mr-0.5 inline h-3 w-3" />인력 <span class="text-rose-500">*</span>
                    </label>
                    <input v-model="item.workers" placeholder="예: 전공 4명, 보통공 2명"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400" />
                  </div>
                  <div class="lg:col-span-3">
                    <label class="mb-1 block text-[10px] font-bold text-forena-500">
                      <Wrench class="mr-0.5 inline h-3 w-3" />장비 <span class="text-rose-500">*</span>
                    </label>
                    <input v-model="item.equipment" placeholder="예: 고소작업대 1대, 전동드릴 4대"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400" />
                  </div>
                  <div class="lg:col-span-5">
                    <label class="mb-1 block text-[10px] font-bold text-forena-500">비고</label>
                    <input v-model="item.note" placeholder="안전 유의사항, 선·후행 공정과의 협의사항 등"
                      class="w-full rounded-md border border-forena-200 px-2 py-1.5 text-xs outline-none focus:border-flare-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 푸터 -->
          <div class="flex shrink-0 items-center justify-between gap-2 border-t border-forena-100 bg-forena-50/40 px-6 py-3">
            <p class="text-[11px] text-forena-500">
              <span v-if="!weeklyFormValid" class="text-rose-600">
                <AlertTriangle class="mr-0.5 inline h-3 w-3" />
                협력사·담당자 및 모든 작업의 필수 항목을 입력해주세요.
              </span>
              <span v-else class="text-emerald-700">
                <CheckCircle2 class="mr-0.5 inline h-3 w-3" />
                제출 준비가 완료되었습니다.
              </span>
            </p>
            <div class="flex gap-2">
              <button @click="cancelWeeklyForm"
                class="rounded-lg border border-forena-200 bg-white px-4 py-2 text-xs font-semibold text-forena-700 hover:bg-forena-50">
                취소
              </button>
              <button @click="submitWeeklyForm" :disabled="!weeklyFormValid"
                class="inline-flex items-center gap-1.5 rounded-lg bg-flare-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-flare-600 disabled:cursor-not-allowed disabled:bg-slate-300">
                <Save class="h-3.5 w-3.5" />
                계획서 제출
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>